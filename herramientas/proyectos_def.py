"""Proyectos completos de la versión 3: uno por nivel y el proyecto final.

Cada proyecto es un solo libro que se trabaja en fases; cada fase es una Actividad (actividades_comun.py)
con sus pruebas. El primer constructor arma todas las hojas del libro; las demás fases trabajan sobre ellas."""
import pathlib
import zipfile
from collections import defaultdict

from openpyxl.drawing.image import Image
from openpyxl.formatting.rule import CellIsRule, DataBarRule, Rule
from openpyxl.styles import Alignment, Font, PatternFill, Protection
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.scenario import InputCells, Scenario, ScenarioList
from openpyxl.worksheet.hyperlink import Hyperlink

import lataza_datos as LD
import generar_libros as GL
from actividades_comun import (Actividad as A, tabla, pintar, formato, nota, anchos, etiquetas, serial, iso_mas,
                               NEGRITA, ENC, ENTRADA, MODELO, BORDE, MONEDA, MONEDA0, FECHA, TITULO, SUB)
from actividades_intermedio import agregar_tabla

D = LD.generar()
PROD = D["productos"]
VENTAS = D["ventas"]
LOGO = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img" / "logo-la-taza.png"
ROJO = DifferentialStyle(fill=PatternFill("solid", bgColor="F8D7DA"), font=Font(color="9C0006"))


def titulo(ws, t, sub=None, fila=1):
    ws.cell(row=fila, column=1, value=t)
    if sub:
        ws.cell(row=fila + 1, column=1, value=sub).font = SUB


def con_titulo(ws, t, sub=None, fila=1):
    titulo(ws, t, sub, fila)
    ws.cell(row=fila, column=1).font = TITULO


def nombre_libro(wb, nombre, ref):
    dn = DefinedName(nombre, attr_text=ref)
    try:
        wb.defined_names[nombre] = dn
    except TypeError:
        wb.defined_names.append(dn)


def bordes(ws, rango):
    for fila in ws[rango]:
        for c in fila:
            c.border = BORDE


def hoja_solucion(wb, lineas):
    ws = wb["Solución"] if "Solución" in wb.sheetnames else wb.create_sheet("Solución", 1)
    if ws.max_row <= 1:
        ws["A1"] = "Solución para el docente"
        ws["A1"].font = Font(bold=True, size=14, color="5B3A29")
        ws.column_dimensions["A"].width = 120
    fila = ws.max_row + 2
    for t in lineas:
        ws.cell(row=fila, column=1, value=t)
        fila += 1


# ======================================================================= BÁSICO
SUR = sorted([v for v in VENTAS if v["sucursal"] == "Sur" and v["fecha"][5:7] == "10"], key=lambda v: (v["fecha"], v["folio"]))
NS = len(SUR)
US = 4 + NS  # última fila de Ventas
SEMANAS = [("Semana 1 (1 al 5)", "2025-10-01", "2025-10-05"), ("Semana 2 (6 al 12)", "2025-10-06", "2025-10-12"), ("Semana 3 (13 al 19)", "2025-10-13", "2025-10-19"),
           ("Semana 4 (20 al 26)", "2025-10-20", "2025-10-26"), ("Semana 5 (27 al 31)", "2025-10-27", "2025-10-31")]
FILAS_SEM = []
for _, ini, fin in SEMANAS:
    idx = [5 + i for i, v in enumerate(SUR) if ini <= v["fecha"] <= fin]
    FILAS_SEM.append((idx[0], idx[-1]))
TOTAL_SUR = sum(v["total"] for v in SUR)
META_SUR = round(TOTAL_SUR * 1.1, -3)
MAL = "Espreso"


def pb_construir(wb, ws, sol):
    ws.title = "Ventas"
    ws["A1"] = "Ventas de octubre 2025 · Sucursal Sur"
    ws["A2"] = "Registro de la caja (una fila por venta)"
    filas = []
    for i, v in enumerate(SUR):
        prod = v["producto"].replace("Espresso", MAL) if v["producto"] == "Espresso" else v["producto"]
        filas.append(["SUR-1001" if i == 0 else None, serial(v["fecha"]), prod, v["categoria"], v["cantidad"], v["precio"], None])
    cols = ["Folio", "Fecha", "Producto", "Categoría", "Cantidad", "Precio", "Importe"]
    for j, t in enumerate(cols):
        ws.cell(row=4, column=1 + j, value=t)
    for i, f in enumerate(filas):
        for j, v in enumerate(f):
            if v is not None:
                ws.cell(row=5 + i, column=1 + j, value=v)
    anchos(ws, A=11, B=11, C=20, D=14, E=10, F=10, G=12)
    r = wb.create_sheet("Resumen")
    r["A1"] = "Reporte mensual · Sucursal Sur · octubre 2025"
    r["A1"].font = Font(bold=True, size=16, color="5B3A29")
    r["A2"] = "Para: Marta Ríos, gerente general"
    for i, t in enumerate(["Ventas del mes", "Venta promedio", "Venta más alta", "Número de ventas"]):
        r.cell(row=4 + i, column=1, value=t)
    r["A9"], r["B9"] = "Meta del mes", META_SUR
    r["B9"].number_format = MONEDA0
    r["A10"] = "Cumplimiento de la meta"
    r["A12"], r["B12"] = "Semana", "Ventas"
    for c in ("A12", "B12"):
        r[c].font, r[c].fill = NEGRITA, ENC
    for i, (t, _, _) in enumerate(SEMANAS):
        r.cell(row=13 + i, column=1, value=t)
    pintar(r, "B4:B7,B10,B13:B17", ENTRADA)
    anchos(r, A=26, B=16)


def pb_sol_formato(wb, ws):
    v, r = wb["Ventas"], wb["Resumen"]
    v["A1"].font = Font(bold=True, size=16, color="5B3A29")
    for c in "ABCDEFG":
        v[c + "4"].font, v[c + "4"].fill = NEGRITA, ENC
        v[c + "4"].alignment = Alignment(horizontal="center")
    formato(v, f"B5:B{US}", FECHA)
    formato(v, f"F5:G{US}", MONEDA)
    bordes(v, f"A4:G{US}")
    formato(r, "B4:B6,B13:B17", MONEDA)
    formato(r, "B10", "0.0%")


def pb_sol_grafico(wb, ws):
    r = wb["Resumen"]
    ch = BarChart()
    ch.title = "Ventas por semana · octubre 2025"
    ch.add_data(Reference(r, min_col=2, min_row=12, max_row=17), titles_from_data=True)
    ch.set_categories(Reference(r, min_col=1, min_row=13, max_row=17))
    ch.height, ch.width = 7, 13
    r.add_chart(ch, "D4")


def pb_sol_objetos(wb, ws):
    r = wb["Resumen"]
    if LOGO.exists():
        img = Image(str(LOGO))
        img.width, img.height = 110, 55
        r.add_image(img, "D1")
    r["A19"] = "Ver el detalle de ventas"
    r["A19"].hyperlink = Hyperlink(ref="A19", location="'Ventas'!A1", display="Ver el detalle de ventas")
    r["A19"].font = Font(color="0563C1", underline="single")


def pb_sol_impresion(wb, ws):
    r = wb["Resumen"]
    r.page_setup.orientation = "landscape"
    r.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    r.page_setup.fitToWidth, r.page_setup.fitToHeight = 1, 1
    r.oddHeader.center.text = "La Taza · Reporte mensual de Sur"
    r.oddFooter.right.text = "Página &P de &N"
    r.print_area = "A1:L20"


