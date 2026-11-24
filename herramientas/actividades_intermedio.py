"""Tareas de aprendizaje del nivel Intermedio (módulos 9 a 16). Ver actividades_comun.py."""
from openpyxl.formatting.rule import CellIsRule
from openpyxl.formatting.rule import ColorScaleRule, DataBarRule, IconSetRule, Rule
from openpyxl.styles import Font, PatternFill, Protection
from openpyxl.styles.differential import DifferentialStyle
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableFormula, TableStyleInfo
import json

import lataza_datos as LD
from actividades_comun import (Actividad as A, encabezado, tabla, pintar, formato, nota, anchos, etiquetas, serial, iso_mas,
                               NEGRITA, ENC, ENTRADA, MODELO, MONEDA, MONEDA0, FECHA)

D = LD.generar()
PROD = D["productos"]
VENTAS = D["ventas"]
ROJO = DifferentialStyle(fill=PatternFill("solid", bgColor="F8D7DA"), font=Font(color="9C0006"))
AMBAR = DifferentialStyle(fill=PatternFill("solid", bgColor="FFF3CD"), font=Font(color="7A4D0E"))


def nombre_libro(wb, nombre, ref):
    dn = DefinedName(nombre, attr_text=ref)
    try:
        wb.defined_names[nombre] = dn
    except TypeError:
        wb.defined_names.append(dn)


def hoja_aux(wb, nombre, titulo, cols, filas, **kw):
    if nombre in wb.sheetnames:
        return wb[nombre]
    h = wb.create_sheet(nombre)
    h["A1"] = titulo
    h["A1"].font = Font(bold=True, size=13)
    tabla(h, 3, cols, filas, **kw)
    return h


# =============================================================== Módulo 9
BEBIDAS = [p for p in PROD if p["categoria"] in ("Café caliente", "Café frío", "Té")]


def m9_t1(wb, ws, sol):
    encabezado(ws, "Precios de temporada navideña", "Descuento en G2 y tasa de IVA en G3: los cambia la gerencia.")
    n = len(BEBIDAS)
    tabla(ws, 4, ["Bebida", "Precio de lista", "Categoría", "Con descuento", "Precio final con IVA"], [[p["nombre"], p["precio"], p["categoria"], None, None] for p in BEBIDAS], formatos={1: MONEDA, 3: MONEDA, 4: MONEDA}, anchos={"A": 18, "B": 14, "C": 15, "D": 14, "E": 18, "F": 12})
    etiquetas(ws, [("F2", "Descuento"), ("F3", "IVA")])
    ws["G2"], ws["G3"] = 0.1, 0.16
    ws["G2"].number_format = ws["G3"].number_format = "0%"
    ws["D5"] = "=B5*(1-$G$2)"
    pintar(ws, "D5", MODELO)
    nota(ws, "D5", "Modelo: =B5*(1-$G$2). El $ fija G2: al copiar hacia abajo, B5 cambia a B6, B7… pero $G$2 se queda.")
    pintar(ws, f"D6:E{4 + n}", ENTRADA)


NB = len(BEBIDAS)
T9_1 = A("T1", "Referencias absolutas al copiar", "T1", apoyo="modelo", minutos=8, construir=m9_t1,
         contexto="Todas las bebidas usan el mismo descuento (G2) y el mismo IVA (G3).",
         modelo="D5 = <code>=B5*(1-$G$2)</code>. Sin el $, al copiar a D6 la fórmula buscaría el descuento en G3, G4… y daría resultados falsos.",
         instrucciones=[f"Copia D5 hasta D{4 + NB}.", f"En E5:E{4 + NB} calcula el precio final: el precio con descuento más el IVA de G3 (fija G3 con $)."],
         sol={f"D5:D{4 + NB}": "=B5*(1-$G$2)", f"E5:E{4 + NB}": "=D5*(1+$G$3)"},
         pruebas=[{"t": "formula", "r": f"D5:E{4 + NB}", "titulo": "Precios con fórmulas"}, {"t": "contiene", "r": f"E5:E{4 + NB}", "texto": "$G$3", "titulo": "El IVA está fijo con $G$3", "msg": "{celda} debe usar $G$3 (referencia absoluta) para el IVA."},
                  {"t": "valores", "r": f"D5:E{4 + NB}", "titulo": "Precios correctos"}, {"t": "robustez", "r": f"D5:E{4 + NB}", "cambios": [{"G2": 0.25}, {"G3": 0.08}], "titulo": "Se recalcula si cambian el descuento o el IVA"}])

BARISTAS = [e for e in D["empleados"] if e["puesto"] == "Barista"][:10] or D["empleados"][:10]


def m9_t2(wb, ws, sol):
    encabezado(ws, "Meta semanal de bebidas preparadas", "La meta (G2) y el bono (G3) son iguales para todos.")
    filas = [[e["nombre"], e["sucursal"], 180 + (k * 37) % 140, None, None] for k, e in enumerate(BARISTAS)]
    tabla(ws, 4, ["Barista", "Sucursal", "Bebidas", "¿Cumplió?", "Bono"], filas, formatos={4: MONEDA}, anchos={"A": 20, "B": 11, "C": 10, "D": 13, "E": 11, "F": 8})
    etiquetas(ws, [("F2", "Meta"), ("F3", "Bono")])
    ws["G2"], ws["G3"] = 250, 400
    ws["G3"].number_format = MONEDA
    nombre_libro(wb, "Meta", "T2!$G$2")
    ws["D5"] = '=IF(C5>=Meta,"Cumplió","Pendiente")'
    pintar(ws, "D5", MODELO)
    nota(ws, "D5", 'Ya existe el nombre Meta (= T2!$G$2). D5: =SI(C5>=Meta;"Cumplió";"Pendiente").')
    pintar(ws, "D6:E14", ENTRADA)


T9_2 = A("T2", "Nombres definidos y SI", "T2", apoyo="completar", minutos=10, construir=m9_t2,
         contexto="El nombre <b>Meta</b> ya existe y D5 ya decide si el barista cumplió.",
         instrucciones=["Copia D5 hasta D14.", "Asigna el nombre <b>Bono</b> a la celda G3 (cuadro de nombres o Fórmulas › Asignar nombre).", "En E5:E14: si el barista llegó a la meta, recibe el Bono; si no, 0. Usa SI con los nombres Meta y Bono."],
         sol={"D5:D14": '=IF(C5>=Meta,"Cumplió","Pendiente")', "E5:E14": "=IF(C5>=Meta,Bono,0)"}, sol_nombres={"Meta": "=T2!$G$2", "Bono": "=T2!$G$3"},
         sol_extra=lambda wb, ws: nombre_libro(wb, "Bono", "T2!$G$3"),
         pruebas=[{"t": "nombre", "n": "Bono", "ref": "T2!$G$3", "titulo": "Nombre «Bono» para G3"}, {"t": "usa", "r": "E5:E14", "f": ["IF"], "titulo": "El bono se decide con SI"},
                  {"t": "contiene", "r": "E5:E14", "texto": "BONO", "titulo": "La fórmula usa el nombre Bono", "msg": "{celda} debe usar el nombre Bono en lugar de G3."},
                  {"t": "valores", "r": "D5:E14", "titulo": "Resultados correctos"}, {"t": "robustez", "r": "D5:E14", "cambios": [{"G2": 300}, {"G3": 650}], "titulo": "Se actualiza si cambian la meta o el bono"}])

PED = D["pedidos"][:14]


