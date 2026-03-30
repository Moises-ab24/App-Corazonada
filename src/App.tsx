import { useState } from 'react';
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

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
      <Heart size={48} color="#6B4EFF" fill="#6B4EFF" />
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
          {isConnected
            ? <Wifi size={18} color="#22C55E" />
            : <WifiOff size={18} color="#EF4444" />}
          <button onClick={() => {
            localStorage.removeItem('nuevoPedidoDraft');
            (window as any).__nuevoPedidoDraft = {};
            setNuevoPedidoDraft({});
            logout();
          }} style={{ background: 'none' }}>
            <LogOut size={18} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {tab === 'nuevo' && (
          <NuevoPedidoPage
            onGoToProductos={() => setSubPage('productos')}
            onGoToSecciones={() => setSubPage('secciones')}
            onSaveDraft={(draft: Record<string, any>) => setNuevoPedidoDraft(draft)}
            draft={nuevoPedidoDraft}
          />
        )}
        {tab === 'pedidos' && <PedidosPage />}
        {tab === 'estadisticas' && <EstadisticasPage />}
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
            onClick={() => {
              if (t.id !== 'nuevo') {
                const draft = (window as any).__nuevoPedidoDraft;
                if (draft) setNuevoPedidoDraft(draft);
              }
              setTab(t.id);
            }}
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