SEM_SOL = {f"Resumen!B{13 + i}": f"=SUM(Ventas!G{a}:G{b})" for i, (a, b) in enumerate(FILAS_SEM)}
PB = [
    A("F1", "Completar y corregir el registro", "Ventas", construir=pb_construir, modulos=[1, 2],
      descripcion="El registro de la caja llegó incompleto: falta numerar las ventas y un producto está mal escrito.",
      pasos=[f"Completa los folios de A5:A{US} con el controlador de relleno (SUR-1001, SUR-1002…).", f"Corrige con Buscar y reemplazar el producto «{MAL}» por «Espresso».", "Inmoviliza las filas 1 a 4 para que los encabezados no se pierdan al bajar."],
      sol={f"A5:A{US}": [[f"SUR-{1001 + i}"] for i in range(NS)], f"C5:C{US}": [[v["producto"]] for v in SUR]},
      sol_extra=lambda wb, ws: setattr(wb["Ventas"], "freeze_panes", "A5"),
      pruebas=[{"t": "valores", "r": f"A5:A{US}", "v": [f"SUR-{1001 + i}" for i in range(NS)], "titulo": "Folios SUR-1001 a SUR-" + str(1000 + NS)},
               {"t": "valores", "r": f"C5:C{US}", "v": [v["producto"] for v in SUR], "titulo": f"Sin «{MAL}»"}, {"t": "inmovilizada", "h": "Ventas", "filas": 4, "titulo": "Encabezados inmovilizados"}]),
    A("F2", "Calcular importes e indicadores", "Ventas", modulos=[3, 6],
      descripcion="Los importes y el resumen deben calcularse solos: si se corrige una cantidad, todo se actualiza.",
      pasos=[f"G5:G{US}: importe = cantidad × precio.", "En la hoja Resumen, B4:B7: ventas del mes, venta promedio, venta más alta y número de ventas, con fórmulas que lean la hoja Ventas.", "B10: cumplimiento de la meta (ventas ÷ meta de B9)."],
      sol={f"G5:G{US}": "=E5*F5", "Resumen!B4": f"=SUM(Ventas!G5:G{US})", "Resumen!B5": f"=AVERAGE(Ventas!G5:G{US})", "Resumen!B6": f"=MAX(Ventas!G5:G{US})", "Resumen!B7": f"=COUNT(Ventas!G5:G{US})", "Resumen!B10": "=B4/B9"},
      pruebas=[{"t": "formula", "r": f"G5:G{US},Resumen!B4:B7,Resumen!B10", "titulo": "Todo con fórmulas"}, {"t": "contiene", "r": "Resumen!B4", "texto": "Ventas!", "titulo": "El resumen lee la hoja Ventas"},
               {"t": "valores", "r": f"G5:G{US}", "titulo": "Importes correctos"}, {"t": "valores", "r": "Resumen!B4:B7,Resumen!B10", "titulo": "Indicadores correctos"},
               {"t": "robustez", "r": "Resumen!B4:B7,Resumen!B10", "cambios": [{"Ventas!E6": 40}, {"Resumen!B9": 50000}], "titulo": "Se actualiza si cambian los datos o la meta"}]),
    A("F3", "Dar formato profesional", "Ventas", modulos=[4], sol_extra=pb_sol_formato,
      descripcion="El reporte se enviará a la gerencia: debe leerse de un vistazo.",
      pasos=["Ventas: título A1 destacado (14 pt o más); encabezados A4:G4 en negrita, con relleno y centrados.", "Ventas: fechas con formato de fecha, precios e importes en moneda y bordes en A4:G" + str(US) + ".", "Resumen: moneda en B4:B6 y B13:B17; porcentaje en B10."],
      pruebas=[{"t": "estilo", "r": "A1", "prop": "negrita", "tamMin": 14, "titulo": "Título destacado"}, {"t": "estilo", "r": "A4:G4", "prop": ["negrita", "relleno", "centrado"], "titulo": "Encabezados con formato"},
               {"t": "fmt", "r": f"B5:B{US}", "tipo": "fecha", "titulo": "Fechas con formato"}, {"t": "fmt", "r": f"F5:G{US}", "tipo": "moneda", "titulo": "Precios e importes en moneda"},
               {"t": "estilo", "r": f"A4:G{US}", "prop": "bordes", "titulo": "Bordes en la tabla"}, {"t": "fmt", "r": "Resumen!B4:B6", "tipo": "moneda", "titulo": "Resumen en moneda"}, {"t": "fmt", "r": "Resumen!B10", "tipo": "porcentaje", "titulo": "Cumplimiento en porcentaje"}]),
    A("F4", "Ventas por semana y gráfico", "Resumen", modulos=[6, 7], sol_extra=pb_sol_grafico,
      descripcion="Marta quiere ver cómo se comportaron las semanas del mes.",
      pasos=["Resumen B13:B17: suma las ventas de cada semana (las fechas de Ventas están en orden; cada semana es un bloque de filas).", "Crea en Resumen un gráfico de columnas con A12:B17 y un título que diga qué muestra."],
      sol=SEM_SOL,
      pruebas=[{"t": "formula", "r": "B13:B17", "titulo": "Semanas con fórmulas"}, {"t": "valores", "r": "B13:B17", "titulo": "Ventas de cada semana", "msg": "{celda} muestra {obtenido}; debería ser {esperado}. Revisa qué filas de Ventas corresponden a esa semana."},
               {"t": "grafico", "h": "Resumen", "tipos": ["columnas", "barras"], "conTitulo": True, "titulo": "Gráfico de columnas con título"}]),
    A("F5", "Logo y navegación", "Resumen", modulos=[5], sol_extra=pb_sol_objetos,
      descripcion="El reporte lleva la identidad de La Taza y un acceso directo al detalle.",
      pasos=["Inserta el logo de La Taza en la parte superior de Resumen.", "Agrega en Resumen un vínculo que lleve a la hoja Ventas."],
      pruebas=[{"t": "imagen", "h": "Resumen", "titulo": "Logo en el resumen"}, {"t": "hipervinculo", "h": "Resumen", "destino": "Ventas", "titulo": "Vínculo a la hoja Ventas"}]),
    A("F6", "Imprimir y exportar a PDF", "Resumen", modulos=[8], sol_extra=pb_sol_impresion,
      descripcion="El reporte se envía en PDF de una sola página.",
      pasos=["Resumen: orientación horizontal y ajustado a una página.", "Encabezado con el nombre del reporte y pie con el número de página.", "Exporta Resumen a PDF y súbelo junto con el libro."],
      pruebas=[{"t": "impresion", "h": "Resumen", "orientacion": "landscape", "unaPagina": True, "titulo": "Horizontal en una página"}, {"t": "impresion", "h": "Resumen", "encabezado": True, "numeroPagina": True, "titulo": "Encabezado y número de página"},
               {"t": "pdf", "max": 1, "titulo": "PDF de una página"}]),
]

# ======================================================================= INTERMEDIO
PEDS = D["pedidos"]
CORTE = D["fechaCorte"]
UMBRAL = 2000


def entrega(p, k):
    if p["estado"] != "Entregado":
        return None
    return iso_mas(p["compromiso"], [-1, 0, 0, 1, 2, 0, 3][k % 7])


def sucio(t, k):
    return [lambda s: "  " + s + " ", lambda s: s.upper(), lambda s: s.lower(), lambda s: s, lambda s: s.replace(" ", "  ")][k % 5](t)


FILAS_PI = [[p["folio"], p["fecha"], sucio(p["cliente"], k), p["sucursal"], p["producto"], p["cantidad"], p["precio"], p["compromiso"], entrega(p, k), p["estado"]] for k, p in enumerate(PEDS)]
DUPS = [7, 21]
FILAS_PI_BL = []
for k, f in enumerate(FILAS_PI):
    FILAS_PI_BL.append(f)
    if k in DUPS:
        FILAS_PI_BL.append(list(f))
NPI = len(PEDS)
UPI = 4 + NPI  # última fila sin duplicados
UPB = 4 + len(FILAS_PI_BL)  # última fila con duplicados
SUCS = ["Centro", "Norte", "Sur"]


