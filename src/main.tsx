import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './store/cart';
import { AdminProvider } from './admin/store/AdminProvider';
import { ImagensProvider } from './admin/store/ImagensProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminProvider>
        <ImagensProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ImagensProvider>
      </AdminProvider>
    </BrowserRouter>
  </StrictMode>
);
