

Curso de Excel de básico a avanzado en **6 sesiones de 3 horas (18 h)**, con retos interactivos, **75 tareas de aprendizaje verificables** y **4 proyectos completos**. Es un sitio web estático: no necesita servidor ni base de datos, y todo (el simulador, la revisión de archivos, el progreso y el área docente) corre en el navegador.


## Modificar el contenido

- **Textos, retos y pruebas de un módulo:** `assets/js/modulos/mXX.js` (formato explicado en Área docente › Notas técnicas).
- **Temario y agenda de las sesiones:** `assets/js/curso.js` (los minutos de cada sesión deben sumar 180).
- **Tareas de aprendizaje:** `herramientas/actividades_basico.py`, `actividades_intermedio.py` y `actividades_avanzado.py`; **proyectos:** `herramientas/proyectos_def.py`. Cada tarea o fase declara su hoja, el apoyo, las instrucciones, la solución (fórmulas en inglés) y las pruebas; el mismo archivo produce el libro del participante, el resuelto y el código del verificador.
- **Guía gráfica:** `assets/js/guia-funciones.js`.
- **Regenerar todo:**
  ```bash
  pip install openpyxl pillow cryptography
  python herramientas/generar_datos_js.py       # assets/js/datos.js
  python herramientas/generar_libros.py         # laboratorios, datos y sus soluciones (a la carpeta privada)
  python herramientas/generar_actividades.py    # tareas, proyectos, actividades.js y sus soluciones
  python herramientas/generar_paginas.py        # páginas HTML (si cambias títulos o scripts)
  python herramientas/proteger_docente.py --clave "…"   # vuelve a cifrar el área docente
  ```
  Si LibreOffice está instalado, `generar_actividades.py` lo usa en modo headless (`herramientas/dinamicas_lo.py`) para agregar tablas dinámicas reales a los libros de solución.

## Requisitos de los participantes

- Computadora con teclado y ratón y un navegador actual (Chrome, Edge, Firefox o Safari).
- Excel de Microsoft 365 para Windows o Mac (recomendado). Excel 2021 o 365 para matrices dinámicas (FILTRAR, UNICOS, ORDENAR) y MAX.SI.CONJUNTO. Excel para la web sirve en casi todos los laboratorios y tareas.
- Sesión 6 (módulos 23 a 25): Excel y Word de escritorio. Excel para la web y iPad no graban macros VBA, no importan carpetas con Power Query ni combinan correspondencia con un libro local. Los archivos descargados de internet llegan con las macros bloqueadas: clic derecho › Propiedades › Desbloquear.

## Licencias

- El simulador usa **HyperFormula** con su clave de licencia **GPLv3**; por eso el código del sitio se distribuye bajo **GPL-3.0** (archivo `LICENSE`).
- **JSZip** se distribuye bajo licencia MIT o GPLv3.
- La licencia de los contenidos didácticos queda a decisión de la institución (por ejemplo, CC BY-SA 4.0).

## Limitaciones conocidas

- El simulador reproduce lo esencial de Excel, no todo (no tiene celdas combinadas, PROMEDIO.SI.CONJUNTO, SIFECHA, LET ni INDIRECTO).
- Cuando el libro del participante usa referencias estructuradas de tabla (`[@Cantidad]`), el verificador revisa los valores guardados por Excel y omite la prueba de «cambiar un dato y recalcular».
- Los libros de solución se generan con openpyxl (y LibreOffice para las tablas dinámicas). No incluyen gráficos dinámicos, segmentaciones, escalas de tiempo, consultas de Power Query ni código VBA: esos libros traen una hoja «Solución» con los pasos.
- El progreso se guarda en el navegador (localStorage); el reporte descargable sirve como respaldo.
