"""Tareas de aprendizaje del nivel Básico (módulos 1 a 8). Ver actividades_comun.py."""
from openpyxl.chart import BarChart, LineChart, PieChart, Reference
from openpyxl.drawing.image import Image
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.hyperlink import Hyperlink

import pathlib
import lataza_datos as LD
from actividades_comun import (Actividad as A, encabezado, tabla, pintar, formato, nota, anchos, etiquetas, serial, iso_mas,
                               NEGRITA, ENC, ENTRADA, MODELO, BORDE, MONEDA, MONEDA0, FECHA)

D = LD.generar()
PROD = D["productos"]
LOGO = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img" / "logo-la-taza.png"


def vinculo_interno(ws, celda, hoja):
    ws[celda].hyperlink = Hyperlink(ref=celda, location=f"'{hoja}'!A1", display=ws[celda].value)
    ws[celda].font = Font(color="0563C1", underline="single")


def bordes(ws, rango):
    for fila in ws[rango]:
        for c in fila:
            c.border = BORDE


# =============================================================== Módulo 1
def m1_t1(wb, ws, sol):
    encabezado(ws, "Ficha de la sucursal Poniente", "La Taza abrirá una cuarta sucursal. Completa su ficha.")
    tabla(ws, 4, ["Dato", "Valor"], [["Sucursal", "Poniente"], ["Encargada", None], ["Teléfono", None], ["Apertura", None]], anchos={"A": 16, "B": 26})
    pintar(ws, "B4", MODELO)
    nota(ws, "B5", "Modelo: B5 ya tiene el dato; escribe los siguientes y pulsa Enter para bajar.")
    pintar(ws, "B6:B8", ENTRADA)


T1_1 = A("T1", "Ficha de la nueva sucursal", "T1", apoyo="modelo", minutos=8, construir=m1_t1,
         contexto="La Taza abrirá la sucursal <b>Poniente</b>. La ficha ya tiene el nombre de la sucursal como modelo (celda verde).",
         modelo="B5 = «Poniente»: escribe el dato y pulsa <kbd>Enter</kbd> para bajar a la siguiente celda. El cuadro de nombres te dice dónde estás.",
         instrucciones=["En B6 escribe <b>Mariana Ortiz</b>, en B7 el teléfono <b>5550184422</b> y en B8 la fecha <b>15/01/2026</b>.", "Cambia el zoom de la hoja T1 a <b>120 %</b> (control de zoom de la barra de estado)."],
         sol={"B6": "Mariana Ortiz", "B7": 5550184422, "B8": serial("2026-01-15")},
         sol_extra=lambda wb, ws: (setattr(ws.sheet_view, "zoomScale", 120), setattr(ws["B8"], "number_format", FECHA)),
         pruebas=[{"t": "valores", "r": "B6:B8", "v": ["Mariana Ortiz", 5550184422, serial("2026-01-15")], "titulo": "Ficha completa", "msg": "{celda} muestra {obtenido}; debería ser {esperado}."},
                  {"t": "vista", "zoom": 120, "titulo": "Zoom de 120 %"}])


def m1_t2(wb, ws, sol):
    encabezado(ws, "Moverse por un libro grande", "Usa el cuadro de nombres para ir directo a una celda lejana.")
    tabla(ws, 4, ["Paso", "Hecho"], [["Ir a K40 con el cuadro de nombres", "✓"], ["Escribir «Revisado» en K40", None], ["Título del documento", None]], anchos={"A": 40, "B": 10})


T1_2 = A("T2", "Cuadro de nombres y propiedades", "T2", apoyo="completar", minutos=6, construir=m1_t2,
         contexto="El libro de tareas se comparte con la gerencia: debe tener título y una marca de revisión.",
         instrucciones=["En el <b>cuadro de nombres</b> escribe <b>K40</b> y pulsa Enter; ahí escribe <b>Revisado</b>.", "Ve a Archivo › Información › Propiedades y escribe el título <b>Tareas del módulo 1</b>."],
         sol={"K40": "Revisado"},
         sol_extra=lambda wb, ws: setattr(wb.properties, "title", "Tareas del módulo 1"),
         pruebas=[{"t": "valores", "r": "K40", "v": "Revisado", "titulo": "K40 dice «Revisado»"}, {"t": "propiedad", "campo": "titulo", "patron": "tareas", "titulo": "Título del documento"}])


def m1_t3(wb, ws, sol):
    encabezado(ws, "Ventas de la semana · sucursal Sur", "Encabezados en la fila 4.")
    sem = D["semanaSucursal"]["Sur"]
    filas = [[p["producto"], sum(p["cantidades"])] for p in sem]
    tabla(ws, 4, ["Producto", "Unidades"], filas, anchos={"A": 24, "B": 12, "D": 30})
    etiquetas(ws, [("D2", "Suma de B5:B12 (barra de estado)")])
    pintar(ws, "E2", ENTRADA)


T1_3 = A("T3", "Vista, paneles y barra de estado", "T3", apoyo="autonoma", minutos=8, construir=m1_t3,
         contexto="Vas a revisar el reporte de Sur en pantalla, como lo verá impreso.",
         instrucciones=["Inmoviliza las filas 1 a 4 de la hoja T3 (los encabezados quedan visibles al bajar).", "Pon la hoja T3 en vista <b>Diseño de página</b>.", "Selecciona B5:B12, lee la suma en la barra de estado y escríbela (como número) en E2."],
         sol={"E2": sum(sum(p["cantidades"]) for p in D["semanaSucursal"]["Sur"])},
         sol_extra=lambda wb, ws: (setattr(ws, "freeze_panes", "A5"), setattr(ws.sheet_view, "view", "pageLayout")),
         pruebas=[{"t": "inmovilizada", "filas": 4, "titulo": "Filas 1 a 4 inmovilizadas"}, {"t": "vista", "vista": "pageLayout", "titulo": "Vista Diseño de página"},
                  {"t": "valores", "r": "E2", "titulo": "Suma escrita en E2", "msg": "E2 muestra {obtenido}; la barra de estado muestra {esperado} al seleccionar B5:B12."}])

# =============================================================== Módulo 2
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def m2_t1(wb, ws, sol):
    encabezado(ws, "Entregas a domicilio de dos semanas", "Cada entrega tiene un folio consecutivo y un día.")
    tabla(ws, 4, ["Folio", "Día", "Cliente"], [["ENT-001", "lunes", c["cliente"]] if i == 0 else [None, None, c["cliente"]] for i, c in enumerate((D["clientesCorp"] * 2)[:12])], anchos={"A": 12, "B": 12, "C": 28})
    pintar(ws, "A5:B5", MODELO)
    nota(ws, "A5", "Modelo: selecciona A5:B5 y arrastra el controlador de relleno (cuadrito verde) hasta la fila 16.")
    pintar(ws, "A6:B16", ENTRADA)


