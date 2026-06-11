# Phase 1: Foundation & Auth - Research

**Researched:** 2026-06-11
**Domain:** Next.js 15 App Router + NextAuth.js v5 + MongoDB Atlas + Tailwind CSS v4 + cult-ui
**Confidence:** HIGH

---

## Summary

Esta fase scaffoldea desde cero un proyecto Next.js 15 con App Router y TypeScript, implementando autenticación via NextAuth.js v5 (Credentials Provider) con bcrypt y MongoDB Atlas M0. La superficie visual aplica la identidad Driva Dev (paleta naranja/crema, Poppins, footer con link).

El cambio más crítico a tener en cuenta vs. conocimiento previo es que **NextAuth.js v5 es una reescritura completa**: el archivo de configuración es `auth.ts` en el root, exporta `{ handlers, signIn, signOut, auth }`, y el middleware usa `export { auth as middleware }` directamente — sin el viejo `withAuth` wrapper de v4. El servidor de API handler es un one-liner en `app/api/auth/[...nextauth]/route.ts`.

Tailwind CSS v4 también cambió su setup: ya no hay `tailwind.config.ts` como punto central — la configuración se hace via `@theme` en el CSS global, y el plugin de PostCSS es `@tailwindcss/postcss` (no el viejo `tailwindcss` plugin). cult-ui se integra via registro en `components.json` y CLI de shadcn.

**Recomendación principal:** Scaffold con `create-next-app@latest` en modo no-interactivo con flags `--typescript --tailwind --app --src-dir --import-alias "@/*"`, luego instalar NextAuth v5, mongoose, bcryptjs, motion y cult-ui en ese orden.

---

<user_constraints>
## User Constraints (desde CONTEXT.md)

### Decisiones bloqueadas

