import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

document.addEventListener('wheel', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'number' && document.activeElement === e.target) {
    e.preventDefault();
  }
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