T2_1 = A("T1", "Folios y días con el controlador de relleno", "T1", apoyo="modelo", minutos=6, construir=m2_t1,
         contexto="El repartidor necesita los folios de 12 entregas y el día de cada una, empezando en lunes.",
         modelo="A5 = ENT-001 y B5 = lunes. Al arrastrar, Excel continúa la serie: ENT-002, martes…",
         instrucciones=["Selecciona A5:B5 y arrastra el controlador de relleno hasta la fila 16.", "Revisa que el folio 12 sea ENT-012 y que los días sigan después del domingo."],
         sol={"A6:A16": [[f"ENT-{i:03d}"] for i in range(2, 13)], "B6:B16": [[DIAS[i % 7]] for i in range(1, 12)]},
         pruebas=[{"t": "valores", "r": "A6:A16", "v": [f"ENT-{i:03d}" for i in range(2, 13)], "titulo": "Folios ENT-002 a ENT-012"},
                  {"t": "valores", "r": "B6:B16", "v": [DIAS[i % 7] for i in range(1, 12)], "titulo": "Días en serie (después de domingo vuelve lunes)"}])

INSUMOS_M2 = [("Lech entera", "Litro"), ("Leche deslactosada", "Litro"), ("Lech de almendra", "Litro"), ("Café en grano", "Kilo"), ("Lech de avena", "Litro"), ("Azúcar mascabado", "Kilo"), ("Lech condensada", "Lata"), ("Canela molida", "Kilo")]


def m2_t2(wb, ws, sol):
    encabezado(ws, "Lista de insumos para el proveedor", "Alguien escribió «Lech» en varios productos.")
    tabla(ws, 4, ["Código", "Insumo", "Unidad", "Pedido"], [[f"INS-{i:02d}", n if i != 2 else "Leche deslactosada", u, None] for i, (n, u) in enumerate(INSUMOS_M2, 1)], anchos={"A": 10, "B": 26, "C": 10, "D": 10})
    ws["D5"] = "Sí"
    pintar(ws, "D5", MODELO)
    pintar(ws, "D6:D12", ENTRADA)


T2_2 = A("T2", "Buscar y reemplazar, y rellenar hacia abajo", "T2", apoyo="completar", minutos=6, construir=m2_t2,
         contexto="La lista de insumos tiene un error repetido y la columna Pedido está a medias.",
         instrucciones=["Con Buscar y reemplazar (<kbd>Ctrl</kbd>+<kbd>L</kbd>), cambia <b>Lech </b> (con espacio) por <b>Leche </b> en toda la hoja.", "D5 ya dice «Sí»: selecciona D5:D12 y rellena hacia abajo (<kbd>Ctrl</kbd>+<kbd>J</kbd>)."],
         sol={"B5:B12": [[n.replace("Lech ", "Leche ")] for n, _ in INSUMOS_M2], "D6:D12": "Sí"},
         pruebas=[{"t": "valores", "r": "B5:B12", "v": [n.replace("Lech ", "Leche ") for n, _ in INSUMOS_M2], "titulo": "Insumos sin «Lech»", "msg": "{celda} dice {obtenido}; debería decir {esperado}."},
                  {"t": "valores", "r": "D6:D12", "v": "Sí", "titulo": "Columna Pedido completa"}])

BEBIDAS_M2 = [p for p in PROD if p["categoria"] in ("Café frío", "Té")]


def m2_t3(wb, ws, sol):
    encabezado(ws, "Precios de bebidas para el menú de pizarra", "La pizarra se escribe en una fila, no en una columna.")
    tabla(ws, 6, ["Bebida", "Precio", "Precio +5 %"], [[p["nombre"], p["precio"], None] for p in BEBIDAS_M2], formatos={1: MONEDA, 2: MONEDA}, anchos={"A": 18})
    for i in range(len(BEBIDAS_M2)):
        ws.cell(row=7 + i, column=3, value=f"=ROUND(B{7 + i}*1.05,0)").number_format = MONEDA
    etiquetas(ws, [("B3", "Bebida"), ("B4", "Precio nuevo")])
    pintar(ws, "C3:G4", ENTRADA)


T2_3 = A("T3", "Pegado especial: transponer y valores", "T3", apoyo="autonoma", minutos=8, construir=m2_t3,
         contexto="Los precios nuevos (+5 %) ya están calculados en la columna C. Para la pizarra los necesitas en dos filas y como valores fijos.",
         instrucciones=["Lleva los nombres de A7:A11 a la fila 3 (C3:G3) y los precios nuevos de C7:C11 a la fila 4 (C4:G4).", "Los precios de C4:G4 deben quedar como <b>valores</b> (no fórmulas)."],
         pistas=["Copia A7:A11, haz clic en C3 y usa Pegado especial › Transponer.", "Para los precios: copia C7:C11 › clic en C4 › Pegado especial › Valores y Transponer."],
         sol={"C3:G3": [[p["nombre"] for p in BEBIDAS_M2]], "C4:G4": [[round(p["precio"] * 1.05) for p in BEBIDAS_M2]]},
         pruebas=[{"t": "valores", "r": "C3:G3", "v": [p["nombre"] for p in BEBIDAS_M2], "titulo": "Nombres transpuestos en C3:G3"},
                  {"t": "valores", "r": "C4:G4", "v": [round(p["precio"] * 1.05) for p in BEBIDAS_M2], "titulo": "Precios nuevos en C4:G4"},
                  {"t": "sinFormula", "r": "C4:G4", "titulo": "Los precios son valores fijos"}])

# =============================================================== Módulo 3
INV = D["inventario"]


def m3_t1(wb, ws, sol):
    encabezado(ws, "Pedido semanal a proveedores", "Importe de cada insumo = cantidad × costo unitario.")
    filas = [[x["insumo"], max(x["minimo"] - x["existencia"], 0) + 5, x["costo"], None] for x in INV[:10]]
    tabla(ws, 4, ["Insumo", "Cantidad", "Costo unitario", "Importe"], filas, formatos={2: MONEDA, 3: MONEDA}, anchos={"A": 28, "B": 10, "C": 14, "D": 14})
    ws["D5"] = "=B5*C5"
    pintar(ws, "D5", MODELO)
    nota(ws, "D5", "Modelo: =B5*C5. Cópiala hacia abajo con el controlador de relleno.")
    ws["C15"] = "Total"
    ws["C15"].font = NEGRITA
    ws["D15"].number_format = MONEDA
    pintar(ws, "D6:D15", ENTRADA)


