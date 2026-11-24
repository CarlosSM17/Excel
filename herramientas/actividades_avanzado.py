"""Tareas de aprendizaje del nivel Avanzado (módulos 17 a 25). Ver actividades_comun.py.

Algunas tareas piden objetos que openpyxl no sabe crear (tablas y gráficos dinámicos, segmentaciones,
consultas de Power Query, macros). Sus libros de solución incluyen una hoja «Solución» con los pasos y,
cuando la tarea también pide una respuesta, la celda resuelta para que el docente compare."""
import json
import re
import zipfile
from collections import defaultdict

from openpyxl.formatting.rule import Rule
from openpyxl.styles import Font, PatternFill
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.worksheet.formula import ArrayFormula, DataTableFormula
from openpyxl.worksheet.scenario import InputCells, Scenario, ScenarioList

import lataza_datos as LD
import generar_libros as GL
from actividades_comun import (Actividad as A, encabezado, tabla, pintar, formato, nota, anchos, etiquetas, serial, iso_mas,
                               NEGRITA, ENC, ENTRADA, MODELO, MONEDA, MONEDA0, FECHA)

D = LD.generar()
PROD = D["productos"]
VENTAS = D["ventas"]
NV = len(VENTAS)
UV = NV + 1  # última fila de Datos (encabezados en la fila 1)


def hoja_solucion(wb, lineas):
    if "Solución" in wb.sheetnames:
        ws = wb["Solución"]
        fila = ws.max_row + 2
    else:
        ws = wb.create_sheet("Solución", 1)
        ws["A1"] = "Solución para el docente"
        ws["A1"].font = Font(bold=True, size=14, color="5B3A29")
        ws.column_dimensions["A"].width = 120
        fila = 3
    for t in lineas:
        ws.cell(row=fila, column=1, value=t)
        fila += 1


def hoja_datos(wb):
    if "Datos" in wb.sheetnames:
        return wb["Datos"]
    h = wb.create_sheet("Datos")
    cols = ["Folio", "Fecha", "Sucursal", "Producto", "Categoría", "Cantidad", "Precio", "Total", "Vendedor", "Pago"]
    tabla(h, 1, cols, [[v["folio"], v["fecha"], v["sucursal"], v["producto"], v["categoria"], v["cantidad"], v["precio"], v["total"], v["vendedor"], v["pago"]] for v in VENTAS],
          formatos={6: MONEDA0, 7: MONEDA0}, anchos={"A": 8, "B": 11, "C": 9, "D": 18, "E": 13, "F": 9, "G": 8, "H": 10, "I": 18, "J": 13})
    h.freeze_panes = "A2"
    return h


def suma(**f):
    return sum(v["total"] for v in VENTAS if all(v[k] == x for k, x in f.items()))


def pregunta(ws, filas):
    """filas: [(celda_etiqueta, texto, celda_respuesta, formato)]"""
    for ce, txt, cr, fmt in filas:
        ws[ce] = txt
        ws[ce].font = NEGRITA
        ws[cr].fill = ENTRADA
        if fmt:
            ws[cr].number_format = fmt


# =============================================================== Módulo 17
POR_SUC = {s: suma(sucursal=s) for s in ("Centro", "Norte", "Sur")}
TOP_SUC = max(POR_SUC, key=POR_SUC.get)
POSTRES_T4 = sum(v["total"] for v in VENTAS if v["categoria"] == "Postres" and int(v["fecha"][5:7]) >= 10)
VEND_SUR = defaultdict(int)
for v in VENTAS:
    if v["sucursal"] == "Sur":
        VEND_SUR[v["vendedor"]] += v["total"]
TOP_VEND = max(VEND_SUR, key=VEND_SUR.get)
PCT_VEND = VEND_SUR[TOP_VEND] / sum(VEND_SUR.values())


def m17_t1(wb, ws, sol):
    hoja_datos(wb)
    encabezado(ws, "Ventas 2025 por sucursal", f"Los datos están en la hoja Datos ({NV} ventas). Crea la tabla dinámica en esta hoja, desde A5.")
    pregunta(ws, [("A3", "¿Qué sucursal vendió más?", "D3", None), ("E3", "¿Cuánto vendió?", "G3", MONEDA0)])
    if sol:
        ws["D3"], ws["G3"] = TOP_SUC, POR_SUC[TOP_SUC]
        hoja_solucion(wb, ["T1 · Insertar › Tabla dinámica › Tabla o rango: Datos!$A$1:$J$" + str(UV) + " › Hoja existente: T1!$A$5.", "   Filas: Sucursal · Valores: Suma de Total.",
                           f"   Respuesta: {TOP_SUC} con ${POR_SUC[TOP_SUC]:,}. (Centro ${POR_SUC['Centro']:,} · Norte ${POR_SUC['Norte']:,} · Sur ${POR_SUC['Sur']:,})"])


T17_1 = A("T1", "Tu primera tabla dinámica", "T1", apoyo="modelo", minutos=10, construir=m17_t1,
          contexto="La dirección quiere saber cuánto vendió cada sucursal en 2025, sin escribir una sola fórmula.",
          modelo="Clic en cualquier celda de Datos › Insertar › Tabla dinámica › «Hoja de cálculo existente» › T1!A5. En la lista de campos arrastra <b>Sucursal</b> a Filas y <b>Total</b> a Valores (Suma de Total).",
          instrucciones=["Crea la tabla dinámica en T1 (desde A5) con Sucursal en Filas y la suma de Total en Valores.", "Escribe en D3 la sucursal que más vendió y en G3 cuánto vendió (puedes copiar el número de la tabla)."],
          pruebas=[{"t": "dinamica", "h": "T1", "filas": ["Sucursal"], "valores": ["Total"], "funcion": "sum", "titulo": "Tabla dinámica: Sucursal × Suma de Total"},
                   {"t": "valores", "r": "D3", "v": TOP_SUC, "titulo": "Sucursal que más vendió"}, {"t": "valores", "r": "G3", "v": POR_SUC[TOP_SUC], "tol": 1, "titulo": "Su venta anual"}])


def m17_t2(wb, ws, sol):
    hoja_datos(wb)
    encabezado(ws, "Ventas por categoría y trimestre", "Crea la tabla dinámica desde A5.")
    pregunta(ws, [("A3", "Ventas de Postres en el 4.º trimestre", "F3", MONEDA0)])
    if sol:
        ws["F3"] = POSTRES_T4
        hoja_solucion(wb, ["T2 · Tabla dinámica en T2!A5: Filas Categoría, Columnas Fecha, Valores Suma de Total.", "   Clic derecho en una fecha › Agrupar › Trimestres (quita Meses).", f"   Respuesta: ${POSTRES_T4:,}."])


T17_2 = A("T2", "Agrupar fechas por trimestre", "T2", apoyo="completar", minutos=10, construir=m17_t2,
          contexto="Ya sabes crear la tabla. Aquí el diseño está decidido; tú lo armas y agrupas las fechas.",
          instrucciones=["En T2 (desde A5): Categoría en Filas, Fecha en Columnas y Suma de Total en Valores.", "Agrupa las fechas por <b>Trimestres</b> (clic derecho sobre una fecha › Agrupar).", "Escribe en F3 cuánto vendieron los Postres en el 4.º trimestre."],
          pruebas=[{"t": "dinamica", "h": "T2", "filas": ["Categor"], "columnas": ["Fecha|Trimestre"], "valores": ["Total"], "titulo": "Categoría × Fecha con Suma de Total"},
                   {"t": "dinamica", "h": "T2", "agrupada": True, "titulo": "Fechas agrupadas"}, {"t": "valores", "r": "F3", "v": POSTRES_T4, "tol": 1, "titulo": "Postres en el 4.º trimestre"}])


def m17_t3(wb, ws, sol):
    hoja_datos(wb)
    encabezado(ws, "¿Quién aporta más en la sucursal Sur?", "Crea la tabla dinámica desde A6 (deja las filas de arriba para el filtro).")
    pregunta(ws, [("A3", "Vendedor que más aporta en Sur", "E3", None), ("A4", "Su porcentaje de las ventas de Sur", "E4", "0.0%")])
    if sol:
        ws["E3"], ws["E4"] = TOP_VEND, PCT_VEND
        hoja_solucion(wb, ["T3 · Tabla dinámica en T3!A6: Filtros Sucursal = Sur, Filas Vendedor, Valores Suma de Total.", "   Configuración de campo de valor › Mostrar valores como › % del total general. Ordena de mayor a menor.",
                           f"   Respuesta: {TOP_VEND}, {PCT_VEND:.1%}."])


T17_3 = A("T3", "Filtros y porcentaje del total", "T3", apoyo="autonoma", minutos=12, construir=m17_t3,
          contexto="La gerente de Sur quiere saber qué parte de las ventas de su sucursal aporta cada vendedor.",
          instrucciones=["Arma en T3 una tabla dinámica que muestre, solo para Sur, el porcentaje de las ventas que aporta cada vendedor.", "Escribe en E3 el vendedor que más aporta y en E4 su porcentaje."],
          pistas=["Sucursal va en Filtros; el porcentaje se elige en «Mostrar valores como»."],
          pruebas=[{"t": "dinamica", "h": "T3", "filas": ["Vendedor"], "filtros": ["Sucursal"], "titulo": "Vendedor en filas y Sucursal como filtro"}, {"t": "dinamica", "h": "T3", "mostrarComo": True, "titulo": "Valores como porcentaje del total"},
                   {"t": "valores", "r": "E3", "v": TOP_VEND, "titulo": "Vendedor que más aporta"}, {"t": "valores", "r": "E4", "v": PCT_VEND, "tol": 0.006, "titulo": "Su porcentaje"}])

