const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("=== INICIANDO MG CASINO ONLINE CON DOMINIO PÚBLICO GRATUITO ===");
console.log("Generando túneles seguros y levantando servidores...\n");

// 1. Iniciar túnel de backend (Puerto 3001) usando 'npx -y localtunnel'
const backendTunnel = spawn('npx.cmd', ['-y', 'localtunnel', '--port', '3001'], { shell: true });

let backendUrl = '';
let started = false;

backendTunnel.stdout.on('data', (data) => {
  const output = data.toString();
  // console.log("[Túnel Backend Log]:", output.trim());
  const match = output.match(/your url is:\s*(https:\/\/[^\s]+)/i);
  if (match && !backendUrl) {
    backendUrl = match[1];
    console.log(`🎉 Dominio del Backend generado: ${backendUrl}`);
    
    // Escribir archivo de variables de entorno para el frontend React
    const envPath = path.join(__dirname, 'client', '.env.development.local');
    fs.writeFileSync(envPath, `VITE_BACKEND_URL=${backendUrl}\n`);
    console.log(`💾 Configuración escrita en client/.env.development.local`);
    
    // Iniciar servidores locales y túnel de frontend
    if (!started) {
      started = true;
      startFrontendAndServers();
    }
  }
});

backendTunnel.stderr.on('data', (data) => {
  const errOutput = data.toString();
  if (errOutput.includes('Error')) {
    console.error("[Túnel Backend Error]:", errOutput.trim());
  }
});

function startFrontendAndServers() {
  console.log("\n🚀 Iniciando Servidor Backend (Puerto 3001)...");
  const backendServer = spawn('npm.cmd', ['run', 'dev', '--prefix', 'server'], { shell: true });
  backendServer.stdout.on('data', (data) => {
    const log = data.toString();
    if (log.includes('running') || log.includes('corriendo')) {
      console.log(`   [Backend] ${log.trim()}`);
    }
  });

  console.log("🚀 Iniciando Servidor Frontend React (Puerto 5173)...");
  const frontendServer = spawn('npm.cmd', ['run', 'dev', '--prefix', 'client'], { shell: true });
  
  console.log("🚀 Generando Dominio para el Casino (Túnel Puerto 5173)...");
  const frontendTunnel = spawn('npx.cmd', ['-y', 'localtunnel', '--port', '5173'], { shell: true });
  
  frontendTunnel.stdout.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/your url is:\s*(https:\/\/[^\s]+)/i);
    if (match) {
      const frontendUrl = match[1];
      console.log(`\n==============================================================`);
      console.log(`✨ ¡MG CASINO ONLINE ESTÁ EN LÍNEA CON DOMINIO GRATUITO!`);
      console.log(`📱 Puedes acceder desde tu celular o compartir este enlace:`);
      console.log(`👉 ${frontendUrl}`);
      console.log(`==============================================================\n`);
      console.log("Presiona Ctrl+C en esta terminal para apagar el servidor y los dominios.");
    }
  });

  frontendTunnel.stderr.on('data', (data) => {
    const errOutput = data.toString();
    if (errOutput.includes('Error')) {
      console.error("[Túnel Frontend Error]:", errOutput.trim());
    }
  });
}
