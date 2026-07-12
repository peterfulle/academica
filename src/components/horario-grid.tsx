import { AsignarClaseDialog } from "@/components/asignar-clase-dialog";
import { Button } from "@/components/ui/button";
import { DIA_LABEL, DIAS_SEMANA, type DiaSemana } from "@/lib/horario";

type Bloque = { id: string; nombre: string; horaInicio: string; horaTermino: string };
type Clase = {
  id: string;
  bloqueHorarioId: string;
  diaSemana: DiaSemana;
  asignaturaNombre: string;
  /** Shown under the asignatura name — profesor's name in admin/alumno/apoderado views, curso in the profesor's own view. */
  subtitulo?: string | null;
};
type AsignaturaCursoOpcion = { id: string; label: string };

export function HorarioGrid({
  bloques,
  clases,
  editable = false,
  asignaturaCursoOpciones = [],
  asignarClaseAction,
  quitarClaseAction,
}: {
  bloques: Bloque[];
  clases: Clase[];
  editable?: boolean;
  asignaturaCursoOpciones?: AsignaturaCursoOpcion[];
  asignarClaseAction?: (formData: FormData) => void | Promise<void>;
  quitarClaseAction?: (formData: FormData) => void | Promise<void>;
}) {
  const claseEn = (bloqueId: string, dia: DiaSemana) =>
    clases.find((c) => c.bloqueHorarioId === bloqueId && c.diaSemana === dia);

  if (bloques.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin bloques de horario todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 border-b p-2 text-left text-xs text-muted-foreground">Bloque</th>
            {DIAS_SEMANA.map((dia) => (
              <th key={dia} className="border-b p-2 text-left text-xs text-muted-foreground">
                {DIA_LABEL[dia]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloques.map((bloque) => (
            <tr key={bloque.id}>
              <td className="border-b p-2 align-top">
                <div className="font-medium">{bloque.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {bloque.horaInicio}–{bloque.horaTermino}
                </div>
              </td>
              {DIAS_SEMANA.map((dia) => {
                const clase = claseEn(bloque.id, dia);
                return (
                  <td key={dia} className="min-w-32 border-b p-2 align-top">
                    {clase ? (
                      <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-2">
                        <span className="font-medium">{clase.asignaturaNombre}</span>
                        {clase.subtitulo && (
                          <span className="text-xs text-muted-foreground">{clase.subtitulo}</span>
                        )}
                        {editable && quitarClaseAction && (
                          <form action={quitarClaseAction}>
                            <input type="hidden" name="horarioClaseId" value={clase.id} />
                            <Button type="submit" variant="ghost" size="xs">
                              Quitar
                            </Button>
                          </form>
                        )}
                      </div>
                    ) : editable && asignarClaseAction ? (
                      <AsignarClaseDialog
                        bloqueHorarioId={bloque.id}
                        diaSemana={dia}
                        opciones={asignaturaCursoOpciones}
                        action={asignarClaseAction}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