- **D-01:** /register es autoservicio — el usuario ingresa email (debe estar en allowlist) y elige contraseña. No hay intervención del dev.
- **D-02:** Email duplicado muestra "Este email ya tiene cuenta, iniciá sesión" (con link a /login).
- **D-03:** Contraseña mínimo 8 caracteres. Sin requisitos de mayúsculas/números/símbolos.
- **D-04:** Registro exitoso → login automático → redirige a /tma.
- **D-05:** `/` redirige a /login si no hay sesión, a /tma si hay sesión.
- **D-06:** Login exitoso redirige a /tma.
- **D-07:** `/tma` en Phase 1 es placeholder con branding Driva Dev: saludo "Bienvenido, NyC" y 2 cards (Casos TMA, Contratos TMA) visibles pero deshabilitados.
- **D-08:** NextAuth.js v5 con Credentials Provider + bcrypt. Sin OAuth.
- **D-09:** Allowlist fija en código: `nsilva@nyc.com.ar`, `crivera@nyc.com.ar`, `tderosa@nyc.com.ar`, `vespinosa@nyc.com.ar`, `ekoch@nyc.com.ar`.
- **D-10:** Email fuera de allowlist en /register → "Este email no está autorizado".
- **D-11:** Rutas bajo /tma/* protegidas por middleware Next.js — redirigen a /login si no hay sesión.
- **D-12:** Paleta Driva Dev: #EA580C (CTAs), #9A3412 (titulares), #FED7AA (acento), #FFF7ED (fondo), #1C1917 (texto). Modo claro únicamente.
- **D-13:** Tipografía Poppins via Google Fonts: H1 700/28px, H2 700/20px, H3 500/16px, Body 400/13px, Caption 300/11px.
- **D-14:** Footer en todas las páginas: "Desarrollado por Driva Dev" con link a https://drivadev.com.ar.
- **D-15:** Proyecto Next.js 15 App Router + TypeScript desde cero. Estructura `src/` dir, alias `@/`. MongoDB Atlas M0 para colección `users`.

### Discretion de Claude

Ninguna área explícitamente marcada como discretion del dev — todas las decisiones principales están bloqueadas. Se pueden tomar decisiones menores de organización de archivos dentro de las restricciones de `src/` + `@/`.

### Ideas diferidas (FUERA DE SCOPE)

- Homepage real con cards navegables (UI-04) — Phase 4.
- Dark mode — no aplica para esta app.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte de investigación |
|----|-------------|--------------------------|
| AUTH-01 | Usuario puede registrarse si su email está en la allowlist | Authorize callback en NextAuth v5 Credentials Provider — verificación de allowlist antes de crear usuario |
| AUTH-02 | Intento con email fuera de allowlist → "Este email no está autorizado" | Error handling en Server Action de registro — throw con mensaje específico |
| AUTH-03 | Login con email y contraseña via NextAuth Credentials Provider | `signIn("credentials", formData)` desde Server Action, authorize callback con bcryptjs.compare |
| AUTH-04 | Contraseñas hasheadas con bcrypt antes de guardar en MongoDB | `bcryptjs.hash(password, 12)` en Server Action de registro antes de `User.create()` |
| AUTH-05 | Sesión persiste al refrescar | NextAuth v5 JWT strategy + cookie persistente — por defecto en NextAuth v5 |
| AUTH-06 | Rutas protegidas redirigen a /login si no hay sesión | `export { auth as middleware }` con `authorized` callback + matcher `/tma/:path*` |
| UI-01 | Paleta Driva Dev aplicada en toda la app | Tailwind v4 `@theme` en globals.css con variables CSS de la paleta |
| UI-02 | Poppins via Google Fonts en toda la app | `next/font/google` con múltiples pesos en root layout, aplicado como CSS variable en `@theme` |
| UI-03 | Footer "Desarrollado por Driva Dev" en todas las páginas | Componente `Footer` en root layout |
| UI-07 | Páginas /login y /register con formularios y branding Driva Dev | cult-ui TextureCard + TextureButton + shadcn Input/Label, paleta aplicada |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Tier principal | Tier secundario | Rationale |
|------------|---------------|-----------------|-----------|
| Registro de usuario | API / Backend (Server Action) | Database | Validación de allowlist, hash bcrypt, insert MongoDB — nunca en cliente |
| Login / autenticación | API / Backend (NextAuth handlers) | — | `signIn()` ejecuta authorize callback en servidor |
| Protección de rutas | Frontend Server (Middleware) | — | Next.js middleware corre en Edge antes del render |
| Sesión y JWT | API / Backend (NextAuth) | Frontend Server | Middleware lee JWT de cookie, Server Components usan `auth()` |
| Formularios de login/register | Browser / Client | Frontend Server | Componentes client con `useActionState` llaman Server Actions |
| Identidad visual (paleta, fuente) | Frontend Server (Layout) | Browser | globals.css + root layout, sin lógica de cliente |
| Placeholder /tma | Frontend Server | — | Server Component estático con branding |

---

## Standard Stack

### Core

| Librería | Versión | Propósito | Por qué estándar |
|----------|---------|-----------|-----------------|
| next | 16.2.9 | Framework App Router | Locked decision D-15 [VERIFIED: npm registry] |
| next-auth | 4.24.14 | Autenticación v5 API | Locked D-08; **nota:** npm tag `latest` = 4.x pero el paquete v5 se instala como `next-auth@beta` o `next-auth@5` [VERIFIED: npm registry + authjs.dev] |
| mongoose | 9.7.0 | ODM MongoDB | Patrón oficial recomendado por Mongoose para Next.js App Router [VERIFIED: mongoosejs.com docs] |
| bcryptjs | 3.0.3 | Hash de contraseñas | Pure JS — compatible con serverless/Vercel sin node-gyp [VERIFIED: npm registry] |
| tailwindcss | 4.3.0 | CSS utility-first | Stack base, v4 [VERIFIED: npm registry] |
| motion | 12.40.0 | Animaciones | Requerido por CLAUDE.md global + D-12 [VERIFIED: npm registry] |

### Supporting

| Librería | Versión | Propósito | Cuándo usar |
|----------|---------|-----------|------------|
| @tailwindcss/postcss | (incluido en tailwindcss v4) | PostCSS plugin para Tailwind v4 | Requerido para compilar Tailwind v4 [VERIFIED: Next.js docs] |
| zod | latest | Validación de esquemas en authorize | Recomendado por authjs.dev para parsear credentials [CITED: authjs.dev/getting-started/authentication/credentials] |
| lucide-react | latest | Iconos | Instalado por shadcn init, usado en formularios |
| @auth/mongodb-adapter | 3.11.2 | Adapter MongoDB para NextAuth | Solo si se usa database strategy — con Credentials + JWT no es necesario [VERIFIED: npm registry] |

### Alternatives Considered

| En vez de | Se podría usar | Trade-off |
|-----------|---------------|-----------|
| mongoose | native `mongodb` driver | mongodb nativo es más ligero; mongoose agrega schema validation útil para colección users |
| bcryptjs | bcrypt (nativo C++) | bcrypt es 3-4x más rápido pero requiere node-gyp — incompatible con serverless sin extra config; bcryptjs es equivalente en seguridad |
| Server Actions + `useActionState` | Route handlers `/api/auth/register` | Server Actions es el patrón actual App Router; evita boilerplate de fetch manual |

### Instalacion

```bash
# 1. Scaffold
npx create-next-app@latest tma --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git

# 2. NextAuth v5 (nota: instalar como @5 — latest es todavía v4.x en npm)
npm install next-auth@5

# 3. Base auth + DB
npm install mongoose bcryptjs zod

# 4. Tipos TypeScript
npm install --save-dev @types/bcryptjs

# 5. UI
npm install motion
npx shadcn@beta init
# (responder: style=new-york, rsc=true, tsx=true, cssVariables=true, aliases default con src/)
# Agregar registry cult-ui en components.json (ver sección patterns)
npx shadcn@beta add @cult-ui/texture-card @cult-ui/texture-button
npx shadcn@beta add input label form
```

**Verificacion de versiones (ejecutar antes de escribir el plan):**
```bash
npm view next-auth version   # confirmar que @5 instala v5.x y no v4.x
npm view mongoose version    # 9.x.x esperado
npm view bcryptjs version    # 3.x.x esperado
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─ GET /              → Middleware → no session? → redirect /login
  │                                   session? → redirect /tma
  │
  ├─ GET /login         → Middleware (pass) → LoginPage (Server Component)
  │   └─ form submit    → Server Action signIn("credentials") → NextAuth authorize
  │                       → bcryptjs.compare → MongoDB users.findOne
  │                       → success: redirect /tma | error: return message
  │
  ├─ GET /register      → Middleware (pass) → RegisterPage (Server Component)
  │   └─ form submit    → Server Action registerUser()
  │                       → allowlist check → email unique check → bcryptjs.hash
  │                       → MongoDB users.insertOne → signIn("credentials")
  │                       → redirect /tma
  │
  ├─ GET /tma           → Middleware: auth()? → yes: render | no: redirect /login
  │   └─ PlaceholderPage (Server Component)
  │       ├─ TextureCard "Casos TMA" (disabled)
  │       └─ TextureCard "Contratos TMA" (disabled)
  │
  └─ /api/auth/*        → NextAuth v5 handlers (GET/POST)

MongoDB Atlas M0
  └─ users collection: { email, passwordHash, createdAt }
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — Poppins, globals.css, Footer
│   ├── globals.css             # @import "tailwindcss"; @theme { paleta Driva Dev }
│   ├── page.tsx                # Redirect (/ → /login o /tma según sesión)
│   ├── login/
│   │   └── page.tsx            # LoginPage — formulario con TextureCard
│   ├── register/
│   │   └── page.tsx            # RegisterPage — formulario con TextureCard
│   ├── tma/
│   │   └── page.tsx            # Placeholder: saludo + 2 cards deshabilitados
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    # export { GET, POST } from "@/auth"
├── auth.ts                     # NextAuth config (ROOT del src, no en app/)
├── middleware.ts               # export { auth as middleware } + matcher
├── lib/
│   ├── mongodb.ts              # dbConnect() con global caching
│   └── validations.ts          # Zod schemas: loginSchema, registerSchema
├── models/
│   └── User.ts                 # Mongoose schema: email, passwordHash, createdAt
├── actions/
│   ├── auth.register.ts        # Server Action: registro + allowlist + auto-login
│   └── auth.login.ts           # (opcional si se usa signIn directamente en form)
└── components/
    ├── ui/                     # shadcn/ui + cult-ui components (auto-generados por CLI)
    ├── Footer.tsx              # "Desarrollado por Driva Dev" con link
    └── auth/
        ├── LoginForm.tsx       # Client component con useActionState
        └── RegisterForm.tsx    # Client component con useActionState
```

> **Nota:** `auth.ts` va en `src/` (no en `src/app/`) para que el import `@/auth` funcione desde middleware y otros módulos. El middleware vive en `src/middleware.ts`.

### Pattern 1: NextAuth v5 Configuration (auth.ts)

**Qué es:** Archivo central de configuración NextAuth v5. Reemplaza el viejo `pages/api/auth/[...nextauth].ts`.
**Cuándo usar:** Una sola vez, en `src/auth.ts`.

```typescript
// Source: https://authjs.dev/getting-started/authentication/credentials
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"
import { loginSchema } from "@/lib/validations"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = await loginSchema.parseAsync(credentials)
        await connectDB()
        const user = await User.findOne({ email }).lean()
        if (!user) throw new Error("Credenciales inválidas")
        const valid = await bcryptjs.compare(password, user.passwordHash)
        if (!valid) throw new Error("Credenciales inválidas")
        return { id: user._id.toString(), email: user.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
```

### Pattern 2: Middleware de proteccion de rutas

**Qué es:** El middleware de Next.js que usa la función `auth` de NextAuth v5 para verificar sesión.
**Cuándo usar:** En `src/middleware.ts`.

```typescript
// Source: https://authjs.dev/reference/nextjs
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Redirect root depending on session
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/tma" : "/login", req.url)
    )
  }

  // Protected routes: redirect to login if no session
  if (pathname.startsWith("/tma") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

### Pattern 3: API Route Handler (one-liner)

```typescript
// Source: https://authjs.dev/getting-started/installation
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Pattern 4: Server Action de registro

```typescript
// src/actions/auth.register.ts
"use server"
import { signIn } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"
import { registerSchema } from "@/lib/validations"

const ALLOWLIST = [
  "nsilva@nyc.com.ar",
  "crivera@nyc.com.ar",
  "tderosa@nyc.com.ar",
  "vespinosa@nyc.com.ar",
  "ekoch@nyc.com.ar",
]

export async function registerUser(_: unknown, formData: FormData) {
  const { email, password } = await registerSchema.parseAsync({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!ALLOWLIST.includes(email.toLowerCase())) {
    return { error: "Este email no está autorizado" }
  }

  await connectDB()
  const existing = await User.findOne({ email })
  if (existing) {
    return { error: "Este email ya tiene cuenta, iniciá sesión" }
  }

  const passwordHash = await bcryptjs.hash(password, 12)
  await User.create({ email, passwordHash, createdAt: new Date() })

  // Auto-login tras registro exitoso (D-04)
  await signIn("credentials", { email, password, redirectTo: "/tma" })
}
```

### Pattern 5: MongoDB connection caching (Next.js App Router)

```typescript
// Source: https://mongoosejs.com/docs/nextjs.html
// src/lib/mongodb.ts
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI no está definido en las variables de entorno")
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import("mongoose") | null; promise: Promise<typeof import("mongoose")> | null }
}

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

### Pattern 6: Tailwind v4 con paleta Driva Dev

```css
/* Source: https://github.com/vercel/next.js docs/01-app/01-getting-started/11-css.mdx */
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Paleta Driva Dev */
  --color-brand-primary: #EA580C;
  --color-brand-title: #9A3412;
  --color-brand-accent: #FED7AA;
  --color-brand-background: #FFF7ED;
  --color-brand-text: #1C1917;

  /* Tipografía */
  --font-poppins: var(--font-poppins);
}