def pi_construir(wb, ws, sol):
    ws.title = "Pedidos"
    con_titulo(ws, "Pedidos corporativos · octubre y noviembre 2025", "Exportación del sistema de pedidos: hay que limpiarla y completarla.")
    cols = ["Folio", "Fecha", "Cliente (captura)", "Sucursal", "Producto", "Cantidad", "Precio", "Compromiso", "Entrega", "Estado", "Cliente", "Importe", "Tipo", "Días de atraso"]
    filas = FILAS_PI if sol else FILAS_PI_BL
    tabla(ws, 4, cols, [f + [None] * 4 for f in filas], formatos={6: MONEDA}, anchos={"A": 7, "B": 11, "C": 26, "D": 9, "E": 16, "F": 9, "G": 9, "H": 12, "I": 11, "J": 11, "K": 24, "L": 12, "M": 11, "N": 13})
    pintar(ws, f"K5:N{4 + len(filas)}", ENTRADA)
    p = wb.create_sheet("Parámetros")
    con_titulo(p, "Parámetros del control")
    etiquetas(p, [("A3", "Fecha de corte"), ("A4", "Importe mínimo «Mayorista»")])
    p["B3"], p["B4"] = serial(CORTE), UMBRAL
    p["B3"].number_format, p["B4"].number_format = FECHA, MONEDA0
    anchos(p, A=28, B=14)
    r = wb.create_sheet("Resumen")
    con_titulo(r, "Resumen de pedidos por sucursal", "Se actualiza solo a partir de la hoja Pedidos.")
    tabla(r, 4, ["Sucursal", "Importe entregado", "Importe pendiente", "Pedidos pendientes", "Importe promedio", "Atraso máximo (días)"], [[s, None, None, None, None, None] for s in SUCS], anchos={"A": 12, "B": 17, "C": 17, "D": 17, "E": 16, "F": 19})
    formato(r, "B5:C7,E5:E7", MONEDA0)
    pintar(r, "B5:F7", ENTRADA)


def pi_sol_tabla(wb, ws):
    cols = ["Folio", "Fecha", "Cliente (captura)", "Sucursal", "Producto", "Cantidad", "Precio", "Compromiso", "Entrega", "Estado", "Cliente", "Importe", "Tipo", "Días de atraso"]
    agregar_tabla(wb["Pedidos"], "Pedidos", f"A4:N{UPI}", cols, calculadas={"Importe": "Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]"})


def pi_sol_nombres(wb, ws):
    nombre_libro(wb, "Corte", "Parámetros!$B$3")
    nombre_libro(wb, "Umbral", "Parámetros!$B$4")


def pi_sol_reglas(wb, ws):
    ws = wb["Pedidos"]
    ws.conditional_formatting.add(f"N5:N{UPI}", CellIsRule(operator="greaterThan", formula=["0"], fill=PatternFill("solid", bgColor="F8D7DA"), font=Font(color="9C0006")))
    ws.conditional_formatting.add(f"L5:L{UPI}", DataBarRule(start_type="min", end_type="max", color="638EC6"))
    dv = DataValidation(type="list", formula1='"Entregado,Pendiente"', showErrorMessage=True, error="Elige Entregado o Pendiente.")
    dv.add(f"J5:J{UPI + 20}")
    dv2 = DataValidation(type="whole", operator="between", formula1="1", formula2="200", showErrorMessage=True, error="La cantidad va de 1 a 200.")
    dv2.add(f"F5:F{UPI + 20}")
    ws.add_data_validation(dv)
    ws.add_data_validation(dv2)


def pi_sol_proteger(wb, ws):
    r = wb["Resumen"]
    nota(r, "B5", "Incluye solo pedidos entregados.")
    r.protection.sheet = True
    wb["Parámetros"].sheet_state = "hidden"


RNG = lambda col: f"Pedidos!${col}$5:${col}${UPB}"  # noqa: E731
PI = [
    A("F1", "Limpiar la exportación", "Pedidos", construir=pi_construir, modulos=[11, 12],
      descripcion="El sistema exportó los nombres de los clientes con espacios y mayúsculas mezcladas, y dos pedidos salieron repetidos.",
      pasos=[f"K5:K{UPB}: nombre limpio del cliente (ESPACIOS y NOMPROPIO sobre la columna C).", "Quita los pedidos duplicados tomando en cuenta solo el Folio (Datos › Quitar duplicados)."],
      sol={f"K5:K{UPI}": "=PROPER(TRIM(C5))"},
      pruebas=[{"t": "usa", "r": f"K5:K{UPI}", "f": ["TRIM"], "titulo": "Espacios quitados con ESPACIOS"}, {"t": "usa", "r": f"K5:K{UPI}", "f": ["PROPER", "UPPER", "LOWER"], "titulo": "Mayúsculas uniformes"},
               {"t": "valores", "r": f"K5:K{UPI}", "titulo": "Clientes limpios"}, {"t": "registros", "h": "Pedidos", "col": "A", "desde": 5, "unicos": True, "n": NPI, "titulo": f"{NPI} pedidos sin duplicados"}]),
    A("F2", "Convertir en tabla", "Pedidos", modulos=[13], sol_extra=pi_sol_tabla,
      descripcion="Como tabla, el registro crece sin rehacer fórmulas, filtros ni formatos.",
      pasos=[f"Convierte A4:N{UPI} en una tabla llamada <b>Pedidos</b>.", "En L5 escribe la fórmula del importe (cantidad × precio): debe llenarse toda la columna."],
      sol={f"L5:L{UPI}": "=F5*G5"},
      pruebas=[{"t": "tabla", "h": "Pedidos", "nombre": "Pedidos", "titulo": "Tabla «Pedidos»"}, {"t": "tabla", "h": "Pedidos", "nombre": "Pedidos", "calculadas": {"Importe": ["Cantidad", "Precio"]}, "titulo": "Importe como columna calculada"},
               {"t": "valores", "r": f"L5:L{UPI}", "titulo": "Importes correctos"}]),
    A("F3", "Clasificar y medir atrasos", "Pedidos", modulos=[9, 11], sol_extra=pi_sol_nombres,
      descripcion="Las reglas de la empresa están en la hoja Parámetros.",
      pasos=["Asigna los nombres <b>Corte</b> (Parámetros!B3) y <b>Umbral</b> (Parámetros!B4).", "Tipo (M): «Mayorista» si el importe es al menos el Umbral; si no, «Menudeo».", "Días de atraso (N): si está pendiente, los días entre el compromiso y el Corte; si se entregó, los días entre el compromiso y la entrega. Nunca negativos."],
      sol={f"M5:M{UPI}": '=IF(L5>=Umbral,"Mayorista","Menudeo")', f"N5:N{UPI}": '=IF(J5="Pendiente",MAX(0,Corte-H5),MAX(0,I5-H5))'}, sol_nombres={"Corte": "=Parámetros!$B$3", "Umbral": "=Parámetros!$B$4"},
      pruebas=[{"t": "nombre", "n": "Corte", "ref": "Parámetros!$B$3", "titulo": "Nombre Corte"}, {"t": "nombre", "n": "Umbral", "ref": "Parámetros!$B$4", "titulo": "Nombre Umbral"},
               {"t": "usa", "r": f"M5:N{UPI}", "f": ["IF", "IFS"], "titulo": "Decisiones con SI"}, {"t": "valores", "r": f"M5:M{UPI}", "titulo": "Tipo correcto"}, {"t": "valores", "r": f"N5:N{UPI}", "titulo": "Días de atraso correctos"}]),
    A("F4", "Resumen por sucursal", "Resumen", modulos=[10],
      descripcion="La gerencia revisa cada lunes el resumen: debe actualizarse solo.",
      pasos=["B5:C7: importe entregado y pendiente de cada sucursal (SUMAR.SI.CONJUNTO).", "D5:D7: número de pedidos pendientes (CONTAR.SI.CONJUNTO).", "E5:E7: importe promedio por pedido (PROMEDIO.SI); F5:F7: atraso máximo (MAX.SI.CONJUNTO)."],
      sol={"B5:B7": f'=SUMIFS({RNG("L")},{RNG("D")},$A5,{RNG("J")},"Entregado")', "C5:C7": f'=SUMIFS({RNG("L")},{RNG("D")},$A5,{RNG("J")},"Pendiente")',
           "D5:D7": f'=COUNTIFS({RNG("D")},$A5,{RNG("J")},"Pendiente")', "E5:E7": f'=AVERAGEIF({RNG("D")},$A5,{RNG("L")})', "F5:F7": f'=MAXIFS({RNG("N")},{RNG("D")},$A5)'},
      pruebas=[{"t": "usa", "r": "B5:C7", "f": ["SUMIFS"], "titulo": "Importes con SUMAR.SI.CONJUNTO"}, {"t": "usa", "r": "D5:D7", "f": ["COUNTIFS"], "titulo": "Pendientes con CONTAR.SI.CONJUNTO"},
               {"t": "usa", "r": "F5:F7", "f": ["MAXIFS"], "titulo": "Atraso con MAX.SI.CONJUNTO"}, {"t": "valores", "r": "B5:F7", "titulo": "Resumen correcto"}]),
    A("F5", "Alertas y captura sin errores", "Pedidos", modulos=[14, 15], sol_extra=pi_sol_reglas,
      descripcion="Los atrasos deben saltar a la vista y la captura de pedidos nuevos no debe admitir errores.",
      pasos=["Resalta en rojo los días de atraso mayores que 0 (N) y agrega barras de datos al importe (L).", "Estado (J): lista con Entregado y Pendiente. Cantidad (F): enteros de 1 a 200 con mensaje de error. Aplica las validaciones también a unas filas vacías debajo."],
      pruebas=[{"t": "condicional", "h": "Pedidos", "r": f"N5:N{UPI}", "tipo": "cellIs", "titulo": "Atrasos resaltados"}, {"t": "condicional", "h": "Pedidos", "r": f"L5:L{UPI}", "tipo": "dataBar", "titulo": "Barras de datos en el importe"},
               {"t": "validacion", "h": "Pedidos", "r": f"J5:J{UPI}", "tipo": "list", "contiene": ["Entregado", "Pendiente"], "titulo": "Lista de estados"}, {"t": "validacion", "h": "Pedidos", "r": f"F5:F{UPI}", "tipo": "whole", "min": 1, "max": 200, "mensajeError": True, "titulo": "Cantidad de 1 a 200"}]),
    A("F6", "Revisar y proteger", "Resumen", modulos=[16], sol_extra=pi_sol_proteger,
      descripcion="Antes de compartirlo, el resumen se protege y los parámetros se ocultan.",
      pasos=["Deja al menos una nota en Resumen explicando qué incluye una de las cifras.", "Protege la hoja Resumen y oculta la hoja Parámetros."],
      pruebas=[{"t": "notas", "h": "Resumen", "min": 1, "titulo": "Nota explicativa en Resumen"}, {"t": "protegida", "h": "Resumen", "titulo": "Resumen protegido"}, {"t": "hojaOculta", "h": "Parámetros", "titulo": "Parámetros oculta"}]),
]