def m9_t3(wb, ws, sol):
    encabezado(ws, "Clasificación de pedidos corporativos", "Las reglas comerciales están en J2:J4.")
    tabla(ws, 6, ["Folio", "Cliente", "Sucursal", "Importe", "Tipo", "Envío", "Total"], [[p["folio"], p["cliente"], p["sucursal"], p["cantidad"] * p["precio"], None, None, None] for p in PED],
          formatos={3: MONEDA, 5: MONEDA, 6: MONEDA}, anchos={"A": 8, "B": 24, "C": 10, "D": 12, "E": 12, "F": 10, "G": 12, "I": 30})
    etiquetas(ws, [("I2", "Importe mínimo para «Mayorista»"), ("I3", "Envío gratis desde (excepto Sur)"), ("I4", "Costo de envío")])
    ws["J2"], ws["J3"], ws["J4"] = 2000, 1500, 120
    for c in ("J2", "J3", "J4"):
        ws[c].number_format = MONEDA
    pintar(ws, "E7:G20", ENTRADA)


T9_3 = A("T3", "Decisiones con varias condiciones", "T3", apoyo="autonoma", minutos=14, construir=m9_t3,
         contexto="Ventas corporativas quiere clasificar cada pedido y calcular su envío con las reglas de J2:J4.",
         instrucciones=["E7:E20: «Mayorista» si el importe es al menos J2; si no, «Menudeo».", "F7:F20: el envío es 0 si el importe es al menos J3 <b>y</b> la sucursal no es Sur; en otro caso cuesta J4.", "G7:G20: importe más envío.", "Todo debe seguir funcionando si cambian las reglas de J2:J4."],
         pistas=["Para dos condiciones a la vez: <code>=SI(Y(D7>=$J$3;C7<>\"Sur\");0;$J$4)</code>."],
         sol={"E7:E20": '=IF(D7>=$J$2,"Mayorista","Menudeo")', "F7:F20": '=IF(AND(D7>=$J$3,C7<>"Sur"),0,$J$4)', "G7:G20": "=D7+F7"},
         pruebas=[{"t": "usa", "r": "E7:F20", "f": ["IF"], "titulo": "Decisiones con SI"}, {"t": "usa", "r": "F7:F20", "f": ["AND", "OR", "IFS"], "titulo": "El envío revisa dos condiciones (Y)"},
                  {"t": "valores", "r": "E7:G20", "titulo": "Tipo, envío y total correctos"}, {"t": "robustez", "r": "E7:G20", "cambios": [{"J2": 900, "J3": 4000}, {"J4": 200, "C8": "Sur"}], "titulo": "Resiste cambios en las reglas y en los datos"}])

# =============================================================== Módulo 10
MARZO = [v for v in VENTAS if v["fecha"][5:7] == "03"]
NM = len(MARZO)
UF = 4 + NM  # última fila de datos
PAGOS = sorted({v["pago"] for v in VENTAS})
SUCS = ["Centro", "Norte", "Sur"]
CATS = D["categorias"]


def datos_marzo(ws):
    tabla(ws, 4, ["Folio", "Fecha", "Sucursal", "Producto", "Categoría", "Cantidad", "Pago", "Total"], [[v["folio"], v["fecha"], v["sucursal"], v["producto"], v["categoria"], v["cantidad"], v["pago"], v["total"]] for v in MARZO],
          formatos={7: MONEDA0}, anchos={"A": 8, "B": 11, "C": 9, "D": 18, "E": 13, "F": 9, "G": 13, "H": 10, "J": 16})
    ws.freeze_panes = "A5"


def m10_t1(wb, ws, sol):
    encabezado(ws, "Corte de marzo por forma de pago", f"{NM} ventas de marzo de las tres sucursales.")
    datos_marzo(ws)
    tabla(ws, 4, ["Forma de pago", "Ventas (núm.)", "Importe"], [[p, None, None] for p in PAGOS], col=10, formatos={2: MONEDA0}, anchos={"K": 13, "L": 13})
    ws["K5"] = f"=COUNTIF($G$5:$G${UF},J5)"
    ws["L5"] = f"=SUMIF($G$5:$G${UF},J5,$H$5:$H${UF})"
    pintar(ws, "K5:L5", MODELO)
    nota(ws, "K5", f"Modelo: =CONTAR.SI($G$5:$G${UF};J5) cuenta las ventas de esa forma de pago.")
    nota(ws, "L5", f"Modelo: =SUMAR.SI($G$5:$G${UF};J5;$H$5:$H${UF}) suma su importe.")
    ws.cell(row=5 + len(PAGOS), column=10, value="Total").font = NEGRITA
    pintar(ws, f"K6:L{5 + len(PAGOS)}", ENTRADA)


FP = 4 + len(PAGOS)
T10_1 = A("T1", "Contar y sumar con una condición", "T1", apoyo="modelo", minutos=8, construir=m10_t1,
          contexto="Contabilidad necesita cuántas ventas y cuánto dinero entró por cada forma de pago.",
          modelo=f"K5 y L5 ya resuelven «{PAGOS[0]}». Los rangos van fijos con $ y el criterio (J5) es relativo, para copiar hacia abajo.",
          instrucciones=[f"Copia K5:L5 hasta la fila {FP}.", f"En la fila {FP + 1} calcula los totales de K y L con SUMA."],
          sol={f"K5:K{FP}": f"=COUNTIF($G$5:$G${UF},J5)", f"L5:L{FP}": f"=SUMIF($G$5:$G${UF},J5,$H$5:$H${UF})", f"K{FP + 1}": f"=SUM(K5:K{FP})", f"L{FP + 1}": f"=SUM(L5:L{FP})"},
          pruebas=[{"t": "usa", "r": f"K5:K{FP}", "f": ["COUNTIF", "COUNTIFS"], "titulo": "Conteo con CONTAR.SI"}, {"t": "usa", "r": f"L5:L{FP}", "f": ["SUMIF", "SUMIFS"], "titulo": "Importe con SUMAR.SI"},
                   {"t": "valores", "r": f"K5:L{FP + 1}", "titulo": "Conteos, importes y totales correctos"}, {"t": "robustez", "r": f"K5:L{FP + 1}", "cambios": {"G5": "Efectivo", "H6": 5000}, "titulo": "Se actualiza si cambian las ventas"}])


def m10_t2(wb, ws, sol):
    encabezado(ws, "Matriz de marzo: sucursal × categoría", "SUMAR.SI.CONJUNTO con dos criterios y referencias mixtas.")
    datos_marzo(ws)
    ws.cell(row=4, column=10, value="Sucursal \\ Categoría").font = NEGRITA
    for j, c in enumerate(CATS):
        x = ws.cell(row=4, column=11 + j, value=c)
        x.font, x.fill = NEGRITA, ENC
        ws.column_dimensions[x.column_letter].width = 13
    for i, s in enumerate(SUCS):
        ws.cell(row=5 + i, column=10, value=s).font = NEGRITA
    formato(ws, "K5:P8", MONEDA0)
    ws["K5"] = f"=SUMIFS($H$5:$H${UF},$C$5:$C${UF},$J5,$E$5:$E${UF},K$4)"
    pintar(ws, "K5", MODELO)
    nota(ws, "K5", "$J5 fija la columna (la sucursal siempre está en J); K$4 fija la fila (la categoría siempre está en la fila 4). Así una sola fórmula se copia a toda la matriz.")
    ws["J8"] = "Total"
    ws["J8"].font = NEGRITA
    pintar(ws, "L5:P5,K6:P8", ENTRADA)


