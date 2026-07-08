import { eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROL_LABEL } from "@/lib/nav";
import { db, withTenant } from "@/server/db/client";
import { colegio, usuario } from "@/server/db/schema";
import { iniciarSesionDev } from "./actions";

export default async function SesionPage({
  searchParams,
}: {
  searchParams: Promise<{ colegioId?: string }>;
}) {
  const { colegioId } = await searchParams;
  const colegios = await db.select().from(colegio);

  if (!colegioId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sesión de desarrollo</h1>
            <p className="text-sm text-muted-foreground">
              Reemplaza el login real mientras no está construido. Elige un colegio.
            </p>
          </div>
          {colegios.map((c) => (
            <Button
              key={c.id}
              render={<Link href={`/sesion?colegioId=${c.id}`} />}
              nativeButton={false}
              variant="secondary"
              className="justify-start"
            >
              {c.nombre}
            </Button>
          ))}
          {colegios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay colegios todavía. Corre <code>npm run db:seed</code>.
            </p>
          )}
        </div>
      </div>
    );
  }

  const colegioActivo = colegios.find((c) => c.id === colegioId);
  const usuarios = colegioActivo
    ? await withTenant(colegioId, (tx) => tx.select().from(usuario).where(eq(usuario.activo, true)))
    : [];

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {colegioActivo?.nombre ?? "Colegio no encontrado"}
          </h1>
          <p className="text-sm text-muted-foreground">Elige con qué usuario entrar.</p>
        </div>
        {usuarios.map((u) => (
          <form key={u.id} action={iniciarSesionDev.bind(null, colegioId, u.id, u.rol)}>
            <Button type="submit" variant="secondary" className="w-full justify-between">
              <span>{u.email}</span>
              <Badge variant="outline">{ROL_LABEL[u.rol]}</Badge>
            </Button>
          </form>
        ))}
        {colegioActivo && usuarios.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este colegio no tiene usuarios todavía. Corre <code>npm run db:seed</code> o matricula un alumno con
            apoderado.
          </p>
        )}
        <Link href="/sesion" className="text-sm text-muted-foreground underline">
          Elegir otro colegio
        </Link>
      </div>
    </div>
  );
}
