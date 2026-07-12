import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { HorarioGrid } from "@/components/horario-grid";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { alumno, apoderado, apoderadoAlumno, curso, persona } from "@/server/db/schema";
import { obtenerBloques, obtenerClasesDeCurso } from "@/server/services/horario";

export default async function ApoderadoDashboardPage() {
  const session = await requireDevSession("apoderado");

  const [hijos, bloques] = await withTenant(session.colegioId, async (tx) => [
    await tx
      .select({
        alumnoId: alumno.id,
        cursoId: alumno.cursoId,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
        tipoRelacion: apoderadoAlumno.tipoRelacion,
      })
      .from(apoderado)
      .innerJoin(apoderadoAlumno, eq(apoderadoAlumno.apoderadoId, apoderado.id))
      .innerJoin(alumno, eq(alumno.id, apoderadoAlumno.alumnoId))
      .innerJoin(persona, eq(persona.id, alumno.personaId))
      .leftJoin(curso, eq(curso.id, alumno.cursoId))
      .where(eq(apoderado.usuarioId, session.usuarioId)),
    await obtenerBloques(tx),
  ]);

  const clasesPorAlumno = await withTenant(session.colegioId, async (tx) => {
    const entries = await Promise.all(
      hijos
        .filter((hijo) => hijo.cursoId)
        .map(async (hijo) => [hijo.alumnoId, await obtenerClasesDeCurso(tx, hijo.cursoId!)] as const)
    );
    return new Map(entries);
  });

  return (
    <DashboardShell rol="apoderado">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mis hijos</CardTitle>
            <CardDescription>Asistencia y boletín se activan en las fases siguientes.</CardDescription>
          </CardHeader>
        </Card>

        {hijos.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No tienes alumnos vinculados todavía.
            </CardContent>
          </Card>
        )}

        {hijos.map((hijo) => (
          <Card key={hijo.alumnoId}>
            <CardHeader>
              <CardTitle className="text-base">
                {hijo.nombres} {hijo.apellidos}
              </CardTitle>
              <CardDescription>
                {hijo.nivel ? `${hijo.nivel} ${hijo.paralelo}` : "Sin curso asignado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Badge variant="outline">{hijo.tipoRelacion}</Badge>
              {hijo.cursoId && (
                <HorarioGrid
                  bloques={bloques}
                  clases={(clasesPorAlumno.get(hijo.alumnoId) ?? []).map((c) => ({
                    id: c.id,
                    bloqueHorarioId: c.bloqueHorarioId,
                    diaSemana: c.diaSemana,
                    asignaturaNombre: c.asignaturaNombre,
                    subtitulo: c.profesorNombres ? `${c.profesorNombres} ${c.profesorApellidos}` : null,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
