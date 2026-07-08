import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { alumno, curso, persona } from "@/server/db/schema";

export default async function AlumnoDashboardPage() {
  const session = await requireDevSession("alumno");

  const [datos] = await withTenant(session.colegioId, (tx) =>
    tx
      .select({
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
      })
      .from(alumno)
      .innerJoin(persona, eq(persona.id, alumno.personaId))
      .leftJoin(curso, eq(curso.id, alumno.cursoId))
      .where(eq(alumno.usuarioId, session.usuarioId))
  );

  return (
    <DashboardShell rol="alumno">
      <Card>
        <CardHeader>
          <CardTitle>{datos ? `${datos.nombres} ${datos.apellidos}` : "Panel del alumno"}</CardTitle>
          <CardDescription>
            {datos?.nivel ? `${datos.nivel} ${datos.paralelo}` : "Sin curso asignado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Horario, asistencia y notas se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
