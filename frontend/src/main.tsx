import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

/* 1. Importe APENAS este arquivo */
import './styles/globals.css' 

/* 2. Garanta que 'index.css' e 'print.css' NÃO estejam sendo importados */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)