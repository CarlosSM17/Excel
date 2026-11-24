/* Módulo 6 · Ver y administrar hojas de cálculo */
(function () {
  const { D, ENC, semana } = LT.caso;
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hojaSucursal = (suc, nombre) => {
    const filas = semana(suc);
    return {
      nombre,
      datos: [
        ['Sucursal ' + suc + ' · Semana 42 (unidades vendidas)'],
        ['Producto', ...DIAS, 'Total'],
        ...filas.map((p, i) => [p.producto, ...p.cantidades, '=SUMA(B' + (i + 3) + ':H' + (i + 3) + ')']),
        ['Total', ...'BCDEFGHI'.split('').map((c) => '=SUMA(' + c + '3:' + c + '10)')],
      ],
      estilos: { A1: { b: true, fs: 15 }, 'A2:I2': ENC, 'A11:I11': { b: true } }, anchos: { A: 120 }, cols: 10, filas: 14,
    };
  };
  const libroReto = () => ({
    hojas: [hojaSucursal('Centro', 'Hoja1'), hojaSucursal('Norte', 'Hoja2'), hojaSucursal('Sur', 'Hoja3'),
      { nombre: 'Hoja4', datos: [['Sucursal', 'Total semana'], ['Centro'], ['Norte'], ['Sur'], ['Total']], estilos: { 'A1:B1': ENC, 'A5:B5': { b: true } }, anchos: { A: 110, B: 110 }, objetivo: 'B2:B5', filas: 10, cols: 5 }],
    editarHojas: true, pestanas: true, herramientas: ['portapapeles', 'vista'], altura: 360,
  });
  const nombreHoja = (x, n) => x.estado.hojas.find((h) => h.nombre.toLowerCase() === n.toLowerCase());
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Hojas de sucursal con su nombre', detener: true, fn: (x) => {
      for (const suc of ['Centro', 'Norte', 'Sur']) {
        const h = nombreHoja(x, suc);
        if (!h) return 'No hay ninguna hoja llamada «' + suc + '». Doble clic en la pestaña para cambiar el nombre (revisa la celda A1 de cada hoja).';
        if (!String(h.celdas.A1 || '').includes(suc)) return 'La hoja «' + suc + '» tiene los datos de otra sucursal: revisa el título en A1 antes de cambiar el nombre.';
      }
      return true;
    } },
    { tipo: 'fn', titulo: 'Hoja «Resumen» al inicio', detener: true, fn: (x) => (!nombreHoja(x, 'Resumen') ? 'Cambia el nombre de Hoja4 a «Resumen».' : x.estado.hojas[0].nombre.toLowerCase() !== 'resumen' ? 'Mueve «Resumen» a la primera posición (clic derecho en la pestaña › Mover a la izquierda).' : true) },
    { tipo: 'fn', titulo: 'Pestañas de sucursal con color', fn: (x) => { const sin = ['Centro', 'Norte', 'Sur'].find((s) => !nombreHoja(x, s).color); return sin ? 'Ponle color a la pestaña «' + sin + '» (clic derecho › Color de pestaña).' : true; } },
    { tipo: 'formula', rango: 'Resumen!B2:B5', titulo: 'Totales con fórmulas', mensaje: '{celda} tiene un número escrito: trae el total con una referencia a la otra hoja.', mensajeVacia: '{celda} está vacía.' },
    { tipo: 'contiene', rango: 'Resumen!B2:B4', texto: '!', titulo: 'Referencias a otras hojas', mensaje: '{celda} debe apuntar a la hoja de la sucursal, por ejemplo =Centro!I11.' },
    { tipo: 'valores', rango: 'Resumen!B2:B5', titulo: 'Totales correctos', mensaje: '{celda} muestra {obtenido}, pero el total es {esperado}: el total de cada sucursal está en I11 de su hoja.' },
    { tipo: 'robustez', cambios: { 'Centro!B3': 99, 'Sur!H10': 50 }, rango: 'Resumen!B2:B5', titulo: 'El resumen se actualiza solo', mensaje: 'Si cambia una venta en otra hoja, {celda} no se actualiza.' },
  ];

  LT.definirModulo({
    id: 6,
    objetivo: 'Crear, renombrar y mover hojas; inmovilizar paneles y usar datos de otra hoja.',
    situacion: 'Cada sucursal me manda su semana en el mismo libro, pero las hojas se llaman Hoja1, Hoja2, Hoja3… <b>Organiza el libro</b>: una hoja por sucursal con su nombre y una hoja <b>Resumen</b> al inicio con el total de cada una.',
    explicacion: [
      { html: '<h3>Las hojas del libro</h3><ul><li><b>Insertar:</b> botón <b>+</b> junto a las pestañas.</li><li><b>Cambiar nombre:</b> doble clic en la pestaña (máximo 31 caracteres, sin <code>/ \\ ? * [ ] :</code>).</li><li><b>Mover:</b> arrastra la pestaña o usa clic derecho.</li><li><b>Color de pestaña, ocultar y mostrar:</b> clic derecho en la pestaña.</li></ul><h3>Inmovilizar paneles</h3><p>En una lista larga, <b>Vista › Inmovilizar</b> deja fijos los encabezados mientras te desplazas. «Inmovilizar paneles» fija lo que está arriba y a la izquierda de la celda activa.</p><h3>Datos de otra hoja</h3><p>Para usar una celda de otra hoja se escribe el nombre de la hoja, un signo de admiración y la celda: <code>=Centro!I11</code>. Si el nombre tiene espacios va entre apóstrofos: <code>=\'Semana 42\'!I11</code>. Lo más fácil: escribe <kbd>=</kbd>, haz clic en la pestaña de la otra hoja, haz clic en la celda y pulsa <kbd>Enter</kbd>.</p>' },
    ],
    ejemplo: {
      titulo: 'Traer el total de otra hoja', intro: 'La fórmula de B2 trae un dato de la hoja Centro. Puedes ver esa hoja con su pestaña, abajo. Predice el resultado.',
      hoja: { hojas: [{ nombre: 'Resumen', datos: [['Sucursal', 'Total semana'], ['Centro']], estilos: { 'A1:B1': ENC }, filas: 6, cols: 4 }, hojaSucursal('Centro', 'Centro')], pestanas: true, altura: 230 },
      celda: 'B2', formula: '=Centro!I11',
      respuesta: semana('Centro').reduce((s, p) => s + p.unidades, 0),
      explicacion: ['<code>Centro!</code> indica la hoja; <code>I11</code> la celda de esa hoja.', 'En la hoja Centro, I11 es el total de la semana: <b>' + semana('Centro').reduce((s, p) => s + p.unidades, 0) + '</b> unidades.', 'Si cambia una venta en Centro, el Resumen se actualiza solo.'],
    },
    micro: [
      {
        titulo: 'Nombre y color de la pestaña', tipo: 'hoja', enunciado: 'Cambia el nombre de «Hoja1» a <b>Centro</b> y ponle color a su pestaña.',
        hoja: { hojas: [hojaSucursal('Centro', 'Hoja1')], editarHojas: true, pestanas: true, altura: 220 },
        pruebas: [{ tipo: 'fn', fn: (x) => { const h = x.estado.hojas[0]; if (h.nombre !== 'Centro') return 'La hoja todavía se llama «' + h.nombre + '»: haz doble clic en la pestaña.'; return h.color ? true : 'Ahora ponle color: clic derecho en la pestaña › Color de pestaña.'; } }],
        pista: ['Doble clic en la pestaña «Hoja1» (abajo), escribe Centro y pulsa Aceptar. Luego clic derecho › Color de pestaña.'],
      },
      {
        titulo: 'Encabezados siempre visibles', tipo: 'hoja', enunciado: 'Esta lista tiene 60 ventas. Inmoviliza la fila de encabezados para que no desaparezca al bajar.',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Folio', 'Fecha', 'Sucursal', 'Producto', 'Total'], ...D.ventas.slice(0, 60).map((v) => [v.folio, LT.caso.fecha(v.fecha), v.sucursal, v.producto, v.total])], formatos: { 'E2:E61': '$#,##0' }, estilos: { 'A1:E1': ENC }, anchos: { D: 150 } }], herramientas: ['vista'], altura: 240 },
        pruebas: [{ tipo: 'fn', fn: (x) => (x.estado.hojas[0].inmov.f === 1 ? true : 'Usa Inmovilizar › Inmovilizar fila superior.') }],
        pista: ['Botón «Inmovilizar» de la barra › «Inmovilizar fila superior».'],
      },
    ],
    reto: {
      titulo: 'Una hoja por sucursal y una de resumen', tipo: 'hoja',
      intro: 'El libro tiene cuatro hojas. Cada una de las tres primeras tiene en A1 el nombre de su sucursal; Hoja4 es el resumen.',
      base: {
        hoja: libroReto(), pruebas: pruebasBase,
        solucion: { 'Resumen!B2': '=Centro!I11', 'Resumen!B3': '=Norte!I11', 'Resumen!B4': '=Sur!I11', 'Resumen!B5': '=SUMA(B2:B4)' },
        instrucciones: ['Cambia el nombre de Hoja1, Hoja2 y Hoja3 por el de su sucursal (lee el título en A1 de cada una).', 'Cambia el nombre de Hoja4 a <b>Resumen</b> y muévela al inicio.', 'Pon color a las pestañas de las tres sucursales.', 'En Resumen, B2:B4: trae el total de la semana de cada sucursal (está en <b>I11</b> de su hoja). En B5 súmalos.'],
        pistas: ['Las pestañas se manejan con doble clic (nombre) y clic derecho (mover, color).', 'Una referencia a otra hoja se escribe <code>=Hoja!Celda</code>; también puedes escribir = y hacer clic en la otra pestaña y en la celda.', 'B2: <code>=Centro!I11</code>, B3: <code>=Norte!I11</code>, B4: <code>=Sur!I11</code>, B5: <code>=SUMA(B2:B4)</code>.'],
      },
      niveles: {
        explorador: { instrucciones: ['Doble clic en la pestaña <b>Hoja1</b>, escribe <b>Centro</b>. Repite: Hoja2 → <b>Norte</b>, Hoja3 → <b>Sur</b>, Hoja4 → <b>Resumen</b>.', 'Clic derecho en «Resumen» › Mover a la izquierda (tres veces) hasta que quede primera.', 'Clic derecho en cada sucursal › Color de pestaña.', 'En Resumen, haz clic en B2, escribe <kbd>=</kbd>, haz clic en la pestaña Centro, haz clic en I11 y pulsa Enter. Repite para Norte (B3) y Sur (B4).', 'En B5 escribe <code>=SUMA(B2:B4)</code>.'] },
        experto: {
          instrucciones: ['Organiza el libro como en el nivel Analista (nombres, Resumen al inicio, colores y totales con referencias).', 'En la hoja <b>Centro</b>, inmoviliza las filas 1–2 y la columna A (celda activa B3 › Inmovilizar paneles).'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Paneles inmovilizados en Centro', fn: (x) => { const h = nombreHoja(x, 'Centro'); return h && h.inmov.f === 2 && h.inmov.c === 1 ? true : 'En Centro, selecciona B3 y usa Inmovilizar › Inmovilizar paneles.'; } }],
        },
      },
    },
    lab: {
      archivo: 'lab06-sucursales.xlsx', titulo: 'Organizar el libro de la semana 43',
      contexto: 'Mismo libro, otra semana: Hoja1 a Hoja3 son las sucursales (lee A1) y Hoja4 el resumen.',
      pasos: {
        explorador: [{ texto: 'Cambia el nombre de cada hoja según su sucursal (doble clic en la pestaña).', ruta: ['Inicio', 'Formato', 'Cambiar el nombre de la hoja'] }, 'Cambia Hoja4 a Resumen y arrástrala al inicio.', { texto: 'Pon color a las pestañas de sucursal.', ruta: ['Inicio', 'Formato', 'Color de pestaña'] }, 'En Resumen B2:B4 escribe =Centro!I11, =Norte!I11, =Sur!I11 y en B5 =SUMA(B2:B4).', 'Guarda y sube el libro.'],
        analista: ['Nombres de hoja por sucursal y «Resumen» al inicio.', 'Color en las pestañas de sucursal.', 'Resumen!B2:B5 con referencias a las otras hojas y su suma.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'En Centro, inmoviliza las filas 1–2 y la columna A.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Hojas con nombre de sucursal', fn: (L) => { for (const s of ['Centro', 'Norte', 'Sur', 'Resumen']) if (!L.hoja(s)) return 'No hay una hoja llamada «' + s + '».'; for (const s of ['Centro', 'Norte', 'Sur']) if (!String(L.valor(s, 'A1') || '').includes(s)) return 'La hoja «' + s + '» tiene los datos de otra sucursal (revisa A1).'; return true; } },
        { titulo: '«Resumen» antes de las sucursales', fn: (L) => { const i = (n) => L.hojas.findIndex((x) => x.nombre.toLowerCase() === n); return i('resumen') < Math.min(i('centro'), i('norte'), i('sur')) ? true : 'Mueve la hoja Resumen antes de las hojas de sucursal.'; } },
        { titulo: 'Pestañas con color', fn: (L) => { const s = ['Centro', 'Norte', 'Sur'].find((x) => !L.hoja(x) || !L.hoja(x).colorPestana); return s ? (L.hoja(s) ? 'La pestaña «' + s + '» no tiene color.' : 'No hay una hoja llamada «' + s + '».') : true; } },
        { titulo: 'Totales con referencias a otras hojas', fn: (L, A) => {
          const sucs = ['Centro', 'Norte', 'Sur'];
          let suma = 0;
          for (let i = 0; i < 3; i++) {
            const d = 'B' + (i + 2);
            const f = L.formula('Resumen', d);
            if (!f || !f.includes('!')) return d + ' debe tener una referencia a la hoja ' + sucs[i] + ' (por ejemplo =' + sucs[i] + '!I11).';
            const esp = A.num(L.valor(sucs[i], 'I11'));
            if (!A.cerca(A.num(L.valor('Resumen', d)), esp)) return d + ' debería mostrar el total de ' + sucs[i] + ': ' + esp + '.';
            suma += esp;
          }
          return L.tieneFormula('Resumen', 'B5') && A.cerca(A.num(L.valor('Resumen', 'B5')), suma) ? true : 'B5 debe sumar B2:B4 con una fórmula.';
        } },
        { titulo: 'Paneles inmovilizados en Centro', nivel: 'experto', fn: (L) => { const h = L.hoja('Centro'); if (!h) return 'No hay una hoja llamada «Centro».'; return h.inmovilizada && h.panel.y >= 2 && h.panel.x >= 1 ? true : 'En Centro, inmoviliza las filas 1–2 y la columna A (celda activa B3).'; } },
      ],
    },
    donde: [
      { comando: 'Inmovilizar paneles', ruta: ['Vista', 'Inmovilizar', 'Inmovilizar paneles'] },
      { comando: 'Inmovilizar fila superior', ruta: ['Vista', 'Inmovilizar', 'Inmovilizar fila superior'] },
      { comando: 'Cambiar el nombre de la hoja', ruta: ['Inicio', 'Formato', 'Cambiar el nombre de la hoja'], nota: 'Lo más rápido: doble clic en la pestaña.' },
      { comando: 'Color de pestaña', ruta: ['Inicio', 'Formato', 'Color de pestaña'], nota: 'También con clic derecho en la pestaña.' },
    ],
    atajos: ['<kbd>Ctrl+AvPág</kbd> / <kbd>Ctrl+RePág</kbd> para pasar a la hoja siguiente o anterior (en Excel).', 'Escribe <kbd>=</kbd> y haz clic en otra pestaña para referirte a otra hoja.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const libro = `<figure class="figura-explica"><svg viewBox="0 0 580 190" role="img" aria-label="Referencias entre hojas">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="20" width="150" height="70" rx="6" fill="#e4f2ea" stroke="#1e7145"/><text x="85" y="40" text-anchor="middle" font-weight="700">Centro</text><text x="85" y="62" text-anchor="middle">I11 = 1,284</text>
  <rect x="10" y="100" width="150" height="70" rx="6" fill="#e5eef9" stroke="#2463a6"/><text x="85" y="120" text-anchor="middle" font-weight="700">Norte</text><text x="85" y="142" text-anchor="middle">I11 = 1,106</text>
  <rect x="200" y="60" width="150" height="70" rx="6" fill="#f1e6f7" stroke="#7b3f9e"/><text x="275" y="80" text-anchor="middle" font-weight="700">Sur</text><text x="275" y="102" text-anchor="middle">I11 = 942</text>
  <rect x="400" y="40" width="170" height="110" rx="6" fill="#fff8d6" stroke="#b7950b"/><text x="485" y="60" text-anchor="middle" font-weight="700">Resumen</text>
  <text x="410" y="84">B2 =Centro!I11</text><text x="410" y="104">B3 =Norte!I11</text><text x="410" y="124">B4 =Sur!I11</text><text x="410" y="144">B5 =SUMA(B2:B4)</text>
  <path d="M160 50 C260 30 330 60 400 82" fill="none" stroke="#1e7145" stroke-width="2" marker-end="url(#fl)"/>
  <path d="M160 135 C260 150 330 120 400 102" fill="none" stroke="#2463a6" stroke-width="2" marker-end="url(#fl)"/>
  <path d="M350 100 L400 120" fill="none" stroke="#7b3f9e" stroke-width="2" marker-end="url(#fl)"/>
  <defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#555"/></marker></defs></g></svg>
  <figcaption>La hoja Resumen no copia números: los trae con referencias <code>Hoja!Celda</code>. Si cambia una sucursal, el resumen se actualiza.</figcaption></figure>`;
  LT.ampliarModulo(6, {
    objetivo: 'Organizar un libro con varias hojas (insertar, renombrar, mover, copiar, ocultar y colorear), inmovilizar paneles y conectar las hojas con referencias.',
    objetivos: [
      'Insertar, renombrar, mover, copiar, ocultar y dar color a las hojas de un libro.',
      'Inmovilizar filas y columnas para que los encabezados no desaparezcan al desplazarse.',
      'Escribir referencias a otras hojas (<code>=Norte!I11</code>) y entender cuándo llevan comillas.',
      'Sumar la misma celda de varias hojas con una referencia 3D.',
      'Usar vistas: dividir la ventana, nueva ventana y zoom.',
    ],
    detalle: [
      { titulo: 'Cómo se conectan las hojas', abierto: true, html: libro + '<p>La forma más segura de escribir la referencia es con el ratón: escribe <code>=</code>, haz clic en la pestaña de la otra hoja, haz clic en la celda y pulsa <kbd>Enter</kbd>. Si el nombre de la hoja tiene espacios o acentos raros, Excel lo pone entre comillas simples: <code>=\'Semana 42\'!B5</code>.</p>' },
      { titulo: 'Referencias 3D: la misma celda en varias hojas', html: '<p>Cuando las hojas tienen <b>exactamente la misma estructura</b>, <code>=SUMA(Centro:Sur!I11)</code> suma I11 de todas las hojas que están <b>entre</b> Centro y Sur en el orden de las pestañas. Es muy cómodo para consolidar meses o sucursales, pero tiene un riesgo: si mueves una hoja fuera del intervalo deja de sumarse, y si metes una hoja nueva dentro, se suma sin avisar. (El simulador del curso no calcula referencias 3D; practícalas en Excel.)</p>' },
      { titulo: 'Inmovilizar, dividir y ver dos hojas a la vez', html: '<table><tr><th>Herramienta</th><th>Qué hace</th><th>Ruta</th></tr><tr><td>Inmovilizar fila superior</td><td>La fila 1 queda fija</td><td>Vista › Inmovilizar</td></tr><tr><td>Inmovilizar paneles</td><td>Fija las filas de arriba y las columnas a la izquierda de la celda seleccionada (selecciona B2 para fijar fila 1 y columna A)</td><td>Vista › Inmovilizar</td></tr><tr><td>Dividir</td><td>Parte la ventana en 2 o 4 zonas que se desplazan por separado</td><td>Vista › Dividir</td></tr><tr><td>Nueva ventana + Organizar todo</td><td>Muestra dos hojas del mismo libro lado a lado</td><td>Vista › Nueva ventana</td></tr></table>' },
      { titulo: 'Copiar una hoja sin perder fórmulas', html: '<p>Clic derecho en la pestaña › <b>Mover o copiar</b> › marca <b>Crear una copia</b>. La copia conserva formato, anchos y fórmulas (también puedes arrastrar la pestaña con <kbd>Ctrl</kbd> presionado). Copiar y pegar las celdas, en cambio, pierde los anchos de columna y la configuración de impresión.</p>' },
    ],
    errores: [
      'Copiar y pegar el número del total en el resumen: al cambiar la sucursal, el resumen queda viejo.',
      'Renombrar una hoja con espacios y escribir la referencia sin comillas simples.',
      'Inmovilizar con la celda equivocada seleccionada (se inmovilizan demasiadas filas).',
      'Ocultar una hoja con datos que otros necesitan y olvidar que existe.',
    ],
    consejos: [
      'Nombra las hojas con nombres cortos y sin espacios (Centro, Norte, Resumen).',
      'Pon la hoja Resumen al principio y las de detalle después; usa colores de pestaña por tipo.',
      'Navega entre hojas con <kbd>Ctrl</kbd>+<kbd>Re Pág</kbd> / <kbd>Av Pág</kbd>; clic derecho en las flechas de las pestañas muestra la lista de todas.',
      'Para editar varias hojas iguales a la vez, agrúpalas con <kbd>Ctrl</kbd>+clic en las pestañas (y desagrúpalas al terminar).',
    ],
    microExtra: [
      { titulo: 'Referencia 3D', tipo: 'opcion', enunciado: 'Las hojas Centro, Norte y Sur (en ese orden) tienen el total de la semana en I11. ¿Qué fórmula los suma en la hoja Resumen?', opciones: ['=SUMA(Centro:Sur!I11)', '=SUMA(Centro!I11:Sur!I11)', '=Centro:Sur(I11)', '=SUMA(I11)'], correcta: 0, explicacion: 'Hoja inicial:Hoja final!Celda es una referencia 3D. Equivale a =Centro!I11+Norte!I11+Sur!I11 mientras Norte siga entre las dos.', retro: { 1: 'El rango 3D se escribe Hoja1:Hoja3!Celda, con las hojas juntas antes del signo !.', 3: 'Así solo sumarías I11 de la hoja actual.' } },
      { titulo: 'Duplicar una hoja', tipo: 'opcion', enunciado: 'Quieres una hoja «Diciembre» idéntica a «Noviembre» (formato, anchos y fórmulas) para capturar el mes nuevo. ¿Qué haces?', opciones: ['Clic derecho en la pestaña › Mover o copiar › Crear una copia', 'Seleccionar todo, copiar y pegar en una hoja nueva', 'Insertar una hoja y volver a escribir todo', 'Ocultar Noviembre y mostrarla con otro nombre'], correcta: 0, explicacion: 'La copia de hoja conserva anchos, formato, fórmulas y configuración de impresión. Luego solo cámbiale el nombre.', retro: { 1: 'Copiar celdas no copia los anchos de columna ni la configuración de página.' } },
    ],
    autoeval: [
      { p: 'Escribe la referencia a la celda B5 de una hoja llamada «Semana 42».', r: '<code>=\'Semana 42\'!B5</code>: el nombre va entre comillas simples porque tiene un espacio.' },
      { p: '¿Qué celda seleccionas para inmovilizar a la vez la fila 1 y la columna A?', r: 'B2, y luego Vista › Inmovilizar › Inmovilizar paneles.' },
      { p: '¿Qué riesgo tiene <code>=SUMA(Ene:Dic!B5)</code>?', r: 'Suma todas las hojas que estén entre Ene y Dic según el orden de las pestañas: si mueves o insertas hojas en ese intervalo, el total cambia sin avisar.' },
      { p: '¿Cómo ves la hoja Centro y la hoja Resumen al mismo tiempo?', r: 'Vista › Nueva ventana y luego Vista › Organizar todo (por ejemplo, en vertical); en cada ventana eliges una hoja.' },
      { p: 'Cambiaste el nombre de la hoja «Hoja2» a «Norte». ¿Qué pasa con las fórmulas que decían <code>=Hoja2!I11</code>?', r: 'Excel las actualiza solas a <code>=Norte!I11</code>.' },
      { p: '¿Para qué sirve agrupar hojas y qué cuidado hay que tener?', r: 'Para escribir o dar formato en varias hojas a la vez. Hay que desagruparlas al terminar, porque todo lo que escribas se repite en todas.' },
      { p: '¿Qué diferencia hay entre ocultar una hoja y eliminarla?', r: 'Oculta sigue existiendo y sus datos se pueden usar en fórmulas; eliminarla borra la hoja y deja #¡REF! en las fórmulas que la usaban.' },
    ],
    conexiones: [
      { id: 3, texto: 'sumas en la hoja Resumen con SUMA sobre las referencias traídas.' },
      { id: 8, texto: 'imprimes varias hojas a la vez y defines su configuración de página.' },
      { id: 16, texto: 'proteges la estructura del libro para que nadie borre o mueva hojas.' },
      { id: 23, texto: 'Power Query une datos de varias hojas o archivos sin referencias manuales.' },
    ],
  });
})();
