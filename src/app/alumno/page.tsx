import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";

export default function AlumnoDashboardPage() {
  return (
    <DashboardShell rol="alumno">
      <Card>
        <CardHeader>
          <CardTitle>Panel del alumno</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Shell de Fase 0. Horario, asistencia y notas se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
