# Academica

Plataforma de gestión académica para colegios en Chile — Next.js + TypeScript + Drizzle/Postgres con Row-Level Security multi-tenant, desplegada en Render.

## Desarrollo local

Requiere Postgres corriendo localmente (ver `.env.example` para las variables de conexión: `DATABASE_URL`/`APP_DATABASE_URL` para dev, `TEST_DATABASE_URL`/`TEST_APP_DATABASE_URL` para tests).

```bash
npm install
npm run db:push       # aplica el schema de Drizzle
npm run dev           # http://localhost:3000
npm test              # suite de tests, incluye aislamiento de tenants (RLS)
```

## Arquitectura

- **App:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, desplegada como web service en Render.
- **Datos:** PostgreSQL (Render) + Drizzle ORM. Multi-tenant vía `colegio_id` + Row-Level Security — ver `src/server/db/rls-policies.sql`.
- **Tests:** `tests/tenant-isolation.test.ts` es la suite de regresión que prueba que RLS realmente aísla los datos entre colegios.

Ver el plan de fases y decisiones de arquitectura en el historial de planificación del proyecto.
