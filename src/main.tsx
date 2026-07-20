import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

try {
  // @ts-ignore
  if (!window.Capacitor?.isNative) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
  }
} catch (e) {
  console.error('Service Worker registration failed:', e);
}

// Global failsafe to remove splash screen if React crashes
window.addEventListener('error', () => {
  const splash = document.getElementById('splash-screen');
  if (splash) splash.remove();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
