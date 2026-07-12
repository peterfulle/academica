import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { asignatura } from "@/server/db/schema";
import { crearAsignatura } from "./actions";

export default async function AsignaturasPage() {
  const session = await requireDevSession("admin");

  const asignaturas = await withTenant(session.colegioId, (tx) =>
    tx.select().from(asignatura).orderBy(asignatura.nombre)
  );

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asignaturas</CardTitle>
            <CardDescription>Catálogo de materias del colegio, para asignar a cursos en Horarios.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva asignatura</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={crearAsignatura} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" placeholder="Matemática" required />
                </div>
                <Button type="submit" className="mt-2">
                  Crear asignatura
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Existentes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {asignaturas.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin asignaturas todavía.</p>
              )}
              {asignaturas.map((a) => (
                <span key={a.id} className="rounded-md border px-2.5 py-1 text-sm">
                  {a.nombre}
                </span>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
