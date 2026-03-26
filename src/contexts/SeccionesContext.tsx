import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Table } from 'surrealdb';
import { getSurrealDB } from '../surrealdb';
import type { Seccion } from '../types';

interface SeccionesContextType {
  secciones: Seccion[];
  seccionesActivas: Seccion[];
  isLoading: boolean;
  error: string | null;
  agregarSeccion: (nombre: string) => Promise<boolean>;
  editarSeccion: (id: string, nombre: string) => Promise<boolean>;
  eliminarSeccion: (id: string) => Promise<boolean>;
  toggleSeccionActiva: (id: string) => Promise<boolean>;
}

const SeccionesContext = createContext<SeccionesContextType | null>(null);
const STORAGE_KEY = 'corazonada_secciones';
const DEFAULTS = ['7-1', '7-2', '7-3', '7-4', '8-1', '8-2', '8-3', '8-4', '9-1', '9-2', '9-3', '9-4', '10-1', '10-2', '10-3', '10-4', '11-1', '11-2', '11-3', '11-4', '12-1', '12-2', '12-3', '12-4'].map(nombre => ({ nombre, activa: true }));

// Ordenamiento numérico: "7-1" antes que "10-1"
function sortSecciones(a: Seccion, b: Seccion): number {
  const parse = (s: string) => {
    const [grado, grupo] = s.split('-').map(Number);
    return { grado: grado || 0, grupo: grupo || 0 };
  };
  const pa = parse(a.nombre);
  const pb = parse(b.nombre);
  if (pa.grado !== pb.grado) return pa.grado - pb.grado;
  return pa.grupo - pb.grupo;
}

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
function cargarLocal(): Seccion[] {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch { }
  return [];
}
function guardarLocal(s: Seccion[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { }
}

export function SeccionesProvider({ children }: { children: ReactNode }) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const local = cargarLocal();
      if (local.length > 0 && mounted) { setSecciones(local); setIsLoading(false); }
      try {
        const db = await getSurrealDB();
        const result = await db.query<Seccion[][]>('SELECT * FROM secciones');
        if (mounted) {
          if (result[0] && result[0].length > 0) {
            const data = result[0].map((s: any) => ({ ...s, id: parseId(s.id) }));
            setSecciones(data); guardarLocal(data);
          } else if (local.length === 0) {
            for (const d of DEFAULTS) await db.query(`CREATE secciones CONTENT ${JSON.stringify(d)}`);
            const reload = await db.query<Seccion[][]>('SELECT * FROM secciones');
            if (reload[0]) { const data = reload[0].map((s: any) => ({ ...s, id: parseId(s.id) })); setSecciones(data); guardarLocal(data); }
          }
        }
        const sub = await db.live<Seccion>(new Table('secciones'));
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
          setSecciones(prev => {
            let u: Seccion[];
            if (action === 'CREATE') u = prev.find(x => normalizeId(x.id) === id) ? prev : [...prev, s].sort(sortSecciones);
            else if (action === 'UPDATE') u = prev.map(x => normalizeId(x.id) === id ? s : x);
            else if (action === 'DELETE') u = prev.filter(x => normalizeId(x.id) !== id);
            else u = prev;
            guardarLocal(u); return u;
          });
        });
      } catch (e) {
        console.error('SurrealDB no disponible:', e);
        if (mounted && cargarLocal().length === 0) {
          const defaults = DEFAULTS.map(d => ({ ...d, id: generateId() }));
          setSecciones(defaults); guardarLocal(defaults);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const agregarSeccion = useCallback(async (nombre: string): Promise<boolean> => {
    const n = nombre.trim();
    if (!n) { setError('El nombre es requerido'); return false; }
    if (secciones.some(s => s.nombre.toLowerCase() === n.toLowerCase())) { setError('Ya existe'); return false; }
    try { const db = await getSurrealDB(); await db.query(`CREATE secciones CONTENT ${JSON.stringify({ nombre: n, activa: true })}`); } catch { }
    return true;
  }, [secciones]);

  const editarSeccion = useCallback(async (id: string, nombre: string): Promise<boolean> => {
    const n = nombre.trim();
    if (!n) { setError('El nombre es requerido'); return false; }
    if (secciones.some(s => s.id !== id && s.nombre.toLowerCase() === n.toLowerCase())) { setError('Ya existe'); return false; }
    setSecciones(prev => { const u = prev.map(s => s.id === id ? { ...s, nombre: n } : s); guardarLocal(u); return u; });
    try {
      const db = await getSurrealDB();
      const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
      await db.query(`UPDATE secciones:\`${rawId}\` MERGE $data`, { data: { nombre: n } });
    } catch (e) { console.error(e); }
    return true;
  }, [secciones]);

  const eliminarSeccion = useCallback(async (id: string): Promise<boolean> => {
    setSecciones(prev => { const u = prev.filter(s => s.id !== id); guardarLocal(u); return u; });
    try {
      const db = await getSurrealDB();
      const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
      await db.query(`DELETE secciones:\`${rawId}\``);
    } catch (e) { console.error(e); }
    return true;
  }, []);

  const toggleSeccionActiva = useCallback(async (id: string): Promise<boolean> => {
    const s = secciones.find(x => x.id === id);
    if (!s) return false;
    setSecciones(prev => { const u = prev.map(x => x.id === id ? { ...x, activa: !x.activa } : x); guardarLocal(u); return u; });
    try {
      const db = await getSurrealDB();
      const rawId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
      await db.query(`UPDATE secciones:\`${rawId}\` MERGE $data`, { data: { activa: !s.activa } });
    } catch (e) { console.error(e); }
    return true;
  }, [secciones]);

  const seccionesActivas = useMemo(() =>
    secciones.filter(s => s.activa).sort(sortSecciones),
    [secciones]
  );

  return (
    <SeccionesContext.Provider value={{ secciones, seccionesActivas, isLoading, error, agregarSeccion, editarSeccion, eliminarSeccion, toggleSeccionActiva }}>
      {children}
    </SeccionesContext.Provider>
  );
}

export function useSecciones() {
  const ctx = useContext(SeccionesContext);
  if (!ctx) throw new Error('useSecciones must be used within SeccionesProvider');
  return ctx;
}