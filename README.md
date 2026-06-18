# Proyecto FLUX – Base de Datos Distribuida Bancaria

Este proyecto simula el funcionamiento de un **cajero automático** conectado a una **base de datos distribuida** en PostgreSQL.  
El objetivo es mostrar cómo la fragmentación y el uso de redes permiten que un sistema bancario sea más escalable, seguro y tolerante a fallos.

---

## 📌 Introducción
En un banco, las operaciones deben ser rápidas y confiables. Una base de datos centralizada puede convertirse en un cuello de botella, mientras que una **BD distribuida** reparte la carga entre nodos y sucursales.  
FLUX busca demostrar cómo un cajero puede operar sobre fragmentos de datos distribuidos y sincronizados en red.

---

## 🎯 Objetivos
- Mostrar la diferencia entre una **BD normal** vs una **BD distribuida**.  
- Simular la fragmentación de datos en un sistema bancario.  
- Implementar consultas y operaciones de cajero automático.
- Tener un rol administrador para gestionar el funcionamiento, el diseño y la seguridad del proyecto Flux. 
- Documentar los retos técnicos enfrentados durante el desarrollo.

---

## 🛠️ Tecnologías
- **Html, Css** (diseño de la pagina web)
- **ReactJS** (Funcionalidad de la pagina web)
- **PostgreSQL** (motor de base de datos)  
- **SQL** (definición de tablas y relaciones)  
- **GitHub** (control de versiones y documentación)  
- **Redes VM** (simulación de nodos distribuidos con maquinas virtuales)

---

## 🌐 Arquitectura de Red
El sistema se diseñó para simular un banco con múltiples sucursales y cajeros automáticos conectados a una **base de datos distribuida**.  
- **Servidor central:** coordina la replicación y sincronización de datos.  
- **Sucursales:** cada una actúa como nodo independiente con fragmentos locales de la BD.  
- **Cajeros automáticos:** acceden a fragmentos locales para operaciones rápidas y consultan el servidor central para validaciones globales.  
- **Comunicación:** se implementó sobre redes TCP/IP, simulando la latencia y posibles fallos de conexión.

---

## ⚠️ Retos y Errores Encontrados

### 1. Configuración de la Red
- **Problema:** Al inicio, los nodos virtuales no lograban comunicarse correctamente debido a errores en la configuración de NAT en VirtualBox.  
- **Solución:** Se ajustaron las interfaces de red a modo “Red NAT” y se verificó la conectividad con comandos básicos (`ping`, `ifconfig`). Esto permitió la comunicación estable entre nodos.

### 2. Fragmentación de Datos
- **Problema:** La primera propuesta de fragmentación vertical separaba atributos críticos (RFC, CURP, NIP) en nodos distintos, lo que generaba lentitud en consultas frecuentes.  
- **Solución:** Se rediseñó la fragmentación, manteniendo atributos esenciales en cada nodo y reservando la fragmentación vertical solo para datos altamente sensibles.

### 3. Sincronización de Transacciones
- **Problema:** Algunas transacciones quedaban pendientes porque el nodo central no respondía a tiempo.  
- **Solución:** Se implementó replicación parcial y caché local en cada sucursal, garantizando que las operaciones se registraran incluso si el servidor central estaba temporalmente fuera de servicio.

### 4. Código SQL
- **Problema:** En las primeras versiones se olvidaron claves foráneas y restricciones de integridad, lo que generaba inconsistencias en las relaciones.  
- **Solución:** Se revisaron los scripts SQL, añadiendo `FOREIGN KEY`, `NOT NULL` y tipos de datos adecuados (`NUMERIC` en lugar de `FLOAT` para saldos).

### 5. Recursos de las Máquinas Virtuales
- **Problema:** Algunas máquinas virtuales se saturaban por falta de memoria y procesadores asignados.  
- **Solución:** Se redistribuyeron los recursos, asignando más memoria a los nodos principales y optimizando el uso de CPU en los nodos secundarios.

---
## Conclusiones 

1. **Comprensión del concepto de distribución:**  
   Se aprendió que una BD distribuida no es solo “repartir datos”, sino diseñar cuidadosamente cómo se fragmentan y replican para mantener coherencia y rendimiento.

2. **Escalabilidad real:**  
   El proyecto mostró que agregar nodos o sucursales es más sencillo en un sistema distribuido, lo que permite crecer sin comprometer la eficiencia.

3. **Tolerancia a fallos:**  
   La replicación y el caché local demostraron que un sistema distribuido puede seguir funcionando incluso si un nodo falla, garantizando continuidad en operaciones críticas.

4. **Optimización de consultas:**  
   Se comprendió que la fragmentación mal diseñada puede ser contraproducente. El aprendizaje clave fue que la distribución debe responder a patrones de uso y consultas frecuentes.

