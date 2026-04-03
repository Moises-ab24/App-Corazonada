# 💜 Corazonada

App web para gestión de pedidos del evento Corazonada. Permite registrar, administrar y visualizar pedidos de flores, chocolates, globos y serenatas en tiempo real desde cualquier dispositivo.

Ya disponible en (https://corazonadaseniors.vercel.app)

## ✨ Funcionalidades

- **Nuevo Pedido** — Registrá pedidos con comprador, destinatario, sección y productos
- **Pedidos** — Listado con búsqueda, filtros por sección, estado y producto. Cambiá el estado o eliminá pedidos
- **Estadísticas** — Resumen en tiempo real: dinero recaudado, productos vendidos e ingresos por producto
- **Sincronización en tiempo real** — Todos los dispositivos ven los cambios al instante
- **Modo offline parcial** — Productos y secciones disponibles aunque no haya conexión

## 🛠️ Tecnologías

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [SurrealDB](https://surrealdb.com/) — base de datos con sincronización en tiempo real
- [Lucide React](https://lucide.dev/) — íconos

## 🚀 Correr localmente

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editá el .env con tus credenciales de SurrealDB

# Correr en desarrollo
npm run dev
```

## ⚙️ Variables de entorno

Creá un archivo `.env` en la raíz con:

```
VITE_SURREALDB_ENDPOINT=
VITE_SURREALDB_NAMESPACE=
VITE_SURREALDB_DATABASE=
VITE_SURREALDB_USERNAME=
VITE_SURREALDB_PASSWORD=
VITE_APP_PASSWORD=
```

## 🔄 Redesplegar desde cero

Si clonás el proyecto en una máquina nueva:
```bash
npm install
vercel link
vercel --prod
```

## 📝 Resumen general de todo el proyecto

```text
👤 Usuario abre la app
   ↓
🌐 Vercel sirve los archivos
   ↓
⚛️ React monta la app en el navegador
   ↓
🔐 AuthContext verifica la contraseña
   ↓
🗄️ PedidosContext conecta a SurrealDB
   ↓
⚡ Live query abre conexión en tiempo real
   ↓
📄 Las páginas muestran los datos
   ↓
✏️ Usuario crea/modifica pedidos
   ↓
🔄 Se actualiza la base de datos
   ↓
📡 Sincronización en todos los dispositivos
   ↓
✅ Cambios visibles al instante
```

## 📄 Licencia

Todos los derechos reservados · Moisés Abarca · 2026
