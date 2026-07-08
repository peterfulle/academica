import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { alumno, apoderado, apoderadoAlumno, curso, persona } from "@/server/db/schema";

export default async function ApoderadoDashboardPage() {
  const session = await requireDevSession("apoderado");

  const hijos = await withTenant(session.colegioId, (tx) =>
    tx
      .select({
        alumnoId: alumno.id,
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
      .where(eq(apoderado.usuarioId, session.usuarioId))
  );

  return (
    <DashboardShell rol="apoderado">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mis hijos</CardTitle>
            <CardDescription>Horario, asistencia y boletín se activan en las fases siguientes.</CardDescription>
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
            <CardContent>
              <Badge variant="outline">{hijo.tipoRelacion}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
