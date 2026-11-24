"""Agrega tablas dinámicas reales a los libros de solución, con LibreOffice (UNO) en modo headless.
openpyxl no sabe crearlas; LibreOffice sí, y al guardar como .xlsx escribe las partes pivotTable/pivotCache
que Excel abre sin problema. Uso (lo llama generar_actividades.py si LibreOffice está instalado):

    python3 herramientas/dinamicas_lo.py RUTA.xlsx '[{"origen": "Datos", "destino": "T1", "celda": "A5", "filas": ["Sucursal"], "datos": [["Total", "sum"]]}]'
"""
import json
import os
import subprocess
import sys
import time

import uno
from com.sun.star.beans import PropertyValue
from com.sun.star.table import CellAddress

FUNC = {"sum": "SUM", "count": "COUNT", "average": "AVERAGE", "max": "MAX", "min": "MIN"}


def prop(n, v):
    p = PropertyValue()
    p.Name, p.Value = n, v
    return p


def conectar(puerto=2083):
    proc = subprocess.Popen(["soffice", "--headless", "--invisible", "--norestore", f"--accept=socket,host=localhost,port={puerto};urp;"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
    for _ in range(60):
        try:
            ctx = resolver.resolve(f"uno:socket,host=localhost,port={puerto};urp;StarOffice.ComponentContext")
            return proc, ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("No se pudo iniciar LibreOffice")


def agregar(doc, spec, k):
    from com.sun.star.sheet.DataPilotFieldOrientation import ROW, COLUMN, DATA, PAGE
    from com.sun.star.sheet.GeneralFunction import SUM, COUNT, AVERAGE, MAX, MIN
    funcs = {"sum": SUM, "count": COUNT, "average": AVERAGE, "max": MAX, "min": MIN}
    hojas = doc.Sheets
    origen = hojas.getByName(spec["origen"])
    cur = origen.createCursor()
    cur.gotoEndOfUsedArea(False)
    rango = origen.getCellRangeByPosition(0, spec.get("filaEncabezado", 0), cur.RangeAddress.EndColumn, cur.RangeAddress.EndRow).RangeAddress
    destino = hojas.getByName(spec["destino"])
    tablas = destino.DataPilotTables
    desc = tablas.createDataPilotDescriptor()
    desc.SourceRange = rango
    campos = desc.DataPilotFields
    nombres = {campos.getByIndex(i).Name: campos.getByIndex(i) for i in range(campos.Count)}
    for n in spec.get("filas", []):
        nombres[n].Orientation = ROW
    for n in spec.get("columnas", []):
        nombres[n].Orientation = COLUMN
    for n in spec.get("filtros", []):
        nombres[n].Orientation = PAGE
    for n, f in spec.get("datos", []):
        nombres[n].Orientation = DATA
        nombres[n].Function = funcs[f]
    celda = destino.getCellRangeByName(spec["celda"]).CellAddress
    nombre = spec.get("nombre", f"TablaDinamica{k}")
    tablas.insertNewByName(nombre, celda, desc)
    tabla = tablas.getByName(nombre)
    if spec.get("porcentaje"):
        from com.sun.star.sheet.DataPilotFieldReferenceType import COLUMN_PERCENTAGE
        ref = uno.createUnoStruct("com.sun.star.sheet.DataPilotFieldReference")
        ref.ReferenceType = COLUMN_PERCENTAGE
        dfs = tabla.DataFields
        for i in range(dfs.Count):
            dfs.getByIndex(i).Reference = ref
    if spec.get("agrupar"):
        from com.sun.star.sheet import DataPilotFieldGroupBy as G
        info = uno.createUnoStruct("com.sun.star.sheet.DataPilotFieldGroupInfo")
        info.HasAutoStart = info.HasAutoEnd = info.HasDateValues = True
        info.GroupBy = getattr(G, spec["agrupar"]["por"])
        tabla.DataPilotFields.getByName(spec["agrupar"]["campo"]).createDateGroup(info)
    for n, valor in (spec.get("filtrar") or {}).items():
        campo = tabla.DataPilotFields.getByName(n)
        items = campo.Items
        for i in range(items.Count):
            it = items.getByIndex(i)
            it.IsHidden = it.Name != valor
    return tabla


def procesar(ruta, specs, desktop):
    url = uno.systemPathToFileUrl(os.path.abspath(ruta))
    doc = desktop.loadComponentFromURL(url, "_blank", 0, (prop("Hidden", True),))
    for k, s in enumerate(specs, 1):
        agregar(doc, s, k)
    doc.calculateAll()
    doc.storeToURL(url, (prop("FilterName", "Calc MS Excel 2007 XML"),))
    doc.close(True)


def main():
    trabajos = json.loads(sys.argv[1]) if len(sys.argv) == 2 else {sys.argv[1]: json.loads(sys.argv[2])}
    proc, desktop = conectar()
    try:
        for ruta, specs in trabajos.items():
            procesar(ruta, specs, desktop)
            print("dinámicas:", os.path.basename(ruta), len(specs))
    finally:
        try:
            desktop.terminate()
        except Exception:
            pass
        proc.wait(timeout=30)


if __name__ == "__main__":
    main()
