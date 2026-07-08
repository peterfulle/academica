import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDevSession } from "@/server/auth/session";

export default async function AdminDashboardPage() {
  await requireDevSession("admin");

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Panel del administrador</CardTitle>
            <CardDescription>
              Fase 1: matrícula. Horarios, asistencia y notas se activan en las fases siguientes.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Años y cursos</CardTitle>
              <CardDescription>Crear el año escolar y los cursos antes de matricular alumnos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/admin/anios-cursos" />} nativeButton={false} variant="secondary">
                Gestionar años y cursos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matrícula</CardTitle>
              <CardDescription>Matricular alumnos, vincular apoderados, gestionar retiros.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/admin/matricula" />} nativeButton={false} variant="secondary">
                Ir a matrícula
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
