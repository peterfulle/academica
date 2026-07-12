"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DiaSemana } from "@/lib/horario";

type Opcion = { id: string; label: string };

export function AsignarClaseDialog({
  bloqueHorarioId,
  diaSemana,
  opciones,
  action,
}: {
  bloqueHorarioId: string;
  diaSemana: DiaSemana;
  opciones: Opcion[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="h-full w-full" />}>+</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar clase</DialogTitle>
        </DialogHeader>
        <form action={action} onSubmit={() => setOpen(false)} className="flex flex-col gap-3">
          <input type="hidden" name="bloqueHorarioId" value={bloqueHorarioId} />
          <input type="hidden" name="diaSemana" value={diaSemana} />
          <Select name="asignaturaCursoId" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una asignatura" />
            </SelectTrigger>
            <SelectContent>
              {opciones.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="submit" disabled={opciones.length === 0}>
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
