import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ApoderadoDashboardPage() {
  return (
    <DashboardShell rol="apoderado">
      <Card>
        <CardHeader>
          <CardTitle>Panel del apoderado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Shell de Fase 0. Datos de tus hijos, horario, asistencia y boletín se activan en las fases siguientes.
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
