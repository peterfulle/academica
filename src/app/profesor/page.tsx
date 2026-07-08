import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDevSession } from "@/server/auth/session";

export default async function ProfesorDashboardPage() {
  await requireDevSession("profesor");

  return (
    <DashboardShell rol="profesor">
      <Card>
        <CardHeader>
          <CardTitle>Panel del profesor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cursos, horario, asistencia y notas se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
