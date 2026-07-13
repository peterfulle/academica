# Academica

Plataforma de gestión académica para colegios en Chile — Next.js + TypeScript + Drizzle/Postgres con Row-Level Security multi-tenant, desplegada en Render.

**Producción:** https://academica-u7ey.onrender.com

**Estado:** Fase 0 (fundación multi-tenant) y Fase 1 (matrícula) y Fase 2 (horarios) completas. Login real (RUT + contraseña) todavía no existe — ver "Sesión de desarrollo" abajo.

## Desarrollo local

Requiere Postgres corriendo localmente (ver `.env.example` para las variables de conexión: `DATABASE_URL`/`APP_DATABASE_URL` para dev, `TEST_DATABASE_URL`/`TEST_APP_DATABASE_URL` para tests — cada rol de app debe ser un usuario **no superuser y no dueño de tabla**, o RLS no se aplica).

```bash
npm install
npm run db:push               # aplica el schema de Drizzle
psql -d academi_dev -f src/server/db/rls-policies.sql   # aplica RLS (ver nota abajo)
npm run db:seed               # 2 colegios piloto mínimos (solo admin)
npm run db:seed:sandbox       # 1 colegio con datos ricos: cursos, profesores, horario, alumnos
npm run dev                   # http://localhost:3000
npm test                      # suite de tests, incluye aislamiento de tenants (RLS)
```

**Importante:** después de cualquier `drizzle-kit push`, hay que volver a correr `rls-policies.sql`. `drizzle-kit` gestiona el flag `relrowsecurity` según si el schema declara `.enableRLS()` (ya lo declaramos en todas las tablas tenant-scoped), pero **no** gestiona `FORCE ROW LEVEL SECURITY` ni las políticas mismas — esas solo viven en `rls-policies.sql`.

## Sesión de desarrollo

No hay autenticación real todavía. Entra por `/sesion`: eligiendo un colegio y luego un usuario sembrado, se setea una cookie sin firmar con `{colegioId, usuarioId, rol}` (ver `src/server/auth/session.ts`). Está diseñado para que reemplazarlo por auth real (candidato: Better-Auth) sea un cambio acotado a ese archivo.

## Arquitectura

- **App:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (Base UI), desplegada como web service en Render. Sin tRPC todavía — mutaciones vía Server Actions, lecturas directas en Server Components.
- **Datos:** PostgreSQL (Render) + Drizzle ORM. Multi-tenant vía `colegio_id` + Row-Level Security — ver `src/server/db/schema.ts` y `src/server/db/rls-policies.sql`. Toda lectura/escritura tenant-scoped pasa por `withTenant()` en `src/server/db/client.ts`, nunca por el cliente `db` sin ámbito.
- **Servicios:** lógica de negocio testeable en `src/server/services/*` (matrícula, horario, profesor, persona), separada de las Server Actions que solo hacen auth + parseo + llamada al servicio.
- **Tests:** `tests/tenant-isolation*.test.ts` prueban que RLS realmente aísla los datos entre colegios — cada uno falla si se desactiva RLS y pasa si está activa.

Ver el plan de fases y decisiones de arquitectura en el historial de planificación del proyecto.
