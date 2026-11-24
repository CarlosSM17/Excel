/* Módulo 15 · Validación de datos (versión 3) */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const CLI = D.clientesCorp;
  const PROD = D.productos;
  const ped = D.pedidos.slice(0, 10).map((p, i) => ({ folio: 3001 + i, fecha: p.fecha, cliente: p.cliente, producto: p.producto, cantidad: p.cantidad, estado: p.estado }));
  const NUEVO = { folio: 3011, fecha: '2025-11-12', cliente: 'Gimnasio Fénix', producto: 'Cold brew', cantidad: 30, estado: 'Pendiente' };
  const ESTADOS = ['Pendiente', 'Entregado', 'Cancelado'];
  const libro = (experto) => ({
    hojas: [
      { nombre: 'Pedidos', datos: [['Folio', 'Fecha', 'Cliente', 'Producto', 'Cantidad', 'Estado'].concat(experto ? ['Observaciones'] : []), ...ped.map((p) => [p.folio, fecha(p.fecha), p.cliente, p.producto, p.cantidad, p.estado])], formatos: { 'B2:B30': 'dd/mm/yyyy' }, estilos: { 'A1:G1': ENC, 'A12:G12': { bg: '#fff8d6' } }, anchos: { A: 60, B: 90, C: 180, D: 160, E: 74, F: 90, G: 200 }, inmovilizar: { filas: 1 }, filas: 32 },
      { nombre: 'Clientes', datos: [['Cliente', 'Contacto'], ...CLI.map((c) => [c.cliente, c.contacto])], estilos: { 'A1:B1': ENC }, anchos: { A: 190, B: 170 } },
      { nombre: 'Catálogo', datos: [['Producto', 'Precio'], ...PROD.map((p) => [p.nombre, p.precio])], formatos: { 'B2:B21': '$#,##0' }, estilos: { 'A1:B1': ENC }, anchos: { A: 180 } },
    ],
    pestanas: true, herramientas: ['datos', 'portapapeles'], altura: 400,
  });
  const val = (x, hoja, celda) => { const h = x.estado.hojas.find((y) => y.nombre === hoja); return h ? h.validaciones.find((v) => LT.refs.celdasDe(v.rango).some((c) => c.dir === celda)) : null; };
  const hasta = (v, fila) => String(v.rango).split(',').some((p) => { const g = LT.refs.parseRango(p); return g && g.r2 + 1 >= fila; });
  const listaCon = (x, v, esperados) => { const vals = x.hoja.valoresLista(v, 0).map((s) => s.toLowerCase()); return esperados.every((e) => vals.includes(e.toLowerCase())); };
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Clientes desde la hoja Clientes', fn: (x) => { const v = val(x, 'Pedidos', 'C2'); if (!v || v.tipo !== 'lista') return 'Falta la lista desplegable de clientes en C2:C30 (Validación › Lista › Origen =Clientes!$A$2:$A$11).'; if (!listaCon(x, v, CLI.map((c) => c.cliente))) return 'La lista de clientes debe tomar los 10 clientes de la hoja Clientes (=Clientes!$A$2:$A$11).'; return hasta(v, 30) ? true : 'La lista de clientes debe cubrir hasta la fila 30.'; } },
    { tipo: 'fn', titulo: 'Productos desde el Catálogo', fn: (x) => { const v = val(x, 'Pedidos', 'D2'); if (!v || v.tipo !== 'lista') return 'Falta la lista desplegable de productos en D2:D30 (Origen =Catálogo!$A$2:$A$21).'; if (!listaCon(x, v, PROD.map((p) => p.nombre))) return 'La lista de productos debe tomar los 20 productos de la hoja Catálogo.'; return hasta(v, 30) ? true : 'La lista de productos debe cubrir hasta la fila 30.'; } },
    { tipo: 'fn', titulo: 'Cantidad entera de 1 a 200', fn: (x) => { const v = val(x, 'Pedidos', 'E2'); if (!v || v.tipo !== 'entero' || +v.min !== 1 || +v.max !== 200) return 'En Cantidad (E2:E30) permite solo números enteros entre 1 y 200.'; return hasta(v, 30) ? true : 'La validación de cantidad debe cubrir hasta la fila 30.'; } },
    { tipo: 'fn', titulo: 'Estado con lista fija', fn: (x) => { const v = val(x, 'Pedidos', 'F2'); if (!v || v.tipo !== 'lista') return 'Falta la lista de Estado en F2:F30 con Pendiente, Entregado y Cancelado.'; const vals = x.hoja.valoresLista(v, 0); if (vals.length !== 3 || !listaCon(x, v, ESTADOS)) return 'La lista de Estado debe tener exactamente: Pendiente, Entregado, Cancelado.'; return hasta(v, 30) ? true : 'La lista de Estado debe cubrir hasta la fila 30.'; } },
    { tipo: 'valores', rango: 'Pedidos!A12:F12', esperado: [[NUEVO.folio, LT.caso.serial(NUEVO.fecha), NUEVO.cliente, NUEVO.producto, NUEVO.cantidad, NUEVO.estado]], titulo: 'Pedido nuevo capturado con las listas', mensaje: '{celda} muestra {obtenido}; el pedido nuevo es 3011 · 12/11/2025 · Gimnasio Fénix · Cold brew · 30 · Pendiente.' },
  ];
  const aplicar = (experto) => (hj) => {
    const h = hj.libro.hojas[0];
    h.validaciones.push({ rango: 'C2:C30', tipo: 'lista', origen: '=Clientes!$A$2:$A$11' }, { rango: 'D2:D30', tipo: 'lista', origen: '=Catálogo!$A$2:$A$21' }, { rango: 'E2:E30', tipo: 'entero', min: '1', max: '200', tituloError: experto ? 'Cantidad no válida' : '', mensajeError: experto ? 'Escribe un número entero de 1 a 200.' : '' }, { rango: 'F2:F30', tipo: 'lista', origen: 'Pendiente,Entregado,Cancelado' });
    if (experto) h.validaciones.push({ rango: 'G2:G30', tipo: 'longitud', min: '0', max: '60' });
    [NUEVO.folio, fecha(NUEVO.fecha), NUEVO.cliente, NUEVO.producto, NUEVO.cantidad, NUEVO.estado].forEach((v, i) => hj.establecer('Pedidos!' + 'ABCDEF'[i] + '12', String(v), { sinDeshacer: true }));
  };

  LT.definirModulo({
    id: 15,
    objetivo: 'Controlar lo que se puede capturar con validación de datos: listas desplegables (escritas o desde un rango), números enteros y decimales, fechas, longitud de texto y fórmulas personalizadas, con mensajes de entrada y de error.',
    situacion: 'Cada semana corrijo pedidos con clientes mal escritos, productos que no existen y cantidades de 2,000 en lugar de 20. Quiero que <b>el registro de pedidos no acepte errores</b>: que se elija de listas y que avise cuando algo no tiene sentido.',
    explicacion: [
      { html: '<h3>Prevenir es mejor que limpiar</h3><p>La <b>validación de datos</b> (Datos › Validación de datos) define qué se permite en un rango. No cambia los datos que ya están: actúa en el momento de la captura.</p><table class="tabla-sitio"><tr><th>Permitir</th><th>Úsalo para</th><th>Ejemplo en La Taza</th></tr><tr><td>Lista</td><td>Elegir de opciones fijas</td><td>Estado: Pendiente, Entregado, Cancelado · Cliente: =Clientes!$A$2:$A$11</td></tr><tr><td>Número entero</td><td>Cantidades sin decimales</td><td>Cantidad entre 1 y 200</td></tr><tr><td>Decimal</td><td>Importes, porcentajes</td><td>Descuento entre 0 y 0.3</td></tr><tr><td>Fecha</td><td>Fechas dentro de un periodo</td><td>Entrega en noviembre de 2025</td></tr><tr><td>Longitud del texto</td><td>Códigos y teléfonos de tamaño fijo</td><td>Teléfono de 10 caracteres</td></tr><tr><td>Personalizada</td><td>Una regla con fórmula</td><td><code>=F2&gt;=B2</code> (la entrega no puede ser antes del pedido)</td></tr></table>' },
      { html: '<h3>Origen de una lista: escrito o desde un rango</h3><ul><li><b>Escrito:</b> <code>Pendiente,Entregado,Cancelado</code> (separado por comas). Rápido, pero hay que editar la regla si cambian las opciones.</li><li><b>Desde un rango:</b> <code>=Clientes!$A$2:$A$11</code>. Si llega un cliente nuevo, se agrega en la hoja Clientes. Si el rango es una <b>tabla</b> o un <b>nombre</b> (<code>=ListaClientes</code>), la lista crece sola.</li></ul><h3>Mensajes</h3><p>La pestaña <b>Mensaje de entrada</b> muestra una ayuda al seleccionar la celda («Elige un cliente de la lista»). La pestaña <b>Mensaje de error</b> define qué pasa si alguien escribe algo no permitido: <b>Detener</b> lo impide, <b>Advertencia</b> pregunta si continuar e <b>Información</b> solo avisa.</p>' },
      { titulo: 'Pruébalo: una lista y un límite', instr: 'Selecciona B2:B8 y aplica Validación › Lista con el origen <code>Centro,Norte,Sur</code>; luego selecciona C2:C8 y permite solo números enteros de 1 a 200. Prueba a escribir «Nort» o 500.', hoja: { altura: 230, hojas: [{ nombre: 'Práctica', datos: [['Pedido', 'Sucursal', 'Cantidad'], [3001], [3002], [3003], [3004], [3005], [3006], [3007]], estilos: { 'A1:C1': ENC }, anchos: { B: 110, C: 90 }, filas: 10, cols: 5 }], herramientas: ['datos'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Una lista desplegable desde otra hoja',
      pasos: [
        'Selecciona el rango donde se va a capturar: <b>Pedidos!C2:C30</b> (incluye filas vacías para los pedidos que vienen).',
        { texto: 'Abre Datos › Validación de datos.', ruta: ['Datos', 'Validación de datos'] },
        'En «Permitir» elige <b>Lista</b> y deja marcada «Celda con lista desplegable».',
        'En «Origen» escribe <code>=Clientes!$A$2:$A$11</code> (o selecciónalo con el ratón en la hoja Clientes).',
        'En la pestaña «Mensaje de error», estilo <b>Detener</b>, título «Cliente no registrado» y un mensaje que diga qué hacer.',
        'Acepta y prueba: al seleccionar C2 aparece la flechita con los 10 clientes.',
      ],
      pregunta: { texto: 'Con esa regla (estilo Detener), alguien escribe a mano «Notaria 14» (sin tilde). ¿Qué pasa?', opciones: ['Excel lo rechaza y muestra el mensaje de error', 'Excel lo acepta y lo corrige a «Notaría 14»', 'Excel lo acepta, pero lo pinta de rojo', 'Excel agrega «Notaria 14» a la lista'], correcta: 0, explicacion: 'El texto no coincide exactamente con ningún elemento de la lista y el estilo Detener impide capturarlo.' },
    },
    micro: [
      {
        titulo: 'Lista con opciones fijas', tipo: 'hoja',
        enunciado: 'En la columna Estado (D2:D11) permite solo <b>Pendiente</b>, <b>Entregado</b> o <b>Cancelado</b> con una lista desplegable.',
        hoja: { hojas: [{ nombre: 'Pedidos', datos: [['Folio', 'Cliente', 'Producto', 'Estado'], ...ped.map((p) => [p.folio, p.cliente, p.producto, p.estado])], estilos: { 'A1:D1': ENC }, anchos: { B: 180, C: 150, D: 100 }, filas: 13 }], herramientas: ['datos'] },
        aplicarSolucion: (hj) => hj.libro.hojas[0].validaciones.push({ rango: 'D2:D11', tipo: 'lista', origen: 'Pendiente,Entregado,Cancelado' }),
        pruebas: [{ tipo: 'fn', fn: (x) => { const v = val(x, 'Pedidos', 'D2'); if (!v || v.tipo !== 'lista') return 'Selecciona D2:D11 › Validación › Permitir: Lista.'; if (x.hoja.valoresLista(v, 0).length !== 3 || !listaCon(x, v, ESTADOS)) return 'El origen debe ser exactamente: Pendiente,Entregado,Cancelado.'; return hasta(v, 11) ? true : 'La regla debe cubrir D2:D11.'; } }],
        pista: ['Origen: <code>Pendiente,Entregado,Cancelado</code> (separado por comas, sin comillas).'],
      },
      {
        titulo: 'Cantidad entera con límites', tipo: 'hoja',
        enunciado: 'En Cantidad (C2:C11) permite solo <b>números enteros entre 1 y 200</b>.',
        hoja: { hojas: [{ nombre: 'Pedidos', datos: [['Folio', 'Producto', 'Cantidad'], ...ped.map((p) => [p.folio, p.producto, p.cantidad])], estilos: { 'A1:C1': ENC }, anchos: { B: 150 }, filas: 13 }], herramientas: ['datos'] },
        aplicarSolucion: (hj) => hj.libro.hojas[0].validaciones.push({ rango: 'C2:C11', tipo: 'entero', min: '1', max: '200' }),
        pruebas: [{ tipo: 'fn', fn: (x) => { const v = val(x, 'Pedidos', 'C2'); if (!v || v.tipo !== 'entero') return 'Permitir: Número entero.'; if (+v.min !== 1 || +v.max !== 200) return 'Mínimo 1 y máximo 200.'; return hasta(v, 11) ? true : 'La regla debe cubrir C2:C11.'; } }],
        pista: ['Validación › Permitir: Número entero · Datos: entre · Mínimo 1 · Máximo 200.'],
      },
      {
        titulo: 'Lista desde un rango', tipo: 'hoja',
        enunciado: 'En la hoja Pedidos, haz que Producto (B2:B11) se elija de la lista de la hoja <b>Catálogo</b> (A2:A21).',
        hoja: { hojas: [{ nombre: 'Pedidos', datos: [['Folio', 'Producto', 'Cantidad'], ...ped.map((p) => [p.folio, p.producto, p.cantidad])], estilos: { 'A1:C1': ENC }, anchos: { B: 160 }, filas: 13 }, { nombre: 'Catálogo', datos: [['Producto', 'Precio'], ...PROD.map((p) => [p.nombre, p.precio])], estilos: { 'A1:B1': ENC }, anchos: { A: 180 } }], pestanas: true, herramientas: ['datos'] },
        aplicarSolucion: (hj) => hj.libro.hojas[0].validaciones.push({ rango: 'B2:B11', tipo: 'lista', origen: '=Catálogo!$A$2:$A$21' }),
        pruebas: [{ tipo: 'fn', fn: (x) => { const v = val(x, 'Pedidos', 'B2'); if (!v || v.tipo !== 'lista') return 'Selecciona Pedidos!B2:B11 › Validación › Lista.'; if (!listaCon(x, v, PROD.map((p) => p.nombre))) return 'El origen debe ser el rango de productos: =Catálogo!$A$2:$A$21.'; return true; } }],
        pista: ['Origen: <code>=Catálogo!$A$2:$A$21</code>.'],
      },
      { titulo: 'Detener, advertencia o información', tipo: 'opcion', enunciado: 'El descuento normal va de 0 % a 15 %, pero la gerente puede autorizar más. Quieres que Excel <b>avise</b> si alguien escribe 20 %, sin impedirlo. ¿Qué estilo de mensaje de error eliges?', opciones: ['Advertencia', 'Detener', 'Ningún mensaje', 'Información con Detener'], correcta: 0, explicacion: 'Advertencia muestra el aviso y pregunta «¿Desea continuar?»: permite casos autorizados. Detener los impediría; Información solo informa.', retro: { 1: 'Detener no deja capturar el 20 %, ni siquiera con autorización.' } },
    ],
    reto: {
      titulo: 'Captura sin errores en el registro de pedidos', tipo: 'hoja',
      intro: 'La hoja <i>Pedidos</i> tiene 10 pedidos y espacio hasta la fila 30. Las hojas <i>Clientes</i> (A2:A11) y <i>Catálogo</i> (A2:A21) tienen las listas oficiales.',
      base: {
        hoja: libro(false), aplicarSolucion: aplicar(false),
        pruebas: pruebasBase,
        instrucciones: ['<b>C2:C30</b>: lista desplegable con los clientes de la hoja Clientes.', '<b>D2:D30</b>: lista con los productos del Catálogo.', '<b>E2:E30</b>: solo números enteros de 1 a 200.', '<b>F2:F30</b>: lista con Pendiente, Entregado y Cancelado.', 'Captura en la fila 12 el pedido <b>3011 · 12/11/2025 · Gimnasio Fénix · Cold brew · 30 · Pendiente</b> usando las listas.'],
        pistas: ['Selecciona cada rango completo (hasta la fila 30) antes de abrir Validación.', 'Las listas de otras hojas se escriben como <code>=Clientes!$A$2:$A$11</code>.', 'Cantidad: Número entero, entre 1 y 200. Estado: Lista con <code>Pendiente,Entregado,Cancelado</code>.'],
      },
      niveles: {
        explorador: {
          instrucciones: ['Selecciona <b>C2:C30</b> › Validación › Lista › Origen <code>=Clientes!$A$2:$A$11</code> › Aceptar.', 'Selecciona <b>D2:D30</b> › Lista › Origen <code>=Catálogo!$A$2:$A$21</code>.', 'Selecciona <b>E2:E30</b> › Número entero › Mínimo 1 · Máximo 200.', 'Selecciona <b>F2:F30</b> › Lista › Origen <code>Pendiente,Entregado,Cancelado</code>.', 'En la fila 12 escribe 3011 y 12/11/2025, y elige de las listas Gimnasio Fénix, Cold brew, 30 y Pendiente.'],
        },
        experto: {
          hoja: libro(true), aplicarSolucion: aplicar(true),
          pruebas: pruebasBase.concat([
            { tipo: 'fn', titulo: 'Mensaje de error en Cantidad', fn: (x) => { const v = val(x, 'Pedidos', 'E2'); return v && String(v.mensajeError || '').trim().length >= 10 && String(v.tituloError || '').trim() ? true : 'Agrega a la validación de Cantidad un título y un mensaje de error que digan qué escribir (por ejemplo, «Escribe un número entero de 1 a 200»).'; } },
            { tipo: 'fn', titulo: 'Observaciones de máximo 60 caracteres', fn: (x) => { const v = val(x, 'Pedidos', 'G2'); return v && v.tipo === 'longitud' && +v.max === 60 && hasta(v, 30) ? true : 'En Observaciones (G2:G30) limita la longitud del texto a 60 caracteres como máximo.'; } },
          ]),
          instrucciones: ['Aplica las cuatro validaciones del nivel Analista (C, D, E y F hasta la fila 30) y captura el pedido 3011 en la fila 12.', 'A la regla de Cantidad agrégale un <b>título y mensaje de error</b> que expliquen qué escribir.', 'En <b>G2:G30</b> (Observaciones) permite como máximo <b>60 caracteres</b>.'],
        },
      },
    },
    lab: {
      archivo: 'lab15-captura-pedidos.xlsx', titulo: 'Registro de pedidos a prueba de errores', hoja: 'Pedidos',
      contexto: 'El registro real tendrá cientos de pedidos: las validaciones cubren hasta la fila 500. En Excel también hay validación personalizada con fórmula.',
      pasos: {
        explorador: [
          { texto: 'Selecciona Pedidos!C2:C500 › Validación de datos › Lista › Origen <code>=Clientes!$A$2:$A$11</code>.', ruta: ['Datos', 'Validación de datos'] },
          'D2:D500: Lista con origen <code>=Catálogo!$A$2:$A$21</code>.',
          'E2:E500: Número entero entre 1 y 200; en «Mensaje de error» escribe un título y un mensaje.',
          'G2:G500 (Estado): Lista con <code>Pendiente,Entregado,Cancelado</code>.',
          'Guarda el libro y súbelo aquí.',
        ],
        analista: ['C2:C500 y D2:D500: listas desde las hojas Clientes y Catálogo.', 'E2:E500: enteros de 1 a 200 con mensaje de error.', 'G2:G500: lista de estados (Pendiente, Entregado, Cancelado).', 'Guarda y sube el libro.'],
        experto: ['Todo lo del nivel Analista.', 'F2:F500 (Entrega): validación <b>personalizada</b> que impida una entrega anterior a la fecha del pedido: <code>=F2&gt;=B2</code>.', 'H2:H500 (Teléfono de contacto): longitud de texto exactamente 10.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { t: 'validacion', h: 'Pedidos', r: 'C2:C500', tipo: 'list', origen: 'Clientes!', origenTexto: 'Clientes!$A$2:$A$11', titulo: 'Clientes desde la hoja Clientes' },
        { t: 'validacion', h: 'Pedidos', r: 'D2:D500', tipo: 'list', origen: 'Cat.logo|Catalogo', origenTexto: 'Catálogo!$A$2:$A$21', titulo: 'Productos desde el Catálogo' },
        { t: 'validacion', h: 'Pedidos', r: 'E2:E500', tipo: 'whole', min: 1, max: 200, mensajeError: true, titulo: 'Cantidad entera de 1 a 200 con mensaje de error' },
        { t: 'validacion', h: 'Pedidos', r: 'G2:G500', tipo: 'list', contiene: ['Pendiente', 'Entregado', 'Cancelado'], titulo: 'Estados con lista fija' },
        { t: 'validacion', h: 'Pedidos', r: 'F2:F500', tipo: 'custom', formula: 'F2\\s*>=\\s*\\$?B\\$?2|\\$?B\\$?2\\s*<=\\s*F2', nivel: 'experto', titulo: 'Entrega no anterior al pedido (personalizada)' },
        { t: 'validacion', h: 'Pedidos', r: 'H2:H500', tipo: 'textLength', min: 10, nivel: 'experto', titulo: 'Teléfono de 10 caracteres' },
      ],
    },
    donde: [
      { comando: 'Validación de datos', ruta: ['Datos', 'Validación de datos'] },
      { comando: 'Rodear con un círculo datos no válidos', ruta: ['Datos', 'Validación de datos', 'Rodear con un círculo datos no válidos'], nota: 'Marca los datos capturados antes de crear la regla que no la cumplen.' },
      { comando: 'Copiar solo la validación', ruta: ['Inicio', 'Pegar', 'Pegado especial'], nota: 'Opción «Validación».' },
      { comando: 'Ir a celdas con validación', ruta: ['Inicio', 'Buscar y seleccionar', 'Validación de datos'] },
    ],
    glosario: ['CONTAR.SI', 'LARGO', 'ESNUMERO'],
    atajos: ['<kbd>Alt</kbd>+<kbd>↓</kbd> abre la lista desplegable de la celda activa.', '<kbd>Alt</kbd>, <kbd>D</kbd>, <kbd>V</kbd>, <kbd>V</kbd> abre Validación de datos con el teclado (Excel para Windows).'],
  });

  /* información a detalle, autoevaluación y conexiones */
  LT.ampliarModulo(15, {
    objetivos: [
      'Elegir el tipo de validación adecuado para cada campo de una base de datos.',
      'Crear listas desplegables escritas y desde un rango, una tabla o un nombre.',
      'Limitar números, fechas y longitud de texto, y escribir reglas personalizadas con fórmula.',
      'Configurar mensajes de entrada y de error (Detener, Advertencia, Información).',
      'Detectar datos que ya estaban mal capturados con «Rodear con un círculo datos no válidos».',
    ],
    detalle: [
      { titulo: 'Reglas personalizadas con fórmula', abierto: true, html: '<p>«Personalizada» acepta cualquier fórmula que dé VERDADERO para los datos válidos. Se escribe para la <b>primera celda</b> del rango, con referencias relativas, como en el formato condicional.</p><table><tr><th>Regla</th><th>Fórmula (para la fila 2)</th></tr><tr><td>La entrega no puede ser antes del pedido</td><td><code>=F2&gt;=B2</code></td></tr><tr><td>Folio sin repetir</td><td><code>=CONTAR.SI($A$2:$A$500,A2)=1</code></td></tr><tr><td>Código que empiece con «PED-»</td><td><code>=IZQUIERDA(A2,4)="PED-"</code></td></tr><tr><td>Solo números (por ejemplo, teléfono como número)</td><td><code>=ESNUMERO(H2)</code></td></tr><tr><td>Descuento solo si el cliente es corporativo</td><td><code>=O(I2=0, J2="Corporativo")</code></td></tr></table>' },
      { titulo: 'Listas dependientes', html: '<p>Una lista que cambia según otra (primero la categoría, luego solo sus productos) se arma con <b>nombres</b> y la función <code>INDIRECTO</code>: cada lista de productos se nombra igual que su categoría (<code>Postres</code>, <code>Té</code>…) y la validación del producto usa el origen <code>=INDIRECTO(B2)</code>. En Microsoft 365 también puede hacerse con FILTRAR en una columna auxiliar. (El simulador no calcula INDIRECTO; practícalo en Excel.)</p>' },
      { titulo: 'Lo que la validación no hace', html: '<ul><li>No revisa los datos que ya estaban: usa <b>Rodear con un círculo datos no válidos</b>.</li><li>Se puede saltar <b>pegando</b>: el pegado reemplaza la regla de la celda. Protege la hoja (módulo 16) o educa al equipo a usar Pegado especial › Valores.</li><li>No sustituye a una buena estructura: un campo por columna, un registro por fila (módulo 25).</li></ul>' },
    ],
    errores: [
      'Validar solo las filas que ya tienen datos y olvidar las de la captura futura.',
      'Escribir el origen de la lista con comillas (<code>"Pendiente","Entregado"</code>): se separa solo con comas.',
      'Listas desde un rango sin fijar con $ o que no incluyen las filas nuevas.',
      'Mensajes de error que solo dicen «Error» sin explicar qué capturar.',
      'Creer que la validación limpia los datos existentes.',
    ],
    consejos: [
      'Pon las listas oficiales (clientes, productos, estados) en hojas propias y, mejor aún, en tablas.',
      'Marca con color las celdas de captura y escribe un mensaje de entrada breve.',
      'Combina validación con protección de hoja para que nadie borre las reglas.',
      'Revisa con «Ir a especial › Validación de datos» qué celdas tienen reglas.',
    ],
    autoeval: [
      { p: '¿Qué diferencia hay entre una lista con origen escrito y una desde un rango?', r: 'La escrita (Pendiente,Entregado) se edita en la regla; la de rango (=Clientes!$A$2:$A$11) se actualiza al cambiar la hoja de origen, y si es tabla o nombre crece sola.' },
      { p: '¿Qué estilo de mensaje impide capturar un valor no permitido?', r: 'Detener. Advertencia permite continuar y Información solo avisa.' },
      { p: 'Escribe la regla personalizada que evita folios repetidos en A2:A500.', r: '<code>=CONTAR.SI($A$2:$A$500,A2)=1</code>.' },
      { p: 'Validaste la columna de cantidades después de capturar 300 pedidos. ¿Cómo encuentras los que ya estaban mal?', r: 'Datos › Validación de datos › Rodear con un círculo datos no válidos.' },
      { p: '¿Cómo se salta alguien la validación sin querer?', r: 'Pegando datos sobre las celdas: el pegado reemplaza la regla. Protegiendo la hoja o pegando solo valores se reduce el riesgo.' },
      { p: '¿Qué validación usas para un teléfono de 10 dígitos guardado como texto?', r: 'Longitud del texto igual a 10.' },
      { p: '¿Cómo copias solo la regla de validación de una celda a otra?', r: 'Copia la celda y usa Pegado especial › Validación.' },
    ],
    conexiones: [
      { id: 12, texto: 'después de limpiar una base, la validación evita que se vuelva a ensuciar.' },
      { id: 13, texto: 'las listas basadas en tablas crecen al agregar clientes o productos.' },
      { id: 16, texto: 'la protección de hoja mantiene las reglas y deja libres solo las celdas de captura.' },
      { id: 25, texto: 'la base de pedidos completa combina validación, formulario de captura y consultas.' },
    ],
  });
})();
