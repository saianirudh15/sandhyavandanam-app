const fs = require('fs');
fs.mkdirSync('./assets', { recursive: true });
fs.copyFileSync('./public/pwa-512x512.svg', './assets/icon.svg');
fs.copyFileSync('./public/pwa-512x512.svg', './assets/splash-dark.svg');
fs.copyFileSync('./public/pwa-512x512.svg', './assets/splash.svg');
console.log('done');
