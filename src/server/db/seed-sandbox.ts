import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, withTenant } from "./client";
import { anioEscolar, asignatura, bloqueHorario, colegio, curso, usuario } from "./schema";
import { asignarAsignaturaCurso, asignarClase } from "../services/horario";
import { matricularAlumno } from "../services/matricula";
import { crearProfesor } from "../services/profesor";

/**
 * Rich, realistic demo colegio — 3 cursos across niveles, 6 profesores, 6
 * asignaturas, a full week of bloques, every curso's timetable filled, and
 * ~6 alumnos matriculados (with apoderados) per curso. Meant to be clicked
 * through in the browser to see every Fase 0-2 feature with real-looking
 * data, unlike the sparse Colegio Piloto Uno/Dos fixtures. Idempotent at the
 * colegio level: if "Colegio Sandbox" already exists, this exits without
 * touching it (rerunning to top up an existing sandbox is not supported —
 * delete the colegio row first if you want a clean rebuild).
 */

const NOMBRE_COLEGIO = "Colegio Sandbox";

const PROFESORES = [
  { nombres: "Javiera", apellidos: "Muñoz Soto", especialidad: "Matemática" },
  { nombres: "Ignacio", apellidos: "Rojas Pérez", especialidad: "Lenguaje" },
  { nombres: "Camila", apellidos: "Fernández Díaz", especialidad: "Ciencias Naturales" },
  { nombres: "Matías", apellidos: "González Silva", especialidad: "Historia y Geografía" },
  { nombres: "Fernanda", apellidos: "Torres Vidal", especialidad: "Inglés" },
  { nombres: "Diego", apellidos: "Castro Bravo", especialidad: "Educación Física" },
] as const;

const ASIGNATURAS = PROFESORES.map((p) => p.especialidad);

const BLOQUES = [
  { nombre: "Bloque 1", horaInicio: "08:00", horaTermino: "08:45" },
  { nombre: "Bloque 2", horaInicio: "08:45", horaTermino: "09:30" },
  { nombre: "Bloque 3", horaInicio: "09:45", horaTermino: "10:30" },
  { nombre: "Bloque 4", horaInicio: "10:30", horaTermino: "11:15" },
  { nombre: "Bloque 5", horaInicio: "11:30", horaTermino: "12:15" },
  { nombre: "Bloque 6", horaInicio: "12:15", horaTermino: "13:00" },
];

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"] as const;

const CURSOS = [
  {
    nivel: "1ro Básico",
    paralelo: "A",
    anioNacimientoAprox: 2019,
    alumnos: ["Martina Sepúlveda", "Benjamín Araya", "Josefa Contreras", "Vicente Morales", "Antonia Reyes", "Maximiliano Fuentes"],
  },
  {
    nivel: "4to Básico",
    paralelo: "A",
    anioNacimientoAprox: 2016,
    alumnos: ["Emilia Vargas", "Agustín Herrera", "Valentina Soto", "Joaquín Pizarro", "Isidora Cárcamo", "Tomás Espinoza"],
  },
  {
    nivel: "1ro Medio",
    paralelo: "A",
    anioNacimientoAprox: 2011,
    alumnos: ["Constanza Bravo", "Cristóbal Navarro", "Fernanda Ortiz", "Sebastián Lagos", "Catalina Ibáñez", "Nicolás Paredes"],
  },
];

let rutCounter = 20111222;
function computeDv(body: string): string {
  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (sum % 11);
  if (r === 11) return "0";
  if (r === 10) return "K";
  return String(r);
}
function nextRut(): string {
  const body = String(rutCounter++);
  return body + computeDv(body);
}

function splitNombre(nombreCompleto: string): { nombres: string; apellidos: string } {
  const [nombres, ...resto] = nombreCompleto.split(" ");
  return { nombres, apellidos: resto.join(" ") };
}

function slug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

