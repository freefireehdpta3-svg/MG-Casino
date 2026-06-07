const { spawn } = require('child_process');

console.log("=== INICIANDO DESPLIEGUE EN VERCEL ===");
console.log("Esto abrirá una ventana de inicio de sesión de Vercel en tu navegador.\n");

const vercelDeploy = spawn('npx.cmd', ['-y', 'vercel', '--yes', '--cwd', './client'], { stdio: 'inherit', shell: true });

vercelDeploy.on('close', (code) => {
  console.log(`\nProceso finalizado con código: ${code}`);
});