T10_2 = A("T2", "Una matriz con SUMAR.SI.CONJUNTO", "T2", apoyo="completar", minutos=10, construir=m10_t2,
          contexto="K5 ya suma lo que vendió Centro en Café caliente. Completa la matriz copiando esa misma fórmula.",
          instrucciones=["Copia K5 a toda la matriz K5:P7 (a la derecha y hacia abajo).", "En K8:P8 calcula el total de cada categoría."],
          pistas=["Si al copiar aparecen ceros o números repetidos, revisa los $ de $J5 y K$4."],
          sol={"K5:P7": f"=SUMIFS($H$5:$H${UF},$C$5:$C${UF},$J5,$E$5:$E${UF},K$4)", "K8:P8": "=SUM(K5:K7)"},
          pruebas=[{"t": "usa", "r": "K5:P7", "f": ["SUMIFS"], "titulo": "Matriz con SUMAR.SI.CONJUNTO"}, {"t": "valores", "r": "K5:P8", "titulo": "Matriz y totales correctos", "msg": "{celda} muestra {obtenido}; debería ser {esperado}. ¿Copiaste con $J5 y K$4?"},
                   {"t": "robustez", "r": "K5:P8", "cambios": {"C5": "Sur", "E7": "Postres", "H9": 3000}, "titulo": "Se actualiza si cambian las ventas"}])


def m10_t3(wb, ws, sol):
    encabezado(ws, "Indicadores de marzo para la junta", "Responde cada pregunta con una fórmula en K5:K9.")
    datos_marzo(ws)
    preguntas = ["Ticket promedio de las ventas con Tarjeta", "Venta más alta de la sucursal Norte", "Número de ventas mayores a $1,000", "Unidades de Café caliente vendidas en Sur", "Importe de Postres pagados en Efectivo"]
    for i, p in enumerate(preguntas):
        ws.cell(row=5 + i, column=10, value=p)
    ws.column_dimensions["J"].width = 42
    formato(ws, "K5:K6,K9", MONEDA)
    pintar(ws, "K5:K9", ENTRADA)


T10_3 = A("T3", "Preguntas de negocio con condiciones", "T3", apoyo="autonoma", minutos=12, construir=m10_t3,
          contexto="La gerencia trae cinco preguntas sobre las ventas de marzo. Cada respuesta es una fórmula que se actualiza sola.",
          instrucciones=["Responde en K5:K9 las preguntas de J5:J9.", "Elige la función adecuada en cada caso: PROMEDIO.SI, MAX.SI.CONJUNTO, CONTAR.SI, SUMAR.SI.CONJUNTO."],
          pistas=['El criterio «mayor que» va entre comillas: <code>">1000"</code>.'],
          sol={"K5": f'=AVERAGEIF($G$5:$G${UF},"Tarjeta",$H$5:$H${UF})', "K6": f'=MAXIFS($H$5:$H${UF},$C$5:$C${UF},"Norte")', "K7": f'=COUNTIF($H$5:$H${UF},">1000")',
               "K8": f'=SUMIFS($F$5:$F${UF},$E$5:$E${UF},"Café caliente",$C$5:$C${UF},"Sur")', "K9": f'=SUMIFS($H$5:$H${UF},$E$5:$E${UF},"Postres",$G$5:$G${UF},"Efectivo")'},
          pruebas=[{"t": "usa", "r": "K5", "f": ["AVERAGEIF", "AVERAGEIFS"], "titulo": "K5 con PROMEDIO.SI"}, {"t": "usa", "r": "K6", "f": ["MAXIFS"], "titulo": "K6 con MAX.SI.CONJUNTO"},
                   {"t": "usa", "r": "K7", "f": ["COUNTIF", "COUNTIFS"], "titulo": "K7 con CONTAR.SI"}, {"t": "usa", "r": "K8:K9", "f": ["SUMIFS"], "titulo": "K8 y K9 con SUMAR.SI.CONJUNTO"},
                   {"t": "valores", "r": "K5:K9", "titulo": "Respuestas correctas"}, {"t": "robustez", "r": "K5:K9", "cambios": {"G6": "Tarjeta", "H7": 4321, "C8": "Norte"}, "titulo": "Las respuestas se actualizan solas"}])

# =============================================================== Módulo 11
CLI = D["clientes"][:12]


def m11_t1(wb, ws, sol):
    encabezado(ws, "Usuarios para la app de lealtad", "La app necesita el nombre completo y un usuario en minúsculas.")
    filas = [[c["nombre"].split(" ")[0], " ".join(c["nombre"].split(" ")[1:]), c["sucursal"], None, None, None] for c in CLI]
    tabla(ws, 4, ["Nombre", "Apellido", "Sucursal", "Nombre completo", "Usuario", "Código"], filas, anchos={"A": 12, "B": 14, "C": 10, "D": 22, "E": 16, "F": 12})
    ws["D5"] = '=A5&" "&B5'
    pintar(ws, "D5", MODELO)
    nota(ws, "D5", 'Modelo: =A5&" "&B5 une nombre, un espacio y apellido. También: =CONCAT(A5;" ";B5).')
    pintar(ws, "D6:D16,E5:F16", ENTRADA)


T11_1 = A("T1", "Unir y transformar texto", "T1", apoyo="modelo", minutos=8, construir=m11_t1,
          contexto="D5 ya une nombre y apellido. Completa la lista y arma el usuario y el código de cada cliente.",
          modelo='D5 = <code>=A5&amp;" "&amp;B5</code>: el operador &amp; une textos; el espacio va entre comillas.',
          instrucciones=["Copia D5 hasta D16.", "E5:E16: usuario = primera letra del nombre + apellido, todo en minúsculas (MINUSC, IZQUIERDA).", "F5:F16: código = las tres primeras letras de la sucursal en mayúsculas, un guion y el apellido en mayúsculas (por ejemplo, SUR-ESTRADA)."],
          sol={"D5:D16": '=A5&" "&B5', "E5:E16": "=LOWER(LEFT(A5,1)&B5)", "F5:F16": '=UPPER(LEFT(C5,3))&"-"&UPPER(B5)'},
          pruebas=[{"t": "formula", "r": "D5:F16", "titulo": "Textos con fórmulas"}, {"t": "usa", "r": "E5:E16", "f": ["LOWER"], "titulo": "Usuario con MINUSC"}, {"t": "usa", "r": "F5:F16", "f": ["UPPER"], "titulo": "Código con MAYUSC"},
                   {"t": "valores", "r": "D5:F16", "titulo": "Textos correctos"}, {"t": "robustez", "r": "D5:F16", "cambios": {"A6": "Zoe", "B7": "Ramírez", "C8": "Norte"}, "titulo": "Se actualiza si cambia el nombre"}])

SUCIOS = [("  mónica   estrada ", " 55 4493 5885 ", "Monica.Estrada@Correo.MX "), ("RICARDO DOMÍNGUEZ", "55-3673-3634", " ricardo.dominguez@correo.mx"), ("daniela navarro  ", "5549 171 880", "DANIELA.NAVARRO@correo.mx"),
          (" gustavo  lópez", "55 3174 5654", "gustavo.lopez@CORREO.mx  "), ("Fernanda   ruiz", "55-1290-4471", " Fernanda.Ruiz@correo.mx"), ("ALEJANDRO TORRES ", "5520 33 1188", "alejandro.torres@correo.mx"),
          ("  paola méndez", "55 6612 0975", " PAOLA.MENDEZ@CORREO.MX"), ("andrés  vega", "55-4581-2290", "Andres.Vega@correo.mx "), ("sofía   herrera ", "55 7790 3341", "sofia.herrera@correo.mx"), ("TOMÁS ORTEGA", "5588 120 456", " TOMAS.ORTEGA@CORREO.MX ")]


