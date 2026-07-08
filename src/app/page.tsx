import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Previews de los 4 dashboards por rol — solo para desarrollo local mientras
// no existe autenticación real (Fase 0 aún no conecta Supabase Auth).
const ROL_PREVIEWS = [
  { href: "/admin", label: "Administrador" },
  { href: "/profesor", label: "Profesor" },
  { href: "/apoderado", label: "Apoderado" },
  { href: "/alumno", label: "Alumno" },
];

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Academica</h1>
          <p className="text-sm text-muted-foreground">Gestión académica para colegios</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <CardDescription>
              Login con RUT y contraseña — pendiente de conectar a Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rut">RUT</Label>
                <Input id="rut" name="rut" placeholder="12.345.678-5" disabled />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" disabled />
              </div>
              <Button type="submit" disabled className="w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista previa (Fase 0, dev)</CardTitle>
            <CardDescription>Sin sesión real todavía — accede directo al shell de cada rol.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ROL_PREVIEWS.map((rol) => (
              <Button key={rol.href} render={<Link href={rol.href} />} variant="secondary" size="sm">
                {rol.label} <Badge variant="outline">preview</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
