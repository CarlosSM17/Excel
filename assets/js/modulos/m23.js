/* Módulo 23 · Obtener y transformar datos (Power Query) · versión 3 */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const SUC = ['Centro', 'Norte', 'Sur'];
  const NOTAS = ['', '', 'revisar ticket', '', 'pago mixto', '', '', 'cliente frecuente'];
  const sucio = (t, i) => [(s) => '  ' + s.toLowerCase() + ' ', (s) => s.toUpperCase(), (s) => s, (s) => s.toLowerCase() + '  '][i % 4](t);
  const nomPropio = (s) => String(s).toLowerCase().replace(/(^|[\s\-/(])([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase());
  /* Filas de la «carpeta» de un mes: un archivo por sucursal, con su fila TOTAL y una fila vacía al final */
  const filasMes = (mm) => {
    const out = [];
    let k = 0;
    for (const s of SUC) {
      const vs = D.ventas.filter((v) => v.fecha.slice(5, 7) === mm && v.sucursal === s);
      const archivo = 'ventas-' + s.toLowerCase() + '-' + mm + '.csv';
      vs.forEach((v) => { out.push([archivo, fecha(v.fecha), sucio(v.producto, k), String(v.cantidad), String(v.precio), NOTAS[k % NOTAS.length]]); k++; });
      out.push([archivo, '', 'TOTAL', String(vs.reduce((a, v) => a + v.cantidad, 0)), '', '']);
      out.push([null, null, null, null, null, null]);
    }
    return out;
  };
  const ventasMes = (mm) => D.ventas.filter((v) => v.fecha.slice(5, 7) === mm);
  const COLS = ['Source.Name', 'fecha', 'producto', 'cantidad', 'precio', 'notas'];
  const origenReto = (v) => ({ nombre: 'Ventas', cols: COLS, filas: v === 0 ? filasMes('11') : filasMes('11').concat(filasMes('12')), m: 'Folder.Files("C:\\La Taza\\Ventas") · combinar archivos' + (v ? ' (noviembre y diciembre)' : ' (noviembre)') });
  const porSucursal = (mm) => SUC.flatMap((s) => ventasMes(mm).filter((v) => v.sucursal === s));
  const esperadas = (v) => (v === 0 ? porSucursal('11') : porSucursal('11').concat(porSucursal('12')));

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const experto = nivel === 'experto';
    let est = null;
    let resp = '';
    const zona = h('div');
    const preg = experto ? h('div', { class: 'aviso-caja info' }, 'Después de cargar, pulsa «Actualizar»: llegaron los archivos de diciembre a la carpeta. ¿Cuántas filas carga ahora la consulta? ', h('input', { type: 'number', style: { width: '90px' }, oninput: (e) => { resp = e.target.value; } })) : null;
    cont.append(zona);
    if (preg) cont.append(preg);
    let ed;
    setTimeout(() => { ed = LT.widgets.editorPQ(zona, { origen: origenReto, versiones: experto ? 2 : 1, textoActualizar: 'Llegaron los archivos de diciembre: los mismos pasos se aplicaron a 6 archivos.', alCambiar: (e) => { est = e; } }); cont.__editor = ed; }, 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const e = est || (ed && ed.estado());
        if (!e) return { ok: false, resultados: [{ ok: false, mensaje: 'Todavía no cargó el editor.' }] };
        const t = e.tabla;
        const idx = (n) => t.cols.findIndex((c) => c.toLowerCase() === n.toLowerCase());
        const esperado = esperadas(e.version);
        add(e.fallo < 0, 'Todos los pasos se aplican sin fallar', e.fallo >= 0 ? 'El paso ' + (e.fallo + 1) + ' falla: revísalo o elimínalo.' : '');
        add(idx('notas') < 0, 'Columna «notas» quitada', 'Quita la columna «notas»: no se usa en el análisis.');
        add(t.filas.length === esperado.length && !t.filas.some((f) => f.every((x) => x == null || x === '')), 'Sin filas vacías ni filas TOTAL (' + esperado.length + ' ventas)', 'La consulta tiene ' + t.filas.length + ' filas y deberían quedar ' + esperado.length + ' ventas: quita las filas en blanco y filtra las filas «TOTAL» de la columna producto.');
        const errores = t.filas.reduce((s, f) => s + f.filter((x) => x && x.error).length, 0);
        add(!errores, 'Sin celdas con error', 'Hay ' + errores + ' celdas con «Error»: revisa el orden (filtra antes de cambiar tipos) o el tipo elegido.');
        const ip = idx('producto');
        add(ip >= 0 && t.filas.every((f, i) => esperado[i] && f[ip] === nomPropio(esperado[i].producto)), 'Productos recortados y con mayúscula inicial', 'En «producto» aplica Formato › Recortar y Formato › Poner En Mayúsculas Cada Palabra.');
        const tipoDe = (n) => (idx(n) >= 0 ? t.tipos[idx(n)] : null);
        add(tipoDe('fecha') === 'fecha', 'fecha con tipo Fecha', 'Cambia el tipo de «fecha» a Fecha.');
        add(tipoDe('cantidad') === 'entero', 'cantidad con tipo Número entero', 'Cambia el tipo de «cantidad» a Número entero.');
        add(['decimal', 'entero'].includes(tipoDe('precio')), 'precio con tipo numérico', 'Cambia el tipo de «precio» a Número decimal.');
        const is = idx('Sucursal');
        add(is >= 0 && t.filas.every((f, i) => esperado[i] && f[is] === esperado[i].sucursal), 'Columna «Sucursal» (Centro, Norte, Sur) tomada del nombre del archivo', idx('Source.Name') >= 0 ? 'Convierte «Source.Name» en la sucursal: Extraer › Texto entre delimitadores («-» y «-»), Poner En Mayúsculas Cada Palabra y cámbiale el nombre a «Sucursal».' : 'Falta la columna «Sucursal» con Centro, Norte o Sur.');
        const it = idx('Total');
        add(it >= 0 && t.filas.every((f, i) => esperado[i] && Math.abs(f[it] - esperado[i].total) < 0.01), 'Columna «Total» = cantidad × precio', 'Agrega una columna personalizada «Total» = [cantidad] × [precio] (después de cambiar sus tipos).');
        if (experto) {
          const im = idx('Mes');
          add(im >= 0 && t.filas.every((f, i) => esperado[i] && f[im] === +esperado[i].fecha.slice(5, 7)), 'Columna «Mes» desde la fecha', 'Agrega la columna «Mes» con Agregar columna › Fecha › Mes (la fecha debe ser tipo Fecha).');
          add(e.version === 1, 'Consulta actualizada con diciembre', 'Pulsa «Actualizar» para que la consulta incluya los archivos de diciembre.');
          add(+resp === esperadas(1).length, 'Filas después de actualizar: correcto', resp ? 'Revisa el número de filas que muestra la consulta después de actualizar.' : 'Responde cuántas filas carga la consulta con diciembre.');
        }
        add(e.cargado, 'Resultado cargado', 'Pulsa «Cerrar y cargar» al terminar.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  const miniOrigen = () => ({ nombre: 'Insumos', cols: ['Column1', 'Column2', 'Column3'], filas: [['Insumo', 'Proveedor', 'Cantidad'], ['Leche entera', 'Lácteos del Valle', '120'], ['Café en grano', 'Finca El Mirador', '45'], ['Azúcar mascabado', 'Dulce Origen', '30'], ['Vasos 12 oz', 'Empaques MX', '800']], m: 'Csv.Document(File.Contents("insumos.csv"))' });

  LT.definirModulo({
    id: 23,
    objetivo: 'Importar datos de archivos CSV, de una carpeta o de otro libro con Power Query, limpiarlos con pasos que se repiten solos (quitar columnas y filas, recortar, cambiar tipos, extraer, agregar columnas), anexar o combinar consultas, cargarlas como tabla y actualizarlas con un clic.',
    situacion: 'Cada mes las tres sucursales me mandan su CSV de ventas: con una fila TOTAL, filas vacías, productos escritos como sea y una columna de notas. Hoy alguien los copia y pega y los limpia a mano durante una tarde. Quiero que <b>el próximo mes sea un solo clic en «Actualizar»</b>.',
    explicacion: [
      { html: '<h3>Qué es Power Query</h3><p>Power Query (Datos › <b>Obtener y transformar datos</b>) es el motor de Excel para <b>traer</b> datos (CSV, otros libros, carpetas, bases de datos, la web), <b>limpiarlos</b> en el Editor de Power Query y <b>cargarlos</b> como tabla. Cada acción que haces en el editor se guarda como un <b>paso aplicado</b>: cuando llegan datos nuevos, <b>Actualizar</b> repite todos los pasos en segundos. Tus datos originales no se modifican.</p><table class="tabla-sitio"><tr><th>Etapa</th><th>En Excel</th></tr><tr><td>1. Obtener</td><td>Datos › Obtener datos › Desde archivo › Desde texto/CSV, Desde libro, <b>Desde carpeta</b></td></tr><tr><td>2. Transformar</td><td>Editor de Power Query: Inicio, Transformar y Agregar columna</td></tr><tr><td>3. Cargar</td><td>Inicio › Cerrar y cargar (tabla en una hoja) o Cerrar y cargar en… (solo conexión, tabla dinámica)</td></tr><tr><td>4. Actualizar</td><td>Datos › Actualizar todo (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>F5</kbd>)</td></tr></table>' },
      { html: '<h3>Transformaciones más usadas</h3><ul><li><b>Usar la primera fila como encabezado</b> y <b>Cambiar tipo</b> (texto, número entero, decimal, fecha): el tipo correcto es lo que permite sumar y agrupar después.</li><li><b>Quitar columnas</b> y <b>quitar filas</b> (en blanco, superiores, duplicados) o <b>filtrar</b> con la flecha del encabezado (por ejemplo, producto distinto de «TOTAL»).</li><li><b>Formato</b>: Recortar, Limpiar, MAYÚSCULAS, Poner En Mayúsculas Cada Palabra.</li><li><b>Dividir columna</b> y <b>Extraer</b> (primeros caracteres, texto entre delimitadores).</li><li><b>Agregar columna</b>: personalizada (<code>[cantidad] * [precio]</code>), de fecha (año, mes, nombre del día) o de ejemplos.</li><li><b>Anexar consultas</b> (una debajo de otra, misma estructura) y <b>Combinar consultas</b> (traer columnas de otra tabla por una clave, como un BUSCARX).</li></ul>' },
      { titulo: 'Pruébalo: promueve encabezados y cambia tipos', instr: 'El CSV de insumos llegó con los encabezados como primera fila. Usa «Usar primera fila como encabezado», luego selecciona «Cantidad» y cámbiala a Número entero. Observa los pasos aplicados y el código M.', widget: (c) => LT.widgets.editorPQ(c, { origen: miniOrigen }) },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Unir los CSV de una carpeta',
      pasos: [
        'Guarda los archivos del mes (ventas-centro.csv, ventas-norte.csv, ventas-sur.csv) en una sola carpeta.',
        { texto: 'Datos › Obtener datos › Desde archivo › <b>Desde carpeta</b> › elige la carpeta › <b>Combinar › Combinar y transformar datos</b>.', ruta: ['Datos', 'Obtener datos', 'Desde archivo', 'Desde carpeta'] },
        'Power Query toma un archivo de muestra, une todos y agrega la columna <b>Source.Name</b> con el nombre de cada archivo.',
        'En el editor: quita la columna notas, filtra las filas TOTAL y en blanco, recorta y da formato a producto, y cambia los tipos.',
        'Extrae la sucursal de Source.Name, agrega la columna Total y pulsa <b>Cerrar y cargar</b>.',
        'El próximo mes: copia los CSV nuevos en la carpeta y usa Datos › <b>Actualizar todo</b>.',
      ],
      pregunta: { texto: 'El próximo mes llega también el archivo de una cuarta sucursal a la misma carpeta. Al pulsar Actualizar, ¿qué pasa?', opciones: ['Se combinan los cuatro archivos y se les aplican los mismos pasos', 'Solo se actualizan los tres archivos originales', 'Hay que repetir la limpieza a mano', 'La consulta se borra'], correcta: 0, explicacion: 'La consulta «Desde carpeta» toma todos los archivos que haya en ella al actualizar; los pasos se aplican a todos.' },
    },
    micro: [
      { titulo: 'Pasos que se repiten', tipo: 'opcion', enunciado: 'Limpiaste el CSV de octubre en el Editor de Power Query y lo cargaste. En noviembre reemplazas el archivo por el nuevo (mismo nombre y estructura) y pulsas <b>Actualizar</b>. ¿Qué pasa?', opciones: ['Los pasos aplicados se ejecutan otra vez sobre los datos de noviembre', 'Se cargan los datos de noviembre sin limpiar', 'Se mantienen los datos de octubre', 'Excel pide repetir cada paso'], correcta: 0, explicacion: 'Esa es la ventaja de Power Query: los pasos quedan guardados en la consulta y se repiten al actualizar.' },
      {
        titulo: 'Encabezados y tipo', tipo: 'widget',
        enunciado: 'En la consulta de insumos: <b>usa la primera fila como encabezado</b> y cambia <b>Cantidad</b> a <b>Número entero</b>. Luego pulsa «Cerrar y cargar».',
        crear: (c, listo) => {
          const { h } = LT.u;
          const res = h('div');
          let e = null;
          const ed = LT.widgets.editorPQ(c, { origen: miniOrigen, alCambiar: (x) => { e = x; } });
          c.appendChild(h('div', { class: 'grupo-btn', style: { marginTop: '8px' } }, h('button', { class: 'btn primario chico', onclick: () => {
            e = e || ed.estado();
            const t = e.tabla;
            const i = t.cols.indexOf('Cantidad');
            res.innerHTML = '';
            const msg = !t.cols.includes('Insumo') ? 'Usa «Usar primera fila como encabezado»: las columnas siguen llamándose Column1, Column2…' : i < 0 ? 'No encuentro la columna Cantidad.' : t.tipos[i] !== 'entero' ? 'Selecciona Cantidad y cambia su tipo a Número entero.' : t.filas.length !== 4 ? 'Deben quedar 4 insumos.' : !e.cargado ? 'Falta «Cerrar y cargar».' : null;
            res.appendChild(h('div', { class: 'aviso-caja ' + (msg ? 'alerta' : 'ok') }, msg || '✓ ¡Listo! La cantidad ya es numérica: se puede sumar.'));
            if (!msg) listo();
          } }, 'Verificar')), res);
        },
      },
      { titulo: 'Anexar o combinar', tipo: 'opcion', enunciado: 'Tienes la consulta <b>Pedidos</b> (con el código de producto) y la consulta <b>Catálogo</b> (código, precio y categoría). Quieres agregar a cada pedido su categoría. ¿Qué usas?', opciones: ['Combinar consultas (por la columna código) y expandir Categoría', 'Anexar consultas', 'Quitar duplicados', 'Dividir columna'], correcta: 0, explicacion: 'Combinar une dos consultas por una clave, como un BUSCARX; Anexar pone una tabla debajo de otra (misma estructura).', retro: { 1: 'Anexar pondría los productos del catálogo debajo de los pedidos.' } },
    ],
    reto: {
      titulo: 'Unir las ventas de las tres sucursales sin copiar y pegar', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Quita la columna <b>notas</b>.', 'Quita las filas en blanco y filtra las filas <b>TOTAL</b> de la columna producto.', 'En <b>producto</b>: Recortar y Poner En Mayúsculas Cada Palabra.', 'Tipos: <b>fecha</b> → Fecha, <b>cantidad</b> → Número entero, <b>precio</b> → Número decimal.', 'Convierte <b>Source.Name</b> en <b>Sucursal</b>: extrae el texto entre los guiones, ponle mayúscula inicial y cámbiale el nombre.', 'Agrega la columna <b>Total</b> = cantidad × precio y pulsa <b>Cerrar y cargar</b>.'],
        pistas: ['Filtra antes de cambiar los tipos: las filas TOTAL y vacías producen errores al convertir.', 'Extraer › Texto entre delimitadores: inicial «-», final «-» (de «ventas-centro-11.csv» queda «centro»).', 'Orden sugerido: Quitar columna notas → Quitar filas en blanco → Filtrar producto ≠ TOTAL → Recortar → Mayúsculas cada palabra → tipos → Extraer en Source.Name → Mayúsculas cada palabra → Cambiar nombre a Sucursal → Columna personalizada Total.'],
      },
      niveles: {
        explorador: { instrucciones: ['Clic en el encabezado <b>notas</b> › «Quitar columna».', '«Quitar filas en blanco».', 'Clic en <b>producto</b> › «Filtrar…» › «no es igual a» › TOTAL.', 'Con <b>producto</b> seleccionada: «Formato…» › Recortar; otra vez «Formato…» › Poner En Mayúsculas Cada Palabra.', '<b>fecha</b> › «Tipo de datos…» › Fecha; <b>cantidad</b> › Número entero; <b>precio</b> › Número decimal.', '<b>Source.Name</b> › «Extraer…» (inicial -, final -) › «Formato…» › Poner En Mayúsculas Cada Palabra › «Cambiar nombre…» › Sucursal.', '«Columna personalizada (×)…» › Total = cantidad × precio › «Cerrar y cargar».'] },
        experto: { instrucciones: ['Resuelve todo lo del nivel Analista.', 'Agrega la columna <b>Mes</b> desde la fecha (Agregar columna › Fecha › Mes).', 'Carga, pulsa <b>Actualizar</b> (llegan los archivos de diciembre) y responde cuántas filas carga ahora la consulta.'] },
      },
    },
    lab: {
      archivo: 'lab23-power-query.xlsx', titulo: 'Consulta de ventas desde una carpeta', hoja: 'Respuestas', acepta: '.xlsx,.xlsm',
      descargas: [{ ruta: 'laboratorios/lab23-ventas-csv.zip', texto: 'CSV de las sucursales (.zip)' }],
      contexto: 'Descomprime el .zip en una carpeta: trae los tres CSV de noviembre. Importa y limpia con Power Query (no copies y pegues), carga el resultado como tabla en el libro del laboratorio y contesta la hoja Respuestas con fórmulas sobre esa tabla.',
      notaWeb: 'Power Query completo (Desde carpeta) requiere Excel de escritorio para Windows o Microsoft 365 para Mac reciente. En Excel para la web solo se pueden actualizar algunas consultas.',
      sol: { 'Respuestas!B3': 60, 'Respuestas!B4': D.ventas.filter((v) => v.fecha.slice(5, 7) === '11').reduce((s, v) => s + v.total, 0), 'Respuestas!B5': D.ventas.filter((v) => v.fecha.slice(5, 7) === '11' && v.sucursal === 'Norte').reduce((s, v) => s + v.total, 0) },
      pasos: {
        explorador: [
          { texto: 'Datos › Obtener datos › Desde archivo › Desde carpeta › elige la carpeta descomprimida › Combinar › Combinar y transformar datos.', ruta: ['Datos', 'Obtener datos', 'Desde archivo', 'Desde carpeta'] },
          'En el editor: quita la columna notas; quita filas en blanco; filtra producto distinto de TOTAL; Recortar y Poner En Mayúsculas Cada Palabra en producto.',
          'Tipos: fecha (Fecha), cantidad (Número entero), precio (Número decimal). Extrae la sucursal de Source.Name y cámbiale el nombre a Sucursal. Agrega la columna personalizada Total = [cantidad]*[precio].',
          { texto: 'Inicio › Cerrar y cargar en… › Tabla › hoja existente «Datos», celda A1.', ruta: ['Inicio', 'Cerrar y cargar'] },
          'En Respuestas: B3 = número de ventas, B4 = total vendido, B5 = total de Norte (usa CONTARA, SUMA y SUMAR.SI sobre la tabla cargada). Guarda y sube el libro.',
        ],
        analista: ['Importa los tres CSV con Power Query (Desde carpeta o uno por uno y Anexar).', 'Limpia: sin notas, sin filas TOTAL ni vacías, producto recortado y con mayúscula inicial, tipos correctos, columna Sucursal y columna Total.', 'Carga el resultado como tabla.', 'En Respuestas: B3 número de ventas, B4 total vendido, B5 total de Norte, con fórmulas sobre la tabla cargada.', 'Guarda y sube el libro.'],
        experto: ['Todo lo del nivel Analista.', 'Agrega en la consulta la columna Mes (Agregar columna › Fecha › Mes).', 'Crea una tabla dinámica a partir de la tabla cargada con Sucursal en filas y Suma de Total en valores.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { t: 'consulta', titulo: 'Los datos se importaron con Power Query', pasos: [{ patron: 'Folder\\.Files|Csv\\.Document|File\\.Contents|Table\\.Combine', msg: 'La consulta debe leer los CSV (Desde carpeta o Desde texto/CSV).' }] },
        { t: 'consulta', titulo: 'Tipos de datos cambiados en la consulta', pasos: [{ patron: 'Table\\.TransformColumnTypes', msg: 'Cambia los tipos de fecha, cantidad y precio en el editor de Power Query.' }] },
        { t: 'consulta', titulo: 'Filas TOTAL y vacías filtradas', pasos: [{ patron: 'Table\\.SelectRows', msg: 'Filtra las filas TOTAL y en blanco (Inicio › Quitar filas o la flecha del filtro).' }] },
        { t: 'consulta', titulo: 'Columna Total agregada en la consulta', pasos: [{ patron: 'Table\\.AddColumn', msg: 'Agrega la columna Total con Agregar columna › Columna personalizada.' }] },
        { t: 'consulta', cargada: true, titulo: 'Resultado cargado como tabla' },
        { t: 'formula', r: 'Respuestas!B3:B5', titulo: 'Las respuestas son fórmulas' },
        { t: 'valores', r: 'Respuestas!B3:B5', titulo: 'Número de ventas, total y total de Norte correctos', msg: '{celda} muestra {obtenido}, pero se esperaba {esperado}: ¿quedaron fuera las filas TOTAL y vacías?' },
        { t: 'consulta', nivel: 'experto', titulo: 'Columna Mes en la consulta', pasos: [{ patron: 'Date\\.Month', msg: 'Agrega la columna Mes (Agregar columna › Fecha › Mes).' }] },
        { t: 'dinamica', nivel: 'experto', filas: ['Sucursal'], valores: ['Total'], titulo: 'Tabla dinámica por sucursal' },
      ],
    },
    donde: [
      { comando: 'Obtener datos desde una carpeta', ruta: ['Datos', 'Obtener datos', 'Desde archivo', 'Desde carpeta'] },
      { comando: 'Desde texto/CSV', ruta: ['Datos', 'Desde texto/CSV'] },
      { comando: 'Consultas y conexiones', ruta: ['Datos', 'Consultas y conexiones'], nota: 'Panel con todas las consultas del libro; doble clic para editar.' },
      { comando: 'Actualizar todo', ruta: ['Datos', 'Actualizar todo'] },
    ],
    glosario: ['SUMAR.SI', 'CONTARA'],
    atajos: ['<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>F5</kbd> actualiza todas las consultas y tablas dinámicas.', 'En el editor, clic derecho en un paso aplicado › Editar configuración, para cambiarlo sin rehacerlo.'],
  });

  LT.ampliarModulo(23, {
    objetivos: [
      'Explicar el ciclo obtener → transformar → cargar → actualizar y en qué se diferencia de copiar y pegar.',
      'Importar un CSV, otro libro o una carpeta completa de archivos.',
      'Limpiar datos con pasos aplicados: encabezados, tipos, quitar filas y columnas, filtrar, recortar, extraer y reemplazar.',
      'Agregar columnas personalizadas y de fecha.',
      'Anexar consultas con la misma estructura y combinar consultas por una clave.',
      'Cargar el resultado como tabla (o solo conexión) y actualizarlo cuando llegan datos nuevos.',
    ],
    detalle: [
      { titulo: 'Copiar y pegar frente a Power Query', abierto: true, html: '<table><tr><th></th><th>Copiar, pegar y limpiar a mano</th><th>Power Query</th></tr><tr><td>Mes siguiente</td><td>Repetir todo</td><td>Actualizar</td></tr><tr><td>Errores</td><td>Fáciles de cometer y difíciles de ver</td><td>Los pasos son siempre los mismos y se pueden revisar</td></tr><tr><td>Datos originales</td><td>A veces se modifican</td><td>No se tocan</td></tr><tr><td>Volumen</td><td>Se vuelve lento con miles de filas</td><td>Millones de filas (cargando al modelo de datos)</td></tr><tr><td>Trazabilidad</td><td>Nadie sabe qué se hizo</td><td>Pasos aplicados y código M</td></tr></table>' },
      { titulo: 'El lenguaje M (sin miedo)', html: '<p>Cada paso es una línea de código M que toma el resultado del paso anterior. No necesitas escribirlo, pero leerlo ayuda a entender qué hace la consulta (Inicio › Editor avanzado):</p><pre class="mono" style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:10px;overflow:auto">let\n    Origen = Folder.Files("C:\\La Taza\\Ventas"),\n    Columnas = Table.RemoveColumns(Combinado, {"notas"}),\n    Filtradas = Table.SelectRows(Columnas, each [producto] &lt;&gt; "TOTAL"),\n    Tipos = Table.TransformColumnTypes(Filtradas, {{"fecha", type date}, {"cantidad", Int64.Type}}),\n    Total = Table.AddColumn(Tipos, "Total", each [cantidad] * [precio], type number)\nin\n    Total</pre>' },
      { titulo: 'Anexar y combinar', html: '<table><tr><th>Operación</th><th>Equivale a</th><th>Ejemplo</th></tr><tr><td>Anexar consultas</td><td>Poner tablas una debajo de otra (misma estructura)</td><td>Ventas de Centro + Norte + Sur</td></tr><tr><td>Combinar consultas</td><td>Traer columnas de otra tabla por una clave (como BUSCARX)</td><td>A cada venta agregarle la categoría y el costo desde el Catálogo</td></tr></table><p>Al combinar eliges el tipo de combinación: <b>externa izquierda</b> (todas las ventas y lo que coincida del catálogo) es la más común; <b>interna</b> deja solo las que coinciden; <b>anti izquierda</b> encuentra las ventas cuyo producto no existe en el catálogo (útil para auditar).</p>' },
      { titulo: 'Buenas prácticas al cargar', html: '<ul><li>Cambia el tipo de datos al final de la limpieza (y revisa que no haya «Error»).</li><li>Nombra las consultas y los pasos (clic derecho › Cambiar nombre) para que el código se lea.</li><li>Usa «Cerrar y cargar en… › Solo crear conexión» para consultas intermedias que no necesitas ver.</li><li>Carga al <b>modelo de datos</b> cuando quieras relacionar varias tablas en una tabla dinámica.</li><li>Si mueves la carpeta, edita el paso Origen (o crea un parámetro con la ruta).</li></ul>' },
    ],
    errores: [
      'Copiar y pegar los datos ya limpios en lugar de cargar la consulta: se pierde la actualización.',
      'Cambiar tipos antes de filtrar filas TOTAL o encabezados repetidos: aparecen errores.',
      'Archivos con columnas en otro orden o con otro nombre: la combinación los desalinea.',
      'Editar a mano la tabla cargada: al actualizar, Power Query la reemplaza.',
    ],
    consejos: [
      'Guarda los archivos de cada mes con el mismo nombre de columnas y en la misma carpeta.',
      'Revisa los pasos aplicados de arriba hacia abajo cuando algo no cuadre.',
      'Agrega cálculos y fórmulas en columnas fuera de la tabla cargada o en otra hoja.',
      'Combina Power Query (preparar) + tabla dinámica (resumir) + segmentaciones (filtrar) para un tablero que se actualiza solo.',
    ],
    autoeval: [
      { p: '¿Qué es un «paso aplicado»?', r: 'Cada transformación que haces en el Editor de Power Query; queda guardada en la consulta y se repite en orden al actualizar.' },
      { p: '¿Qué ventaja tiene «Desde carpeta» sobre importar cada CSV?', r: 'Combina todos los archivos que haya en la carpeta y, al actualizar, incluye los nuevos sin cambiar la consulta.' },
      { p: '¿Por qué conviene filtrar las filas TOTAL antes de cambiar el tipo de las columnas?', r: 'Porque esas filas tienen textos o vacíos donde se esperan números o fechas, y al convertir generan errores.' },
      { p: '¿Qué diferencia hay entre anexar y combinar consultas?', r: 'Anexar apila tablas con la misma estructura; combinar agrega columnas de otra tabla buscando por una clave.' },
      { p: 'Alguien corrigió un dato directamente en la tabla cargada. ¿Qué pasará al actualizar?', r: 'La corrección se pierde: Power Query vuelve a cargar la tabla desde el origen. Hay que corregir el origen o agregar un paso.' },
      { p: '¿Cómo actualizas todas las consultas del libro?', r: 'Datos › Actualizar todo (Ctrl+Alt+F5).' },
      { p: '¿Cómo se obtiene la sucursal desde el nombre «ventas-centro-11.csv»?', r: 'Con Extraer › Texto entre delimitadores (de «-» a «-») y luego Poner En Mayúsculas Cada Palabra.' },
    ],
    conexiones: [
      { id: 11, texto: 'las mismas limpiezas de texto y fechas, pero con pasos que se repiten.' },
      { id: 12, texto: 'ordenar, filtrar, quitar duplicados y dividir columnas, ahora automáticos.' },
      { id: 13, texto: 'el resultado se carga como tabla con nombre.' },
      { id: 17, texto: 'la tabla dinámica resume lo que la consulta prepara.' },
      { proyecto: 'avanzado', texto: 'el tablero anual se alimenta de una consulta que une las sucursales.' },
    ],
  });
})();
