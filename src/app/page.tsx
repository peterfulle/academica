import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
              Login con RUT y contraseña — pendiente de conectar la autenticación.
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
            <CardTitle className="text-base">Sesión de desarrollo</CardTitle>
            <CardDescription>Mientras no hay login real, entra eligiendo colegio y usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/sesion" />} nativeButton={false} variant="secondary" className="w-full">
              Entrar a sesión de desarrollo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