body {
  background-color: var(--color-brand-background);
  color: var(--color-brand-text);
  font-family: var(--font-poppins), sans-serif;
}
```

### Pattern 7: Poppins via next/font/google

```typescript
// Source: https://github.com/vercel/next.js docs font component
// src/app/layout.tsx
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

### Pattern 8: cult-ui components.json registry

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide",
  "registries": {
    "@cult-ui": "https://cult-ui.com/r/{name}.json"
  }
}
```

### Anti-Patterns a evitar

- **Importar desde `next-auth/middleware`:** En v5 se usa `auth` exportado desde tu `auth.ts`. El viejo `export { default } from "next-auth/middleware"` es v4.
- **Usar `getServerSession(authOptions)`:** Reemplazado por `await auth()` en v5. No importar de `next-auth/next`.
- **Usar `bcrypt` nativo en Vercel:** Requiere binarios C++ — usar `bcryptjs` siempre.
- **Poner `auth.ts` dentro de `src/app/`:** Debe estar en `src/auth.ts` para ser importado como `@/auth` desde middleware.
- **Usar `@tailwind base/components/utilities` en globals.css:** En Tailwind v4 se usa `@import "tailwindcss"`.
- **Usar `tailwind.config.ts` para colores custom:** En v4, los custom tokens van en `@theme {}` dentro del CSS.
- **Database session con Credentials Provider:** Los Credentials no persisten en DB por diseño en NextAuth — usar JWT strategy (default en v5).

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|-------------|---------------|---------|
| Hashing de contraseñas | Custom SHA/MD5 | `bcryptjs.hash(pw, 12)` | Salt rounds, timing attacks, rainbow tables |
| Gestión de sesiones/JWT | Custom cookie + JWT manual | NextAuth v5 `auth()` + cookies httpOnly | CSRF, token rotation, expiración |
| Conexión MongoDB en serverless | Nueva conexión por request | `connectDB()` con global caching | Connection pooling — sin caching, se agotan los límites M0 (100 conexiones) |
| Validación de formularios | Custom regex check | `zod.parseAsync()` | Casos edge, mensajes de error, type safety |
| Font loading | `<link>` en head o CDN | `next/font/google` | CLS prevention, subsetting automático, self-hosting |

**Insight clave:** MongoDB Atlas M0 tiene límite de 100 conexiones simultáneas. Sin el patrón de global caching, cada invocación serverless abre una nueva conexión — el límite se alcanza rápidamente en desarrollo con HMR.

---

## Common Pitfalls

### Pitfall 1: next-auth versión instalada incorrecta

**Qué pasa:** `npm install next-auth` instala v4.24.x (tag `latest`), no v5. La API es completamente distinta.
**Por qué ocurre:** El equipo de Auth.js todavía no movió v5 a `latest` en npm.
**Cómo evitar:** Instalar siempre con `npm install next-auth@5` o `npm install next-auth@beta`.
**Señal de alerta:** Si al importar `NextAuth` el config recibe `{ providers, callbacks }` directamente (no desestructurando `{ handlers, signIn, signOut, auth }`), se está usando v4.

### Pitfall 2: Middleware Edge Runtime + Mongoose

**Qué pasa:** Mongoose (Node.js runtime) no puede correr en el Edge Runtime donde vive el middleware de Next.js.
**Por qué ocurre:** El middleware usa Edge Runtime por defecto; mongoose requiere APIs de Node.js no disponibles en Edge.
**Cómo evitar:** El middleware SOLO usa `auth` de NextAuth (que funciona en Edge via JWT cookie). La lógica de DB (queries a MongoDB) va en Server Actions y Server Components — nunca en `middleware.ts`.
**Señal de alerta:** Error `mongoose is not defined` o `Cannot use 'import.meta' outside a module` en middleware.

### Pitfall 3: AUTH_SECRET no definido en produccion

**Qué pasa:** NextAuth v5 lanza `MissingSecretError` si `AUTH_SECRET` no está en env vars de producción.
**Por qué ocurre:** En desarrollo, NextAuth genera un secret temporal, pero en producción (Vercel) es obligatorio.
**Cómo evitar:** Generar con `openssl rand -base64 33` y agregar como variable de entorno en Vercel. En `.env.local` para desarrollo.
**Señal de alerta:** 500 en `/api/auth/session` en producción.

### Pitfall 4: src/ directory + components.json paths

**Qué pasa:** shadcn init asume `app/globals.css` sin `src/`, pero el proyecto usa `src/app/globals.css`.
**Por qué ocurre:** El flag `--src-dir` en create-next-app mueve todo a `src/`, pero shadcn puede generar paths incorrectos.
**Cómo evitar:** Al correr `npx shadcn@beta init`, especificar manualmente el path del CSS como `src/app/globals.css` y los aliases como `@/components`, `@/lib/utils`.
**Señal de alerta:** Componentes instalados en `components/ui/` en lugar de `src/components/ui/`.

### Pitfall 5: signIn() dentro de Server Action re-lanza la excepcion

**Qué pasa:** `signIn("credentials", { redirectTo: "/tma" })` dentro de un Server Action lanza un `NEXT_REDIRECT` error que Next.js usa internamente para hacer el redirect — si se atrapa con try/catch genérico, el redirect se bloquea.
**Por qué ocurre:** Next.js implementa `redirect()` como una excepción especial.
**Cómo evitar:** En el catch, re-lanzar todo excepto `AuthError`: `if (error instanceof AuthError) return { error }; throw error`.
**Señal de alerta:** El registro completa pero no redirige nunca a /tma.

### Pitfall 6: Tailwind v4 con clases de paleta custom

**Qué pasa:** Clases como `bg-brand-primary` no existen hasta definirlas en `@theme`.
**Por qué ocurre:** Tailwind v4 ya no lee `theme.extend.colors` de `tailwind.config.ts` — la config es CSS-first.
**Cómo evitar:** Definir `--color-brand-primary: #EA580C` en el bloque `@theme` del globals.css. Tailwind v4 genera automáticamente las clases `bg-brand-primary`, `text-brand-primary`, etc.

