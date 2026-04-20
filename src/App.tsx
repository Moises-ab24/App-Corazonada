import { useState, useEffect, useRef } from 'react';
import { Heart, Plus, List, BarChart2, LogOut, Wifi, WifiOff } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductosProvider } from './contexts/ProductosContext';
import { SeccionesProvider } from './contexts/SeccionesContext';
import { PedidosProvider, usePedidos } from './contexts/PedidosContext';
import LoginPage from './pages/LoginPage';
import NuevoPedidoPage from './pages/NuevoPedidoPage';
import PedidosPage from './pages/PedidosPage';
import EstadisticasPage from './pages/EstadisticasPage';
import ProductosPage from './pages/ProductosPage';
import SeccionesPage from './pages/SeccionesPage';

type Tab = 'nuevo' | 'pedidos' | 'estadisticas';
type SubPage = 'productos' | 'secciones' | null;

function MainApp() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { isConnected } = usePedidos();
  const [tab, setTab] = useState<Tab>('nuevo');
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [nuevoPedidoDraft, setNuevoPedidoDraft] = useState<Record<string, any>>({});
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const subPageRef = useRef<SubPage>(null);
  const confirmLogoutRef = useRef(false);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollPositions = useRef<Record<string, number>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      setShowOfflineModal(false);
      setShowOnlineBanner(true);
      setTimeout(() => setShowOnlineBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      offlineTimerRef.current = setTimeout(() => {
        setShowOfflineModal(true);
      }, 2000);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, []);

  useEffect(() => {
    subPageRef.current = subPage;
    if (subPage) {
      window.history.pushState(null, '', window.location.pathname);
    }
  }, [subPage]);

  useEffect(() => {
    confirmLogoutRef.current = confirmLogout;
  }, [confirmLogout]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.pathname);
      if (subPageRef.current) {
        setSubPage(null);
      } else if (confirmLogoutRef.current) {
        setConfirmLogout(false);
      } else {
        setConfirmLogout(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    if (scrollRefs.current[tab]) {
      scrollPositions.current[tab] = scrollRefs.current[tab]!.scrollTop;
    }
    if (tab !== 'nuevo') {
      const draft = (window as any).__nuevoPedidoDraft;
      if (draft) setNuevoPedidoDraft(draft);
    }
    setTab(newTab);
  };

  useEffect(() => {
    const ref = scrollRefs.current[tab];
    if (ref && scrollPositions.current[tab] !== undefined) {
      ref.scrollTop = scrollPositions.current[tab];
    }
  }, [tab]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
      <img src="/image/icon.png" style={{ width: '280px', height: 'auto', objectFit: 'contain' }} />
    </div>
  );

  if (!isAuthenticated) return <LoginPage />;

  if (subPage === 'productos') return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <ProductosPage onBack={() => {
        window.history.pushState(null, '', window.location.pathname);
        setSubPage(null);
      }} />
    </div>
  );

  if (subPage === 'secciones') return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <SeccionesPage onBack={() => {
        window.history.pushState(null, '', window.location.pathname);
        setSubPage(null);
      }} />
    </div>
  );

  return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #111827', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={20} color="#AEABFA" fill="#6B4EFF" />
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Corazonada</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isOnline && isConnected
            ? <Wifi size={18} color="#22C55E" />
            : <WifiOff size={18} color="#EF4444" />}
          <button type="button" onClick={() => setConfirmLogout(true)} style={{ background: 'none', display: 'flex', alignItems: 'center', padding: 0 }}>
            <LogOut size={18} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Modal volvió internet */}
      {showOnlineBanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Wifi size={32} color="#22C55E" />
            </div>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Conexión restaurada</h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
              Ya podés crear y modificar pedidos con normalidad.
            </p>
            <button type="button" onClick={() => setShowOnlineBanner(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div ref={el => scrollRefs.current['nuevo'] = el}
          style={{ height: '100%', overflowY: 'auto', display: tab === 'nuevo' ? 'block' : 'none' }}>
          <NuevoPedidoPage
            onGoToProductos={() => { window.history.pushState(null, '', window.location.pathname); setSubPage('productos'); }}
            onGoToSecciones={() => { window.history.pushState(null, '', window.location.pathname); setSubPage('secciones'); }}
            onSaveDraft={(draft: Record<string, any>) => setNuevoPedidoDraft(draft)}
            draft={nuevoPedidoDraft}
          />
        </div>
        <div ref={el => scrollRefs.current['pedidos'] = el}
          style={{ height: '100%', display: tab === 'pedidos' ? 'flex' : 'none', flexDirection: 'column' }}>
          <PedidosPage />
        </div>
        <div ref={el => scrollRefs.current['estadisticas'] = el}
          style={{ height: '100%', overflowY: 'auto', display: tab === 'estadisticas' ? 'block' : 'none' }}>
          <EstadisticasPage />
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex', borderTop: '1px solid #111827', flexShrink: 0,
        background: '#000', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {([
          { id: 'nuevo', icon: Plus, label: 'Nuevo Pedido' },
          { id: 'pedidos', icon: List, label: 'Pedidos' },
          { id: 'estadisticas', icon: BarChart2, label: 'Estadísticas' },
        ] as { id: Tab; icon: any; label: string }[]).map(t => (
          <button type="button" key={t.id} onClick={() => handleTabChange(t.id)}
            style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', cursor: 'pointer' }}>
            <t.icon size={22} color={tab === t.id ? '#6B4EFF' : '#6B7280'} />
            <span style={{ fontSize: '11px', color: tab === t.id ? '#6B4EFF' : '#6B7280', fontWeight: tab === t.id ? '600' : '400' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Modal sin conexión */}
      {showOfflineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <WifiOff size={32} color="#EF4444" />
            </div>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Sin conexión</h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
              No tenés internet. Conectate para poder crear o modificar pedidos.
            </p>
            <button type="button" onClick={() => setShowOfflineModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal logout */}
      {confirmLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <LogOut size={22} color="#EF4444" />
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Cerrar Sesión</h3>
            </div>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>¿Seguro que querés cerrar sesión?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setConfirmLogout(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="button" onClick={() => {
                localStorage.removeItem('nuevoPedidoDraft');
                (window as any).__nuevoPedidoDraft = {};
                setNuevoPedidoDraft({});
                setConfirmLogout(false);
                logout();
              }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductosProvider>
        <SeccionesProvider>
          <PedidosProvider>
            <MainApp />
          </PedidosProvider>
        </SeccionesProvider>
      </ProductosProvider>
    </AuthProvider>
  );
}