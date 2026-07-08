import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { anioEscolar, curso } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { crearAlumnoConMatricula } from "../actions";

export default async function NuevoAlumnoPage() {
  const session = await requireDevSession("admin");

  const cursos = await withTenant(session.colegioId, (tx) =>
    tx
      .select({
        id: curso.id,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
        anio: anioEscolar.anio,
      })
      .from(curso)
      .innerJoin(anioEscolar, eq(anioEscolar.id, curso.anioEscolarId))
  );

  return (
    <DashboardShell rol="admin">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Nuevo alumno</CardTitle>
          <CardDescription>
            Matricula un alumno y vincula (o crea) su apoderado en un solo paso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cursos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cursos todavía. Crea un año escolar y un curso primero en{" "}
              <a className="underline" href="/admin/anios-cursos">
                Años y cursos
              </a>
              .
            </p>
          ) : (
            <form action={crearAlumnoConMatricula} className="flex flex-col gap-6">
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-sm font-medium">Datos del alumno</legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="alumnoRut">RUT</Label>
                  <Input id="alumnoRut" name="alumnoRut" placeholder="12.345.678-5" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="alumnoNombres">Nombres</Label>
                    <Input id="alumnoNombres" name="alumnoNombres" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="alumnoApellidos">Apellidos</Label>
                    <Input id="alumnoApellidos" name="alumnoApellidos" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="alumnoFechaNacimiento">Fecha de nacimiento</Label>
                  <Input id="alumnoFechaNacimiento" name="alumnoFechaNacimiento" type="date" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Curso</Label>
                  <Select name="cursoId" required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elige un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nivel} {c.paralelo} ({c.anio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-sm font-medium">Datos del apoderado</legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="apoderadoRut">RUT</Label>
                  <Input id="apoderadoRut" name="apoderadoRut" placeholder="12.345.678-5" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="apoderadoNombres">Nombres</Label>
                    <Input id="apoderadoNombres" name="apoderadoNombres" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="apoderadoApellidos">Apellidos</Label>
                    <Input id="apoderadoApellidos" name="apoderadoApellidos" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="apoderadoEmail">Email</Label>
                  <Input id="apoderadoEmail" name="apoderadoEmail" type="email" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Relación con el alumno</Label>
                  <Select name="tipoRelacion" required defaultValue="madre">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="madre">Madre</SelectItem>
                      <SelectItem value="padre">Padre</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si el RUT del apoderado ya existe en este colegio, se reutiliza su registro en vez de duplicarlo.
                </p>
              </fieldset>

              <Button type="submit">Matricular</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
