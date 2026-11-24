"""Genera las tareas de aprendizaje (etapa 5) y los proyectos completos (versión 3).

  tareas/tNN-*.xlsx                       un libro por módulo con las tareas T1, T2 y T3
  proyectos/proyecto-*.xlsx               libros de partida de los proyectos (y sus recursos)
  assets/js/actividades.js                textos, soluciones y pruebas que usa la plataforma
  <privado>/soluciones/tareas/            libros resueltos de las tareas      } no se publican
  <privado>/soluciones/proyectos/         libros resueltos de los proyectos   }

Las definiciones están en actividades_basico.py, actividades_intermedio.py, actividades_avanzado.py
y proyectos_def.py. Uso:  python herramientas/generar_actividades.py
"""
import json
import os
import pathlib

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font

import actividades_comun as AC
import actividades_basico
import actividades_intermedio
import actividades_avanzado
import proyectos_def

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PRIVADO = pathlib.Path(os.environ.get("LT_PRIVADO") or RAIZ.parent / (RAIZ.name + "-privado"))


def hoja_instrucciones(wb, titulo, intro, actividades, nota_final, etiqueta="Tarea"):
    ws = wb.active
    ws.title = "Instrucciones"
    ws["A1"] = titulo
    ws["A1"].font = Font(bold=True, size=16, color="5B3A29")
    ws["A3"] = intro
    fila = 5
    for a in actividades:
        cab = f"{a.id} · {a.titulo}" + (f" ({AC.APOYOS[a.apoyo]})" if a.apoyo else "") + f" — hoja «{a.hoja}»"
        ws.cell(row=fila, column=1, value=cab).font = Font(bold=True, size=12)
        fila += 1
        if a.contexto:
            ws.cell(row=fila, column=1, value=strip(a.contexto)).font = Font(italic=True)
            fila += 1
        for i, t in enumerate(a.instrucciones, 1):
            ws.cell(row=fila, column=1, value=f"{i}. {strip(t)}")
            fila += 1
        crit = [p.get("titulo") for p in a.pruebas if p.get("titulo") and not p.get("nivel")]
        if crit:
            ws.cell(row=fila, column=1, value="El verificador revisará: " + "; ".join(crit) + ".").font = Font(color="1E7145")
            fila += 1
        fila += 1
    ws.cell(row=fila, column=1, value=nota_final).font = Font(italic=True, color="7A4D0E")
    ws.column_dimensions["A"].width = 125
    for r in ws.iter_rows(min_row=1, max_row=fila):
        for c in r:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    return ws


def strip(html):
    import re
    t = re.sub(r"<[^>]+>", "", str(html))
    return t.replace("&gt;", ">").replace("&lt;", "<").replace("&amp;", "&").replace("&quot;", '"')


def construir_libro(actividades, sol, titulo, intro, nota, hoja_def_extra=None):
    wb = Workbook()
    hoja_instrucciones(wb, titulo, intro, actividades, nota)
    for a in actividades:
        if a.hoja not in wb.sheetnames:
            wb.create_sheet(a.hoja)
        if a.construir:
            a.construir(wb, wb[a.hoja], sol)
    if sol:
        for a in actividades:
            AC.aplicar_solucion(wb, a.sol, a.hoja)
            if a.sol_extra:
                a.sol_extra(wb, wb[a.hoja])
    return wb


def guardar(wb, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    wb.save(ruta)


def dinamicas(trabajos):
    """Tablas dinámicas reales en las soluciones (openpyxl no las crea): las agrega LibreOffice, si está instalado."""
    import shutil
    import subprocess
    import sys
    if not trabajos:
        return
    if not shutil.which("soffice"):
        print("aviso: sin LibreOffice; las soluciones no incluyen tablas dinámicas")
        return
    r = subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name("dinamicas_lo.py")), json.dumps({str(k): v for k, v in trabajos.items()})], capture_output=True, text=True, timeout=600)
    print(r.stdout.strip() or r.stderr.strip()[-400:])


