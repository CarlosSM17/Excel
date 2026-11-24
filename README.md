# Excel con La Taza · versión 3

Curso de Excel de básico a avanzado en **6 sesiones de 3 horas (18 h)**, con retos interactivos, **75 tareas de aprendizaje verificables** y **4 proyectos completos**. Es un sitio web estático: no necesita servidor ni base de datos, y todo (el simulador, la revisión de archivos, el progreso y el área docente) corre en el navegador.

> Esta versión es una copia independiente de la versión 2 (13 módulos en 3 sesiones). Su progreso se guarda con otra clave (`laTaza.progreso.v3`), así que las dos versiones conviven en el mismo navegador.

## Qué cambió respecto a la versión 2

- **25 módulos en 6 sesiones**, dos por nivel. Cada sesión tiene arranque (5 min), receso (15 min) y cierre (5 min); las sesiones 2, 4 y 6 incluyen el taller del proyecto del nivel.

  | Sesión | Nivel | Módulos |
  |---|---|---|
  | 1 | Básico | 1 Pantalla · 2 Editar · 3 Fórmulas básicas · 4 Formato · 5 Objetos |
  | 2 | Básico | 6 Hojas y referencias entre hojas · 7 Gráficos · 8 Imprimir y distribuir · taller del proyecto Básico |
  | 3 | Intermedio | 9 Referencias, nombres y SI · 10 Resumir con condiciones · 11 Texto y fechas · 12 Organizar datos |
  | 4 | Intermedio | 13 Tablas · 14 Formato condicional · 15 Validación · 16 Colaborar y proteger · taller del proyecto Intermedio |
  | 5 | Avanzado | 17 Tablas dinámicas · 18 Gráficos dinámicos y tableros · 19 Búsqueda y matrices dinámicas · 20 Errores y auditoría |
  | 6 | Avanzado | 21 Formato avanzado · 22 Análisis de hipótesis · 23 Power Query · 24 Macros · 25 Bases de datos y combinar correspondencia · taller de los proyectos Avanzado y final |

- **Módulos nuevos o reescritos:** 8 (impresión y PDF), 10 (CONTAR.SI.CONJUNTO, SUMAR.SI.CONJUNTO, MAX.SI.CONJUNTO), 11 (texto, fechas y DIA.LAB), 15 (validación), 16 (colaborar y proteger), 18 (tableros con segmentaciones conectadas), 20 (errores y auditoría), 21 (formatos personalizados y reglas con fórmula), 22 (Buscar objetivo, escenarios, tablas de datos, Solver) y 23 (Power Query con editor simulado y laboratorio que lee las consultas del archivo).
- **Etapa 5 · Practicar (modelo 4C/ID):** cada módulo trae tres **tareas de aprendizaje** completas en contextos nuevos, con apoyo que se retira: **T1 con modelo** resuelto, **T2 para completar** y **T3 autónoma**. Un libro por módulo (`tareas/`) y un verificador que revisa cada tarea al subirlo y conserva la mejor revisión. El módulo queda en **dominio** con reto, laboratorio y las tres tareas.
- **Proyectos completos** (`proyecto.html?p=…`): uno por nivel y uno final, cada uno con situación, fases verificables, rúbrica y sello:
  - Básico · *Reporte mensual de la sucursal Sur* (libro + PDF).
  - Intermedio · *Control de pedidos corporativos* (limpieza, tabla, SI, resúmenes, alertas, validación, protección).
  - Avanzado · *Tablero anual automatizado* (Power Query, tablas y gráficos dinámicos, BUSCARX/FILTRAR, Buscar objetivo, macro).
  - Final · *Plan de apertura de la sucursal Poniente* (comparativo, proyección de 12 meses, equilibrio y escenarios, visualización, plantilla de personal e invitaciones combinadas en Word) con guion de presentación de 5 minutos.
- **Verificador declarativo** (`assets/js/revision.js`): lo esperado se calcula aplicando la solución de referencia a los datos del propio libro del participante (HyperFormula), así que no importa si ordenó o quitó filas; además revisa formatos, tablas, gráficos, validaciones, formato condicional, impresión, tablas dinámicas, segmentaciones, consultas de Power Query, macros y documentos de Word.
- **Guía gráfica de funciones:** 39 funciones (nuevas: SI.CONJUNTO, SUMAR.SI.CONJUNTO, CONTAR.SI.CONJUNTO, MAX.SI.CONJUNTO, IZQUIERDA, DIA.LAB, UNICOS y ORDENAR).
- **Pruebas de ubicación** de 12 reactivos por nivel.
- **Área docente** actualizada: plan minuto a minuto de las 6 sesiones (con los talleres de proyecto), guía teórica de 25 módulos y 4 proyectos, pestaña nueva «Tareas y proyectos» con las fórmulas de referencia y los criterios, libros de solución de laboratorios, tareas y proyectos, y consolidación de reportes con la ponderación de la versión 3.

## Área docente