---

## Code Examples

### Mongoose User Model

```typescript
// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  email: string
  passwordHash: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
```

### Zod validation schemas

```typescript
// src/lib/validations.ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
```

### Footer component

```typescript
// src/components/Footer.tsx
export function Footer() {
  return (
    <footer className="w-full py-4 text-center text-sm text-brand-text/60">
      Desarrollado por{" "}
      <a
        href="https://drivadev.com.ar"
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-primary hover:text-brand-title font-medium transition-colors"
      >
        Driva Dev
      </a>
    </footer>
  )
}
```

---

## State of the Art

| Enfoque antiguo | Enfoque actual | Cuándo cambió | Impacto |
|----------------|----------------|---------------|---------|
| `pages/api/auth/[...nextauth].ts` + `authOptions` | `src/auth.ts` exportando `{ handlers, signIn, signOut, auth }` | NextAuth v5 (2024) | Rompe imports de v4 completamente |
| `export { default } from "next-auth/middleware"` | `export { auth as middleware } from "@/auth"` | NextAuth v5 | Middleware simplificado |
| `getServerSession(req, res, authOptions)` | `await auth()` | NextAuth v5 | API más simple en Server Components |
| `@tailwind base; @tailwind components; @tailwind utilities` | `@import "tailwindcss"` | Tailwind v4 | Una sola línea de import |
| `tailwind.config.ts theme.extend.colors` | `@theme { --color-X: value }` en globals.css | Tailwind v4 | Config CSS-first, sin archivo TS de config |
| `framer-motion` | `motion` (mismo paquete, renombrado) | motion v11 (2024) | El import cambia a `from "motion/react"` |

