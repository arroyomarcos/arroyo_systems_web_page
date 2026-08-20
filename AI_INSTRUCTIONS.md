# Instrucciones para IA - Arroyo Systems Web

Este documento explica como esta construida la pagina web de Arroyo Systems y que debe entender una IA antes de modificarla. Usalo como contexto principal junto con `README.md`.

## 1. Vision general del proyecto

La web es una aplicacion full-stack separada en dos partes independientes:

- `frontend/`: aplicacion React para la pagina publica, paginas legales y panel de administracion.
- `backend/`: API FastAPI que recibe formularios de contacto, guarda mensajes en MongoDB y protege el panel admin con JWT.

Frontend y backend no comparten runtime. Se comunican por HTTP usando la variable `REACT_APP_BACKEND_URL`, que apunta a la API publica del backend. En produccion el frontend puede vivir en Vercel o Netlify y el backend en Render o Railway.

## 2. Stack tecnico

Frontend:

- React 19 con Create React App y CRACO.
- `react-router-dom` para rutas.
- Tailwind CSS para utilidades de layout y estilos.
- Componentes tipo shadcn/ui dentro de `frontend/src/components/ui/`.
- `axios` para llamadas a la API.
- `lucide-react` para iconos.

Backend:

- FastAPI.
- Motor como driver async de MongoDB.
- Pydantic para modelos y validacion.
- JWT para autenticacion admin.
- Passlib/bcrypt para hash de password.
- CORS configurable por variable de entorno.
- `stripe` (SDK oficial) para Checkout, Stripe Tax y verificacion de webhooks.

Base de datos:

- MongoDB.
- Colecciones principales: `contact_messages`, `admin_users` y `orders` (pedidos/pagos de Stripe).

## 3. Estructura del frontend

Archivo de entrada:

- `frontend/src/index.js`: monta la app React.
- `frontend/src/App.js`: define rutas, SEO por ruta, scroll/hash behavior y layout principal.

Rutas actuales:

- `/`: pagina publica.
- `/privacy-policy`: politica de privacidad.
- `/legal-notice`: aviso legal.
- `/cookies-policy`: politica de cookies.
- `/admin`: login admin.
- `/admin/messages`: dashboard admin protegido por token.
- `/admin/payments`: generacion de payment links de Stripe y listado de pedidos, protegido por token.

La home se compone en este orden:

1. `Header`
2. `Hero`
3. `Approach`
4. `Decisions`
5. `Capabilities`
6. `Products`
7. `Partners`
8. `Footer`

Los componentes de secciones estan en `frontend/src/components/sections/`. La IA debe mantener esta separacion: una seccion visual o de contenido debe vivir ahi, no mezclada dentro de `App.js`.

## 4. Estilos y sistema visual

Los estilos principales estan en:

- `frontend/src/index.css`: Tailwind base, imports y variables shadcn.
- `frontend/src/App.css`: identidad visual Arroyo, clases globales, secciones, formulario, paginas legales.
- `frontend/tailwind.config.js`: configuracion Tailwind y tokens shadcn.

Convenciones visuales importantes:

- La marca usa `Inter`.
- Colores principales definidos como CSS variables:
  - `--arroyo-navy`
  - `--arroyo-navy-2`
  - `--arroyo-muted`
  - `--arroyo-light-blue`
  - `--arroyo-accent`
  - `--arroyo-bg`
  - `--arroyo-bg-soft`
- Reutilizar clases existentes como `arroyo-container`, `arroyo-display`, `arroyo-body`, `section-heading`, `contact-pill`, `link-underline`.
- Mantener un estilo tecnico, limpio y corporativo. Evitar cambios visuales que conviertan la web en una landing generica o excesivamente decorativa.
- Para nuevos botones con icono, preferir `lucide-react`.
- Para UI admin, mantener componentes compactos y orientados a gestion.

## 5. API del frontend

La capa API central esta en `frontend/src/lib/api.js`.

Reglas:

- No llamar a `fetch` o `axios` disperso por componentes salvo excepciones justificadas. Crear funciones en `lib/api.js`.
- La base URL se construye asi:
  - `process.env.REACT_APP_BACKEND_URL || "https://api.arroyo-systems.com"`
  - luego se anade `/api`.
- Las rutas admin usan un interceptor de axios que adjunta `Authorization: Bearer <token>` cuando la URL empieza por `/admin`.
- El token se gestiona en `frontend/src/lib/auth.js` con `sessionStorage`.

Funciones existentes:

- `submitContact(payload)`
- `adminLogin(username, password)`
- `adminMe()`
- `listMessages()`
- `updateMessageRead(id, read)`
- `deleteMessage(id)`
- `exportCsvUrl()`
- `createCheckoutSession(payload)`
- `listOrders()`

## 6. Formulario de contacto

Componente:

- `frontend/src/components/ContactForm.jsx`

Validacion y payload:

- `frontend/src/lib/contactFormValidation.js`

Campos:

- `name`
- `email`
- `company`
- `project_type`
- `message`
- `privacyAccepted`

Tipos de proyecto validos:

- `DFM`
- `Structural Validation`
- `Engineering Performance`
- `Other`

Reglas importantes:

- El frontend valida campos requeridos, email, longitud minima de mensaje y aceptacion de privacidad.
- El backend tambien valida y sanea. No asumir que la validacion frontend basta.
- Si se agregan campos, hay que actualizar:
  - estado inicial en `INITIAL_FORM`
  - validacion frontend
  - `buildContactPayload`
  - modelo `ContactCreate` en backend
  - modelo `ContactMessage` si el dato se persiste
  - dashboard/admin si debe verse o exportarse

## 7. Panel de administracion

Rutas:

- `/admin`: login.
- `/admin/messages`: dashboard.

Archivos principales:

- `frontend/src/pages/admin/AdminLogin.jsx`
- `frontend/src/pages/admin/AdminDashboard.jsx`
- `frontend/src/pages/admin/components/`
- `frontend/src/lib/useAdminMessages.js`
- `frontend/src/lib/messageUtils.js`
- `frontend/src/lib/auth.js`

Funcionamiento:

- Login llama a `/api/admin/login`.
- El backend devuelve `access_token`.
- El token se guarda en `sessionStorage` bajo `arroyo_admin_token`.
- El dashboard comprueba si hay token; si no, redirige a `/admin`.
- Las llamadas admin fallidas con `401` limpian token y redirigen al login.
- `useAdminMessages` concentra carga, refresh, marcar leido/no leido y borrar.

Al modificar admin:

- Mantener el estado y mutaciones en hooks/utilidades, no duplicar logica en cada componente.
- Mantener la exportacion CSV con token Bearer.
- No guardar tokens en `localStorage` sin motivo explicito.

## 8. Backend FastAPI

Archivo principal:

- `backend/server.py`

Prefijo de API:

- Todas las rutas estan bajo `/api`.

Rutas publicas:

- `GET /api/`: health/status.
- `POST /api/contact`: recibe formulario de contacto.

Rutas admin:

- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/email/status`
- `POST /api/admin/email/test`
- `GET /api/admin/messages`
- `PATCH /api/admin/messages/{msg_id}`
- `DELETE /api/admin/messages/{msg_id}`
- `GET /api/admin/messages/export.csv`
- `POST /api/admin/checkout/session`: crea una Stripe Checkout Session (Stripe Tax activado) y un pedido en `orders`.
- `GET /api/admin/orders`: lista pedidos.

Rutas publicas de Stripe:

- `GET /api/checkout/session/{session_id}`: estado de un pedido, usado por la pagina de exito del checkout.
- `POST /api/webhooks/stripe`: recibe eventos de Stripe (verificados por firma) y actualiza el estado del pedido en `orders`.

Responsabilidades del backend:

- Validar y sanear datos del contacto.
- Aplicar rate limit basico en memoria por IP.
- Verificar Cloudflare Turnstile si `TURNSTILE_SECRET_KEY` esta configurado.
- Exigir aceptacion de privacidad si `REQUIRE_PRIVACY_ACCEPTANCE=true`.
- Guardar mensajes en MongoDB.
- Hashear IP con `IP_HASH_SALT`.
- Enviar notificaciones por Resend o SMTP si hay configuracion.
- Sembrar/actualizar usuario admin al arrancar usando variables de entorno.
- Proteger rutas admin con JWT.
- Anadir cabeceras de seguridad.

## 9. Variables de entorno

Backend (`backend/.env`):

- `MONGO_URL`
- `DB_NAME`
- `CORS_ORIGINS`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PRIVACY_POLICY_VERSION`
- `REQUIRE_PRIVACY_ACCEPTANCE`
- `TURNSTILE_SECRET_KEY`
- `RATE_LIMIT_CONTACT_MAX`
- `RATE_LIMIT_CONTACT_WINDOW_SECONDS`
- `IP_HASH_SALT`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `CONTACT_NOTIFICATION_TO`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_FALLBACK_FROM`
- `EMAIL_SEND_TIMEOUT_SECONDS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_CURRENCY`

Frontend (`frontend/.env`):

- `REACT_APP_BACKEND_URL`

Regla critica:

- No commitear archivos `.env`. Solo `.env.example`.
- En React, las variables `REACT_APP_*` se inyectan en build time. Si cambia `REACT_APP_BACKEND_URL`, hay que reconstruir y redeplegar frontend.

## 10. Flujo de datos principal

Formulario de contacto:

1. Usuario rellena `ContactForm`.
2. `validateContactForm` valida en cliente.
3. `buildContactPayload` prepara datos.
4. `submitContact` envia `POST /api/contact`.
5. Backend valida con Pydantic, sanea texto, comprueba privacidad, rate limit y Turnstile si aplica.
6. Backend guarda en `contact_messages`.
7. Backend intenta enviar notificacion por email.
8. Frontend muestra toast y estado de exito.

Admin:

1. Admin entra en `/admin`.
2. Login llama `POST /api/admin/login`.
3. Token JWT se guarda en `sessionStorage`.
4. Dashboard llama `adminMe` y `listMessages`.
5. Admin puede filtrar, marcar leido/no leido, borrar y exportar CSV.
6. Si el token expira o es invalido, se limpia y vuelve al login.

## 11. SEO, legales y navegacion

SEO por ruta:

- Definido en `ROUTE_SEO` dentro de `frontend/src/App.js`.
- `RouteEffects` actualiza `title`, `description`, robots, Open Graph, Twitter y canonical.

Scroll:

- Si la ruta no tiene hash, se sube arriba.
- Si hay hash, busca el elemento por `id` y hace scroll suave.

Paginas legales:

- `frontend/src/pages/LegalPage.jsx`
- Mantener sus rutas y enlaces desde el formulario/footer si se cambia contenido legal.

## 12. Despliegue

Frontend:

- Vercel preferido, Netlify alternativo.
- Configuracion:
  - `frontend/vercel.json`
  - `netlify.toml`

Backend:

- Render o Railway.
- Configuracion:
  - `render.yaml`
  - `backend/Procfile`

Dominio recomendado:

- `arroyo-systems.com`: frontend.
- `www.arroyo-systems.com`: frontend.
- `api.arroyo-systems.com`: backend.

## 13. Como modificar el proyecto correctamente

Antes de editar:

1. Leer `README.md`.
2. Leer este archivo.
3. Identificar si el cambio afecta solo frontend, solo backend o ambos.
4. Buscar componentes y utilidades existentes antes de crear nuevos patrones.

Buenas practicas:

- Mantener componentes pequenos y ubicados por dominio.
- No poner logica de API dentro de componentes si puede ir en `lib/api.js`.
- No duplicar validacion sin revisar backend y frontend juntos.
- Mantener nombres de campos compatibles entre frontend y backend.
- No romper rutas publicas ni rutas admin existentes.
- Preservar `privacyAccepted` y version de politica en mensajes de contacto.
- Mantener `Authorization: Bearer` para endpoints admin.
- Si se agrega una ruta publica, actualizar SEO/canonical si corresponde.
- Si se cambia el copy de la home, revisar que nav anchors y secciones sigan cuadrando.

## 14. Checklist de verificacion para una IA

Despues de cambios frontend:

- Ejecutar build o tests disponibles en `frontend`.
- Revisar que `/`, paginas legales, `/admin` y `/admin/messages` sigan renderizando.
- Verificar que no haya errores de imports.
- Revisar responsive si se toca layout.

Despues de cambios backend:

- Ejecutar tests o al menos arrancar FastAPI con variables necesarias.
- Verificar `GET /api/`.
- Verificar `POST /api/contact` con payload valido.
- Si se toca admin, verificar login y una ruta protegida.

Despues de cambios full-stack:

- Confirmar que payload frontend coincide con modelos backend.
- Confirmar que CORS permite el origen del frontend.
- Confirmar que variables de entorno necesarias estan documentadas en `.env.example`.

## 15. Cosas que una IA no debe hacer sin razon clara

- No mover frontend y backend a un monolito.
- No cambiar nombres de rutas API sin actualizar todos los clientes.
- No sustituir `sessionStorage` por `localStorage` para el token admin sin evaluar seguridad.
- No eliminar saneamiento, rate limiting, privacidad ni JWT.
- No hardcodear secretos, credenciales, URLs privadas o passwords.
- No commitear `.env`.
- No introducir una libreria pesada si el patron actual resuelve el problema.
- No cambiar la identidad visual completa para una edicion pequena.