T3_1 = A("T1", "Importe de cada insumo", "T1", apoyo="modelo", minutos=8, construir=m3_t1,
         contexto="El pedido semanal tiene 10 insumos. D5 ya calcula el primer importe.",
         modelo="D5 = <code>=B5*C5</code>. Al copiarla a D6 se convierte en <code>=B6*C6</code>: las referencias se mueven con la fila.",
         instrucciones=["Copia D5 hasta D14.", "En D15 calcula el total del pedido con SUMA."],
         sol={"D5:D14": "=B5*C5", "D15": "=SUM(D5:D14)"},
         pruebas=[{"t": "formula", "r": "D5:D15", "titulo": "Importes y total con fórmulas"}, {"t": "usa", "r": "D15", "f": ["SUM"], "titulo": "Total con SUMA"},
                  {"t": "valores", "r": "D5:D15", "titulo": "Importes y total correctos"}, {"t": "robustez", "r": "D5:D15", "cambios": {"B6": 40, "C9": 99}, "titulo": "Se actualiza si cambian cantidades o costos"}])


def m3_t2(wb, ws, sol):
    encabezado(ws, "Corte del turno vespertino · Norte", "12 tickets del turno de la tarde.")
    tk = D["corte"][:12]
    tabla(ws, 4, ["Ticket", "Producto", "Cantidad", "Precio", "Importe"], [[t["ticket"], t["producto"], t["cantidad"], t["precio"], None] for t in tk], formatos={3: MONEDA, 4: MONEDA}, anchos={"B": 22, "E": 12, "G": 22, "H": 12})
    for i in range(12):
        ws.cell(row=5 + i, column=5, value=f"=C{5 + i}*D{5 + i}").number_format = MONEDA
    etiquetas(ws, [("G4", "Total del turno"), ("G5", "Ticket promedio"), ("G6", "Ticket más alto"), ("G7", "Ticket más bajo"), ("G8", "Número de tickets")])
    ws["H4"] = "=SUM(E5:E16)"
    for c in ("H4", "H5", "H6", "H7"):
        ws[c].number_format = MONEDA
    pintar(ws, "H4", MODELO)
    pintar(ws, "H5:H8", ENTRADA)


T3_2 = A("T2", "Indicadores del corte de caja", "T2", apoyo="completar", minutos=8, construir=m3_t2,
         contexto="El total ya está calculado en H4. Completa los demás indicadores del turno.",
         instrucciones=["H5: el ticket promedio (PROMEDIO de E5:E16).", "H6 y H7: el ticket más alto y el más bajo.", "H8: cuántos tickets hubo (CONTAR)."],
         sol={"H5": "=AVERAGE(E5:E16)", "H6": "=MAX(E5:E16)", "H7": "=MIN(E5:E16)", "H8": "=COUNT(E5:E16)"},
         pruebas=[{"t": "usa", "r": "H5", "f": ["AVERAGE"], "titulo": "Promedio con PROMEDIO"}, {"t": "usa", "r": "H6", "f": ["MAX"], "titulo": "Máximo con MAX"}, {"t": "usa", "r": "H7", "f": ["MIN"], "titulo": "Mínimo con MIN"},
                  {"t": "usa", "r": "H8", "f": ["COUNT", "COUNTA"], "titulo": "Número de tickets con CONTAR"}, {"t": "valores", "r": "H5:H8", "titulo": "Indicadores correctos"}])

CATERING = [("Café de olla (litros)", 12, 95), ("Café americano (litros)", 8, 110), ("Mini croissants", 60, 18), ("Conchas", 40, 22), ("Galletas de avena", 80, 12), ("Fruta picada (charolas)", 6, 280), ("Agua embotellada", 50, 14)]


def m3_t3(wb, ws, sol):
    encabezado(ws, "Presupuesto · desayuno de Colegio Montebello", "Servicio de catering para 50 personas.")
    tabla(ws, 4, ["Concepto", "Cantidad", "Precio unitario", "Importe", "Participación"], [list(x) + [None, None] for x in CATERING], formatos={2: MONEDA, 3: MONEDA, 4: "0.0%"}, anchos={"A": 26, "B": 10, "C": 14, "D": 13, "E": 13})
    etiquetas(ws, [("C12", "Subtotal"), ("C13", "IVA"), ("C14", "Total")])
    ws["B13"] = 0.16
    ws["B13"].number_format = "0%"
    nota(ws, "B13", "Tasa de IVA")
    for c in ("D12", "D13", "D14"):
        ws[c].number_format = MONEDA
    pintar(ws, "D5:E11,D12:D14", ENTRADA)


T3_3 = A("T3", "Presupuesto de un evento", "T3", apoyo="autonoma", minutos=12, construir=m3_t3,
         contexto="Arma el presupuesto completo del desayuno: importes, subtotal, IVA (tasa en B13), total y la participación de cada concepto.",
         instrucciones=["D5:D11: importe de cada concepto.", "D12: subtotal; D13: IVA (subtotal × tasa de B13); D14: total.", "E5:E11: qué porcentaje del subtotal representa cada concepto."],
         pistas=["La participación es importe ÷ subtotal: al copiarla, el subtotal no debe moverse (<code>$D$12</code>)."],
         sol={"D5:D11": "=B5*C5", "D12": "=SUM(D5:D11)", "D13": "=D12*B13", "D14": "=D12+D13", "E5:E11": "=D5/$D$12"},
         pruebas=[{"t": "formula", "r": "D5:E11,D12:D14", "titulo": "Todo se calcula con fórmulas"}, {"t": "valores", "r": "D5:D14", "titulo": "Importes, subtotal, IVA y total correctos"},
                  {"t": "valores", "r": "E5:E11", "titulo": "Participación correcta", "msg": "{celda} muestra {obtenido}; debería ser {esperado}. ¿Fijaste el subtotal al copiar?"},
                  {"t": "robustez", "r": "D12:D14,E5:E11", "cambios": [{"B13": 0.08}, {"B6": 20, "C10": 300}], "titulo": "Resiste cambios de cantidades, precios e IVA"}])

