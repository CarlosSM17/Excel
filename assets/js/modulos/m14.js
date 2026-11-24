/* Módulo 14 · Formato intermedio */
(function () {
  const { D, ENC } = LT.caso;
  const inv = D.inventario;
  const datosInv = [['Insumo', 'Unidad', 'Existencia', 'Mínimo', 'Máximo', 'Costo unitario', 'Proveedor', 'Cobertura'], ...inv.map((x, i) => [x.insumo, x.unidad, x.existencia, x.minimo, x.maximo, x.costo, x.proveedor, '=C' + (i + 2) + '/D' + (i + 2)])];
  const hojaInv = () => ({ hojas: [{ nombre: 'Inventario', datos: datosInv, formatos: { 'F2:F16': '$#,##0.00', 'H2:H16': '0%' }, anchos: { A: 170, B: 70, C: 84, D: 74, E: 74, F: 100, G: 140, H: 90 }, filas: 19 }], herramientas: ['estilos', 'fuente'], altura: 420 });
  const k = (r, c) => r + ',' + c;
  const rojo = (fx) => !!fx && (fx.bg === '#ffc7ce' || fx.fg === '#9c0006' || fx.fg === '#c00000');
  const amarillo = (fx) => !!fx && fx.bg === '#ffeb9c';
  const cubre = (rango, ref) => String(rango).split(',').some((p) => { const g = LT.refs.parseRango(p), o = LT.refs.parseRango(ref); return g && g.r1 <= o.r1 && g.c1 <= o.c1 && g.r2 >= o.r2 && g.c2 >= o.c2; });
  const evaluar = (x) => x.hoja._evaluarCondicionales(x.hoja.libro.hojas[0]);
  const pruebaRojo = { tipo: 'fn', titulo: 'Existencias bajo el mínimo en rojo', fn: (x) => {
    const cf = evaluar(x);
    for (let i = 0; i < inv.length; i++) {
      const bajo = x.valor('C' + (i + 2)) < x.valor('D' + (i + 2));
      if (bajo && !rojo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' (' + inv[i].insumo + ') está bajo el mínimo y no se pinta de rojo.';
      if (!bajo && rojo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' no está bajo el mínimo, pero se pinta de rojo: compara con el mínimo de su fila (=$D2).';
    }
    // robustez: si una existencia baja del mínimo, debe pintarse
    const hf = x.hoja.hf, sid = x.hoja.idHoja(0);
    const fila = inv.findIndex((y) => y.existencia >= y.minimo * 1.5);
    const prev = hf.getCellSerialized({ sheet: sid, row: fila + 1, col: 2 });
    hf.setCellContents({ sheet: sid, row: fila + 1, col: 2 }, [[inv[fila].minimo - 1]]);
    const cf2 = evaluar(x);
    hf.setCellContents({ sheet: sid, row: fila + 1, col: 2 }, [[prev]]);
    return rojo(cf2[k(fila + 1, 2)]) ? true : 'Si la existencia de ' + inv[fila].insumo + ' bajara del mínimo, no se pintaría: la regla debe comparar con la columna Mínimo (=$D2), no con un número fijo.';
  } };
  const tieneRegla = (x, tipo, ref) => x.estado.hojas[0].condicionales.some((r) => r.tipo === tipo && cubre(r.rango, ref));

  LT.definirModulo({
    id: 14,
    objetivo: 'Aplicar formato condicional (reglas, barras de datos, escalas de color e iconos), estilos y temas.',
    situacion: 'Necesito ver de un vistazo qué insumos hay que pedir ya: un <b>semáforo en el inventario</b>. En rojo lo que está por debajo del mínimo.',
    explicacion: [
      { html: '<h3>Formato que depende del valor</h3><p>El <b>formato condicional</b> (Inicio › Formato condicional) cambia el color de una celda según su valor, y se actualiza solo cuando el valor cambia.</p><ul><li><b>Resaltar reglas de celdas:</b> mayor que, menor que, entre, igual a, texto que contiene, duplicados.</li><li><b>Reglas superiores e inferiores:</b> los 10 mayores, por encima del promedio…</li><li><b>Barras de datos:</b> una barra dentro de la celda, proporcional al valor.</li><li><b>Escalas de color:</b> del rojo al verde según el valor.</li><li><b>Conjuntos de iconos:</b> semáforos, flechas, banderas.</li></ul><p>El valor de una regla puede ser una referencia: aplicada a C2:C16, la regla «menor que <code>=$D2</code>» compara cada existencia con el mínimo <b>de su propia fila</b> (la fila se ajusta, la columna D queda fija).</p><h3>Estilos y temas</h3><p>Los <b>estilos de celda</b> son formatos con nombre (Encabezado 1, Bueno, Malo…). El <b>tema</b> (Disposición de página › Temas) cambia a la vez colores y fuentes de todo el libro.</p>' },
      { widget: 'temas', titulo: 'Cambia el tema del reporte', instr: 'Elige un tema y observa cómo cambian juntos colores y fuentes.' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Regla «menor que» comparando con otra columna',
      pasos: ['Selecciona las existencias, C2:C16.', { texto: 'Inicio › Formato condicional › Resaltar reglas de celdas › Es menor que…', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] }, 'En el cuadro de valor escribe =$D2 (o haz clic en D2 y quita el $ antes del 2).', 'Elige «Relleno rojo claro con texto rojo oscuro».'],
      pregunta: { texto: 'Aplicas a C2:C16 la regla «Es menor que <code>=$D2</code>». ¿Con qué celda compara Excel la celda <b>C5</b>?', opciones: ['Con D5', 'Con D2', 'Con D16', 'Con C2'], correcta: 0, explicacion: 'La fila de la referencia se ajusta para cada celda: C5 se compara con <b>D5</b>. Si escribieras =$D$2, todas se compararían con D2.' },
    },
    micro: [
      { titulo: 'Barras de datos', tipo: 'hoja', enunciado: 'Agrega <b>barras de datos</b> a las existencias (C2:C16).', hoja: hojaInv(), pruebas: [{ tipo: 'fn', fn: (x) => (tieneRegla(x, 'barras', 'C2:C16') ? true : 'Selecciona C2:C16 › Formato condicional › Barras de datos.') }], pista: ['Selecciona C2:C16 y en «Formato condicional» elige «Barras de datos».'] },
      { titulo: 'Mayor que', tipo: 'hoja', enunciado: 'Resalta en rojo los <b>costos unitarios mayores a $200</b> (F2:F16).', hoja: hojaInv(),
        pruebas: [{ tipo: 'fn', fn: (x) => { const cf = evaluar(x); for (let i = 0; i < inv.length; i++) { const caro = inv[i].costo > 200; const fx = cf[k(i + 1, 5)]; if (caro !== !!(fx && (fx.bg || fx.fg))) return 'F' + (i + 2) + (caro ? ' cuesta más de $200 y no está resaltado.' : ' no cuesta más de $200 pero está resaltado.'); } return true; } }],
        pista: ['Selecciona F2:F16 › Formato condicional › Es mayor que… › 200.'] },
      { titulo: 'Temas', tipo: 'opcion', enunciado: 'Cambias el <b>tema</b> del libro de «Office» a otro. ¿Qué cambia?', opciones: ['Los colores y las fuentes del tema en todo el libro (estilos, tablas y gráficos)', 'Solo la celda seleccionada', 'Los valores de las celdas', 'El tamaño de las columnas'], correcta: 0, explicacion: 'El tema define la paleta de colores y las fuentes que usan los estilos, las tablas y los gráficos de todo el libro.' },
    ],
    reto: {
      titulo: 'Semáforo de inventario', tipo: 'hoja', intro: 'La hoja <i>Inventario</i> tiene 15 insumos. La columna H (Cobertura) es la existencia dividida entre el mínimo.',
      base: {
        hoja: hojaInv(),
        pruebas: [pruebaRojo,
          { tipo: 'fn', titulo: 'Semáforo de iconos en Cobertura', fn: (x) => (tieneRegla(x, 'iconos', 'H2:H16') ? true : 'Agrega un conjunto de iconos (semáforo) a H2:H16.') },
          { tipo: 'fn', titulo: 'Barras de datos en el costo', fn: (x) => (tieneRegla(x, 'barras', 'F2:F16') ? true : 'Agrega barras de datos a F2:F16.') },
          { tipo: 'estilo', rango: 'A1:H1', prop: 'estilo', valor: 'Encabezado 1', titulo: 'Encabezados con el estilo «Encabezado 1»', mensaje: 'Aplica el estilo de celda «Encabezado 1» a {celda} (y a todo A1:H1).' }],
        instrucciones: ['En las existencias (C2:C16), relleno rojo claro cuando la existencia sea <b>menor que el mínimo de su fila</b>.', 'En Cobertura (H2:H16), un <b>conjunto de iconos</b> tipo semáforo.', 'En Costo unitario (F2:F16), <b>barras de datos</b>.', 'Aplica el estilo de celda <b>Encabezado 1</b> a los encabezados A1:H1.'],
        pistas: ['Cada parte es una regla distinta; selecciona el rango antes de crear la regla.', 'Para comparar con el mínimo de cada fila usa la regla «Es menor que» con el valor =$D2.', 'C2:C16 › Es menor que… › =$D2 › Relleno rojo claro con texto rojo oscuro. H2:H16 › Conjunto de iconos: semáforo. F2:F16 › Barras de datos. A1:H1 › Estilos de celda › Encabezado 1.'],
      },
      niveles: {
        explorador: { instrucciones: ['Selecciona C2:C16 › Formato condicional › <b>Es menor que…</b> › valor <code>=$D2</code> › «Relleno rojo claro con texto rojo oscuro».', 'Selecciona H2:H16 › Formato condicional › <b>Conjunto de iconos: semáforo</b>.', 'Selecciona F2:F16 › Formato condicional › <b>Barras de datos</b>.', 'Selecciona A1:H1 › Estilos de celda › <b>Encabezado 1</b>.'] },
        experto: {
          instrucciones: ['Arma el semáforo del nivel Analista (rojo bajo el mínimo, iconos en Cobertura, barras en Costo y Encabezado 1).', 'Además, en las existencias, <b>relleno amarillo</b> cuando estén entre el mínimo y 1.3 veces el mínimo (incluidos).'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Existencias en zona de alerta en amarillo', fn: (x) => {
            const cf = evaluar(x);
            for (let i = 0; i < inv.length; i++) {
              const c = x.valor('C' + (i + 2)), d = x.valor('D' + (i + 2));
              const alerta = c >= d && c <= 1.3 * d;
              if (alerta && !amarillo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' (' + inv[i].insumo + ') está entre el mínimo y 1.3 veces el mínimo: debería verse en amarillo.';
              if (!alerta && amarillo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' se ve en amarillo, pero no está en la zona de alerta.';
            }
            return true;
          } }],
          pistas: ['Necesitas una segunda regla sobre C2:C16.', 'La regla «Entre…» acepta referencias: =$D2 y =$D2*1.3.', 'C2:C16 › Entre… › =$D2 y =$D2*1.3 › Relleno amarillo con texto amarillo oscuro.'],
        },
      },
    },
    lab: {
      archivo: 'lab14-inventario.xlsx', titulo: 'Semáforo del inventario de Norte',
      contexto: 'Mismo formato de inventario con las existencias de la sucursal Norte.',
      pasos: {
        explorador: [{ texto: 'C2:C16: Es menor que… =$D2, relleno rojo claro.', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] }, { texto: 'H2:H16: conjunto de iconos (semáforo).', ruta: ['Inicio', 'Formato condicional', 'Conjuntos de iconos'] }, { texto: 'F2:F16: barras de datos.', ruta: ['Inicio', 'Formato condicional', 'Barras de datos'] }, { texto: 'A1:H1: estilo Encabezado 1.', ruta: ['Inicio', 'Estilos de celda'] }, 'Guarda y sube el libro.'],
        analista: ['Semáforo: rojo bajo el mínimo (C2:C16), iconos en Cobertura (H2:H16), barras en Costo (F2:F16) y Encabezado 1 en A1:H1.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Segunda regla: amarillo entre el mínimo y 1.3 veces el mínimo.', 'Cambia el tema del libro.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Regla roja que compara con el mínimo', fn: (L, A) => { const h = A.hoja('Inventario'); const r = h.condicionales.find((x) => A.rangoCubre(x.sqref, 'C2:C16') && ((x.tipo === 'cellIs' && /less/i.test(x.operador || '') && /D/i.test(x.formulas[0] || '')) || (x.tipo === 'expression' && /</.test(x.formulas[0] || '') && /D/i.test(x.formulas[0] || '')))); return r ? true : 'Falta en C2:C16 una regla «menor que» que compare con la columna D (=$D2).'; } },
        { titulo: 'Iconos en Cobertura', fn: (L, A) => (L.hoja('Inventario').condicionales.some((x) => x.tipo === 'iconSet' && A.rangoCubre(x.sqref, 'H2:H16')) ? true : 'Agrega un conjunto de iconos a H2:H16.') },
        { titulo: 'Barras de datos en Costo', fn: (L, A) => (L.hoja('Inventario').condicionales.some((x) => x.tipo === 'dataBar' && A.rangoCubre(x.sqref, 'F2:F16')) ? true : 'Agrega barras de datos a F2:F16.') },
        { titulo: 'Encabezados con estilo Encabezado 1', fn: (L) => { for (const x of L.celdasRango('A1:H1')) if (L.estilo('Inventario', x.dir).estiloIntegrado !== 16) return x.dir + ' no tiene el estilo Encabezado 1.'; return true; } },
        { titulo: 'Segunda regla (amarillo)', nivel: 'experto', fn: (L, A) => (L.hoja('Inventario').condicionales.filter((x) => A.rangoCubre(x.sqref, 'C2:C16') && x.tipo !== 'dataBar').length >= 2 ? true : 'Agrega la segunda regla en C2:C16 (entre el mínimo y 1.3 veces el mínimo).') },
        { titulo: 'Tema cambiado', nivel: 'experto', fn: (L) => (L.tema && !/^(office theme|tema de office|office)$/i.test(L.tema.nombre || '') ? true : 'Cambia el tema del libro (Disposición de página › Temas).') },
      ],
    },
    donde: [
      { comando: 'Formato condicional › Resaltar reglas', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] },
      { comando: 'Conjuntos de iconos', ruta: ['Inicio', 'Formato condicional', 'Conjuntos de iconos'] },
      { comando: 'Administrar reglas', ruta: ['Inicio', 'Formato condicional', 'Administrar reglas…'] },
      { comando: 'Temas', ruta: ['Disposición de página', 'Temas'] },
    ],
    atajos: ['Para editar o reordenar reglas: Formato condicional › Administrar reglas.', 'Copiar formato (brocha) también copia las reglas de formato condicional.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const { D, ENC, totalesPor } = LT.caso;
  const tot = totalesPor('producto');
  const prods = D.productos.slice(0, 10).map((p) => [p.nombre, tot[p.nombre] || 0]);
  const top3 = prods.map((x) => x[1]).sort((a, b) => b - a).slice(0, 3);
  const tipos = `<figure class="figura-explica"><svg viewBox="0 0 620 150" role="img" aria-label="Tipos de formato condicional">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="10" width="140" height="100" rx="8" fill="#fff" stroke="#ccc"/><text x="80" y="28" text-anchor="middle" font-weight="700">Resaltar celdas</text>
  <rect x="30" y="40" width="100" height="18" fill="#ffc7ce"/><text x="80" y="53" text-anchor="middle" fill="#9c0006">18 &lt; mínimo</text><rect x="30" y="62" width="100" height="18" fill="#fff" stroke="#eee"/><text x="80" y="75" text-anchor="middle">32</text><rect x="30" y="84" width="100" height="18" fill="#c6efce"/><text x="80" y="97" text-anchor="middle" fill="#006100">60 ≥ máximo</text>
  <rect x="165" y="10" width="140" height="100" rx="8" fill="#fff" stroke="#ccc"/><text x="235" y="28" text-anchor="middle" font-weight="700">Barras de datos</text>
  <rect x="185" y="40" width="90" height="16" fill="#9dbbe0"/><rect x="185" y="62" width="50" height="16" fill="#9dbbe0"/><rect x="185" y="84" width="20" height="16" fill="#9dbbe0"/>
  <rect x="320" y="10" width="140" height="100" rx="8" fill="#fff" stroke="#ccc"/><text x="390" y="28" text-anchor="middle" font-weight="700">Escala de color</text>
  <rect x="340" y="40" width="100" height="18" fill="#63be7b"/><rect x="340" y="62" width="100" height="18" fill="#ffeb84"/><rect x="340" y="84" width="100" height="18" fill="#f8696b"/>
  <rect x="475" y="10" width="140" height="100" rx="8" fill="#fff" stroke="#ccc"/><text x="545" y="28" text-anchor="middle" font-weight="700">Iconos</text>
  <circle cx="505" cy="49" r="7" fill="#63be7b"/><text x="520" y="53">120 %</text><circle cx="505" cy="71" r="7" fill="#ffeb84"/><text x="520" y="75">95 %</text><circle cx="505" cy="93" r="7" fill="#f8696b"/><text x="520" y="97">60 %</text>
  <text x="10" y="136">Resaltar = una regla y un formato. Barras, escalas e iconos = muestran la magnitud de todo el rango a la vez.</text></g></svg></figure>`;
  LT.ampliarModulo(14, {
    objetivos: [
      'Resaltar celdas que cumplen una regla (mayor que, entre, texto que contiene, duplicados) con formato condicional.',
      'Usar reglas superiores e inferiores y por encima o debajo del promedio.',
      'Mostrar magnitudes con barras de datos, escalas de color y conjuntos de iconos.',
      'Comparar cada celda con otra de su fila (=$D2) para que la regla se mueva bien.',
      'Administrar varias reglas (orden, «Detener si es verdad», editar y borrar).',
      'Dar unidad visual al libro con estilos de celda y temas.',
    ],
    detalle: [
      { titulo: 'Cuatro familias de formato condicional', abierto: true, html: tipos },
      { titulo: 'Comparar con otra celda: la referencia relativa de la regla', html: '<p>Si seleccionas C2:C16 y creas «Es menor que <code>=$D2</code>», la regla se escribe para la <b>primera celda</b> (C2) y se desplaza como una fórmula copiada: C9 se compara con D9. Si escribes <code>=$D$2</code>, todas se comparan con D2 (error frecuente). Si escribes 25 a mano, la regla no se entera cuando cambia el mínimo.</p>' },
      { titulo: 'Administrar reglas', html: '<p>Inicio › Formato condicional › <b>Administrar reglas</b> muestra todas las reglas de la selección o de la hoja. Se aplican de arriba hacia abajo; si dos reglas pintan el relleno, gana la de arriba. «Detener si es verdad» evita que se apliquen las siguientes. Desde ahí cambias el rango «Se aplica a», editas la regla o la borras. Copiar formato (brocha) también copia las reglas.</p>' },
      { titulo: 'Iconos con umbrales propios', html: '<p>Por omisión, un conjunto de 3 iconos reparte el rango en tercios (≥67 %, ≥33 %, resto) <b>del rango de valores</b>, no de una meta. Para un semáforo de cobertura con sentido de negocio, edita la regla: Tipo «Número», verde si ≥ 1 (100 % del mínimo), amarillo si ≥ 0.8, rojo en otro caso. Con «Mostrar icono únicamente» queda solo el semáforo.</p>' },
    ],
    errores: [
      'Escribir un número fijo en la regla cuando debía compararse con otra columna.',
      'Usar <code>=$D$2</code> en lugar de <code>=$D2</code> y comparar todo con la primera fila.',
      'Acumular reglas repetidas al aplicar varias veces la misma (revisa Administrar reglas).',
      'Usar colores que no significan nada o demasiados a la vez.',
      'Iconos con umbrales por omisión (percentiles) cuando la decisión depende de una meta.',
    ],
    consejos: [
      'Rojo = acción urgente, amarillo = vigilar, verde = bien; mantén el código en todo el libro.',
      'Aplica las reglas a la columna completa de la tabla para que cubran los registros nuevos.',
      'Filtra por color (módulo 12) para listar solo lo resaltado.',
      'Para condiciones complejas (fila completa, fechas), usa reglas con fórmula (módulo 21).',
    ],
    microExtra: [
      {
        titulo: 'Los tres más vendidos', tipo: 'hoja',
        enunciado: 'Resalta las <b>3 ventas anuales más altas</b> de B2:B11 con una regla de «10 superiores» (cambia 10 por 3).',
        hoja: { hojas: [{ nombre: 'Productos', datos: [['Producto', 'Ventas 2025'], ...prods], formatos: { 'B2:B11': '$#,##0' }, estilos: { 'A1:B1': ENC }, anchos: { A: 160, B: 110 }, filas: 13, cols: 4 }], herramientas: ['estilos'] },
        pruebas: [{ tipo: 'fn', fn: (x) => {
          const cf = x.hoja._evaluarCondicionales(x.hoja.libro.hojas[0]);
          for (let i = 0; i < prods.length; i++) {
            const esTop = top3.includes(prods[i][1]);
            const fx = cf[(i + 1) + ',1'];
            const pintada = !!(fx && (fx.bg || fx.fg || fx.b));
            if (esTop && !pintada) return 'B' + (i + 2) + ' está entre las 3 más altas y no se resalta.';
            if (!esTop && pintada) return 'B' + (i + 2) + ' se resalta, pero no está entre las 3 más altas: ¿cambiaste 10 por 3?';
          }
          return true;
        } }],
        aplicarSolucion: (hj) => hj.libro.hojas[0].condicionales.push({ rango: 'B2:B11', tipo: 'superiores', valor: 3, formato: { bg: '#c6efce', fg: '#006100' } }),
        pista: ['Selecciona B2:B11 › Formato condicional › 10 superiores… y escribe 3.'],
      },
    ],
    autoeval: [
      { p: '¿Qué ventaja tiene el formato condicional sobre pintar las celdas a mano?', r: 'Se actualiza solo: si el valor cambia, el color cambia; y aplica la misma regla a miles de celdas sin errores.' },
      { p: 'Seleccionas C2:C16 y la regla es «menor que =$D2». ¿Con qué celda se compara C12?', r: 'Con D12: la referencia de la fila es relativa.' },
      { p: '¿Qué diferencia hay entre barras de datos y una regla «Es mayor que»?', r: 'La regla pinta solo lo que cumple la condición; las barras muestran la magnitud de todas las celdas a la vez.' },
      { p: '¿Dónde ves, editas y ordenas todas las reglas de una hoja?', r: 'Inicio › Formato condicional › Administrar reglas (mostrar reglas de «Esta hoja»).' },
      { p: 'Dos reglas pintan la misma celda de colores distintos. ¿Cuál gana?', r: 'La que está más arriba en el Administrador de reglas.' },
      { p: '¿Cómo haces que los iconos midan la cobertura contra 100 % y no contra el rango de valores?', r: 'Editando la regla del conjunto de iconos: tipo «Número» y umbrales fijos (por ejemplo, ≥ 1 verde, ≥ 0.8 amarillo).' },
      { p: '¿Qué cambia al aplicar otro tema al libro?', r: 'Los colores y fuentes del tema en estilos, tablas y gráficos; los valores no cambian.' },
    ],
    conexiones: [
      { id: 4, texto: 'el formato manual y los estilos de celda.' },
      { id: 9, texto: 'las pruebas lógicas y las referencias mixtas se usan igual en las reglas.' },
      { id: 21, texto: 'reglas con fórmula para pintar filas completas y fechas vencidas.' },
      { id: 18, texto: 'el semáforo forma parte de un tablero de seguimiento.' },
    ],
  });
})();