def m11_t2(wb, ws, sol):
    encabezado(ws, "Limpiar los datos del formulario web", "Los clientes escribieron como quisieron: espacios de más, mayúsculas y guiones.")
    tabla(ws, 4, ["Nombre (tal cual)", "Teléfono (tal cual)", "Correo (tal cual)", "Nombre limpio", "Teléfono limpio", "Correo limpio"], [list(s) + [None, None, None] for s in SUCIOS], anchos={"A": 22, "B": 17, "C": 32, "D": 22, "E": 15, "F": 30})
    ws["D5"] = "=PROPER(TRIM(A5))"
    ws["E5"] = '=SUBSTITUTE(SUBSTITUTE(B5," ",""),"-","")'
    pintar(ws, "D5:E5", MODELO)
    nota(ws, "D5", "Modelo: =NOMPROPIO(ESPACIOS(A5)). ESPACIOS quita los espacios de más; NOMPROPIO pone mayúscula inicial.")
    nota(ws, "E5", 'Modelo: =SUSTITUIR(SUSTITUIR(B5;" ";"");"-";"") quita espacios y guiones.')
    pintar(ws, "D6:E14,F5:F14", ENTRADA)


T11_2 = A("T2", "Limpiar texto con funciones", "T2", apoyo="completar", minutos=8, construir=m11_t2,
          contexto="D5 y E5 ya limpian el nombre y el teléfono del primer registro.",
          instrucciones=["Copia D5:E5 hasta la fila 14.", "F5:F14: correo limpio, sin espacios y en minúsculas."],
          sol={"D5:D14": "=PROPER(TRIM(A5))", "E5:E14": '=SUBSTITUTE(SUBSTITUTE(B5," ",""),"-","")', "F5:F14": "=LOWER(TRIM(C5))"},
          pruebas=[{"t": "usa", "r": "F5:F14", "f": ["LOWER"], "titulo": "Correo en minúsculas (MINUSC)"}, {"t": "usa", "r": "F5:F14", "f": ["TRIM", "SUBSTITUTE"], "titulo": "Correo sin espacios (ESPACIOS o SUSTITUIR)"},
                   {"t": "valores", "r": "D5:F14", "titulo": "Datos limpios correctos"}])

PED11 = D["pedidos"][:12]
FESTIVOS = ["2025-11-17", "2025-12-12", "2025-12-25", "2026-01-01"]


def m11_t3(wb, ws, sol):
    encabezado(ws, "Plazos de entrega de pedidos especiales", "Los plazos se cuentan en días hábiles (sin fines de semana ni festivos).")
    filas = []
    for k, p in enumerate(PED11):
        f = iso_mas("2025-11-03", (k * 3) % 26)
        dias = 2 + k % 4
        entrega = iso_mas(f, dias + 1 + (k * 5) % 7)
        filas.append([p["folio"], p["cliente"], f, dias, None, entrega, None, None])
    tabla(ws, 4, ["Folio", "Cliente", "Fecha del pedido", "Días hábiles", "Compromiso", "Entrega real", "Días de atraso", "Antigüedad (días)"], filas, anchos={"A": 8, "B": 24, "C": 14, "D": 11, "E": 13, "F": 13, "G": 13, "H": 15, "J": 14})
    formato(ws, "E5:E16", FECHA)
    etiquetas(ws, [("J2", "Fecha de corte"), ("J4", "Festivos")])
    ws["K2"] = serial("2025-12-15")
    ws["K2"].number_format = FECHA
    for i, f in enumerate(FESTIVOS):
        ws.cell(row=5 + i, column=10, value=serial(f)).number_format = FECHA
    pintar(ws, "E5:E16,G5:H16", ENTRADA)


T11_3 = A("T3", "Fechas de compromiso y atrasos", "T3", apoyo="autonoma", minutos=12, construir=m11_t3,
          contexto="Cada pedido tiene un plazo en días hábiles. Los festivos están en J5:J8 y la fecha de corte en K2.",
          instrucciones=["E5:E16: fecha compromiso = fecha del pedido + días hábiles, sin contar fines de semana ni festivos.", "G5:G16: días de atraso (entrega real − compromiso); si se entregó a tiempo, 0.", "H5:H16: días que han pasado desde el pedido hasta la fecha de corte (K2)."],
          pistas=["DIA.LAB(inicio; días; festivos) devuelve la fecha hábil.", "MAX(0; …) evita los atrasos negativos."],
          sol={"E5:E16": "=WORKDAY(C5,D5,$J$5:$J$8)", "G5:G16": "=MAX(0,F5-E5)", "H5:H16": "=$K$2-C5"},
          pruebas=[{"t": "usa", "r": "E5:E16", "f": ["WORKDAY", "WORKDAY.INTL"], "titulo": "Compromiso con DIA.LAB"}, {"t": "contiene", "r": "E5:E16", "texto": "$J$5:$J$8", "titulo": "Se descuentan los festivos", "msg": "{celda}: pasa los festivos ($J$5:$J$8) como tercer argumento de DIA.LAB."},
                   {"t": "valores", "r": "E5:E16,G5:H16", "titulo": "Fechas y días correctos"}, {"t": "robustez", "r": "E5:E16,G5:H16", "cambios": {"K2": serial("2026-01-10"), "D6": 6, "J5": serial("2025-11-04")}, "titulo": "Se actualiza si cambian el corte, los plazos o los festivos"}])

# =============================================================== Módulo 12
EMP = D["empleados"]


def m12_t1(wb, ws, sol):
    encabezado(ws, "Ventas de octubre por empleado", "Ordena por sucursal y, dentro de cada sucursal, de mayor a menor venta.")
    filas = [[e["nombre"], e["sucursal"], e["puesto"], e["ingreso"], e["ventasMes"]] for e in EMP]
    if sol:
        filas = sorted(filas, key=lambda f: (f[1], -f[4]))
    tabla(ws, 4, ["Empleado", "Sucursal", "Puesto", "Ingreso", "Ventas del mes"], filas, formatos={4: MONEDA0}, anchos={"A": 20, "B": 11, "C": 12, "D": 12, "E": 15, "G": 12, "H": 12})
    tabla(ws, 4, ["Sucursal", "Ventas"], [["Centro", 15200], ["Centro", 9800], ["Norte", 14100], ["Norte", 8700]], col=7, formatos={1: MONEDA0})
    pintar(ws, "G5:H8", MODELO)
    nota(ws, "G4", "Modelo: así se ve un orden de dos niveles. Primero por Sucursal (A→Z) y, dentro de cada una, Ventas de mayor a menor.")


T12_1 = A("T1", "Ordenar por dos niveles", "T1", apoyo="modelo", minutos=6, construir=m12_t1,
          contexto="Para la junta, Recursos Humanos quiere ver a los empleados agrupados por sucursal y del que más vendió al que menos.",
          modelo="G4:H8 muestra el resultado esperado en miniatura: Datos › Ordenar › nivel 1 Sucursal (A a Z) › Agregar nivel › Ventas del mes (de mayor a menor).",
          instrucciones=["Selecciona A4:E24 y ordena: primero por Sucursal (A a Z), luego por Ventas del mes (de mayor a menor).", "No ordenes solo una columna: cada fila debe seguir siendo del mismo empleado."],
          pruebas=[{"t": "orden", "claves": [{"col": "B"}, {"col": "E", "desc": True}], "desde": 5, "hasta": 24, "titulo": "Orden: sucursal y ventas descendentes"},
                   {"t": "js", "fn": "(L) => { const esp = " + json.dumps({e["nombre"]: e["ventasMes"] for e in EMP}, ensure_ascii=False) + "; const h = L.hoja('T1'); for (let r = 5; r <= 24; r++) { const n = L.valor(h, 'A' + r); if (esp[n] !== L.valor(h, 'E' + r)) return 'La fila ' + r + ' mezcla datos de empleados distintos: ordena todo el rango A4:E24, no una sola columna.'; } return true; }", "titulo": "Cada empleado conserva sus datos"}])

ASIST = [c for c in D["clientes"][:22]]
DUP = [ASIST[3], ASIST[9], ASIST[14], ASIST[17], ASIST[20]]