# ======================================================================= AVANZADO
NV = len(VENTAS)
UV = NV + 1
TOTAL_25 = sum(v["total"] for v in VENTAS)
OBJ_26 = round(TOTAL_25 * 1.12, -4)
COD_PA = "CAF-004"
PROD_PA = next(p for p in PROD if p["codigo"] == COD_PA)
VTA_PA = [v for v in VENTAS if v["producto"] == PROD_PA["nombre"] and v["sucursal"] == "Centro"]
ARCHIVO_CSV = "proyecto-avanzado-csv.zip"


def pa_datos(wb):
    h = wb.create_sheet("Datos")
    cols = ["Folio", "Fecha", "Sucursal", "Producto", "Categoría", "Cantidad", "Precio", "Total", "Vendedor", "Pago"]
    tabla(h, 1, cols, [[v["folio"], v["fecha"], v["sucursal"], v["producto"], v["categoria"], v["cantidad"], v["precio"], v["total"], v["vendedor"], v["pago"]] for v in VENTAS], formatos={6: MONEDA0, 7: MONEDA0},
          anchos={"A": 8, "B": 11, "C": 9, "D": 18, "E": 13, "F": 9, "G": 8, "H": 10, "I": 18, "J": 13})
    h.freeze_panes = "A2"
    c = wb.create_sheet("Catálogo")
    tabla(c, 1, ["Código", "Producto", "Categoría", "Precio"], [[p["codigo"], p["nombre"], p["categoria"], p["precio"]] for p in PROD], formatos={3: MONEDA}, anchos={"A": 10, "B": 22, "C": 15})


def pa_construir(wb, ws, sol):
    ws.title = "Noviembre"
    con_titulo(ws, "Ventas de noviembre (Power Query)", "Carga aquí la consulta que une los tres CSV de noviembre (Cerrar y cargar en… › Tabla › Noviembre!A4).")
    pa_datos(wb)
    t = wb.create_sheet("Tablero")
    t["A1"] = "Tablero de ventas 2025"
    t["A1"].font = Font(bold=True, size=20, color="5B3A29")
    etiquetas(t, [("A3", "Sucursal")])
    t["B3"] = "Centro"
    t["B3"].fill = ENTRADA
    for i, (e, fmt) in enumerate([("Ventas del año", MONEDA0), ("Unidades", "#,##0"), ("Ticket promedio", MONEDA), ("Participación en la empresa", "0.0%")]):
        t.cell(row=5, column=1 + 2 * i, value=e).font = NEGRITA
        t.cell(row=5, column=1 + 2 * i).fill = ENC
        x = t.cell(row=6, column=1 + 2 * i)
        x.fill, x.number_format, x.font = ENTRADA, fmt, Font(bold=True, size=14)
        t.column_dimensions[x.column_letter].width = 18
    a = wb.create_sheet("Análisis")
    con_titulo(a, "Análisis con tablas dinámicas", "Tabla 1 desde A4: ventas por mes y sucursal. Tabla 2 desde H4: participación de cada categoría.")
    b = wb.create_sheet("Buscador")
    con_titulo(b, "Buscador de productos", "Escribe un código en B3.")
    etiquetas(b, [("A3", "Código"), ("A5", "Producto"), ("A6", "Precio"), ("A7", "Ventas 2025"), ("A8", "Unidades 2025"), ("A10", "Ventas del producto en Centro (Folio · Fecha · Cantidad · Total)")])
    b["B3"] = COD_PA
    b["B3"].fill = ENTRADA
    pintar(b, "B5:B8,A11", ENTRADA)
    formato(b, "B6:B7", MONEDA)
    anchos(b, A=24, B=22, C=12, D=10, E=12)
    m = wb.create_sheet("Meta")
    con_titulo(m, "Meta de ventas 2026")
    etiquetas(m, [("A3", "Ventas 2025"), ("A4", "Crecimiento"), ("A5", "Meta 2026"), ("A7", "Objetivo de la dirección")])
    m["B4"] = 0.05
    m["B7"] = OBJ_26
    m["B4"].number_format = "0.0%"
    formato(m, "B3,B5,B7", MONEDA0)
    pintar(m, "B3:B5", ENTRADA)
    anchos(m, A=26, B=16)


def pa_sol_tablero(wb, ws):
    t = wb["Tablero"]
    dv = DataValidation(type="list", formula1='"Centro,Norte,Sur"')
    dv.add("B3")
    t.add_data_validation(dv)
    formato(t, "A6,E6", '$#,##0,"K"')
    hoja_solucion(wb, ["Tablero · gráfico dinámico de líneas (Fecha agrupada por Meses, Suma de Total) y segmentación por Sucursal conectada a las tablas de Análisis.",
                       "   El gráfico dinámico y la segmentación se crean en Excel; este archivo trae los KPI, la lista de B3 y el formato personalizado en miles (K)."])


def pa_sol_buscador(wb, ws):
    from openpyxl.worksheet.formula import ArrayFormula
    b = wb["Buscador"]
    b["A11"] = ArrayFormula(f"A11:D{10 + len(VTA_PA)}", b["A11"].value)


def pa_sol_meta(wb, ws):
    m = wb["Meta"]
    m["B4"] = OBJ_26 / TOTAL_25 - 1
    hoja_solucion(wb, [f"Meta · Buscar objetivo: Definir B5, con el valor {OBJ_26:,.0f}, cambiando B4 → crecimiento {OBJ_26 / TOTAL_25 - 1:.2%}."])


def pa_sol_macro(wb, ws):
    hoja_solucion(wb, ["Macro (Programador › Visual Basic › Insertar módulo) y botón «Actualizar» en Tablero:", "Sub ActualizarTodo()", "    ThisWorkbook.RefreshAll", '    Sheets("Tablero").Select', '    Range("B3").Select', "End Sub",
                       "Guarda como .xlsm. openpyxl no guarda VBA: el docente revisa el botón en el archivo del participante."])


