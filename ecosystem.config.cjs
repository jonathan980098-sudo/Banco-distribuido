module.exports = {
  apps: [
    {
      name: "nodo-norte",
      script: "scripts/start-node.js",
      args: "norte",
      interpreter: "node",
      cwd: "C:\\Users\\chuch\\ProyectoBancoDistribuido-main"
    },
    {
      name: "nodo-sur",
      script: "scripts/start-node.js",
      args: "sur",
      interpreter: "node",
      cwd: "C:\\Users\\chuch\\ProyectoBancoDistribuido-main"
    }
  ]
};