import { useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useProductos } from '../contexts/ProductosContext';
import type { Producto } from '../types';

function fmt(n: number) { return `₡${n.toLocaleString('es-CR')}`; }

export default function ProductosPage({ onBack }: { onBack: () => void }) {
  const { productos, agregarProducto, actualizarProducto, eliminarProducto, toggleProductoActivo } = useProductos();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState<Producto | null>(null);

  const reset = useCallback(() => {
    setNombre(''); setPrecio(''); setDescripcion(''); setEditing(null); setShowForm(false); setError('');
  }, []);

  const handleGuardar = useCallback(async () => {
    setError('');
    const p = parseInt(precio, 10);
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (isNaN(p) || p <= 0) { setError('El precio debe ser mayor a 0'); return; }
    const data = { nombre: nombre.trim(), precio: p, descripcion: descripcion.trim() || undefined, activo: true };
    const ok = editing ? await actualizarProducto(editing, data) : await agregarProducto(data);
    if (ok) reset();
  }, [nombre, precio, descripcion, editing, agregarProducto, actualizarProducto, reset]);

  const handleEditar = (p: Producto) => {
    setNombre(p.nombre); setPrecio(String(p.precio)); setDescripcion(p.descripcion || '');
    setEditing(p.id); setShowForm(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', color: '#9CA3AF' }}><ArrowLeft size={24} /></button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>Gestión de Productos</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{productos.filter(p => p.activo).length} productos activos</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px' }}>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: '#6B4EFF', color: '#fff', padding: '14px', borderRadius: '12px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px',
          }}>
            <Plus size={20} /><span>Agregar Producto</span>
          </button>
        )}

        {showForm && (
          <div style={{ background: '#111827', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </p>
            {[
              { label: 'Nombre', val: nombre, set: setNombre, placeholder: 'Nombre del producto' },
              { label: 'Precio (₡)', val: precio, set: setPrecio, placeholder: '1500', type: 'number' },
              { label: 'Descripción (opcional)', val: descripcion, set: setDescripcion, placeholder: 'Descripción...' },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '6px' }}>{f.label}</label>
                <input
                  value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} type={f.type || 'text'}
                  style={{ width: '100%', background: '#1F2937', border: 'none', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '15px' }}
                />
              </div>
            ))}
            {error && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={reset} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#1F2937', color: '#9CA3AF', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px' }}>
                <X size={18} /><span>Cancelar</span>
              </button>
              <button onClick={handleGuardar} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#6B4EFF', color: '#fff', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>
                <Check size={18} /><span>{editing ? 'Actualizar' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        )}

        <p style={{ color: '#D1D5DB', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Productos</p>
        {productos.length === 0 ? (
          <p style={{ color: '#6B7280', textAlign: 'center', paddingTop: '40px' }}>No hay productos</p>
        ) : productos.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', background: '#111827',
            borderRadius: '12px', padding: '14px', marginBottom: '10px',
            opacity: p.activo ? 1 : 0.6,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>{p.nombre}</span>
                {!p.activo && <span style={{ background: '#374151', color: '#9CA3AF', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>Inactivo</span>}
              </div>
              <p style={{ color: '#AEABFA', fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>{fmt(p.precio)}</p>
              {p.descripcion && <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>{p.descripcion}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { icon: p.activo ? EyeOff : Eye, color: p.activo ? '#9CA3AF' : '#22C55E', onClick: () => toggleProductoActivo(p.id) },
                { icon: Edit2, color: '#AEABFA', onClick: () => handleEditar(p) },
                { icon: Trash2, color: '#EF4444', onClick: () => setConfirmDel(p) },
              ].map((btn, i) => (
                <button key={i} onClick={btn.onClick} style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <btn.icon size={18} color={btn.color} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ color: '#fff', marginBottom: '12px' }}>Eliminar Producto</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>¿Eliminar "<strong style={{ color: '#fff' }}>{confirmDel.nombre}</strong>"?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={async () => { await eliminarProducto(confirmDel.id); setConfirmDel(null); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
