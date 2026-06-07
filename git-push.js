const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const gitCmd = '"C:\\Program Files\\Git\\cmd\\git.exe"';

console.log("=== PREPARANDO MG CASINO ONLINE PARA PRODUCCIÓN (GITHUB) ===\n");

// Crear .gitignore principal si no existe para evitar subir archivos pesados o locales
const gitignoreContent = `
node_modules/
client/node_modules/
server/node_modules/
server/database.sqlite
server/public/uploads/comprobante-*
.env.local
.env.development.local
.env.production.local
.DS_Store
dist/
`;

fs.writeFileSync(path.join(__dirname, '.gitignore'), gitignoreContent.trim());
console.log("✅ Archivo .gitignore configurado.");

try {
  console.log("🔄 Inicializando Git local...");
  try {
    execSync(`${gitCmd} init`, { stdio: 'ignore' });
  } catch (e) {}

  console.log("🔄 Agregando archivos a Git...");
  execSync(`${gitCmd} add .`, { stdio: 'ignore' });

  console.log("🔄 Creando commit inicial...");
  try {
    execSync(`${gitCmd} commit -m "mg-casino production ready v1.0"`, { stdio: 'ignore' });
  } catch (e) {
    console.log("ℹ️ Nada nuevo que agregar al commit.");
  }

  rl.question('\n👉 Pega la URL de tu repositorio de GitHub nuevo (ej: https://github.com/tu-usuario/mg-casino.git): ', (repoUrl) => {
    if (!repoUrl) {
      console.log("❌ No ingresaste una URL. Cancelado.");
      rl.close();
      return;
    }

    try {
      console.log(`\n🔗 Vinculando repositorio remoto...`);
      try {
        execSync(`${gitCmd} remote add origin ${repoUrl.trim()}`, { stdio: 'ignore' });
      } catch (e) {
        execSync(`${gitCmd} remote set-url origin ${repoUrl.trim()}`, { stdio: 'ignore' });
      }

      console.log("⬆️ Subiendo código a GitHub (rama main)...");
      execSync(`${gitCmd} branch -M main`, { stdio: 'ignore' });
      execSync(`${gitCmd} push -u origin main`, { stdio: 'inherit' });

      console.log("\n==============================================================");
      console.log("🎉 ¡CÓDIGO SUBIDO A GITHUB CON ÉXITO!");
      console.log("==============================================================");
      console.log("Ahora puedes desplegar gratis y tener una web 100% original:");
      console.log("1. Conecta tu repositorio en Vercel.com (apuntando a /client)");
      console.log("2. Conecta tu repositorio en Render.com (apuntando a /server)");
      console.log("Ambas plataformas te darán dominios reales y sin carteles de advertencia.");
    } catch (err) {
      console.error("\n❌ Error durante el push a GitHub:", err.message);
      console.log("Asegúrate de que el repositorio de GitHub exista y esté vacío.");
    }
    rl.close();
  });

} catch (err) {
  console.error("❌ Error al inicializar Git:", err.message);
  rl.close();
}