**Deprecado/obsoleto:**
- `NEXTAUTH_SECRET`: Reemplazado por `AUTH_SECRET` en v5 (pero `NEXTAUTH_SECRET` aún funciona como alias)
- `NEXTAUTH_URL`: Reemplazado por `AUTH_URL` (alias funcional mantenido)
- `withAuth` wrapper de `next-auth/middleware`: Removido en v5

---

## Assumptions Log

| # | Claim | Sección | Riesgo si está mal |
|---|-------|---------|-------------------|
| A1 | cult-ui TextureCard y TextureButton son compatibles con Tailwind v4 | Standard Stack | Podría requerir ajuste manual de estilos si cult-ui asume v3 |
| A2 | La colección `users` en MongoDB Atlas M0 admite índice único en `email` sin costo adicional | Don't Hand-Roll | Sin impacto funcional — índices siempre soportados en M0 |
| A3 | `motion` v12 (ex framer-motion) tiene imports estables desde `"motion/react"` | Standard Stack | Si el import cambió, ajustar a `"framer-motion"` como fallback |

---

## Open Questions

1. **¿Dónde colocar `auth.ts` con `src/` directory?**
   - Lo que sabemos: Next.js busca middleware en `src/middleware.ts`. El auth debe importarse como `@/auth`.
   - Lo que está claro: `src/auth.ts` + `@/` alias apuntando a `src/` = `@/auth` resuelve correctamente.
   - Recomendación: Colocar en `src/auth.ts`.

