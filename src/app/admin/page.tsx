import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDevSession } from "@/server/auth/session";

const MODULOS = [
  { href: "/admin/anios-cursos", titulo: "Años y cursos", descripcion: "Crear el año escolar y los cursos. Prerrequisito de matrícula y horarios." },
  { href: "/admin/matricula", titulo: "Matrícula", descripcion: "Matricular alumnos, vincular apoderados, gestionar retiros." },
  { href: "/admin/profesores", titulo: "Profesores", descripcion: "Crear profesores para asignarlos a asignaturas o como jefes de curso." },
  { href: "/admin/asignaturas", titulo: "Asignaturas", descripcion: "Catálogo de materias del colegio." },
  { href: "/admin/bloques-horario", titulo: "Bloques de horario", descripcion: "Plantilla de horario del colegio (se define una vez)." },
  { href: "/admin/horarios", titulo: "Horarios", descripcion: "Asignar asignaturas a un curso y armar su horario semanal." },
];

export default async function AdminDashboardPage() {
  await requireDevSession("admin");

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Panel del administrador</CardTitle>
            <CardDescription>Matrícula y horarios disponibles. Asistencia y notas se activan en las fases siguientes.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODULOS.map((m) => (
            <Card key={m.href}>
              <CardHeader>
                <CardTitle className="text-base">{m.titulo}</CardTitle>
                <CardDescription>{m.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button render={<Link href={m.href} />} nativeButton={false} variant="secondary">
                  Ir a {m.titulo.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