# =============================================================== Módulo 4
PROVEEDORES = [("Finca El Mirador", "Café en grano", "2025-01-15", 420, 0.05), ("Lácteos del Valle", "Leche y crema", "2024-08-01", 26, 0.03), ("Panificadora Sol", "Pan dulce", "2023-11-20", 9.5, 0.0),
               ("Dulce Origen", "Azúcar y piloncillo", "2025-03-03", 38, 0.02), ("Empaques MX", "Vasos y tapas", "2022-06-10", 1.8, 0.1), ("Té Montaña", "Tés e infusiones", "2024-02-14", 310, 0.04),
               ("Frutas Lupita", "Fruta fresca", "2025-05-05", 45, 0.0), ("Higiene Total", "Limpieza", "2023-09-01", 120, 0.06)]


def m4_t1(wb, ws, sol):
    encabezado(ws, "Directorio de proveedores", "Dale formato para imprimirlo.")
    tabla(ws, 4, ["Proveedor", "Insumos", "Alta", "Precio de lista", "Descuento"], list(map(list, PROVEEDORES)), anchos={"A": 22, "B": 22, "C": 12, "D": 15, "E": 12})
    for c in "ABCDE":
        ws[c + "4"].font = Font(bold=False)
        ws[c + "4"].fill = PatternFill()
    ws["A4"].font = NEGRITA
    ws["A4"].fill = ENC
    for r in range(5, 13):
        ws.cell(row=r, column=3).number_format = "General"
    nota(ws, "A4", "Modelo: A4 ya está en negrita y con relleno. Usa la brocha (Copiar formato) para B4:E4.")


T4_1 = A("T1", "Formato de un directorio", "T1", apoyo="modelo", minutos=8, construir=m4_t1,
         contexto="El directorio de proveedores tiene datos correctos, pero no se lee bien.",
         modelo="A4 ya tiene el formato de encabezado (negrita y relleno): cópialo con la brocha a B4:E4.",
         instrucciones=["Copia el formato de A4 a B4:E4.", "C5:C12: formato de fecha corta.", "D5:D12: formato de moneda; E5:E12: porcentaje."],
         sol_extra=lambda wb, ws: [setattr(ws[c + "4"], "font", NEGRITA) or setattr(ws[c + "4"], "fill", ENC) for c in "BCDE"] and (formato(ws, "C5:C12", FECHA), formato(ws, "D5:D12", MONEDA), formato(ws, "E5:E12", "0%")),
         pruebas=[{"t": "estilo", "r": "A4:E4", "prop": ["negrita", "relleno"], "titulo": "Encabezados en negrita con relleno"}, {"t": "fmt", "r": "C5:C12", "tipo": "fecha", "titulo": "Altas con formato de fecha"},
                  {"t": "fmt", "r": "D5:D12", "tipo": "moneda", "titulo": "Precios en moneda"}, {"t": "fmt", "r": "E5:E12", "tipo": "porcentaje", "titulo": "Descuentos en porcentaje"}])

MERMAS = [("2025-11-03", "Croissant", "Panadería", 6, 38), ("2025-11-03", "Leche entera (L)", "Lácteos", 4, 26), ("2025-11-04", "Pay de queso", "Postres", 2, 55), ("2025-11-05", "Concha", "Panadería", 9, 22),
          ("2025-11-06", "Fruta picada", "Fruta", 3, 45), ("2025-11-07", "Muffin de mora", "Panadería", 5, 35), ("2025-11-08", "Sándwich de pavo", "Alimentos", 2, 78), ("2025-11-09", "Brownie", "Postres", 4, 40),
          ("2025-11-10", "Leche de avena (L)", "Lácteos", 2, 48)]


def m4_t2(wb, ws, sol):
    encabezado(ws, "Registro de mermas de noviembre · Centro", "Producto que se desechó por caducidad o daño.")
    tabla(ws, 4, ["Fecha", "Producto", "Categoría", "Piezas", "Costo unitario", "Costo de la merma (pesos)"], [list(x) + [None] for x in MERMAS], anchos={"A": 12, "B": 22, "C": 13, "D": 9, "E": 14, "F": 16})
    for r in range(5, 14):
        ws.cell(row=r, column=6, value=f"=D{r}*E{r}")
        ws.cell(row=r, column=1).number_format = "General"
    formato(ws, "E5:F13", MONEDA)
    bordes(ws, "A4:C13")


T4_2 = A("T2", "Fechas, texto ajustado y bordes", "T2", apoyo="completar", minutos=8, construir=m4_t2,
         contexto="Las fechas se ven como números, el último encabezado es muy largo y los bordes solo llegan a la columna C.",
         instrucciones=["A5:A13: formato de fecha corta.", "F4: activa Ajustar texto.", "Completa los bordes de toda la tabla A4:F13 (ya están en A4:C13)."],
         sol_extra=lambda wb, ws: (formato(ws, "A5:A13", FECHA), setattr(ws["F4"], "alignment", Alignment(wrap_text=True)), bordes(ws, "A4:F13")),
         pruebas=[{"t": "fmt", "r": "A5:A13", "tipo": "fecha", "titulo": "Fechas con formato de fecha"}, {"t": "estilo", "r": "F4", "prop": "ajustar", "titulo": "Encabezado con texto ajustado"},
                  {"t": "estilo", "r": "A4:F13", "prop": "bordes", "titulo": "Bordes en toda la tabla"}])


def m4_t3(wb, ws, sol):
    ws["A1"] = "Cotización · Coffee break Inmobiliaria Cumbres"
    ws["A2"] = "Vigencia: 30 días"
    filas = [["Café de olla (litros)", 10, 95], ["Té chai (litros)", 6, 120], ["Mini croissants", 50, 18], ["Galletas de avena", 60, 12], ["Agua embotellada", 40, 14]]
    tabla(ws, 4, ["Concepto", "Cantidad", "Precio", "Importe", "% del total"], [f + [None, None] for f in filas], anchos={"A": 26, "B": 10, "C": 11, "D": 12, "E": 12})
    for c in "ABCDE":
        ws[c + "4"].font = Font(bold=False)
        ws[c + "4"].fill = PatternFill()
    for r in range(5, 10):
        ws.cell(row=r, column=4, value=f"=B{r}*C{r}")
        ws.cell(row=r, column=5, value=f"=D{r}/$D$10")
    ws["A10"] = "Total"
    ws["D10"] = "=SUM(D5:D9)"
    ws["E10"] = "=SUM(E5:E9)"


