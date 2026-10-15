import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/playfair-display/700.css';
import './styles/app.css';
import { App } from './App';

// iOS ignorerer user-scalable=no – bloker knib-zoom direkte, så appen står stille som en rigtig app.
for (const ev of ['gesturestart', 'gesturechange'] as const) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
