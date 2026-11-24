/* Módulo 4 · Formato a hojas de trabajo */
(function () {
  const { D, ENC, semana, serial } = LT.caso;
  const sem = semana('Centro');
  const datosReporte = [
    ['Reporte semanal de ventas · Sucursal Centro'],
    ['Del', String(serial('2025-10-13')), 'al', String(serial('2025-10-19'))],
    [],
    ['Producto', 'Precio', 'Unidades', 'Ventas', 'Participación'],
    ...sem.map((p, i) => [p.producto, p.precio, p.unidades, '=B' + (i + 5) + '*C' + (i + 5), '=D' + (i + 5) + '/$D$13']),
    ['Total', '', '=SUMA(C5:C12)', '=SUMA(D5:D12)', '=SUMA(E5:E12)'],
  ];
  const hojaReporte = () => ({ hojas: [{ nombre: 'Reporte', datos: datosReporte, anchos: { A: 110, B: 80, C: 80, D: 90, E: 100 }, filas: 16, cols: 7 }], herramientas: ['portapapeles', 'fuente', 'alineacion', 'numero', 'estilos'] });
  const esMoneda = (f) => /\$/.test(f || '');
  const pruebasBase = [
    { tipo: 'estilo', rango: 'A1', titulo: 'Título destacado', fn: (v, e) => (e.b && (e.fs || 13) >= 15) || e.estilo === 'Título' || e.estilo === 'Encabezado 1', mensaje: 'Destaca el título (A1): negrita y fuente más grande (botón A+), o el estilo de celda «Título».' },
    { tipo: 'estilo', rango: 'B2,D2', titulo: 'Fechas con formato de fecha', fn: (v, e) => LT.formato.esFecha(e.fmt), mensaje: '{celda} muestra un número de serie: dale formato de fecha (Formato de número › Fecha corta).' },
    { tipo: 'estilo', rango: 'A4:E4', titulo: 'Encabezados en negrita, con relleno y centrados', fn: (v, e) => e.b && !!e.bg && e.ha === 'center', mensaje: 'El encabezado {celda} debe ir en negrita, con color de relleno y centrado.' },
    { tipo: 'estilo', rango: 'B5:B12,D5:D13', titulo: 'Precios y ventas en moneda', fn: (v, e) => esMoneda(e.fmt), mensaje: '{celda} no tiene formato de moneda ($).' },
    { tipo: 'estilo', rango: 'E5:E13', titulo: 'Participación en porcentaje', fn: (v, e) => /%/.test(e.fmt || ''), mensaje: '{celda} debe mostrarse como porcentaje.' },
    { tipo: 'estilo', rango: 'A4:E13', titulo: 'Bordes en toda la tabla', fn: (v, e) => !!(e.bd && (e.bd.t || e.bd.b) && (e.bd.l || e.bd.r)) || e.estilo === 'Total', mensaje: '{celda} no tiene bordes: selecciona A4:E13 y aplica «Todos los bordes».' },
    { tipo: 'estilo', rango: 'A13:E13', titulo: 'Fila de total en negrita', fn: (v, e) => !!e.b || e.estilo === 'Total', mensaje: 'La fila de total ({celda}) debe ir en negrita.' },
  ];

  LT.definirModulo({
    id: 4,
    objetivo: 'Aplicar formatos de fuente, alineación, bordes y número (moneda, porcentaje, fecha).',
    situacion: 'El reporte semanal de Centro tiene los números bien, pero se ve muy simple y lo voy a presentar al consejo. Que se vea <b>profesional</b>: título destacado, encabezados claros, montos en pesos, porcentajes y fechas legibles.',
    explicacion: [
      { html: '<h3>El formato cambia cómo se ve, no lo que vale</h3><p>Si una celda guarda <b>1250.5</b>, con formato de moneda se ve <b>$1,250.50</b>, pero sigue valiendo 1250.5 para las fórmulas. Lo mismo con las fechas: Excel guarda las fechas como números (el 13/10/2025 es el número 45943) y el formato de fecha las hace legibles.</p><ul><li><b>Fuente:</b> negrita, cursiva, subrayado, tamaño y color.</li><li><b>Alineación:</b> izquierda, centro, derecha y ajustar texto.</li><li><b>Número:</b> moneda, porcentaje, fecha, decimales.</li><li><b>Bordes y relleno</b> para separar la tabla.</li><li><b>Copiar formato</b> (la brocha): copia el formato de una celda a otras.</li><li><b>Estilos de celda:</b> formatos listos como Título o Total.</li></ul>' },
      { widget: 'laboratorioFormatos', titulo: 'Mismo valor, distinto formato', instr: 'Elige un formato (o escribe uno) y mira cómo cambia lo que se ve, aunque el valor guardado sea el mismo.', opts: { codigo: '$#,##0.00', valores: [{ v: 1250.5, etiqueta: '1250.5' }, { v: 0.256, etiqueta: '0.256' }, { v: serial('2025-10-13'), etiqueta: serial('2025-10-13') + ' (una fecha)' }, { v: -320, etiqueta: '-320' }] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Dar formato de moneda a las ventas',
      pasos: [{ texto: 'Selecciona las celdas de ventas (D5:D13).' }, { texto: 'En Inicio › Número, elige <b>Moneda</b> o el botón <b>$</b> (formato de contabilidad).', ruta: ['Inicio', 'Formato de número de contabilidad'] }, { texto: 'Ajusta los decimales con Aumentar o Disminuir decimales.', ruta: ['Inicio', 'Disminuir decimales'] }, 'Si ves ##### es que la columna es angosta: ensánchala con doble clic en el borde del encabezado de columna.'],
      pregunta: { texto: 'Una celda muestra <b>$1,250.00</b> con formato de moneda. ¿Qué valor tiene guardado?', opciones: ['1250', 'El texto «$1,250.00»', '1250.00 con signo de pesos', 'Depende de la fuente'], correcta: 0, explicacion: 'Guarda el número <b>1250</b>; el signo, la coma y los decimales son solo formato. Por eso puede usarse en sumas.' },
    },
    micro: [
      {
        titulo: 'Encabezados', tipo: 'hoja', enunciado: 'Selecciona A1:D1 y ponlos en <b>negrita</b> con un <b>color de relleno</b>.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Producto', 'Precio', 'Unidades', 'Ventas'], ...sem.slice(0, 4).map((p) => [p.producto, p.precio, p.unidades, p.precio * p.unidades])], anchos: { A: 120 }, filas: 8, cols: 6 }], herramientas: ['fuente'] },
        pruebas: [{ tipo: 'estilo', rango: 'A1:D1', fn: (v, e) => e.b && !!e.bg, mensaje: '{celda} debe estar en negrita y con relleno.' }],
        pista: ['Selecciona A1:D1 arrastrando, pulsa N (negrita) y elige un color en el botón de relleno (cubeta).'],
      },
      {
        titulo: 'Moneda y porcentaje', tipo: 'hoja', enunciado: 'Da formato de <b>moneda</b> a B2:B6 y de <b>porcentaje</b> a C2:C6.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Sucursal', 'Ventas', 'Avance'], ['Centro', 97197, 1.023], ['Norte', 87535, 0.973], ['Sur', 78363, 0.98], ['Total', 263095, 0.993], ['Meta', 265000, 1]], estilos: { 'A1:C1': ENC }, filas: 9, cols: 5 }], herramientas: ['numero'] },
        pruebas: [{ tipo: 'estilo', rango: 'B2:B6', fn: (v, e) => esMoneda(e.fmt), mensaje: '{celda} no tiene formato de moneda.' }, { tipo: 'estilo', rango: 'C2:C6', fn: (v, e) => /%/.test(e.fmt || ''), mensaje: '{celda} no tiene formato de porcentaje.' }],
        pista: ['Usa los botones $ y % de la barra, o la lista «Formato…».'],
      },
      {
        titulo: 'Copiar formato', tipo: 'hoja', enunciado: 'A1 ya tiene formato. Usa <b>Copiar formato</b> (la brocha) para darle el mismo formato a A6.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Ventas de octubre'], ['Centro', 97197], ['Norte', 87535], ['Sur', 78363], [], ['Ventas de noviembre'], ['Centro', 99120], ['Norte', 90044], ['Sur', 80150]], estilos: { A1: { b: true, fs: 15, fg: '#5b3a29', bg: '#f3ebdf' } }, formatos: { 'B2:B4': '$#,##0', 'B7:B9': '$#,##0' }, anchos: { A: 170 }, filas: 11, cols: 4 }], herramientas: ['portapapeles'] },
        pruebas: [{ tipo: 'fn', fn: (x) => { const a = x.estilo('A1'), b = x.estilo('A6'); return a.b === b.b && a.fs === b.fs && a.bg === b.bg && a.fg === b.fg ? true : 'A6 todavía no tiene el formato de A1: selecciona A1, haz clic en la brocha y luego en A6.'; } }],
        pista: ['Selecciona A1, haz clic en el botón de la brocha (Copiar formato) y después haz clic en A6.'],
      },
    ],
    reto: {
      titulo: 'Reporte semanal presentable', tipo: 'hoja',
      intro: 'La hoja <i>Reporte</i> tiene los datos y fórmulas correctos, pero sin formato.',
      base: {
        hoja: hojaReporte(),
        pruebas: pruebasBase,
        instrucciones: ['Destaca el título de A1 (negrita y tamaño mayor).', 'Da formato de fecha a B2 y D2.', 'Encabezados A4:E4: negrita, color de relleno y centrados.', 'Precio y Ventas (B5:B12, D5:D13) en moneda.', 'Participación (E5:E13) en porcentaje.', 'Bordes en toda la tabla (A4:E13).', 'Fila de total (A13:E13) en negrita.'],
        pistas: ['Primero selecciona, después aplica el formato. Puedes seleccionar varias celdas arrastrando.', 'Los botones están en la barra: fuente (N, A+, relleno, bordes), alineación y número ($, %, Formato…).', 'Fechas: selecciona B2, elige Formato… › Fecha corta; repite en D2. Bordes: selecciona A4:E13 › Bordes › Todos los bordes.'],
      },
      niveles: {
        explorador: {
          instrucciones: ['A1: botón <b>N</b> y dos veces <b>A+</b>.', 'B2 y D2: lista <b>Formato…</b> › <b>Fecha corta</b>.', 'A4:E4: <b>N</b>, relleno (cubeta) y <b>Centrar</b>.', 'B5:B12 y D5:D13: botón <b>$</b>.', 'E5:E13: botón <b>%</b>.', 'A4:E13: <b>Bordes</b> › Todos los bordes.', 'A13:E13: <b>N</b>.'],
        },
        experto: {
          instrucciones: ['Aplica todos los formatos del nivel Analista (título, fechas, encabezados, moneda, porcentaje, bordes, total).', 'Usa <b>estilos de celda</b>: «Título» en A1 y «Total» en A13:E13.', 'Autoajusta el ancho de la columna A (doble clic en el borde derecho de su encabezado).'],
          pruebasExtra: [
            { tipo: 'estilo', rango: 'A1', prop: 'estilo', valor: 'Título', titulo: 'Estilo Título en A1', mensaje: 'Aplica el estilo de celda «Título» a A1 (Estilos de celda).' },
            { tipo: 'estilo', rango: 'A13:E13', prop: 'estilo', valor: 'Total', titulo: 'Estilo Total en la fila 13', mensaje: 'Aplica el estilo de celda «Total» a {celda}.' },
            { tipo: 'fn', titulo: 'Columna A autoajustada', fn: (x) => ((x.estado.hojas[0].anchos[0] || 90) >= 120 ? true : 'Autoajusta la columna A: doble clic en el borde derecho del encabezado A.') },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab04-reporte-semanal.xlsx', titulo: 'Reporte semanal de la sucursal Norte',
      contexto: 'El mismo reporte, con los datos de Norte, sin formato.',
      pasos: {
        explorador: [{ texto: 'Título A1: negrita y tamaño 16.', ruta: ['Inicio', 'Negrita'] }, { texto: 'B2 y D2: formato de fecha corta.', ruta: ['Inicio', 'Formato de número'] }, { texto: 'A4:E4: negrita, relleno y centrado.', ruta: ['Inicio', 'Color de relleno'] }, { texto: 'B5:B12 y D5:D13: moneda.', ruta: ['Inicio', 'Formato de número de contabilidad'] }, { texto: 'E5:E13: porcentaje.', ruta: ['Inicio', 'Estilo porcentual'] }, { texto: 'A4:E13: todos los bordes.', ruta: ['Inicio', 'Bordes'] }, 'A13:E13 en negrita. Guarda y sube el libro.'],
        analista: ['Da formato profesional al reporte: título destacado, fechas, encabezados (negrita, relleno, centrados), moneda, porcentaje, bordes y total en negrita.', 'Guarda y sube el libro.'],
        experto: ['Formatos del nivel Analista.', 'Estilos de celda «Título» (A1) y «Total» (fila 13).', 'Columna A con ancho suficiente para leer los productos.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Título destacado', fn: (L, A) => { A.hoja('Reporte'); const e = L.estilo('Reporte', 'A1'); return (e.negrita && (e.tamano || 11) >= 14) || e.estiloIntegrado === 15 ? true : 'El título A1 debe ir en negrita y con tamaño de 14 o más.'; } },
        { titulo: 'Fechas con formato de fecha', fn: (L, A) => { for (const d of ['B2', 'D2']) if (!A.formatoFecha(L.estilo('Reporte', d).numFmt)) return d + ' no tiene formato de fecha.'; return true; } },
        { titulo: 'Encabezados con negrita, relleno y centrados', fn: (L) => { for (const x of L.celdasRango('A4:E4')) { const e = L.estilo('Reporte', x.dir); if (!e.negrita || !e.relleno || e.alineacion.h !== 'center') return x.dir + ' debe estar en negrita, con relleno y centrado.'; } return true; } },
        { titulo: 'Moneda en precios y ventas', fn: (L, A) => { for (const x of L.celdasRango('B5:B12').concat(L.celdasRango('D5:D13'))) if (!A.formatoMoneda(L.estilo('Reporte', x.dir).numFmt)) return x.dir + ' no tiene formato de moneda.'; return true; } },
        { titulo: 'Porcentaje en participación', fn: (L, A) => { for (const x of L.celdasRango('E5:E13')) if (!A.formatoPorcentaje(L.estilo('Reporte', x.dir).numFmt)) return x.dir + ' no tiene formato de porcentaje.'; return true; } },
        { titulo: 'Bordes en la tabla', fn: (L) => { for (const x of L.celdasRango('A4:E13')) { const e = L.estilo('Reporte', x.dir); if (!e.tieneBordes && e.estiloIntegrado !== 25) return x.dir + ' no tiene bordes.'; } return true; } },
        { titulo: 'Total en negrita', fn: (L) => { for (const x of L.celdasRango('A13:D13')) { const e = L.estilo('Reporte', x.dir); if (!e.negrita && e.estiloIntegrado !== 25) return x.dir + ' debe ir en negrita.'; } return true; } },
        { titulo: 'Estilos Título y Total', nivel: 'experto', fn: (L) => (L.estilo('Reporte', 'A1').estiloIntegrado === 15 ? (L.estilo('Reporte', 'A13').estiloIntegrado === 25 ? true : 'Aplica el estilo «Total» a la fila 13.') : 'Aplica el estilo «Título» a A1.') },
        { titulo: 'Columna A con ancho suficiente', nivel: 'experto', fn: (L) => ((L.hoja('Reporte').anchos.A || 8.43) >= 16 ? true : 'Ensancha o autoajusta la columna A.') },
      ],
    },
    donde: [
      { comando: 'Formato de número de contabilidad (moneda)', ruta: ['Inicio', 'Formato de número de contabilidad'] },
      { comando: 'Estilo porcentual', ruta: ['Inicio', 'Estilo porcentual'] },
      { comando: 'Copiar formato', ruta: ['Inicio', 'Copiar formato'] },
      { comando: 'Estilos de celda', ruta: ['Inicio', 'Estilos de celda'] },
      { comando: 'Autoajustar ancho de columna', ruta: ['Inicio', 'Formato', 'Autoajustar ancho de columna'], nota: 'O doble clic en el borde derecho del encabezado de la columna.' },
    ],
    atajos: ['<kbd>Ctrl+1</kbd> Formato de celdas', '<kbd>Ctrl+N</kbd> negrita, <kbd>Ctrl+K</kbd> cursiva, <kbd>Ctrl+S</kbd> subrayado (Excel en español)', 'Doble clic en la brocha: copia el formato a varias zonas seguidas.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const { ENC } = LT.caso;
  const capas = `<figure class="figura-explica"><svg viewBox="0 0 560 170" role="img" aria-label="Valor, formato y lo que se ve">
  <g font-family="Segoe UI,Arial" font-size="13">
  <rect x="10" y="20" width="160" height="60" rx="8" fill="#fff8d6" stroke="#b7950b"/><text x="90" y="44" text-anchor="middle" font-weight="700">Valor guardado</text><text x="90" y="64" text-anchor="middle">0.1625</text>
  <text x="185" y="54" font-size="22">+</text>
  <rect x="205" y="20" width="160" height="60" rx="8" fill="#e7effc" stroke="#2259b8"/><text x="285" y="44" text-anchor="middle" font-weight="700">Formato</text><text x="285" y="64" text-anchor="middle">0.0%</text>
  <text x="380" y="54" font-size="22">=</text>
  <rect x="400" y="20" width="150" height="60" rx="8" fill="#e2f1e8" stroke="#1e7145"/><text x="475" y="44" text-anchor="middle" font-weight="700">Lo que se ve</text><text x="475" y="64" text-anchor="middle">16.3%</text>
  <text x="10" y="112">Mismo valor, otros formatos:  0.1625 → «$0.16» (moneda) · «0.16» (número) · «16%» (porcentaje sin decimales)</text>
  <text x="10" y="138">Las fórmulas siempre usan el valor guardado (0.1625), nunca el redondeo que ves.</text></g></svg>
  <figcaption>El formato es una capa de presentación: cambiarlo no altera los cálculos.</figcaption></figure>`;
  LT.ampliarModulo(4, {
    objetivos: [
      'Aplicar formato de fuente (tipo, tamaño, negrita, color) y relleno para jerarquizar un reporte.',
      'Alinear, ajustar texto, combinar y centrar, y aplicar bordes a una tabla de datos.',
      'Elegir el formato de número adecuado: moneda, contabilidad, porcentaje, fecha, miles y decimales.',
      'Copiar formato con la brocha y aplicar estilos de celda y temas.',
      'Ajustar el ancho de columnas y el alto de filas para que todo se lea.',
      'Explicar por qué el formato cambia lo que se ve, pero no el valor con el que se calcula.',
    ],
    detalle: [
      { titulo: 'Valor, formato y lo que se ve', abierto: true, html: capas },
      { titulo: 'Formatos de número más usados', html: '<table><tr><th>Formato</th><th>Código</th><th>1234.5 se ve</th><th>Úsalo para</th></tr><tr><td>General</td><td>General</td><td>1234.5</td><td>Datos sin unidad</td></tr><tr><td>Número</td><td>#,##0.00</td><td>1,234.50</td><td>Cantidades con decimales</td></tr><tr><td>Moneda</td><td>$#,##0.00</td><td>$1,234.50</td><td>Precios e importes</td></tr><tr><td>Contabilidad</td><td>_-$* #,##0.00_-</td><td>$ 1,234.50</td><td>Estados financieros (alinea el símbolo $)</td></tr><tr><td>Porcentaje</td><td>0%</td><td>123450%</td><td>Tasas (0.16 → 16 %)</td></tr><tr><td>Fecha corta</td><td>dd/mm/yyyy</td><td>18/05/1903</td><td>Fechas</td></tr><tr><td>Texto</td><td>@</td><td>1234.5</td><td>Códigos, teléfonos, folios</td></tr></table><p>El atajo <kbd>Ctrl</kbd>+<kbd>1</kbd> abre Formato de celdas con todas las opciones.</p>' },
      { titulo: 'Diseño de un reporte legible', html: '<ul><li><b>Jerarquía:</b> título grande (14–16 pt), encabezados en negrita con relleno suave, datos en fuente normal.</li><li><b>Alineación:</b> texto a la izquierda, números a la derecha, encabezados centrados sobre sus columnas.</li><li><b>Pocos colores:</b> uno para encabezados, uno para destacar (totales). El color debe significar algo.</li><li><b>Bordes finos</b> o bandas alternas; evita cuadrículas gruesas.</li><li><b>Combinar y centrar</b> solo en títulos; en los datos dificulta ordenar y filtrar (usa «Centrar en la selección»).</li></ul>' },
      { titulo: 'Estilos de celda y temas', html: '<p>Inicio › <b>Estilos de celda</b> aplica combinaciones guardadas (Título, Encabezado 1, Total, Bueno/Malo/Neutral, Moneda…). Disposición de página › <b>Temas</b> cambia a la vez colores y fuentes de todo el libro; si usas colores del tema (no colores «estándar»), el reporte entero cambia de imagen con un clic.</p>' },
    ],
    errores: [
      'Escribir «$» o «%» como texto en la celda en lugar de aplicar el formato.',
      'Redondear «a la vista» con el botón de disminuir decimales y creer que el valor cambió.',
      'Combinar celdas dentro de una tabla de datos: luego no se puede ordenar ni filtrar.',
      'Ver <code>#####</code> y pensar que es un error: solo falta ancho de columna.',
      'Usar demasiados colores y fuentes; el lector ya no sabe qué es importante.',
    ],
    consejos: [
      'Doble clic en el borde derecho del encabezado de columna para autoajustar el ancho.',
      'Usa la brocha con doble clic para copiar un formato a varios lugares; <kbd>Esc</kbd> para terminar.',
      'Define el formato antes de capturar códigos y teléfonos (Texto) para no perder ceros.',
      'Prueba el reporte en Vista previa de impresión (módulo 8) antes de dar por terminado el formato.',
    ],
    microExtra: [
      {
        titulo: 'Fechas largas y ajustar texto', tipo: 'hoja',
        enunciado: 'Da formato de <b>Fecha larga</b> a B2:B4 y activa <b>Ajustar texto</b> en C1 para que el encabezado se lea completo.',
        hoja: { hojas: [{ nombre: 'Entregas', datos: [['Cliente', 'Fecha de entrega', 'Indicaciones especiales para el repartidor'], ['Notaría 14', LT.fechas.texto(LT.fechas.aSerial(2025, 11, 3)), 'Tocar en recepción'], ['Agencia Pixel', LT.fechas.texto(LT.fechas.aSerial(2025, 11, 4)), 'Piso 3'], ['Hospital San Rafael', LT.fechas.texto(LT.fechas.aSerial(2025, 11, 5)), 'Acceso por urgencias']], estilos: { 'A1:C1': ENC }, anchos: { A: 150, B: 210, C: 140 }, filas: 7, cols: 4 }], herramientas: ['numero', 'alineacion'] },
        pruebas: [
          { tipo: 'estilo', rango: 'B2:B4', fn: (v, e) => /dddd|mmmm/.test(e.fmt || ''), mensaje: '{celda} debe tener formato de fecha larga (lista «Formato…» › Fecha larga).' },
          { tipo: 'estilo', rango: 'C1', fn: (v, e) => !!e.wrap, mensaje: 'Activa «Ajustar texto» en C1.' },
        ],
        pista: ['Selecciona B2:B4 y en la lista «Formato…» elige «Fecha larga».', 'Selecciona C1 y pulsa el botón Ajustar texto (grupo Alineación).'],
      },
    ],
    autoeval: [
      { p: 'Una celda muestra 16 % y otra 0.16. ¿Valen lo mismo?', r: 'Sí: 16 % es solo el formato de porcentaje aplicado a 0.16. Cualquier fórmula usa 0.16.' },
      { p: 'Ves <code>########</code> en una celda con una fecha. ¿Qué haces?', r: 'Ensanchar la columna (doble clic en el borde del encabezado). No es un error, el valor no cabe.' },
      { p: '¿Qué diferencia hay entre formato de Moneda y de Contabilidad?', r: 'Ambos muestran el símbolo; Contabilidad lo alinea a la izquierda de la celda, alinea los decimales y muestra los ceros como guion.' },
      { p: '¿Por qué conviene «Centrar en la selección» en lugar de «Combinar y centrar»?', r: 'Se ve igual, pero no combina celdas, así que no estorba al ordenar, filtrar, copiar o seleccionar columnas.' },
      { p: '¿Cómo copias el formato de A1 a A6, A12 y A20 sin repetir la operación tres veces?', r: 'Selecciona A1 y haz <b>doble clic</b> en la brocha (Copiar formato); haz clic en cada celda y pulsa <kbd>Esc</kbd> al terminar.' },
      { p: '¿Qué atajo abre Formato de celdas?', r: '<kbd>Ctrl</kbd>+<kbd>1</kbd>.' },
      { p: 'Aplicaste un tema nuevo y los colores de tu reporte no cambiaron. ¿Por qué?', r: 'Probablemente usaste colores «estándar» en lugar de colores del tema; solo los colores y fuentes del tema cambian con él.' },
      { p: 'Disminuyes decimales y 52.6 se ve como 53. ¿Qué valor usa SUMA?', r: '52.6. Para cambiar el valor de verdad se usa REDONDEAR (módulo 9).' },
    ],
    conexiones: [
      { id: 3, texto: 'das formato a los resultados de tus fórmulas sin cambiar su valor.' },
      { id: 8, texto: 'el formato se termina de revisar en la vista previa de impresión.' },
      { id: 14, texto: 'el formato condicional aplica estos formatos automáticamente según el valor.' },
      { id: 21, texto: 'crearás tus propios códigos de formato de número.' },
    ],
  });
})();