# =============================================================== Módulo 18
FRIO = {s: suma(sucursal=s, categoria="Café frío") for s in ("Centro", "Norte", "Sur")}
TOP_FRIO = max(FRIO, key=FRIO.get)


def m18_t1(wb, ws, sol):
    hoja_datos(wb)
    encabezado(ws, "Gráfico dinámico de ventas por sucursal", "Crea la tabla y el gráfico dinámico en esta hoja.")
    if sol:
        hoja_solucion(wb, ["T1 · Clic en Datos › Insertar › Gráfico dinámico › Hoja existente T1!A5.", "   Eje (categorías): Sucursal · Valores: Suma de Total · tipo Columnas agrupadas · título «Ventas 2025 por sucursal»."])


T18_1 = A("T1", "Del resumen al gráfico dinámico", "T1", apoyo="modelo", minutos=8, construir=m18_t1,
          contexto="Un gráfico dinámico se crea junto con su tabla dinámica y cambia cuando cambia la tabla.",
          modelo="Clic en Datos › Insertar › <b>Gráfico dinámico</b> › Hoja existente T1!A5. Arrastra Sucursal al Eje y Total a Valores. Después, clic en el título del gráfico para escribir el tuyo.",
          instrucciones=["Crea en T1 un gráfico dinámico de columnas con las ventas por sucursal.", "Escribe un título que diga qué muestra."],
          pruebas=[{"t": "dinamica", "h": "T1", "filas": ["Sucursal"], "valores": ["Total"], "titulo": "Tabla dinámica de origen"}, {"t": "grafico", "h": "T1", "dinamico": True, "tipos": ["columnas", "barras"], "conTitulo": True, "titulo": "Gráfico dinámico de columnas con título"}])


def m18_t2(wb, ws, sol):
    hoja_datos(wb)
    encabezado(ws, "Explorar con una segmentación de datos", "Crea la tabla dinámica desde A6.")
    pregunta(ws, [("A3", "Con la segmentación en «Café frío»: ¿qué sucursal vende más?", "F3", None)])
    if sol:
        ws["F3"] = TOP_FRIO
        hoja_solucion(wb, ["T2 · Tabla dinámica en T2!A6: Filas Sucursal, Valores Suma de Total.", "   Analizar tabla dinámica › Insertar segmentación de datos › Categoría. Clic en «Café frío».", f"   Respuesta: {TOP_FRIO} (${FRIO[TOP_FRIO]:,})."])


T18_2 = A("T2", "Segmentación de datos", "T2", apoyo="completar", minutos=8, construir=m18_t2,
          contexto="La tabla de T2 debe poder filtrarse con botones, sin abrir menús.",
          instrucciones=["Crea en T2 la tabla dinámica de ventas por sucursal (desde A6).", "Agrega una segmentación de datos por <b>Categoría</b> y úsala para responder en F3."],
          pruebas=[{"t": "dinamica", "h": "T2", "filas": ["Sucursal"], "valores": ["Total"], "titulo": "Tabla dinámica por sucursal"}, {"t": "segmentacion", "campo": "Categor", "titulo": "Segmentación por Categoría"},
                   {"t": "valores", "r": "F3", "v": TOP_FRIO, "titulo": "Sucursal que más vende Café frío"}])


def m18_t3(wb, ws, sol):
    hoja_datos(wb)
    ws["A1"] = "Tablero de ventas 2025"
    ws["A1"].font = Font(bold=True, size=18, color="5B3A29")
    for i, (t, fmt) in enumerate([("Ventas del año", MONEDA0), ("Ventas de Norte", MONEDA0), ("Unidades vendidas", "#,##0"), ("Ticket promedio", MONEDA)]):
        c = ws.cell(row=3, column=1 + 2 * i, value=t)
        c.font, c.fill = NEGRITA, ENC
        x = ws.cell(row=4, column=1 + 2 * i)
        x.number_format, x.fill = fmt, ENTRADA
        x.font = Font(bold=True, size=14)
        ws.column_dimensions[c.column_letter].width = 18
    if sol:
        hoja_solucion(wb, ["T3 · KPI con fórmulas que leen la hoja Datos (ver A4, C4, E4 y G4).", "   Gráfico dinámico de líneas en T3: Eje Fecha (agrupada por Meses), Valores Suma de Total, título «Ventas mensuales 2025».",
                           "   Analizar › Insertar escala de tiempo › Fecha. Oculta los botones de campo del gráfico y las líneas de cuadrícula de la hoja."])


T18_3 = A("T3", "Un tablero de una pantalla", "T3", apoyo="autonoma", minutos=15, construir=m18_t3,
          contexto="La dirección quiere una sola pantalla: cuatro indicadores arriba y la tendencia del año abajo, filtrable por fecha.",
          instrucciones=["A4, C4, E4 y G4: ventas del año, ventas de Norte, unidades vendidas y ticket promedio, con fórmulas que lean la hoja Datos.", "Abajo, un gráfico dinámico de líneas con las ventas por mes.", "Agrega una escala de tiempo por Fecha y oculta las líneas de cuadrícula de T3."],
          sol={"A4": f"=SUM(Datos!H2:H{UV})", "C4": f'=SUMIFS(Datos!H2:H{UV},Datos!C2:C{UV},"Norte")', "E4": f"=SUM(Datos!F2:F{UV})", "G4": f"=AVERAGE(Datos!H2:H{UV})"},
          sol_extra=lambda wb, ws: setattr(ws.sheet_view, "showGridLines", False),
          pruebas=[{"t": "formula", "r": "A4,C4,E4,G4", "titulo": "Indicadores con fórmulas"}, {"t": "valores", "r": "A4,C4,E4,G4", "titulo": "Indicadores correctos"},
                   {"t": "grafico", "h": "T3", "dinamico": True, "tipos": ["lineas"], "titulo": "Gráfico dinámico de líneas"}, {"t": "escalaTiempo", "titulo": "Escala de tiempo por fecha"},
                   {"t": "vista", "sinCuadricula": True, "titulo": "Sin líneas de cuadrícula"}])

# =============================================================== Módulo 19


def catalogo(wb):
    if "Catálogo" in wb.sheetnames:
        return wb["Catálogo"]
    h = wb.create_sheet("Catálogo")
    h["A1"] = "Catálogo de productos"
    h["A1"].font = Font(bold=True, size=13)
    tabla(h, 3, ["Código", "Producto", "Categoría", "Precio"], [[p["codigo"], p["nombre"], p["categoria"], p["precio"]] for p in PROD], formatos={3: MONEDA}, anchos={"A": 10, "B": 22, "C": 15})
    return h


TICKET = [(PROD[i]["codigo"], q) for i, q in ((1, 2), (4, 1), (7, 3), (10, 2), (12, 1), (15, 4), (18, 2))] + [("CAF-099", 1)]


def m19_t1(wb, ws, sol):
    catalogo(wb)
    encabezado(ws, "Ticket de mostrador", "La caja escribe el código y la cantidad; el resto se busca solo.")
    tabla(ws, 4, ["Código", "Cantidad", "Producto", "Precio", "Importe"], [[c, q, None, None, None] for c, q in TICKET], formatos={3: MONEDA, 4: MONEDA}, anchos={"A": 10, "B": 10, "C": 22, "D": 10, "E": 12})
    ws["C5"] = '=XLOOKUP(A5,Catálogo!$A$4:$A$23,Catálogo!$B$4:$B$23,"No existe")'
    pintar(ws, "C5", MODELO)
    nota(ws, "C5", 'Modelo: =BUSCARX(A5;Catálogo!$A$4:$A$23;Catálogo!$B$4:$B$23;"No existe"). El 4.º argumento es lo que se muestra si el código no está.')
    ws["D13"].number_format = MONEDA
    ws["D14"], ws["E14"] = "Total", None
    ws["D14"].font = NEGRITA
    ws["E14"].number_format = MONEDA
    pintar(ws, "C6:C12,D5:E12,E14", ENTRADA)


T19_1 = A("T1", "Buscar con BUSCARX", "T1", apoyo="modelo", minutos=8, construir=m19_t1,
          contexto="C5 ya busca el nombre del producto. El último código (CAF-099) no existe: el ticket no debe mostrar errores.",
          modelo='C5 = <code>=BUSCARX(A5;Catálogo!$A$4:$A$23;Catálogo!$B$4:$B$23;"No existe")</code>: busca A5 en la columna de códigos y devuelve el nombre de la misma fila.',
          instrucciones=["Copia C5 hasta C12.", "D5:D12: precio con BUSCARX; si el código no existe, 0.", "E5:E12: importe; E14: total del ticket."],
          sol={"C5:C12": '=XLOOKUP(A5,Catálogo!$A$4:$A$23,Catálogo!$B$4:$B$23,"No existe")', "D5:D12": "=XLOOKUP(A5,Catálogo!$A$4:$A$23,Catálogo!$D$4:$D$23,0)", "E5:E12": "=B5*D5", "E14": "=SUM(E5:E12)"},
          pruebas=[{"t": "usa", "r": "D5:D12", "f": ["XLOOKUP"], "titulo": "Precio con BUSCARX"}, {"t": "valores", "r": "C5:E12", "titulo": "Ticket correcto, sin errores", "msg": "{celda} muestra {obtenido}; debería ser {esperado}."},
                   {"t": "valores", "r": "E14", "titulo": "Total del ticket"}, {"t": "robustez", "r": "C5:E12,E14", "cambios": {"A6": PROD[0]["codigo"], "Catálogo!D10": 99}, "titulo": "Se actualiza si cambian el código o el precio"}])

