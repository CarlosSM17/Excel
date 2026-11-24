/* Módulo 24 · Macros y automatización */
(function () {
  const { D, semana } = LT.caso;
  const tabla = (suc, fila0, col0) => {
    const filas = semana(suc);
    const L = (c) => LT.refs.colLetra(col0 + c);
    const ini = fila0 + 1;
    const fin = fila0 + filas.length;
    const datos = [['Producto', 'Precio', 'Unidades', 'Ventas', 'Participación'], ...filas.map((p, i) => { const r = fila0 + 2 + i; return [p.producto, p.precio, p.unidades, '=' + L(1) + r + '*' + L(2) + r, '=' + L(3) + r + '/SUMA($' + L(3) + '$' + (ini + 1) + ':$' + L(3) + '$' + (fin + 1) + ')']; })];
    return { datos, inicio: LT.refs.dir(fila0, col0) };
  };
  const hojaSemana = (nombre, suc, fila0, col0) => { const t = tabla(suc, fila0, col0); return { nombre, datos: t.datos, inicio: t.inicio, anchos: { A: col0 ? 40 : 130, B: col0 ? 130 : 80 }, filas: 16, cols: 8 }; };
  const libro = (experto) => ({
    hojas: [hojaSemana('Semana 42', 'Centro', 0, 0), hojaSemana('Semana 43', 'Norte', 0, 0)].concat(experto ? [hojaSemana('Semana 44', 'Sur', 2, 1)] : []),
    pestanas: true, herramientas: ['fuente', 'numero', 'alineacion'], altura: 330,
    alCrear: undefined,
  });
  const formateada = (x, hoja, enc, mon, todo) => {
    for (const c of x.celdas(hoja + '!' + enc)) { const e = x.estilo(hoja + '!' + c.dir); if (!e.b || !e.bg) return 'En «' + hoja + '», el encabezado ' + c.dir + ' debe quedar en negrita y con relleno.'; }
    for (const c of x.celdas(hoja + '!' + mon)) { const e = x.estilo(hoja + '!' + c.dir); if (!/\$/.test(e.fmt || '')) return 'En «' + hoja + '», ' + c.dir + ' (Ventas) debe quedar en formato de moneda.'; }
    for (const c of x.celdas(hoja + '!' + todo)) { const e = x.estilo(hoja + '!' + c.dir); if (!(e.bd && (e.bd.t || e.bd.b) && (e.bd.l || e.bd.r))) return 'En «' + hoja + '», ' + c.dir + ' no tiene bordes.'; }
    return true;
  };
  const macroOk = (x) => { const m = x.hoja.macros || {}; const n = Object.keys(m); if (!n.length) return 'Todavía no hay macros grabadas: usa «Grabar macro».'; return Object.values(m).some((y) => y.pasos.length >= 4) ? true : 'La macro grabada tiene muy pocos pasos: graba la selección y los tres formatos.'; };
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Macro grabada', fn: macroOk, detener: true },
    { tipo: 'fn', titulo: 'Semana 42 con formato', fn: (x) => formateada(x, 'Semana 42', 'A1:E1', 'D2:D9', 'A1:E9') },
    { tipo: 'fn', titulo: 'Macro ejecutada en Semana 43', fn: (x) => formateada(x, 'Semana 43', 'A1:E1', 'D2:D9', 'A1:E9') },
    { tipo: 'fn', titulo: 'Botón con la macro asignada', fn: (x) => (x.estado.hojas.some((h) => (h.objetos || []).some((o) => o.macro)) ? true : 'Inserta un botón (forma), haz clic derecho › Asignar macro…') },
  ];

  LT.definirModulo({
    id: 24,
    objetivo: 'Grabar, ejecutar y asignar una macro a un botón; guardar el libro habilitado para macros.',
    situacion: 'Cada lunes doy formato al reporte semanal: encabezados, moneda, bordes… siempre lo mismo. Quiero <b>un botón que lo haga solo</b>.',
    explicacion: [
      { html: '<h3>La grabadora de macros</h3><p>Una <b>macro</b> repite una serie de pasos. La <b>grabadora</b> traduce lo que haces (seleccionar, poner negrita, dar formato…) a código <b>VBA</b> (Visual Basic para Aplicaciones). Después puedes ejecutarla con un clic.</p><ul><li>Activa la pestaña <b>Programador</b>: Archivo › Opciones › Personalizar cinta › marca «Programador».</li><li><b>Referencias absolutas</b> (por omisión): la macro siempre trabaja en las mismas celdas (A1:E1). <b>Referencias relativas</b>: repite los pasos a partir de la celda donde esté el cursor.</li><li>Guarda como <b>Libro de Excel habilitado para macros (.xlsm)</b>: un .xlsx no guarda macros.</li><li><b>Seguridad:</b> al abrir un archivo con macros aparece «Habilitar contenido»; habilítalo solo si confías en el origen. Las macros pueden modificar archivos.</li><li><b>Excel para la web y iPad no ejecutan macros VBA</b>; la alternativa en la web es Office Scripts (si tu licencia lo permite).</li></ul>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Grabar una macro de formato',
      pasos: [{ texto: 'Programador › Grabar macro › Nombre: FormatoReporte › Guardar macro en: Este libro › Aceptar.', ruta: ['Programador', 'Grabar macro'] }, 'Haz los pasos una sola vez: selecciona A1:E1 › negrita y relleno; D2:D9 › moneda; A1:E9 › todos los bordes.', { texto: 'Programador › Detener grabación (el mismo botón).', ruta: ['Programador', 'Grabar macro'] }, { texto: 'Para ver el código: Programador › Macros › FormatoReporte › Modificar (o Alt+F11).', ruta: ['Programador', 'Macros'] }],
      pregunta: { texto: 'Grabaste la macro con <b>referencias absolutas</b> sobre A1:E1. El reporte de mañana empieza en B3. ¿Qué pasa al ejecutarla?', opciones: ['Da formato otra vez a A1:E1, no al nuevo reporte', 'Detecta el reporte y lo formatea en B3', 'Marca un error', 'No hace nada'], correcta: 0, explicacion: 'Con referencias absolutas el código dice <code>Range("A1:E1").Select</code>. Para que trabaje desde la celda activa, graba con <b>Usar referencias relativas</b>.' },
    },
    micro: [
      { titulo: 'Guardar macros', tipo: 'opcion', enunciado: 'Grabaste una macro y guardas el libro como <b>.xlsx</b>. ¿Qué pasa?', opciones: ['Excel avisa que el proyecto de VB (las macros) no se guardará en ese formato', 'Se guarda igual con las macros', 'Se convierte en PDF', 'Las macros pasan a otra hoja'], correcta: 0, explicacion: 'Las macros solo se guardan en formatos habilitados: <b>.xlsm</b> (o .xlsb).' },
      { titulo: 'Seguridad', tipo: 'opcion', enunciado: 'Te mandan un archivo con macros y aparece una barra amarilla «Habilitar contenido». ¿Qué haces?', opciones: ['Lo habilito solo si confío en quien lo envió y sé qué hace', 'Siempre lo habilito', 'Nunca abro archivos de Excel', 'Lo guardo como .xlsx para habilitarlo'], correcta: 0, explicacion: 'Las macros pueden ejecutar acciones en tu equipo: habilítalas solo de fuentes confiables.' },
    ],
    reto: {
      titulo: 'Botón que da formato al reporte semanal', tipo: 'hoja',
      intro: 'Usa la grabadora (arriba de la hoja) y la barra de formato. La macro queda guardada mientras estés en esta página.',
      base: {
        hoja: libro(false), pruebas: pruebasBase,
        alCrear: (hoja, trabajo) => { const panel = LT.u.h('div'); trabajo.insertBefore(panel, trabajo.firstChild); LT.widgets.grabadora(hoja, panel, {}); },
        instrucciones: ['En «Semana 42», graba una macro llamada <b>FormatoReporte</b> que: ponga en negrita y con relleno A1:E1; dé formato de moneda a D2:D9; y ponga todos los bordes en A1:E9.', 'Ve a «Semana 43» y <b>ejecuta</b> la macro.', 'Inserta un <b>botón</b> y asígnale la macro (clic derecho › Asignar macro…). Pruébalo.', 'Revisa el código VBA que se generó.'],
        pistas: ['Pulsa Grabar macro antes de seleccionar nada; después haz los pasos en orden y pulsa Detener.', 'Selecciona con el ratón (la grabadora registra cada selección) y usa los botones N, relleno, $ y Bordes › Todos los bordes.', 'Grabar › selecciona A1:E1 › N › relleno › selecciona D2:D9 › $ › selecciona A1:E9 › Bordes › Todos › Detener. Pestaña Semana 43 › Macros (ejecutar). Insertar botón › clic derecho › Asignar macro.'],
      },
      niveles: {
        explorador: { instrucciones: ['En «Semana 42», pulsa <b>Grabar macro</b> › nombre FormatoReporte › Aceptar.', 'Selecciona A1:E1 → botón <b>N</b> → relleno (cubeta).', 'Selecciona D2:D9 → botón <b>$</b>.', 'Selecciona A1:E9 → <b>Bordes</b> › Todos los bordes.', 'Pulsa <b>Detener grabación</b>.', 'Pestaña «Semana 43» → <b>Macros (ejecutar)</b> → FormatoReporte.', '<b>Insertar botón</b> → clic derecho › Asignar macro… → FormatoReporte.'] },
        experto: {
          hoja: libro(true),
          instrucciones: ['El reporte de «Semana 44» empieza en <b>B3</b>. Graba la macro con <b>Usar referencias relativas</b> para que funcione sin importar dónde empieza el reporte: empieza a grabar con el cursor en la esquina del reporte (A1 en Semana 42).', 'Ejecútala en Semana 43 (cursor en A1) y en Semana 44 (cursor en B3).', 'Asigna la macro a un botón.'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Grabada con referencias relativas', fn: (x) => (Object.values(x.hoja.macros || {}).some((m) => m.relativas) ? true : 'Graba la macro con «Usar referencias relativas» activado.') },
            { tipo: 'fn', titulo: 'Semana 44 (desde B3) con formato', fn: (x) => formateada(x, 'Semana 44', 'B3:F3', 'E4:E11', 'B3:F11') },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab24-reporte-macro.xlsx', titulo: 'Macro en Excel de escritorio', acepta: '.xlsm',
      contexto: 'Necesitas Excel para Windows o Mac (Excel para la web no ejecuta macros VBA). Al final guarda como <b>.xlsm</b>.',
      pasos: {
        explorador: [{ texto: 'Activa la pestaña Programador (Archivo › Opciones › Personalizar cinta).' }, { texto: 'Graba la macro FormatoReporte en «Semana 42» (encabezados, moneda en D2:D9, bordes A1:E9).', ruta: ['Programador', 'Grabar macro'] }, { texto: 'Ejecútala en «Semana 43».', ruta: ['Programador', 'Macros'] }, { texto: 'Inserta un botón de formulario y asígnale la macro.', ruta: ['Programador', 'Insertar', 'Botón (control de formulario)'] }, { texto: 'Guarda como Libro de Excel habilitado para macros.', ruta: ['Archivo', 'Guardar como', 'Libro de Excel habilitado para macros (*.xlsm)'] }, 'Sube el archivo .xlsm.'],
        analista: ['Graba FormatoReporte en «Semana 42», ejecútala en «Semana 43», asígnala a un botón y guarda como .xlsm.', 'Sube el archivo.'],
        experto: ['Graba con referencias relativas y ejecútala también en «Semana 44» (el reporte empieza en B3).', 'Botón con la macro y archivo .xlsm.', 'Sube el archivo.'],
      },
      notaWeb: 'Este laboratorio necesita Excel de escritorio: la web no crea ni ejecuta macros VBA.',
      pruebas: [
        { titulo: 'Libro habilitado para macros con código VBA', fn: (L) => (L.habilitadoMacros ? (L.tieneVBA ? true : 'El archivo es .xlsm pero no contiene macros: graba la macro antes de guardar.') : 'El archivo no es .xlsm: Archivo › Guardar como › Libro de Excel habilitado para macros.') },
        { titulo: 'Semana 43 con formato (la macro se ejecutó)', fn: (L, A) => {
          A.hoja('Semana 43');
          for (const x of L.celdasRango('A1:E1')) { const e = L.estilo('Semana 43', x.dir); if (!e.negrita || !e.relleno) return 'En Semana 43, ' + x.dir + ' no tiene negrita y relleno: ejecuta la macro en esa hoja.'; }
          for (const x of L.celdasRango('D2:D9')) if (!A.formatoMoneda(L.estilo('Semana 43', x.dir).numFmt)) return 'En Semana 43, ' + x.dir + ' no tiene formato de moneda.';
          for (const x of L.celdasRango('A1:E9')) if (!L.estilo('Semana 43', x.dir).tieneBordes) return 'En Semana 43, ' + x.dir + ' no tiene bordes.';
          return true;
        } },
        { titulo: 'Botón con macro asignada', fn: (L) => (L.hojas.some((h) => h.controles.some((c) => c.macro) || h.dibujo.conMacro.length) ? true : 'No encontré un botón con macro asignada: inserta un botón (o forma) y usa Asignar macro.') },
        { titulo: 'Semana 44 con formato desde B3', nivel: 'experto', fn: (L, A) => {
          if (!L.hoja('Semana 44')) return 'No encontré la hoja Semana 44.';
          for (const x of L.celdasRango('B3:F3')) { const e = L.estilo('Semana 44', x.dir); if (!e.negrita || !e.relleno) return 'En Semana 44, ' + x.dir + ' no tiene formato: graba con referencias relativas y ejecuta desde B3.'; }
          for (const x of L.celdasRango('E4:E11')) if (!A.formatoMoneda(L.estilo('Semana 44', x.dir).numFmt)) return 'En Semana 44, ' + x.dir + ' no tiene formato de moneda.';
          return true;
        } },
      ],
    },
    donde: [
      { comando: 'Grabar macro', ruta: ['Programador', 'Grabar macro'], nota: 'También en Vista › Macros › Grabar macro…' },
      { comando: 'Usar referencias relativas', ruta: ['Programador', 'Usar referencias relativas'] },
      { comando: 'Botón (control de formulario)', ruta: ['Programador', 'Insertar', 'Botón (control de formulario)'] },
      { comando: 'Guardar como .xlsm', ruta: ['Archivo', 'Guardar como', 'Libro de Excel habilitado para macros (*.xlsm)'] },
      { comando: 'Seguridad de macros', ruta: ['Programador', 'Seguridad de macros'] },
    ],
    atajos: ['<kbd>Alt+F8</kbd> lista de macros · <kbd>Alt+F11</kbd> editor de Visual Basic.', 'Puedes asignar la macro a cualquier forma o imagen: clic derecho › Asignar macro.'],
  });
})();


/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  LT.ampliarModulo(24, {
    objetivo: 'Automatizar tareas repetitivas: grabar macros con referencias absolutas o relativas, ejecutarlas desde botones y atajos, leer y editar el código VBA básico, y guardar y abrir libros con macros de forma segura.',
    objetivos: [
      'Decidir qué tareas conviene automatizar y planear los pasos antes de grabar.',
      'Grabar una macro con referencias absolutas o relativas y ejecutarla desde la lista, un atajo o un botón.',
      'Guardar el libro como .xlsm y abrir con seguridad archivos con macros (Habilitar contenido, Desbloquear).',
      'Leer el código VBA que genera la grabadora: Sub, objetos, propiedades y métodos.',
      'Hacer ediciones sencillas al código y conocer las alternativas (Scripts de Office, Power Automate).',
    ],
    detalle: [
      { titulo: 'Antes de grabar: planear', abierto: true, html: '<ol><li>Practica los pasos una vez sin grabar y anótalos.</li><li>Decide desde dónde empieza: si la macro siempre trabaja en las mismas celdas, usa <b>referencias absolutas</b> (por omisión); si debe trabajar «a partir de donde estoy», activa <b>Usar referencias relativas</b> antes de grabar.</li><li>Elige un nombre sin espacios (<code>FormatoReporte</code>) y, si quieres, un atajo (<kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>F</kbd>: evita atajos que ya usa Excel).</li><li>Guarda la macro en <b>Este libro</b> (viaja con el archivo) o en el <b>Libro de macros personal</b> (disponible en todos tus libros, solo en tu equipo).</li></ol><p>La pestaña <b>Programador</b> se activa en Archivo › Opciones › Personalizar cinta.</p>' },
      { titulo: 'Leer el código VBA', html: '<p>La grabadora traduce tus acciones a VBA (<kbd>Alt</kbd>+<kbd>F11</kbd> abre el editor; las macros están en un <b>Módulo</b>):</p><pre class="mono" style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:10px;overflow:auto">Sub FormatoReporte()\n    \' Encabezados en negrita con relleno\n    Range("A1:E1").Select\n    Selection.Font.Bold = True\n    Selection.Interior.Color = RGB(243, 235, 223)\n    \' Ventas en moneda\n    Range("D2:D9").NumberFormat = "$#,##0.00"\n    \' Bordes\n    Range("A1:E9").Borders.LineStyle = xlContinuous\nEnd Sub</pre><table><tr><th>Pieza</th><th>Ejemplo</th><th>Qué es</th></tr><tr><td>Procedimiento</td><td><code>Sub … End Sub</code></td><td>La macro</td></tr><tr><td>Objeto</td><td><code>Range("A1:E1")</code>, <code>Worksheets("Norte")</code></td><td>Algo de Excel</td></tr><tr><td>Propiedad</td><td><code>.Font.Bold = True</code>, <code>.Value</code></td><td>Una característica que se lee o cambia</td></tr><tr><td>Método</td><td><code>.Select</code>, <code>.ClearContents</code></td><td>Una acción</td></tr><tr><td>Comentario</td><td><code>\' texto</code></td><td>Explicación que no se ejecuta</td></tr></table><p>Una edición típica: quitar los <code>.Select</code> innecesarios o cambiar <code>"A1:E9"</code> por el rango correcto.</p>' },
      { titulo: 'Seguridad de macros', html: '<ul><li>Un libro con macros se guarda como <b>.xlsm</b>; si lo guardas como .xlsx, Excel avisa y descarta las macros.</li><li>Al abrir un .xlsm aparece la barra <b>Habilitar contenido</b>: habilítalo solo si conoces el origen y sabes qué hace.</li><li>Los archivos descargados de internet o recibidos por correo llegan marcados: si aparece «Riesgo de seguridad: Microsoft bloqueó las macros», clic derecho en el archivo › Propiedades › <b>Desbloquear</b> (solo si confías en él).</li><li>Las <b>ubicaciones de confianza</b> (Centro de confianza) permiten abrir sin aviso los libros de una carpeta segura de tu empresa.</li><li>Excel para la web no ejecuta VBA: allí se usan <b>Scripts de Office</b> (pestaña Automatizar), que se pueden programar con Power Automate.</li></ul>' },
    ],
    errores: [
      'Grabar con referencias absolutas una macro que debía trabajar donde está el cursor (o al revés).',
      'Guardar como .xlsx y perder las macros.',
      'Grabar pasos de más (desplazarse, clics de prueba): la macro los repite.',
      'Asignar un atajo que reemplaza uno de Excel (por ejemplo, Ctrl+C).',
      'Habilitar macros de cualquier archivo recibido.',
    ],
    consejos: [
      'Prueba la macro en una copia del libro: no se puede deshacer con Ctrl+Z.',
      'Pon botones con un texto que diga qué hacen («Dar formato al reporte»).',
      'Agrega comentarios al código con el apóstrofo.',
      'Si una tarea depende de datos que llegan cada mes, combina Power Query (limpia) con una macro (da formato e imprime).',
    ],
    microExtra: [
      {
        titulo: 'Macro con botón', tipo: 'hoja', enunciado: 'Graba una macro llamada <b>LimpiarCaptura</b> que seleccione C2:C5 y borre su contenido (tecla Supr). Inserta un botón y asígnale la macro (clic derecho › Asignar macro…).',
        hoja: { hojas: [{ nombre: 'Captura', datos: [['Captura de pedido'], ['Cliente', '', 'Agencia Pixel'], ['Producto', '', 'Latte'], ['Cantidad', '', 20], ['Fecha', '', '21/10/2025']], inicio: 'A1', estilos: { A1: { b: true, fs: 15 }, 'C2:C5': { bg: '#fff8d6' } }, anchos: { A: 110, B: 20, C: 160 }, filas: 10, cols: 6 }], altura: 240 },
        alCrear: (hoja) => { const p = LT.u.h('div'); hoja.raiz.parentNode.insertBefore(p, hoja.raiz); LT.widgets.grabadora(hoja, p, { textoBoton: 'Limpiar captura', nombreMacro: 'LimpiarCaptura' }); },
        pruebas: [
          { tipo: 'fn', fn: (x) => { const m = Object.values(x.hoja.macros || {}); if (!m.length) return 'Graba la macro con «Grabar macro» y «Detener grabación».'; return m.some((y) => y.pasos.some((p) => p.tipo === 'borrar')) ? true : 'La macro debe borrar el contenido (selecciona C2:C5 y pulsa Supr mientras grabas).'; } },
          { tipo: 'fn', fn: (x) => (x.celdas('C2:C5').every((c) => !x.entrada(c.dir)) ? true : 'C2:C5 debe quedar vacío.') },
          { tipo: 'fn', fn: (x) => ((x.estado.hojas[0].objetos || []).some((o) => o.macro) ? true : 'Inserta un botón y asígnale la macro (clic derecho › Asignar macro…).') },
        ],
        pista: ['Grabar macro › nombre LimpiarCaptura › selecciona C2:C5 › Supr › Detener. Luego «Insertar botón», clic derecho › Asignar macro.'],
      }
    ],
    autoeval: [
      { p: '¿Qué diferencia hay entre grabar con referencias absolutas y relativas?', r: 'Con absolutas la macro trabaja siempre en las mismas celdas; con relativas repite los pasos a partir de la celda activa.' },
      { p: '¿En qué formato guardas un libro con macros?', r: 'Libro de Excel habilitado para macros (.xlsm).' },
      { p: '¿Dónde conviene guardar una macro que quieres usar en todos tus libros?', r: 'En el Libro de macros personal (Personal.xlsb), que se abre con Excel en tu equipo.' },
      { p: 'En el código <code>Range("A1").Font.Bold = True</code>, ¿qué es el objeto, qué la propiedad?', r: 'Range("A1") es el objeto; Font.Bold es la propiedad que se cambia a True.' },
      { p: 'Recibes un .xlsm por correo y Excel dice que bloqueó las macros. ¿Qué haces?', r: 'Si confías en el origen y sabes qué hace: clic derecho en el archivo › Propiedades › Desbloquear y abrirlo de nuevo; si no, no lo habilites.' },
      { p: '¿Cómo asignas una macro a un botón?', r: 'Insertas una forma (o un botón de control de formulario), clic derecho › Asignar macro… y eliges la macro.' },
      { p: '¿Qué alternativa a VBA existe en Excel para la web?', r: 'Scripts de Office (pestaña Automatizar), que también se pueden programar con Power Automate.' },
    ],
    conexiones: [
      { id: 4, texto: 'la macro repite los formatos que aprendiste a aplicar a mano.' },
      { id: 5, texto: 'una forma se convierte en botón al asignarle la macro.' },
      { id: 23, texto: 'Power Query automatiza la preparación de datos; la macro, el formato y la salida.' },
      { proyecto: 'avanzado', texto: 'el tablero incluye un botón que actualiza y da formato con un clic.' },
    ],
  });
})();