def m12_t2(wb, ws, sol):
    encabezado(ws, "Inscritos a la cata de café de origen", "El formulario guardó dos veces a algunas personas.")
    lista = ASIST + DUP
    lista = [lista[i] for i in (list(range(0, 22, 2)) + list(range(1, 22, 2)) + list(range(22, 27)))]
    if sol:
        vistos, limpia = set(), []
        for c in lista:
            if c["id"] not in vistos:
                vistos.add(c["id"])
                limpia.append(c)
        lista = limpia + [None] * 5
    tabla(ws, 4, ["ID", "Nombre", "Correo", "Sucursal", "Puntos"], [[c["id"], c["nombre"], c["correo"], c["sucursal"], c["puntos"]] if c else [None] * 5 for c in lista], anchos={"A": 8, "B": 20, "C": 30, "D": 10, "E": 8})
    if sol:
        ws.auto_filter.ref = "A4:E26"
        from openpyxl.worksheet.filters import FilterColumn, Filters
        fc = FilterColumn(colId=3, filters=Filters(filter=["Norte"]))
        ws.auto_filter.filterColumn.append(fc)
        for r in range(5, 27):
            if ws.cell(row=r, column=4).value != "Norte":
                ws.row_dimensions[r].hidden = True


T12_2 = A("T2", "Quitar duplicados y filtrar", "T2", apoyo="completar", minutos=8, construir=m12_t2,
          contexto=f"Hay {len(ASIST) + len(DUP)} registros, pero solo {len(ASIST)} personas distintas. La columna ID identifica a cada persona.",
          instrucciones=["Quita los duplicados de A4:E31 tomando en cuenta solo la columna ID (Datos › Quitar duplicados).", "Activa el filtro y muestra solo a los inscritos de la sucursal Norte."],
          pruebas=[{"t": "registros", "col": "A", "desde": 5, "unicos": True, "n": len(ASIST), "titulo": f"Quedan {len(ASIST)} personas sin repetir"}, {"t": "filtro", "activo": True, "titulo": "Filtro aplicado por sucursal"}])

CLAVES = [(p["codigo"], p["nombre"], t) for p in PROD[:16] for t in (["Grande"] if PROD.index(p) % 2 else ["Chico"])]


def m12_t3(wb, ws, sol):
    encabezado(ws, "Separar la clave del sistema de caja", "La caja exporta todo en una sola columna: código|producto|tamaño.")
    tabla(ws, 4, ["Clave exportada", "Código", "Producto", "Tamaño"], [[f"{c}|{n}|{t}", None, None, None] for c, n, t in CLAVES], anchos={"A": 32, "B": 10, "C": 20, "D": 10})
    pintar(ws, f"B5:D{4 + len(CLAVES)}", ENTRADA)


NC = len(CLAVES)
T12_3 = A("T3", "Texto en columnas", "T3", apoyo="autonoma", minutos=8, construir=m12_t3,
          contexto="Necesitas el código, el producto y el tamaño en columnas separadas para poder filtrarlos.",
          instrucciones=[f"Separa A5:A{4 + NC} en B, C y D (Datos › Texto en columnas con el delimitador | o Relleno rápido). A debe conservarse.", "Activa el filtro en el encabezado y muestra solo el tamaño Grande."],
          pistas=["En Texto en columnas, cambia el Destino a $B$5 para no sobrescribir la columna A.", "Relleno rápido: escribe el primer código en B5 y pulsa Ctrl+E."],
          sol={f"B5:D{4 + NC}": [list(x) for x in CLAVES]},
          sol_extra=lambda wb, ws: setattr(ws.auto_filter, "ref", f"A4:D{4 + NC}"),
          pruebas=[{"t": "valores", "r": f"B5:D{4 + NC}", "titulo": "Código, producto y tamaño separados"}, {"t": "valores", "r": "A5", "v": f"{CLAVES[0][0]}|{CLAVES[0][1]}|{CLAVES[0][2]}", "titulo": "La clave original se conserva"},
                   {"t": "filtro", "titulo": "Filtro activo"}])

# =============================================================== Módulo 13
PED13 = D["pedidos"][:24]


def pedidos_tabla(ws, fila=4, con_importe=False):
    cols = ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Estado"] + (["Importe"] if con_importe else [])
    tabla(ws, fila, cols, [[p["folio"], p["fecha"], p["cliente"], p["sucursal"], p["producto"], p["cantidad"], p["precio"], p["estado"]] for p in PED13], formatos={6: MONEDA},
          anchos={"A": 8, "B": 11, "C": 24, "D": 10, "E": 16, "F": 9, "G": 9, "H": 11, "I": 12})


def agregar_tabla(ws, nombre, ref, cols, calculadas=None, totales=None, estilo="TableStyleMedium2"):
    t = Table(displayName=nombre, ref=ref)
    t.tableStyleInfo = TableStyleInfo(name=estilo, showRowStripes=True)
    t._initialise_columns()
    for c, n in zip(t.tableColumns, cols):
        c.name = n
        if calculadas and n in calculadas:
            c.calculatedColumnFormula = TableFormula(attr_text=calculadas[n])
        if totales and n in totales:
            c.totalsRowFunction = totales[n]
    if totales:
        t.tableColumns[0].totalsRowLabel = "Total"
    if totales:
        t.totalsRowCount = 1
    ws.add_table(t)
    return t


def m13_t1(wb, ws, sol):
    encabezado(ws, "Pedidos corporativos de octubre", "Convierte el rango en una tabla de Excel con una columna calculada.")
    pedidos_tabla(ws, con_importe=sol)
    if sol:
        for r in range(5, 29):
            ws.cell(row=r, column=9, value=f"=F{r}*G{r}").number_format = MONEDA
        agregar_tabla(ws, "Pedidos", "A4:I28", ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Estado", "Importe"], calculadas={"Importe": "Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]"})


T13_1 = A("T1", "De rango a tabla con columna calculada", "T1", apoyo="modelo", minutos=8, construir=m13_t1,
          contexto="Los pedidos están en un rango normal. Como tabla, se ordenan, filtran y calculan solos.",
          modelo="Clic en cualquier celda de los datos › <kbd>Ctrl</kbd>+<kbd>T</kbd> › «La tabla tiene encabezados» › Aceptar. Luego, en Diseño de tabla › Nombre de la tabla, escribe el nombre. Una fórmula escrita en la primera fila de una columna nueva se copia sola: <code>=[@Cantidad]*[@Precio]</code>.",
          instrucciones=["Convierte A4:H28 en una tabla llamada <b>Pedidos</b> con el estilo que prefieras.", "En I4 escribe <b>Importe</b> y en I5 la fórmula <code>=[@Cantidad]*[@Precio]</code>: debe llenarse toda la columna."],
          pruebas=[{"t": "tabla", "h": "T1", "nombre": "Pedidos", "estilo": True, "titulo": "Tabla «Pedidos» con estilo"}, {"t": "tabla", "h": "T1", "nombre": "Pedidos", "columnas": ["Importe"], "calculadas": {"Importe": ["Cantidad", "Precio"]}, "titulo": "Columna calculada Importe"}])

INV = D["inventario"]


