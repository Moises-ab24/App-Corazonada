import { useState, useMemo } from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';
import { usePedidos } from '../contexts/PedidosContext';
import { useSecciones } from '../contexts/SeccionesContext';
import { useProductos } from '../contexts/ProductosContext';
import { ESTADOS_PEDIDO } from '../types';
import type { Pedido, EstadoPedido } from '../types';

function fmt(n: number) { return `₡${n.toLocaleString('es-CR')}`; }
function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#F59E0B', pagado: '#22C55E', entregado: '#6B4EFF',
};

function sortSecciones(a: string, b: string): number {
  const parse = (s: string) => {
    const [grado, grupo] = s.split('-').map(Number);
    return { grado: grado || 0, grupo: grupo || 0 };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.grado !== pb.grado) return pa.grado - pb.grado;
  return pa.grupo - pb.grupo;
}

export default function PedidosPage() {
  const { pedidos, isLoading, cambiarEstado, eliminarPedido } = usePedidos();
  const { secciones } = useSecciones();
  const { productos } = useProductos();
  const [confirmEstado, setConfirmEstado] = useState<{ pedido: Pedido; estado: typeof ESTADOS_PEDIDO[0] } | null>(null);
  const [filtroSeccion, setFiltroSeccion] = useState<string | null>(null);
  const [filtroSeccionDest, setFiltroSeccionDest] = useState<string | null>(null);
  const [filtrosEstado, setFiltrosEstado] = useState<Set<EstadoPedido>>(new Set());
  const [filtrosProducto, setFiltrosProducto] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Pedido | null>(null);

  const seccionesOrdenadas = useMemo(() =>
    [...secciones].sort((a, b) => sortSecciones(a.nombre, b.nombre)),
    [secciones]
  );

  const filtrados = useMemo(() => pedidos.filter(p => {
    const mb = !busqueda || p.nombreComprador.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.destinatario.toLowerCase().includes(busqueda.toLowerCase());
    const matchSeccion = !filtroSeccion || p.seccion === filtroSeccion;
    const matchSeccionDest = !filtroSeccionDest || p.seccionDestinatario === filtroSeccionDest;
    const matchEstado = filtrosEstado.size === 0 || filtrosEstado.has(p.estado);
    const matchProducto = filtrosProducto.size === 0 || p.productos.some(pr =>
      filtrosProducto.has(pr.nombre.toLowerCase())
    );
    return mb && matchSeccion && matchSeccionDest && matchEstado && matchProducto;
  }), [pedidos, busqueda, filtroSeccion, filtroSeccionDest, filtrosEstado, filtrosProducto]);

  const toggleSeccion = (nombre: string) => setFiltroSeccion(prev => prev === nombre ? null : nombre);
  const toggleSeccionDest = (nombre: string) => setFiltroSeccionDest(prev => prev === nombre ? null : nombre);
  const toggleEstado = (id: EstadoPedido) => {
    setFiltrosEstado(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleProducto = (nombre: string) => {
    const key = nombre.toLowerCase();
    setFiltrosProducto(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: '#9CA3AF' }}>Cargando pedidos...</p>
    </div>
  );

  const filtrosActivos =
    (filtroSeccion ? 1 : 0) +
    (filtroSeccionDest ? 1 : 0) +
    filtrosEstado.size +
    filtrosProducto.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px 8px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>Pedidos</h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>{filtrados.length} pedidos</p>
      </div>

      <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1F2937', borderRadius: '12px', padding: '0 12px', height: '40px' }}>
          <Search size={20} color="#9CA3AF" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: '16px' }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowFiltros(!showFiltros)} style={{ background: 'none', display: 'flex' }}>
              <Filter size={20} color={showFiltros || filtrosActivos > 0 ? '#6B4EFF' : '#9CA3AF'} />
            </button>
            {filtrosActivos > 0 && (
              <div style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#6B4EFF', borderRadius: '50%',
                width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>{filtrosActivos}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFiltros && (
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>

          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Sección del comprador:</p>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button style={chipStyle(!filtroSeccion)} onClick={() => setFiltroSeccion(null)}>Todas</button>
            {seccionesOrdenadas.map(s => (
              <button key={s.id} style={chipStyle(filtroSeccion === s.nombre)}
                onClick={() => toggleSeccion(s.nombre)}>{s.nombre}</button>
            ))}
          </div>

          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Sección del destinatario:</p>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button style={chipStyle(!filtroSeccionDest)} onClick={() => setFiltroSeccionDest(null)}>Todas</button>
            {seccionesOrdenadas.map(s => (
              <button key={s.id} style={chipStyle(filtroSeccionDest === s.nombre)}
                onClick={() => toggleSeccionDest(s.nombre)}>{s.nombre}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>Estado:</p>
            {filtrosEstado.size > 0 && (
              <button onClick={() => setFiltrosEstado(new Set())}
                style={{ color: '#6B4EFF', fontSize: '11px', background: 'none', cursor: 'pointer' }}>
                Limpiar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {ESTADOS_PEDIDO.map(e => (
              <button key={e.id} style={chipStyleMulti(filtrosEstado.has(e.id), e.color)}
                onClick={() => toggleEstado(e.id)}>{e.nombre}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>Producto:</p>
            {filtrosProducto.size > 0 && (
              <button onClick={() => setFiltrosProducto(new Set())}
                style={{ color: '#6B4EFF', fontSize: '11px', background: 'none', cursor: 'pointer' }}>
                Limpiar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {productos.filter(p => p.activo).map(p => (
              <button key={p.id} style={chipStyle(filtrosProducto.has(p.nombre.toLowerCase()))}
                onClick={() => toggleProducto(p.nombre)}>{p.nombre}</button>
            ))}
          </div>

        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>No hay pedidos registrados</p>
          </div>
        ) : filtrados.map(p => (
          <div key={p.id} style={{ background: '#111827', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>{p.nombreComprador}</p>
                <p style={{ color: '#AEABFA', fontSize: '13px', marginTop: '2px' }}>
                  Comprador: {p.seccion}
                  {p.seccionDestinatario && (
                    <span style={{ marginLeft: '8px' }}>
                      <span style={{ color: '#fff' }}>⮕</span>
                      <span style={{ color: '#6A66DF' }}> Entrega: {p.seccionDestinatario}</span>
                    </span>
                  )}
                </p>
              </div>
              <div style={{ background: STATUS_COLORS[p.estado] + '20', padding: '4px 10px', borderRadius: '12px' }}>
                <span style={{ color: STATUS_COLORS[p.estado], fontSize: '12px', fontWeight: '600' }}>
                  {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1F2937', paddingTop: '12px' }}>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Para:</p>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>{p.destinatario}</p>

              {p.descripcion && <>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Mensaje:</p>
                <p style={{ color: '#D1D5DB', fontSize: '14px', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{p.descripcion}</p>
              </>}

              {p.notasInternas && <>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>📋 Notas del pedido:</p>
                <p style={{ color: '#D1D5DB', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{p.notasInternas}</p>
              </>}

              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Productos:</p>
              {p.productos.map((pr, i) => (
                <p key={i} style={{ color: '#D1D5DB', fontSize: '14px', marginTop: '2px' }}>
                  {pr.cantidad}x {pr.nombre} - {fmt(pr.subtotal)}
                </p>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #1F2937' }}>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Total:</span>
                <span style={{ color: '#AEABFA', fontSize: '18px', fontWeight: '700' }}>{fmt(p.total)}</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '8px' }}>
                {p.actualizadoEn && p.actualizadoEn !== p.creadoEn
                  ? `Actualizado: ${fmtFecha(p.actualizadoEn)}`
                  : fmtFecha(p.creadoEn || p.fecha)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {ESTADOS_PEDIDO.map(e => (
                <button key={e.id} onClick={() => p.estado !== e.id && setConfirmEstado({ pedido: p, estado: e })}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: '8px',
                    background: p.estado === e.id ? e.color + '40' : e.color + '15',
                    color: p.estado === e.id ? '#fff' : '#D1D5DB',
                    fontSize: '12px', fontWeight: p.estado === e.id ? '700' : '500',
                    cursor: 'pointer',
                    border: p.estado === e.id ? `1px solid ${e.color}` : '1px solid transparent',
                  }}>
                  {e.nombre}
                </button>
              ))}
              <button onClick={() => setConfirmDelete(p)}
                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', cursor: 'pointer' }}>
                <Trash2 size={18} color="#EF4444" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Eliminar Pedido</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
              ¿Eliminar el pedido de <strong style={{ color: '#fff' }}>{confirmDelete.nombreComprador}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={async () => { await eliminarPedido(confirmDelete.id); setConfirmDelete(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEstado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', border: '1px solid #1F2937' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Cambiar Estado</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
              ¿Cambiar el pedido de <strong style={{ color: '#fff' }}>{confirmEstado.pedido.nombreComprador}</strong> a{' '}
              <strong style={{ color: confirmEstado.estado.color }}>{confirmEstado.estado.nombre}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmEstado(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={async () => { await cambiarEstado(confirmEstado.pedido.id, confirmEstado.estado.id); setConfirmEstado(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: confirmEstado.estado.color, color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: '16px', whiteSpace: 'nowrap',
    background: active ? '#6B4EFF' : '#1F2937',
    color: active ? '#fff' : '#D1D5DB', fontSize: '13px',
    fontWeight: active ? '600' : '400', cursor: 'pointer', flexShrink: 0,
  };
}

function chipStyleMulti(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: '16px', whiteSpace: 'nowrap',
    background: active ? color + '30' : '#1F2937',
    color: active ? color : '#D1D5DB', fontSize: '13px',
    fontWeight: active ? '700' : '400', cursor: 'pointer', flexShrink: 0,
    border: active ? `1px solid ${color}` : '1px solid transparent',
  };
}