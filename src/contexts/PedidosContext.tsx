import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Table } from 'surrealdb';
import { getSurrealDB } from '../surrealdb';
import type { Pedido, PedidoInput, Estadisticas, EstadoPedido } from '../types';

interface PedidosContextType {
  pedidos: Pedido[];
  isLoading: boolean;
  error: string | null;
  crearPedido: (p: PedidoInput) => Promise<boolean>;
  actualizarPedido: (id: string, p: Partial<PedidoInput>) => Promise<boolean>;
  eliminarPedido: (id: string) => Promise<boolean>;
  cambiarEstado: (id: string, estado: EstadoPedido) => Promise<boolean>;
  getEstadisticas: () => Estadisticas;
  isConnected: boolean;
}

const PedidosContext = createContext<PedidosContextType | null>(null);

function parseId(raw: any): string {
  if (!raw) return '';
  // Si ya tiene el formato correcto tabla:id
  if (typeof raw === 'string') {
    if (raw.includes(':')) return raw;
    return `pedidos:${raw}`;
  }
  if (typeof raw === 'object') {
    if (raw.tb && raw.id) return `${raw.tb}:${raw.id}`;
    if (raw.id) return `pedidos:${raw.id}`;
  }
  return `pedidos:${String(raw)}`;
}

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const db = await getSurrealDB();
        const result = await db.query<Pedido[][]>('SELECT * FROM pedidos ORDER BY creadoEn DESC');
        if (mounted && result[0]) {
          setPedidos(result[0].map((p: any) => ({ ...p, id: parseId(p.id) })));
        }

        const sub = await db.live<Pedido>(new Table('pedidos'));
        const unsub = sub.subscribe((msg: any) => {
          if (!mounted || !msg) return;
          console.log('LIVE EVENT:', JSON.stringify(msg));

          // SurrealDB puede enviar el evento con diferentes estructuras
          const action = msg.action;
          const record = msg.record || msg.value || msg.result;

          if (!record) return;

          const rawId = msg.recordId || record.id;
          const id = typeof rawId === 'string' ? rawId :
            (rawId?.tb && rawId?.id) ? `${rawId.tb}:${rawId.id}` : String(rawId);

          // Normalizar el ID removiendo los símbolos ⟨ ⟩ que SurrealDB agrega
          const normalizeId = (s: string) => s.replace(/[⟨⟩]/g, '');
          const normalizedId = normalizeId(id);

          const p = { ...record, id: normalizedId };

          if (action === 'CREATE') {
            setPedidos(prev => prev.find(x => normalizeId(x.id) === normalizedId) ? prev : [p, ...prev]);
          } else if (action === 'UPDATE') {
            setPedidos(prev => prev.map(x => normalizeId(x.id) === normalizedId ? p : x));
          } else if (action === 'DELETE') {
            setPedidos(prev => prev.filter(x => normalizeId(x.id) !== normalizedId));
          }
        });

        if (mounted) { setUnsubscribe(() => unsub); setIsConnected(true); }
      } catch (e) {
        console.error('Error pedidos:', e);
        if (mounted) setError('Error al conectar');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();
    return () => { mounted = false; unsubscribe?.(); };
  }, []);

  const crearPedido = useCallback(async (input: PedidoInput): Promise<boolean> => {
    try {
      setError(null);
      if (!navigator.onLine) {
        setError('Sin conexión a internet. Conectate y volvé a intentarlo.');
        return false;
      }
      const db = await getSurrealDB();
      const ahora = new Date().toISOString();
      const cinco = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const dup = await db.query<any[][]>(
        `SELECT * FROM pedidos WHERE string::lowercase(nombreComprador) = string::lowercase($n) AND string::lowercase(destinatario) = string::lowercase($d) AND seccion = $s AND creadoEn > $t`,
        { n: input.nombreComprador, d: input.destinatario, s: input.seccion, t: cinco }
      );
      if (dup[0]?.length > 0) { setError('Este pedido ya existe.'); return false; }

      const nuevo = { ...input, fecha: ahora, creadoEn: ahora, actualizadoEn: ahora }; await db.query(`CREATE pedidos CONTENT ${JSON.stringify(nuevo)}`);
      return true;
    } catch (e) { console.error(e); setError('Error al crear'); return false; }
  }, []);

  const actualizarPedido = useCallback(async (id: string, update: Partial<PedidoInput>): Promise<boolean> => {
    try {
      setError(null);
      // Actualizar local INMEDIATAMENTE sin esperar SurrealDB
      setPedidos(prev => prev.map(x => x.id === id ? { ...x, ...update, actualizadoEn: new Date().toISOString() } : x));
      const db = await getSurrealDB();
      const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
      await db.query(`UPDATE pedidos:\`${rawId}\` MERGE $data`, {
        data: { ...update, actualizadoEn: new Date().toISOString() }
      });
      return true;
    } catch (e) { console.error('Error actualizando:', e); setError('Error al actualizar'); return false; }
  }, []);

  const eliminarPedido = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      // Eliminar local INMEDIATAMENTE sin esperar SurrealDB
      setPedidos(prev => prev.filter(x => x.id !== id));
      const db = await getSurrealDB();
      const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
      await db.query(`DELETE pedidos:\`${rawId}\``);
      return true;
    } catch (e) { console.error('Error eliminando:', e); setError('Error al eliminar'); return false; }
  }, []);

  const cambiarEstado = useCallback((id: string, estado: EstadoPedido) => {
    return actualizarPedido(id, { estado });
  }, [actualizarPedido]);

  const getEstadisticas = useCallback((): Estadisticas => {
    const stats: Estadisticas = {
      dineroTotal: 0, totalPedidos: pedidos.length,
      floresVendidas: 0, chocolatesVendidos: 0, globosVendidos: 0, serenatasVendidas: 0,
      pedidosPorEstado: { pendiente: 0, pagado: 0, entregado: 0 },
    };
    pedidos.forEach(p => {
      stats.dineroTotal += p.total || 0;
      if (p.estado && stats.pedidosPorEstado[p.estado] !== undefined) stats.pedidosPorEstado[p.estado]++;
      p.productos?.forEach(prod => {
        const n = (prod.nombre || '').toLowerCase();
        const c = prod.cantidad || 0;
        if (n.includes('flor')) stats.floresVendidas += c;
        else if (n.includes('chocolate')) stats.chocolatesVendidos += c;
        else if (n.includes('globo')) stats.globosVendidos += c;
        else if (n.includes('serenata')) stats.serenatasVendidas += c;
      });
    });
    return stats;
  }, [pedidos]);

  return (
    <PedidosContext.Provider value={{ pedidos, isLoading, error, crearPedido, actualizarPedido, eliminarPedido, cambiarEstado, getEstadisticas, isConnected }}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos() {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error('usePedidos must be used within PedidosProvider');
  return ctx;
}