def main():
    salida = {"TAREAS": {}, "PROYECTOS_DEF": {}}
    trabajos = {}
    posteriores = []  # ajustes al XML después de LibreOffice
    for mod in actividades_basico.MODULOS + actividades_intermedio.MODULOS + actividades_avanzado.MODULOS:
        n = mod["id"]
        archivo = f"t{n:02d}-{mod['slug']}.xlsx"
        intro = ("Tres tareas completas en contextos nuevos de La Taza, con apoyo que se retira: la T1 trae un modelo resuelto (celdas en verde), "
                 "la T2 está resuelta a medias y la T3 es autónoma. Resuélvelas en orden y sube este libro en la etapa 5 del módulo " + str(n) + ".")
        nota = "No cambies los nombres de las hojas ni muevas los datos de lugar: el verificador los busca en su sitio."
        titulo = f"Tareas de aprendizaje · Módulo {n} · {mod['titulo']}"
        ext = ".xlsm" if mod.get("acepta", "").startswith(".xlsm") else ".xlsx"
        for sol in (False, True):
            wb = construir_libro(mod["tareas"], sol, titulo, intro, nota)
            if sol:
                destino = PRIVADO / "soluciones" / "tareas" / archivo.replace(".xlsx", "-solucion.xlsx")
                guardar(wb, destino)
                if mod.get("formas_sol"):
                    AC.agregar_formas(destino, mod["formas_sol"])
                if mod.get("dinamicas_sol"):
                    trabajos[destino] = mod["dinamicas_sol"]
                if mod.get("despues_sol"):
                    posteriores.append((mod["despues_sol"], destino))
            else:
                guardar(wb, RAIZ / "tareas" / archivo)
        for f in mod.get("recursos", []):
            f(RAIZ / "tareas", PRIVADO / "soluciones" / "tareas")
        d = {"archivo": archivo, "titulo": mod["titulo"], "tareas": [a.json() for a in mod["tareas"]]}
        for k in ("acepta", "multiple", "descargas", "nota"):
            if k in mod:
                d[k] = mod[k]
        salida["TAREAS"][n] = d
    for p in proyectos_def.PROYECTOS:
        titulo = f"Proyecto {p['nombre']} · {p['titulo']}"
        for sol in (False, True):
            wb = construir_libro(p["fases"], sol, titulo, AC.strip_html(p["intro_libro"]) if hasattr(AC, "strip_html") else strip(p["intro_libro"]),
                                 "Trabaja las fases en orden sobre este mismo libro y súbelo a la página del proyecto. No cambies los nombres de las hojas.")
            if p.get("despues"):
                p["despues"](wb, sol)
            if sol:
                destino = PRIVADO / "soluciones" / "proyectos" / p["archivo"].replace(".xlsx", "-solucion.xlsx").replace(".xlsm", "-solucion.xlsm")
                guardar(wb, destino)
                if p.get("formas_sol"):
                    AC.agregar_formas(destino, p["formas_sol"])
                if p.get("dinamicas_sol"):
                    trabajos[destino] = p["dinamicas_sol"]
                if p.get("despues_sol"):
                    posteriores.append((p["despues_sol"], destino))
            else:
                guardar(wb, RAIZ / "proyectos" / p["archivo"])
        for f in p.get("recursos", []):
            f(RAIZ / "proyectos", PRIVADO / "soluciones" / "proyectos")
        d = {k: p[k] for k in ("titulo", "resumen", "situacion", "intro", "producto", "entregables", "materiales", "acepta", "pdf", "docx", "descargas", "presentacion", "minimo", "rubrica", "de") if k in p}
        d["fases"] = [f.json() for f in p["fases"]]
        salida["PROYECTOS_DEF"][p["id"]] = d
    dinamicas(trabajos)
    for f, ruta in posteriores:
        f(ruta)
    js = ("/* Tareas de aprendizaje y proyectos. Archivo generado por herramientas/generar_actividades.py:\n"
          "   no lo edites a mano; cambia las definiciones y vuelve a generarlo. */\n"
          "window.LT = window.LT || {};\n"
          "LT.TAREAS = " + json.dumps(salida["TAREAS"], ensure_ascii=False, separators=(",", ":")) + ";\n"
          "LT.PROYECTOS_DEF = " + json.dumps(salida["PROYECTOS_DEF"], ensure_ascii=False, separators=(",", ":")) + ";\n")
    (RAIZ / "assets" / "js" / "actividades.js").write_text(js, encoding="utf-8")
    nt = sum(len(m["tareas"]) for m in salida["TAREAS"].values())
    print(f"actividades: {len(salida['TAREAS'])} módulos, {nt} tareas, {len(salida['PROYECTOS_DEF'])} proyectos · actividades.js {len(js) // 1024} KB")


if __name__ == "__main__":
    main()
