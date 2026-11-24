"""Utilidades compartidas para definir tareas de aprendizaje y proyectos (versión 3).

Cada tarea o fase define:
  · cómo se construye su hoja (datos de partida y, si es una tarea con modelo o para completar, la parte resuelta),
  · su solución: fórmulas en inglés, como se guardan en el archivo ({"T1!D4:D12": "=B4*C4"}); se copian ajustando
    las referencias relativas, igual que en Excel y que en el verificador del navegador (assets/js/revision.js),
  · sus pruebas declarativas (las mismas que entiende revision.js).

Con esa única definición se generan: el libro del participante, el libro resuelto (carpeta privada) y la parte de
assets/js/actividades.js que usa la plataforma para mostrar y revisar la tarea.
"""
import datetime as dt
import re

from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter, column_index_from_string

NEGRITA = Font(bold=True)
TITULO = Font(bold=True, size=14, color="5B3A29")
SUB = Font(italic=True, color="5D5148")
ENC = PatternFill("solid", fgColor="F3EBDF")
ENTRADA = PatternFill("solid", fgColor="FFF8D6")
MODELO = PatternFill("solid", fgColor="E2F1E8")
FINO = Side(style="thin", color="999999")
BORDE = Border(left=FINO, right=FINO, top=FINO, bottom=FINO)
MONEDA = "$#,##0.00"
MONEDA0 = "$#,##0"
FECHA = "dd/mm/yyyy"
APOYOS = {"modelo": "con modelo", "completar": "para completar", "autonoma": "autónoma"}


def serial(iso):
    y, m, d = map(int, iso.split("-"))
    return (dt.date(y, m, d) - dt.date(1899, 12, 30)).days


def iso_mas(iso, dias):
    return (dt.date.fromisoformat(iso) + dt.timedelta(days=dias)).isoformat()


# ------------------------------------------------------------ fórmulas
_RE_TOK = re.compile(r'"(?:[^"]|"")*"|\'(?:[^\']|\'\')*\'!|(?<![A-Za-z0-9_.])(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?![A-Za-z0-9_(])')


def desplazar(formula, dr, dc):
    """Ajusta las referencias relativas de una fórmula al copiarla dr filas y dc columnas."""
    if not dr and not dc:
        return formula

    def rep(m):
        if m.group(2) is None:
            return m.group(0)
        c_abs, col, r_abs, fila = m.group(1), m.group(2), m.group(3), int(m.group(4))
        ci = column_index_from_string(col)
        if not c_abs:
            ci += dc
        if not r_abs:
            fila += dr
        return f"{c_abs}{get_column_letter(ci)}{r_abs}{fila}"
    return _RE_TOK.sub(rep, formula)


def celdas(rango):
    """'B4:D6' -> [(fila, col), ...]"""
    m = re.match(r"^\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$", rango)
    c1, r1 = column_index_from_string(m.group(1)), int(m.group(2))
    c2, r2 = (column_index_from_string(m.group(3)), int(m.group(4))) if m.group(3) else (c1, r1)
    return [(r, c) for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)], (r1, c1)


def separar(clave, hoja_def):
    if "!" in clave:
        h, r = clave.rsplit("!", 1)
        return h.strip("'"), r
    return hoja_def, clave


_XLFN = {"XLOOKUP": "_xlfn.", "XMATCH": "_xlfn.", "MAXIFS": "_xlfn.", "MINIFS": "_xlfn.", "IFS": "_xlfn.", "IFNA": "_xlfn.", "CONCAT": "_xlfn.", "TEXTJOIN": "_xlfn.",
          "SWITCH": "_xlfn.", "UNIQUE": "_xlfn.", "SEQUENCE": "_xlfn.", "SORTBY": "_xlfn.", "LET": "_xlfn.", "SORT": "_xlfn._xlws.", "FILTER": "_xlfn._xlws.",
          "WORKDAY.INTL": "_xlfn.", "NETWORKDAYS.INTL": "_xlfn."}
