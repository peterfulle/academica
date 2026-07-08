import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRut } from "@/lib/rut";
import { requireDevSession } from "@/server/auth/session";
import { withTenant } from "@/server/db/client";
import { alumno, curso, matricula, persona } from "@/server/db/schema";
import { retirarAlumnoAction } from "./actions";

export default async function MatriculaPage() {
  const session = await requireDevSession("admin");

  const matriculas = await withTenant(session.colegioId, (tx) =>
    tx
      .select({
        matriculaId: matricula.id,
        estado: matricula.estado,
        fechaMatricula: matricula.fechaMatricula,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        rut: persona.rut,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
      })
      .from(matricula)
      .innerJoin(alumno, eq(alumno.id, matricula.alumnoId))
      .innerJoin(persona, eq(persona.id, alumno.personaId))
      .innerJoin(curso, eq(curso.id, matricula.cursoId))
      .orderBy(desc(matricula.fechaMatricula))
  );

  return (
    <DashboardShell rol="admin">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Matrícula</CardTitle>
              <CardDescription>Alumnos matriculados en este colegio.</CardDescription>
            </div>
            <Button render={<Link href="/admin/matricula/nuevo" />} nativeButton={false}>
              Nuevo alumno
            </Button>
          </CardHeader>
          <CardContent>
            {matriculas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alumnos matriculados todavía.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha matrícula</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matriculas.map((m) => (
                    <TableRow key={m.matriculaId}>
                      <TableCell>
                        {m.nombres} {m.apellidos}
                      </TableCell>
                      <TableCell>{formatRut(m.rut)}</TableCell>
                      <TableCell>
                        {m.nivel} {m.paralelo}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.estado === "vigente" ? "default" : "outline"}>{m.estado}</Badge>
                      </TableCell>
                      <TableCell>{m.fechaMatricula}</TableCell>
                      <TableCell>
                        {m.estado === "vigente" && (
                          <form action={retirarAlumnoAction}>
                            <input type="hidden" name="matriculaId" value={m.matriculaId} />
                            <Button type="submit" variant="ghost" size="sm">
                              Retirar
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