def m4_t3_sol(wb, ws):
    ws["A1"].font = Font(bold=True, size=16)
    for c in "ABCDE":
        ws[c + "4"].font = NEGRITA
        ws[c + "4"].fill = ENC
        ws[c + "4"].alignment = Alignment(horizontal="center")
    formato(ws, "C5:D10", MONEDA)
    formato(ws, "E5:E10", "0.0%")
    bordes(ws, "A4:E10")
    for c in "ABCDE":
        ws[c + "10"].font = NEGRITA


T4_3 = A("T3", "Una cotización lista para enviar", "T3", apoyo="autonoma", minutos=12, construir=m4_t3, sol_extra=m4_t3_sol,
         contexto="Los cálculos de la cotización ya están; falta que se vea profesional.",
         instrucciones=["Título A1 destacado (negrita, 14 pt o más).", "Encabezados A4:E4 en negrita, con relleno y centrados.", "Precios e importes (C5:D10) en moneda; % del total (E5:E10) en porcentaje.", "Bordes en A4:E10 y la fila de total (A10:E10) en negrita."],
         pruebas=[{"t": "estilo", "r": "A1", "prop": "negrita", "tamMin": 14, "titulo": "Título destacado"}, {"t": "estilo", "r": "A4:E4", "prop": ["negrita", "relleno", "centrado"], "titulo": "Encabezados con formato y centrados"},
                  {"t": "fmt", "r": "C5:D10", "tipo": "moneda", "titulo": "Moneda en precios e importes"}, {"t": "fmt", "r": "E5:E10", "tipo": "porcentaje", "titulo": "Porcentaje en la participación"},
                  {"t": "estilo", "r": "A4:E10", "prop": "bordes", "titulo": "Bordes en la tabla"}, {"t": "estilo", "r": "A10:E10", "prop": "negrita", "titulo": "Total en negrita"}])

# =============================================================== Módulo 5


def m5_t1(wb, ws, sol):
    encabezado(ws, "Índice del libro", "Un vínculo por hoja para moverse con un clic.")
    tabla(ws, 4, ["Hoja", "Ir"], [["T2 · Aviso de promoción", "Ir a T2"], ["T3 · Encabezado del catálogo", "Ir a T3"], ["Instrucciones", "Ir a Instrucciones"]], anchos={"A": 30, "B": 22})
    vinculo_interno(ws, "B5", "T2")
    ws["B5"].font = Font(color="0563C1", underline="single")
    pintar(ws, "B5", MODELO)
    nota(ws, "B5", "Modelo: Insertar › Vínculo › Lugar de este documento › T2.")
    pintar(ws, "B6:B7", ENTRADA)


def m5_t1_sol(wb, ws):
    vinculo_interno(ws, "B6", "T3")
    vinculo_interno(ws, "B7", "Instrucciones")


T5_1 = A("T1", "Índice con hipervínculos", "T1", apoyo="modelo", minutos=6, construir=m5_t1, sol_extra=m5_t1_sol,
         contexto="El libro tiene varias hojas; el índice ya tiene el vínculo a T2 como modelo.",
         modelo="B5 lleva a la hoja T2: Insertar › Vínculo › <b>Lugar de este documento</b> › T2.",
         instrucciones=["En B6 agrega un vínculo a la hoja T3.", "En B7 agrega un vínculo a la hoja Instrucciones."],
         pruebas=[{"t": "hipervinculo", "r": "B6", "destino": "T3", "titulo": "Vínculo a T3 en B6"}, {"t": "hipervinculo", "r": "B7", "destino": "Instrucciones", "titulo": "Vínculo a Instrucciones en B7"}])


def m5_t2(wb, ws, sol):
    encabezado(ws, "Aviso de promoción para la vitrina", "Promoción de noviembre en las tres sucursales.")
    etiquetas(ws, [("A5", "Promoción"), ("A6", "Detalles en línea")])
    ws["B5"] = "2x1 en lattes de 4 a 6 pm"
    ws["B6"] = "lataza.mx/promos"
    anchos(ws, A=20, B=30)
    pintar(ws, "B6", ENTRADA)


def m5_t2_sol(wb, ws):
    ws["B6"].hyperlink = "https://lataza.mx/promos"


T5_2 = A("T2", "Forma con texto y vínculo web", "T2", apoyo="completar", minutos=8, construir=m5_t2, sol_extra=m5_t2_sol,
         contexto="El texto de la promoción ya está en B5; falta hacerlo visible y enlazar los detalles.",
         instrucciones=["Inserta una forma (rectángulo redondeado o una llamada) que diga <b>2x1 en lattes</b>.", "Convierte B6 en un vínculo a <b>https://lataza.mx/promos</b>."],
         pruebas=[{"t": "forma", "texto": "2x1", "titulo": "Forma con «2x1 en lattes»"}, {"t": "hipervinculo", "r": "B6", "destino": "lataza\\.mx", "titulo": "Vínculo web en B6"}])


def m5_t3(wb, ws, sol):
    encabezado(ws, "Catálogo de postres", "El encabezado debe llevar el logo, la vigencia y un correo para pedidos.", fila=5)
    tabla(ws, 8, ["Producto", "Precio"], [[p["nombre"], p["precio"]] for p in PROD if p["categoria"] == "Postres"], formatos={1: MONEDA}, anchos={"A": 24, "B": 12})
    etiquetas(ws, [("D8", "Pedidos por correo")])
    ws["E8"] = "pedidos@lataza.mx"
    anchos(ws, D=20, E=24)


def m5_t3_sol(wb, ws):
    if LOGO.exists():
        img = Image(str(LOGO))
        img.width, img.height = 120, 60
        ws.add_image(img, "A1")
    ws["E8"].hyperlink = "mailto:pedidos@lataza.mx"


T5_3 = A("T3", "Encabezado de un catálogo", "T3", apoyo="autonoma", minutos=10, construir=m5_t3, sol_extra=m5_t3_sol,
         contexto="Arma el encabezado del catálogo de postres en las filas 1 a 4 (están libres).",
         instrucciones=["Inserta el logo de La Taza (o cualquier imagen o icono) en las filas 1 a 4.", "Agrega un cuadro de texto que diga <b>Precios vigentes</b> (con la fecha que quieras).", "Convierte E8 en un vínculo de correo a pedidos@lataza.mx (mailto)."],
         pistas=["El logo se descarga desde la página del proyecto básico o con clic derecho sobre el logo de la plataforma.", "Insertar › Vínculo › Dirección de correo electrónico."],
         pruebas=[{"t": "imagen", "titulo": "Imagen o icono en el encabezado"}, {"t": "forma", "texto": "vigentes", "titulo": "Cuadro de texto «Precios vigentes»"}, {"t": "hipervinculo", "r": "E8", "destino": "mailto:", "titulo": "Vínculo de correo en E8"}])

