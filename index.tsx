
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Application starting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Application rendered successfully");
} catch (err) {
  console.error("Failed to render application:", err);
  throw err;
}