2. **¿Es necesario `@auth/mongodb-adapter` para Credentials Provider?**
   - Lo que sabemos: Los Credentials Provider no persisten usuarios en DB via adapter — gestionan sesión solo via JWT.
   - Conclusión: NO es necesario el adapter. Las consultas a MongoDB se hacen manualmente en `authorize`.

---

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|-------------|--------------|-----------|---------|----------|
| Node.js | Next.js 15 | ✓ | v24.15.0 | — |
| npm | package manager | ✓ | 11.12.1 | — |
| npx | create-next-app, shadcn CLI | ✓ | 11.12.1 | — |
| MongoDB Atlas | colección users | ✗ | — (externo) | Crear cuenta free en cloud.mongodb.com |
| Vercel | Deploy hosting | ✗ | — (externo) | npm run dev para desarrollo local |

**Dependencias faltantes sin fallback:**
- MongoDB Atlas M0: Requiere crear cluster y obtener `MONGODB_URI`. Sin esto no hay persistencia de usuarios. Bloqueante para producción, no para desarrollo si se usa URI local.

**Dependencias faltantes con fallback:**
- Vercel: No bloquea el desarrollo local. `npm run dev` funciona sin Vercel hasta deploy.

---

## Validation Architecture

### Test Framework

| Propiedad | Valor |
|-----------|-------|
| Framework | Vitest o Jest (no detectado — proyecto nuevo) |
| Config file | Ninguno — crear en Wave 0 |
| Quick run command | `npm test` (a configurar) |
| Full suite command | `npm run test:ci` (a configurar) |

