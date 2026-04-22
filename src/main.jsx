// ============================================================
// main.jsx — React App Entry Point
// This is the first file React runs when it starts
// It "mounts" (attaches) our App component to the HTML page
// ============================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // Import our global styles including Tailwind

// Find the <div id="root"> in index.html and render our app inside it
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode helps catch bugs by running some code twice in development
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
