/* Módulo 18 · Gráficos dinámicos y tableros */
(function () {
  const { D, filasDinamica, CAMPOS_DINAMICA, mes } = LT.caso;
  const DATOS = filasDinamica();
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mejorMes = (filtro) => { const m = new Array(12).fill(0); D.ventas.filter(filtro).forEach((v) => { m[mes(v.fecha) - 1] += v.total; }); return MESES[m.indexOf(Math.max(...m))]; };
  const mesNorte = mejorMes((v) => v.sucursal === 'Norte');
  const mesNorteFrio = mejorMes((v) => v.sucursal === 'Norte' && v.categoria === 'Café frío');

  /* Versión 3: tablero por categoría (el tablero por mes ya se practica en el módulo 17) */
  const porCat = (filtro) => { const o = {}; D.ventas.filter(filtro).forEach((v) => { o[v.categoria] = (o[v.categoria] || 0) + v.total; }); return Object.entries(o).sort((x, y) => y[1] - x[1]); };
  const surCat = porCat((v) => v.sucursal === 'Sur');
  const LIDER_SUR = surCat[0][0];
  const totalSur = surCat.reduce((s, x) => s + x[1], 0);
  const PCT_LIDER = Math.round((surCat[0][1] / totalSur) * 100);
  const opcionesPct = [PCT_LIDER - 9, PCT_LIDER - 4, PCT_LIDER, PCT_LIDER + 6].map((x) => x + ' %');
  void mesNorte; void mesNorteFrio;
  function crearReto(cont, nivel) {
    const { h } = LT.u;
    let est = null;
    const resp = {};
    const zona = h('div');
    const experto = nivel === 'experto';
    const sel = (clave, opciones) => h('select', { class: 'herr-sel', onchange: (ev) => { resp[clave] = ev.target.value; } }, h('option', { value: '' }, 'Elige…'), opciones.map((o) => h('option', { value: o }, o)));
    const preg = h('div', { class: 'aviso-caja info' }, '¿Qué categoría vende más en la sucursal Sur? ', sel('cat', D.categorias.slice().sort()));
    if (experto) preg.append(h('div', { style: { marginTop: '8px' } }, 'Con los valores como % del total general: ¿qué porcentaje de las ventas de Sur aporta esa categoría? ', sel('pct', opcionesPct)));
    cont.append(zona, preg);
    setTimeout(() => LT.TablaDinamica(zona, { datos: DATOS, campos: CAMPOS_DINAMICA, estado: nivel === 'explorador' ? { filas: ['Categoría'], valores: ['Total'] } : {}, segmentaciones: ['Sucursal', 'Pago'], grafico: true, alCambiar: (e) => { est = e; } }), 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const e = est || { filas: [], columnas: [], valores: [], segmentaciones: {} };
        add(e.filas.length === 1 && e.filas[0].campo === 'Categoría', 'Filas: Categoría', 'Pon Categoría en Filas (y nada más).');
        add(!e.columnas || !e.columnas.length, 'Sin campos en Columnas', 'Deja vacía el área de Columnas: la sucursal se elige con la segmentación.');
        const v = e.valores[0];
        add(e.valores.length === 1 && v.campo === 'Total' && v.funcion === 'suma', 'Valores: Suma de Total', 'En Valores pon «Suma de Total».');
        if (experto) add(v && v.mostrarComo === 'pctTotal', 'Valores como % del total general', 'Configuración de campo de valor › Mostrar valores como › % del total general.');
        else add(v && v.mostrarComo === 'ninguno', 'Valores en pesos (sin porcentaje)', 'Deja los valores sin cálculo (en pesos).');
        add(e.tipoGrafico === 'barras' || e.tipoGrafico === 'columnas', 'Gráfico dinámico de barras o columnas', 'Para comparar categorías elige barras o columnas.');
        const s = e.segmentaciones || {};
        add(JSON.stringify(s.Sucursal) === '["Sur"]', 'Segmentación Sucursal en Sur', 'En la segmentación Sucursal deja seleccionado solo «Sur».');
        add(!s.Pago, 'Sin filtro de forma de pago', 'Quita el filtro de la segmentación Pago (⨯) para ver todos los pagos.');
        add(resp.cat === LIDER_SUR, 'Categoría líder de Sur correcta', resp.cat ? 'Mira la barra más larga con Sur filtrado: no es ' + resp.cat + '.' : 'Responde qué categoría vende más en Sur.');
        if (experto) add(resp.pct === PCT_LIDER + ' %', 'Porcentaje correcto', resp.pct ? 'Lee el porcentaje de la categoría líder en la tabla: no es ' + resp.pct + '.' : 'Responde el porcentaje.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 18,
    objetivo: 'Crear gráficos dinámicos, conectar segmentaciones y escalas de tiempo a varios informes y diseñar un tablero que responda preguntas de negocio.',
    situacion: 'Para la junta con los encargados quiero un <b>tablero por categoría</b>: un gráfico que, con un clic en la sucursal, diga qué vende más en cada una.',
    explicacion: [
      { html: '<h3>Gráfico + tabla dinámica + botones</h3><ul><li>Un <b>gráfico dinámico</b> (Análisis de tabla dinámica › Gráfico dinámico) está conectado a su tabla dinámica: si cambias los campos o los filtros, el gráfico cambia.</li><li>Una <b>segmentación de datos</b> es un panel de botones para filtrar con un clic (Ctrl+clic para elegir varios).</li><li>Una <b>escala de tiempo</b> filtra por periodos de fecha con una barra deslizante.</li><li>Con <b>Conexiones de filtro</b> una misma segmentación controla varias tablas dinámicas: así se arma un tablero.</li></ul>' },
      { titulo: 'Explora un tablero', instr: 'Haz clic en los botones de las segmentaciones y mira cómo cambian juntos la tabla y el gráfico.', widget: (c) => LT.TablaDinamica(c, { datos: DATOS, campos: CAMPOS_DINAMICA, estado: { filas: ['Sucursal'], valores: ['Total'] }, segmentaciones: ['Categoría'], grafico: true }) },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Del informe al tablero',
      pasos: [{ texto: 'Con una celda de la tabla dinámica seleccionada: Análisis de tabla dinámica › Gráfico dinámico › Líneas.', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] }, { texto: 'Análisis de tabla dinámica › Insertar segmentación de datos › Sucursal.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, { texto: 'Insertar escala de tiempo › Fecha (opcional).', ruta: ['Análisis de tabla dinámica', 'Insertar escala de tiempo'] }, 'Acomoda el gráfico y los filtros en una hoja «Tablero».'],
      pregunta: { texto: 'En la segmentación Sucursal haces clic en «Norte». ¿Qué cambia?', opciones: ['La tabla dinámica y el gráfico conectados muestran solo Norte', 'Solo cambia el color del botón', 'Se borran las ventas de las otras sucursales', 'Se crea una hoja nueva con Norte'], correcta: 0, explicacion: 'La segmentación filtra la tabla dinámica, y el gráfico dinámico la sigue. Los datos de origen no se borran.' },
    },
    micro: [
      { titulo: 'Filtrar por fechas', tipo: 'opcion', enunciado: '¿Qué control filtra una tabla dinámica por <b>rango de fechas</b> con una barra deslizante?', opciones: ['Escala de tiempo', 'Segmentación de datos', 'Validación de datos', 'Minigráfico'], correcta: 0, explicacion: 'La <b>escala de tiempo</b> permite elegir meses, trimestres o años arrastrando.' },
      { titulo: 'Un filtro para dos informes', tipo: 'opcion', enunciado: 'Tienes dos tablas dinámicas del mismo origen y quieres que <b>una sola segmentación</b> filtre ambas.', opciones: ['Conexiones de filtro (conexiones de informe) de la segmentación', 'Copiar la segmentación', 'Proteger la hoja', 'Agrupar las tablas dinámicas'], correcta: 0, explicacion: 'Con la segmentación seleccionada: <b>Segmentación › Conexiones de informe</b> (o Análisis de tabla dinámica › Conexiones de filtro) y marcas las tablas que debe controlar.' },
    ],
    reto: { titulo: 'Tablero de ventas por categoría', tipo: 'widget', crear: crearReto,
      base: { instrucciones: ['Arma la tabla dinámica: <b>Categoría</b> en Filas y <b>Suma de Total</b> en Valores (nada en Columnas).', 'Elige un gráfico dinámico de <b>barras</b> (o columnas): con categorías sin orden natural se comparan mejor.', 'Con la segmentación <b>Sucursal</b> deja solo <b>Sur</b> (la de Pago, sin filtro) y responde qué categoría vende más ahí.'], pistas: ['Lo que comparas (categorías) va en Filas; lo que mides (Total) en Valores.', 'La segmentación filtra tabla y gráfico a la vez.', 'Filas: Categoría · Valores: Suma de Total · Gráfico: Barras · Segmentación Sucursal: Sur.'] },
      niveles: { explorador: { instrucciones: ['La tabla ya tiene Categoría en Filas y la suma del Total.', 'Elige el gráfico de <b>Barras</b>.', 'En la segmentación Sucursal haz clic en <b>Sur</b>.', 'Responde mirando la barra más larga.'] }, experto: { instrucciones: ['Arma el tablero del nivel Analista (Categoría, suma de Total, barras o columnas, Sucursal = Sur).', 'Muestra los valores como <b>% del total general</b> y responde también qué porcentaje de las ventas de Sur aporta la categoría líder.'] } } },
    lab: {
      archivo: 'lab18-tablero.xlsx', titulo: 'Tablero de ventas en Excel',
      contexto: 'La hoja Ventas tiene las 720 ventas de 2025. Arma en una hoja nueva llamada «Tablero» dos informes que se filtren juntos.',
      pasos: {
        explorador: [
          { texto: 'Inserta una tabla dinámica en una hoja nueva «Tablero»: Categoría en filas y Suma de Total en valores.', ruta: ['Insertar', 'Tabla dinámica'] },
          { texto: 'Con una celda de esa tabla: gráfico dinámico de barras.', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] },
          'Inserta una segunda tabla dinámica (mismo origen) con la Fecha agrupada por meses en filas y Suma de Total; agrégale un gráfico dinámico de líneas.',
          { texto: 'Inserta una segmentación por Sucursal y conéctala a las dos tablas dinámicas (clic derecho › Conexiones de informe).', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] },
          'Guarda el libro y súbelo aquí.',
        ],
        analista: ['En «Tablero»: una tabla dinámica por categoría con gráfico de barras y otra por mes con gráfico de líneas.', 'Una segmentación por Sucursal conectada a las dos tablas dinámicas.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Agrega una escala de tiempo por Fecha conectada a ambas tablas y una segunda segmentación por Pago.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { t: 'dinamica', filas: ['Categor'], valores: ['Total'], titulo: 'Tabla dinámica por categoría' },
        { t: 'dinamica', valores: ['Total'], agrupada: true, titulo: 'Tabla dinámica por mes (fecha agrupada)' },
        { t: 'grafico', dinamico: true, tipos: ['barras', 'columnas'], titulo: 'Gráfico dinámico de barras o columnas' },
        { t: 'grafico', dinamico: true, tipos: ['lineas'], titulo: 'Gráfico dinámico de líneas' },
        { titulo: 'Segmentación por Sucursal conectada a las dos tablas', fn: (L) => { const s = L.segmentaciones.find((x) => /sucursal/i.test(x.campo || x.nombre)); if (!s) return 'Inserta una segmentación por Sucursal.'; return s.dinamicas.length >= 2 ? true : 'La segmentación filtra ' + s.dinamicas.length + ' tabla(s) dinámica(s): conéctala a las dos (Conexiones de informe).'; } },
        { titulo: 'Escala de tiempo por Fecha', nivel: 'experto', fn: (L) => (L.escalasTiempo.some((e) => e.dinamicas.length >= 2) ? true : L.escalasTiempo.length ? 'Conecta la escala de tiempo a las dos tablas dinámicas.' : 'Agrega una escala de tiempo (Insertar escala de tiempo › Fecha).') },
        { titulo: 'Segmentación por Pago', nivel: 'experto', fn: (L) => (L.segmentaciones.some((x) => /pago/i.test(x.campo || x.nombre)) ? true : 'Agrega una segmentación por Pago.') },
      ],
    },
    donde: [
      { comando: 'Gráfico dinámico', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'], nota: 'También en Insertar › Gráfico dinámico.' },
      { comando: 'Insertar segmentación de datos', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] },
      { comando: 'Insertar escala de tiempo', ruta: ['Análisis de tabla dinámica', 'Insertar escala de tiempo'] },
      { comando: 'Conexiones de filtro', ruta: ['Análisis de tabla dinámica', 'Conexiones de filtro'] },
    ],
    atajos: ['<kbd>Ctrl</kbd>+clic en una segmentación para elegir varios elementos.', 'Alt+F5 actualiza la tabla dinámica seleccionada (en Excel).'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const VD = LT.caso.D.ventas;
  const TOT = VD.reduce((s, v) => s + v.total, 0);
  const MM = new Array(12).fill(0); VD.forEach((v) => { MM[+v.fecha.slice(5, 7) - 1] += v.total; });
  const MEJOR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][MM.indexOf(Math.max(...MM))];
  const tablero = `<figure class="figura-explica"><svg viewBox="0 0 620 230" role="img" aria-label="Distribución de un tablero">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="10" width="600" height="30" rx="6" fill="#3a2418"/><text x="20" y="30" fill="#fff" font-weight="700">Tablero de ventas 2025 · La Taza</text><text x="600" y="30" fill="#f4e1cc" text-anchor="end">Datos: ene–dic 2025</text>
  <rect x="10" y="48" width="140" height="56" rx="6" fill="#e2f1e8" stroke="#1e7145"/><text x="20" y="66">Ventas del año</text><text x="20" y="92" font-size="18" font-weight="700">$${LT.u.formatoMiles(TOT)}</text>
  <rect x="160" y="48" width="140" height="56" rx="6" fill="#e7effc" stroke="#2259b8"/><text x="170" y="66">Ticket promedio</text><text x="170" y="92" font-size="18" font-weight="700">$${LT.u.formatoMiles(TOT / VD.length)}</text>
  <rect x="310" y="48" width="140" height="56" rx="6" fill="#fff4dc" stroke="#a86a12"/><text x="320" y="66">Mejor mes</text><text x="320" y="92" font-size="18" font-weight="700">${MEJOR}</text>
  <rect x="460" y="48" width="150" height="176" rx="6" fill="#fff" stroke="#ccc"/><text x="470" y="66" font-weight="700">Segmentaciones</text>
  <g><rect x="470" y="76" width="60" height="20" rx="4" fill="#8a5a3c"/><text x="476" y="90" fill="#fff">Centro</text><rect x="536" y="76" width="60" height="20" rx="4" fill="#d9c7b5"/><text x="542" y="90">Norte</text><rect x="470" y="100" width="60" height="20" rx="4" fill="#d9c7b5"/><text x="482" y="114">Sur</text></g>
  <rect x="470" y="132" width="130" height="34" rx="4" fill="#f3ebdf"/><text x="476" y="152">Escala de tiempo ▭▭▭</text>
  <rect x="10" y="112" width="220" height="112" rx="6" fill="#fff" stroke="#ccc"/><text x="20" y="130" font-weight="700">Ventas por mes (líneas)</text><polyline points="24,200 60,184 96,190 132,170 168,160 204,140" fill="none" stroke="#2259b8" stroke-width="3"/>
  <rect x="240" y="112" width="210" height="112" rx="6" fill="#fff" stroke="#ccc"/><text x="250" y="130" font-weight="700">Por categoría (barras)</text><rect x="250" y="140" width="170" height="12" fill="#8a5a3c"/><rect x="250" y="158" width="120" height="12" fill="#8a5a3c"/><rect x="250" y="176" width="90" height="12" fill="#8a5a3c"/><rect x="250" y="194" width="60" height="12" fill="#8a5a3c"/></g></svg>
  <figcaption>Arriba los indicadores clave, al centro los gráficos que responden preguntas, a la derecha los filtros conectados a todo.</figcaption></figure>`;
  LT.ampliarModulo(18, {
    objetivos: [
      'Crear un gráfico dinámico y explicar cómo se relaciona con su tabla dinámica.',
      'Elegir el tipo de gráfico dinámico según la pregunta (barras para categorías, líneas para tiempo).',
      'Insertar segmentaciones y escalas de tiempo y conectarlas a varios informes (Conexiones de informe).',
      'Diseñar un tablero: indicadores clave arriba, gráficos al centro, filtros a un lado.',
      'Actualizar todo el tablero con un clic y protegerlo para los usuarios.',
    ],
    detalle: [
      { titulo: 'Anatomía de un tablero', abierto: true, html: tablero },
      { titulo: 'Una segmentación para varios informes', html: '<p>Si dos tablas dinámicas salen del <b>mismo origen</b>, una segmentación puede filtrarlas a la vez: clic derecho en la segmentación › <b>Conexiones de informe</b> (o Segmentación › Conexiones de informe) y marca las tablas dinámicas. Lo mismo con una <b>escala de tiempo</b> (Insertar › Escala de tiempo), que filtra por años, trimestres, meses o días arrastrando una barra.</p>' },
      { titulo: 'Indicadores clave (KPI) con fórmulas', html: '<p>Los números grandes de arriba suelen ser celdas con fórmulas que leen la tabla dinámica (<code>=IMPORTARDATOSDINAMICOS("Total",Dinámica!$A$3)</code>) o la tabla de datos (<code>=SUMA(Ventas[Total])</code>). Dales formato grande y una etiqueta clara; si deben responder a las segmentaciones, lee la tabla dinámica filtrada, no la tabla de datos.</p>' },
      { titulo: 'Pulir y entregar', html: '<ul><li>Oculta los botones de campo del gráfico (Análisis de gráfico dinámico › Botones de campo) para que se vea limpio.</li><li>Quita la cuadrícula (Vista › Líneas de cuadrícula) y alinea los objetos (Formato › Alinear).</li><li>Datos › <b>Actualizar todo</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>F5</kbd>) refresca tablas dinámicas, gráficos y consultas.</li><li>Protege la hoja permitiendo «Usar tablas dinámicas y gráficos dinámicos» para que los usuarios filtren sin mover nada.</li></ul>' },
    ],
    errores: [
      'Saturar el tablero con diez gráficos: cada uno debe responder una pregunta distinta.',
      'Segmentaciones que filtran solo una de las tablas dinámicas (faltó conectarlas).',
      'Gráficos dinámicos circulares con muchas categorías.',
      'Olvidar actualizar después de agregar datos.',
    ],
    consejos: [
      'Pon el título y la fecha de actualización en el tablero.',
      'Usa los mismos colores para la misma sucursal o categoría en todos los gráficos.',
      'Ubica las tablas dinámicas de apoyo en una hoja aparte y deja en el tablero solo gráficos, indicadores y filtros.',
      'Prueba el tablero como lo usaría la gerente: ¿responde sus preguntas en tres clics o menos?',
    ],
    microExtra: [
      { titulo: 'Barras o líneas', tipo: 'opcion', enunciado: 'En el tablero quieres comparar las <b>seis categorías</b> de producto en la sucursal seleccionada. ¿Qué gráfico dinámico conviene?', opciones: ['Barras (o columnas), ordenadas de mayor a menor', 'Líneas', 'Circular con 6 porciones y 3D', 'Dispersión'], correcta: 0, explicacion: 'Las categorías no tienen orden en el tiempo: se comparan longitudes. Las líneas sugieren una tendencia que no existe.', retro: { 1: 'Las líneas son para el tiempo (meses, trimestres).' } },
    ],
    autoeval: [
      { p: '¿Qué pasa con un gráfico dinámico si cambias los campos de su tabla dinámica?', r: 'Cambia con ella: el gráfico siempre muestra lo que tiene la tabla dinámica (campos, filtros y agrupaciones).' },
      { p: '¿Cómo logras que una segmentación filtre dos tablas dinámicas?', r: 'Conectándola a ambas en Conexiones de informe; deben provenir del mismo origen (misma caché).' },
      { p: '¿Qué diferencia hay entre una segmentación y una escala de tiempo?', r: 'La segmentación filtra por valores de un campo con botones; la escala de tiempo filtra un campo de fecha por periodos con una barra.' },
      { p: '¿Qué va en la parte superior de un buen tablero?', r: 'El título, la fecha de actualización y los indicadores clave (por ejemplo, ventas del año, ticket promedio, mejor mes).' },
      { p: '¿Cómo actualizas a la vez todas las tablas dinámicas y consultas del libro?', r: 'Datos › Actualizar todo (Ctrl+Alt+F5).' },
      { p: '¿Cómo proteges un tablero sin impedir que se usen las segmentaciones?', r: 'Protegiendo la hoja y marcando «Usar tablas dinámicas y gráficos dinámicos» (y dejando seleccionables los objetos).' },
    ],
    conexiones: [
      { id: 7, texto: 'las reglas para elegir y depurar gráficos valen igual para los dinámicos.' },
      { id: 17, texto: 'cada gráfico dinámico sale de una tabla dinámica.' },
      { id: 19, texto: 'una búsqueda con BUSCARX puede alimentar una ficha de producto dentro del tablero.' },
      { proyecto: 'avanzado', texto: 'el tablero anual combina gráficos dinámicos, segmentaciones e indicadores.' },
    ],
  });
})();
