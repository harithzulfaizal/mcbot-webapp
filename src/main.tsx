// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx'; // This App component is now the one with login logic

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* The App component now handles rendering LoginPage or the main app based on auth state */}
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