- Entrada: enlace «Acceso docente» al pie de cualquier página, o directamente `docente/index.html`.
- **Contraseña inicial: `LaTaza-Docente-2026`** (cámbiala antes de publicar, ver abajo).
- El contenido (guía teórica, plan de sesiones y 57 libros de solución) viaja cifrado con AES-GCM de 256 bits; la llave se deriva de la contraseña con PBKDF2-SHA256 (600,000 iteraciones) y se descifra en el navegador con WebCrypto. La sesión se cierra al cerrar la pestaña.
- **Límite:** las soluciones de los retos del simulador y las fórmulas de referencia de las tareas forman parte del código público (el verificador las necesita). Quien lea el código fuente podría verlas; por eso la calificación pesa más los laboratorios, las tareas y los proyectos, que se entregan como archivo.

Ponderación sugerida (pestaña Reportes del grupo): retos en nivel Analista o Experto 20 %, laboratorios 25 %, tareas de aprendizaje 20 %, proyectos de nivel 20 % y proyecto final 15 %.

### Carpeta privada (no se publica)

Las fuentes del área docente viven en la carpeta hermana **`curso-excel-la-taza-v3-privado`**:

```
curso-excel-la-taza-v3-privado/
  docente/guia-teorica.html     guía teórica de referencia (editable)
  docente/plan-sesiones.json    guion minuto a minuto de las 6 sesiones (lo genera docente/generar_plan.py)
  docente/generar_plan.py       textos del plan por módulo y por sesión
  soluciones/laboratorios/      25 laboratorios resueltos y la carta de Word
  soluciones/tareas/            25 libros de tareas resueltos y la carta del módulo 25
  soluciones/proyectos/         4 proyectos resueltos y la invitación de Word
```

### Cambiar la contraseña o actualizar el contenido docente

```bash
pip install cryptography openpyxl
python herramientas/generar_libros.py          # laboratorios (solo si los cambiaste)
python herramientas/generar_actividades.py     # tareas de aprendizaje y proyectos
python herramientas/proteger_docente.py --clave "nueva-contraseña-larga"
```

`proteger_docente.py` vuelve a cifrar todo en `docente/contenido.js` y `docente/archivos/`. Si la carpeta privada está en otro lugar, indica su ruta con la variable de entorno `LT_PRIVADO`.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `curso-excel`). Con la cuenta gratuita, el repositorio debe ser público para usar Pages.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio, conservando las subcarpetas. **No subas la carpeta privada.** Con git:
   ```bash
   git init
   git add .
   git commit -m "Curso Excel con La Taza v3"
   git branch -M main
   git remote add origin https://github.com/USUARIO/curso-excel.git
   git push -u origin main
   ```
3. En el repositorio: *Settings › Pages › Build and deployment › Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`, *Save*.
4. En uno o dos minutos el sitio queda en `https://USUARIO.github.io/curso-excel/`.

El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Incrustar en Google Sites

1. Publica primero en GitHub Pages.
2. En Google Sites: *Insertar › Incorporar › Por URL* y pega la dirección de la página (la de inicio, la de un módulo como `.../modulos/m10.html`, la de un proyecto como `.../proyecto.html?p=final`, o la guía `.../funciones.html`).
3. Elige *Página completa* y ajusta la altura (1,400 px o más para las páginas de módulo). Una página de Google Sites por sesión funciona bien.

Dentro de un iframe algunos navegadores limitan el almacenamiento; por eso aparece el botón **«Pestaña nueva»** en la barra superior. El área docente conviene abrirla en su propia pestaña.

## Usar desde una carpeta compartida (sin internet)

Copia la carpeta del sitio y abre `index.html` con Chrome o Edge. Todo funciona sin conexión, incluida el área docente (las bibliotecas están en `assets/vendor/` y el contenido cifrado está en archivos .js).

## Estructura

```
index.html              inicio: ruta de 6 sesiones, niveles, módulos, proyectos, insignias
modulos/m01–m25.html    una página por módulo (5 etapas: Ver, Completar, Resolver, Transferir, Practicar)
proyecto.html           proyectos (?p=basico|intermedio|avanzado|final): fases, verificador, rúbrica y sello
funciones.html          guía gráfica de funciones
glosario.html           funciones español-inglés y atajos
ubicacion.html          prueba de ubicación (?nivel=basico|intermedio|avanzado, &momento=post)
integrador.html         redirige a proyecto.html (enlaces de la versión 2)
docente/index.html      área docente (contenido cifrado en docente/contenido.js y docente/archivos/)
assets/js/              plataforma: simulador, verificadores (revision.js), lector de .xlsx/.docx (xlsx.js),
                        widgets, guía de funciones, páginas y área docente
assets/js/actividades.js   tareas y proyectos (generado por herramientas/generar_actividades.py)
assets/js/modulos/      contenido de cada módulo (mXX.js) y utilidades del caso (comun.js)
assets/vendor/          HyperFormula 3.4.0 (+ idioma español) y JSZip 3.10.1
laboratorios/           25 libros de laboratorio, CSV para Power Query y la carta de Word
tareas/                 25 libros de tareas de aprendizaje, CSV y carta del módulo 25
proyectos/              4 libros de proyecto, CSV del proyecto Avanzado e invitación del proyecto final
datos/                  libro de datos del caso
herramientas/           scripts de Python: datos, libros, tareas y proyectos, páginas y cifrado
```

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
