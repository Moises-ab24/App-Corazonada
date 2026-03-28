import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useSecciones } from '../contexts/SeccionesContext';
import type { Seccion } from '../types';

export default function SeccionesPage({ onBack }: { onBack: () => void }) {
  const { secciones, seccionesActivas, isLoading, error, agregarSeccion, editarSeccion, eliminarSeccion, toggleSeccionActiva } = useSecciones();
  const [nueva, setNueva] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [confirmDel, setConfirmDel] = useState<Seccion | null>(null);

  const ordenadas = useMemo(() => [...secciones].sort((a, b) => {
    const parse = (s: string) => {
      const [grado, grupo] = s.split('-').map(Number);
      return { grado: grado || 0, grupo: grupo || 0 };
    };
    const pa = parse(a.nombre);
    const pb = parse(b.nombre);
    if (pa.grado !== pb.grado) return pa.grado - pb.grado;
    return pa.grupo - pb.grupo;
  }), [secciones]);

  const handleAgregar = async () => {
    if (!nueva.trim()) return;
    const ok = await agregarSeccion(nueva.trim());
    if (ok) setNueva('');
  };

  const handleGuardarEdicion = async () => {
    if (!editId || !editNombre.trim()) return;
    const ok = await editarSeccion(editId, editNombre.trim());
    if (ok) { setEditId(null); setEditNombre(''); }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: '#9CA3AF' }}>Cargando...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', color: '#9CA3AF' }}><ArrowLeft size={24} /></button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>Gestión de Secciones</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{seccionesActivas.length} activas de {secciones.length} totales</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px' }}>
        {/* Agregar */}
        <div style={{ background: '#111827', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Agregar Nueva Sección</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              value={nueva} onChange={e => setNueva(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAgregar()}
              placeholder="Ej: 7-5, 8-A, etc."
              style={{ flex: 1, background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '16px' }}
            />
            <button onClick={handleAgregar} disabled={!nueva.trim()}
              style={{ width: '48px', height: '48px', borderRadius: '12px', background: nueva.trim() ? '#6B4EFF' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: nueva.trim() ? 'pointer' : 'not-allowed' }}>
              <Plus size={20} color="#fff" />
            </button>
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
        </div>

        {/* Lista */}
        <p style={{ color: '#D1D5DB', fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Secciones Configuradas</p>
        {ordenadas.map(s => (
          <div key={s.id} style={{ background: '#111827', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
            {editId === s.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  autoFocus
                  style={{ flex: 1, background: '#1F2937', border: '1px solid #6B4EFF', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '16px' }}
                />
                <button onClick={handleGuardarEdicion} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Check size={18} color="#22C55E" />
                </button>
                <button onClick={() => { setEditId(null); setEditNombre(''); }} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="#EF4444" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: s.activa ? '#fff' : '#6B7280', fontSize: '16px', fontWeight: '600', textDecoration: s.activa ? 'none' : 'line-through' }}>
                    {s.nombre}
                  </span>
                  {!s.activa && <span style={{ background: '#1F2937', color: '#6B7280', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>Inactiva</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { icon: s.activa ? Eye : EyeOff, color: s.activa ? '#22C55E' : '#6B7280', onClick: () => toggleSeccionActiva(s.id) },
                    { icon: Edit2, color: '#AEABFA', onClick: () => { setEditId(s.id); setEditNombre(s.nombre); } },
                    { icon: Trash2, color: '#EF4444', onClick: () => setConfirmDel(s) },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.onClick} style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <btn.icon size={18} color={btn.color} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          <div style={{ background: '#111827', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ color: '#fff', marginBottom: '12px' }}>Eliminar Sección</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>¿Eliminar la sección <strong style={{ color: '#fff' }}>{confirmDel.nombre}</strong>?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={async () => { await eliminarSeccion(confirmDel.id); setConfirmDel(null); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