# =============================================================== Módulo 6
EVENTOS = {"Bodas": [("Boda Ruiz-Peña", 120, 185), ("Boda Lara", 80, 190), ("Boda Méndez", 150, 175)], "Empresas": [("Notaría 14", 40, 120), ("Agencia Pixel", 25, 135), ("Coworking Nodo", 60, 110), ("Hospital San Rafael", 90, 105)]}


def hoja_inventario(wb, nombre, desfase):
    h = wb.create_sheet(nombre)
    h["A1"] = "Inventario · " + nombre
    h["A1"].font = Font(bold=True, size=13)
    tabla(h, 4, ["Insumo", "Existencia", "Costo", "Valor"], [[x["insumo"], x["existencia"] + desfase, x["costo"], None] for x in INV[:7]], formatos={2: MONEDA, 3: MONEDA}, anchos={"A": 26})
    for r in range(5, 12):
        h.cell(row=r, column=4, value=f"=B{r}*C{r}").number_format = MONEDA
    h["A12"] = "Total"
    h["D12"] = "=SUM(D5:D11)"
    h["D12"].number_format = MONEDA
    return h


def m6_t1(wb, ws, sol):
    hoja_inventario(wb, "Almacén", 10)
    hoja_inventario(wb, "Barra", -5)
    encabezado(ws, "Resumen del inventario", "Trae el valor total de cada hoja con referencias (no copies los números).")
    tabla(ws, 4, ["Ubicación", "Valor del inventario"], [["Almacén", None], ["Barra", None], ["Total", None]], formatos={1: MONEDA}, anchos={"A": 18, "B": 20})
    ws["B5"] = "=Almacén!D12"
    pintar(ws, "B5", MODELO)
    nota(ws, "B5", "Modelo: =Almacén!D12 (escribe = , haz clic en la pestaña Almacén y en D12, Enter).")
    pintar(ws, "B6:B7", ENTRADA)


T6_1 = A("T1", "Resumen con referencias a otras hojas", "T1", apoyo="modelo", minutos=8, construir=m6_t1,
         contexto="El inventario está en dos hojas (Almacén y Barra). El resumen ya trae el valor del Almacén.",
         modelo="B5 = <code>=Almacén!D12</code>: el nombre de la hoja, un signo de admiración y la celda.",
         instrucciones=["En B6 trae el total de la hoja Barra.", "En B7 suma B5 y B6."],
         sol={"B6": "=Barra!D12", "B7": "=SUM(B5:B6)"},
         pruebas=[{"t": "contiene", "r": "B6", "texto": "Barra!", "titulo": "B6 se refiere a la hoja Barra", "msg": "B6 debe traer el total con una referencia: =Barra!D12."},
                  {"t": "valores", "r": "B6:B7", "titulo": "Valores correctos"}, {"t": "robustez", "r": "B7", "cambios": {"Barra!B5": 99}, "titulo": "Se actualiza si cambia la Barra"}])


def m6_t2(wb, ws, sol):
    for i, (nombre, evs) in enumerate(EVENTOS.items(), 1):
        h = wb.create_sheet("Evento" + str(i))
        h["A1"] = "Eventos · " + nombre
        tabla(h, 3, ["Evento", "Personas", "Precio por persona", "Importe"], [list(e) + [None] for e in evs], formatos={2: MONEDA, 3: MONEDA}, anchos={"A": 24})
        n = len(evs)
        for r in range(4, 4 + n):
            h.cell(row=r, column=4, value=f"=B{r}*C{r}").number_format = MONEDA
        h.cell(row=10, column=1, value="Total")
        h.cell(row=10, column=4, value=f"=SUM(D4:D{3 + n})").number_format = MONEDA
    encabezado(ws, "Resumen de eventos", "Los tipos de evento están en las hojas Evento1 y Evento2.")
    tabla(ws, 4, ["Tipo", "Importe"], [["Bodas", None], ["Empresas", None], ["Total", None]], formatos={1: MONEDA}, anchos={"A": 16, "B": 16})
    ws["B5"] = "=Evento1!D10"
    pintar(ws, "B6:B7", ENTRADA)


def m6_t2_sol(wb, ws):
    for i, nombre in enumerate(EVENTOS, 1):
        wb["Evento" + str(i)].title = nombre
        wb[nombre].sheet_properties.tabColor = ["C0392B", "2463A6"][i - 1]
    ws["B5"] = "=Bodas!D10"
    ws["B6"] = "=Empresas!D10"
    ws["B7"] = "=SUM(B5:B6)"


T6_2 = A("T2", "Ordenar las hojas de un libro", "T2", apoyo="completar", minutos=8, construir=m6_t2, sol_extra=m6_t2_sol,
         contexto="Las hojas de eventos se llaman Evento1 y Evento2; el resumen ya trae las bodas.",
         instrucciones=["Cambia el nombre de <b>Evento1</b> a <b>Bodas</b> y de <b>Evento2</b> a <b>Empresas</b>, y dale color a ambas pestañas.", "En B6 trae el total de Empresas y en B7 suma los dos tipos."],
         pruebas=[{"t": "hoja", "h": "Bodas", "colorPestana": True, "titulo": "Hoja «Bodas» con color"}, {"t": "hoja", "h": "Empresas", "colorPestana": True, "titulo": "Hoja «Empresas» con color"},
                  {"t": "formula", "r": "B6:B7", "titulo": "Resumen con fórmulas"},
                  {"t": "valores", "r": "B5:B7", "v": [sum(p * q for _, p, q in EVENTOS["Bodas"]), sum(p * q for _, p, q in EVENTOS["Empresas"]), sum(p * q for evs in EVENTOS.values() for _, p, q in evs)], "titulo": "Importes del resumen correctos"}])

MESES3 = ["Oct", "Nov", "Dic"]
PRODS6 = PROD[:8]


def m6_t3(wb, ws, sol):
    for k, mm in enumerate(MESES3):
        h = wb.create_sheet(mm)
        h["A1"] = "Unidades vendidas · " + mm + " 2025"
        tabla(h, 4, ["Producto", "Unidades"], [[p["nombre"], 300 + 37 * i + 23 * k + (i * k) % 17] for i, p in enumerate(PRODS6)], anchos={"A": 20})
    encabezado(ws, "Unidades del trimestre por producto", "Suma la misma celda de las hojas Oct, Nov y Dic.")
    tabla(ws, 4, ["Producto", "Unidades del trimestre"], [[p["nombre"], None] for p in PRODS6], anchos={"A": 20, "B": 22})
    ws["A13"] = "Total"
    pintar(ws, "B5:B13", ENTRADA)


