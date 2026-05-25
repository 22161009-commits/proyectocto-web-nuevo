# elesquinero — Guía del proyecto

App web para diseñar muebles (Zapatero y catálogo), guardar proyectos en PostgreSQL y exportar despiece en PDF.

## Estructura del proyecto

```
proyecto-web/                 ← carpeta principal (aquí corres npm run dev)
├── .env                      ← Google Client ID (frontend)
├── LEEME.md                  ← esta guía
├── package.json
├── public/images/            ← fotos y diagramas de muebles
├── src/
│   ├── main.jsx              ← entrada React + GoogleOAuthProvider
│   ├── App.jsx               ← pantallas, rutas, login, editor
│   ├── App.css               ← estilos
│   ├── index.css             ← variables de color (caoba/madera)
│   └── services/
│       └── api.js            ← llamadas al backend (proyectos, Google)
└── backend/
    ├── .env                  ← base de datos + Google Client ID
    ├── index.js              ← API Express (auth, modelos, proyectos)
    ├── auth.js               ← verificación token Google
    ├── db.js                 ← conexión PostgreSQL
    ├── piezas.js             ← cálculo de piezas escaladas
    ├── seed.sql              ← datos de catálogo (Zapatero, piezas)
    ├── seed-admin.sql        ← columnas extra en proyectos (postgres)
    └── auth-migration.sql    ← google_id en usuarios (postgres)
```

## Cómo arrancar (cada vez que trabajes)

Necesitas **2 terminales** en la carpeta `proyecto-web/`:

```bash
# Terminal 1 — Frontend (http://localhost:5173)
npm run dev

# Terminal 2 — Backend (http://localhost:3001)
npm run dev:backend
```

Luego abre el navegador en: **http://localhost:5173**

## Base de datos (PostgreSQL)

| Tabla | Para qué sirve |
|-------|----------------|
| `roles` | Administrador, Editor, Usuario |
| `usuarios` | Cuentas (email, Google, contraseña) |
| `modelos` | Catálogo de muebles (Zapatero, mesa, etc.) |
| `piezas_modelo` | Piezas plantilla de cada modelo |
| `proyectos` | Proyectos guardados por usuario |
| `piezas` | Piezas calculadas de cada proyecto |

### Scripts útiles (primera vez o si falta data)

```bash
# Como usuario postgres (una vez)
npm run db:seed-admin
npm run db:auth-migrate

# Como app_admin o desde psql con tu usuario
npm run db:seed
```

## Inicio de sesión

### Usuarios normales (tu negocio)

- **Google**: botón en login → rol automático **Usuario** (id 3).
- **Email + contraseña**: registro sin elegir rol → también **Usuario**.

### Administradores (después, manual)

No se registran solos. Se crean en la BD con `id_rol = 1` (Administrador).

## Flujo de Google (resumen)

1. Usuario pulsa el botón en `App.jsx`.
2. Google devuelve un token → `api.js` → `POST /api/auth/google`.
3. `backend/auth.js` valida el token con `GOOGLE_CLIENT_ID`.
4. Si el email es nuevo → se inserta en `usuarios` con `google_id`.
5. La app guarda `userId` en `localStorage` y entra a `/inicio`.

Variables necesarias (ya configuradas en `.env`):

| Archivo | Variable |
|---------|----------|
| `.env` (raíz) | `VITE_GOOGLE_CLIENT_ID` |
| `backend/.env` | `GOOGLE_CLIENT_ID` (mismo valor) |

**Importante:** si cambias el `.env`, reinicia `npm run dev` y `npm run dev:backend`.

### Si Google dice "app en prueba"

En Google Cloud → Pantalla de consentimiento → **Usuarios de prueba** → agrega el Gmail con el que inicias sesión.

## Rutas de la app

| Ruta | Pantalla |
|------|----------|
| `/` | Login |
| `/inicio` | Categorías principales |
| `/categoria/:categorySlug` | Subcategorías, modelos y buscador por categoría |
| `/mis-proyectos` | Lista de proyectos |
| `/mueble` | Editor del Zapatero (medidas + PDF) |
| `/favoritos` | Proyectos marcados con estrella |
| `/configuracion` | Ajustes |
| `/ayuda` | Ayuda |

## Categorías de Inicio

La pantalla `/inicio` muestra primero las categorías grandes:

- Sala
- Cocina
- Recámara
- Oficina
- Baño
- Comedor

Las subcategorías están definidas en `src/App.jsx`, dentro de `FURNITURE_CATEGORIES`.
Las imágenes se cargan desde `public/images/Categorias_muebles/`.

La imagen de Baño está conectada desde:

```text
public/images/Categorias_muebles/CAT_BANO.jpeg
```

La pantalla principal no tiene buscador. El buscador está dentro de cada pantalla de categoría y filtra subcategorías y modelos. También ignora acentos, así que `bano` encuentra `Baño`.

## API principal (backend)

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/auth/login` | Email y contraseña |
| POST | `/api/auth/register` | Registro (solo Usuario) |
| POST | `/api/auth/google` | Login con Google |
| GET | `/api/modelos` | Catálogo |
| GET/POST/PUT/DELETE | `/api/proyectos` | CRUD proyectos |

## Problemas frecuentes

| Síntoma | Qué hacer |
|---------|-----------|
| No aparece botón Google | Crear `.env` en raíz, reiniciar Vite |
| Error 503 Google en servidor | `GOOGLE_CLIENT_ID` en `backend/.env`, reiniciar backend |
| Catálogo vacío | `npm run db:seed` |
| No guarda proyectos | Backend encendido en puerto 3001 |
| Puerto 3001 con API vieja | Cerrar proceso node viejo y `npm run dev:backend` |

## Seguridad

- Los archivos `.env` **no** se suben a Git (están en `.gitignore`).
- No compartas contraseñas de la base de datos en repositorios públicos.
