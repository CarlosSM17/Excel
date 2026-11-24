/* Módulo 10 · Resumir con condiciones (versión 3) */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const emp = D.empleados;
  const CATS = D.categorias;
  const SUCS = ['Centro', 'Norte', 'Sur'];
  const oct = D.ventas.filter((v) => v.fecha.slice(5, 7) === '10');
  const N = oct.length; // 60 ventas de octubre
  const ultima = N + 1;
  const hojaVentas = () => ({ nombre: 'Ventas', datos: [['Fecha', 'Sucursal', 'Categoría', 'Producto', 'Cantidad', 'Total'], ...oct.map((v) => [fecha(v.fecha), v.sucursal, v.categoria, v.producto, v.cantidad, v.total])], formatos: { ['F2:F' + ultima]: '$#,##0' }, estilos: { 'A1:F1': ENC }, anchos: { A: 86, B: 70, C: 106, D: 150, E: 66, F: 76 }, inmovilizar: { filas: 1 } });
  const hojaResumen = (experto) => ({
    nombre: 'Resumen',
    datos: [['Ventas de octubre por categoría y sucursal'], ['Categoría', ...SUCS, 'Total'], ...CATS.map((c) => [c]), ['Total']],
    celdas: experto ? { A11: 'Tickets', A12: 'Ticket promedio', A13: 'Venta más alta' } : {},
    formatos: { 'B3:E9': '$#,##0', 'B12:D13': '$#,##0.00' },
    estilos: { A1: { b: true, fs: 14 }, 'A2:E2': ENC, 'A9:E9': { b: true }, 'A11:A13': { b: true } },
    anchos: { A: 130, B: 90, C: 90, D: 90, E: 96 },
    objetivo: experto ? 'B3:E9,B11:D13' : 'B3:E9',
  });
  const R = (c) => 'Ventas!$' + c + '$2:$' + c + '$' + ultima;
  const solBase = {
    'Resumen!B3:D8': '=SUMAR.SI.CONJUNTO(' + R('F') + ',' + R('C') + ',$A3,' + R('B') + ',B$2)',
    'Resumen!E3:E8': '=SUMA(B3:D3)',
    'Resumen!B9:E9': '=SUMA(B3:B8)',
  };
  const solExperto = Object.assign({}, solBase, {
    'Resumen!B11:D11': '=CONTAR.SI(' + R('B') + ',B$2)',
    'Resumen!B12:D12': '=PROMEDIO.SI(' + R('B') + ',B$2,' + R('F') + ')',
    'Resumen!B13:D13': '=MAX.SI.CONJUNTO(' + R('F') + ',' + R('B') + ',B$2)',
  });
  const pruebasBase = [
    { tipo: 'formula', rango: 'Resumen!B3:E9', titulo: 'El resumen usa fórmulas', mensaje: '{celda} tiene un número escrito: calcúlalo con una fórmula.', mensajeVacia: '{celda} está vacía: copia la fórmula a toda la matriz.' },
    { tipo: 'usa', rango: 'Resumen!B3:D8', funciones: ['SUMAR.SI.CONJUNTO'], titulo: 'Dos condiciones con SUMAR.SI.CONJUNTO', mensaje: 'En {celda} suma con dos condiciones (categoría y sucursal) usando SUMAR.SI.CONJUNTO.' },
    { tipo: 'valores', rango: 'Resumen!B3:E9', titulo: 'Los importes son correctos', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}: ¿fijaste las columnas de Ventas con $ y usaste $A3 y B$2 como criterios?' },
    { tipo: 'robustez', cambios: [{ 'Ventas!F2': 5000 }, { 'Ventas!B3': 'Sur', 'Ventas!C4': 'Té' }], rango: 'Resumen!B3:E9', titulo: 'El resumen se actualiza si cambian las ventas', mensaje: 'Al cambiar una venta, {celda} no se actualiza bien (muestra {obtenido} y debería mostrar {esperado}): ¿el rango llega hasta la fila ' + ultima + '?' },
  ];
  const ejemploDatos = [['Vendedor', 'Sucursal', 'Ventas', '', 'Sucursal', 'Ventas'], ...emp.map((e, i) => [e.nombre, e.sucursal, e.ventasMes, '', i === 0 ? 'Norte' : ''])];
  const totalNorte = emp.filter((e) => e.sucursal === 'Norte').reduce((s, e) => s + e.ventasMes, 0);

  LT.definirModulo({
    id: 10,
    objetivo: 'Contar, sumar, promediar y obtener máximos con una o varias condiciones (CONTAR.SI, SUMAR.SI, PROMEDIO.SI y sus versiones .CONJUNTO) y armar matrices de resumen con referencias mixtas.',
    situacion: 'Necesito saber <b>cuánto vendimos en octubre de cada categoría en cada sucursal</b>, sin tablas dinámicas todavía: una matriz que se actualice sola cuando corrijamos alguna venta.',
    explicacion: [
      { html: '<h3>Tres preguntas, tres funciones</h3><ul><li><b>¿Cuántos?</b> <code>=CONTAR.SI(rango, criterio)</code>: <code>=CONTAR.SI(B2:B21,"Norte")</code> cuenta los vendedores de Norte.</li><li><b>¿Cuánto suman?</b> <code>=SUMAR.SI(rango_criterio, criterio, rango_suma)</code>: <code>=SUMAR.SI(B2:B21,"Norte",C2:C21)</code> suma las ventas de Norte. El rango que se evalúa y el que se suma tienen el mismo tamaño y van alineados fila por fila.</li><li><b>¿Cuánto en promedio?</b> <code>=PROMEDIO.SI(B2:B21,"Norte",C2:C21)</code>.</li></ul><h3>Cómo se escribe un criterio</h3><table class="tabla-sitio"><tr><th>Quieres</th><th>Criterio</th></tr><tr><td>Igual a un texto</td><td><code>"Norte"</code> (o una celda: <code>E2</code>)</td></tr><tr><td>Mayor o igual a un número</td><td><code>"&gt;=10000"</code></td></tr><tr><td>Mayor o igual al valor de una celda</td><td><code>"&gt;="&amp;F1</code></td></tr><tr><td>Distinto de</td><td><code>"&lt;&gt;Centro"</code></td></tr><tr><td>Empieza con</td><td><code>"Café*"</code> (comodín *)</td></tr><tr><td>Celdas vacías / no vacías</td><td><code>""</code> / <code>"&lt;&gt;"</code></td></tr></table>' },
      { html: '<h3>Varias condiciones: las versiones .CONJUNTO</h3><p>Cuando hay más de una condición (sucursal <b>y</b> categoría), usa <code>SUMAR.SI.CONJUNTO</code>, <code>CONTAR.SI.CONJUNTO</code>, <code>PROMEDIO.SI.CONJUNTO</code>, <code>MAX.SI.CONJUNTO</code> o <code>MIN.SI.CONJUNTO</code>. ¡Ojo con el orden! En SUMAR.SI el rango a sumar va al final; en SUMAR.SI.CONJUNTO va <b>primero</b>:</p><p><code>=SUMAR.SI.CONJUNTO(rango_suma, rango_criterios1, criterio1, rango_criterios2, criterio2, …)</code></p><p>Todas las condiciones deben cumplirse a la vez (es un «Y»). Para un «O» (Norte <b>o</b> Sur) se suman dos SUMAR.SI.</p>' },
      { titulo: 'Pruébalo: arma un criterio', instr: 'Cambia la sucursal de E2 (Centro, Norte o Sur) y observa cómo cambia F2. Luego prueba en F2 otras funciones: <code>=CONTAR.SI(B2:B21,E2)</code> o <code>=PROMEDIO.SI(B2:B21,E2,C2:C21)</code>.', hoja: { altura: 250, hojas: [{ nombre: 'Equipo', datos: ejemploDatos, celdas: { F2: '=SUMAR.SI(B2:B21,E2,C2:C21)' }, formatos: { 'C2:C21': '$#,##0', F2: '$#,##0' }, estilos: { 'A1:C1': ENC, 'E1:F1': ENC, E2: { bg: '#fff8d6', b: true } }, anchos: { A: 140, E: 90, F: 90 }, filas: 22, cols: 7 }], herramientas: ['formulas'] } },
    ],
    ejemplo: {
      titulo: 'Ventas de la sucursal Norte',
      hoja: { hojas: [{ nombre: 'Equipo', datos: ejemploDatos, formatos: { 'C2:C21': '$#,##0', F2: '$#,##0' }, estilos: { 'A1:C1': ENC, 'E1:F1': ENC }, anchos: { A: 140 }, filas: 22, cols: 7 }], altura: 220 },
      celda: 'F2', formula: '=SUMAR.SI(B2:B21,E2,C2:C21)',
      pregunta: '¿Cuánto mostrará F2?', respuesta: totalNorte, formato: '$#,##0',
      explicacion: [
        'Excel recorre B2:B21 (el <b>rango del criterio</b>) y marca las filas donde la sucursal es igual a E2, «Norte».',
        'De esas mismas filas toma los valores de C2:C21 (el <b>rango de suma</b>): Héctor, Isabel, Jorge, Karen, Leonardo y Mariana.',
        'Los suma: <b>$' + LT.u.formatoMiles(totalNorte) + '</b>. Si cambias E2 a «Sur», la misma fórmula da el total de Sur.',
      ],
    },
    micro: [
      {
        titulo: 'Contar con un criterio', tipo: 'hoja',
        enunciado: 'En F2 cuenta cuántas personas del equipo son <b>Barista</b> y en F3 cuántas venden <b>10,000 o más</b>.',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Vendedor', 'Sucursal', 'Puesto', 'Ventas'], ...emp.map((e) => [e.nombre, e.sucursal, e.puesto, e.ventasMes])], celdas: { E2: 'Baristas', E3: 'Con 10,000 o más' }, formatos: { 'D2:D21': '$#,##0' }, estilos: { 'A1:D1': ENC, 'E2:E3': { b: true } }, anchos: { A: 140, C: 96, E: 130 }, objetivo: 'F2:F3', filas: 22, cols: 7 }], herramientas: ['formulas'] },
        solucion: { F2: '=CONTAR.SI(C2:C21,"Barista")', F3: '=CONTAR.SI(D2:D21,">=10000")' },
        pruebas: [{ tipo: 'usa', rango: 'F2:F3', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'En {celda} usa CONTAR.SI.' }, { tipo: 'valores', rango: 'F2:F3', mensaje: '{celda} muestra {obtenido}, pero son {esperado}. ¿Pusiste el criterio entre comillas (">=10000")?' }],
        pista: ['<code>=CONTAR.SI(C2:C21,"Barista")</code>', '<code>=CONTAR.SI(D2:D21,"&gt;=10000")</code>'],
      },
      {
        titulo: 'Sumar y contar con condición', tipo: 'hoja',
        enunciado: 'En F2 calcula el total de ventas de la sucursal <b>Centro</b> y en F3 cuenta cuántos vendedores trabajan en <b>Norte</b>.',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Vendedor', 'Sucursal', 'Ventas'], ...emp.map((e) => [e.nombre, e.sucursal, e.ventasMes])], celdas: { E2: 'Ventas de Centro', E3: 'Vendedores de Norte' }, formatos: { 'C2:C21': '$#,##0', F2: '$#,##0' }, estilos: { 'A1:C1': ENC, 'E2:E3': { b: true } }, anchos: { A: 140, E: 160 }, objetivo: 'F2:F3' }], herramientas: ['formulas'] },
        solucion: { F2: '=SUMAR.SI(B2:B21,"Centro",C2:C21)', F3: '=CONTAR.SI(B2:B21,"Norte")' },
        pruebas: [
          { tipo: 'usa', rango: 'F2', funciones: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F2 usa SUMAR.SI.' },
          { tipo: 'valores', rango: 'F2', mensaje: 'F2 muestra {obtenido}; las ventas de Centro suman {esperado}. Revisa el orden: SUMAR.SI(rango_criterio, criterio, rango_suma).' },
          { tipo: 'usa', rango: 'F3', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F3 usa CONTAR.SI.' },
          { tipo: 'valores', rango: 'F3', mensaje: 'F3 muestra {obtenido}, pero en Norte hay {esperado} vendedores.' },
        ],
        pista: ['<code>=SUMAR.SI(B2:B21,"Centro",C2:C21)</code>', '<code>=CONTAR.SI(B2:B21,"Norte")</code>'],
      },
      {
        titulo: 'Dos condiciones', tipo: 'hoja',
        enunciado: 'Con las ventas de octubre, calcula en <b>I2</b> cuánto vendió <b>Norte</b> en la categoría <b>Postres</b>, y en <b>I3</b> cuántas ventas de <b>Sur</b> fueron de <b>Café frío</b>.',
        hoja: { hojas: [Object.assign(hojaVentas(), { celdas: { H2: 'Norte · Postres', H3: 'Sur · Café frío (ventas)' }, formatos: { ['F2:F' + ultima]: '$#,##0', I2: '$#,##0' }, estilos: { 'A1:F1': ENC, 'H2:H3': { b: true } }, anchos: { A: 86, B: 70, C: 106, D: 150, E: 66, F: 76, G: 20, H: 170, I: 90 }, objetivo: 'I2:I3' })], herramientas: ['formulas'] },
        solucion: { I2: '=SUMAR.SI.CONJUNTO(F2:F' + ultima + ',B2:B' + ultima + ',"Norte",C2:C' + ultima + ',"Postres")', I3: '=CONTAR.SI.CONJUNTO(B2:B' + ultima + ',"Sur",C2:C' + ultima + ',"Café frío")' },
        pruebas: [
          { tipo: 'usa', rango: 'I2', funciones: ['SUMAR.SI.CONJUNTO'], mensaje: 'En I2 usa SUMAR.SI.CONJUNTO: el rango a sumar va primero.' },
          { tipo: 'usa', rango: 'I3', funciones: ['CONTAR.SI.CONJUNTO'], mensaje: 'En I3 usa CONTAR.SI.CONJUNTO.' },
          { tipo: 'valores', rango: 'I2:I3', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. ¿Los rangos llegan hasta la fila ' + ultima + '?' },
        ],
        pista: ['<code>=SUMAR.SI.CONJUNTO(F2:F' + ultima + ', B2:B' + ultima + ', "Norte", C2:C' + ultima + ', "Postres")</code>', '<code>=CONTAR.SI.CONJUNTO(B2:B' + ultima + ', "Sur", C2:C' + ultima + ', "Café frío")</code>'],
      },
      {
        titulo: 'Criterio desde una celda', tipo: 'hoja',
        enunciado: 'La meta está en F1. En <b>F3</b> cuenta cuántos vendedores la alcanzan y en <b>F4</b> calcula el <b>promedio de ventas</b> de quienes la alcanzan. Usa la celda F1 en el criterio (no escribas 10000).',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Vendedor', 'Sucursal', 'Ventas', '', 'Meta', 10000], ...emp.map((e) => [e.nombre, e.sucursal, e.ventasMes])], celdas: { E3: 'La alcanzan', E4: 'Promedio de ellos' }, formatos: { 'C2:C21': '$#,##0', F1: '$#,##0', F4: '$#,##0.00' }, estilos: { 'A1:C1': ENC, 'E1:E4': { b: true }, F1: { bg: '#fff8d6' } }, anchos: { A: 140, E: 130 }, objetivo: 'F3:F4' }], herramientas: ['formulas'] },
        solucion: { F3: '=CONTAR.SI(C2:C21,">="&F1)', F4: '=PROMEDIO.SI(C2:C21,">="&F1)' },
        pruebas: [
          { tipo: 'usa', rango: 'F3', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F3 usa CONTAR.SI.' },
          { tipo: 'usa', rango: 'F4', funciones: ['PROMEDIO.SI'], mensaje: 'En F4 usa PROMEDIO.SI.' },
          { tipo: 'valores', rango: 'F3:F4' },
          { tipo: 'robustez', cambios: { F1: 12000 }, rango: 'F3:F4', mensaje: 'Al cambiar la meta a 12,000, {celda} no se actualiza: une el operador con la celda así: ">="&F1.' },
        ],
        pista: ['El criterio se arma uniendo texto y celda: <code>"&gt;="&amp;F1</code>.', '<code>=CONTAR.SI(C2:C21,"&gt;="&amp;F1)</code> y <code>=PROMEDIO.SI(C2:C21,"&gt;="&amp;F1)</code>'],
      },
    ],
    reto: {
      titulo: 'Resumen de ventas por sucursal y categoría', tipo: 'hoja',
      intro: 'La hoja <i>Ventas</i> tiene las ' + N + ' ventas de octubre (filas 2 a ' + ultima + '): B = sucursal, C = categoría, F = total. La hoja <i>Resumen</i> tiene las categorías en A3:A8 y las sucursales en B2:D2.',
      base: {
        hoja: { hojas: [hojaVentas(), hojaResumen(false)], pestanas: true, activa: 'Resumen', herramientas: ['portapapeles', 'formulas'], altura: 420 },
        solucion: solBase,
        pruebas: pruebasBase,
        instrucciones: ['En <b>Resumen!B3</b>, suma el total de Ventas cuya categoría sea la de A3 y cuya sucursal sea la de B2. Escribe <b>una sola fórmula</b> que puedas copiar a todo B3:D8.', 'En <b>E3:E8</b>, el total de cada categoría; en <b>B9:E9</b>, el total de cada columna.'],
        pistas: ['Dos condiciones a la vez: SUMAR.SI.CONJUNTO.', 'Fija los rangos de Ventas (<code>Ventas!$F$2:$F$' + ultima + '</code>) y usa referencias mixtas: <code>$A3</code> (la columna de categorías no se mueve) y <code>B$2</code> (la fila de sucursales no se mueve).', '<code>=SUMAR.SI.CONJUNTO(Ventas!$F$2:$F$' + ultima + ', Ventas!$C$2:$C$' + ultima + ', $A3, Ventas!$B$2:$B$' + ultima + ', B$2)</code>'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'Resumen!B3', texto: '=SUMAR.SI.CONJUNTO(Ventas!$F$2:$F$' + ultima + ', Ventas!$C$2:$C$' + ultima + ', ___, Ventas!$B$2:$B$' + ultima + ', ___)', copiar: 'D8' },
          instrucciones: ['Completa los dos criterios de la fórmula: la categoría está en la columna A (fíjala con <code>$A3</code>) y la sucursal en la fila 2 (fíjala con <code>B$2</code>).', 'Pulsa «Escribir en Resumen!B3», ve a la hoja Resumen y copia B3 hacia la derecha hasta D3 y luego hacia abajo hasta la fila 8.', 'En E3 escribe <code>=SUMA(B3:D3)</code> y cópiala hasta E8; en B9 escribe <code>=SUMA(B3:B8)</code> y cópiala hasta E9.'],
        },
        experto: {
          hoja: { hojas: [hojaVentas(), hojaResumen(true)], pestanas: true, activa: 'Resumen', herramientas: ['portapapeles', 'formulas'], altura: 440 },
          solucion: solExperto,
          pruebas: pruebasBase.concat([
            { tipo: 'usa', rango: 'Resumen!B11:D11', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, titulo: 'Tickets por sucursal con CONTAR.SI', mensaje: 'En {celda} cuenta las ventas de la sucursal con CONTAR.SI.' },
            { tipo: 'usa', rango: 'Resumen!B12:D12', funciones: ['PROMEDIO.SI', 'PROMEDIO.SI.CONJUNTO'], alguna: true, titulo: 'Ticket promedio con PROMEDIO.SI', mensaje: 'En {celda} usa PROMEDIO.SI.' },
            { tipo: 'usa', rango: 'Resumen!B13:D13', funciones: ['MAX.SI.CONJUNTO'], titulo: 'Venta más alta con MAX.SI.CONJUNTO', mensaje: 'En {celda} usa MAX.SI.CONJUNTO.' },
            { tipo: 'valores', rango: 'Resumen!B11:D13', titulo: 'Indicadores por sucursal correctos', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}.' },
          ]),
          instrucciones: ['Arma la matriz B3:E9 como en el nivel Analista, con una sola fórmula copiada.', 'En B11:D11, el número de ventas (tickets) de cada sucursal; en B12:D12, el ticket promedio (PROMEDIO.SI); en B13:D13, la venta más alta (MAX.SI.CONJUNTO). Usa la sucursal de la fila 2 como criterio.'],
          pistas: ['Para la fila 11 basta CONTAR.SI sobre la columna de sucursales.', '<code>=MAX.SI.CONJUNTO(rango_max, rango_criterios, criterio)</code>', '<code>=MAX.SI.CONJUNTO(Ventas!$F$2:$F$' + ultima + ', Ventas!$B$2:$B$' + ultima + ', B$2)</code>'],
        },
      },
    },
    lab: {
      archivo: 'lab10-resumen-anual.xlsx', titulo: 'Resumen anual por mes y sucursal', hoja: 'Resumen',
      contexto: 'El mismo tipo de resumen con las 720 ventas de 2025: cada fila de <i>Ventas</i> trae el número de mes en la columna L.',
      sol: {
        'Resumen!B4:D15': '=SUMIFS(Ventas!$I$2:$I$721,Ventas!$C$2:$C$721,B$3,Ventas!$L$2:$L$721,$A4)',
        'Resumen!E4:E15': '=SUM(B4:D4)', 'Resumen!B16:E16': '=SUM(B4:B15)',
        'Resumen!H4:H6': '=COUNTIF(Ventas!$C$2:$C$721,G4)', 'Resumen!I4:I6': '=AVERAGEIF(Ventas!$C$2:$C$721,G4,Ventas!$I$2:$I$721)',
        'Resumen!J4:J6': '=MAXIFS(Ventas!$I$2:$I$721,Ventas!$C$2:$C$721,G4)',
        'Resumen!H9': '=SUMIFS(Ventas!$I$2:$I$721,Ventas!$C$2:$C$721,"Norte",Ventas!$F$2:$F$721,"Alimentos",Ventas!$L$2:$L$721,12)',
      },
      pasos: {
        explorador: [
          { texto: 'En <b>Resumen!B4</b> escribe <code>=SUMAR.SI.CONJUNTO(Ventas!$I$2:$I$721, Ventas!$C$2:$C$721, B$3, Ventas!$L$2:$L$721, $A4)</code> y cópiala a B4:D15.', ruta: ['Fórmulas', 'Matemáticas y trigonométricas'] },
          'En E4:E15 suma cada mes y en B16:E16 suma cada columna.',
          'En H4:H6 cuenta las ventas de cada sucursal (CONTAR.SI) y en I4:I6 calcula su ticket promedio (PROMEDIO.SI).',
          'Guarda el libro y súbelo aquí.',
        ],
        analista: ['En Resumen!B4:D15, ventas de cada mes (A) y sucursal (fila 3), con una sola fórmula copiada.', 'Totales en E4:E15 y B16:E16.', 'En H4:H6, el número de ventas de cada sucursal; en I4:I6, su ticket promedio.', 'Guarda y sube el libro.'],
        experto: ['Resuelve todo lo del nivel Analista.', 'En J4:J6, la venta más alta de cada sucursal (MAX.SI.CONJUNTO).', 'En H9, cuánto vendió Norte de Alimentos en diciembre (tres condiciones).', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { t: 'formula', r: 'Resumen!B4:E16', titulo: 'La matriz mensual usa fórmulas' },
        { t: 'usa', r: 'Resumen!B4:D15', f: ['SUMIFS'], titulo: 'Mes y sucursal con SUMAR.SI.CONJUNTO' },
        { t: 'valores', r: 'Resumen!B4:E16', titulo: 'Ventas mensuales correctas' },
        { t: 'robustez', r: 'Resumen!B4:E16', cambios: [{ 'Ventas!I2': 9999 }, { 'Ventas!C10': 'Centro', 'Ventas!L11': 7 }], titulo: 'El resumen se actualiza si cambian las ventas' },
        { t: 'usa', r: 'Resumen!H4:H6', f: ['COUNTIF', 'COUNTIFS'], titulo: 'Ventas por sucursal con CONTAR.SI' },
        { t: 'usa', r: 'Resumen!I4:I6', f: ['AVERAGEIF', 'AVERAGEIFS'], titulo: 'Ticket promedio con PROMEDIO.SI' },
        { t: 'valores', r: 'Resumen!H4:I6', titulo: 'Indicadores por sucursal correctos' },
        { t: 'usa', r: 'Resumen!J4:J6', f: ['MAXIFS'], nivel: 'experto', titulo: 'Venta más alta con MAX.SI.CONJUNTO' },
        { t: 'valores', r: 'Resumen!J4:J6,Resumen!H9', nivel: 'experto', titulo: 'Máximos y consulta con tres condiciones' },
      ],
    },
    donde: [
      { comando: 'Funciones matemáticas (SUMAR.SI, SUMAR.SI.CONJUNTO)', ruta: ['Fórmulas', 'Matemáticas y trigonométricas'] },
      { comando: 'Funciones estadísticas (CONTAR.SI, PROMEDIO.SI)', ruta: ['Fórmulas', 'Más funciones', 'Estadísticas'] },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'], nota: 'El asistente muestra el papel de cada argumento.' },
    ],
    glosario: ['CONTAR.SI', 'SUMAR.SI', 'PROMEDIO.SI', 'CONTAR.SI.CONJUNTO', 'SUMAR.SI.CONJUNTO', 'PROMEDIO.SI.CONJUNTO', 'MAX.SI.CONJUNTO', 'MIN.SI.CONJUNTO', 'SUMAPRODUCTO', 'K.ESIMO.MAYOR'],
    atajos: ['<kbd>F4</kbd> fija los rangos de búsqueda: <code>$F$2:$F$61</code>.', '<kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>↓</kbd> selecciona la columna de datos completa mientras escribes la fórmula.'],
  });

  /* información a detalle, autoevaluación y conexiones */
  const matriz = `<figure class="figura-explica"><svg viewBox="0 0 600 200" role="img" aria-label="Matriz de resumen con referencias mixtas">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="10" width="110" height="26" fill="#f3ebdf" stroke="#ccc"/><text x="18" y="28">Categoría</text>
  <rect x="120" y="10" width="90" height="26" fill="#e7effc" stroke="#2259b8"/><text x="165" y="28" text-anchor="middle">B$2 Centro</text>
  <rect x="210" y="10" width="90" height="26" fill="#e7effc" stroke="#2259b8"/><text x="255" y="28" text-anchor="middle">C$2 Norte</text>
  <rect x="300" y="10" width="90" height="26" fill="#e7effc" stroke="#2259b8"/><text x="345" y="28" text-anchor="middle">D$2 Sur</text>
  <rect x="10" y="36" width="110" height="26" fill="#e2f1e8" stroke="#1e7145"/><text x="18" y="54">$A3 Café caliente</text>
  <rect x="10" y="62" width="110" height="26" fill="#e2f1e8" stroke="#1e7145"/><text x="18" y="80">$A4 Café frío</text>
  <rect x="10" y="88" width="110" height="26" fill="#e2f1e8" stroke="#1e7145"/><text x="18" y="106">$A5 Té…</text>
  <rect x="120" y="36" width="270" height="78" fill="#fff" stroke="#ccc"/><rect x="120" y="36" width="90" height="26" fill="#fff8d6" stroke="#b7950b" stroke-width="2"/>
  <text x="410" y="40">B3 = SUMAR.SI.CONJUNTO(</text><text x="420" y="58">Ventas!$F$2:$F$61,</text><text x="420" y="76">Ventas!$C$2:$C$61, $A3,</text><text x="420" y="94">Ventas!$B$2:$B$61, B$2)</text>
  <text x="10" y="146">Copiada a D8: los rangos de Ventas no se mueven ($$), $A3 baja por las categorías y B$2 avanza por las sucursales.</text>
  <text x="10" y="170">Una sola fórmula llena las 18 celdas de la matriz.</text></g></svg></figure>`;
  LT.ampliarModulo(10, {
    objetivos: [
      'Escribir criterios de texto, de número, con comparación, con comodines y tomados de una celda.',
      'Contar, sumar y promediar con una condición (CONTAR.SI, SUMAR.SI, PROMEDIO.SI).',
      'Aplicar varias condiciones a la vez con las funciones .CONJUNTO, respetando el orden de sus argumentos.',
      'Construir una matriz de resumen con una sola fórmula y referencias mixtas.',
      'Obtener máximos y mínimos condicionados y reconocer cuándo conviene una tabla dinámica.',
    ],
    detalle: [
      { titulo: 'Una fórmula para toda la matriz', abierto: true, html: matriz },
      { titulo: 'SUMAR.SI frente a SUMAR.SI.CONJUNTO: el orden cambia', html: '<table><tr><th></th><th>Primer argumento</th><th>Después</th></tr><tr><td>SUMAR.SI</td><td>rango del criterio</td><td>criterio, <b>rango_suma</b> (al final, opcional)</td></tr><tr><td>SUMAR.SI.CONJUNTO</td><td><b>rango_suma</b></td><td>pares rango_criterios, criterio</td></tr><tr><td>PROMEDIO.SI</td><td>rango del criterio</td><td>criterio, rango_promedio</td></tr><tr><td>PROMEDIO.SI.CONJUNTO / MAX.SI.CONJUNTO</td><td>rango a promediar / maximizar</td><td>pares rango_criterios, criterio</td></tr></table><p>Truco: aunque solo tengas una condición, puedes usar siempre SUMAR.SI.CONJUNTO; así no te confundes de orden. (PROMEDIO.SI.CONJUNTO no está en el simulador del curso, pero sí en Excel.)</p>' },
      { titulo: 'Condiciones con fechas, comodines y «O»', html: '<ul><li><b>Entre dos fechas:</b> <code>=SUMAR.SI.CONJUNTO(F:F, A:A, "&gt;="&amp;FECHA(2025,10,1), A:A, "&lt;="&amp;FECHA(2025,10,31))</code>.</li><li><b>Comodines:</b> <code>"*latte*"</code> (contiene «latte»), <code>"CAF-???"</code> (CAF- y tres caracteres).</li><li><b>Norte o Sur:</b> <code>=SUMAR.SI(B:B,"Norte",F:F)+SUMAR.SI(B:B,"Sur",F:F)</code>, o <code>=SUMAPRODUCTO(SUMAR.SI(B:B,{"Norte","Sur"},F:F))</code>.</li><li><b>Contar los que no son Centro:</b> <code>=CONTAR.SI(B:B,"&lt;&gt;Centro")</code> (cuidado: también cuenta celdas vacías del rango).</li></ul>' },
      { titulo: '¿Fórmulas o tabla dinámica?', html: '<p>Las fórmulas condicionales son ideales cuando el resumen tiene un <b>formato fijo</b> (un reporte oficial, un tablero) o alimenta otros cálculos. La tabla dinámica (módulo 17) es mejor para <b>explorar</b>: cambiar de categoría a producto o de mes a trimestre con un clic. Muchas empresas usan ambas: dinámica para descubrir, fórmulas para reportar.</p>' },
    ],
    errores: [
      'Escribir el criterio sin comillas (<code>&gt;=10000</code>) o meter la celda dentro de las comillas (<code>"&gt;=F1"</code>).',
      'Rangos de distinto tamaño: <code>SUMAR.SI(B2:B21,"Norte",C2:C30)</code> da resultados desalineados.',
      'Poner el rango a sumar al final en SUMAR.SI.CONJUNTO, como si fuera SUMAR.SI.',
      'Copiar la fórmula de la matriz sin fijar los rangos de la hoja Ventas.',
      'Criterios que no coinciden por un espacio de más («Norte ») o una tilde distinta.',
    ],
    consejos: [
      'Toma los criterios de celdas (encabezados de la matriz) en lugar de escribirlos en la fórmula.',
      'Comprueba que el total de la matriz coincide con la suma de toda la columna de ventas.',
      'Usa columnas completas (<code>Ventas!F:F</code>) o tablas (módulo 13) para que los rangos crezcan solos.',
      'Antes de contar, limpia los textos (módulos 11 y 12): un criterio solo encuentra lo que está escrito igual.',
    ],
    autoeval: [
      { p: '¿Qué diferencia hay entre <code>=CONTAR.SI(C2:C21,"&gt;=10000")</code> y <code>=CONTAR.SI(C2:C21,"&gt;="&amp;F1)</code>?', r: 'La primera tiene la meta escrita en la fórmula; la segunda la toma de F1 y se actualiza si la meta cambia.' },
      { p: 'Escribe la fórmula que suma las ventas (F) de la sucursal Sur (B) en la categoría Té (C).', r: '<code>=SUMAR.SI.CONJUNTO(F2:F61, B2:B61, "Sur", C2:C61, "Té")</code>.' },
      { p: '¿Por qué en la matriz se usa <code>$A3</code> y no <code>$A$3</code>?', r: 'Porque al copiar hacia abajo la fila debe cambiar (cada fila es otra categoría); solo la columna A debe quedar fija.' },
      { p: '¿Qué devuelve PROMEDIO.SI si ninguna fila cumple el criterio?', r: 'El error #¡DIV/0!, porque no hay valores que promediar. Se puede envolver en SI.ERROR (módulo 20).' },
      { p: '¿Cómo cuentas los productos cuyo nombre contiene «latte»?', r: '<code>=CONTAR.SI(D2:D61,"*latte*")</code>: los asteriscos son comodines.' },
      { p: '¿Cómo obtienes la venta más baja de la sucursal Norte?', r: '<code>=MIN.SI.CONJUNTO(F2:F61, B2:B61, "Norte")</code>.' },
      { p: 'La suma de toda tu matriz no coincide con <code>=SUMA(Ventas!F2:F61)</code>. ¿Qué revisas?', r: 'Que los rangos lleguen a la última fila, que los criterios coincidan exactamente con los datos (espacios, tildes) y que no falte ninguna categoría o sucursal en los encabezados.' },
      { p: '¿Cuándo prefieres una tabla dinámica a estas fórmulas?', r: 'Cuando quieres explorar el resumen desde varios ángulos con rapidez; las fórmulas convienen para reportes con formato fijo o que alimentan otros cálculos.' },
    ],
    conexiones: [
      { id: 9, texto: 'los criterios con <code>"&gt;="&amp;F1</code> y las referencias mixtas vienen de ahí.' },
      { id: 11, texto: 'los criterios con fechas usan FECHA y FIN.MES.' },
      { id: 13, texto: 'con tablas, los rangos se escriben como <code>Ventas[Total]</code> y crecen solos.' },
      { id: 17, texto: 'la tabla dinámica hace este mismo resumen sin fórmulas.' },
    ],
  });
})();