SOL_PQ = ["Noviembre · Datos › Obtener datos › Desde carpeta (los tres CSV) › Combinar y transformar.", "   Quitar fila TOTAL y vacías, Recortar y Poner En Mayúsculas Cada Palabra en producto, tipos de dato, columna Sucursal desde Source.Name.", "   Cerrar y cargar en › Tabla › Noviembre!A4."]
PA = [
    A("F1", "Ventas de noviembre con Power Query", "Noviembre", construir=pa_construir, modulos=[23], sol_extra=lambda wb, ws: hoja_solucion(wb, SOL_PQ),
      descripcion=f"Cada mes llegan tres CSV (uno por sucursal). Descarga {ARCHIVO_CSV}: la consulta debe unirlos y limpiarlos con un clic.",
      pasos=["Obtener datos › Desde carpeta (o importa los tres y anéxalos).", "Quita la fila TOTAL y las vacías, recorta y uniforma el producto, asigna tipos y agrega la sucursal de cada fila.", "Carga el resultado como tabla en Noviembre!A4."],
      pruebas=[{"t": "consulta", "pasos": [{"patron": "Folder\\.Files|Table\\.Combine", "msg": "Une los tres archivos: Desde carpeta (Folder.Files) o Anexar consultas (Table.Combine)."}], "titulo": "Tres archivos unidos con Power Query"},
               {"t": "consulta", "pasos": [{"patron": "Table\\.SelectRows", "msg": "Filtra la fila TOTAL y las vacías."}], "titulo": "Filas sobrantes filtradas"}, {"t": "consulta", "cargada": True, "titulo": "Consulta cargada en una hoja"}]),
    A("F2", "Análisis con tablas dinámicas", "Análisis", modulos=[17],
      descripcion="Dos tablas dinámicas sobre la hoja Datos.",
      pasos=["Análisis!A4: ventas por mes (Fecha agrupada por Meses) en filas y Sucursal en columnas.", "Análisis!H4: Categoría en filas y Total mostrado como % del total general."],
      pruebas=[{"t": "dinamica", "h": "Análisis", "filas": ["Fecha|Mes"], "columnas": ["Sucursal"], "valores": ["Total"], "titulo": "Ventas por mes y sucursal"}, {"t": "dinamica", "h": "Análisis", "agrupada": True, "titulo": "Fechas agrupadas por meses"},
               {"t": "dinamica", "h": "Análisis", "filas": ["Categor"], "mostrarComo": True, "titulo": "Participación de cada categoría"}]),
    A("F3", "Tablero interactivo", "Tablero", modulos=[18, 21, 15], sol_extra=pa_sol_tablero,
      descripcion="Una pantalla para la dirección: eliges la sucursal en B3 y los indicadores cambian.",
      pasos=["B3: lista desplegable con Centro, Norte y Sur.", "A6, C6, E6, G6: ventas del año, unidades, ticket promedio y participación de la sucursal elegida (fórmulas sobre Datos).", 'Formato personalizado en miles para A6 y E6 (por ejemplo <code>$#,##0,"K"</code>).', "Gráfico dinámico de líneas con las ventas por mes y una segmentación por Sucursal."],
      sol={"A6": f"=SUMIFS(Datos!$H$2:$H${UV},Datos!$C$2:$C${UV},$B$3)", "C6": f"=SUMIFS(Datos!$F$2:$F${UV},Datos!$C$2:$C${UV},$B$3)", "E6": f"=AVERAGEIF(Datos!$C$2:$C${UV},$B$3,Datos!$H$2:$H${UV})", "G6": f"=A6/SUM(Datos!$H$2:$H${UV})"},
      pruebas=[{"t": "validacion", "h": "Tablero", "r": "B3", "tipo": "list", "contiene": ["Centro", "Norte", "Sur"], "titulo": "Selector de sucursal"}, {"t": "valores", "r": "A6,C6,E6,G6", "titulo": "Indicadores correctos"},
               {"t": "robustez", "r": "A6,C6,E6,G6", "cambios": [{"B3": "Norte"}, {"B3": "Sur"}], "titulo": "Los indicadores cambian con la sucursal"}, {"t": "fmt", "r": "A6", "patron": ",\"?K|,\\s*\"?K|0,", "titulo": "Formato personalizado en miles"},
               {"t": "grafico", "h": "Tablero", "dinamico": True, "tipos": ["lineas"], "titulo": "Gráfico dinámico de líneas"}, {"t": "segmentacion", "campo": "Sucursal", "titulo": "Segmentación por sucursal"}]),
    A("F4", "Buscador sin errores", "Buscador", modulos=[19, 20], sol_extra=pa_sol_buscador,
      descripcion="Cualquier persona escribe un código y obtiene la ficha del producto; si el código no existe, no aparecen errores.",
      pasos=["B5 y B6: producto y precio con BUSCARX; si el código no existe, «Código no existe» y 0.", "B7 y B8: ventas y unidades 2025 del producto.", "A11: con una sola fórmula, las ventas del producto en Centro (folio, fecha, cantidad y total) con FILTRAR."],
      sol={"B5": '=XLOOKUP(B3,Catálogo!$A$2:$A$21,Catálogo!$B$2:$B$21,"Código no existe")', "B6": "=XLOOKUP(B3,Catálogo!$A$2:$A$21,Catálogo!$D$2:$D$21,0)",
           "B7": f"=SUMIFS(Datos!$H$2:$H${UV},Datos!$D$2:$D${UV},B5)", "B8": f"=SUMIFS(Datos!$F$2:$F${UV},Datos!$D$2:$D${UV},B5)",
           "A11": f'=FILTER(CHOOSE({{1,2,3,4}},Datos!$A$2:$A${UV},Datos!$B$2:$B${UV},Datos!$F$2:$F${UV},Datos!$H$2:$H${UV}),(Datos!$D$2:$D${UV}=B5)*(Datos!$C$2:$C${UV}="Centro"),"Sin ventas")'},
      pruebas=[{"t": "usa", "r": "B5:B6", "f": ["XLOOKUP", "IFERROR", "IFNA"], "titulo": "Búsqueda con BUSCARX"}, {"t": "valores", "r": "B5:B8", "titulo": "Ficha del producto correcta"},
               {"t": "robustez", "r": "B5:B8", "cambios": [{"B3": "XXX-000"}, {"B3": PROD[10]["codigo"]}], "titulo": "Sin errores con un código que no existe"},
               {"t": "usa", "r": "A11", "f": ["FILTER"], "titulo": "Ventas filtradas con FILTRAR"}, {"t": "valores", "r": f"A11:A{10 + len(VTA_PA)}", "v": [v["folio"] for v in VTA_PA], "titulo": f"Las {len(VTA_PA)} ventas en Centro"}]),
    A("F5", "Meta 2026 con Buscar objetivo", "Meta", modulos=[22], sol_extra=pa_sol_meta,
      descripcion=f"La dirección fijó un objetivo de ${OBJ_26:,.0f} para 2026. ¿Qué crecimiento hace falta?",
      pasos=["B3: ventas 2025 (fórmula sobre Datos). B5: meta 2026 = ventas 2025 × (1 + crecimiento).", "Usa Buscar objetivo para que B5 llegue al objetivo de B7 cambiando el crecimiento (B4)."],
      sol={"B3": f"=SUM(Datos!H2:H{UV})", "B5": "=B3*(1+B4)"},
      pruebas=[{"t": "formula", "r": "B3,B5", "titulo": "Meta calculada con fórmulas"}, {"t": "valores", "r": "B3", "titulo": "Ventas 2025 correctas"}, {"t": "valores", "r": "B5", "v": OBJ_26, "tol": 2, "titulo": "La meta alcanza el objetivo"},
               {"t": "sinFormula", "r": "B4", "titulo": "B4 tiene el resultado de Buscar objetivo"}]),
    A("F6", "Botón de actualización", "Tablero", modulos=[24], sol_extra=pa_sol_macro,
      descripcion="Cada mes alguien sin experiencia en Excel actualizará el tablero.",
      pasos=["Crea una macro que actualice todo (Datos › Actualizar todo) y vuelva al Tablero.", "Asígnala a un botón en Tablero y guarda como .xlsm."],
      pruebas=[{"t": "macro", "boton": True, "titulo": "Libro .xlsm con botón y macro"}]),
]


def recursos_pa(pub, priv):
    pub.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(pub / ARCHIVO_CSV, "w", zipfile.ZIP_DEFLATED) as z:
        for suc in ("Centro", "Norte", "Sur"):
            z.writestr(f"noviembre/ventas-{suc.lower()}-11.csv", GL.csv_sucursal("11", suc).encode("utf-8"))