5. **Seguridad y confidencialidad:**  
   La fragmentación vertical aplicada correctamente protege atributos sensibles, reforzando la seguridad de la información bancaria.

6. **Valor del proceso de prueba y error:**  
   Los errores iniciales en red, SQL y fragmentación fueron esenciales para entender la complejidad de un sistema distribuido y la importancia de pruebas exhaustivas.

---

## 👥 Autores
Equipo de desarrollo del proyecto **FLUX** – Base de Datos Distribuida Bancaria
- Vargas Espinoza Braulio **Lider**
- Vergara Chischistz Jonathan Jesus
- Moreno Jimenez Uriel
- Ramos Padron Jesus Emmanuel
---


## Configuracion
Aplicacion bancaria React + Express. El backend sirve el frontend compilado y expone la API REST sobre PostgreSQL usando `pg.Pool`.

Cada nodo debe tener su propio `.env`:

```ini
PUERTO_INTERFAZ=3000
ID_SUCURSAL=1
REGION_BANCARIA="Norte"
ID_NODO="Norte-1"
NOMBRE_SUCURSAL="Sucursal Norte 1"
LOCALIDAD_SUCURSAL="Norte"
DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="tu_password"
DB_NAME="banco_regional"
DB_PORT=5432
DB_SSL=false
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT_MS=5000
SESSION_TTL_MINUTES=30
```

## Base de datos

`Flux.sql` ya esta convertido a PostgreSQL. Para preparar una base nueva:

```sql
CREATE DATABASE banco_regional;
```

Despues conectate a `banco_regional` y ejecuta el contenido de `Flux.sql`.

El esquema esta preparado para operacion distribuida con:

- `global_id UUID` para identificar registros entre nodos.
- `sucursal_id`, `region` y `nodo_origen` para firmar datos por dispositivo.
- `sincronizado` y `version` para procesos posteriores de replicacion/sincronizacion.
- Indices por nodo, sucursal, region y fecha de transaccion.

Para probar el inicio de sesion, debe existir una tarjeta activa ligada a una cuenta:

```sql
INSERT INTO tarjeta (
  id_cuenta,
  numero_tarjeta,
  nip,
  fecha_expiracion,
  sucursal_id,
  region,
  nodo_origen
)
SELECT
  id_cuenta,
  '1234567890123456',
  1234,
  CURRENT_DATE + INTERVAL '2 years',
  id_sucursal,
  region,
  nodo_origen
FROM cuenta
WHERE numero_cuenta = '10001';
```

## API

- `POST /api/cuentas`
  - Body: `{ "numero_cuenta": "10001", "cliente": "Juan Perez", "saldo_inicial": 500, "tipo_cuenta": "debito" }`
  - Tambien acepta `cliente` como objeto con `nombre`, `ap_pat`, `ap_mat` y `direccion`.

- `POST /api/auth/login`
  - Body: `{ "numero_tarjeta": "1234567890123456", "nip": "1234" }`
  - Valida tarjeta activa, NIP y fecha de expiracion.
  - Bloquea la cuenta para que no pueda abrirse desde otro nodo mientras la sesion este activa.

- `POST /api/auth/logout`
  - Libera el bloqueo de sesion de la cuenta.

- `GET /api/estado-db`
  - Confirma la conexion activa con PostgreSQL.

- `GET /api/cuentas/:numero_cuenta`
  - Regresa cuenta, sucursal y clientes ligados.

- `POST /api/transacciones`
  - Body: `{ "numero_cuenta": "10001", "tipo": "deposito", "monto": 100 }`
  - `tipo` puede ser `deposito` o `retiro`.

- `POST /api/transferencias`
  - Body: `{ "cuenta_origen": "10001", "cuenta_destino": "10002", "monto": 100, "concepto": "Pago de renta" }`
  - Valida que existan ambas cuentas y que la cuenta origen tenga saldo suficiente.

- `GET /api/transacciones/:numero_cuenta`
  - Regresa el historial de movimientos de la cuenta.

## Ejecucion

```bash
npm install
npm start
```

## Dos nodos locales

Para simular dos sucursales en la misma maquina, abre dos terminales:

```bash
npm run nodo:norte
```

Norte queda en:

```text
http://localhost:3000
```

En otra terminal:

```bash
npm run nodo:sur
```

Sur queda en:

```text
http://localhost:5173
```

Ambos nodos usan la misma configuracion de PostgreSQL del `.env`, pero cada puerto firma sus inserciones con una identidad distinta:

- `3000`: `ID_SUCURSAL=1`, `REGION_BANCARIA=Norte`, `ID_NODO=Norte-1`
- `5173`: `ID_SUCURSAL=2`, `REGION_BANCARIA=Sur`, `ID_NODO=Sur-2`

Cuando uses `5173` como sucursal Sur, no tengas corriendo `npm run dev`, porque Vite tambien intenta ocupar ese puerto.