> Proyecto nuevo — no existe infraestructura de tests. Wave 0 debe establecerla.

### Phase Requirements → Test Map

| Req ID | Comportamiento | Tipo de test | Comando automatizado | Archivo existe |
|--------|---------------|-------------|---------------------|----------------|
| AUTH-01 | Registro con email en allowlist crea usuario | integration | `npm test -- allowlist` | ❌ Wave 0 |
| AUTH-02 | Email fuera de allowlist → error específico | unit | `npm test -- registerUser.allowlist` | ❌ Wave 0 |
| AUTH-03 | Login con credenciales válidas retorna sesión | integration | `npm test -- auth.login` | ❌ Wave 0 |
| AUTH-04 | Password se guarda como hash (no plaintext) | unit | `npm test -- bcrypt.hash` | ❌ Wave 0 |
| AUTH-05 | Sesión persiste en cookie | manual | navegador — refrescar página | — |
| AUTH-06 | /tma sin sesión redirige a /login | integration | `npm test -- middleware` | ❌ Wave 0 |
| UI-01 | Paleta Driva Dev aplicada | visual/manual | Inspeccion browser | — |
| UI-02 | Poppins cargada correctamente | visual/manual | DevTools → fonts | — |
| UI-03 | Footer presente en todas las páginas | unit | `npm test -- Footer.render` | ❌ Wave 0 |
| UI-07 | Formularios /login y /register renderizan | unit | `npm test -- LoginForm RegisterForm` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `src/__tests__/actions/auth.register.test.ts` — cubre AUTH-01, AUTH-02, AUTH-04
- [ ] `src/__tests__/actions/auth.login.test.ts` — cubre AUTH-03
- [ ] `src/__tests__/middleware.test.ts` — cubre AUTH-06
- [ ] `src/__tests__/components/Footer.test.tsx` — cubre UI-03
- [ ] Configurar Vitest: `npm install -D vitest @vitejs/plugin-react` + `vitest.config.ts`

### Sampling Rate

- **Por commit de tarea:** `npm test -- --run`
- **Por merge de wave:** `npm test -- --run --reporter=verbose`
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

---

## Security Domain

### Applicable ASVS Categories

