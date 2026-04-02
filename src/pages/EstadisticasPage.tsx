import { useMemo } from 'react';
import { DollarSign, ShoppingBag, Package } from 'lucide-react';
import { usePedidos } from '../contexts/PedidosContext';
import { ESTADOS_PEDIDO } from '../types';

function fmt(n: number) { return `₡${n.toLocaleString('es-CR')}`; }

// Colores para los cards dinámicos, se asignan por índice en ciclo
const CARD_COLORS = ['#22C55E', '#F59E0B', '#3B82F6', '#AEABFA', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6'];

export default function EstadisticasPage() {
  const { pedidos } = usePedidos();

  const stats = useMemo(() => {
    const pedidosPorEstado: Record<string, number> = { pendiente: 0, pagado: 0, entregado: 0 };
    let dineroTotal = 0;
    const productosMap = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();

    pedidos.forEach(p => {
      dineroTotal += p.total || 0;
      if (p.estado && pedidosPorEstado[p.estado] !== undefined) {
        pedidosPorEstado[p.estado]++;
      }
      p.productos?.forEach(prod => {
        const key = (prod.nombre || '').toLowerCase().trim();
        if (!key) return;
        const cantidad = prod.cantidad || 0;
        const ingresos = (prod.precioUnitario || 0) * cantidad;
        const existing = productosMap.get(key);
        if (existing) {
          existing.cantidad += cantidad;
          existing.ingresos += ingresos;
        } else {
          productosMap.set(key, { nombre: prod.nombre, cantidad, ingresos });
        }
      });
    });

    const productosLista = Array.from(productosMap.values()).sort((a, b) => b.ingresos - a.ingresos);

    return { dineroTotal, totalPedidos: pedidos.length, pedidosPorEstado, productosLista };
  }, [pedidos]);

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: '32px' }}>
      <div style={{ padding: '10px 16px 8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>Estadísticas</h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Resumen de la Corazonada</p>
      </div>

      {/* Dinero total */}
      <div style={{
        margin: '8px 16px', background: '#111827', borderRadius: '20px',
        padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '32px',
          background: 'rgba(107,78,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <DollarSign size={32} color="#AEABFA" />
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Dinero Total Recaudado</p>
        <p style={{ color: '#AEABFA', fontSize: '36px', fontWeight: '700', marginTop: '4px' }}>
          {fmt(stats.dineroTotal)}
        </p>
      </div>

      {/* Stat cards dinámicos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '0 16px', gridAutoRows: '1fr', width: '100%', boxSizing: 'border-box' }}>
        {/* Card fijo: Total Pedidos */}
        <div style={{ background: '#111827', borderRadius: '16px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#6B4EFF20', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
          }}>
            <ShoppingBag size={24} color="#6B4EFF" />
          </div>
          <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{stats.totalPedidos}</p>
          <p style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px', lineHeight: '1.3' }}>Total Pedidos</p>
        </div>

        {/* Cards dinámicos por producto real */}
        {stats.productosLista.map((prod, i) => {
          const color = CARD_COLORS[i % CARD_COLORS.length];
          return (
            <div key={prod.nombre} style={{ background: '#111827', borderRadius: '16px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: color + '20', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
              }}>
                <Package size={24} color={color} />
              </div>
              <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{prod.cantidad}</p>
              <p style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px', lineHeight: '1.3' }}>{prod.nombre}</p>
            </div>
          );
        })}

        {/* Si no hay productos aún */}
        {stats.productosLista.length === 0 && (
          <div style={{
            gridColumn: 'span 2', background: '#111827', borderRadius: '16px',
            padding: '16px', textAlign: 'center',
          }}>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>Sin pedidos aún</p>
          </div>
        )}
      </div>

      {/* Pedidos por estado */}
      <div style={{ margin: '16px 16px 0', background: '#111827', borderRadius: '16px', padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Pedidos por Estado
        </p>
        {ESTADOS_PEDIDO.map(e => {
          const count = stats.pedidosPorEstado[e.id] || 0;
          const pct = stats.totalPedidos > 0 ? Math.round((count / stats.totalPedidos) * 100) : 0;
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '90px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: e.color, marginRight: '8px' }} />
                <span style={{ color: '#D1D5DB', fontSize: '13px' }}>{e.nombre}</span>
              </div>
              <div style={{ flex: 1, height: '8px', background: '#1F2937', borderRadius: '4px', margin: '0 12px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: e.color, borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', width: '24px', textAlign: 'right' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Ingresos por producto */}
      <div style={{ margin: '16px 16px 0', background: '#111827', borderRadius: '16px', padding: '16px' }}>
        <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Ingresos por Producto
        </p>
        {stats.productosLista.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
            No hay pedidos aún
          </p>
        ) : (
          stats.productosLista.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: '10px', marginBottom: '10px',
              borderBottom: i < stats.productosLista.length - 1 ? '1px solid #1F2937' : 'none',
            }}>
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{p.nombre}</p>
                <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>{p.cantidad} vendidos</p>
              </div>
              <span style={{ color: '#AEABFA', fontSize: '15px', fontWeight: '600' }}>
                {fmt(p.ingresos)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
