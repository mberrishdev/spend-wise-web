import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Auto-reload on new service worker (PWA update)
if (import.meta.env.PROD) {
  // @ts-expect-error: virtual:pwa-register is a Vite PWA virtual module
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        window.location.reload();
      },
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
