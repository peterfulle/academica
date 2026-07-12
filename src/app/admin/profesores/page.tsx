import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRut } from "@/lib/rut";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { persona, profesor } from "@/server/db/schema";
import { crearProfesorAction } from "./actions";

export default async function ProfesoresPage() {
  const session = await requireDevSession("admin");

  const profesores = await withTenant(session.colegioId, (tx) =>
    tx
      .select({
        id: profesor.id,
        rut: persona.rut,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        especialidad: profesor.especialidad,
      })
      .from(profesor)
      .innerJoin(persona, eq(persona.id, profesor.personaId))
  );

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profesores</CardTitle>
            <CardDescription>Para asignarlos como profesor de asignatura o jefe de curso.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo profesor</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={crearProfesorAction} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input id="rut" name="rut" placeholder="12.345.678-5" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input id="nombres" name="nombres" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input id="apellidos" name="apellidos" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input id="especialidad" name="especialidad" placeholder="Matemática" />
                </div>
                <Button type="submit" className="mt-2">
                  Crear profesor
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Existentes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {profesores.length === 0 && <p className="text-sm text-muted-foreground">Sin profesores todavía.</p>}
              {profesores.map((p) => (
                <div key={p.id} className="flex flex-col rounded-md border p-2 text-sm">
                  <span className="font-medium">
                    {p.nombres} {p.apellidos}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRut(p.rut)}
                    {p.especialidad ? ` — ${p.especialidad}` : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