ZONAS = ["Centro", "Poniente", "Oriente", "Foráneo"]
PESOS = ["Chico", "Mediano", "Grande"]
TARIFA = [[45, 60, 80], [55, 75, 95], [60, 85, 110], [120, 160, 210]]
ENVIOS = [(f"E-{500 + i}", ZONAS[(i * 3) % 4], PESOS[(i * 2) % 3], 1 + i % 3) for i in range(12)]


def m19_t2(wb, ws, sol):
    encabezado(ws, "Costo de envíos de catering", "La tarifa depende de la zona (fila) y del tamaño del paquete (columna).")
    tabla(ws, 4, ["Envío", "Zona", "Tamaño", "Cajas", "Tarifa", "Costo"], [list(e) + [None, None] for e in ENVIOS], formatos={4: MONEDA, 5: MONEDA}, anchos={"A": 9, "B": 10, "C": 10, "D": 8, "E": 10, "F": 10, "H": 12})
    ws["H4"] = "Zona \\ Tamaño"
    ws["H4"].font = NEGRITA
    for j, p in enumerate(PESOS):
        c = ws.cell(row=4, column=9 + j, value=p)
        c.font, c.fill = NEGRITA, ENC
    for i, z in enumerate(ZONAS):
        ws.cell(row=5 + i, column=8, value=z).font = NEGRITA
        for j in range(3):
            ws.cell(row=5 + i, column=9 + j, value=TARIFA[i][j]).number_format = MONEDA0
    ws["E5"] = "=INDEX($I$5:$K$8,MATCH(B5,$H$5:$H$8,0),MATCH(C5,$I$4:$K$4,0))"
    pintar(ws, "E5", MODELO)
    nota(ws, "E5", "Modelo: =INDICE($I$5:$K$8;COINCIDIR(B5;$H$5:$H$8;0);COINCIDIR(C5;$I$4:$K$4;0)). El primer COINCIDIR da la fila y el segundo, la columna.")
    pintar(ws, "E6:E16,F5:F16", ENTRADA)


T19_2 = A("T2", "INDICE y COINCIDIR en dos direcciones", "T2", apoyo="completar", minutos=8, construir=m19_t2,
          contexto="E5 ya encuentra la tarifa cruzando la zona con el tamaño.",
          instrucciones=["Copia E5 hasta E16.", "F5:F16: costo = tarifa × cajas."],
          sol={"E5:E16": "=INDEX($I$5:$K$8,MATCH(B5,$H$5:$H$8,0),MATCH(C5,$I$4:$K$4,0))", "F5:F16": "=D5*E5"},
          pruebas=[{"t": "usa", "r": "E5:E16", "f": ["INDEX", "XLOOKUP"], "titulo": "Tarifa con INDICE/COINCIDIR"}, {"t": "valores", "r": "E5:F16", "titulo": "Tarifas y costos correctos"},
                   {"t": "robustez", "r": "E5:F16", "cambios": {"J6": 999, "B7": "Foráneo"}, "titulo": "Se actualiza si cambian la tarifa o la zona"}])

PED = D["pedidos"]
NP = len(PED)
CLIENTES_U = sorted({p["cliente"] for p in PED})
_pend = defaultdict(int)
for p in PED:
    if p["estado"] == "Pendiente":
        _pend[p["cliente"]] += 1
CLI19 = max(_pend, key=_pend.get)
PEND19 = [p for p in PED if p["cliente"] == CLI19 and p["estado"] == "Pendiente"]


def hoja_pedidos(wb):
    if "Pedidos" in wb.sheetnames:
        return wb["Pedidos"]
    h = wb.create_sheet("Pedidos")
    h["A1"] = "Pedidos corporativos"
    h["A1"].font = Font(bold=True, size=13)
    tabla(h, 3, ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Estado"], [[p["folio"], p["fecha"], p["cliente"], p["sucursal"], p["producto"], p["cantidad"], p["precio"], p["estado"]] for p in PED],
          formatos={6: MONEDA}, anchos={"A": 8, "B": 11, "C": 24, "D": 10, "E": 16})
    return h


UP = 3 + NP


def m19_t3(wb, ws, sol):
    hoja_pedidos(wb)
    encabezado(ws, "Consulta de pendientes por cliente", "Elige el cliente en H2 y la hoja muestra sus pedidos pendientes.")
    etiquetas(ws, [("G2", "Cliente")])
    ws["H2"] = CLI19
    ws["H2"].fill = ENTRADA
    ws["A4"] = "Clientes"
    ws["A4"].font = NEGRITA
    for j, t in enumerate(["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Estado"]):
        c = ws.cell(row=4, column=3 + j, value=t)
        c.font, c.fill = NEGRITA, ENC
    anchos(ws, A=24, B=3, C=8, D=11, E=24, F=10, G=16, H=24)
    formato(ws, f"D5:D{4 + len(PEND19)}", FECHA)
    pintar(ws, "A5,C5", ENTRADA)


NPE = len(PEND19)


def m19_t3_sol(wb, ws):
    for celda, ref in (("A5", f"A5:A{4 + len(CLIENTES_U)}"), ("C5", f"C5:J{4 + NPE}")):
        ws[celda] = ArrayFormula(ref, ws[celda].value)


T19_3 = A("T3", "Matrices dinámicas: UNICOS, ORDENAR y FILTRAR", "T3", apoyo="autonoma", minutos=12, construir=m19_t3, sol_extra=m19_t3_sol,
          contexto=f"Atención a clientes quiere una consulta que se llene sola. La hoja Pedidos tiene {NP} pedidos.",
          instrucciones=["A5: la lista de clientes sin repetir y en orden alfabético, con una sola fórmula.", "C5: todos los pedidos <b>pendientes</b> del cliente de H2 (las 8 columnas), con una sola fórmula; si no tiene, «Sin pendientes».",
                         "Cambia H2 por otro cliente para comprobar que la consulta se actualiza (y vuelve a dejar «" + CLI19 + "» antes de subir)."],
          pistas=['Dos condiciones en FILTRAR se multiplican: <code>(Pedidos!C4:C43=$H$2)*(Pedidos!H4:H43="Pendiente")</code>.'],
          sol={"A5": f"=SORT(UNIQUE(Pedidos!C4:C{UP}))", "C5": f'=FILTER(Pedidos!A4:H{UP},(Pedidos!C4:C{UP}=$H$2)*(Pedidos!H4:H{UP}="Pendiente"),"Sin pendientes")'},
          pruebas=[{"t": "usa", "r": "A5", "f": ["UNIQUE"], "titulo": "Clientes con UNICOS"}, {"t": "usa", "r": "A5", "f": ["SORT", "SORTBY"], "titulo": "Lista ordenada con ORDENAR"},
                   {"t": "valores", "r": f"A5:A{4 + len(CLIENTES_U)}", "v": CLIENTES_U, "titulo": "Lista de clientes completa y en orden"}, {"t": "usa", "r": "C5", "f": ["FILTER"], "titulo": "Pendientes con FILTRAR"},
                   {"t": "valores", "r": f"C5:C{4 + NPE}", "v": [p["folio"] for p in PEND19], "titulo": f"Los {NPE} pendientes de {CLI19}"}, {"t": "valores", "r": f"J5:J{4 + NPE}", "v": "Pendiente", "titulo": "Solo pedidos pendientes"}])

# =============================================================== Módulo 20
TURNOS = [("Andrea Solís", 12850, 40, 312), ("Daniel Pineda", 9400, 0, 0), ("Elena Robles", 11020, 36, 280), ("Fernando Ibarra", 0, 0, 0), ("Gabriela Luna", 10250, 32, 245), ("Héctor Vargas", 8800, 28, 230),
          ("Isabel Cruz", 7600, 0, 190), ("Jorge Medina", 9950, 30, 0), ("Karen Salazar", 12100, 40, 305), ("Leonardo Ríos", 6900, 22, 170)]


def m20_t1(wb, ws, sol):
    encabezado(ws, "Productividad por hora de la semana 46", "Algunas personas estuvieron de vacaciones: sin horas registradas.")
    tabla(ws, 4, ["Empleado", "Ventas", "Horas", "Tickets", "Venta por hora", "Ticket promedio"], [list(t) + [None, None] for t in TURNOS], formatos={1: MONEDA0, 4: MONEDA, 5: MONEDA}, anchos={"A": 18, "E": 15, "F": 16})
    ws["E5"] = '=IFERROR(B5/C5,"Sin horas")'
    pintar(ws, "E5", MODELO)
    nota(ws, "E5", 'Modelo: =SI.ERROR(B5/C5;"Sin horas"). Si la división da error (#¡DIV/0!), muestra el texto.')
    pintar(ws, "E6:E14,F5:F14", ENTRADA)


