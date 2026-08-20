import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SplashPage from './pages/SplashPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import PayPage from './pages/PayPage';
import GuestLayout from './components/layout/GuestLayout';

const pageTransition = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

function AnimatedPage({ children }) {
  return <motion.div {...pageTransition}>{children}</motion.div>;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/table/:token"
          element={
            <AnimatedPage>
              <SplashPage />
            </AnimatedPage>
          }
        />

        <Route element={<GuestLayout />}>
          <Route
            path="/menu"
            element={
              <AnimatedPage>
                <MenuPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/orders"
            element={
              <AnimatedPage>
                <OrdersPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/pay"
            element={
              <AnimatedPage>
                <PayPage />
              </AnimatedPage>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
