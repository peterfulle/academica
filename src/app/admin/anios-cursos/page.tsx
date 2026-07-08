import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { anioEscolar, curso } from "@/server/db/schema";
import { crearAnioEscolar, crearCurso } from "./actions";

export default async function AniosCursosPage() {
  const session = await requireDevSession("admin");

  const [anios, cursos] = await withTenant(session.colegioId, async (tx) => [
    await tx.select().from(anioEscolar).orderBy(anioEscolar.anio),
    await tx.select().from(curso),
  ]);

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Años y cursos</CardTitle>
            <CardDescription>Prerrequisito para matricular alumnos.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo año escolar</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={crearAnioEscolar} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="anio">Año</Label>
                  <Input id="anio" name="anio" type="number" placeholder="2026" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaInicio">Fecha inicio</Label>
                  <Input id="fechaInicio" name="fechaInicio" type="date" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaTermino">Fecha término</Label>
                  <Input id="fechaTermino" name="fechaTermino" type="date" required />
                </div>
                <Button type="submit" className="mt-2">
                  Crear año escolar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo curso</CardTitle>
            </CardHeader>
            <CardContent>
              {anios.length === 0 ? (
                <p className="text-sm text-muted-foreground">Primero crea un año escolar.</p>
              ) : (
                <form action={crearCurso} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Año escolar</Label>
                    <Select name="anioEscolarId" required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige un año" />
                      </SelectTrigger>
                      <SelectContent>
                        {anios.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.anio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nivel">Nivel</Label>
                    <Input id="nivel" name="nivel" placeholder="4to Básico" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="paralelo">Paralelo</Label>
                    <Input id="paralelo" name="paralelo" placeholder="A" required />
                  </div>
                  <Button type="submit" className="mt-2">
                    Crear curso
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Años escolares existentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {anios.length === 0 && <p className="text-sm text-muted-foreground">Sin años escolares todavía.</p>}
            {anios.map((a) => (
              <div key={a.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.anio}</span>
                  <Badge variant="outline">{a.estado}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cursos
                    .filter((c) => c.anioEscolarId === a.id)
                    .map((c) => (
                      <Badge key={c.id} variant="secondary">
                        {c.nivel} {c.paralelo}
                      </Badge>
                    ))}
                  {cursos.filter((c) => c.anioEscolarId === a.id).length === 0 && (
                    <span className="text-sm text-muted-foreground">Sin cursos</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
