import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your new App component (the router)
import './index.css'; // Import global styles

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>

      <App />
  </React.StrictMode>
);