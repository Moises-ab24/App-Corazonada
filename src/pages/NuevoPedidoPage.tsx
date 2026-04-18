import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, Plus, Minus, Check, X, Settings } from 'lucide-react';
import { usePedidos } from '../contexts/PedidosContext';
import { useProductos } from '../contexts/ProductosContext';
import { useSecciones } from '../contexts/SeccionesContext';
import type { PedidoInput } from '../types';

function fmt(n: number) {
  return `₡${n.toLocaleString('es-CR')}`;
}

interface ProductoRow {
  id: string; nombre: string; precioUnitario: number; cantidad: number; subtotal: number;
}

export default function NuevoPedidoPage({ onGoToProductos, onGoToSecciones, onSaveDraft, draft }: {
  onGoToProductos: () => void;
  onGoToSecciones: () => void;
  onSaveDraft?: (draft: Record<string, any>) => void;
  draft?: Record<string, any>;
}) {
  const { crearPedido, error: pedidoError } = usePedidos();
  const { getProductosActivos, productos } = useProductos();
  const { seccionesActivas } = useSecciones();
  const [estadoPedido, setEstadoPedido] = useState<'pagado' | 'pendiente' | 'entregado'>('pagado');
  const [nombreComprador, setNombreComprador] = useState('');
  const [seccion, setSeccion] = useState('');
  const [seccionDestinatario, setSeccionDestinatario] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [mostrarSecciones, setMostrarSecciones] = useState(false);
  const [mostrarSeccionesDestinatario, setMostrarSeccionesDestinatario] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const productosActivos = useMemo(() => getProductosActivos(), [productos]);
  const [rows, setRows] = useState<ProductoRow[]>([]);

  useEffect(() => {
    setRows(productosActivos.map(p => ({
      id: p.id, nombre: p.nombre, precioUnitario: p.precio, cantidad: 0, subtotal: 0
    })));
  }, [productosActivos]);

  useEffect(() => {
    if (draft && Object.keys(draft).length > 0) {
      setNombreComprador(draft.nombreComprador || '');
      setSeccion(draft.seccion || '');
      setSeccionDestinatario(draft.seccionDestinatario || '');
      setDestinatario(draft.destinatario || '');
      setDescripcion(draft.descripcion || '');
      setNotasInternas(draft.notasInternas || '');
      setEstadoPedido(draft.estadoPedido || 'pagado');
      return;
    }
    const guardado = localStorage.getItem('nuevoPedidoDraft');
    if (guardado) {
      const d = JSON.parse(guardado);
      setNombreComprador(d.nombreComprador || '');
      setSeccion(d.seccion || '');
      setSeccionDestinatario(d.seccionDestinatario || '');
      setDestinatario(d.destinatario || '');
      setDescripcion(d.descripcion || '');
      setNotasInternas(d.notasInternas || '');
      setEstadoPedido(d.estadoPedido || 'pagado');
      localStorage.removeItem('nuevoPedidoDraft');
    }
  }, []);

  useEffect(() => {
    (window as any).__nuevoPedidoDraft = {
      nombreComprador, seccion, seccionDestinatario,
      destinatario, descripcion, notasInternas, estadoPedido
    };
  }, [nombreComprador, seccion, seccionDestinatario, destinatario, descripcion, notasInternas, estadoPedido]);

  const total = useMemo(() => rows.reduce((s, r) => s + r.subtotal, 0), [rows]);

  const updateCantidad = useCallback((id: string, delta: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const c = Math.max(0, r.cantidad + delta);
      return { ...r, cantidad: c, subtotal: c * r.precioUnitario };
    }));
  }, []);

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombreComprador.trim() || nombreComprador.trim().length < 3)
      e.nombreComprador = 'El nombre debe tener al menos 3 caracteres';
    if (!seccion) e.seccion = 'Selecciona una sección';
    if (destinatario.trim() && destinatario.trim().length < 3)
      e.destinatario = 'El nombre debe tener al menos 3 caracteres';
    if (!rows.some(r => r.cantidad > 0)) e.productos = 'Selecciona al menos un producto';
    const invalidos = ['anonimo', 'anónimo', 'xxx', 'asd', 'test', 'prueba', 'xd'];
    if (invalidos.includes(nombreComprador.toLowerCase().trim())) e.nombreComprador = 'Ingresa un nombre válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setIsSubmitting(true);
    const input: PedidoInput = {
      nombreComprador: nombreComprador.trim(),
      seccion,
      seccionDestinatario: seccionDestinatario || undefined,
      destinatario: destinatario.trim() || nombreComprador.trim(),
      descripcion: descripcion.trim() || undefined,
      notasInternas: notasInternas.trim() || undefined,
      productos: rows.filter(r => r.cantidad > 0).map(r => ({
        id: r.id, nombre: r.nombre, cantidad: r.cantidad,
        precioUnitario: r.precioUnitario, subtotal: r.subtotal,
      })),
      total, estado: estadoPedido,
    };
    const ok = await crearPedido(input);
    if (ok) {
      setSuccess(`¡Pedido por ${fmt(total)} registrado exitosamente!`);
      limpiar();
      setTimeout(() => setSuccess(''), 3000);
    }
    setIsSubmitting(false);
  };

  const limpiar = () => {
    setNombreComprador(''); setSeccion(''); setSeccionDestinatario('');
    setDestinatario(''); setDescripcion(''); setNotasInternas('');
    setRows(prev => prev.map(r => ({ ...r, cantidad: 0, subtotal: 0 })));
    setErrores({});
    setEstadoPedido('pagado');
  };

  if (productosActivos.length === 0) return (
    <div style={S.empty}>
      <Settings size={48} color="#4B5563" />
      <p style={S.emptyTitle}>No hay productos configurados</p>
      <p style={S.emptyText}>Ve a productos para agregar productos a la venta.</p>
      <button style={S.emptyBtn} onClick={onGoToProductos}>Configurar Productos</button>
    </div>
  );

  if (seccionesActivas.length === 0) return (
    <div style={S.empty}>
      <p style={S.emptyTitle}>No hay secciones configuradas</p>
      <button style={S.emptyBtn} onClick={onGoToSecciones}>Configurar Secciones</button>
    </div>
  );

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: '32px' }}>
      <div style={{ padding: '10px 16px 8px' }}>
        <h1 style={S.title}>Nuevo Pedido</h1>
        <p style={S.subtitle}>Registra un pedido de Corazonada</p>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Comprador */}
        <div style={S.group}>
          <label style={S.label}>Nombre del comprador</label>
          <input style={{ ...S.input, ...(errores.nombreComprador ? S.inputErr : {}) }}
            placeholder="¿Quién compra?" value={nombreComprador}
            onChange={e => setNombreComprador(e.target.value)} />
          {errores.nombreComprador && <span style={S.err}>{errores.nombreComprador}</span>}
        </div>

        {/* Sección del comprador */}
        <div style={S.group}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Sección del comprador</label>
            <button onClick={() => {
              localStorage.setItem('nuevoPedidoDraft', JSON.stringify({
                nombreComprador, seccion, seccionDestinatario,
                destinatario, descripcion, notasInternas, estadoPedido
              }));
              onGoToSecciones();
            }} style={{ background: 'none', color: '#AEABFA' }}>
              <Settings size={16} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setMostrarSecciones(!mostrarSecciones); setMostrarSeccionesDestinatario(false); }}
              style={{ ...S.input, ...S.select, ...(errores.seccion ? S.inputErr : {}) }}
            >
              <span style={{ color: seccion ? '#fff' : '#6B7280' }}>
                {seccion || 'Selecciona la sección'}
              </span>
              <ChevronDown size={20} color="#9CA3AF" />
            </button>
            {mostrarSecciones && (
              <div style={S.dropdown}>
                {seccionesActivas.map(s => (
                  <button key={s.id} style={S.dropItem}
                    onClick={() => { setSeccion(s.nombre); setMostrarSecciones(false); }}>
                    <span style={{ color: seccion === s.nombre ? '#AEABFA' : '#D1D5DB' }}>{s.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errores.seccion && <span style={S.err}>{errores.seccion}</span>}
        </div>

        {/* Destinatario */}
        <div style={S.group}>
          <label style={S.label}>Para quién es?</label>
          <input style={{ ...S.input, ...(errores.destinatario ? S.inputErr : {}) }}
            placeholder="Nombre del destinatario" value={destinatario}
            onChange={e => setDestinatario(e.target.value)} />
          {errores.destinatario && <span style={S.err}>{errores.destinatario}</span>}
        </div>

        {/* Sección del destinatario - opcional */}
        <div style={S.group}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>
              Sección del destinatario
              <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400', marginLeft: '6px' }}>(opcional)</span>
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setMostrarSeccionesDestinatario(!mostrarSeccionesDestinatario); setMostrarSecciones(false); }}
              style={{ ...S.input, ...S.select }}
            >
              <span style={{ color: seccionDestinatario ? '#fff' : '#6B7280' }}>
                {seccionDestinatario || 'Si se sabe, seleccioná la sección'}
              </span>
              <ChevronDown size={20} color="#9CA3AF" />
            </button>
            {mostrarSeccionesDestinatario && (
              <div style={S.dropdown}>
                {seccionesActivas.map(s => (
                  <button key={s.id} style={S.dropItem}
                    onClick={() => { setSeccionDestinatario(s.nombre); setMostrarSeccionesDestinatario(false); }}>
                    <span style={{ color: seccionDestinatario === s.nombre ? '#AEABFA' : '#D1D5DB' }}>{s.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensaje para el destinatario */}
        <div style={S.group}>
          <label style={S.label}>
            Mensaje
            <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400', marginLeft: '6px' }}>(opcional)</span>
          </label>
          <textarea style={{ ...S.input, height: '80px', resize: 'none', paddingTop: '12px' }}
            placeholder="Un mensaje especial para el destinatario..." value={descripcion}
            onChange={e => setDescripcion(e.target.value)} />
        </div>

        {/* Notas internas */}
        <div style={S.group}>
          <label style={S.label}>
            Notas del pedido
            <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400', marginLeft: '6px' }}>(opcional)</span>
          </label>
          <textarea style={{ ...S.input, height: '80px', resize: 'none', paddingTop: '12px' }}
            placeholder="Ej: pagó con SINPE o efectivo, canción si compró serenata..." value={notasInternas}
            onChange={e => setNotasInternas(e.target.value)} />
        </div>

        {/* Estado del pedido */}
        <div style={S.group}>
          <label style={S.label}>Estado del pedido</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEstadoPedido('pagado')} style={{
              flex: 1, padding: '10px 2px', borderRadius: '12px', cursor: 'pointer',
              background: estadoPedido === 'pagado' ? 'rgba(34,197,94,0.15)' : '#111827',
              border: estadoPedido === 'pagado' ? '1px solid #22C55E' : '1px solid #1F2937',
              color: estadoPedido === 'pagado' ? '#22C55E' : '#9CA3AF',
              fontWeight: estadoPedido === 'pagado' ? '600' : '400', fontSize: '13px',
            }}>💰 Pagado</button>
            <button onClick={() => setEstadoPedido('pendiente')} style={{
              flex: 1, padding: '10px 4px', borderRadius: '12px', cursor: 'pointer',
              background: estadoPedido === 'pendiente' ? 'rgba(245,158,11,0.15)' : '#111827',
              border: estadoPedido === 'pendiente' ? '1px solid #F59E0B' : '1px solid #1F2937',
              color: estadoPedido === 'pendiente' ? '#F59E0B' : '#9CA3AF',
              fontWeight: estadoPedido === 'pendiente' ? '600' : '400', fontSize: '13px',
            }}>⏳ Pendiente</button>
            <button onClick={() => setEstadoPedido('entregado')} style={{
              flex: 1, padding: '10px 5px', borderRadius: '12px', cursor: 'pointer',
              background: estadoPedido === 'entregado' ? 'rgba(107,78,255,0.15)' : '#111827',
              border: estadoPedido === 'entregado' ? '1px solid #6B4EFF' : '1px solid #1F2937',
              color: estadoPedido === 'entregado' ? '#6B4EFF' : '#9CA3AF',
              fontWeight: estadoPedido === 'entregado' ? '600' : '400', fontSize: '13px',
            }}>📦 Entregado</button>
          </div>
        </div>

        {/* Productos */}
        <div style={S.group}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Productos</label>
            <button onClick={() => {
              localStorage.setItem('nuevoPedidoDraft', JSON.stringify({
                nombreComprador, seccion, seccionDestinatario,
                destinatario, descripcion, notasInternas, estadoPedido
              }));
              onGoToProductos();
            }} style={{ background: 'none', color: '#AEABFA' }}>
              <Settings size={16} />
            </button>
          </div>
          {errores.productos && <span style={S.err}>{errores.productos}</span>}
          {rows.map(r => (
            <div key={r.id} style={S.productoRow}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>{r.nombre}</p>
                <p style={{ color: r.cantidad > 0 ? '#AEABFA' : '#9CA3AF', fontSize: '13px', fontWeight: r.cantidad > 0 ? '600' : '400' }}>
                  {r.cantidad > 0 ? fmt(r.subtotal) : fmt(r.precioUnitario)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button style={S.countBtn} onClick={() => updateCantidad(r.id, -1)} disabled={r.cantidad === 0}>
                  <Minus size={16} color={r.cantidad > 0 ? '#fff' : '#4B5563'} />
                </button>
                <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>
                  {r.cantidad}
                </span>
                <button style={{ ...S.countBtn, background: '#374151' }} onClick={() => updateCantidad(r.id, 1)}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={S.totalBox}>
          <span style={{ color: '#D1D5DB', fontSize: '16px' }}>Total:</span>
          <span style={{ color: '#AEABFA', fontSize: '24px', fontWeight: '700' }}>{fmt(total)}</span>
        </div>

        {pedidoError && (
          <div style={S.errorBanner}>
            <X size={16} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: '14px' }}>{pedidoError}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button style={S.btnLimpiar} onClick={limpiar} disabled={isSubmitting}>Limpiar</button>
          <button style={{ ...S.btnGuardar, ...(isSubmitting ? { background: '#374151' } : {}) }}
            onClick={handleSubmit} disabled={isSubmitting}>
            <Check size={20} color="#fff" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Pedido'}</span>
          </button>
        </div>
      </div>

      {success && (
        <div style={S.successBanner}>
          <Check size={18} color="#22C55E" />
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', padding: '0 0 0 8px' }}>
            <X size={16} color="#22C55E" />
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  title: { fontSize: '28px', fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginTop: '4px' },
  group: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', color: '#D1D5DB', marginBottom: '8px', fontWeight: '500' },
  input: {
    width: '100%', background: '#111827', borderRadius: '12px',
    border: '1px solid #1F2937', padding: '14px 16px',
    color: '#fff', fontSize: '16px',
  },
  inputErr: { borderColor: '#EF4444' },
  select: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer', textAlign: 'left',
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
    background: '#111827', border: '1px solid #1F2937', borderRadius: '12px',
    maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
  },
  dropItem: {
    display: 'block', width: '100%', background: 'none',
    padding: '10px 16px', textAlign: 'left', cursor: 'pointer',
    borderBottom: '1px solid #1F2937',
  },
  productoRow: {
    display: 'flex', alignItems: 'center',
    background: '#111827', borderRadius: '12px',
    padding: '12px', marginBottom: '8px',
  },
  countBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  totalBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(107,78,255,0.1)', padding: '16px', borderRadius: '12px', marginTop: '8px',
  },
  btnLimpiar: {
    flex: 1, height: '52px', borderRadius: '12px',
    background: '#1F2937', color: '#D1D5DB', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
  },
  btnGuardar: {
    flex: 2, height: '52px', borderRadius: '12px',
    background: '#6B4EFF', color: '#fff', fontSize: '16px', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
  },
  successBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#052e16', padding: '12px 16px',
    borderRadius: '10px', color: '#22C55E', fontSize: '14px',
    position: 'fixed', bottom: '72px', left: '16px', right: '16px',
    zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    border: '1px solid #166534',
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', marginTop: '16px',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: '32px', textAlign: 'center',
  },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#fff', marginTop: '16px' },
  emptyText: { fontSize: '14px', color: '#9CA3AF', marginTop: '8px' },
  emptyBtn: {
    marginTop: '24px', background: '#6B4EFF', color: '#fff',
    padding: '14px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
  },
  err: { color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' },
};