def m13_t2(wb, ws, sol):
    encabezado(ws, "Inventario como tabla", "La tabla Inventario ya existe; le falta el valor y la fila de totales.")
    n = len(INV)
    tabla(ws, 4, ["Insumo", "Unidad", "Existencia", "Costo", "Valor"], [[x["insumo"], x["unidad"], x["existencia"], x["costo"], None] for x in INV], formatos={3: MONEDA, 4: MONEDA}, anchos={"A": 26, "B": 8, "C": 11, "D": 10, "E": 12})
    if sol:
        for r in range(5, 5 + n):
            ws.cell(row=r, column=5, value=f"=C{r}*D{r}")
        ws.cell(row=5 + n, column=1, value="Total")
        ws.cell(row=5 + n, column=5, value=f"=SUBTOTAL(109,E5:E{4 + n})").number_format = MONEDA
        agregar_tabla(ws, "Inventario", f"A4:E{5 + n}", ["Insumo", "Unidad", "Existencia", "Costo", "Valor"], calculadas={"Valor": "Inventario[[#This Row],[Existencia]]*Inventario[[#This Row],[Costo]]"}, totales={"Valor": "sum"})
    else:
        agregar_tabla(ws, "Inventario", f"A4:E{4 + n}", ["Insumo", "Unidad", "Existencia", "Costo", "Valor"])
        pintar(ws, "E5", ENTRADA)


T13_2 = A("T2", "Columna calculada y fila de totales", "T2", apoyo="completar", minutos=6, construir=m13_t2,
          contexto="La tabla <b>Inventario</b> ya está creada con su estilo y la columna Valor vacía.",
          instrucciones=["En E5 escribe <code>=[@Existencia]*[@Costo]</code> (haz clic en las celdas: Excel escribe los nombres de columna).", "Activa la fila de totales (Diseño de tabla › Fila de totales) con la suma del Valor."],
          pruebas=[{"t": "tabla", "h": "T2", "nombre": "Inventario", "calculadas": {"Valor": ["Existencia", "Costo"]}, "titulo": "Valor como columna calculada"}, {"t": "tabla", "h": "T2", "nombre": "Inventario", "totales": True, "titulo": "Fila de totales activa"},
                   {"t": "valores", "r": "E5", "v": INV[0]["existencia"] * INV[0]["costo"], "titulo": "El valor del primer insumo es correcto"}])


def m13_t3(wb, ws, sol):
    encabezado(ws, "Resumen con referencias estructuradas", "Los indicadores deben leer la tabla por nombre de columna.")
    pedidos_tabla(ws, con_importe=True)
    for r in range(5, 29):
        ws.cell(row=r, column=9, value=f"=F{r}*G{r}").number_format = MONEDA
    etiquetas(ws, [("K4", "Indicador"), ("L4", "Valor")])
    for i, t in enumerate(["Importe total", "Pedidos pendientes", "Importe de Norte", "Pedido promedio"]):
        ws.cell(row=5 + i, column=11, value=t)
    anchos(ws, K=20, L=14)
    formato(ws, "L5,L7:L8", MONEDA)
    pintar(ws, "L5:L8", ENTRADA)
    if sol:
        agregar_tabla(ws, "Ventas13", "A4:I28", ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Estado", "Importe"], estilo="TableStyleLight9")


T13_3 = A("T3", "Una tabla que alimenta indicadores", "T3", apoyo="autonoma", minutos=10, construir=m13_t3,
          contexto="El resumen L5:L8 debe seguir siendo correcto cuando se agreguen pedidos nuevos al final de la tabla.",
          instrucciones=["Convierte A4:I28 en una tabla (el nombre que quieras).", "Calcula L5:L8 con referencias estructuradas (por ejemplo, <code>=SUMA(Tabla1[Importe])</code>): importe total, número de pedidos pendientes, importe de la sucursal Norte y pedido promedio."],
          pistas=["Al seleccionar una columna completa de la tabla dentro de la fórmula, Excel escribe Tabla[Columna]."],
          sol={"L5": "=SUM(Ventas13[Importe])", "L6": '=COUNTIF(Ventas13[Estado],"Pendiente")', "L7": '=SUMIF(Ventas13[Sucursal],"Norte",Ventas13[Importe])', "L8": "=AVERAGE(Ventas13[Importe])"},
          pruebas=[{"t": "tabla", "h": "T3", "titulo": "Los datos son una tabla"}, {"t": "contiene", "r": "L5:L8", "texto": "[", "titulo": "Fórmulas con referencias estructuradas", "msg": "{celda} debe referirse a la tabla por nombre de columna (Tabla[Columna])."},
                   {"t": "valores", "r": "L5:L8", "v": [sum(p["cantidad"] * p["precio"] for p in PED13), sum(1 for p in PED13 if p["estado"] == "Pendiente"), sum(p["cantidad"] * p["precio"] for p in PED13 if p["sucursal"] == "Norte"), sum(p["cantidad"] * p["precio"] for p in PED13) / len(PED13)], "titulo": "Indicadores correctos"}])

# =============================================================== Módulo 14


def m14_t1(wb, ws, sol):
    encabezado(ws, "Seguimiento de entregas a domicilio", "Días de retraso de cada entrega de la semana.")
    filas = [[f"ENT-{i:03d}", c["cliente"], (i * 7) % 6] for i, c in enumerate((D["clientesCorp"] * 2)[:16], 1)]
    tabla(ws, 4, ["Folio", "Cliente", "Días de retraso"], filas, anchos={"A": 10, "B": 26, "C": 15})
    ws.conditional_formatting.add("C5:C20", Rule(type="cellIs", operator="greaterThan", formula=["3"], dxf=ROJO))
    if sol:
        ws.conditional_formatting.add("C5:C20", Rule(type="cellIs", operator="between", formula=["1", "3"], dxf=AMBAR))


T14_1 = A("T1", "Reglas para resaltar celdas", "T1", apoyo="modelo", minutos=6, construir=m14_t1,
          contexto="La regla «mayor que 3 → rojo» ya está aplicada en C5:C20 (modelo). Falta marcar los retrasos leves.",
          modelo="Inicio › Formato condicional › Administrar reglas muestra la regla del modelo: «Valor de la celda &gt; 3», relleno rojo claro.",
          instrucciones=["Agrega a C5:C20 una segunda regla: valores <b>entre 1 y 3</b> con relleno amarillo."],
          pruebas=[{"t": "condicional", "r": "C5:C20", "tipo": "cellIs", "operador": "between", "titulo": "Regla «entre 1 y 3»"}, {"t": "condicional", "r": "C5:C20", "min": 2, "tipo": "cellIs", "titulo": "Las dos reglas conviven"}])


def m14_t2(wb, ws, sol):
    encabezado(ws, "Desempeño de productos en 2025", "Ventas y margen por producto.")
    filas = []
    for p in PROD:
        v = sum(x["total"] for x in VENTAS if x["producto"] == p["nombre"])
        filas.append([p["nombre"], p["categoria"], v, round(1 - p["costo"] / p["precio"], 3)])
    tabla(ws, 4, ["Producto", "Categoría", "Ventas", "Margen"], filas, formatos={2: MONEDA0, 3: "0.0%"}, anchos={"A": 22, "B": 15, "C": 14, "D": 10})
    ws.conditional_formatting.add("C5:C24", DataBarRule(start_type="min", end_type="max", color="638EC6"))
    if sol:
        ws.conditional_formatting.add("D5:D24", ColorScaleRule(start_type="min", start_color="F8696B", mid_type="percentile", mid_value=50, mid_color="FFEB84", end_type="max", end_color="63BE7B"))
        ws.conditional_formatting.add("A5:A24", Rule(type="containsText", operator="containsText", text="Latte", formula=['NOT(ISERROR(SEARCH("Latte",A5)))'], dxf=AMBAR))


T14_2 = A("T2", "Barras, escalas y texto", "T2", apoyo="completar", minutos=8, construir=m14_t2,
          contexto="Las ventas ya tienen barras de datos. Completa el análisis visual.",
          instrucciones=["Aplica una escala de color de tres colores al margen (D5:D24).", "Resalta en A5:A24 los productos que contienen la palabra «Latte» (Reglas para resaltar celdas › Texto que contiene)."],
          pruebas=[{"t": "condicional", "r": "D5:D24", "tipo": "colorScale", "titulo": "Escala de color en el margen"}, {"t": "condicional", "r": "A5:A24", "tipo": "containsText", "contiene": "Latte", "titulo": "Productos con «Latte» resaltados"}])


def m14_t3(wb, ws, sol):
    encabezado(ws, "Cumplimiento de meta mensual por vendedor", "La meta de octubre fue $12,000 por vendedor.")
    filas = [[e["nombre"], e["sucursal"], e["ventasMes"], None] for e in EMP]
    tabla(ws, 4, ["Vendedor", "Sucursal", "Ventas", "Cumplimiento"], filas, formatos={2: MONEDA0, 3: "0%"}, anchos={"A": 20, "B": 11, "C": 12, "D": 14, "F": 8})
    ws["F2"], ws["G2"] = "Meta", 12000
    ws["G2"].number_format = MONEDA0
    pintar(ws, "D5:D24", ENTRADA)
    if sol:
        ws.conditional_formatting.add("D5:D24", IconSetRule("3TrafficLights1", "num", [0, 0.9, 1]))
        ws.conditional_formatting.add("C5:C24", Rule(type="top10", rank=3, dxf=DifferentialStyle(font=Font(bold=True, color="1E7145"), fill=PatternFill("solid", bgColor="E2F1E8"))))


T14_3 = A("T3", "Semáforo de cumplimiento", "T3", apoyo="autonoma", minutos=10, construir=m14_t3,
          contexto="Recursos Humanos quiere ver de un vistazo quién cumplió la meta y quiénes fueron los tres mejores.",
          instrucciones=["D5:D24: cumplimiento = ventas ÷ meta (G2), con formato de porcentaje.", "Aplica un conjunto de iconos tipo semáforo a D5:D24 (verde desde 100 %, amarillo desde 90 %).", "Resalta en C5:C24 las 3 ventas más altas (Reglas superiores e inferiores)."],
          pistas=["En Administrar reglas › Editar regla, cambia el Tipo de los iconos a «Número» para usar 1 y 0.9."],
          sol={"D5:D24": "=C5/$G$2"},
          pruebas=[{"t": "valores", "r": "D5:D24", "titulo": "Cumplimiento correcto"}, {"t": "robustez", "r": "D5:D24", "cambios": {"G2": 10000}, "titulo": "Se recalcula si cambia la meta"},
                   {"t": "condicional", "r": "D5:D24", "tipo": "iconSet", "titulo": "Semáforo de iconos"}, {"t": "condicional", "r": "C5:C24", "tipo": "top10", "titulo": "Las 3 ventas más altas resaltadas"}])

# =============================================================== Módulo 15


def catalogo(wb):
    return hoja_aux(wb, "Catálogo", "Catálogo de productos", ["Código", "Producto", "Precio"], [[p["codigo"], p["nombre"], p["precio"]] for p in PROD], formatos={2: MONEDA}, anchos={"A": 10, "B": 22})


def m15_t1(wb, ws, sol):
    catalogo(wb)
    encabezado(ws, "Captura de pedidos por teléfono", "Las listas desplegables evitan errores de escritura.")
    tabla(ws, 4, ["Folio", "Sucursal", "Producto", "Cantidad"], [[3001 + i, None, None, None] for i in range(26)], anchos={"A": 8, "B": 12, "C": 22, "D": 10})
    dv = DataValidation(type="list", formula1='"Centro,Norte,Sur"', allow_blank=True)
    dv.add("B5:B30" if sol else "B5")
    ws.add_data_validation(dv)
    if sol:
        dv2 = DataValidation(type="list", formula1="Catálogo!$B$4:$B$23", allow_blank=True)
        dv2.add("C5:C30")
        ws.add_data_validation(dv2)
    pintar(ws, "B5", MODELO)
    nota(ws, "B5", "Modelo: Datos › Validación de datos › Lista, origen: Centro,Norte,Sur.")
    pintar(ws, "B6:C30", ENTRADA)


T15_1 = A("T1", "Listas desplegables", "T1", apoyo="modelo", minutos=8, construir=m15_t1,
          contexto="B5 ya tiene una lista desplegable con las sucursales (modelo).",
          modelo="B5: Datos › Validación de datos › Permitir: Lista › Origen: <code>Centro,Norte,Sur</code>.",
          instrucciones=["Extiende la lista de sucursales a B5:B30 (selecciona B5:B30, abre Validación de datos y acepta extenderla).", "En C5:C30 crea una lista de productos que tome sus valores de la hoja Catálogo (B4:B23)."],
          pruebas=[{"t": "validacion", "r": "B5:B30", "tipo": "list", "contiene": ["Centro", "Norte", "Sur"], "titulo": "Lista de sucursales en B5:B30"},
                   {"t": "validacion", "r": "C5:C30", "tipo": "list", "origen": "Cat", "origenTexto": "Catálogo!$B$4:$B$23", "titulo": "Lista de productos desde el Catálogo"}])


def m15_t2(wb, ws, sol):
    encabezado(ws, "Registro de horas extra del personal", "Solo se aceptan entre 1 y 12 horas y fechas de 2026.")
    tabla(ws, 4, ["Empleado", "Horas extra", "Fecha"], [[e["nombre"], None, None] for e in EMP[:15]], anchos={"A": 20, "B": 12, "C": 12})
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="12", showErrorMessage=True, errorTitle="Horas no válidas", error="Escribe un número entero de 1 a 12.")
    dv.add("B5:B19")
    ws.add_data_validation(dv)
    if sol:
        dv2 = DataValidation(type="date", operator="between", formula1=str(serial("2026-01-01")), formula2=str(serial("2026-12-31")), showErrorMessage=True, errorTitle="Fecha fuera de rango", error="La fecha debe ser de 2026.")
        dv2.add("C5:C19")
        ws.add_data_validation(dv2)
    formato(ws, "C5:C19", FECHA)
    pintar(ws, "B5:C19", ENTRADA)