_RE_XLFN = re.compile(r'"(?:[^"]|"")*"|(?<![\w.])(' + "|".join(sorted((re.escape(k) for k in _XLFN), key=len, reverse=True)) + r')\(')


def con_prefijos(formula):
    """Agrega los prefijos _xlfn. que Excel espera en el archivo para las funciones nuevas."""
    return _RE_XLFN.sub(lambda m: m.group(0) if not m.group(1) else _XLFN[m.group(1)] + m.group(1) + "(", formula)


def aplicar_solucion(wb, sol, hoja_def, formatos=None):
    """Escribe en el libro las celdas de la solución (expande rangos ajustando referencias)."""
    for clave, valor in (sol or {}).items():
        for parte in clave.split(","):
            h, rango = separar(parte.strip(), hoja_def)
            ws = wb[h]
            lista, (r0, c0) = celdas(rango.replace("$", ""))
            for r, c in lista:
                if isinstance(valor, str) and valor.startswith("="):
                    v = con_prefijos(desplazar(valor, r - r0, c - c0))
                elif isinstance(valor, list):
                    fila = valor[r - r0] if isinstance(valor[0], list) else valor
                    v = fila[c - c0] if isinstance(valor[0], list) else valor[(r - r0) + (c - c0)]
                else:
                    v = valor
                ws.cell(row=r, column=c, value=v)


# ------------------------------------------------------------ escritura de hojas
def encabezado(ws, titulo, contexto, fila=1):
    ws.cell(row=fila, column=1, value=titulo).font = TITULO
    ws.cell(row=fila + 1, column=1, value=contexto).font = SUB


