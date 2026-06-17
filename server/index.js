import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
// ... (Tus configuraciones de constantes y validaciones se mantienen iguales arriba)

const pool = new Pool({ /* tus configuraciones de BD */ });

// --- LÓGICA DE LOGIN UNIFICADA E INTEGRADA ---
app.post('/api/auth/login', async (req, res) => {
  const { numero_tarjeta, nip } = req.body;
  
  // 1. LÓGICA DE ADMIN (Hardcoded)
  if (numero_tarjeta === "9999999999999999" && nip === "123456") {
    return res.json({ tipo: 'admin', mensaje: 'Acceso administrativo' });
  }

  // 2. LÓGICA DE CLIENTE
  const nipNumerico = parseInt(nip, 10);
  if (!numero_tarjeta || isNaN(nipNumerico)) {
    return res.status(400).json({ error: 'Datos de acceso incompletos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Buscamos tarjeta y unimos con cuenta y el rol del cliente
    const result = await client.query(
      `SELECT t.id_tarjeta, t.numero_tarjeta, t.fecha_expiracion, t.activa, 
              c.numero_cuenta, cc.rol
       FROM tarjeta t
       INNER JOIN cuenta c ON c.id_cuenta = t.id_cuenta
       LEFT JOIN cliente_cuenta cc ON cc.id_cuenta = c.id_cuenta
       WHERE t.numero_tarjeta = $1 AND t.nip = $2
       AND t.activa = TRUE AND t.fecha_expiracion >= CURRENT_DATE`,
      [String(numero_tarjeta), nipNumerico]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Tarjeta o NIP incorrectos o tarjeta inactiva.' });
    }

    const data = result.rows[0];
    const numeroCuenta = data.numero_cuenta;
    const sessionToken = crypto.randomUUID();

    // Limpieza de sesiones expiradas y creación de nueva
    await client.query('DELETE FROM sesion_cuenta WHERE expira_en <= NOW()');
    
    const sessionResult = await client.query(
      `INSERT INTO sesion_cuenta (numero_cuenta, session_token, id_sucursal, region, nodo_origen, nombre_sucursal, expira_en)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7::TEXT || ' minutes')::INTERVAL)
       ON CONFLICT (numero_cuenta) DO UPDATE SET session_token = EXCLUDED.session_token, expira_en = EXCLUDED.expira_en
       RETURNING *`,
      [numeroCuenta, sessionToken, sucursalId, regionBancaria, nodoOrigen, nombreSucursal, sessionTtlMinutes]
    );

    const cuenta = await getCuentaByNumero(client, numeroCuenta);
    await client.query('COMMIT');

    return res.json({ 
      mensaje: 'Inicio de sesión correcto.',
      tipo: data.rol === 'admin' ? 'admin' : 'cliente',
      cuenta, 
      tarjeta: { id_tarjeta: data.id_tarjeta, numero_tarjeta: data.numero_tarjeta }, 
      sesion: sessionResult.rows[0] 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});