T15_2 = A("T2", "Números enteros, fechas y mensajes de error", "T2", apoyo="completar", minutos=8, construir=m15_t2,
          contexto="La columna B ya acepta solo enteros de 1 a 12 y muestra un mensaje de error propio.",
          instrucciones=["En C5:C19 permite solo fechas entre el 01/01/2026 y el 31/12/2026.", "Escribe un mensaje de error claro para las fechas (pestaña Mensaje de error)."],
          pruebas=[{"t": "validacion", "r": "C5:C19", "tipo": "date", "titulo": "Solo fechas de 2026"}, {"t": "validacion", "r": "C5:C19", "tipo": "date", "mensajeError": True, "titulo": "Mensaje de error personalizado"},
                   {"t": "validacion", "r": "B5:B19", "tipo": "whole", "min": 1, "max": 12, "titulo": "La regla de horas sigue intacta"}])


def m15_t3(wb, ws, sol):
    encabezado(ws, "Alta de clientes del programa de lealtad", "Folio sin repetir y teléfono de 10 dígitos.")
    tabla(ws, 4, ["Folio", "Nombre", "Teléfono", "Puntos iniciales"], [[None] * 4 for _ in range(20)], anchos={"A": 10, "B": 22, "C": 14, "D": 15})
    ws["A5"], ws["B5"], ws["C5"], ws["D5"] = "LZ-001", "Mónica Estrada", "5544935885", 50
    if sol:
        dv = DataValidation(type="custom", formula1="COUNTIF($A$5:$A$24,A5)=1", showErrorMessage=True, error="Ese folio ya existe.")
        dv.add("A5:A24")
        dv2 = DataValidation(type="textLength", operator="equal", formula1="10", showErrorMessage=True, error="El teléfono debe tener 10 dígitos.")
        dv2.add("C5:C24")
        dv3 = DataValidation(type="whole", operator="between", formula1="0", formula2="500", showErrorMessage=True, error="Los puntos iniciales van de 0 a 500.")
        dv3.add("D5:D24")
        for dv_ in (dv, dv2, dv3):
            ws.add_data_validation(dv_)
    pintar(ws, "A6:D24", ENTRADA)


