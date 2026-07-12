import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { HorarioGrid } from "@/components/horario-grid";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { alumno, curso, persona } from "@/server/db/schema";
import { obtenerBloques, obtenerClasesDeCurso } from "@/server/services/horario";

export default async function AlumnoDashboardPage() {
  const session = await requireDevSession("alumno");

  const [[datos], bloques] = await withTenant(session.colegioId, async (tx) => [
    await tx
      .select({
        cursoId: alumno.cursoId,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
      })
      .from(alumno)
      .innerJoin(persona, eq(persona.id, alumno.personaId))
      .leftJoin(curso, eq(curso.id, alumno.cursoId))
      .where(eq(alumno.usuarioId, session.usuarioId)),
    await obtenerBloques(tx),
  ]);

  const clases = datos?.cursoId
    ? await withTenant(session.colegioId, (tx) => obtenerClasesDeCurso(tx, datos.cursoId!))
    : [];

  return (
    <DashboardShell rol="alumno">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{datos ? `${datos.nombres} ${datos.apellidos}` : "Panel del alumno"}</CardTitle>
            <CardDescription>
              {datos?.nivel ? `${datos.nivel} ${datos.paralelo}` : "Sin curso asignado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Asistencia y notas se activan en las fases siguientes.</CardContent>
        </Card>

        {datos?.cursoId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horario</CardTitle>
            </CardHeader>
            <CardContent>
              <HorarioGrid
                bloques={bloques}
                clases={clases.map((c) => ({
                  id: c.id,
                  bloqueHorarioId: c.bloqueHorarioId,
                  diaSemana: c.diaSemana,
                  asignaturaNombre: c.asignaturaNombre,
                  subtitulo: c.profesorNombres ? `${c.profesorNombres} ${c.profesorApellidos}` : null,
                }))}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