T20_1 = A("T1", "SI.ERROR para divisiones entre cero", "T1", apoyo="modelo", minutos=6, construir=m20_t1,
          contexto="E5 ya evita el error #¡DIV/0! cuando no hay horas.",
          modelo='E5 = <code>=SI.ERROR(B5/C5;"Sin horas")</code>: primero el cálculo, luego lo que se muestra si falla.',
          instrucciones=["Copia E5 hasta E14.", "F5:F14: ticket promedio (ventas ÷ tickets); si no hay tickets, 0."],
          sol={"E5:E14": '=IFERROR(B5/C5,"Sin horas")', "F5:F14": "=IFERROR(B5/D5,0)"},
          pruebas=[{"t": "usa", "r": "F5:F14", "f": ["IFERROR"], "titulo": "Ticket promedio con SI.ERROR"}, {"t": "valores", "r": "E5:F14", "titulo": "Sin errores y con valores correctos"},
                   {"t": "robustez", "r": "E5:F14", "cambios": {"C5": 0, "D7": 55}, "titulo": "Sigue sin errores si cambian los datos"}])

CONVENIOS = [("Despacho Luna & Asoc.", 0.08), ("Notaría 14", 0.1), ("Coworking Nodo", 0.05), ("Hospital San Rafael", 0.12), ("Agencia Pixel", 0.06)]
FACT = [(c["cliente"], 1800 + 370 * i) for i, c in enumerate(D["clientesCorp"])] + [("Colegio Montebello", 2500), ("Inmobiliaria Cumbres", 3100)]


def m20_t2(wb, ws, sol):
    encabezado(ws, "Facturación de noviembre con convenios", "Solo algunos clientes tienen convenio de descuento (tabla H:I).")
    tabla(ws, 4, ["Cliente", "Importe", "Descuento", "A pagar"], [[c, i, None, None] for c, i in FACT], formatos={1: MONEDA, 2: "0%", 3: MONEDA}, anchos={"A": 26, "B": 12, "C": 12, "D": 12, "H": 26})
    tabla(ws, 4, ["Cliente con convenio", "Descuento"], [list(c) for c in CONVENIOS], col=8, formatos={1: "0%"})
    ws["C5"] = "=IFNA(VLOOKUP(A5,$H$5:$I$9,2,FALSE),0)"
    pintar(ws, "C5", MODELO)
    nota(ws, "C5", "Modelo: =SI.ND(BUSCARV(A5;$H$5:$I$9;2;FALSO);0). Si el cliente no tiene convenio, BUSCARV da #N/D y SI.ND lo cambia por 0.")
    pintar(ws, f"C6:C{4 + len(FACT)},D5:D{4 + len(FACT)}", ENTRADA)


NF = 4 + len(FACT)
T20_2 = A("T2", "SI.ND con búsquedas", "T2", apoyo="completar", minutos=8, construir=m20_t2,
          contexto="C5 ya busca el descuento y pone 0 si el cliente no tiene convenio.",
          instrucciones=[f"Copia C5 hasta C{NF}.", f"D5:D{NF}: importe a pagar con el descuento aplicado."],
          sol={f"C5:C{NF}": "=IFNA(VLOOKUP(A5,$H$5:$I$9,2,FALSE),0)", f"D5:D{NF}": "=B5*(1-C5)"},
          pruebas=[{"t": "usa", "r": f"C5:C{NF}", "f": ["IFNA", "IFERROR", "XLOOKUP"], "titulo": "Sin #N/D (SI.ND o BUSCARX)"}, {"t": "valores", "r": f"C5:D{NF}", "titulo": "Descuentos e importes correctos"},
                   {"t": "robustez", "r": f"C5:D{NF}", "cambios": {"I6": 0.2, "H9": "Colegio Montebello"}, "titulo": "Se actualiza si cambian los convenios"}])

COMIS = [("Andrea Solís", 12850), ("Daniel Pineda", 9400), ("Elena Robles", 11020), ("Fernando Ibarra", 15200), ("Gabriela Luna", 10250), ("Héctor Vargas", 8800), ("Isabel Cruz", 7600), ("Jorge Medina", 9950)]


def m20_t3(wb, ws, sol):
    encabezado(ws, "Comisiones de noviembre (con errores)", "Alguien armó esta hoja con prisa: tiene cinco errores. Encuéntralos y corrígelos.")
    tabla(ws, 4, ["Vendedor", "Ventas", "Comisión", "% del total"], [list(c) + [None, None] for c in COMIS], formatos={1: MONEDA0, 2: MONEDA, 3: "0.0%"}, anchos={"A": 18, "B": 12, "C": 12, "D": 12, "F": 16})
    etiquetas(ws, [("F2", "Tasa de comisión")])
    ws["G2"] = 0.05
    ws["G2"].number_format = "0%"
    ws["B8"] = "15,200"  # error 3: número guardado como texto
    for r in range(5, 13):
        ws.cell(row=r, column=3, value=f"=B{r}*G{r - 3}")  # error 1: falta el $
        ws.cell(row=r, column=4, value=f"=B{r}/B{r + 8}")  # error 5: falta el $
    ws["A13"] = "Total"
    ws["A13"].font = NEGRITA
    ws["B13"] = "=SUM(B5:B11)"  # error 2: rango incompleto
    ws["C13"] = "=SUMA(C5:C12)"  # error 4: #¿NOMBRE?
    formato(ws, "B13", MONEDA0)
    formato(ws, "C13", MONEDA)


def m20_t3_sol(wb, ws):
    ws["B8"] = 15200
    ws["B8"].number_format = MONEDA0
    hoja_solucion(wb, ["T3 · Los cinco errores sembrados:", "   1) C5:C12 =B5*G2 copiada sin $ → =B5*$G$2.", "   2) B13 =SUMA(B5:B11) deja fuera la fila 12 → =SUMA(B5:B12).", "   3) B8 tiene el texto «15,200» → escribir el número 15200.",
                       "   4) C13 escribe mal la función (#¿NOMBRE?) → =SUMA(C5:C12).", "   5) D5:D12 =B5/B13 copiada sin $ (#¡DIV/0!) → =B5/$B$13.", "   Herramientas: Fórmulas › Rastrear precedentes, Comprobación de errores y Mostrar fórmulas (Ctrl+`)."])


T20_3 = A("T3", "Cazar y corregir errores", "T3", apoyo="autonoma", minutos=12, construir=m20_t3, sol_extra=m20_t3_sol,
          contexto="La hoja tiene cinco errores de distintos tipos: referencias sin fijar, un rango incompleto, un número escrito como texto y un nombre de función mal escrito.",
          instrucciones=["Usa Rastrear precedentes, Comprobación de errores y Mostrar fórmulas para encontrar los cinco errores de T3.", "Corrígelos sin cambiar los datos de los vendedores (salvo el que está mal capturado)."],
          pistas=["Un número guardado como texto se alinea a la izquierda y lleva un triángulo verde.", "Si al copiar una fórmula el resultado cambia de forma extraña, revisa los $."],
          sol={"C5:C12": "=B5*$G$2", "B13": "=SUM(B5:B12)", "C13": "=SUM(C5:C12)", "D5:D12": "=B5/$B$13"},
          pruebas=[{"t": "js", "fn": "(L) => typeof L.valor(L.hoja('T3'), 'B8') === 'number' ? true : 'B8 sigue siendo texto: escribe el número sin comillas ni comas de texto.'", "titulo": "B8 es un número"},
                   {"t": "valores", "r": "C5:C12", "titulo": "Comisiones con la tasa fija"}, {"t": "valores", "r": "B13:C13", "titulo": "Totales completos y sin #¿NOMBRE?"},
                   {"t": "valores", "r": "D5:D12", "titulo": "Porcentajes sin #¡DIV/0!"}, {"t": "robustez", "r": "B13:C13,C5:D12", "cambios": {"G2": 0.07, "B12": 20000}, "titulo": "La hoja corregida se actualiza bien"}])

# =============================================================== Módulo 21


def m21_t1(wb, ws, sol):
    encabezado(ws, "Credenciales y existencias", "Los formatos personalizados cambian cómo se ve un número sin cambiar su valor.")
    filas = [[7 + 3 * i, e["nombre"], 40 + (i * 13) % 90] for i, e in enumerate(D["empleados"][:16])]
    tabla(ws, 4, ["Número", "Empleado", "Existencia asignada"], filas, anchos={"A": 12, "B": 20, "C": 18})
    ws["A5"].number_format = '"EMP-"0000'
    pintar(ws, "A5", MODELO)
    nota(ws, "A5", 'Modelo: Formato de celdas › Personalizada › "EMP-"0000. El valor sigue siendo 7; solo se ve EMP-0007.')


T21_1 = A("T1", "Formatos de número personalizados", "T1", apoyo="modelo", minutos=6, construir=m21_t1,
          contexto="A5 ya se ve como EMP-0007 aunque su valor es 7.",
          modelo='A5 tiene el formato personalizado <code>"EMP-"0000</code>: el texto entre comillas se muestra tal cual y 0000 rellena con ceros.',
          instrucciones=["Aplica el mismo formato a A6:A20 (puedes usar Copiar formato).", 'C5:C20: formato personalizado que muestre el número con separador de miles y la palabra «pzas» (por ejemplo, <code>#,##0 "pzas"</code>).'],
          sol_extra=lambda wb, ws: (formato(ws, "A5:A20", '"EMP-"0000'), formato(ws, "C5:C20", '#,##0 "pzas"')),
          pruebas=[{"t": "fmt", "r": "A5:A20", "patron": "0000", "titulo": "Números como EMP-0000"}, {"t": "fmt", "r": "C5:C20", "patron": "pzas", "titulo": "Existencias con «pzas»"},
                   {"t": "valores", "r": "A6", "v": 10, "titulo": "Los valores no cambian (solo el formato)"}])

