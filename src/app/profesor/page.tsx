import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ProfesorDashboardPage() {
  return (
    <DashboardShell rol="profesor">
      <Card>
        <CardHeader>
          <CardTitle>Panel del profesor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Shell de Fase 0. Cursos, horario, asistencia y notas se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
