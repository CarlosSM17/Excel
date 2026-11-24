/* Módulo 11 · Funciones de texto y de fecha (versión 3) */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const PROD = D.productos;
  const inicial = { Centro: 'C', Norte: 'N', Sur: 'S' };
  const ensuciar = (t, i) => [(s) => '  ' + s.toLowerCase() + ' ', (s) => s.toUpperCase(), (s) => s.replace(/ /g, '   '), (s) => s.toLowerCase(), (s) => ' ' + s][i % 5](t);
  const masDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const pedidos = D.pedidos.slice(0, 14).map((p, i) => ({
    codigo: 'PED-' + p.folio + '-' + inicial[p.sucursal], cliente: ensuciar(p.cliente, i), pedido: p.fecha, compromiso: p.compromiso,
    entrega: p.estado === 'Pendiente' ? '' : masDias(p.compromiso, [0, -1, 2, 0, 1, -2, 0, 3][i % 8]),
  }));
  const ult = pedidos.length + 1;
  const hojaPedidos = (experto) => ({
    nombre: 'Pedidos',
    datos: [['Folio', 'Cliente (capturado)', 'Pedido', 'Compromiso', 'Entrega', 'Cliente', 'Número', 'Días hábiles', 'Estado'].concat(experto ? ['Sucursal', 'Cierre de mes'] : []),
      ...pedidos.map((p) => [p.codigo, p.cliente, fecha(p.pedido), fecha(p.compromiso), p.entrega ? fecha(p.entrega) : ''])],
    formatos: Object.assign({ ['C2:E' + ult]: 'dd/mm/yyyy' }, experto ? { ['K2:K' + ult]: 'dd/mm/yyyy' } : {}),
    estilos: { 'A1:E1': ENC, ['F1:' + (experto ? 'K1' : 'I1')]: { b: true, bg: '#fff8d6' } },
    anchos: { A: 112, B: 190, C: 84, D: 90, E: 84, F: 170, G: 70, H: 92, I: 80, J: 76, K: 96 },
    objetivo: (experto ? 'F2:K' : 'F2:I') + ult, inmovilizar: { filas: 1 },
  });
  const solBase = { ['F2:F' + ult]: '=NOMPROPIO(ESPACIOS(B2))', ['G2:G' + ult]: '=VALOR(EXTRAE(A2,5,4))', ['H2:H' + ult]: '=DIAS.LAB(C2,D2)', ['I2:I' + ult]: '=SI(E2="","Pendiente",SI(E2<=D2,"A tiempo","Tarde"))' };
  const solExperto = Object.assign({}, solBase, { ['J2:J' + ult]: '=SI.CONJUNTO(DERECHA(A2,1)="C","Centro",DERECHA(A2,1)="N","Norte",VERDADERO,"Sur")', ['K2:K' + ult]: '=FIN.MES(C2,0)' });
  const pruebasBase = [
    { tipo: 'formula', rango: 'F2:I' + ult, titulo: 'Las columnas nuevas son fórmulas', mensaje: '{celda} tiene un valor escrito: usa una fórmula para que se actualice si cambia la captura.', mensajeVacia: '{celda} está vacía: copia la fórmula hasta la fila ' + ult + '.' },
    { tipo: 'usa', rango: 'F2:F' + ult, funciones: ['ESPACIOS', 'NOMPROPIO'], titulo: 'Nombres limpios con ESPACIOS y NOMPROPIO', mensaje: 'En {celda} combina ESPACIOS (quita espacios sobrantes) y NOMPROPIO (mayúscula inicial).' },
    { tipo: 'valores', rango: 'F2:G' + ult, titulo: 'Cliente y número de folio correctos', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}.' },
    { tipo: 'usa', rango: 'H2:H' + ult, funciones: ['DIAS.LAB'], titulo: 'Plazo en días hábiles con DIAS.LAB', mensaje: 'En {celda} cuenta los días hábiles entre el pedido y el compromiso con DIAS.LAB.' },
    { tipo: 'valores', rango: 'H2:I' + ult, titulo: 'Plazos y estados correctos', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. ¿Consideraste primero si la entrega está vacía?' },
    { tipo: 'robustez', cambios: [{ E3: fecha(masDias(pedidos[1].compromiso, 5)) }, { E2: '' }], rango: 'I2:I' + ult, titulo: 'El estado cambia si cambia la fecha de entrega', mensaje: 'Al cambiar una fecha de entrega, {celda} no se actualiza bien: compara E2 con D2 dentro de la fórmula.' },
  ];

  LT.definirModulo({
    id: 11,
    objetivo: 'Limpiar, extraer y unir textos (ESPACIOS, NOMPROPIO, IZQUIERDA, DERECHA, EXTRAE, HALLAR, CONCAT, &) y calcular con fechas (restas, DIAS.LAB, FIN.MES, AÑO, MES, HOY).',
    situacion: 'El registro de pedidos corporativos llega capturado a mano: <b>nombres con espacios y mayúsculas al azar</b>, el folio trae el número y la sucursal pegados, y necesito saber <b>cuántos días hábiles</b> tenía cada pedido y si llegó a tiempo.',
    explicacion: [
      { html: '<h3>Funciones de texto: limpiar, extraer y unir</h3><table class="tabla-sitio"><tr><th>Quieres</th><th>Función</th><th>Ejemplo</th><th>Resultado</th></tr><tr><td>Quitar espacios sobrantes</td><td>ESPACIOS</td><td><code>=ESPACIOS("  lucía   pérez ")</code></td><td>lucía pérez</td></tr><tr><td>Mayúscula inicial</td><td>NOMPROPIO</td><td><code>=NOMPROPIO("lucía pérez")</code></td><td>Lucía Pérez</td></tr><tr><td>Todo en mayúsculas / minúsculas</td><td>MAYUSC / MINUSC</td><td><code>=MINUSC("Norte")</code></td><td>norte</td></tr><tr><td>Los primeros / últimos caracteres</td><td>IZQUIERDA / DERECHA</td><td><code>=IZQUIERDA("CAF-004",3)</code></td><td>CAF</td></tr><tr><td>Caracteres de en medio</td><td>EXTRAE</td><td><code>=EXTRAE("PED-2501-N",5,4)</code></td><td>2501</td></tr><tr><td>Posición de un carácter</td><td>HALLAR</td><td><code>=HALLAR("-","CAF-004")</code></td><td>4</td></tr><tr><td>Cuántos caracteres</td><td>LARGO</td><td><code>=LARGO("5544935885")</code></td><td>10</td></tr><tr><td>Reemplazar un texto</td><td>SUSTITUIR</td><td><code>=SUSTITUIR("CAF-004","-","")</code></td><td>CAF004</td></tr><tr><td>Unir</td><td>&amp; o CONCAT</td><td><code>=A2&amp;" "&amp;B2</code></td><td>Andrea Solís</td></tr><tr><td>Texto que parece número → número</td><td>VALOR</td><td><code>=VALOR("2501")</code></td><td>2501</td></tr></table><p>Las funciones de texto devuelven <b>texto</b>: «2501» extraído de un folio no se puede sumar hasta convertirlo con VALOR.</p>' },
      { html: '<h3>Las fechas son números</h3><p>Excel guarda cada fecha como el número de días desde el 1/1/1900: el 15/10/2025 es <b>45945</b>. Por eso <code>=D2-C2</code> da los días entre dos fechas y <code>=C2+7</code> la fecha una semana después. El formato decide si ves 45945 o 15/10/2025.</p><table class="tabla-sitio"><tr><th>Función</th><th>Devuelve</th></tr><tr><td><code>HOY()</code> / <code>AHORA()</code></td><td>Fecha de hoy / fecha y hora (se recalculan)</td></tr><tr><td><code>AÑO(f)</code>, <code>MES(f)</code>, <code>DIA(f)</code></td><td>Partes de una fecha</td></tr><tr><td><code>FECHA(año, mes, día)</code></td><td>Arma una fecha</td></tr><tr><td><code>DIASEM(f, 2)</code></td><td>Día de la semana (1 = lunes)</td></tr><tr><td><code>DIAS.LAB(inicio, fin, [festivos])</code></td><td>Días hábiles (lunes a viernes) entre dos fechas, ambas incluidas</td></tr><tr><td><code>DIA.LAB(inicio, n, [festivos])</code></td><td>La fecha n días hábiles después</td></tr><tr><td><code>FIN.MES(f, 0)</code> / <code>FECHA.MES(f, n)</code></td><td>Último día del mes / la misma fecha n meses después</td></tr></table>' },
      { titulo: 'Pruébalo: anida funciones de texto', instr: 'B2 tiene un nombre mal capturado. Escribe en C2 <code>=ESPACIOS(B2)</code>, luego cámbiala a <code>=NOMPROPIO(ESPACIOS(B2))</code>. En C3 prueba <code>=EXTRAE(B3,5,4)</code> y en C4 <code>=D4-B4</code> (días entre dos fechas).', hoja: { altura: 210, hojas: [{ nombre: 'Práctica', datos: [['', 'Dato', 'Resultado', ''], ['Nombre', '  lucía   PÉREZ '], ['Folio', 'PED-2531-S'], ['Fechas', fecha('2025-10-07'), '', fecha('2025-10-20')]], formatos: { B4: 'dd/mm/yyyy', D4: 'dd/mm/yyyy' }, estilos: { 'A1:D1': ENC, 'A2:A4': { b: true } }, anchos: { A: 70, B: 150, C: 150, D: 90 }, filas: 8, cols: 6 }], herramientas: ['formulas'] } },
    ],
    ejemplo: {
      titulo: 'Un nombre capturado sin cuidado',
      hoja: { hojas: [{ nombre: 'Clientes', datos: [['Capturado', 'Limpio'], ['  despacho   LUNA & asoc. '], ['NOTARÍA 14'], ['  agencia pixel']], estilos: { 'A1:B1': ENC }, anchos: { A: 210, B: 210 }, filas: 6, cols: 4 }], altura: 170 },
      celda: 'B2', formula: '=NOMPROPIO(ESPACIOS(A2))',
      pregunta: '¿Qué texto mostrará B2?', respuesta: 'Despacho Luna & Asoc.',
      explicacion: [
        'Excel evalúa de adentro hacia afuera. Primero <code>ESPACIOS(A2)</code> quita los espacios del inicio y del final y deja uno solo entre palabras: «despacho LUNA &amp; asoc.».',
        'Después <code>NOMPROPIO(…)</code> pone en mayúscula la primera letra de cada palabra y el resto en minúscula: <b>«Despacho Luna &amp; Asoc.»</b>.',
        'Copiada hacia abajo, la misma fórmula limpia «NOTARÍA 14» → «Notaría 14». Ojo: NOMPROPIO también capitaliza «del» o «de» («Universidad Del Norte»).',
      ],
    },
    micro: [
      {
        titulo: 'Partes de un código', tipo: 'hoja',
        enunciado: 'En B2:B7 extrae el <b>prefijo</b> de la categoría (las 3 primeras letras del código) y en C2:C7 el <b>número</b> como número (los 3 últimos caracteres, convertidos con VALOR).',
        hoja: { hojas: [{ nombre: 'Catálogo', datos: [['Código', 'Prefijo', 'Número'], ...[0, 4, 7, 9, 13, 18].map((i) => [PROD[i].codigo])], estilos: { 'A1:C1': ENC }, objetivo: 'B2:C7', filas: 9, cols: 5 }], herramientas: ['formulas'] },
        solucion: { 'B2:B7': '=IZQUIERDA(A2,3)', 'C2:C7': '=VALOR(DERECHA(A2,3))' },
        pruebas: [{ tipo: 'usa', rango: 'B2:B7', funciones: ['IZQUIERDA', 'EXTRAE'], alguna: true, mensaje: 'En {celda} usa IZQUIERDA.' }, { tipo: 'usa', rango: 'C2:C7', funciones: ['DERECHA', 'EXTRAE'], alguna: true, mensaje: 'En {celda} usa DERECHA (dentro de VALOR).' }, { tipo: 'valores', rango: 'B2:C7', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. Si ves «001» alineado a la izquierda, falta VALOR.' }],
        pista: ['<code>=IZQUIERDA(A2,3)</code>', '<code>=VALOR(DERECHA(A2,3))</code>'],
      },
      {
        titulo: 'Nombres en orden', tipo: 'hoja',
        enunciado: 'Los nombres de A2:A7 tienen espacios de más y mayúsculas al azar. En B2:B7 déjalos limpios: un espacio entre palabras y mayúscula inicial.',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Capturado', 'Limpio'], ...D.empleados.slice(0, 6).map((e, i) => [ensuciar(e.nombre, i)])], estilos: { 'A1:B1': ENC }, anchos: { A: 190, B: 170 }, objetivo: 'B2:B7', filas: 9, cols: 4 }], herramientas: ['formulas'] },
        solucion: { 'B2:B7': '=NOMPROPIO(ESPACIOS(A2))' },
        pruebas: [{ tipo: 'usa', rango: 'B2:B7', funciones: ['ESPACIOS', 'NOMPROPIO'], mensaje: 'En {celda} anida ESPACIOS dentro de NOMPROPIO.' }, { tipo: 'valores', rango: 'B2:B7' }],
        pista: ['Primero ESPACIOS, luego NOMPROPIO sobre el resultado.', '<code>=NOMPROPIO(ESPACIOS(A2))</code>'],
      },
      {
        titulo: 'Unir textos', tipo: 'hoja',
        enunciado: 'Arma en C2:C7 el usuario de correo de cada persona: <b>nombre.apellido@lataza.mx</b> en minúsculas (por ejemplo, andrea.solís@lataza.mx).',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Nombre', 'Apellido', 'Correo'], ...D.empleados.slice(0, 6).map((e) => e.nombre.split(' '))], estilos: { 'A1:C1': ENC }, anchos: { C: 220 }, objetivo: 'C2:C7', filas: 9, cols: 4 }], herramientas: ['formulas'] },
        solucion: { 'C2:C7': '=MINUSC(A2&"."&B2&"@lataza.mx")' },
        pruebas: [{ tipo: 'usa', rango: 'C2:C7', funciones: ['MINUSC'], mensaje: 'En {celda} convierte a minúsculas con MINUSC.' }, { tipo: 'valores', rango: 'C2:C7', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. Une con &: A2&"."&B2&"@lataza.mx".' }],
        pista: ['El punto y el dominio van entre comillas y se unen con &.', '<code>=MINUSC(A2&amp;"."&amp;B2&amp;"@lataza.mx")</code>'],
      },
      {
        titulo: 'Días entre fechas', tipo: 'hoja',
        enunciado: 'En C2:C6 calcula los <b>días naturales</b> entre el pedido y la entrega (una resta) y en D2:D6 los <b>días hábiles</b> con DIAS.LAB.',
        hoja: { hojas: [{ nombre: 'Entregas', datos: [['Pedido', 'Entrega', 'Días naturales', 'Días hábiles'], ...D.pedidos.slice(0, 5).map((p) => [fecha(p.fecha), fecha(p.compromiso)])], formatos: { 'A2:B6': 'dd/mm/yyyy', 'C2:D6': '0' }, estilos: { 'A1:D1': ENC }, anchos: { A: 90, B: 90, C: 110, D: 100 }, objetivo: 'C2:D6', filas: 8, cols: 5 }], herramientas: ['formulas', 'numero'] },
        solucion: { 'C2:C6': '=B2-A2', 'D2:D6': '=DIAS.LAB(A2,B2)' },
        pruebas: [{ tipo: 'formula', rango: 'C2:D6' }, { tipo: 'usa', rango: 'D2:D6', funciones: ['DIAS.LAB'], mensaje: 'En {celda} usa DIAS.LAB.' }, { tipo: 'valores', rango: 'C2:D6', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. Si ves una fecha rara, cambia el formato de la celda a Número.' }],
        pista: ['<code>=B2-A2</code>', '<code>=DIAS.LAB(A2,B2)</code> (cuenta ambos extremos si son hábiles).'],
      },
    ],
    reto: {
      titulo: 'Códigos, nombres y plazos de entrega', tipo: 'hoja',
      intro: 'La hoja <i>Pedidos</i> tiene ' + pedidos.length + ' pedidos (filas 2 a ' + ult + '). El folio trae el número y la sucursal: <b>PED-2501-N</b>. La entrega está vacía si el pedido sigue pendiente.',
      base: {
        hoja: { hojas: [hojaPedidos(false)], herramientas: ['portapapeles', 'formulas'], altura: 420 },
        solucion: solBase, pruebas: pruebasBase,
        instrucciones: ['<b>F</b>: el cliente limpio (sin espacios de más y con mayúscula inicial).', '<b>G</b>: el número del folio como número (los 4 dígitos que empiezan en la posición 5).', '<b>H</b>: los días hábiles entre el pedido (C) y el compromiso (D).', '<b>I</b>: «Pendiente» si no hay entrega; «A tiempo» si la entrega fue el compromiso o antes; «Tarde» si fue después.', 'Copia todas las fórmulas hasta la fila ' + ult + '.'],
        pistas: ['Combina funciones: ESPACIOS, NOMPROPIO, EXTRAE, VALOR, DIAS.LAB y SI.', 'Para el estado, pregunta primero si la entrega está vacía: <code>E2=""</code>.', '<code>=SI(E2="","Pendiente",SI(E2&lt;=D2,"A tiempo","Tarde"))</code>'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'I2', texto: '=SI(E2="", "Pendiente", SI(___, "A tiempo", "Tarde"))', copiar: 'I' + ult },
          instrucciones: ['En F2 escribe <code>=NOMPROPIO(ESPACIOS(B2))</code>.', 'En G2 escribe <code>=VALOR(EXTRAE(A2,5,4))</code>.', 'En H2 escribe <code>=DIAS.LAB(C2,D2)</code>.', 'Completa el hueco de la fórmula del estado (¿la entrega E2 fue el compromiso D2 o antes?) y pulsa «Escribir en I2».', 'Selecciona F2:I2 y copia hasta la fila ' + ult + ' con el controlador de relleno.'],
        },
        experto: {
          hoja: { hojas: [hojaPedidos(true)], herramientas: ['portapapeles', 'formulas', 'numero'], altura: 420 },
          solucion: solExperto,
          pruebas: pruebasBase.concat([
            { tipo: 'usa', rango: 'J2:J' + ult, funciones: ['DERECHA', 'EXTRAE'], alguna: true, titulo: 'Sucursal tomada del folio', mensaje: 'En {celda} toma la última letra del folio con DERECHA.' },
            { tipo: 'usa', rango: 'K2:K' + ult, funciones: ['FIN.MES'], titulo: 'Cierre de mes con FIN.MES', mensaje: 'En {celda} usa FIN.MES(C2,0).' },
            { tipo: 'valores', rango: 'J2:K' + ult, titulo: 'Sucursal y cierre de mes correctos' },
          ]),
          instrucciones: ['Resuelve F:I como en el nivel Analista.', '<b>J</b>: la sucursal completa según la última letra del folio (C = Centro, N = Norte, S = Sur).', '<b>K</b>: la fecha de cierre del mes del pedido (último día de ese mes), con formato de fecha.'],
          pistas: ['La última letra: <code>DERECHA(A2,1)</code>.', 'Varias opciones: SI.CONJUNTO.', '<code>=SI.CONJUNTO(DERECHA(A2,1)="C","Centro",DERECHA(A2,1)="N","Norte",VERDADERO,"Sur")</code> y <code>=FIN.MES(C2,0)</code>'],
        },
      },
    },
    lab: {
      archivo: 'lab11-entregas.xlsx', titulo: 'Entregas de octubre y noviembre', hoja: 'Entregas',
      contexto: 'Los 40 pedidos corporativos completos. Los días hábiles deben descontar los días festivos de la hoja <i>Festivos</i>.',
      sol: {
        'Entregas!F2:F41': '=PROPER(TRIM(B2))', 'Entregas!G2:G41': '=VALUE(MID(A2,5,4))',
        'Entregas!H2:H41': '=NETWORKDAYS(C2,D2,Festivos!$A$2:$A$4)', 'Entregas!I2:I41': '=IF(E2="","Pendiente",IF(E2<=D2,"A tiempo","Tarde"))',
        'Entregas!J2:J41': '=IF(I2="Tarde",E2-D2,0)', 'Entregas!K2:K41': '=MONTH(C2)', 'Entregas!L2:L41': '=EOMONTH(C2,0)',
      },
      pasos: {
        explorador: [
          'En F2: <code>=NOMPROPIO(ESPACIOS(B2))</code>; en G2: <code>=VALOR(EXTRAE(A2,5,4))</code>.',
          { texto: 'En H2: <code>=DIAS.LAB(C2,D2,Festivos!$A$2:$A$4)</code> (el rango de festivos fijo con $).', ruta: ['Fórmulas', 'Fecha y hora'] },
          'En I2: <code>=SI(E2="","Pendiente",SI(E2&lt;=D2,"A tiempo","Tarde"))</code>; en J2: <code>=SI(I2="Tarde",E2-D2,0)</code>.',
          'Copia F2:J2 hasta la fila 41, guarda y sube el libro.',
        ],
        analista: ['F: cliente limpio · G: número de folio (número) · H: días hábiles de plazo sin contar los festivos de la hoja Festivos · I: Pendiente / A tiempo / Tarde · J: días de retraso (0 si no hay retraso).', 'Copia hasta la fila 41, guarda y sube el libro.'],
        experto: ['Resuelve F:J como en el nivel Analista.', 'K: el mes del pedido (número); L: el cierre de mes del pedido con formato de fecha.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { t: 'formula', r: 'Entregas!F2:J41', titulo: 'Las columnas F a J son fórmulas' },
        { t: 'usa', r: 'Entregas!F2:F41', f: ['TRIM', 'PROPER'], todas: true, nombres: ['ESPACIOS', 'NOMPROPIO'], titulo: 'Cliente limpio con ESPACIOS y NOMPROPIO' },
        { t: 'usa', r: 'Entregas!G2:G41', f: ['VALUE', 'NUMBERVALUE'], nombres: ['VALOR'], titulo: 'Número de folio convertido con VALOR' },
        { t: 'usa', r: 'Entregas!H2:H41', f: ['NETWORKDAYS', 'NETWORKDAYS.INTL'], nombres: ['DIAS.LAB'], titulo: 'Plazo en días hábiles con DIAS.LAB' },
        { t: 'contiene', r: 'Entregas!H2:H41', texto: ['FESTIVOS!'], msg: 'En {celda} incluye los festivos: DIAS.LAB(C2,D2,Festivos!$A$2:$A$4).', titulo: 'Los festivos se descuentan' },
        { t: 'valores', r: 'Entregas!F2:J41', titulo: 'Clientes, folios, plazos, estados y retrasos correctos' },
        { t: 'robustez', r: 'Entregas!H2:J41', cambios: [{ 'Festivos!A2': 45950 }, { 'Entregas!E3': 45990 }], titulo: 'Se actualiza si cambian los festivos o una entrega' },
        { t: 'valores', r: 'Entregas!K2:L41', nivel: 'experto', titulo: 'Mes y cierre de mes correctos' },
        { t: 'fmt', r: 'Entregas!L2:L41', tipo: 'fecha', nivel: 'experto', titulo: 'El cierre de mes se ve como fecha' },
      ],
    },
    donde: [
      { comando: 'Funciones de texto', ruta: ['Fórmulas', 'Texto'] },
      { comando: 'Funciones de fecha y hora', ruta: ['Fórmulas', 'Fecha y hora'] },
      { comando: 'Formato de fecha', ruta: ['Inicio', 'Formato de número'], nota: 'Si una resta de fechas se ve como fecha, cambia el formato a Número.' },
    ],
    glosario: ['ESPACIOS', 'NOMPROPIO', 'MAYUSC', 'MINUSC', 'IZQUIERDA', 'DERECHA', 'EXTRAE', 'HALLAR', 'LARGO', 'SUSTITUIR', 'CONCAT', 'UNIRCADENAS', 'VALOR', 'TEXTO', 'HOY', 'FECHA', 'AÑO', 'MES', 'DIA', 'DIASEM', 'DIAS', 'DIAS.LAB', 'DIA.LAB', 'FIN.MES', 'FECHA.MES'],
    atajos: ['<kbd>Ctrl</kbd>+<kbd>;</kbd> escribe la fecha de hoy como valor fijo (a diferencia de <code>=HOY()</code>, que cambia cada día).', '<kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>#</kbd> aplica formato de fecha a la selección.'],
  });

  /* información a detalle, autoevaluación y conexiones */
  const linea = `<figure class="figura-explica"><svg viewBox="0 0 620 150" role="img" aria-label="Fechas como números en una línea de tiempo">
  <g font-family="Segoe UI,Arial" font-size="12"><line x1="20" y1="60" x2="600" y2="60" stroke="#555" stroke-width="2"/>
  <g fill="#2259b8"><circle cx="60" cy="60" r="6"/><circle cx="300" cy="60" r="6"/><circle cx="540" cy="60" r="6"/></g>
  <text x="60" y="40" text-anchor="middle">07/10/2025</text><text x="60" y="88" text-anchor="middle" font-weight="700">45937</text>
  <text x="300" y="40" text-anchor="middle">10/10/2025</text><text x="300" y="88" text-anchor="middle" font-weight="700">45940</text>
  <text x="540" y="40" text-anchor="middle">31/10/2025</text><text x="540" y="88" text-anchor="middle" font-weight="700">45961</text>
  <text x="180" y="112" text-anchor="middle">=C2-B2 → 3 días</text><text x="420" y="112" text-anchor="middle">=FIN.MES(B2,0) → 31/10/2025</text>
  <text x="20" y="138">Lo que ves (07/10/2025) es formato; lo que se calcula es el número de serie (45937).</text></g></svg></figure>`;
  LT.ampliarModulo(11, {
    objetivos: [
      'Limpiar textos capturados a mano con ESPACIOS, NOMPROPIO, MAYUSC y MINUSC.',
      'Extraer partes de un texto con IZQUIERDA, DERECHA, EXTRAE y HALLAR, y convertirlas en número con VALOR.',
      'Unir textos con & y CONCAT (o UNIRCADENAS con separador).',
      'Explicar por qué las fechas se pueden restar y sumar, y elegir su formato.',
      'Calcular plazos en días naturales y hábiles (DIAS.LAB con festivos), fechas límite (DIA.LAB, FIN.MES) y partes de una fecha (AÑO, MES, DIASEM).',
      'Combinar texto y fecha en una decisión (por ejemplo, «A tiempo» o «Tarde»).',
    ],
    detalle: [
      { titulo: 'Las fechas en la línea de tiempo', abierto: true, html: linea },
      { titulo: 'Extraer cuando la posición cambia: HALLAR + EXTRAE', html: '<p>Si el texto antes del guion no siempre mide lo mismo («CAF-004», «TE-002»), la posición del guion cambia. HALLAR la encuentra y EXTRAE corta con ella:</p><table><tr><th>Quieres</th><th>Fórmula</th><th>«TE-002»</th></tr><tr><td>Lo que va antes del guion</td><td><code>=IZQUIERDA(A2, HALLAR("-",A2)-1)</code></td><td>TE</td></tr><tr><td>Lo que va después</td><td><code>=EXTRAE(A2, HALLAR("-",A2)+1, 99)</code></td><td>002</td></tr><tr><td>Sin el guion</td><td><code>=SUSTITUIR(A2,"-","")</code></td><td>TE002</td></tr></table><p>En Microsoft 365 existen además TEXTOANTES y TEXTODESPUES, y Datos › Texto en columnas o Relleno rápido (módulo 12) hacen lo mismo sin fórmulas.</p>' },
      { titulo: 'Plazos: días naturales, hábiles y festivos', html: '<ul><li><b>Días naturales:</b> <code>=Entrega-Pedido</code>.</li><li><b>Días hábiles:</b> <code>=DIAS.LAB(Pedido, Entrega, Festivos!$A$2:$A$8)</code> cuenta de lunes a viernes, <b>ambos extremos incluidos</b>, y descuenta los festivos de la lista.</li><li><b>Fecha compromiso a 3 días hábiles:</b> <code>=DIA.LAB(Pedido, 3, Festivos!$A$2:$A$8)</code>.</li><li><b>Otros fines de semana</b> (por ejemplo, solo domingo): DIAS.LAB.INTL y DIA.LAB.INTL.</li><li><b>Antigüedad en años:</b> <code>=ENTERO((HOY()-Ingreso)/365.25)</code> o, en Excel, SIFECHA(Ingreso,HOY(),"Y").</li></ul>' },
      { titulo: 'Texto con formato: la función TEXTO', html: '<p><code>=TEXTO(B2,"dd/mm/yyyy")</code> convierte una fecha en texto con ese formato, útil para unirla a otro texto: <code>="Entrega: "&amp;TEXTO(D2,"dd/mm/yyyy")</code>. En Excel en español <code>=TEXTO(B2,"mmmm")</code> devuelve el nombre del mes («octubre») y <code>=TEXTO(C2,"$#,##0.00")</code> un importe con formato. El resultado es texto: no lo uses para calcular. (El simulador del curso solo reproduce bien los formatos de fecha corta.)</p>' },
    ],
    errores: [
      'Olvidar VALOR: «2501» extraído de un texto se alinea a la izquierda y no suma ni se compara como número.',
      'Contar mal la posición inicial de EXTRAE (la primera letra es la posición 1).',
      'Ver una fecha rara (05/01/1900) como resultado de una resta: es un número con formato de fecha; cámbialo a Número.',
      'Escribir fechas como texto («15 de octubre»): no se pueden restar.',
      'Usar HOY() en un reporte que debe quedar fijo: cambia cada día (usa <kbd>Ctrl</kbd>+<kbd>;</kbd> para una fecha fija).',
    ],
    consejos: [
      'Construye las fórmulas anidadas por pasos en columnas auxiliares y luego júntalas.',
      'Guarda los festivos en una hoja propia con nombre (Festivos) y fija su rango con $.',
      'Limpia los textos antes de usarlos como criterios (CONTAR.SI, BUSCARX): un espacio cambia todo.',
      'Cuando la limpieza es de una sola vez, convierte las fórmulas en valores (Pegado especial › Valores) y borra la columna sucia.',
    ],
    autoeval: [
      { p: '¿Qué devuelve <code>=EXTRAE("PED-2501-N",5,4)</code> y cómo lo conviertes en número?', r: 'Devuelve el texto «2501»; con <code>=VALOR(EXTRAE(A2,5,4))</code> se convierte en el número 2501.' },
      { p: 'Escribe una fórmula que deje «  ana   LÓPEZ » como «Ana López».', r: '<code>=NOMPROPIO(ESPACIOS(A2))</code>.' },
      { p: '¿Por qué <code>=D2-C2</code> da un número de días?', r: 'Porque las fechas son números de serie (días desde 1900): la resta de dos fechas es la cantidad de días entre ellas.' },
      { p: 'Un pedido se hizo el viernes y se comprometió para el lunes siguiente. ¿Cuánto dan la resta y DIAS.LAB?', r: 'La resta da 3 días naturales; DIAS.LAB da 2 (viernes y lunes, ambos incluidos; sábado y domingo no cuentan).' },
      { p: '¿Cómo obtienes el último día del mes de una fecha en C2?', r: '<code>=FIN.MES(C2,0)</code>, con formato de fecha.' },
      { p: '¿Qué diferencia hay entre <code>=HOY()</code> y pulsar <kbd>Ctrl</kbd>+<kbd>;</kbd>?', r: 'HOY() es una fórmula que cambia cada día; <kbd>Ctrl</kbd>+<kbd>;</kbd> escribe la fecha de hoy como valor fijo.' },
      { p: '¿Cómo extraes lo que hay antes del guion si su posición cambia?', r: '<code>=IZQUIERDA(A2, HALLAR("-",A2)-1)</code>.' },
      { p: 'Escribe la fórmula del estado de entrega: vacío → «Pendiente», a tiempo → «A tiempo», si no → «Tarde».', r: '<code>=SI(E2="","Pendiente",SI(E2&lt;=D2,"A tiempo","Tarde"))</code>.' },
    ],
    conexiones: [
      { id: 2, texto: 'cómo Excel interpreta lo que escribes (texto, número o fecha).' },
      { id: 10, texto: 'los criterios con fechas: <code>"&gt;="&amp;FECHA(2025,10,1)</code>.' },
      { id: 12, texto: 'Texto en columnas, Relleno rápido y Quitar duplicados limpian sin fórmulas.' },
      { id: 21, texto: 'el formato condicional con fórmulas de fecha resalta los pedidos atrasados.' },
      { id: 23, texto: 'Power Query repite estas limpiezas automáticamente cada vez que llegan datos nuevos.' },
    ],
  });
})();
