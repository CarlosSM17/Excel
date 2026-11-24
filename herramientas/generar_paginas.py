"""Genera las páginas HTML del sitio (versión 3: 25 módulos en 6 sesiones de 3 horas).
Todas las páginas comparten la misma lista de scripts.

Uso:  python herramientas/generar_paginas.py
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent

MODULOS = [
    "Inicio: la pantalla de Excel", "Editar un libro de trabajo", "Fórmulas básicas", "Formato a hojas de trabajo",
    "Insertar objetos", "Hojas y referencias entre hojas", "Gráficos", "Imprimir y distribuir",
    "Referencias, nombres y decisiones con SI", "Resumir con condiciones", "Funciones de texto y de fecha", "Organizar datos",
    "Tablas", "Formato intermedio", "Validación de datos", "Colaborar y proteger",
    "Tablas dinámicas", "Gráficos dinámicos y tableros", "Búsqueda y matrices dinámicas", "Errores de fórmula y auditoría",
    "Formato avanzado", "Análisis de hipótesis", "Obtener y transformar datos (Power Query)", "Macros y automatización",
    "Bases de datos y combinar correspondencia",
]

SCRIPTS = [
    "vendor/hyperformula.full.min.js", "vendor/hyperformula-esES.js", "vendor/jszip.min.js",
    "js/nucleo.js", "js/formato.js", "js/funciones.js", "js/iconos.js", "js/curso.js", "js/datos.js",
    "js/hoja.js", "js/hoja-herramientas.js", "js/verificador.js", "js/xlsx.js", "js/galeria.js",
    "js/cinta.js", "js/graficos.js", "js/dinamica.js", "js/widgets.js", "js/widgets2.js", "js/widgets3.js", "js/pagina.js", "js/modulo.js",
    "js/revision.js", "js/actividades.js",
    "js/modulos/comun.js",
]

PLANTILLA = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{descripcion}">
{robots}<link rel="icon" href="{raiz}/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{raiz}/assets/css/estilos.css">
</head>
<body data-raiz="{raiz}"{extra_body}>
<div id="app"><noscript><p style="padding:20px">Esta plataforma necesita JavaScript activado.</p></noscript></div>
{scripts}
<script>{arranque}</script>
</body>
</html>
"""


def scripts(raiz, extra=(), locales=()):
    lista = [f'<script src="{raiz}/assets/{s}"></script>' for s in list(SCRIPTS) + list(extra)]
    lista += [f'<script src="{s}"></script>' for s in locales]
    return "\n".join(lista)


def escribir(ruta, robots="", **kw):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(PLANTILLA.format(robots=robots, **kw), encoding="utf-8")


def main():
    n = len(MODULOS)
    for i, titulo in enumerate(MODULOS, 1):
        slug = f"m{i:02d}"
        escribir(RAIZ / "modulos" / f"{slug}.html", raiz="..", extra_body=f' data-modulo="{i}"',
                 titulo=f"Módulo {i} · {titulo} · Excel con La Taza",
                 descripcion=f"Módulo {i} del curso Excel con La Taza: {titulo}. Retos interactivos, laboratorio en Excel real y tareas de aprendizaje.",
                 scripts=scripts("..", [f"js/modulos/{slug}.js"]), arranque=f"LT.paginaModulo({i});")
    todos = ["js/paginas.js"] + [f"js/modulos/m{i:02d}.js" for i in range(1, n + 1)]
    paginas = {
        "index.html": ("Excel con La Taza · Curso de Excel en 6 sesiones", "Curso de Excel de básico a avanzado en 6 sesiones de 3 horas con retos interactivos, tareas de aprendizaje, proyectos completos y el caso de la Cafetería La Taza.", "LT.paginas.inicio();", []),
        "proyecto.html": ("Proyectos · Excel con La Taza", "Proyectos completos por nivel y proyecto final del curso Excel con La Taza.", "LT.paginas.proyecto();", []),
        "ubicacion.html": ("Prueba de ubicación · Excel con La Taza", "Prueba de ubicación por nivel del curso Excel con La Taza.", "LT.paginas.ubicacion();", []),
        "integrador.html": ("Proyectos · Excel con La Taza", "Los retos integradores de la versión 2 ahora son proyectos completos.", "LT.paginas.integrador();", []),
        "glosario.html": ("Glosario de funciones · Excel con La Taza", "Glosario de funciones de Excel en español e inglés y atajos de teclado.", "LT.paginas.glosario();", []),
        "funciones.html": ("Guía gráfica de funciones · Excel con La Taza", "Guía gráfica de las funciones de Excel que se usan en el curso, con ejemplos calculados en vivo.", "LT.guiaFunciones.pagina();", ["js/guia-funciones.js"]),
    }
    for archivo, (titulo, desc, arranque, extra) in paginas.items():
        escribir(RAIZ / archivo, raiz=".", extra_body="", titulo=titulo, descripcion=desc,
                 scripts=scripts(".", todos + extra), arranque=arranque)
    escribir(RAIZ / "docente" / "index.html", raiz="..", extra_body=' class="pagina-docente"',
             robots='<meta name="robots" content="noindex, nofollow">\n',
             titulo="Área docente · Excel con La Taza", descripcion="Área docente protegida del curso Excel con La Taza.",
             scripts=scripts("..", todos + ["js/docente.js"], ["contenido.js"]), arranque="LT.docente.iniciar();")
    print("páginas generadas:", n + len(paginas) + 1)


if __name__ == "__main__":
    main()
