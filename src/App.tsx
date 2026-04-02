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

  // Scroll positions por tab
  const scrollPositions = useRef<Record<string, number>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTabChange = (newTab: Tab) => {
    // Guardar scroll actual
    if (scrollRefs.current[tab]) {
      scrollPositions.current[tab] = scrollRefs.current[tab]!.scrollTop;
    }
    // Guardar draft si salimos de nuevo
    if (tab !== 'nuevo') {
      const draft = (window as any).__nuevoPedidoDraft;
      if (draft) setNuevoPedidoDraft(draft);
    }
    setTab(newTab);
  };

  // Restaurar scroll al cambiar tab
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
      <ProductosPage onBack={() => setSubPage(null)} />
    </div>
  );

  if (subPage === 'secciones') return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <SeccionesPage onBack={() => setSubPage(null)} />
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
          <button onClick={() => setConfirmLogout(true)} style={{ background: 'none', display: 'flex', alignItems: 'center', padding: 0 }}>
            <LogOut size={18} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div
          ref={el => scrollRefs.current['nuevo'] = el}
          style={{ height: '100%', overflowY: 'auto', display: tab === 'nuevo' ? 'block' : 'none' }}
        >
          <NuevoPedidoPage
            onGoToProductos={() => setSubPage('productos')}
            onGoToSecciones={() => setSubPage('secciones')}
            onSaveDraft={(draft: Record<string, any>) => setNuevoPedidoDraft(draft)}
            draft={nuevoPedidoDraft}
          />
        </div>
        <div
          ref={el => scrollRefs.current['pedidos'] = el}
          style={{ height: '100%', display: tab === 'pedidos' ? 'flex' : 'none', flexDirection: 'column' }}
        >
          <PedidosPage />
        </div>
        <div
          ref={el => scrollRefs.current['estadisticas'] = el}
          style={{ height: '100%', overflowY: 'auto', display: tab === 'estadisticas' ? 'block' : 'none' }}
        >
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
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            style={{
              flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', background: 'none', cursor: 'pointer',
            }}
          >
            <t.icon size={22} color={tab === t.id ? '#6B4EFF' : '#6B7280'} />
            <span style={{ fontSize: '11px', color: tab === t.id ? '#6B4EFF' : '#6B7280', fontWeight: tab === t.id ? '600' : '400' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Modal logout */}
      {confirmLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <LogOut size={22} color="#EF4444" />
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Cerrar Sesión</h3>
            </div>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>¿Seguro que quieres cerrar sesión?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmLogout(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => {
                localStorage.removeItem('nuevoPedidoDraft');
                (window as any).__nuevoPedidoDraft = {};
                setNuevoPedidoDraft({});
                setConfirmLogout(false);
                logout();
              }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
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