# ======================================================================= FINAL
EQ = D["equilibrio"]
FIJOS = [(c["concepto"], c["monto"]) for c in EQ["costosFijos"]]
SUM_FIJOS = sum(m for _, m in FIJOS)
PRECIO, COSTO = EQ["precio"], EQ["costoVariable"]
FEST26 = ["2026-01-01", "2026-02-02", "2026-03-16", "2026-05-01", "2026-09-16", "2026-11-16", "2026-12-25"]
MESES26 = [f"2026-{m:02d}-01" for m in range(1, 13)]
DIAS_EQ = 24
EQ_DIARIOS = SUM_FIJOS / (DIAS_EQ * (PRECIO - COSTO))
INVITADOS = D["clientesCorp"]


def pf_construir(wb, ws, sol):
    ws.title = "Supuestos"
    con_titulo(ws, "Supuestos del plan · Sucursal Poniente", "Todas las hojas deben leer estos datos: si cambian, el plan se recalcula.")
    filas = [("Precio promedio por café", PRECIO, MONEDA), ("Costo variable por café", COSTO, MONEDA)] + [(c, m, MONEDA0) for c, m in FIJOS] + [("Cafés diarios del primer mes", 120, "#,##0"), ("Crecimiento mensual", 0.04, "0.0%"), ("Inversión inicial", 450000, MONEDA0)]
    for i, (t, v, f) in enumerate(filas):
        ws.cell(row=4 + i, column=1, value=t)
        c = ws.cell(row=4 + i, column=2, value=v)
        c.number_format, c.fill = f, ENTRADA
    etiquetas(ws, [("D3", "Días festivos 2026")])
    for i, f in enumerate(FEST26):
        ws.cell(row=4 + i, column=4, value=serial(f)).number_format = FECHA
    anchos(ws, A=30, B=14, D=18)
    pf_datos(wb)
    c = wb.create_sheet("Comparativo")
    con_titulo(c, "Las tres sucursales en 2025", "Referencia para el plan de Poniente.")
    tabla(c, 4, ["Sucursal", "Ventas 2025", "Unidades", "Ticket promedio", "Participación"], [[s, None, None, None, None] for s in ("Centro", "Norte", "Sur")], anchos={"A": 12, "B": 15, "C": 11, "D": 15, "E": 13})
    formato(c, "B5:B7,D5:D7", MONEDA0)
    formato(c, "E5:E7", "0.0%")
    pintar(c, "B5:E7", ENTRADA)
    p = wb.create_sheet("Proyección")
    con_titulo(p, "Proyección 2026 · Sucursal Poniente")
    cols = ["Mes", "Días hábiles", "Cafés diarios", "Cafés del mes", "Ingresos", "Costo variable", "Costos fijos", "Utilidad", "Acumulado", "Estado"]
    tabla(p, 4, cols, [[m] + [None] * 9 for m in MESES26], anchos={"A": 11, "B": 12, "C": 13, "D": 13, "E": 13, "F": 14, "G": 13, "H": 13, "I": 14, "J": 16})
    pintar(p, "B5:J16", ENTRADA)
    e = wb.create_sheet("Equilibrio")
    con_titulo(e, "Punto de equilibrio mensual", "¿Cuántos cafés al día hacen falta para no perder en un mes típico?")
    etiquetas(e, [("A4", "Cafés diarios"), ("A5", "Días hábiles del mes típico"), ("A6", "Utilidad del mes")], negrita=False)
    e["B4"], e["B5"] = 100, DIAS_EQ
    e["B4"].fill = ENTRADA
    anchos(e, A=30, B=14)
    pe = wb.create_sheet("Personal")
    con_titulo(pe, "Plantilla de personal de Poniente", "Captura con listas y reglas para evitar errores.")
    tabla(pe, 4, ["Puesto", "Nombre", "Turno", "Horas semanales"], [["Encargado", "Ana Beltrán", "Mixto", 48]] + [[None] * 4 for _ in range(11)], anchos={"A": 14, "B": 22, "C": 12, "D": 16})
    iv = wb.create_sheet("Invitados")
    tabla(iv, 1, ["Cliente", "Contacto", "Correo", "Teléfono"], [[c["cliente"], c["contacto"], c["correo"], c["telefono"]] for c in INVITADOS], anchos={"A": 26, "B": 24, "C": 28, "D": 14})


def pf_datos(wb):
    h = wb.create_sheet("Datos")
    tabla(h, 1, ["Folio", "Fecha", "Sucursal", "Producto", "Categoría", "Cantidad", "Precio", "Total"], [[v["folio"], v["fecha"], v["sucursal"], v["producto"], v["categoria"], v["cantidad"], v["precio"], v["total"]] for v in VENTAS],
          formatos={6: MONEDA0, 7: MONEDA0}, anchos={"A": 8, "B": 11, "C": 9, "D": 18, "E": 13})
    h.freeze_panes = "A2"


def pf_sol_escenarios(wb, ws):
    wb["Equilibrio"]["B4"] = EQ_DIARIOS
    s = wb["Supuestos"]
    s.scenarios = ScenarioList(scenario=[Scenario(name="Conservador", inputCells=[InputCells(r="B10", val="100"), InputCells(r="B11", val="0.02")], user="La Taza"),
                                         Scenario(name="Optimista", inputCells=[InputCells(r="B10", val="150"), InputCells(r="B11", val="0.06")], user="La Taza")])


