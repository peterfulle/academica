import { eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { HorarioGrid } from "@/components/horario-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { anioEscolar, asignatura, asignaturaCurso, curso, persona, profesor } from "@/server/db/schema";
import { obtenerBloques, obtenerClasesDeCurso } from "@/server/services/horario";
import { asignarClaseAction, crearAsignaturaCursoAction, quitarClaseAction } from "./actions";

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ cursoId?: string }>;
}) {
  const session = await requireDevSession("admin");
  const { cursoId } = await searchParams;

  const [cursos, asignaturas, profesores, bloquesOrdenados] = await withTenant(session.colegioId, async (tx) => [
    await tx
      .select({ id: curso.id, nivel: curso.nivel, paralelo: curso.paralelo, anio: anioEscolar.anio })
      .from(curso)
      .innerJoin(anioEscolar, eq(anioEscolar.id, curso.anioEscolarId)),
    await tx.select().from(asignatura).orderBy(asignatura.nombre),
    await tx
      .select({ id: profesor.id, nombres: persona.nombres, apellidos: persona.apellidos })
      .from(profesor)
      .innerJoin(persona, eq(persona.id, profesor.personaId)),
    await obtenerBloques(tx),
  ]);

  const cursoActivo = cursos.find((c) => c.id === cursoId);

  const [asignaturasCurso, clases] = cursoActivo
    ? await withTenant(session.colegioId, async (tx) => [
        await tx
          .select({
            id: asignaturaCurso.id,
            asignaturaId: asignaturaCurso.asignaturaId,
            asignaturaNombre: asignatura.nombre,
            profesorId: asignaturaCurso.profesorId,
            horasSemanales: asignaturaCurso.horasSemanales,
            profesorNombres: persona.nombres,
            profesorApellidos: persona.apellidos,
          })
          .from(asignaturaCurso)
          .innerJoin(asignatura, eq(asignatura.id, asignaturaCurso.asignaturaId))
          .leftJoin(profesor, eq(profesor.id, asignaturaCurso.profesorId))
          .leftJoin(persona, eq(persona.id, profesor.personaId))
          .where(eq(asignaturaCurso.cursoId, cursoActivo.id)),
        await obtenerClasesDeCurso(tx, cursoActivo.id),
      ])
    : [[], []];

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
            <CardDescription>Elige un curso para asignar sus asignaturas y armar su horario semanal.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {cursos.map((c) => (
              <Button
                key={c.id}
                render={<Link href={`/admin/horarios?cursoId=${c.id}`} />}
                nativeButton={false}
                variant={c.id === cursoActivo?.id ? "default" : "secondary"}
                size="sm"
              >
                {c.nivel} {c.paralelo} ({c.anio})
              </Button>
            ))}
            {cursos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay cursos todavía. Crea uno en{" "}
                <Link className="underline" href="/admin/anios-cursos">
                  Años y cursos
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>

        {cursoActivo && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Asignaturas de {cursoActivo.nivel} {cursoActivo.paralelo}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {asignaturasCurso.map((ac) => (
                    <Badge key={ac.id} variant="secondary">
                      {ac.asignaturaNombre}
                      {ac.profesorNombres ? ` — ${ac.profesorNombres} ${ac.profesorApellidos}` : ""}
                      {ac.horasSemanales ? ` (${ac.horasSemanales}h)` : ""}
                    </Badge>
                  ))}
                  {asignaturasCurso.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin asignaturas asignadas todavía.</p>
                  )}
                </div>

                {asignaturas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay asignaturas en el catálogo. Crea una en{" "}
                    <Link className="underline" href="/admin/asignaturas">
                      Asignaturas
                    </Link>
                    .
                  </p>
                ) : (
                  <form action={crearAsignaturaCursoAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="cursoId" value={cursoActivo.id} />
                    <div className="flex flex-col gap-1.5">
                      <Label>Asignatura</Label>
                      <Select name="asignaturaId" required>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Elige una" />
                        </SelectTrigger>
                        <SelectContent>
                          {asignaturas.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Profesor</Label>
                      <Select name="profesorId">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {profesores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombres} {p.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="horasSemanales">Horas/semana</Label>
                      <Input id="horasSemanales" name="horasSemanales" type="number" min="1" className="w-28" />
                    </div>
                    <Button type="submit">Agregar</Button>
                  </form>
                )}
                {profesores.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin profesores todavía — puedes dejar la asignatura sin profesor, o crear uno en{" "}
                    <Link className="underline" href="/admin/profesores">
                      Profesores
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Horario semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <HorarioGrid
                  bloques={bloquesOrdenados}
                  clases={clases.map((c) => ({
                    id: c.id,
                    bloqueHorarioId: c.bloqueHorarioId,
                    diaSemana: c.diaSemana,
                    asignaturaNombre: c.asignaturaNombre,
                    subtitulo: c.profesorNombres ? `${c.profesorNombres} ${c.profesorApellidos}` : null,
                  }))}
                  editable
                  asignaturaCursoOpciones={asignaturasCurso.map((ac) => ({
                    id: ac.id,
                    label: ac.profesorNombres ? `${ac.asignaturaNombre} — ${ac.profesorNombres}` : ac.asignaturaNombre,
                  }))}
                  asignarClaseAction={asignarClaseAction}
                  quitarClaseAction={quitarClaseAction}
                />
                {bloquesOrdenados.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Crea los bloques de horario del colegio en{" "}
                    <Link className="underline" href="/admin/bloques-horario">
                      Bloques de horario
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
