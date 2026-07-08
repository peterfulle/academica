import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";

export default function AdminDashboardPage() {
  return (
    <DashboardShell rol="admin">
      <Card>
        <CardHeader>
          <CardTitle>Panel del administrador</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Shell de Fase 0. Los módulos de matrícula, horarios, asistencia y notas se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
