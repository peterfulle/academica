import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { HorarioGrid } from "@/components/horario-grid";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { profesor } from "@/server/db/schema";
import { obtenerBloques, obtenerClasesDeProfesor } from "@/server/services/horario";

export default async function ProfesorDashboardPage() {
  const session = await requireDevSession("profesor");

  const [[profesorRow], bloques] = await withTenant(session.colegioId, async (tx) => [
    await tx.select().from(profesor).where(eq(profesor.usuarioId, session.usuarioId)),
    await obtenerBloques(tx),
  ]);

  const clases = profesorRow
    ? await withTenant(session.colegioId, (tx) => obtenerClasesDeProfesor(tx, profesorRow.id))
    : [];

  return (
    <DashboardShell rol="profesor">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Panel del profesor</CardTitle>
            <CardDescription>Asistencia y notas se activan en las fases siguientes.</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mi horario</CardTitle>
          </CardHeader>
          <CardContent>
            {!profesorRow ? (
              <p className="text-sm text-muted-foreground">No estás vinculado a un registro de profesor todavía.</p>
            ) : (
              <HorarioGrid
                bloques={bloques}
                clases={clases.map((c) => ({
                  id: c.id,
                  bloqueHorarioId: c.bloqueHorarioId,
                  diaSemana: c.diaSemana,
                  asignaturaNombre: c.asignaturaNombre,
                  subtitulo: `${c.cursoNivel} ${c.cursoParalelo}`,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