T6_3 = A("T3", "Consolidar tres meses", "T3", apoyo="autonoma", minutos=10, construir=m6_t3,
         contexto="Las hojas Oct, Nov y Dic tienen la misma estructura. Arma el consolidado del trimestre.",
         instrucciones=["B5:B12: unidades del trimestre de cada producto (suma de las tres hojas; puedes usar una referencia 3D).", "B13: total del trimestre.", "Inmoviliza las filas 1 a 4 de la hoja T3."],
         pistas=["Referencia 3D: <code>=SUMA(Oct:Dic!B5)</code>. También vale <code>=Oct!B5+Nov!B5+Dic!B5</code>."],
         sol={"B5:B12": "=Oct!B5+Nov!B5+Dic!B5", "B13": "=SUM(B5:B12)"},
         sol_extra=lambda wb, ws: setattr(ws, "freeze_panes", "A5"),
         pruebas=[{"t": "formula", "r": "B5:B13", "titulo": "Consolidado con fórmulas"}, {"t": "valores", "r": "B5:B13", "titulo": "Unidades del trimestre correctas"},
                  {"t": "inmovilizada", "filas": 4, "titulo": "Encabezados inmovilizados"}])

# =============================================================== Módulo 7
POSTRES = [p for p in PROD if p["categoria"] in ("Postres", "Panadería")]


def tot_producto(nombre):
    return sum(v["total"] for v in D["ventas"] if v["producto"] == nombre)


def m7_t1(wb, ws, sol):
    encabezado(ws, "Ventas 2025 de panadería y postres", "Responde con un gráfico: ¿qué producto vende más?")
    tabla(ws, 4, ["Producto", "Ventas"], [[p["nombre"], tot_producto(p["nombre"])] for p in POSTRES], formatos={1: MONEDA0}, anchos={"A": 24, "B": 12})


def m7_t1_sol(wb, ws):
    ch = BarChart()
    ch.type = "bar"
    ch.title = "Ventas 2025 de panadería y postres"
    ch.add_data(Reference(ws, min_col=2, min_row=4, max_row=4 + len(POSTRES)), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=5, max_row=4 + len(POSTRES)))
    ws.add_chart(ch, "D4")


T7_1 = A("T1", "Un gráfico que compara productos", "T1", apoyo="modelo", minutos=8, construir=m7_t1, sol_extra=m7_t1_sol,
         contexto="Siete productos de panadería y postres con sus ventas del año.",
         modelo="Para comparar categorías sin orden en el tiempo se usan <b>barras</b> (nombres largos) o columnas. Selecciona A4:B11 › Insertar › Gráfico de barras › y escribe un título que diga qué muestra.",
         instrucciones=["Inserta un gráfico de barras o columnas con A4:B11 en la hoja T1.", "Ponle un título que diga qué muestra."],
         pruebas=[{"t": "grafico", "h": "T1", "tipos": ["barras", "columnas"], "conTitulo": True, "titulo": "Gráfico de barras o columnas con título"}])


def m7_t2(wb, ws, sol):
    encabezado(ws, "Ventas mensuales de Centro y Norte", "El gráfico de líneas solo tiene Centro.")
    filas = []
    for m in range(1, 13):
        c = sum(v["total"] for v in D["ventas"] if v["sucursal"] == "Centro" and int(v["fecha"][5:7]) == m)
        n = sum(v["total"] for v in D["ventas"] if v["sucursal"] == "Norte" and int(v["fecha"][5:7]) == m)
        filas.append([D["mesesCortos"][m - 1], c, n])
    tabla(ws, 4, ["Mes", "Centro", "Norte"], filas, formatos={1: MONEDA0, 2: MONEDA0}, anchos={"A": 8, "B": 12, "C": 12})
    ch = LineChart()
    ch.add_data(Reference(ws, min_col=2, min_row=4, max_row=16), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=5, max_row=16))
    ch.height, ch.width = 7, 14
    if sol:
        ch.add_data(Reference(ws, min_col=3, min_row=4, max_row=16), titles_from_data=True)
        ch.title = "Ventas mensuales 2025: Centro y Norte"
    ws.add_chart(ch, "E4")


T7_2 = A("T2", "Completar un gráfico de tendencia", "T2", apoyo="completar", minutos=8, construir=m7_t2,
         contexto="El gráfico de líneas ya muestra Centro; falta Norte y el título.",
         instrucciones=["Agrega la serie <b>Norte</b> (C4:C16) al gráfico (Diseño de gráfico › Seleccionar datos, o arrastra el contorno del rango).", "Escribe un título que diga qué compara."],
         pruebas=[{"t": "grafico", "h": "T2", "tipos": ["lineas"], "series": 2, "conTitulo": True, "titulo": "Gráfico de líneas con dos series y título"}])

PAGOS = ["Efectivo", "Tarjeta", "Transferencia", "Vales"]


def m7_t3(wb, ws, sol):
    encabezado(ws, "Ventas por forma de pago · 2025", "¿Qué parte del total se paga con cada forma de pago?")
    tot = {p: sum(v["total"] for v in D["ventas"] if v["pago"] == p) for p in sorted({v["pago"] for v in D["ventas"]})}
    tabla(ws, 4, ["Forma de pago", "Ventas"], [[k, v] for k, v in tot.items()], formatos={1: MONEDA0}, anchos={"A": 18, "B": 12})


def m7_t3_sol(wb, ws):
    n = sum(1 for r in range(5, 12) if ws.cell(row=r, column=1).value)
    ch = PieChart()
    ch.title = "Participación de cada forma de pago en 2025"
    ch.add_data(Reference(ws, min_col=2, min_row=4, max_row=4 + n), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=5, max_row=4 + n))
    ws.add_chart(ch, "D4")


T7_3 = A("T3", "Partes de un total", "T3", apoyo="autonoma", minutos=8, construir=m7_t3, sol_extra=m7_t3_sol,
         contexto="Las formas de pago suman el 100 % de las ventas del año.",
         instrucciones=["Elige y crea en la hoja T3 el gráfico que mejor muestra qué parte del total aporta cada forma de pago.", "Ponle un título que responda la pregunta."],
         pistas=["Pocas partes de un total: circular (o anillo)."],
         pruebas=[{"t": "grafico", "h": "T3", "tipos": ["circular", "anillo"], "conTitulo": True, "titulo": "Gráfico circular o de anillo con título"}])