| Categoría ASVS | Aplica | Control estándar |
|---------------|--------|-----------------|
| V2 Authentication | si | NextAuth v5 Credentials + bcryptjs.compare |
| V3 Session Management | si | NextAuth v5 JWT en httpOnly cookie, `AUTH_SECRET` |
| V4 Access Control | si | Middleware con authorized callback + matcher |
| V5 Input Validation | si | zod.parseAsync en Server Actions |
| V6 Cryptography | si | bcryptjs con cost factor 12 — nunca SHA/MD5 manual |

### Known Threat Patterns

| Patrón | STRIDE | Mitigación estándar |
|--------|--------|---------------------|
| Password enumeration via timing | Information Disclosure | bcryptjs.compare siempre ejecuta (no short-circuit en "user not found") |
| Credential stuffing | Elevation of Privilege | Allowlist de 5 emails — ataque contra emails no registrables es inútil |
| CSRF en Server Actions | Tampering | Next.js 15 incluye protección CSRF automática en Server Actions |
| Session fixation | Elevation of Privilege | NextAuth rotates session token on sign-in |
| JWT secret expuesto | Information Disclosure | `AUTH_SECRET` solo en env vars — nunca en código |
| Plaintext passwords en logs | Information Disclosure | Solo pasar `passwordHash` — nunca loggear `password` |

---

## Sources

### Primary (HIGH confidence)

- `/websites/authjs_dev` via Context7 — Credentials Provider, middleware, session callbacks, environment variables
- `/vercel/next.js` via Context7 — Middleware, App Router font API, Tailwind v4 setup, create-next-app flags, Server Actions
- `/websites/mongoosejs` via Context7 — Connection caching para Next.js App Router y Lambda (patrón idéntico)
- `/shadcn-ui/ui` via Context7 — components.json structure, aliases

### Secondary (MEDIUM confidence)

- `https://www.cult-ui.com/docs/installation` via WebFetch — registry entry exacto para components.json [CITED: cult-ui.com/docs/installation]
- npm registry — versiones verificadas de todos los paquetes en esta sesión

### Tertiary (LOW confidence)

- WebSearch "bcryptjs vs bcrypt Vercel serverless 2024" — compatibilidad serverless verificada con issues de Next.js GitHub

---

## Project Constraints (desde CLAUDE.md)

| Directiva | Fuente | Acción requerida en plan |
|-----------|--------|--------------------------|
| Usar cult-ui TextureCard y TextureButton para cards/buttons | CLAUDE.md global | Instalar via `npx shadcn@beta add @cult-ui/texture-card @cult-ui/texture-button` |
| Usar `motion` para animaciones | CLAUDE.md global | `npm install motion` — usar `from "motion/react"` |
| Tailwind CSS v4 | CLAUDE.md global | `@import "tailwindcss"` + `@theme {}` — no tailwind.config.ts para colores |
| TypeScript strict mode | CLAUDE.md global | `"strict": true` en tsconfig.json |
| Dark mode first (global) vs Light mode only (proyecto) | CLAUDE.md global vs D-12 | **D-12 prevalece** — fondo #FFF7ED, NO dark mode en este proyecto |
| Footer "Desarrollado por Driva Dev" en todas las páginas | CLAUDE.md proyecto | Componente Footer en root layout |
| NO usar docxtemplater | CLAUDE.md proyecto | Fuera de scope Phase 1 — relevante en Phase 2 |
| NO almacenar archivos subidos | CLAUDE.md proyecto | Fuera de scope Phase 1 |
| Allowlist fija en código (5 emails) | CLAUDE.md proyecto | Hardcoded array en Server Action de registro |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versiones verificadas en npm registry en esta sesión
- Architecture (NextAuth v5 API): HIGH — verificado via Context7 contra authjs.dev
- Tailwind v4 setup: HIGH — verificado via Context7 contra Next.js docs
- cult-ui integration: MEDIUM — verificado via WebFetch del sitio oficial, pero compatibilidad v4 marcada como ASSUMED
- Pitfalls: HIGH para NextAuth/bcrypt; MEDIUM para cult-ui + Tailwind v4

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (librerías estables; NextAuth v5 puede salir de beta antes)
