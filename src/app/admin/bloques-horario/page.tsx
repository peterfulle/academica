import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { bloqueHorario } from "@/server/db/schema";
import { crearBloqueHorario } from "./actions";

export default async function BloquesHorarioPage() {
  const session = await requireDevSession("admin");

  const bloques = (await withTenant(session.colegioId, (tx) => tx.select().from(bloqueHorario))).sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio)
  );

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bloques de horario</CardTitle>
            <CardDescription>
              Plantilla de horario del colegio (se define una vez, se reutiliza los 5 días y en todos los cursos).
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo bloque</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={crearBloqueHorario} className="flex flex-col gap-3 sm:max-w-md">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" placeholder="Bloque 1" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="horaInicio">Hora inicio</Label>
                  <Input id="horaInicio" name="horaInicio" type="time" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="horaTermino">Hora término</Label>
                  <Input id="horaTermino" name="horaTermino" type="time" required />
                </div>
              </div>
              <Button type="submit" className="mt-2">
                Crear bloque
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bloques existentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {bloques.length === 0 && <p className="text-sm text-muted-foreground">Sin bloques todavía.</p>}
            {bloques.map((b) => (
              <Badge key={b.id} variant="secondary">
                {b.nombre} ({b.horaInicio}–{b.horaTermino})
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