# =============================================================== Módulo 8


def lista_precios(ws, fila=4):
    tabla(ws, fila, ["Código", "Producto", "Categoría", "Precio", "Costo"], [[p["codigo"], p["nombre"], p["categoria"], p["precio"], p["costo"]] for p in PROD], formatos={3: MONEDA, 4: MONEDA}, anchos={"A": 10, "B": 24, "C": 15, "D": 10, "E": 10})


def m8_t1(wb, ws, sol):
    encabezado(ws, "Lista de precios 2026", "Notas internas abajo: no deben imprimirse.")
    lista_precios(ws)
    ws.page_setup.orientation = "landscape"
    ws["A27"] = "Notas internas: revisar costos de Alimentos con el proveedor en enero."
    ws["A27"].font = Font(italic=True, color="C00000")


def m8_t1_sol(wb, ws):
    ws.print_area = "A1:E24"
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0


T8_1 = A("T1", "Área de impresión y ajuste al ancho", "T1", apoyo="modelo", minutos=6, construir=m8_t1, sol_extra=m8_t1_sol,
         contexto="La lista de precios ya está en orientación horizontal (modelo). Las notas internas de la fila 27 no deben salir.",
         modelo="Disposición de página › Orientación › Horizontal ya está aplicada: revísala en Archivo › Imprimir.",
         instrucciones=["Establece el área de impresión A1:E24.", "Ajusta la hoja a 1 página de ancho (Alto: automático)."],
         pruebas=[{"t": "impresion", "area": True, "areaRef": "A1:E24", "titulo": "Área de impresión sin las notas"}, {"t": "impresion", "ajustarAncho": True, "titulo": "Una página de ancho"}])


def m8_t2(wb, ws, sol):
    ws["A1"] = "Directorio de clientes del programa de lealtad"
    ws["A1"].font = Font(bold=True, size=13)
    cl = D["clientes"]
    tabla(ws, 3, ["ID", "Nombre", "Teléfono", "Correo", "Sucursal", "Puntos"], [[c["id"], c["nombre"], c["telefono"], c["correo"], c["sucursal"], c["puntos"]] for c in (cl * 4)[:110]], anchos={"A": 8, "B": 22, "C": 13, "D": 30, "E": 10, "F": 8})
    ws.page_setup.orientation = "landscape"
    ws.print_area = "A1:F113"


def m8_t2_sol(wb, ws):
    ws.print_title_rows = "3:3"
    ws.oddFooter.center.text = "Página &P de &N"


T8_2 = A("T2", "Títulos en cada página y número de página", "T2", apoyo="completar", minutos=6, construir=m8_t2, sol_extra=m8_t2_sol,
         contexto="El directorio ocupa varias páginas; el área de impresión y la orientación ya están listas.",
         instrucciones=["Repite la fila 3 (encabezados) en cada página: Disposición de página › Imprimir títulos.", "Agrega un pie de página con «Página X de Y»."],
         pruebas=[{"t": "impresion", "titulos": True, "titulo": "Encabezados repetidos en cada página"}, {"t": "impresion", "numeroPagina": True, "titulo": "Número de página en el pie"}])


def m8_t3(wb, ws, sol):
    ws["A1"] = "Inventario de insumos · corte de noviembre"
    ws["A1"].font = Font(bold=True, size=13)
    tabla(ws, 3, ["Insumo", "Unidad", "Existencia", "Mínimo", "Máximo", "Costo", "Proveedor"], [[x["insumo"], x["unidad"], x["existencia"], x["minimo"], x["maximo"], x["costo"], x["proveedor"]] for x in INV], formatos={5: MONEDA}, anchos={"A": 26, "B": 8, "C": 11, "D": 9, "E": 9, "F": 10, "G": 22})


def m8_t3_sol(wb, ws):
    ws.page_setup.orientation = "landscape"
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 1
    ws.print_options.horizontalCentered = True
    ws.oddHeader.center.text = "La Taza · Inventario"
    ws.oddFooter.right.text = "Página &P"


T8_3 = A("T3", "Un reporte de una página, listo en PDF", "T3", apoyo="autonoma", minutos=10, construir=m8_t3, sol_extra=m8_t3_sol,
         contexto="La gerente quiere el inventario impreso en una sola hoja horizontal y también en PDF.",
         instrucciones=["Hoja T3: orientación horizontal, en una página, centrada horizontalmente.", "Encabezado con el texto «La Taza · Inventario» y pie con el número de página.", "Exporta solo la hoja T3 a PDF y súbelo junto con el libro."],
         pruebas=[{"t": "impresion", "orientacion": "landscape", "unaPagina": True, "titulo": "Horizontal y en una página"}, {"t": "impresion", "centrado": True, "titulo": "Centrada horizontalmente"},
                  {"t": "impresion", "encabezado": True, "numeroPagina": True, "titulo": "Encabezado y número de página"}, {"t": "pdf", "max": 1, "titulo": "PDF de una página"}])

MODULOS = [
    {"id": 1, "slug": "pantalla", "titulo": "Inicio: la pantalla de Excel", "tareas": [T1_1, T1_2, T1_3]},
    {"id": 2, "slug": "editar", "titulo": "Editar un libro de trabajo", "tareas": [T2_1, T2_2, T2_3]},
    {"id": 3, "slug": "formulas", "titulo": "Fórmulas básicas", "tareas": [T3_1, T3_2, T3_3]},
    {"id": 4, "slug": "formato", "titulo": "Formato a hojas de trabajo", "tareas": [T4_1, T4_2, T4_3]},
    {"id": 5, "slug": "objetos", "titulo": "Insertar objetos", "tareas": [T5_1, T5_2, T5_3],
     "formas_sol": {"T2": [{"texto": "2x1 en lattes", "col": 3, "fila": 3, "cols": 3, "filas": 4, "geom": "wedgeRoundRectCallout"}], "T3": [{"texto": "Precios vigentes: noviembre 2025", "col": 3, "fila": 1, "cols": 3, "filas": 2, "caja": True, "tam": 1100}]}},
    {"id": 6, "slug": "hojas", "titulo": "Hojas y referencias entre hojas", "tareas": [T6_1, T6_2, T6_3]},
    {"id": 7, "slug": "graficos", "titulo": "Gráficos", "tareas": [T7_1, T7_2, T7_3]},
    {"id": 8, "slug": "imprimir", "titulo": "Imprimir y distribuir", "tareas": [T8_1, T8_2, T8_3], "acepta": ".xlsx,.pdf", "multiple": True},
]
