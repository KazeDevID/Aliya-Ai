// Gunakan ini untuk menjalankan script di panel pterodactyl
// Setup startup nya jadi node run.js atau run.js
// Dan selebihnya seperti biasa, install module dan jalankan

const { spawn } = require('child_process');

const startBash = () => {
  const bashProcess = spawn('bash', [], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

  bashProcess.on('exit', () => console.log('Informasi Terminal telah Ditutup'));
};

const displaySystemInfo = () => {
  const platform = process.platform;
  const nodeVersion = process.version;
  const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jakarta' });
  const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta' });
  const currentDay = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' });

  console.log(`Sistem Platform: ${platform}`);
  console.log(`Versi Node.js: ${nodeVersion}`);
  console.log(`Tanggal: ${currentDate}`);
  console.log(`Jam: ${currentTime}`);
  console.log(`Hari: ${currentDay}`);
};

console.clear();
console.log('Welcome to Terminal');
startBash();
displaySystemInfo();