PED21 = D["pedidos"][:24]


def m21_t2(wb, ws, sol):
    encabezado(ws, "Pedidos de la semana", "Marca la fila completa de los pedidos atrasados.")
    filas = [[p["folio"], p["fecha"], p["cliente"], p["sucursal"], p["producto"], p["cantidad"], p["compromiso"], "Atrasado" if i % 5 == 2 else p["estado"]] for i, p in enumerate(PED21)]
    tabla(ws, 4, ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Compromiso", "Estado"], filas, anchos={"A": 8, "B": 11, "C": 24, "D": 10, "E": 16, "F": 9, "G": 12, "H": 11})
    regla = Rule(type="expression", formula=['$H5="Atrasado"'], dxf=DifferentialStyle(fill=PatternFill("solid", bgColor="F8D7DA"), font=Font(color="9C0006")))
    ws.conditional_formatting.add("A5:H28" if sol else "H5:H28", regla)


T21_2 = A("T2", "Regla con fórmula para la fila completa", "T2", apoyo="completar", minutos=6, construir=m21_t2,
          contexto='Ya existe la regla con la fórmula <code>=$H5="Atrasado"</code>, pero solo pinta la columna H.',
          instrucciones=["Abre Formato condicional › Administrar reglas y cambia «Se aplica a» para que cubra toda la tabla A5:H28.", "Comprueba que la fila completa de cada pedido atrasado se pinta (el $ de $H5 fija la columna del estado)."],
          pruebas=[{"t": "condicional", "r": "A5:H28", "tipo": "expression", "contiene": "\\$H5", "titulo": "La regla cubre A5:H28 y mira la columna H"}])

DIAS21 = [iso_mas("2025-12-01", i) for i in range(31)]
FEST21 = ["2025-12-12", "2025-12-25"]


def m21_t3(wb, ws, sol):
    encabezado(ws, "Rol de turnos de diciembre", "Fines de semana y festivos se pagan distinto: deben verse de inmediato.")
    nombres = [e["nombre"].split()[0] for e in D["empleados"][:9]]
    tabla(ws, 4, ["Fecha", "Apertura", "Cierre", "Refuerzo"], [[d, nombres[i % 9], nombres[(i + 3) % 9], nombres[(i + 6) % 9]] for i, d in enumerate(DIAS21)], anchos={"A": 14, "B": 12, "C": 12, "D": 12, "F": 14})
    etiquetas(ws, [("F4", "Festivos")])
    for i, f in enumerate(FEST21):
        ws.cell(row=5 + i, column=6, value=serial(f)).number_format = FECHA
    if sol:
        formato(ws, "A5:A35", "ddd dd/mm")
        ws.conditional_formatting.add("A5:D35", Rule(type="expression", formula=["COUNTIF($F$5:$F$6,$A5)>0"], dxf=DifferentialStyle(fill=PatternFill("solid", bgColor="F8D7DA")), stopIfTrue=True))
        ws.conditional_formatting.add("A5:D35", Rule(type="expression", formula=["WEEKDAY($A5,2)>5"], dxf=DifferentialStyle(fill=PatternFill("solid", bgColor="DDEBF7"))))


T21_3 = A("T3", "Calendario con reglas de fecha", "T3", apoyo="autonoma", minutos=10, construir=m21_t3,
          contexto="El rol de diciembre tiene una fila por día. Los festivos están en F5:F6.",
          instrucciones=['A5:A35: formato personalizado que muestre el día de la semana abreviado y la fecha (por ejemplo, <code>ddd dd/mm</code>).', "Pinta de azul la fila completa (A:D) de los sábados y domingos.", "Pinta de rojo la fila completa de los festivos de F5:F6."],
          pistas=["Fin de semana: <code>=DIASEM($A5;2)&gt;5</code>.", "Festivo: <code>=CONTAR.SI($F$5:$F$6;$A5)&gt;0</code>."],
          pruebas=[{"t": "fmt", "r": "A5:A35", "patron": "ddd", "titulo": "Fechas con el día de la semana"}, {"t": "condicional", "r": "A5:D35", "tipo": "expression", "contiene": "WEEKDAY", "titulo": "Fines de semana resaltados (DIASEM)"},
                   {"t": "condicional", "r": "A5:D35", "tipo": "expression", "contiene": "COUNTIF|MATCH|XLOOKUP|OR\\(", "titulo": "Festivos resaltados"}])

# =============================================================== Módulo 22
PRECIO, COSTO, FIJOS, CAFES = 45, 14, 150000, 4000


def modelo_equilibrio(ws, fila=4):
    etq = [("Precio promedio por café", PRECIO, MONEDA), ("Costo variable por café", COSTO, MONEDA), ("Costos fijos del mes", FIJOS, MONEDA0), ("Cafés vendidos en el mes", CAFES, "#,##0.0")]
    for i, (t, v, f) in enumerate(etq):
        ws.cell(row=fila + i, column=1, value=t)
        c = ws.cell(row=fila + i, column=2, value=v)
        c.number_format, c.fill = f, ENTRADA
    ws.cell(row=fila + 5, column=1, value="Utilidad del mes").font = NEGRITA
    c = ws.cell(row=fila + 5, column=2, value=f"=B{fila + 3}*(B{fila}-B{fila + 1})-B{fila + 2}")
    c.number_format, c.font = MONEDA0, NEGRITA
    anchos(ws, A=28, B=14)


EQ = FIJOS / (PRECIO - COSTO)


def m22_t1(wb, ws, sol):
    encabezado(ws, "¿Cuántos cafés hay que vender para no perder?", "Modelo de una sucursal: la utilidad (B9) depende de los cuatro datos de arriba.")
    modelo_equilibrio(ws)
    pintar(ws, "B9", MODELO)
    nota(ws, "B9", "Modelo: B9 = cafés × (precio − costo variable) − costos fijos. Con 4,000 cafés hay pérdida.")
    if sol:
        ws["B7"] = EQ


T22_1 = A("T1", "Buscar objetivo", "T1", apoyo="modelo", minutos=6, construir=m22_t1,
          contexto="La fórmula de B9 ya calcula la utilidad. Con 4,000 cafés la sucursal pierde dinero.",
          modelo="Datos › Análisis de hipótesis › <b>Buscar objetivo</b>: Definir la celda <b>B9</b>, Con el valor <b>0</b>, Cambiando la celda <b>B7</b>. Excel prueba valores de B7 hasta que B9 vale 0.",
          instrucciones=["Usa Buscar objetivo para que la utilidad (B9) sea 0 cambiando los cafés vendidos (B7).", "Acepta el resultado: B7 debe quedar como número (no fórmula)."],
          pruebas=[{"t": "valores", "r": "B9", "v": 0, "tol": 1, "titulo": "Utilidad en cero"}, {"t": "valores", "r": "B7", "v": EQ, "tol": 1, "titulo": f"Punto de equilibrio ≈ {EQ:,.0f} cafés"},
                   {"t": "sinFormula", "r": "B7", "titulo": "B7 conserva un valor (resultado de Buscar objetivo)"}, {"t": "formula", "r": "B9", "titulo": "B9 sigue siendo fórmula"}])

ESC = {"Base": (45, 4000), "Optimista": (48, 5200), "Pesimista": (42, 3300)}


def escenario(nombre):
    p, c = ESC[nombre]
    return Scenario(name=nombre, inputCells=[InputCells(r="B4", val=str(p)), InputCells(r="B7", val=str(c))], user="La Taza")


def m22_t2_sol(wb, ws):
    h = wb.create_sheet("Resumen del escenario")
    h["B2"] = "Resumen del escenario"
    h["B2"].font = Font(bold=True, size=13)
    tabla(h, 4, ["", "Valores actuales"] + list(ESC), [["Precio (B4)", PRECIO] + [p for p, _ in ESC.values()], ["Cafés (B7)", CAFES] + [c for _, c in ESC.values()],
                                                     ["Utilidad (B9)", CAFES * (PRECIO - COSTO) - FIJOS] + [c * (p - COSTO) - FIJOS for p, c in ESC.values()]], col=2, anchos={"B": 16, "C": 16, "D": 12, "E": 12, "F": 12})


def m22_t2(wb, ws, sol):
    encabezado(ws, "Tres escenarios para la junta", "Precio y volumen cambian juntos según el escenario.")
    modelo_equilibrio(ws)
    tabla(ws, 12, ["Escenario", "Precio (B4)", "Cafés (B7)"], [[k, p, c] for k, (p, c) in ESC.items()], formatos={1: MONEDA}, anchos={"C": 12})
    ws.scenarios = ScenarioList(scenario=[escenario(n) for n in (ESC if sol else ["Base"])])


T22_2 = A("T2", "Administrador de escenarios", "T2", apoyo="completar", minutos=8, construir=m22_t2, sol_extra=m22_t2_sol,
          contexto="El escenario <b>Base</b> ya está guardado (Datos › Análisis de hipótesis › Administrador de escenarios).",
          instrucciones=["Agrega los escenarios <b>Optimista</b> y <b>Pesimista</b> con los valores de la tabla A12:C15 (celdas cambiantes B4 y B7).", "Crea un resumen de escenarios con la celda de resultado B9 (botón Resumen)."],
          pruebas=[{"t": "escenarios", "min": 3, "titulo": "Tres escenarios guardados"},
                   {"t": "js", "fn": "(L) => { const h = L.hoja('T2'); const n = h.escenarios.map((e) => e.nombre.toLowerCase()); return ['optimista', 'pesimista'].every((x) => n.some((y) => y.includes(x))) ? true : 'Los escenarios deben llamarse Optimista y Pesimista.'; }", "titulo": "Nombres Optimista y Pesimista"},
                   {"t": "hoja", "h": "Resumen del escenario", "msg": "Falta la hoja «Resumen del escenario» (Administrador de escenarios › Resumen › celda de resultado B9).", "titulo": "Resumen del escenario"}])

PRECIOS22 = [40, 42, 45, 48, 50]
CAFES22 = [3000, 4000, 5000, 6000]


def m22_t3(wb, ws, sol):
    encabezado(ws, "Tabla de sensibilidad: precio × volumen", "¿Con qué combinaciones de precio y cafés hay ganancia?")
    modelo_equilibrio(ws)
    ws["D4"] = "Utilidad según precio (filas) y cafés vendidos (columnas)"
    ws["D4"].font = NEGRITA
    ws["D5"] = "=B9"
    ws["D5"].number_format = MONEDA0
    for j, c in enumerate(CAFES22):
        x = ws.cell(row=5, column=5 + j, value=c)
        x.font, x.fill, x.number_format = NEGRITA, ENC, "#,##0"
    for i, p in enumerate(PRECIOS22):
        x = ws.cell(row=6 + i, column=4, value=p)
        x.font, x.fill, x.number_format = NEGRITA, ENC, MONEDA0
    formato(ws, "E6:H10", MONEDA0)
    pintar(ws, "E6:H10", ENTRADA)
    if sol:
        ws["E6"] = DataTableFormula(ref="E6:H10", dt2D=True, dtr=True, r1="B7", r2="B4")
        ws.conditional_formatting.add("E6:H10", Rule(type="cellIs", operator="lessThan", formula=["0"], dxf=DifferentialStyle(font=Font(color="9C0006"), fill=PatternFill("solid", bgColor="F8D7DA"))))


T22_3 = A("T3", "Tabla de datos de dos variables", "T3", apoyo="autonoma", minutos=10, construir=m22_t3,
          contexto="D5 apunta a la utilidad; los precios están en D6:D10 y los volúmenes en E5:H5.",
          instrucciones=["Selecciona D5:H10 y crea una tabla de datos: celda de entrada de fila B7 (cafés), de columna B4 (precio).", "Resalta en rojo las combinaciones con pérdida (formato condicional menor que 0)."],
          pistas=["Datos › Análisis de hipótesis › Tabla de datos. La fila de arriba (E5:H5) cambia B7; la columna (D6:D10) cambia B4."],
          pruebas=[{"t": "tablaDatos", "titulo": "Tabla de datos creada"}, {"t": "valores", "r": "H10", "v": CAFES22[-1] * (PRECIOS22[-1] - COSTO) - FIJOS, "tol": 1, "titulo": "Resultado de la esquina (precio $50, 6,000 cafés)"},
                   {"t": "valores", "r": "E6", "v": CAFES22[0] * (PRECIOS22[0] - COSTO) - FIJOS, "tol": 1, "titulo": "Resultado de la otra esquina (precio $40, 3,000 cafés)"},
                   {"t": "condicional", "r": "E6:H10", "titulo": "Pérdidas resaltadas"}])

# =============================================================== Módulo 23
ARCHIVO_PQ = "t23-power-query-datos.zip"


def recursos_pq(pub, priv):
    pub.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(pub / ARCHIVO_PQ, "w", zipfile.ZIP_DEFLATED) as z:
        for suc in ("Centro", "Norte", "Sur"):
            z.writestr(f"octubre/ventas-{suc.lower()}-10.csv", GL.csv_sucursal("10", suc).encode("utf-8"))
        cat = "﻿producto,categoria,costo\r\n" + "".join(f'{p["nombre"]},{p["categoria"]},{p["costo"]}\r\n' for p in PROD)
        z.writestr("catalogo.csv", cat.encode("utf-8"))


def m23_base(titulo, texto, celda="A5"):
    def f(wb, ws, sol):
        encabezado(ws, titulo, texto)
        ws[celda] = "Carga aquí el resultado de la consulta (Cerrar y cargar en… › Tabla › Hoja existente " + ws.title + "!" + celda + ")."
        ws[celda].font = Font(italic=True, color="7A6A5E")
        if sol:
            hoja_solucion(wb, SOL_PQ[ws.title])
    return f


SOL_PQ = {
    "T1": ["T1 · Datos › Obtener datos › Desde archivo › Desde texto/CSV › octubre/ventas-centro-10.csv › Transformar datos.", "   Inicio › Usar la primera fila como encabezado. Filtra producto ≠ TOTAL y quita las filas en blanco.",
           "   Transformar › Formato › Recortar y Poner En Mayúsculas Cada Palabra en «producto». Tipos: fecha, entero, número decimal. Quita la columna notas.",
           "   Código M esperado (resumen): Csv.Document · Table.PromoteHeaders · Table.SelectRows([producto] <> \"TOTAL\") · Table.TransformColumns(Text.Trim / Text.Proper) · Table.RemoveColumns."],
    "T2": ["T2 · Datos › Obtener datos › Desde archivo › Desde carpeta › octubre › Combinar y transformar (o importa los tres CSV y usa Anexar consultas como nuevas).", "   Aplica los mismos pasos de limpieza de T1 a la consulta combinada (o a la consulta de ejemplo).",
           "   Código M esperado: Folder.Files o Table.Combine, y la columna Source.Name (o una columna Sucursal) para saber de dónde viene cada fila."],
    "T3": ["T3 · Importa catalogo.csv. Sobre la consulta combinada de T2: Inicio › Combinar consultas › producto = producto (Externa izquierda) › expande categoria y costo.", "   Agrega una columna personalizada Importe = [cantidad] * [precio]. Inicio › Agrupar por categoria: suma de Importe y de cantidad.",
           "   Código M esperado: Table.NestedJoin · Table.ExpandTableColumn · Table.AddColumn · Table.Group."],
}
T23_1 = A("T1", "Importar y limpiar un CSV", "T1", apoyo="modelo", minutos=12, construir=m23_base("Ventas de octubre · sucursal Centro", "El sistema de caja exporta un CSV con fila TOTAL, espacios y mayúsculas mezcladas."),
          contexto=f"Descarga {ARCHIVO_PQ} y descomprímelo. El primer archivo, octubre/ventas-centro-10.csv, trae los problemas típicos de una exportación.",
          modelo="Así se ve el código M de una limpieza bien hecha (Inicio › Editor avanzado):<br><code>Origen = Csv.Document(File.Contents(\"…ventas-centro-10.csv\"), [Delimiter=\",\", Encoding=65001]),<br>Encabezados = Table.PromoteHeaders(Origen),<br>SinTotal = Table.SelectRows(Encabezados, each [producto] &lt;&gt; \"TOTAL\" and [fecha] &lt;&gt; \"\"),<br>Limpio = Table.TransformColumns(SinTotal, {{\"producto\", each Text.Proper(Text.Trim(_))}})</code>",
          instrucciones=["Importa el CSV de Centro con Datos › Obtener datos › Desde texto/CSV y abre el editor (Transformar datos).", "Quita la fila TOTAL y las filas vacías, recorta y pon en mayúscula inicial el producto, quita la columna notas y asigna los tipos de dato.", "Carga el resultado como tabla en T1!A5."],
          pruebas=[{"t": "consulta", "titulo": "Datos importados con Power Query"}, {"t": "consulta", "pasos": [{"patron": "Csv\\.Document", "msg": "La consulta debe leer el archivo CSV (Desde texto/CSV)."}], "titulo": "Origen: archivo CSV"},
                   {"t": "consulta", "pasos": [{"patron": "Table\\.SelectRows", "msg": "Filtra la fila TOTAL y las vacías (flecha del encabezado › desmarca TOTAL)."}], "titulo": "Fila TOTAL filtrada"},
                   {"t": "consulta", "pasos": [{"patron": "Text\\.Trim|Text\\.Clean", "msg": "Recorta los espacios del producto (Transformar › Formato › Recortar)."}], "titulo": "Espacios recortados"}, {"t": "consulta", "cargada": True, "titulo": "Resultado cargado en una hoja"}])
T23_2 = A("T2", "Anexar las tres sucursales", "T2", apoyo="completar", minutos=12, construir=m23_base("Ventas de octubre · las tres sucursales", "Una sola tabla con las ventas de Centro, Norte y Sur."),
          contexto="La limpieza de T1 ya funciona para un archivo. Ahora hay que unir los tres con los mismos pasos.",
          instrucciones=["Opción A: Obtener datos › Desde carpeta › octubre › Combinar y transformar. Opción B: importa Norte y Sur como en T1 y usa Anexar consultas como nuevas.", "La tabla final debe indicar de qué sucursal viene cada fila (Source.Name o una columna Sucursal).", "Carga el resultado en T2!A5."],
          pruebas=[{"t": "consulta", "min": 2, "titulo": "Más de una consulta"}, {"t": "consulta", "pasos": [{"patron": "Table\\.Combine|Folder\\.Files", "msg": "Une los archivos: Anexar consultas (Table.Combine) o Desde carpeta (Folder.Files)."}], "titulo": "Archivos anexados"},
                   {"t": "consulta", "pasos": [{"patron": "Source\\.Name|Sucursal|sucursal", "msg": "Agrega una columna que diga de qué sucursal viene cada fila (Source.Name o Sucursal)."}], "titulo": "Columna de origen"}, {"t": "consulta", "cargada": True, "titulo": "Resultado cargado"}])
T23_3 = A("T3", "Combinar con el catálogo y agrupar", "T3", apoyo="autonoma", minutos=15, construir=m23_base("Ventas de octubre por categoría", "Las ventas no traen la categoría: está en catalogo.csv."),
          contexto="Contabilidad quiere el importe y las unidades de octubre por categoría, y que se actualice con un clic cuando lleguen los CSV de noviembre.",
          instrucciones=["Importa catalogo.csv y combínalo con la consulta de T2 por producto para traer la categoría y el costo.", "Agrega la columna Importe (cantidad × precio) y agrupa por categoría: suma de Importe y de cantidad.", "Carga el resultado en T3!A5."],
          pistas=["Inicio › Combinar consultas (no Anexar): aquí se agregan columnas, no filas.", "Columna personalizada: <code>= [cantidad] * [precio]</code>."],
          pruebas=[{"t": "consulta", "pasos": [{"patron": "Table\\.NestedJoin|Table\\.Join", "msg": "Combina (Merge) con el catálogo por producto: Inicio › Combinar consultas."}], "titulo": "Combinación con el catálogo"},
                   {"t": "consulta", "pasos": [{"patron": "Table\\.AddColumn", "msg": "Agrega la columna Importe (Agregar columna › Columna personalizada)."}], "titulo": "Columna Importe"},
                   {"t": "consulta", "pasos": [{"patron": "Table\\.Group", "msg": "Agrupa por categoría (Inicio › Agrupar por)."}], "titulo": "Agrupado por categoría"}, {"t": "consulta", "cargada": True, "titulo": "Resultado cargado"}])

# =============================================================== Módulo 24


def semana(ws, suc, fila=4, col=1):
    sem = D["semanaSucursal"][suc]
    cols = ["Producto", "Precio", "Unidades", "Importe", "Participación"]
    for j, t in enumerate(cols):
        ws.cell(row=fila, column=col + j, value=t)
    tot = sum(p["precio"] * sum(p["cantidades"]) for p in sem)
    for i, p in enumerate(sem, 1):
        u = sum(p["cantidades"])
        for j, v in enumerate([p["producto"], p["precio"], u, p["precio"] * u, p["precio"] * u / tot]):
            ws.cell(row=fila + i, column=col + j, value=v)
    return len(sem)


def con_formato(ws, n, fila=4):
    from actividades_comun import BORDE
    for fila_ in ws.iter_rows(min_row=fila, max_row=fila + n, min_col=1, max_col=5):
        for c in fila_:
            c.border = BORDE
    for c in "ABCDE":
        ws[f"{c}{fila}"].font, ws[f"{c}{fila}"].fill = NEGRITA, ENC
    formato(ws, f"B{fila + 1}:B{fila + n},D{fila + 1}:D{fila + n}", MONEDA)
    formato(ws, f"E{fila + 1}:E{fila + n}", "0.0%")


N24 = len(D["semanaSucursal"]["Centro"])
CODIGO_MACRO = ["Sub FormatoReporte()", '    Range("A4:E4").Font.Bold = True', '    Range("A4:E4").Interior.Color = RGB(243, 235, 223)', f'    Range("B5:B{4 + N24},D5:D{4 + N24}").NumberFormat = "$#,##0.00"',
                f'    Range("E5:E{4 + N24}").NumberFormat = "0.0%"', f'    Range("A4:E{4 + N24}").Borders.LineStyle = xlContinuous', "    Columns(\"A:E\").AutoFit", "End Sub"]


def m24_t(suc, texto):
    def f(wb, ws, sol):
        encabezado(ws, f"Reporte semanal · {suc}", texto)
        n = semana(ws, suc)
        if sol:
            con_formato(ws, n)
            if ws.title == "T1":
                hoja_solucion(wb, ["Macro grabada (Programador › Grabar macro, nombre FormatoReporte, guardar en: Este libro):"] + CODIGO_MACRO +
                              ["", "T2 · Programador › Insertar › Botón (control de formulario) en T2 › Asignar macro: FormatoReporte. Clic en el botón para darle formato a T2.",
                               "T3 · La misma macro se ejecuta con Alt+F8 (o con el botón) en T3.", "Guarda como Libro de Excel habilitado para macros (.xlsm).", "openpyxl no guarda código VBA: este archivo muestra el resultado del formato en cada hoja."])
    return f


T24_1 = A("T1", "Grabar una macro", "T1", apoyo="modelo", minutos=12, construir=m24_t("Centro", "Cada lunes se da el mismo formato a tres reportes. Graba ese formato una vez."),
          contexto="Necesitas Excel de escritorio (Windows o Mac) con la pestaña Programador activa (Archivo › Opciones › Personalizar cinta).",
          modelo="Programador › <b>Grabar macro</b> › nombre <code>FormatoReporte</code> › Guardar en: Este libro. Todo lo que hagas se graba; al terminar, <b>Detener grabación</b>. El código que se genera se ve así:<br><code>" + "<br>".join(CODIGO_MACRO[:3]) + "<br>…</code>",
          instrucciones=["En T1 graba la macro FormatoReporte: encabezados A4:E4 en negrita y con relleno, Precio e Importe en moneda, Participación en porcentaje, bordes y ancho automático.", "Guarda el libro como <b>Libro de Excel habilitado para macros (.xlsm)</b>."],
          pruebas=[{"t": "macro", "titulo": "Libro .xlsm con una macro"}, {"t": "estilo", "r": "A4:E4", "prop": ["negrita", "relleno"], "titulo": "T1: encabezados con formato"},
                   {"t": "fmt", "r": f"D5:D{4 + N24}", "tipo": "moneda", "titulo": "T1: importes en moneda"}, {"t": "fmt", "r": f"E5:E{4 + N24}", "tipo": "porcentaje", "titulo": "T1: participación en porcentaje"}])
T24_2 = A("T2", "Asignar la macro a un botón", "T2", apoyo="completar", minutos=6, construir=m24_t("Norte", "Este reporte aún no tiene formato: el botón debe dárselo."),
          contexto="La macro FormatoReporte ya existe (T1). Ahora hay que ponerla al alcance de un clic.",
          instrucciones=["En T2 inserta un botón (Programador › Insertar › Botón de formulario, o una forma con clic derecho › Asignar macro) y asígnale FormatoReporte.", "Haz clic en el botón para dar formato a T2."],
          pruebas=[{"t": "macro", "boton": True, "titulo": "Botón o forma con la macro asignada"}, {"t": "estilo", "r": "A4:E4", "prop": ["negrita", "relleno"], "titulo": "T2: encabezados con formato"},
                   {"t": "fmt", "r": f"D5:D{4 + N24}", "tipo": "moneda", "titulo": "T2: importes en moneda"}])
T24_3 = A("T3", "Reutilizar la macro", "T3", apoyo="autonoma", minutos=6, construir=m24_t("Sur", "Tercer reporte de la semana."),
          contexto="Comprueba que la automatización sirve para cualquier reporte con la misma estructura.",
          instrucciones=["Ejecuta FormatoReporte en T3 (Alt+F8 o el botón).", "Abre el editor de Visual Basic (Alt+F11) y cambia en el código el color del relleno; vuelve a ejecutarla en T3.", "Guarda el .xlsm y súbelo."],
          pistas=["El color está en la línea Interior.Color = RGB(…)."],
          pruebas=[{"t": "estilo", "r": "A4:E4", "prop": ["negrita", "relleno"], "titulo": "T3: encabezados con formato"}, {"t": "fmt", "r": f"B5:B{4 + N24},D5:D{4 + N24}", "tipo": "moneda", "titulo": "T3: precios e importes en moneda"},
                   {"t": "estilo", "r": f"A4:E{4 + N24}", "prop": "bordes", "titulo": "T3: bordes"}])

# =============================================================== Módulo 25
CORP = D["clientesCorp"]
PUNTOS25 = [480, 150, 320, 90, 260, 510, 205, 75, 390, 130]


def m25_t1(wb, ws, sol):
    cols = ["Cliente", "Contacto", "Correo", "Puntos", "Nivel", "Vigencia"]
    filas = [[c["cliente"], c["contacto"], c["correo"], PUNTOS25[i], None, "2026-03-31" if i % 2 else "2026-06-30"] for i, c in enumerate(CORP)]
    tabla(ws, 1, cols, filas, formatos={3: "#,##0"}, anchos={"A": 24, "B": 22, "C": 28, "D": 9, "E": 9, "F": 12})
    if sol:
        from actividades_intermedio import agregar_tabla
        for r in range(2, 2 + len(CORP)):
            ws.cell(row=r, column=5, value=f'=IF(D{r}>=200,"Oro","Plata")')
        agregar_tabla(ws, "Destinatarios", f"A1:F{1 + len(CORP)}", cols, calculadas={"Nivel": 'IF(Destinatarios[[#This Row],[Puntos]]>=200,"Oro","Plata")'})
    else:
        ws["E2"] = '=IF(D2>=200,"Oro","Plata")'
        pintar(ws, "E2", MODELO)
        nota(ws, "E2", 'Modelo: =SI(D2>=200;"Oro";"Plata").')


T25_1 = A("T1", "Preparar la lista de destinatarios", "Lista", apoyo="modelo", minutos=8, construir=m25_t1,
          contexto="Word leerá esta hoja como lista de destinatarios: encabezados en la fila 1, una fila por cliente y sin filas vacías.",
          modelo='E2 = <code>=SI(D2>=200;"Oro";"Plata")</code>. Los encabezados de la fila 1 serán los nombres de los campos en Word.',
          instrucciones=["Copia E2 hasta E11.", "Convierte A1:F11 en una tabla llamada <b>Destinatarios</b>."],
          sol={"E2:E11": '=IF(D2>=200,"Oro","Plata")'},
          pruebas=[{"t": "valores", "r": "E2:E11", "titulo": "Nivel de cada cliente"}, {"t": "tabla", "h": "Lista", "nombre": "Destinatarios", "columnas": ["Nivel", "Puntos"], "titulo": "Tabla «Destinatarios»"}])

CARTA_CAMPOS = ["Contacto", "Cliente", "Puntos", "Nivel", "Vigencia"]


def carta25(sol, filtrada=False):
    c = (lambda campo, mod=None: "{" + campo + ("|" + mod if mod else "") + "}") if sol else (lambda campo, mod=None: "[" + campo + "]")
    contacto = "{Contacto}"  # el campo modelo ya viene insertado
    return [GL._p("Cafetería La Taza · Programa empresarial", negrita=True, tam=18, color="5B3A29"), GL._p(""),
            GL._p("Estimado(a) " + contacto + ":"),
            GL._p("Gracias por elegir La Taza para " + c("Cliente") + ". Su empresa acumula " + c("Puntos", '\\# "#,##0"') + " puntos y pertenece al nivel " + c("Nivel") + "."),
            GL._p("Sus beneficios están vigentes hasta el " + c("Vigencia", '\\@ "dd/MM/yyyy"') + "."), GL._p(""), GL._p("Marta Ríos", negrita=True), GL._p("Gerente general")]


def recursos_carta(pub, priv):
    GL.docx(pub / "t25-carta.docx", carta25(False), "Carta del programa empresarial")
    ruta = priv / "t25-correspondencia-solucion.docx"
    GL.docx(ruta, carta25(True), "Carta del programa empresarial (solución)")
    with zipfile.ZipFile(ruta) as z:
        partes = {n: z.read(n) for n in z.namelist()}
    consulta = "SELECT * FROM `Lista$` WHERE `Nivel` = 'Oro'"
    mm = ('<w:mailMerge><w:mainDocumentType w:val="formLetters"/><w:linkToQuery/><w:dataType w:val="native"/>'
          '<w:connectString w:val="Provider=Microsoft.ACE.OLEDB.12.0;Data Source=t25-correspondencia.xlsx;"/>'
          f'<w:query w:val="{consulta.replace(chr(39), "&apos;")}"/></w:mailMerge>')
    partes["word/settings.xml"] = partes["word/settings.xml"].decode().replace("<w:defaultTabStop", mm + "<w:defaultTabStop").encode()
    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for n, b in partes.items():
            z.writestr(n, b)


T25_2 = A("T2", "Insertar campos combinados", "Lista", apoyo="completar", minutos=10,
          contexto="En t25-carta.docx el campo «Contacto» ya está insertado (modelo). Los demás datos están entre corchetes.",
          instrucciones=["En Word: Correspondencia › Iniciar combinación › Cartas › Seleccionar destinatarios › Usar una lista existente › este libro (hoja Lista).", "Reemplaza [Cliente], [Puntos], [Nivel] y [Vigencia] por campos combinados (Insertar campo combinado).", "Guarda la carta y súbela junto con el libro."],
          pruebas=[{"t": "docx", "campos": ["Contacto"], "titulo": "La carta (.docx) está incluida"}, {"t": "docx", "campos": CARTA_CAMPOS, "titulo": "Los cinco campos combinados"}, {"t": "docx", "origen": True, "titulo": "Carta conectada con la lista de Excel"}])
T25_3 = A("T3", "Filtrar destinatarios y dar formato a los campos", "Lista", apoyo="autonoma", minutos=10,
          contexto="La promoción de este mes es solo para clientes Oro, y los puntos y la fecha deben verse con formato.",
          instrucciones=["Filtra la lista de destinatarios para que solo reciban la carta los clientes de nivel Oro (Editar lista de destinatarios › Filtrar).", 'Da formato a los campos con Alt+F9: Puntos con <code>\\# "#,##0"</code> y Vigencia con <code>\\@ "dd/MM/yyyy"</code>.', "Vista previa de resultados: revisa que la primera carta se lea bien. Sube el libro y la carta."],
          pistas=["Alt+F9 alterna entre ver los códigos de campo y sus resultados."],
          pruebas=[{"t": "js", "fn": "(L) => !L.docx ? 'Sube también la carta (.docx).' : /where/i.test(L.docx.origenDatos || '') && /oro/i.test(L.docx.origenDatos || '') ? true : 'Filtra los destinatarios para dejar solo el nivel Oro (Editar lista de destinatarios › Filtrar).'", "titulo": "Solo clientes Oro"},
                   {"t": "js", "fn": "(L) => { if (!L.docx) return 'Sube también la carta (.docx).'; const i = L.docx.instrucciones; const p = i.find((x) => /^puntos$/i.test(x.campo)); const v = i.find((x) => /^vigencia$/i.test(x.campo)); if (!p || !/\\\\#/.test(p.resto)) return 'Agrega al campo Puntos el modificador \\\\# \"#,##0\".'; if (!v || !/\\\\@/.test(v.resto)) return 'Agrega al campo Vigencia el modificador \\\\@ \"dd/MM/yyyy\".'; return true; }", "titulo": "Formato de número y de fecha en los campos"}])

def pct_total(ruta):
    from actividades_comun import porcentaje_dinamica
    porcentaje_dinamica(ruta, "PorVendedor")


def m18_despues(ruta):
    from actividades_comun import sin_cuadricula
    sin_cuadricula(ruta, "T3")


MODULOS = [
    {"id": 17, "slug": "tablas-dinamicas", "titulo": "Tablas dinámicas", "tareas": [T17_1, T17_2, T17_3],
     "dinamicas_sol": [{"origen": "Datos", "destino": "T1", "celda": "A5", "filas": ["Sucursal"], "datos": [["Total", "sum"]]},
                       {"origen": "Datos", "destino": "T2", "celda": "A5", "filas": ["Categoría"], "columnas": ["Fecha"], "datos": [["Total", "sum"]], "agrupar": {"campo": "Fecha", "por": "QUARTERS"}},
                       {"origen": "Datos", "destino": "T3", "celda": "A6", "filas": ["Vendedor"], "filtros": ["Sucursal"], "datos": [["Total", "sum"]], "porcentaje": True, "filtrar": {"Sucursal": "Sur"}, "nombre": "PorVendedor"}], "despues_sol": pct_total},
    {"id": 18, "slug": "graficos-dinamicos", "titulo": "Gráficos dinámicos y tableros", "tareas": [T18_1, T18_2, T18_3],
     "dinamicas_sol": [{"origen": "Datos", "destino": "T1", "celda": "A5", "filas": ["Sucursal"], "datos": [["Total", "sum"]]},
                       {"origen": "Datos", "destino": "T2", "celda": "A6", "filas": ["Sucursal"], "datos": [["Total", "sum"]]}], "despues_sol": m18_despues},
    {"id": 19, "slug": "busqueda", "titulo": "Búsqueda y matrices dinámicas", "tareas": [T19_1, T19_2, T19_3]},
    {"id": 20, "slug": "errores", "titulo": "Errores de fórmula y auditoría", "tareas": [T20_1, T20_2, T20_3]},
    {"id": 21, "slug": "formato-avanzado", "titulo": "Formato avanzado", "tareas": [T21_1, T21_2, T21_3]},
    {"id": 22, "slug": "hipotesis", "titulo": "Análisis de hipótesis", "tareas": [T22_1, T22_2, T22_3]},
    {"id": 23, "slug": "power-query", "titulo": "Obtener y transformar datos (Power Query)", "tareas": [T23_1, T23_2, T23_3], "recursos": [recursos_pq],
     "descargas": [{"archivo": ARCHIVO_PQ, "texto": "Descargar los CSV de octubre y el catálogo"}]},
    {"id": 24, "slug": "macros", "titulo": "Macros y automatización", "tareas": [T24_1, T24_2, T24_3], "acepta": ".xlsm,.xlsx",
     "nota": "Guarda el libro como .xlsm (Libro de Excel habilitado para macros) antes de subirlo. Excel para la web no graba macros."},
    {"id": 25, "slug": "correspondencia", "titulo": "Bases de datos y combinar correspondencia", "tareas": [T25_1, T25_2, T25_3], "recursos": [recursos_carta], "acepta": ".xlsx,.docx", "multiple": True,
     "descargas": [{"archivo": "t25-carta.docx", "texto": "Descargar la carta (t25-carta.docx)"}]},
]
