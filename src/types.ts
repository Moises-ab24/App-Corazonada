export interface ProductoPedido {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export type EstadoPedido = 'pendiente' | 'pagado' | 'entregado';

export interface Pedido {
  id: string;
  nombreComprador: string;
  seccion: string;
  seccionDestinatario?: string;
  destinatario: string;
  descripcion?: string;
  notasInternas?: string;
  productos: ProductoPedido[];
  total: number;
  estado: EstadoPedido;
  fecha: string;
  creadoEn?: string;
  actualizadoEn?: string;
  creadoPor?: string;
  modificadoPor?: string;
}

export interface PedidoInput {
  nombreComprador: string;
  seccion: string;
  seccionDestinatario?: string;
  destinatario: string;
  descripcion?: string;
  notasInternas?: string;
  productos: ProductoPedido[];
  total: number;
  estado: EstadoPedido;
  creadoPor?: string;
  modificadoPor?: string;
}

export interface Estadisticas {
  dineroTotal: number;
  totalPedidos: number;
  floresVendidas: number;
  chocolatesVendidos: number;
  globosVendidos: number;
  serenatasVendidas: number;
  pedidosPorEstado: {
    pendiente: number;
    pagado: number;
    entregado: number;
  };
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  activo: boolean;
}

export interface Seccion {
  id: string;
  nombre: string;
  activa: boolean;
}

export const ESTADOS_PEDIDO = [
  { id: 'pendiente' as EstadoPedido, nombre: 'Pendiente', color: '#F59E0B' },
  { id: 'pagado' as EstadoPedido, nombre: 'Pagado', color: '#22C55E' },
  { id: 'entregado' as EstadoPedido, nombre: 'Entregado', color: '#6B4EFF' },
];