def tabla(ws, fila, cols, filas, col=1, formatos=None, anchos=None, entrada=None):
    """Escribe encabezados en `fila` y los datos debajo. formatos: {índice o letra: código}."""
    for j, t in enumerate(cols):
        c = ws.cell(row=fila, column=col + j, value=t)
        c.font = NEGRITA
        c.fill = ENC
    for i, f in enumerate(filas, 1):
        for j, v in enumerate(f):
            if v is None:
                continue
            c = ws.cell(row=fila + i, column=col + j)
            if isinstance(v, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                c.value = serial(v)
                c.number_format = FECHA
            else:
                c.value = v
    for k, fmt in (formatos or {}).items():
        cc = column_index_from_string(k) if isinstance(k, str) else col + k
        for i in range(1, len(filas) + 1):
            ws.cell(row=fila + i, column=cc).number_format = fmt
    if anchos:
        for k, w in anchos.items():
            ws.column_dimensions[k].width = w
    if entrada:
        pintar(ws, entrada, ENTRADA)


def pintar(ws, rango, relleno):
    for parte in rango.split(","):
        lista, _ = celdas(parte.strip())
        for r, c in lista:
            ws.cell(row=r, column=c).fill = relleno


def formato(ws, rango, fmt):
    for parte in rango.split(","):
        lista, _ = celdas(parte.strip())
        for r, c in lista:
            ws.cell(row=r, column=c).number_format = fmt


def nota(ws, celda, texto):
    ws[celda].comment = Comment(texto, "La Taza")


def anchos(ws, **kw):
    for k, v in kw.items():
        ws.column_dimensions[k].width = v


def etiquetas(ws, pares, negrita=True):
    """pares: [("E2", "Texto"), ...]"""
    for celda, txt in pares:
        ws[celda] = txt
        if negrita:
            ws[celda].font = NEGRITA


# ------------------------------------------------------------ definiciones
class Actividad:
    """Una tarea de aprendizaje o una fase de proyecto."""

    def __init__(self, id, titulo, hoja, contexto="", instrucciones=(), apoyo=None, modelo=None, pistas=(), minutos=None,
                 construir=None, sol=None, sol_extra=None, pruebas=(), sol_nombres=None, modulos=None, descripcion=None, pasos=None):
        self.id, self.titulo, self.hoja = id, titulo, hoja
        self.contexto, self.instrucciones, self.apoyo = contexto, list(instrucciones), apoyo
        self.modelo, self.pistas, self.minutos = modelo, list(pistas), minutos
        self.construir, self.sol, self.sol_extra = construir, dict(sol or {}), sol_extra
        self.sol_nombres = sol_nombres
        self.modulos, self.descripcion, self.pasos = modulos, descripcion, pasos
        self.pruebas = [self._prefijar(p) for p in pruebas]

    def _prefijar(self, p):
        p = dict(p)
        for k in ("r",):
            if k in p and "!" not in p[k]:
                p[k] = ",".join(self.hoja + "!" + x.strip() if "!" not in x else x.strip() for x in p[k].split(","))
        if p.get("t") in ("condicional", "validacion", "impresion", "inmovilizada", "imagen", "forma", "hipervinculo", "minigraficos",
                          "escenarios", "tablaDatos", "protegida", "orden", "registros", "filtro", "ancho", "hojaOculta", "combinadas", "vista") and "h" not in p:
            p["h"] = self.hoja
        if p.get("t") in ("condicional", "validacion", "hipervinculo", "combinadas") and "r" in p and "!" in p["r"]:
            p["r"] = p["r"].split("!", 1)[1]
        if "cambios" in p:
            def pref(d):
                return {(k if "!" in k else self.hoja + "!" + k): v for k, v in d.items()}
            p["cambios"] = [pref(x) for x in p["cambios"]] if isinstance(p["cambios"], list) else pref(p["cambios"])
        return p

    def sol_prefijada(self):
        return {(k if "!" in k else ",".join(self.hoja + "!" + x for x in k.split(","))): v for k, v in self.sol.items()}

    def json(self):
        d = {"id": self.id, "titulo": self.titulo, "hoja": self.hoja, "contexto": self.contexto, "instrucciones": self.instrucciones,
             "sol": self.sol_prefijada(), "pruebas": self.pruebas}
        for k in ("apoyo", "modelo", "minutos", "modulos", "descripcion"):
            v = getattr(self, k)
            if v:
                d[k] = v
        if self.pistas:
            d["pistas"] = self.pistas
        if self.pasos:
            d["pasos"] = self.pasos
        if self.sol_nombres:
            d["solNombres"] = self.sol_nombres
        return d


def strip_html(html):
    t = re.sub(r"<[^>]+>", "", str(html))
    return t.replace("&gt;", ">").replace("&lt;", "<").replace("&amp;", "&").replace("&quot;", '"')


# ------------------------------------------------------------ formas (openpyxl no las escribe)
_NS_XDR = 'xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
_REL_DIBUJO = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"


def _xml_forma(i, f):
    """f: {texto, col, fila, cols=3, filas=3, geom='roundRect', caja=False, relleno='C0392B', color='FFFFFF', macro=None}"""
    from xml.sax.saxutils import escape
    c0, r0 = f["col"], f["fila"]
    c1, r1 = c0 + f.get("cols", 3), r0 + f.get("filas", 3)
    caja = f.get("caja", False)
    relleno = "" if caja else f'<a:solidFill><a:srgbClr val="{f.get("relleno", "C0392B")}"/></a:solidFill>'
    linea = '<a:ln w="9525"><a:solidFill><a:srgbClr val="999999"/></a:solidFill></a:ln>' if caja else ""
    color = f.get("color", "333333" if caja else "FFFFFF")
    macro = f' macro="{escape(f["macro"])}"' if f.get("macro") else ' macro=""'
    nombre = ("CuadroTexto " if caja else "Forma ") + str(i)
    return (f'<xdr:twoCellAnchor><xdr:from><xdr:col>{c0}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{r0}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>'
            f'<xdr:to><xdr:col>{c1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{r1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>'
            f'<xdr:sp{macro} textlink=""><xdr:nvSpPr><xdr:cNvPr id="{100 + i}" name="{nombre}"/><xdr:cNvSpPr{" txBox=\"1\"" if caja else ""}/></xdr:nvSpPr>'
            f'<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></a:xfrm><a:prstGeom prst="{f.get("geom", "rect" if caja else "roundRect")}"><a:avLst/></a:prstGeom>{relleno}{linea}</xdr:spPr>'
            f'<xdr:txBody><a:bodyPr vertOverflow="clip" rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="es-MX" sz="{f.get("tam", 1400)}" b="1">'
            f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:rPr><a:t>{escape(f["texto"])}</a:t></a:r></a:p></xdr:txBody></xdr:sp><xdr:clientData/></xdr:twoCellAnchor>')


def agregar_formas(ruta, formas):
    """Agrega formas o cuadros de texto a un libro ya guardado. formas: {nombre_hoja: [dict de _xml_forma]}"""
    import posixpath
    import shutil
    import tempfile
    import zipfile
    ruta = str(ruta)
    with zipfile.ZipFile(ruta) as z:
        archivos = {n: z.read(n) for n in z.namelist()}
    wbx = archivos["xl/workbook.xml"].decode()
    wbrels = archivos["xl/_rels/workbook.xml.rels"].decode()
    tipos = archivos["[Content_Types].xml"].decode()
    contador = 1000
    for hoja, lista in formas.items():
        m = re.search(r'<sheet [^>]*name="' + re.escape(hoja) + r'"[^>]*r:id="([^"]+)"', wbx) or re.search(r'<sheet [^>]*r:id="([^"]+)"[^>]*name="' + re.escape(hoja) + '"', wbx)
        rid = m.group(1)
        destino = re.search(r'<Relationship [^>]*Id="' + rid + r'"[^>]*Target="([^"]+)"', wbrels) or re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]*Id="' + rid + '"', wbrels)
        ruta_hoja = posixpath.normpath(posixpath.join("xl", destino.group(1).lstrip("/").replace("xl/", "", 1) if destino.group(1).startswith("/xl/") else destino.group(1)))
        ruta_rels = posixpath.join(posixpath.dirname(ruta_hoja), "_rels", posixpath.basename(ruta_hoja) + ".rels")
        rels = archivos.get(ruta_rels, b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>').decode()
        md = re.search(r'<Relationship [^>]*Type="' + re.escape(_REL_DIBUJO) + r'"[^>]*Target="([^"]+)"', rels) or re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]*Type="' + re.escape(_REL_DIBUJO) + '"', rels)
        anclas = "".join(_xml_forma(contador + i, f) for i, f in enumerate(lista))
        contador += len(lista)
        if md:
            rd = posixpath.normpath(posixpath.join(posixpath.dirname(ruta_hoja), md.group(1))) if not md.group(1).startswith("/") else md.group(1).lstrip("/")
            dx = archivos[rd].decode()
            pref = "xdr:" if "<xdr:wsDr" in dx else ""
            if pref:
                dx = dx.replace("</xdr:wsDr>", anclas + "</xdr:wsDr>")
            else:  # openpyxl escribe el dibujo sin prefijo: declaramos los prefijos en las anclas nuevas
                anclas_np = anclas.replace("<xdr:twoCellAnchor>", '<xdr:twoCellAnchor ' + _NS_XDR + '>')
                dx = re.sub(r"</(\w+:)?wsDr>\s*$", lambda mm: anclas_np + mm.group(0), dx)
            archivos[rd] = dx.encode()
        else:
            k = 1
            while f"xl/drawings/drawing{k}.xml" in archivos:
                k += 1
            rd = f"xl/drawings/drawing{k}.xml"
            archivos[rd] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr ' + _NS_XDR + '>' + anclas + '</xdr:wsDr>').encode()
            tipos = tipos.replace("</Types>", f'<Override PartName="/{rd}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>')
            nuevo = "rIdF" + str(k)
            rels = rels.replace("</Relationships>", f'<Relationship Id="{nuevo}" Type="{_REL_DIBUJO}" Target="../drawings/drawing{k}.xml"/></Relationships>')
            archivos[ruta_rels] = rels.encode()
            sx = archivos[ruta_hoja].decode()
            if 'xmlns:r=' not in sx[:600]:
                sx = sx.replace("<worksheet ", '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
            tag = f'<drawing r:id="{nuevo}"/>'
            for antes in ("<legacyDrawing", "<legacyDrawingHF", "<picture", "<oleObjects", "<controls", "<webPublishItems", "<tableParts", "<extLst", "</worksheet>"):
                if antes in sx:
                    sx = sx.replace(antes, tag + antes, 1)
                    break
            archivos[ruta_hoja] = sx.encode()
    archivos["[Content_Types].xml"] = tipos.encode()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx").name
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        orden = ["[Content_Types].xml"] + [n for n in archivos if n != "[Content_Types].xml"]
        for n in orden:
            z.writestr(n, archivos[n])
    shutil.move(tmp, ruta)


def parchar_xml(ruta, parches):
    """parches: [(regex del nombre de la parte, función str -> str)]. Reescribe el .xlsx con las partes modificadas."""
    import shutil
    import tempfile
    import zipfile
    with zipfile.ZipFile(str(ruta)) as z:
        partes = {n: z.read(n) for n in z.namelist()}
    for patron, f in parches:
        for n in partes:
            if re.fullmatch(patron, n):
                partes[n] = f(partes[n].decode("utf-8")).encode("utf-8")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx").name
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n in ["[Content_Types].xml"] + [x for x in partes if x != "[Content_Types].xml"]:
            z.writestr(n, partes[n])
    shutil.move(tmp, str(ruta))


def ruta_hoja(ruta, hoja):
    """Nombre de la parte xl/worksheets/sheetN.xml de una hoja."""
    import zipfile
    with zipfile.ZipFile(str(ruta)) as z:
        wbx = z.read("xl/workbook.xml").decode()
        rels = z.read("xl/_rels/workbook.xml.rels").decode()
    rid = re.search(r'<sheet [^>]*name="' + re.escape(hoja) + r'"[^>]*?r:id="([^"]+)"', wbx).group(1)
    t = re.search(r'<Relationship [^>]*Id="' + rid + r'"[^>]*Target="([^"]+)"', rels) or re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]*Id="' + rid + '"', rels)
    return "xl/" + t.group(1).lstrip("/").replace("xl/", "", 1)


def sin_cuadricula(ruta, hoja):
    parte = ruta_hoja(ruta, hoja)
    parchar_xml(ruta, [(re.escape(parte), lambda x: re.sub(r"<sheetView\b(?![^>]*showGridLines)", '<sheetView showGridLines="0"', x, count=1).replace('showGridLines="true"', 'showGridLines="0"').replace('showGridLines="1"', 'showGridLines="0"'))])


def porcentaje_dinamica(ruta, nombre):
    """LibreOffice no exporta «Mostrar valores como»: se agrega al XML de la tabla dinámica «nombre» (% del total general)
    y se pide a Excel actualizar las tablas al abrir el libro."""
    def tabla(x):
        if f'name="{nombre}"' not in x[:600]:
            return x
        return re.sub(r'(<dataField\b(?![^>]*showDataAs)[^>]*?)(/?>)', r'\1 showDataAs="percentOfTotal" baseField="0" baseItem="0"\2', x)
    parchar_xml(ruta, [(r"xl/pivotTables/pivotTable\d+\.xml", tabla),
                       (r"xl/pivotCache/pivotCacheDefinition\d+\.xml", lambda x: re.sub(r"<pivotCacheDefinition\b(?![^>]*refreshOnLoad)", '<pivotCacheDefinition refreshOnLoad="1"', x, count=1))])
