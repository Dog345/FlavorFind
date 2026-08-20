import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SplashPage from './pages/SplashPage';
import MenuPage   from './pages/MenuPage';
import CartPage   from './pages/CartPage';
import OrderPage  from './pages/OrderPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            color: '#f5f5f0',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#f5c842', secondary: '#0a0a0a' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
        }}
      />
      <Routes>
        {/* Entry point — QR code lands here */}
        <Route path="/table/:token"  element={<SplashPage />} />

        {/* Main menu experience */}
        <Route path="/menu"          element={<MenuPage />} />

        {/* Cart review before ordering */}
        <Route path="/cart"          element={<CartPage />} />

        {/* Order placed / tracking */}
        <Route path="/order/:id"     element={<OrderPage />} />

        {/* Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-muted text-sm">
            Scan your table QR code to begin
          </div>
        } />
      </Routes>
    </>
  );
}