T15_3 = A("T3", "Reglas personalizadas", "T3", apoyo="autonoma", minutos=12, construir=m15_t3,
          contexto="El registro se captura en la caja: hay que impedir folios repetidos, teléfonos incompletos y puntos fuera de rango.",
          instrucciones=["A5:A24: validación personalizada que impida repetir un folio.", "C5:C24: solo textos de exactamente 10 caracteres (longitud del texto).", "D5:D24: enteros de 0 a 500.", "Cada regla con un mensaje de error."],
          pistas=["Fórmula personalizada para folio único: <code>=CONTAR.SI($A$5:$A$24;A5)=1</code>."],
          pruebas=[{"t": "validacion", "r": "A5:A24", "tipo": "custom", "formula": "COUNTIF", "titulo": "Folio único (CONTAR.SI)"}, {"t": "validacion", "r": "C5:C24", "tipo": "textLength", "min": 10, "titulo": "Teléfono de 10 caracteres"},
                   {"t": "validacion", "r": "D5:D24", "tipo": "whole", "min": 0, "max": 500, "titulo": "Puntos de 0 a 500"}, {"t": "validacion", "r": "A5:A24", "mensajeError": True, "titulo": "Mensajes de error"}])

# =============================================================== Módulo 16
PRES = D["presupuesto"]


def m16_t1(wb, ws, sol):
    encabezado(ws, "Presupuesto del primer semestre para revisión", "Deja notas donde tengas dudas para quien lo revise.")
    meses = D["mesesCortos"][:6]
    tabla(ws, 4, ["Concepto"] + meses, [[p["concepto"]] + p["meses"] for p in PRES], formatos={i: MONEDA0 for i in range(1, 7)}, anchos={"A": 18})
    nota(ws, "C5", "Modelo: ¿la renta sube en febrero? Confirmar con el contrato.")
    pintar(ws, "C5", MODELO)
    if sol:
        nota(ws, "B6", "¿Incluye el aguinaldo prorrateado?")
        nota(ws, "G9", "Revisar: diciembre suele ser más alto.")


T16_1 = A("T1", "Notas para el revisor", "T1", apoyo="modelo", minutos=5, construir=m16_t1,
          contexto="C5 ya tiene una nota de duda (modelo; el triángulo rojo de la esquina).",
          modelo="C5: clic derecho › Nueva nota (o Revisar › Notas › Nueva nota). La nota explica la duda en una frase.",
          instrucciones=["Agrega al menos dos notas más en la hoja T1, en las cifras que te parezcan dudosas."],
          pruebas=[{"t": "notas", "h": "T1", "min": 3, "titulo": "Al menos tres notas en T1"}])


def m16_t2(wb, ws, sol):
    encabezado(ws, "Formato de solicitud de insumos", "Las sucursales solo deben poder escribir en las celdas amarillas.")
    tabla(ws, 4, ["Insumo", "Unidad", "Costo", "Cantidad", "Importe"], [[x["insumo"], x["unidad"], x["costo"], None, None] for x in INV[:12]], formatos={2: MONEDA, 4: MONEDA}, anchos={"A": 26, "B": 8, "C": 10, "D": 10, "E": 12})
    for r in range(5, 17):
        ws.cell(row=r, column=5, value=f"=C{r}*D{r}")
    pintar(ws, "D5:D16", ENTRADA)
    if sol:
        for r in range(5, 17):
            ws.cell(row=r, column=4).protection = Protection(locked=False)
        ws.protection.sheet = True
    else:
        ws["D5"].protection = Protection(locked=False)
        nota(ws, "D5", "Ejemplo: D5 ya está desbloqueada (Formato de celdas › Proteger › sin «Bloqueada»).")


T16_2 = A("T2", "Desbloquear celdas y proteger la hoja", "T2", apoyo="completar", minutos=6, construir=m16_t2,
          contexto="D5 ya está desbloqueada. Termina de preparar el formato.",
          instrucciones=["Desbloquea D6:D16 (Formato de celdas › Proteger › quita «Bloqueada»).", "Protege la hoja T2 (Revisar › Proteger hoja). La contraseña es opcional."],
          pruebas=[{"t": "estilo", "r": "D5:D16", "prop": "desbloqueada", "titulo": "Celdas de captura desbloqueadas"}, {"t": "protegida", "titulo": "Hoja T2 protegida"}])


def m16_t3(wb, ws, sol):
    h = hoja_aux(wb, "Costos", "Costos internos (confidencial)", ["Producto", "Costo"], [[p["nombre"], p["costo"]] for p in PROD[:10]], formatos={1: MONEDA}, anchos={"A": 22})
    encabezado(ws, "Lista de precios para franquicias", "El margen se calcula con los costos internos, que no deben verse.")
    tabla(ws, 4, ["Producto", "Precio", "Costo", "Margen"], [[p["nombre"], p["precio"], None, None] for p in PROD[:10]], formatos={1: MONEDA, 2: MONEDA, 3: "0%"}, anchos={"A": 22})
    pintar(ws, "C5:D14", ENTRADA)
    if sol:
        h.sheet_state = "hidden"
        wb.security = __import__("openpyxl").workbook.protection.WorkbookProtection(lockStructure=True)


T16_3 = A("T3", "Ocultar y proteger la estructura", "T3", apoyo="autonoma", minutos=8, construir=m16_t3,
          contexto="La lista se enviará a las franquicias: pueden ver precios y márgenes, pero no la hoja de costos ni cambiar las hojas.",
          instrucciones=["C5:C14: trae el costo de cada producto desde la hoja Costos (referencia a otra hoja).", "D5:D14: margen = (precio − costo) ÷ precio.", "Oculta la hoja Costos y protege la estructura del libro (Revisar › Proteger libro)."],
          sol={"C5:C14": "=Costos!B4", "D5:D14": "=(B5-C5)/B5"},
          pruebas=[{"t": "contiene", "r": "C5:C14", "texto": "Costos!", "titulo": "Costos traídos de la otra hoja"}, {"t": "valores", "r": "C5:D14", "titulo": "Costos y márgenes correctos"},
                   {"t": "hojaOculta", "h": "Costos", "titulo": "Hoja Costos oculta"}, {"t": "libroProtegido", "titulo": "Estructura del libro protegida"}])

MODULOS = [
    {"id": 9, "slug": "referencias-si", "titulo": "Referencias, nombres y decisiones con SI", "tareas": [T9_1, T9_2, T9_3]},
    {"id": 10, "slug": "condiciones", "titulo": "Resumir con condiciones", "tareas": [T10_1, T10_2, T10_3]},
    {"id": 11, "slug": "texto-fechas", "titulo": "Funciones de texto y de fecha", "tareas": [T11_1, T11_2, T11_3]},
    {"id": 12, "slug": "organizar", "titulo": "Organizar datos", "tareas": [T12_1, T12_2, T12_3]},
    {"id": 13, "slug": "tablas", "titulo": "Tablas", "tareas": [T13_1, T13_2, T13_3]},
    {"id": 14, "slug": "formato-condicional", "titulo": "Formato intermedio", "tareas": [T14_1, T14_2, T14_3]},
    {"id": 15, "slug": "validacion", "titulo": "Validación de datos", "tareas": [T15_1, T15_2, T15_3]},
    {"id": 16, "slug": "colaborar", "titulo": "Colaborar y proteger", "tareas": [T16_1, T16_2, T16_3]},
]
