/* Módulo 20 · Errores de fórmula y auditoría */
(function () {
  const { ENC, producto } = LT.caso;
  const cods = ['CAF-002', 'CAF-003', 'CAF-004', 'CAF-005', 'FRI-001', 'PAN-001', 'PAN-002', 'POS-001'];
  const unidades = [210, 185, '1O5', 96, 150, 0, 320, 74];
  const filas = cods.map((c, i) => {
    const p = producto(c), r = i + 4;
    return [c, p.nombre, p.precio, p.costo, unidades[i], '=C' + r + '*E' + r, r === 7 ? '=F7-Costos!D7*E7' : '=F' + r + '-D' + r + '*E' + r, '=G' + r + '/F' + r, '=F' + r + '/F' + (12 + i)];
  });
  const datos = [['Resumen de productos · Centro, octubre'], [], ['Código', 'Producto', 'Precio', 'Costo', 'Unidades', 'Ventas', 'Utilidad', 'Margen', 'Participación'], ...filas, ['Total', '', '', '', '', '=SUMAR(F4:F11)', '=SUMA(G4:G12)', '=G12/F12']];
  const hojaErr = () => ({
    hojas: [{ nombre: 'Resumen', datos, celdas: { K3: 'Código buscado', L3: 'CAF-04', K4: 'Producto', L4: '=BUSCARX(L3,A4:A11,B4:B11)', K5: 'Precio', L5: '=BUSCARX(L3,A4:A11,C4:C11)', K6: 'Diagnóstico', L6: '=SI(H12>0.6,Rentable,"Revisar")' },
      formatos: { 'C4:D11': '$#,##0', 'F4:G12': '$#,##0', 'H4:I12': '0.0%', L5: '$#,##0' }, estilos: { A1: { b: true, fs: 15 }, 'A3:I3': ENC, 'A12:I12': { b: true }, 'K3:K6': { b: true } },
      anchos: { A: 74, B: 120, C: 64, D: 60, E: 74, F: 84, G: 84, H: 74, I: 96, J: 20, K: 120, L: 110 }, filas: 15 }],
    herramientas: ['auditoria', 'portapapeles'], altura: 380,
  });
  const solucion = { E6: '105', L3: 'CAF-004', G7: '=F7-D7*E7', F12: '=SUMA(F4:F11)', G12: '=SUMA(G4:G11)', H9: '=SI.ERROR(G9/F9,0)', 'I4:I11': '=F4/$F$12', L6: '=SI(H12>0.6,"Rentable","Revisar")' };
  const sinErrores = { tipo: 'fn', titulo: 'Ya no hay errores en la hoja', fn: (x) => {
    const h = x.hoja;
    const lista = [];
    for (const [kk] of h.libro.hojas[0].celdas) {
      const [r, c] = kk.split(',').map(Number);
      const t = h.textoCelda(0, r, c);
      if (t.error || t.circular) lista.push(LT.refs.dir(r, c) + ' (' + (t.circular ? 'referencia circular' : t.texto) + ')');
    }
    return lista.length ? 'Quedan ' + lista.length + ' celdas con error: ' + lista.slice(0, 4).join(', ') + (lista.length > 4 ? '…' : '') + '. Usa Rastrear precedentes y Evaluar fórmula.' : true;
  } };
  const pruebas = [
    sinErrores,
    { tipo: 'valores', rango: 'E6', titulo: 'Unidades del Latte como número', mensaje: 'E6 debe ser el número 105 (estaba escrito con la letra O).' },
    { tipo: 'valores', rango: 'F4:G12', titulo: 'Ventas y utilidades correctas', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'fn', titulo: 'El Croissant (sin ventas) no da error', fn: (x) => { const v = x.valor('H9'); return v === 0 || v === '' || v == null ? true : 'H9 debe mostrar 0 (o quedar vacía) cuando no hay ventas: usa SI.ERROR o SI(F9=0, 0, …).'; } },
    { tipo: 'valores', rango: 'H4:H8,H10:H12,I4:I11', titulo: 'Márgenes y participación correctos', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'valores', rango: 'L3:L6', titulo: 'Buscador y diagnóstico correctos', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'robustez', cambios: { C4: 45, E10: 300 }, rango: 'F12:H12,I4:I11', titulo: 'Las fórmulas siguen bien al cambiar datos', mensaje: 'Al cambiar un precio, {celda} no se actualiza bien: ¿fijaste $F$12 en la participación?' },
  ];

  LT.definirModulo({
    id: 20,
    objetivo: 'Identificar y corregir #¡DIV/0!, #N/A, #¿NOMBRE?, #¡REF! y #¡VALOR! con las herramientas de auditoría.',
    situacion: 'El becario armó el resumen de productos y está lleno de errores. Antes de la junta necesito que <b>todo cuadre</b>.',
    explicacion: [
      { html: '<h3>Cada error dice qué pasó</h3><table class="tabla-sitio"><thead><tr><th>Error</th><th>Qué significa</th><th>Causa típica</th><th>Cómo se corrige</th></tr></thead><tbody>' +
        '<tr><td><b>#¡DIV/0!</b></td><td>División entre cero</td><td>Dividir entre una celda vacía o con 0</td><td>Revisar el divisor; si el cero es esperado, <code>SI.ERROR</code> o <code>SI(F9=0,0,…)</code></td></tr>' +
        '<tr><td><b>#N/A</b></td><td>No se encontró</td><td>BUSCARX o BUSCARV no hallan el valor (espacio de más, código mal escrito)</td><td>Corregir el valor buscado o usar el argumento «si no se encuentra»</td></tr>' +
        '<tr><td><b>#¿NOMBRE?</b></td><td>Nombre desconocido</td><td>Función mal escrita (SUMAR) o texto sin comillas</td><td>Corregir el nombre o poner el texto entre comillas</td></tr>' +
        '<tr><td><b>#¡REF!</b></td><td>Referencia inválida</td><td>Se borró la fila, columna u hoja que usaba la fórmula</td><td>Volver a escribir la referencia correcta</td></tr>' +
        '<tr><td><b>#¡VALOR!</b></td><td>Tipo de dato incorrecto</td><td>Texto donde va un número («1O5» con letra O)</td><td>Corregir el dato</td></tr>' +
        '<tr><td><b>Referencia circular</b></td><td>La fórmula se usa a sí misma</td><td>El total incluye su propia celda</td><td>Ajustar el rango</td></tr></tbody></table>' +
        '<h3>Herramientas de auditoría (pestaña Fórmulas)</h3><ul><li><b>Rastrear precedentes:</b> flechas hacia las celdas que usa la fórmula.</li><li><b>Evaluar fórmula:</b> calcula paso a paso para ver dónde falla.</li><li><b>Comprobación de errores:</b> recorre todos los errores de la hoja.</li><li><b>Mostrar fórmulas</b> (<kbd>Ctrl+`</kbd>): ves las fórmulas en lugar de los resultados.</li></ul><p><b>Cuidado con SI.ERROR:</b> sirve cuando el error es esperado (un producto sin ventas), pero si lo usas para esconder todo, también escondes los errores de verdad.</p>' },
    ],
    ejemplo: {
      titulo: 'Un margen sin ventas',
      hoja: { hojas: [{ nombre: 'Resumen', datos: [['Producto', 'Ventas', 'Utilidad', 'Margen'], ['Latte', 13200, 9840, '=C2/B2'], ['Moka', 5760, 4224, '=C3/B3'], ['Croissant', 0, 0, '=C4/B4']], formatos: { 'B2:C4': '$#,##0', 'D2:D4': '0.0%' }, estilos: { 'A1:D1': ENC }, filas: 6, cols: 5 }], herramientas: [] },
      celda: 'D4', formula: '=C4/B4', pregunta: '¿Qué mostrará D4?', respuesta: '#¡DIV/0!',
      explicacion: ['B4 (ventas del Croissant) vale 0.', 'Dividir entre cero no tiene resultado: Excel muestra <b>#¡DIV/0!</b>.', 'Aquí el cero es esperado (no hubo ventas), así que es razonable usar <code>=SI.ERROR(C4/B4, 0)</code> o <code>=SI(B4=0, 0, C4/B4)</code>.'],
    },
    micro: [
      { titulo: '#N/A en una búsqueda', tipo: 'opcion', enunciado: '<code>=BUSCARX("CAF-01", A2:A21, B2:B21)</code> devuelve <b>#N/A</b>, aunque el Espresso sí está en la lista. ¿Por qué?', opciones: ['El código no existe tal cual: falta un cero (CAF-001)', 'BUSCARX no funciona con textos', 'El rango debe empezar en A1', 'Hay que usar BUSCARV'], correcta: 0, explicacion: 'BUSCARX busca coincidencias exactas: «CAF-01» no es «CAF-001». Revisa ceros, espacios y guiones.' },
      { titulo: 'Corrige el #¿NOMBRE?', tipo: 'hoja', enunciado: 'B7 debería mostrar el promedio de ventas, pero tiene un error. Corrígelo.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Sucursal', 'Ventas'], ['Centro', 97197], ['Norte', 87535], ['Sur', 78363], [], [], ['Promedio', '=PROMEDO(B2:B4)']], formatos: { 'B2:B7': '$#,##0' }, estilos: { 'A1:B1': ENC }, filas: 9, cols: 4 }], herramientas: ['auditoria'] },
        solucion: { B7: '=PROMEDIO(B2:B4)' },
        pruebas: [{ tipo: 'usa', rango: 'B7', funciones: ['PROMEDIO'], mensaje: 'Revisa cómo se escribe la función: PROMEDIO.' }, { tipo: 'valores', rango: 'B7' }],
        pista: ['#¿NOMBRE? casi siempre es una función mal escrita. ¿Falta una letra?'] },
    ],
    reto: {
      titulo: 'Cazador de errores: 8 errores sembrados', tipo: 'hoja', intro: 'La hoja <i>Resumen</i> tiene ocho errores. Algunos se ven como #¡…!, otros provocan errores en cadena, y uno es una referencia circular (mira la barra de estado).',
      base: {
        hoja: hojaErr(), solucion, pruebas,
        instrucciones: ['Encuentra y corrige los <b>8 errores</b> de la hoja (incluye el buscador de la derecha).', 'Las fórmulas deben quedar correctas, no solo sin mensaje de error.'],
        pistas: ['Empieza por los errores de origen: un error en una celda se propaga a las que dependen de ella. Usa Comprobar errores para verlos todos.', 'Rastrear precedentes muestra de dónde viene el dato; Evaluar fórmula muestra el paso donde falla. Revisa: unidades escritas como texto, una hoja que ya no existe, un nombre de función, un rango que se incluye a sí mismo, un código mal escrito, un texto sin comillas y una referencia que debió fijarse.', 'E6: 105 · G7: =F7-D7*E7 · F12: =SUMA(F4:F11) · G12: =SUMA(G4:G11) · H9: =SI.ERROR(G9/F9,0) · I4: =F4/$F$12 (y copiar) · L3: CAF-004 · L6: "Rentable" entre comillas.'],
      },
      niveles: {
        explorador: { instrucciones: ['<b>E6</b> (#¡VALOR! en F6): las unidades tienen una letra O; escribe 105.', '<b>G7</b> (#¡REF!): usa una hoja «Costos» que ya no existe; el costo está en D7.', '<b>F12</b> (#¿NOMBRE?): la función se llama SUMA.', '<b>G12</b> (referencia circular): el rango llega hasta G12; debe terminar en G11.', '<b>H9</b> (#¡DIV/0!): el Croissant no tuvo ventas; usa <code>=SI.ERROR(G9/F9,0)</code>.', '<b>I4:I11</b> (#¡DIV/0!): al copiar se movió el total; usa <code>=F4/$F$12</code> y cópiala.', '<b>L3</b> (#N/A en L4 y L5): el código correcto es CAF-004.', '<b>L6</b> (#¿NOMBRE?): el texto Rentable va entre comillas.'] },
        experto: {
          instrucciones: ['Corrige los 8 errores.', 'Usa SI.ERROR <b>solo</b> donde el error es esperado (el producto sin ventas); en el resto, corrige la causa.'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'SI.ERROR solo donde corresponde', fn: (x) => { const c = Object.entries(x.estado.hojas[0].celdas).find(([d, raw]) => d !== 'H9' && /SI\.ERROR|SI\.ND/i.test(raw)); return c ? c[0] + ' usa SI.ERROR para esconder un error: corrige la causa.' : true; } }],
        },
      },
    },
    lab: {
      archivo: 'lab20-errores.xlsx', titulo: 'Cazador de errores en Excel',
      contexto: 'El resumen de la sucursal Norte tiene los mismos tipos de errores.',
      pasos: {
        explorador: [{ texto: 'Usa Comprobación de errores para recorrerlos.', ruta: ['Fórmulas', 'Comprobación de errores'] }, { texto: 'Rastrea precedentes en las celdas con error.', ruta: ['Fórmulas', 'Rastrear precedentes'] }, { texto: 'Evalúa las fórmulas dudosas paso a paso.', ruta: ['Fórmulas', 'Evaluar fórmula'] }, 'Corrige los 8 errores (como en el simulador), guarda y sube el libro.'],
        analista: ['Corrige los 8 errores de la hoja Resumen.', 'Guarda y sube el libro.'],
        experto: ['Corrige los 8 errores usando SI.ERROR solo donde el error es esperado.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Sin errores en la hoja', fn: (L, A) => { const h = A.hoja('Resumen'); const e = Array.from(h.celdas.entries()).find(([, c]) => c.t === 'e' || (typeof c.v === 'string' && /^#/.test(c.v) && c.f != null)); return e ? e[0] + ' todavía muestra ' + e[1].v + '.' : true; } },
        { titulo: 'Sin referencias circulares', fn: (L) => { const f = L.formula('Resumen', 'G12') || ''; return /G12\b/.test(f.replace(/^=/, '').replace(/G4:G11/, '')) ? 'G12 se incluye a sí misma: el rango debe terminar en G11.' : true; } },
        { titulo: 'Totales y participación correctos', fn: (L, A) => {
          let tv = 0, tu = 0;
          for (let r = 4; r <= 11; r++) {
            const p = A.num(L.valor('Resumen', 'C' + r)), c = A.num(L.valor('Resumen', 'D' + r)), u = A.num(L.valor('Resumen', 'E' + r));
            if (u == null) return 'E' + r + ' no es un número.';
            if (!A.cerca(A.num(L.valor('Resumen', 'G' + r)), p * u - c * u)) return 'G' + r + ' debería ser ' + A.fmtEs(p * u - c * u) + '.';
            tv += p * u; tu += p * u - c * u;
          }
          if (!A.cerca(A.num(L.valor('Resumen', 'F12')), tv)) return 'F12 debería sumar ' + A.fmtEs(tv) + '.';
          if (!A.cerca(A.num(L.valor('Resumen', 'G12')), tu)) return 'G12 debería sumar ' + A.fmtEs(tu) + '.';
          for (let r = 4; r <= 11; r++) if (!A.cerca(A.num(L.valor('Resumen', 'I' + r)), A.num(L.valor('Resumen', 'F' + r)) / tv, 0.0005)) return 'I' + r + ' (participación) es incorrecta: ¿fijaste $F$12?';
          return true;
        } },
        { titulo: 'Buscador corregido', fn: (L) => (L.valor('Resumen', 'L4') && !/^#/.test(String(L.valor('Resumen', 'L4'))) ? true : 'Corrige el código buscado en L3.') },
        { titulo: 'SI.ERROR solo donde corresponde', nivel: 'experto', fn: (L) => { const h = L.hoja('Resumen'); const c = Array.from(h.celdas.entries()).filter(([d, x]) => x.f && /IFERROR|IFNA/i.test(x.f)).map(([d]) => d); return c.length <= 1 ? true : 'Usaste SI.ERROR en ' + c.join(', ') + ': úsalo solo donde el error es esperado.'; } },
      ],
    },
    donde: [
      { comando: 'Rastrear precedentes', ruta: ['Fórmulas', 'Rastrear precedentes'] },
      { comando: 'Evaluar fórmula', ruta: ['Fórmulas', 'Evaluar fórmula'] },
      { comando: 'Comprobación de errores', ruta: ['Fórmulas', 'Comprobación de errores'] },
      { comando: 'Mostrar fórmulas', ruta: ['Fórmulas', 'Mostrar fórmulas'], nota: 'Atajo: Ctrl+`.' },
    ],
    glosario: ['SI.ERROR', 'SI.ND', 'ESERROR', 'VALOR'],
    atajos: ['<kbd>Ctrl+`</kbd> muestra u oculta las fórmulas.', 'La barra de estado avisa «Referencias circulares» y la celda.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const { ENC, D } = LT.caso;
  const prods = D.productos.slice(0, 7);
  const ventas = [4200, 0, 3150, 0, 2780, 3900, 1500];
  LT.ampliarModulo(20, {
    objetivos: [
      'Reconocer qué significa cada error (#¡DIV/0!, #N/A, #¿NOMBRE?, #¡REF!, #¡VALOR!, #¡NUM!, #¡DESBORDAMIENTO!, ####) y su causa más probable.',
      'Rastrear precedentes y dependientes, y evaluar una fórmula paso a paso.',
      'Encontrar y romper referencias circulares.',
      'Decidir cuándo corregir la causa y cuándo controlar el error con SI.ERROR o SI.ND.',
      'Revisar un libro completo con Comprobación de errores e Ir a especial › Fórmulas con errores.',
    ],
    detalle: [
      { titulo: 'Diccionario de errores', abierto: true, html: '<table><tr><th>Error</th><th>Qué pasó</th><th>Ejemplo en La Taza</th><th>Cómo se corrige</th></tr><tr><td>#¡DIV/0!</td><td>División entre cero o celda vacía</td><td>Margen de un producto sin ventas</td><td>Revisar el dato o <code>=SI.ERROR(G9/F9,0)</code></td></tr><tr><td>#N/A</td><td>Una búsqueda no encontró el valor</td><td>Código «CAF-04» en lugar de «CAF-004»</td><td>Corregir el valor buscado o usar el «si no se encuentra» de BUSCARX</td></tr><tr><td>#¿NOMBRE?</td><td>Excel no reconoce un nombre</td><td><code>=PROMEDO(…)</code>, un texto sin comillas, un nombre definido que no existe</td><td>Corregir la escritura</td></tr><tr><td>#¡REF!</td><td>La celda referida ya no existe</td><td>Se borró la columna o la hoja que usaba la fórmula</td><td>Rehacer la referencia (o deshacer el borrado)</td></tr><tr><td>#¡VALOR!</td><td>Tipo de dato incorrecto</td><td>Multiplicar por «1O5» (con la letra O)</td><td>Convertir el texto en número</td></tr><tr><td>#¡NUM!</td><td>Número imposible</td><td>Una tasa sin solución en TASA</td><td>Revisar los argumentos</td></tr><tr><td>#¡DESBORDAMIENTO!</td><td>Una matriz dinámica no tiene espacio</td><td>Datos debajo de UNICOS</td><td>Despejar las celdas</td></tr><tr><td>#####</td><td>No es error: no cabe</td><td>Fecha en una columna angosta</td><td>Ensanchar la columna</td></tr></table>' },
      { titulo: 'Herramientas de auditoría', html: '<table><tr><th>Herramienta</th><th>Para qué</th><th>Ruta</th></tr><tr><td>Rastrear precedentes</td><td>Flechas hacia las celdas que usa la fórmula</td><td>Fórmulas › Rastrear precedentes</td></tr><tr><td>Rastrear dependientes</td><td>Flechas hacia las fórmulas que usan esta celda («¿qué se rompe si la borro?»)</td><td>Fórmulas › Rastrear dependientes</td></tr><tr><td>Evaluar fórmula</td><td>Calcula paso a paso, de adentro hacia afuera</td><td>Fórmulas › Evaluar fórmula</td></tr><tr><td>Comprobación de errores</td><td>Recorre los errores de la hoja uno por uno</td><td>Fórmulas › Comprobación de errores</td></tr><tr><td>Ventana Inspección</td><td>Vigila celdas de otras hojas mientras trabajas</td><td>Fórmulas › Ventana Inspección</td></tr><tr><td>Ir a especial</td><td>Selecciona todas las fórmulas con error (o constantes, o vacías)</td><td>Inicio › Buscar y seleccionar › Ir a especial</td></tr></table><p>Truco: dentro de la barra de fórmulas, selecciona una parte y pulsa <kbd>F9</kbd> para ver su valor (después <kbd>Esc</kbd> para no reemplazarla).</p>' },
      { titulo: 'Referencias circulares', html: '<p>Una fórmula que se usa a sí misma (por ejemplo, el total en F12 con <code>=SUMA(F4:F12)</code>) es una <b>referencia circular</b>: Excel avisa al escribirla y la barra de estado muestra «Referencias circulares: F12». Se corrige ajustando el rango (<code>F4:F11</code>). Las circulares intencionales (cálculo iterativo) existen, pero en un reporte casi siempre son un error.</p>' },
      { titulo: '¿Corregir o esconder?', html: '<p>SI.ERROR es útil cuando el error es <b>esperado</b> (un producto nuevo aún sin ventas). Pero si envuelves todo con SI.ERROR, también escondes errores reales (una búsqueda con el código mal escrito). Regla: corrige la causa; controla solo los casos previstos y, cuando sea posible, el error específico: <code>SI.ND</code> solo atrapa #N/A.</p>' },
    ],
    errores: [
      'Borrar una columna sin revisar sus dependientes y llenar el libro de #¡REF!.',
      'Ocultar con SI.ERROR un problema de datos que había que corregir.',
      'Incluir la celda del total en su propio rango (referencia circular).',
      'Confundir ##### con un error.',
    ],
    consejos: [
      'Antes de borrar, usa Rastrear dependientes.',
      'Usa Evaluar fórmula con las fórmulas anidadas largas: verás en qué paso aparece el error.',
      'Prefiere el «si no se encuentra» de BUSCARX a envolverlo en SI.ERROR.',
      'Agrega una celda de control: por ejemplo, que la suma de las sucursales sea igual al total.',
    ],
    microExtra: [
      {
        titulo: 'Margen sin #¡DIV/0!', tipo: 'hoja',
        enunciado: 'Algunos productos nuevos todavía no tienen ventas (B = 0). En C2:C8 calcula el margen <b>(Ventas − Costo) / Ventas</b> y muestra 0 cuando no haya ventas, en lugar de #¡DIV/0!.',
        hoja: { hojas: [{ nombre: 'Margen', datos: [['Producto', 'Ventas', 'Costo', 'Margen'], ...prods.map((p, i) => [p.nombre, ventas[i], Math.round(ventas[i] * p.costo / p.precio)])].map((f) => [f[0], f[1], f[2]]), formatos: { 'B2:C8': '$#,##0', 'D2:D8': '0.0%' }, estilos: { 'A1:D1': ENC }, anchos: { A: 140 }, objetivo: 'D2:D8', filas: 10, cols: 5 }], herramientas: ['formulas', 'auditoria'] },
        solucion: { 'D2:D8': '=SI.ERROR((B2-C2)/B2,0)' },
        pruebas: [{ tipo: 'formula', rango: 'D2:D8' }, { tipo: 'usa', rango: 'D2:D8', funciones: ['SI.ERROR', 'SI'], alguna: true, mensaje: 'En {celda} controla la división entre cero con SI.ERROR.' }, { tipo: 'valores', rango: 'D2:D8', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}. ¿Pusiste paréntesis en (B2-C2)?' }],
        pista: ['<code>=SI.ERROR((B2-C2)/B2, 0)</code>'],
      },
    ],
    autoeval: [
      { p: '¿Qué indica #¡REF! y qué acción suele causarlo?', r: 'Que la fórmula apunta a una celda que ya no existe; suele aparecer al eliminar filas, columnas u hojas usadas por la fórmula.' },
      { p: '¿Por qué <code>=B2*E2</code> da #¡VALOR! si E2 dice «1O5»?', r: 'Porque «1O5» lleva la letra O: es texto, no número. Hay que escribir 105.' },
      { p: '¿Qué hace Evaluar fórmula?', r: 'Calcula la fórmula paso a paso, mostrando el resultado de cada parte, para encontrar dónde aparece el error.' },
      { p: '¿Qué diferencia hay entre rastrear precedentes y dependientes?', r: 'Precedentes: las celdas que usa la fórmula. Dependientes: las fórmulas que usan la celda seleccionada.' },
      { p: '¿Cuándo está bien usar SI.ERROR?', r: 'Cuando el error es un caso previsto y su resultado alternativo tiene sentido (0 o vacío); no para ocultar errores de datos.' },
      { p: 'La barra de estado dice «Referencias circulares: F12». ¿Qué revisas?', r: 'Que la fórmula de F12 no se incluya a sí misma en su rango (por ejemplo, SUMA(F4:F12) en F12).' },
      { p: '¿Cómo seleccionas de golpe todas las fórmulas con error de una hoja?', r: 'Inicio › Buscar y seleccionar › Ir a especial › Fórmulas › solo «Errores».' },
    ],
    conexiones: [
      { id: 3, texto: 'mostrar fórmulas para revisar una hoja completa.' },
      { id: 11, texto: 'números guardados como texto que causan #¡VALOR! y #N/A.' },
      { id: 19, texto: 'el #N/A de las búsquedas y el «si no se encuentra» de BUSCARX.' },
      { proyecto: 'avanzado', texto: 'el tablero no debe mostrar ningún error al cambiar los filtros.' },
    ],
  });
})();
