// El middleware en src/middleware.ts gestiona el redirect de /
// → /tma si hay sesión activa
// → /login si no hay sesión
// Esta página nunca se renderiza en condiciones normales.
export default function RootPage() {
  return null
}
