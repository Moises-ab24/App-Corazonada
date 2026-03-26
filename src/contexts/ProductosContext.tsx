import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Table } from 'surrealdb';
import { getSurrealDB } from '../surrealdb';
import type { Producto } from '../types';

interface ProductosContextType {
  productos: Producto[];
  isLoading: boolean;
  error: string | null;
  agregarProducto: (p: Omit<Producto, 'id'>) => Promise<boolean>;
  actualizarProducto: (id: string, p: Partial<Omit<Producto, 'id'>>) => Promise<boolean>;
  eliminarProducto: (id: string) => Promise<boolean>;
  toggleProductoActivo: (id: string) => Promise<boolean>;
  getProductosActivos: () => Producto[];
}

const ProductosContext = createContext<ProductosContextType | null>(null);

const STORAGE_KEY = 'corazonada_productos';
const DEFAULTS: Omit<Producto, 'id'>[] = [
  { nombre: 'Flor', precio: 1500, descripcion: 'Flor individual', activo: true },
  { nombre: 'Chocolate', precio: 1000, descripcion: 'Chocolate de regalo', activo: true },
  { nombre: 'Globo', precio: 2000, descripcion: 'Globo decorativo', activo: true },
  { nombre: 'Serenata', precio: 5000, descripcion: 'Serenata musical', activo: true },
];

function generateId() { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
function parseId(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') {
    if (raw.includes(':')) return raw;
    return raw;
  }
  if (typeof raw === 'object') {
    if (raw.tb && raw.id) return `${raw.tb}:${raw.id}`;
    if (raw.id) return String(raw.id);
  }
  return String(raw);
}
function cargarLocal(): Producto[] {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch { }
  return [];
}
function guardarLocal(p: Producto[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { }
}

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Cargar local primero para que la app funcione inmediatamente
      const local = cargarLocal();
      if (local.length > 0 && mounted) {
        setProductos(local);
        setIsLoading(false);
      }
      // Luego sincronizar con SurrealDB
      try {
        const db = await getSurrealDB();
        const result = await db.query<Producto[][]>('SELECT * FROM productos ORDER BY nombre ASC');
        if (mounted) {
          if (result[0] && result[0].length > 0) {
            const data = result[0].map((p: any) => ({ ...p, id: parseId(p.id) }));
            setProductos(data);
            guardarLocal(data);
          } else if (local.length === 0) {
            for (const d of DEFAULTS) await db.query(`CREATE productos CONTENT ${JSON.stringify(d)}`);
            const reload = await db.query<Producto[][]>('SELECT * FROM productos ORDER BY nombre ASC');
            if (reload[0]) { const data = reload[0].map((p: any) => ({ ...p, id: parseId(p.id) })); setProductos(data); guardarLocal(data); }
          }
        }
        const sub = await db.live<Producto>(new Table('productos'));
        sub.subscribe((msg: any) => {
          if (!mounted || !msg) return;
          const action = msg.action;
          const record = msg.record || msg.value || msg.result;
          if (!record) return;
          const rawId = msg.recordId || record.id;
          const fullId = typeof rawId === 'string' ? rawId :
            (rawId?.tb && rawId?.id) ? `${rawId.tb}:${rawId.id}` : String(rawId);
          const normalizeId = (s: string) => s.replace(/[⟨⟩]/g, '');
          const id = normalizeId(fullId);
          const s = { ...record, id };
          setProductos(prev => {
            let u: Producto[];
            if (action === 'CREATE') u = prev.find(x => normalizeId(x.id) === id) ? prev : [...prev, s].sort((a, b) => a.nombre.localeCompare(b.nombre));
            else if (action === 'UPDATE') u = prev.map(x => normalizeId(x.id) === id ? s : x);
            else if (action === 'DELETE') u = prev.filter(x => normalizeId(x.id) !== id);
            else u = prev;
            guardarLocal(u); return u;
          });
        });
      } catch (e) {
        console.error('SurrealDB no disponible, usando datos locales:', e);
        if (mounted && cargarLocal().length === 0) {
          const defaults = DEFAULTS.map(d => ({ ...d, id: generateId() }));
          setProductos(defaults);
          guardarLocal(defaults);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const agregarProducto = useCallback(async (p: Omit<Producto, 'id'>): Promise<boolean> => {
    try {
      setError(null);
      if (!p.nombre.trim()) { setError('El nombre es requerido'); return false; }
      if (p.precio <= 0) { setError('El precio debe ser mayor a 0'); return false; }
      try { const db = await getSurrealDB(); await db.query(`CREATE productos CONTENT ${JSON.stringify({ ...p, nombre: p.nombre.trim() })}`); } catch { }
      return true;
    } catch { setError('Error al agregar'); return false; }
  }, []);

  const actualizarProducto = useCallback(async (id: string, p: Partial<Omit<Producto, 'id'>>): Promise<boolean> => {
    try {
      setError(null);
      setProductos(prev => { const u = prev.map(x => x.id === id ? { ...x, ...p } : x); guardarLocal(u); return u; });
      try {
        const db = await getSurrealDB();
        const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
        await db.query(`UPDATE productos:\`${rawId}\` MERGE $data`, { data: p });
      } catch (e) { console.error(e); }
      return true;
    } catch { setError('Error al actualizar'); return false; }
  }, []);

  const eliminarProducto = useCallback(async (id: string): Promise<boolean> => {
    try {
      setProductos(prev => { const u = prev.filter(x => x.id !== id); guardarLocal(u); return u; });
      try {
        const db = await getSurrealDB();
        const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
        await db.query(`DELETE productos:\`${rawId}\``);
      } catch (e) { console.error(e); }
      return true;
    } catch { return false; }
  }, []);

  const toggleProductoActivo = useCallback(async (id: string): Promise<boolean> => {
    const p = productos.find(x => x.id === id);
    if (!p) return false;
    return actualizarProducto(id, { activo: !p.activo });
  }, [productos, actualizarProducto]);

  const getProductosActivos = useCallback(() => productos.filter(p => p.activo), [productos]);

  return (
    <ProductosContext.Provider value={{ productos, isLoading, error, agregarProducto, actualizarProducto, eliminarProducto, toggleProductoActivo, getProductosActivos }}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos() {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductos must be used within ProductosProvider');
  return ctx;
}