async function seedSandbox() {
  const [existing] = await db.select().from(colegio).where(eq(colegio.nombre, NOMBRE_COLEGIO));
  if (existing) {
    console.log(`"${NOMBRE_COLEGIO}" ya existe (id ${existing.id}) — no se vuelve a sembrar.`);
    return;
  }

  const [colegioRow] = await db.insert(colegio).values({ nombre: NOMBRE_COLEGIO }).returning();
  console.log(`creado: ${NOMBRE_COLEGIO} (${colegioRow.id})`);

  await withTenant(colegioRow.id, async (tx) => {
    await tx.insert(usuario).values({
      colegioId: colegioRow.id,
      authUserId: randomUUID(),
      rol: "admin",
      email: `admin@${slug(NOMBRE_COLEGIO)}.cl`,
    });
    console.log("  admin creado");

    const [anioRow] = await tx
      .insert(anioEscolar)
      .values({ colegioId: colegioRow.id, anio: 2026, fechaInicio: "2026-03-02", fechaTermino: "2026-12-18", estado: "activo" })
      .returning();
    console.log(`  año escolar 2026 creado`);

    const profesorIdByEspecialidad = new Map<string, string>();
    for (const p of PROFESORES) {
      const profesorRow = await crearProfesor(tx, {
        colegioId: colegioRow.id,
        rut: nextRut(),
        nombres: p.nombres,
        apellidos: p.apellidos,
        email: `${slug(p.nombres)}.${slug(p.apellidos)}@${slug(NOMBRE_COLEGIO)}.cl`,
        especialidad: p.especialidad,
      });
      profesorIdByEspecialidad.set(p.especialidad, profesorRow.id);
    }
    console.log(`  ${PROFESORES.length} profesores creados`);

    const asignaturaIdByNombre = new Map<string, string>();
    for (const nombre of ASIGNATURAS) {
      const [row] = await tx.insert(asignatura).values({ colegioId: colegioRow.id, nombre }).returning();
      asignaturaIdByNombre.set(nombre, row.id);
    }
    console.log(`  ${ASIGNATURAS.length} asignaturas creadas`);

    const bloqueIds: string[] = [];
    for (const b of BLOQUES) {
      const [row] = await tx
        .insert(bloqueHorario)
        .values({ colegioId: colegioRow.id, nombre: b.nombre, horaInicio: b.horaInicio, horaTermino: b.horaTermino })
        .returning();
      bloqueIds.push(row.id);
    }
    console.log(`  ${BLOQUES.length} bloques de horario creados`);

    for (const c of CURSOS) {
      const [cursoRow] = await tx
        .insert(curso)
        .values({ colegioId: colegioRow.id, anioEscolarId: anioRow.id, nivel: c.nivel, paralelo: c.paralelo })
        .returning();

      const asignaturaCursoIds: string[] = [];
      for (const nombreAsignatura of ASIGNATURAS) {
        const row = await asignarAsignaturaCurso(tx, {
          colegioId: colegioRow.id,
          cursoId: cursoRow.id,
          asignaturaId: asignaturaIdByNombre.get(nombreAsignatura)!,
          profesorId: profesorIdByEspecialidad.get(nombreAsignatura),
          horasSemanales: nombreAsignatura === "Matemática" || nombreAsignatura === "Lenguaje" ? 6 : 3,
        });
        asignaturaCursoIds.push(row.id);
      }

      let slotIndex = 0;
      for (let diaIdx = 0; diaIdx < DIAS.length; diaIdx++) {
        for (let bloqueIdx = 0; bloqueIdx < bloqueIds.length; bloqueIdx++) {
          const asignaturaCursoId = asignaturaCursoIds[(bloqueIdx + diaIdx) % asignaturaCursoIds.length];
          await asignarClase(tx, {
            colegioId: colegioRow.id,
            asignaturaCursoId,
            bloqueHorarioId: bloqueIds[bloqueIdx],
            diaSemana: DIAS[diaIdx],
          });
          slotIndex++;
        }
      }
      console.log(`  curso ${c.nivel} ${c.paralelo}: horario completo (${slotIndex} clases)`);

      for (let i = 0; i < c.alumnos.length; i++) {
        const { nombres, apellidos } = splitNombre(c.alumnos[i]);
        const apoderadoEsMadre = i % 2 === 0;
        const apoderadoNombres = apoderadoEsMadre ? "María" : "Carlos";

        await matricularAlumno(tx, {
          colegioId: colegioRow.id,
          alumno: {
            rut: nextRut(),
            nombres,
            apellidos,
            fechaNacimiento: `${c.anioNacimientoAprox}-0${((i % 9) + 1)}-1${i % 2}`,
          },
          cursoId: cursoRow.id,
          apoderado: {
            rut: nextRut(),
            nombres: apoderadoNombres,
            apellidos,
            email: `${slug(apoderadoNombres)}.${slug(apellidos)}@example.cl`,
            tipoRelacion: apoderadoEsMadre ? "madre" : "padre",
          },
        });
      }
      console.log(`  curso ${c.nivel} ${c.paralelo}: ${c.alumnos.length} alumnos matriculados`);
    }
  });
}

seedSandbox()
  .then(() => {
    console.log("seed sandbox completo");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