def pf_sol_visual(wb, ws):
    p = wb["Proyección"]
    formato(p, "A5:A16", "mmm yyyy")
    formato(p, "E5:I16", MONEDA0)
    p.conditional_formatting.add("H5:I16", CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", bgColor="F8D7DA"), font=Font(color="9C0006")))
    ch = LineChart()
    ch.title = "Utilidad mensual y acumulada 2026 · Poniente"
    ch.add_data(Reference(p, min_col=8, min_row=4, max_row=16), titles_from_data=True)
    ch.add_data(Reference(p, min_col=9, min_row=4, max_row=16), titles_from_data=True)
    ch.set_categories(Reference(p, min_col=1, min_row=5, max_row=16))
    ch.height, ch.width = 8, 16
    p.add_chart(ch, "B19")


def pf_sol_personal(wb, ws):
    pe = wb["Personal"]
    agregar_tabla(pe, "Plantilla", "A4:D16", ["Puesto", "Nombre", "Turno", "Horas semanales"])
    dv = DataValidation(type="list", formula1='"Encargado,Barista,Cajero,Cocina"', showErrorMessage=True, error="Elige un puesto de la lista.")
    dv.add("A5:A16")
    dv2 = DataValidation(type="whole", operator="between", formula1="10", formula2="48", showErrorMessage=True, error="Entre 10 y 48 horas.")
    dv2.add("D5:D16")
    pe.add_data_validation(dv)
    pe.add_data_validation(dv2)


def carta_final(sol):
    c = (lambda campo: "{" + campo + "}") if sol else (lambda campo: "[" + campo + "]")
    return [GL._p("Cafetería La Taza", negrita=True, tam=20, color="5B3A29"), GL._p("Inauguración de la sucursal Poniente", negrita=True, tam=14), GL._p(""),
            GL._p("Estimado(a) " + c("Contacto") + ":"),
            GL._p("Por ser cliente de La Taza, " + c("Cliente") + " está invitado a la inauguración de nuestra cuarta sucursal, el sábado 7 de marzo de 2026 a las 9:00, en Av. Poniente 214."),
            GL._p("Habrá degustación de nuestros cafés de origen y una sorpresa para las empresas del programa de lealtad."),
            GL._p("Confirme su asistencia respondiendo a este correo (" + c("Correo") + ")."), GL._p(""), GL._p("Marta Ríos", negrita=True), GL._p("Gerente general")]


def recursos_pf(pub, priv):
    GL.docx(pub / "proyecto-final-invitacion.docx", carta_final(False), "Invitación a la inauguración")
    ruta = priv / "proyecto-final-invitacion-solucion.docx"
    GL.docx(ruta, carta_final(True), "Invitación a la inauguración (solución)")
    with zipfile.ZipFile(ruta) as z:
        partes = {n: z.read(n) for n in z.namelist()}
    mm = ('<w:mailMerge><w:mainDocumentType w:val="formLetters"/><w:linkToQuery/><w:dataType w:val="native"/>'
          '<w:connectString w:val="Provider=Microsoft.ACE.OLEDB.12.0;Data Source=proyecto-final.xlsx;"/><w:query w:val="SELECT * FROM `Invitados$`"/></w:mailMerge>')
    partes["word/settings.xml"] = partes["word/settings.xml"].decode().replace("<w:defaultTabStop", mm + "<w:defaultTabStop").encode()
    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for n, b in partes.items():
            z.writestr(n, b)


S = "Supuestos!"
PF = [
    A("F1", "Comparar las tres sucursales", "Comparativo", construir=pf_construir, modulos=[3, 10, 17],
      descripcion="Antes de proyectar Poniente, conoce cómo les fue a las sucursales actuales.",
      pasos=["Comparativo B5:E7: ventas 2025, unidades, ticket promedio y participación de cada sucursal (fórmulas sobre Datos).", "Agrega en Comparativo, desde G4, una tabla dinámica con Sucursal en filas, Categoría en columnas y la suma de Total."],
      sol={"B5:B7": f"=SUMIFS(Datos!$H$2:$H${UV},Datos!$C$2:$C${UV},$A5)", "C5:C7": f"=SUMIFS(Datos!$F$2:$F${UV},Datos!$C$2:$C${UV},$A5)", "D5:D7": f"=AVERAGEIF(Datos!$C$2:$C${UV},$A5,Datos!$H$2:$H${UV})", "E5:E7": "=B5/SUM($B$5:$B$7)"},
      pruebas=[{"t": "formula", "r": "B5:E7", "titulo": "Comparativo con fórmulas"}, {"t": "valores", "r": "B5:E7", "titulo": "Cifras de las sucursales correctas"},
               {"t": "dinamica", "h": "Comparativo", "filas": ["Sucursal"], "columnas": ["Categor"], "valores": ["Total"], "titulo": "Tabla dinámica Sucursal × Categoría"}]),
    A("F2", "Proyección de 12 meses", "Proyección", modulos=[3, 6, 9, 11],
      descripcion="Una fila por mes de 2026. Todo depende de la hoja Supuestos.",
      pasos=["B: días hábiles del mes (DIAS.LAB entre el día 1 y FIN.MES, sin los festivos de Supuestos).", "C: cafés diarios; enero = Supuestos!B10 y cada mes crece Supuestos!B11. D: cafés del mes = días × cafés diarios.",
             "E, F, G: ingresos (cafés × precio), costo variable (cafés × costo) y costos fijos (suma de Supuestos!B6:B9). H: utilidad.", "I: acumulado (enero empieza restando la inversión inicial). J: «Recuperada» si el acumulado ya es positivo; si no, «En recuperación»."],
      sol={"B5:B16": f"=NETWORKDAYS(A5,EOMONTH(A5,0),{S}$D$4:$D$10)", "C5": f"={S}$B$10", "C6:C16": f"=C5*(1+{S}$B$11)", "D5:D16": "=B5*C5", "E5:E16": f"=D5*{S}$B$4", "F5:F16": f"=D5*{S}$B$5",
           "G5:G16": f"=SUM({S}$B$6:$B$9)", "H5:H16": "=E5-F5-G5", "I5": f"=H5-{S}$B$12", "I6:I16": "=I5+H6", "J5:J16": '=IF(I5>=0,"Recuperada","En recuperación")'},
      pruebas=[{"t": "formula", "r": "B5:J16", "titulo": "Proyección con fórmulas"}, {"t": "usa", "r": "B5:B16", "f": ["NETWORKDAYS", "NETWORKDAYS.INTL"], "titulo": "Días hábiles con DIAS.LAB"},
               {"t": "valores", "r": "B5:D16", "titulo": "Días y cafés correctos"}, {"t": "valores", "r": "E5:J16", "titulo": "Ingresos, costos, utilidad y acumulado correctos"},
               {"t": "robustez", "r": "B5:J16", "cambios": [{f"{S}B10": 180}, {f"{S}B11": 0.08, f"{S}B4": 58}, {f"{S}B12": 200000, f"{S}D5": serial("2026-03-02")}], "titulo": "El plan se recalcula si cambian los supuestos"}]),
    A("F3", "Equilibrio y escenarios", "Equilibrio", modulos=[22], sol_extra=pf_sol_escenarios,
      descripcion="La dirección pregunta cuántos cafés al día hacen falta para no perder y qué pasa en otros escenarios.",
      pasos=["Equilibrio B6: utilidad del mes = cafés diarios × días × (precio − costo) − costos fijos (leyendo Supuestos).", "Con Buscar objetivo, encuentra en B4 los cafés diarios que hacen B6 = 0.", "En Supuestos crea los escenarios Conservador (100 cafés, 2 %) y Optimista (150 cafés, 6 %) sobre B10:B11."],
      sol={"B6": f"=B4*B5*({S}B4-{S}B5)-SUM({S}B6:B9)"},
      pruebas=[{"t": "formula", "r": "B6", "titulo": "Utilidad con fórmula"}, {"t": "valores", "r": "B6", "v": 0, "tol": 1, "titulo": "Utilidad en cero"}, {"t": "valores", "r": "B4", "v": EQ_DIARIOS, "tol": 0.5, "titulo": f"Equilibrio ≈ {EQ_DIARIOS:.1f} cafés diarios"},
               {"t": "sinFormula", "r": "B4", "titulo": "B4 con el resultado de Buscar objetivo"}, {"t": "escenarios", "h": "Supuestos", "min": 2, "titulo": "Dos escenarios en Supuestos"}]),
    A("F4", "Presentación visual", "Proyección", modulos=[4, 7, 14, 21], sol_extra=pf_sol_visual,
      descripcion="La proyección se presentará en la junta: tiene que leerse sola.",
      pasos=['Meses con formato personalizado <code>mmm yyyy</code> y cifras de dinero en moneda.', "Resalta en rojo las utilidades y acumulados negativos (H5:I16).", "Gráfico de líneas con la utilidad mensual y el acumulado, con título."],
      pruebas=[{"t": "fmt", "r": "A5:A16", "patron": "mmm", "titulo": "Meses con formato mmm yyyy"}, {"t": "fmt", "r": "E5:I16", "tipo": "moneda", "titulo": "Dinero en moneda"},
               {"t": "condicional", "h": "Proyección", "r": "H5:I16", "titulo": "Negativos resaltados"}, {"t": "grafico", "h": "Proyección", "tipos": ["lineas"], "series": 2, "conTitulo": True, "titulo": "Gráfico de líneas con dos series y título"}]),
    A("F5", "Plantilla de personal", "Personal", modulos=[13, 15], sol_extra=pf_sol_personal,
      descripcion="Recursos Humanos capturará aquí al personal de Poniente.",
      pasos=["Convierte A4:D16 en una tabla llamada <b>Plantilla</b>.", "Puesto: lista con Encargado, Barista, Cajero y Cocina. Horas semanales: enteros de 10 a 48 con mensaje de error."],
      pruebas=[{"t": "tabla", "h": "Personal", "nombre": "Plantilla", "titulo": "Tabla «Plantilla»"}, {"t": "validacion", "h": "Personal", "r": "A5:A16", "tipo": "list", "contiene": ["Barista", "Cajero"], "titulo": "Lista de puestos"},
               {"t": "validacion", "h": "Personal", "r": "D5:D16", "tipo": "whole", "min": 10, "max": 48, "mensajeError": True, "titulo": "Horas de 10 a 48"}]),
    A("F6", "Invitaciones a la inauguración", "Invitados", modulos=[25],
      descripcion="Los clientes corporativos recibirán una invitación personalizada.",
      pasos=["En Word abre proyecto-final-invitacion.docx y conéctalo con la hoja Invitados de tu libro.", "Reemplaza [Contacto], [Cliente] y [Correo] por campos combinados.", "Sube la carta junto con el libro."],
      pruebas=[{"t": "docx", "campos": ["Contacto", "Cliente", "Correo"], "titulo": "Campos combinados en la invitación"}, {"t": "docx", "origen": True, "titulo": "Invitación conectada con la lista"}]),
]

RUBRICA_FINAL = [
    ["Exactitud del plan", ["Cifras incorrectas", "Correctas con errores aislados", "Todas correctas", "Correctas y comprobadas con otro método"]],
    ["Modelo y automatización", ["Valores escritos a mano", "Fórmulas que se rompen al cambiar supuestos", "Todo depende de Supuestos", "Escenarios, nombres y validaciones que lo hacen a prueba de errores"]],
    ["Análisis", ["Solo describe datos", "Compara las sucursales", "Relaciona el comparativo con la proyección", "Saca conclusiones y riesgos para la decisión"]],
    ["Diseño y visualización", ["Difícil de leer", "Formato inconsistente", "Claro y consistente", "Listo para la junta de dirección"]],
    ["Presentación oral", ["Lee el libro sin explicar", "Explica con ayuda", "Explica cómo y por qué", "Responde preguntas y defiende una recomendación"]],
]

PROYECTOS = [
    {"id": "basico", "nombre": "Básico", "titulo": "Reporte mensual de la sucursal Sur", "archivo": "proyecto-basico.xlsx", "fases": PB,
     "intro_libro": "Proyecto del nivel Básico: el reporte mensual de la sucursal Sur. Trabaja las fases en orden sobre las hojas Ventas y Resumen.",
     "resumen": "Del registro de la caja al reporte en PDF: limpiar, calcular, dar formato, graficar e imprimir.",
     "situacion": "Hola. Ana Beltrán, de Sur, me mandó el registro de ventas de octubre tal como sale de la caja: sin folios y con algún error de captura. Necesito un <b>reporte mensual</b> que pueda leer en un minuto: cuánto vendimos, cómo fue cada semana y si llegamos a la meta. Mándamelo en PDF de una sola hoja, por favor.",
     "intro": "Integra los ocho módulos del nivel Básico en un solo reporte. Cada fase indica los módulos que la respaldan.",
     "producto": "un libro con las hojas Ventas y Resumen (indicadores, ventas por semana, gráfico, logo y vínculo) y el PDF de una página del Resumen.",
     "entregables": ["proyecto-basico.xlsx resuelto", "Resumen exportado a PDF (una página)"], "materiales": "El libro de partida trae el registro de octubre de Sur y la hoja Resumen por completar. Para el logo usa el archivo de abajo.",
     "descargas": [{"ruta": "assets/img/logo-la-taza.png", "texto": "Logo de La Taza (PNG)"}], "pdf": True, "minimo": 80},
    {"id": "intermedio", "nombre": "Intermedio", "titulo": "Control de pedidos corporativos", "archivo": "proyecto-intermedio.xlsx", "fases": PI,
     "intro_libro": "Proyecto del nivel Intermedio: control de pedidos corporativos. Las fases trabajan sobre las hojas Pedidos, Parámetros y Resumen.",
     "resumen": "Limpiar una exportación, convertirla en tabla, clasificar con SI, resumir con condiciones, validar y proteger.",
     "situacion": "Los pedidos de empresas crecieron y ya no sabemos cuáles van atrasados. Te paso la exportación del sistema: viene sucia y con duplicados. Quiero un <b>control</b> que se actualice solo: tipo de cliente, días de atraso y un resumen por sucursal que pueda revisar cada lunes sin miedo a borrar algo.",
     "intro": "Integra los módulos 9 a 16. Las reglas de negocio (fecha de corte e importe mínimo para «Mayorista») viven en la hoja Parámetros.",
     "producto": "un registro de pedidos como tabla, con columnas calculadas, alertas visuales, captura validada y un resumen protegido por sucursal.",
     "entregables": ["proyecto-intermedio.xlsx resuelto"], "materiales": "El libro de partida trae la exportación de 40 pedidos (con 2 repetidos), la hoja Parámetros y el Resumen por completar.", "minimo": 80},
    {"id": "avanzado", "nombre": "Avanzado", "titulo": "Tablero anual automatizado", "archivo": "proyecto-avanzado.xlsx", "fases": PA,
     "intro_libro": "Proyecto del nivel Avanzado: tablero anual automatizado. Hojas: Noviembre (Power Query), Datos, Catálogo, Tablero, Análisis, Buscador y Meta.",
     "resumen": "Power Query, tablas y gráficos dinámicos, BUSCARX y FILTRAR, Buscar objetivo y una macro: un tablero que se actualiza con un botón.",
     "situacion": "La dirección quiere dejar de pedir reportes por correo. Necesito un <b>tablero</b> donde elija la sucursal y vea sus números, un buscador de productos que no muestre errores y la meta para 2026. Y que cada mes, al llegar los CSV de las sucursales, baste con un clic para actualizar todo.",
     "intro": "Integra los módulos 17 a 25. Necesitas Excel de escritorio para la macro y para Power Query desde carpeta.",
     "producto": "un libro .xlsm con consulta de Power Query, tablas y gráfico dinámicos con segmentación, tablero con selector, buscador sin errores, meta calculada y botón de actualización.",
     "entregables": ["proyecto-avanzado.xlsm resuelto (o .xlsx si no pudiste grabar la macro)"], "materiales": "El libro de partida trae las ventas 2025 (Datos), el catálogo y las hojas por completar. Los CSV de noviembre vienen en el zip.",
     "descargas": [{"ruta": "proyectos/" + ARCHIVO_CSV, "texto": "CSV de noviembre (zip)"}], "acepta": ".xlsm,.xlsx", "minimo": 75, "recursos": [recursos_pa],
     "dinamicas_sol": [{"origen": "Datos", "destino": "Análisis", "celda": "A4", "filas": ["Fecha"], "columnas": ["Sucursal"], "datos": [["Total", "sum"]], "agrupar": {"campo": "Fecha", "por": "MONTHS"}},
                       {"origen": "Datos", "destino": "Análisis", "celda": "H4", "filas": ["Categoría"], "datos": [["Total", "sum"]], "porcentaje": True, "nombre": "Participacion"}],
     "despues_sol": lambda ruta: __import__("actividades_comun").porcentaje_dinamica(ruta, "Participacion")},
    {"id": "final", "nombre": "final", "titulo": "Plan de apertura de la sucursal Poniente", "archivo": "proyecto-final.xlsx", "fases": PF,
     "intro_libro": "Proyecto final: plan de apertura de la sucursal Poniente. Empieza en Supuestos; todas las hojas deben leer de ahí.",
     "resumen": "Un plan de negocio completo en Excel: comparativo, proyección de 12 meses, equilibrio, escenarios, visualización, plantilla de personal e invitaciones.",
     "situacion": "El consejo aprobó estudiar una cuarta sucursal en Poniente. Necesito un <b>plan en Excel</b> que pueda defender: cómo nos fue en las tres sucursales, cuánto venderíamos y ganaríamos mes a mes en 2026, cuántos cafés diarios necesitamos para no perder y en cuánto tiempo recuperamos la inversión. Si los supuestos cambian en la junta, el plan tiene que recalcularse ahí mismo. Ah, y prepara las invitaciones para la inauguración.",
     "intro": "Integra los tres niveles. Trabaja de forma autónoma después de la sesión 6 y presenta tu plan en 5 minutos.",
     "producto": "un libro con Supuestos, Comparativo, Proyección, Equilibrio, Personal e Invitados, más la invitación combinada en Word, y una presentación de 5 minutos.",
     "entregables": ["proyecto-final.xlsx resuelto", "proyecto-final-invitacion.docx con los campos combinados", "Presentación de 5 minutos (en vivo o grabada)"],
     "materiales": "El libro de partida trae los supuestos de la dirección, las ventas 2025 de las tres sucursales y las hojas por completar. La invitación de Word se descarga abajo.",
     "descargas": [{"ruta": "proyectos/proyecto-final-invitacion.docx", "texto": "Invitación (Word)"}], "docx": True, "minimo": 80, "rubrica": RUBRICA_FINAL, "recursos": [recursos_pf],
     "presentacion": {"intro": "Presenta tu plan como si estuvieras ante el consejo de La Taza: 5 minutos, con tu libro de Excel en pantalla.",
                      "guion": ["El punto de partida: cómo les fue a Centro, Norte y Sur en 2025 (Comparativo).", "Los supuestos clave de Poniente y por qué los elegiste.", "La proyección: cuándo se vuelve rentable y cuándo se recupera la inversión (gráfico).",
                                "El punto de equilibrio y qué cambia en los escenarios Conservador y Optimista.", "Tu recomendación: ¿abrir o no abrir? ¿Con qué condiciones? Cambia un supuesto en vivo para mostrar que el modelo se recalcula."]},
     "dinamicas_sol": [{"origen": "Datos", "destino": "Comparativo", "celda": "G4", "filas": ["Sucursal"], "columnas": ["Categoría"], "datos": [["Total", "sum"]]}]},
]
