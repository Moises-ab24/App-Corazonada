# 💜 Corazonada

App web para gestión de pedidos del evento Corazonada. Permite registrar, administrar y visualizar pedidos de flores, chocolates, globos y serenatas en tiempo real desde cualquier dispositivo.

Ya disponible en (https://corazonadaseniors.vercel.app)

## 📸 Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/8d57be24-d5c5-425e-89c3-8cb90c5404de" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/44fd354e-1de1-4eda-a7c6-50e6c17109b2" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/152ff013-af30-49c4-bcc4-cb17ae4f05b1" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/895f8dff-760b-4305-ba1f-48ada67fd242" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/bee59f6d-d6ba-48b9-baa0-f8775fb72d38" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/a435f246-5b79-4f0b-8a93-f62bac431ec5" width="165" height="350"/>
  <img src="https://github.com/user-attachments/assets/9b6dbc19-0564-461e-95bb-0c0b2d830d56" width="165" height="350"/>
</p>

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
