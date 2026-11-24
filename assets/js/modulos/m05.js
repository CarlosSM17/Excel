/* Módulo 5 · Insertar objetos */
(function () {
  const { D, ENC } = LT.caso;
  const URL_MENU = 'https://lataza.mx/menu';
  const menu = D.productos.filter((p) => /^(CAF|FRI|TE)/.test(p.codigo)).map((p) => [p.nombre, p.categoria, p.precio]);
  const hojaMenu = () => ({ hojas: [{ nombre: 'Menú', datos: [[], [], [], [], [], [], ['Bebida', 'Categoría', 'Precio'], ...menu], formatos: { 'C8:C20': '$#,##0' }, estilos: { 'A7:C7': ENC }, anchos: { A: 170, B: 130, C: 80, D: 90, E: 90, F: 90 }, filas: 22, cols: 8 }], herramientas: ['insertar', 'portapapeles'], altura: 420 });
  const objetos = (x) => (x.estado.hojas[0].objetos || []);
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Logo de La Taza insertado', fn: (x) => (objetos(x).some((o) => o.tipo === 'imagen' && o.galeria === 'logo') ? true : 'Falta el logo: Insertar › Imágenes › Logo de La Taza.') },
    { tipo: 'fn', titulo: 'Forma con el texto «Menú de temporada»', fn: (x) => {
      const f = objetos(x).filter((o) => o.tipo === 'forma');
      if (!f.length) return 'Falta una forma: Insertar › Formas.';
      return f.some((o) => /men[uú] de temporada/i.test(o.texto || '')) ? true : 'La forma debe decir «Menú de temporada» (doble clic en la forma para escribir).';
    } },
    { tipo: 'fn', titulo: 'Icono de taza de café', fn: (x) => (objetos(x).some((o) => o.tipo === 'icono' && o.galeria === 'taza') ? true : 'Falta el icono de la taza de café: Insertar › Iconos.') },
    { tipo: 'fn', titulo: 'Vínculo al menú en línea en A5', fn: (x) => {
      const e = x.estilo('A5');
      if (!e.link) return 'A5 todavía no tiene vínculo: selecciona A5 › Insertar › Vínculo.';
      if (e.link.replace(/\/$/, '') !== URL_MENU) return 'El vínculo de A5 debe ir a ' + URL_MENU + '.';
      return /ver men[uú] en l[ií]nea/i.test(String(x.valor('A5') || '')) ? true : 'El texto de A5 debe ser «Ver menú en línea».';
    } },
  ];

  LT.definirModulo({
    id: 5,
    objetivo: 'Agregar imágenes, formas, iconos, cuadros de texto e hipervínculos.',
    situacion: 'Vamos a mandar el menú por correo a las empresas clientes. Necesito un <b>encabezado con nuestro logo</b>, un letrero llamativo y un <b>enlace al menú en línea</b>.',
    explicacion: [
      { html: '<h3>Objetos que flotan sobre la hoja</h3><p>Las imágenes, formas, iconos y cuadros de texto no viven dentro de una celda: <b>flotan</b> encima de la cuadrícula y se pueden mover y cambiar de tamaño con el ratón. Están en la pestaña <b>Insertar</b>.</p><ul><li><b>Imágenes:</b> fotos o el logo, desde tu equipo.</li><li><b>Iconos:</b> dibujos sencillos que se pueden agrandar sin perder calidad.</li><li><b>Formas:</b> rectángulos, flechas o cintas; pueden llevar texto.</li><li><b>Cuadro de texto:</b> texto libre que puedes colocar donde quieras.</li><li><b>Vínculo</b> (hipervínculo): se pone en una celda y abre una página web o lleva a otra hoja. Para seguirlo dentro de Excel: <kbd>Ctrl</kbd>+clic.</li></ul><p><b>Texto alternativo:</b> describe la imagen para quien usa lector de pantalla. Clic derecho sobre el objeto › Editar texto alternativo.</p>' },
      { titulo: 'Zona de práctica', instr: 'Inserta objetos y muévelos. Clic derecho sobre un objeto para ver sus opciones; Supr lo elimina.', hoja: { altura: 260, hojas: [{ nombre: 'Práctica', datos: [], filas: 10, cols: 8 }], herramientas: ['insertar'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Insertar el logo con texto alternativo',
      pasos: [{ texto: 'Haz clic cerca de donde quieres el logo.' }, { texto: 'Insertar › Imágenes › Este dispositivo… y elige el archivo del logo.', ruta: ['Insertar', 'Imágenes'] }, 'Arrastra la imagen a su lugar y ajústala desde una esquina (así conserva la proporción).', 'Clic derecho › Editar texto alternativo: «Logo de Cafetería La Taza».'],
      pregunta: { texto: '¿Para qué sirve el <b>texto alternativo</b> de una imagen?', opciones: ['Describe la imagen para personas que usan lector de pantalla', 'Aparece como título al imprimir', 'Cambia el nombre del archivo de la imagen', 'Reduce el tamaño del archivo'], correcta: 0, explicacion: 'El texto alternativo hace accesible el documento: los lectores de pantalla lo leen en voz alta.' },
    },
    micro: [
      { titulo: '¿Qué objeto usarías?', tipo: 'opcion', enunciado: 'Quieres un letrero con <b>fondo de color y esquinas redondeadas</b> que diga «¡Nuevo!» encima de la tabla.', opciones: ['Una forma (rectángulo redondeado) con texto', 'Una imagen', 'Un comentario', 'Una celda con relleno'], correcta: 0, explicacion: 'Las formas pueden llevar texto, color de relleno y se colocan donde quieras.' },
      {
        titulo: 'Un vínculo en una celda', tipo: 'hoja', enunciado: 'En B3 crea un vínculo con el texto «Pedidos en línea» que vaya a <code>https://lataza.mx/pedidos</code>.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Cafetería La Taza'], [], ['Haz tu pedido:']], anchos: { A: 130, B: 160 }, filas: 8, cols: 5, objetivo: 'B3' }], herramientas: ['insertar'] },
        pruebas: [{ tipo: 'fn', fn: (x) => { const e = x.estilo('B3'); if (!e.link) return 'B3 no tiene vínculo: selecciona B3 y usa el botón Vínculo.'; if (e.link.replace(/\/$/, '') !== 'https://lataza.mx/pedidos') return 'La dirección debe ser https://lataza.mx/pedidos'; return /pedidos en l[ií]nea/i.test(String(x.valor('B3'))) ? true : 'El texto debe ser «Pedidos en línea».'; } }],
        pista: ['Selecciona B3 › botón «Vínculo» de la barra; escribe el texto que se mostrará y la dirección.'],
      },
    ],
    reto: {
      titulo: 'Encabezado del menú con logo y enlace', tipo: 'hoja',
      intro: 'La hoja <i>Menú</i> tiene libres las filas 1 a 6 para el encabezado.',
      base: {
        hoja: hojaMenu(), pruebas: pruebasBase,
        instrucciones: ['Inserta el <b>logo</b> de La Taza en la parte superior.', 'Inserta una <b>forma</b> con el texto «Menú de temporada».', 'Inserta un <b>icono</b> de taza de café.', 'En <b>A5</b> crea un vínculo con el texto «Ver menú en línea» a <code>' + URL_MENU + '</code>.', 'Acomoda los objetos para que no tapen la tabla.'],
        pistas: ['Todo está en la sección «Insertar» de la barra del simulador.', 'Para escribir en una forma, haz doble clic sobre ella. El vínculo se crea con la celda A5 seleccionada.', 'Imágenes › Logo de La Taza; Formas › Cinta (doble clic para escribir); Iconos › Taza de café; A5 › Vínculo.'],
      },
      niveles: {
        explorador: { instrucciones: ['Botón <b>Imágenes</b> › «Logo de La Taza». Arrástralo a la esquina superior izquierda.', 'Botón <b>Formas</b> › «Cinta». Haz doble clic sobre ella y escribe «Menú de temporada».', 'Botón <b>Iconos</b> › «Taza de café».', 'Haz clic en <b>A5</b> › botón <b>Vínculo</b>: texto «Ver menú en línea», dirección <code>' + URL_MENU + '</code>.'] },
        experto: {
          instrucciones: ['Arma el encabezado: logo, forma «Menú de temporada», icono de taza de café y vínculo «Ver menú en línea» en A5 a ' + URL_MENU + '.', 'Agrega <b>texto alternativo</b> al logo y al icono.', 'Agrega un <b>cuadro de texto</b> con el horario «Abierto de 7:00 a 21:00».'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Texto alternativo en logo e icono', fn: (x) => { const o = objetos(x).filter((y) => y.tipo === 'imagen' || y.tipo === 'icono'); const sin = o.find((y) => !y.alt || y.alt.length < 4); return sin ? 'Agrega texto alternativo a «' + (sin.nombre || sin.tipo) + '» (clic derecho › Editar texto alternativo).' : true; } },
            { tipo: 'fn', titulo: 'Cuadro de texto con el horario', fn: (x) => (objetos(x).some((o) => o.tipo === 'texto' && /7:00/.test(o.texto || '') && /21:00/.test(o.texto || '')) ? true : 'Falta un cuadro de texto con «Abierto de 7:00 a 21:00».') },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab05-menu.xlsx', titulo: 'Encabezado del menú en Excel',
      contexto: 'Descarga también el logo en PNG para insertarlo.',
      descargas: [{ ruta: 'assets/img/logo-la-taza.png', texto: 'Logo (PNG)' }],
      pasos: {
        explorador: [{ texto: 'Inserta el logo (archivo logo-la-taza.png).', ruta: ['Insertar', 'Imágenes'] }, { texto: 'Inserta una forma y escribe «Menú de temporada».', ruta: ['Insertar', 'Formas'] }, { texto: 'Inserta un icono de café.', ruta: ['Insertar', 'Iconos'] }, { texto: 'En A5 inserta un vínculo «Ver menú en línea» a ' + URL_MENU + '.', ruta: ['Insertar', 'Vínculo'] }, 'Guarda y sube el libro.'],
        analista: ['Arma el encabezado con logo, forma «Menú de temporada», icono y el vínculo «Ver menú en línea» (A5 → ' + URL_MENU + ').', 'Guarda y sube el libro.'],
        experto: ['Encabezado del nivel Analista.', 'Texto alternativo en el logo y en el icono.', 'Cuadro de texto con el horario «Abierto de 7:00 a 21:00».', 'Guarda y sube el libro.'],
      },
      notaWeb: 'En Excel para la web: Insertar › Imagen › Este dispositivo, e Insertar › Formas e Iconos.',
      pruebas: [
        { titulo: 'Logo insertado (imagen)', fn: (L, A) => { const h = A.hoja('Menú'); return h.dibujo.imagenes.length ? true : 'No encontré ninguna imagen: inserta el logo.'; } },
        { titulo: 'Forma con «Menú de temporada»', fn: (L) => { const d = L.hoja('Menú').dibujo; const f = d.formas.concat(d.cuadrosTexto); return f.some((o) => /men[uú] de temporada/i.test(o.texto)) ? true : 'Falta una forma con el texto «Menú de temporada».'; } },
        { titulo: 'Icono insertado', fn: (L) => { const d = L.hoja('Menú').dibujo; return d.iconos.length || d.imagenes.length >= 2 ? true : 'Falta el icono: Insertar › Iconos.'; } },
        { titulo: 'Vínculo al menú en línea', fn: (L) => { const v = L.hoja('Menú').hipervinculos.find((x) => /lataza\.mx\/menu/i.test(x.destino || '')); return v ? true : 'No encontré un vínculo a ' + URL_MENU + '.'; } },
        { titulo: 'Texto alternativo', nivel: 'experto', fn: (L) => { const d = L.hoja('Menú').dibujo; const o = d.imagenes.concat(d.iconos); const sin = o.find((x) => !x.alt || x.alt.length < 4); return o.length && !sin ? true : 'Agrega texto alternativo a todas las imágenes e iconos.'; } },
        { titulo: 'Cuadro de texto con el horario', nivel: 'experto', fn: (L) => { const d = L.hoja('Menú').dibujo; return d.cuadrosTexto.concat(d.formas).some((o) => /7:00/.test(o.texto) && /21:00/.test(o.texto)) ? true : 'Falta el cuadro de texto con el horario.'; } },
      ],
    },
    donde: [
      { comando: 'Imágenes', ruta: ['Insertar', 'Imágenes'] },
      { comando: 'Iconos', ruta: ['Insertar', 'Iconos'], nota: 'En Mac y en la web también está en Insertar.' },
      { comando: 'Cuadro de texto', ruta: ['Insertar', 'Cuadro de texto'] },
      { comando: 'Vínculo', ruta: ['Insertar', 'Vínculo'], nota: 'Atajo: Ctrl+Alt+K.' },
    ],
    atajos: ['<kbd>Ctrl</kbd>+clic sobre una celda con vínculo para abrirlo.', 'Arrastra una esquina del objeto con <kbd>Mayús</kbd> para conservar la proporción.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  LT.ampliarModulo(5, {
    objetivos: [
      'Insertar imágenes, iconos, formas y cuadros de texto, y moverlos, alinearlos y cambiarles el tamaño.',
      'Agregar hipervínculos a sitios web, a correos y a otras hojas del libro.',
      'Escribir texto alternativo para que los objetos sean accesibles.',
      'Decidir si un objeto debe moverse con las celdas o quedarse fijo.',
    ],
    detalle: [
      { titulo: 'Celdas y objetos: dos capas', abierto: true, html: '<p>Los datos viven en las <b>celdas</b>; las imágenes, formas, iconos, cuadros de texto y gráficos <b>flotan</b> en una capa encima. Por eso un logo no «ocupa» A1: tapa lo que hay debajo. En Formato › Propiedades (clic derecho › Tamaño y propiedades) decides si el objeto se <b>mueve y cambia de tamaño con las celdas</b>, si solo se mueve o si queda fijo; para un logo de encabezado conviene «no mover ni cambiar tamaño con celdas».</p><table><tr><th>Objeto</th><th>Úsalo para</th><th>Ruta</th></tr><tr><td>Imagen</td><td>Logo, foto de producto</td><td>Insertar › Imágenes</td></tr><tr><td>Icono</td><td>Señales simples escalables (SVG)</td><td>Insertar › Iconos</td></tr><tr><td>Forma</td><td>Flechas, botones, llamadas de atención</td><td>Insertar › Formas</td></tr><tr><td>Cuadro de texto</td><td>Notas largas que no deben alterar la cuadrícula</td><td>Insertar › Cuadro de texto</td></tr><tr><td>Hipervínculo</td><td>Ir a una web, a un correo o a otra hoja</td><td>Insertar › Vínculo (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>K</kbd>)</td></tr></table>' },
      { titulo: 'Hipervínculos dentro del libro', html: '<p>Un índice en la primera hoja con vínculos a cada hoja ayuda mucho en libros grandes: Insertar › Vínculo › <b>Lugar de este documento</b> › elige la hoja y la celda. También existe la función <code>=HIPERVINCULO("#Norte!A1","Ir a Norte")</code>, útil cuando el destino se arma con una fórmula.</p>' },
      { titulo: 'Accesibilidad: texto alternativo', html: '<p>Clic derecho en la imagen › <b>Ver texto alternativo</b>: describe en una frase qué muestra («Logotipo de Cafetería La Taza»). Los lectores de pantalla lo leen y Revisar › Comprobar accesibilidad avisa de las imágenes que no lo tienen. Si la imagen es solo decorativa, márcala como tal.</p>' },
    ],
    errores: [
      'Insertar el logo encima de datos y tapar celdas que se necesitan.',
      'Deformar la imagen al estirarla de un lado: usa las esquinas (o <kbd>Mayús</kbd>) para mantener la proporción.',
      'Escribir datos dentro de cuadros de texto: no se pueden calcular ni filtrar.',
      'Vínculos web sin probar o con la dirección escrita a medias.',
    ],
    consejos: [
      'Reserva filas para el encabezado (logo y título) antes de los datos.',
      'Usa Formato de forma › Alinear para alinear y distribuir varios objetos.',
      'Agrupa (<kbd>Ctrl</kbd>+clic y Agrupar) logo y título para moverlos juntos.',
      'Prefiere iconos (SVG) a imágenes pixeladas: se ven nítidos a cualquier tamaño.',
    ],
    microExtra: [
      { titulo: 'Texto alternativo', tipo: 'opcion', enunciado: 'Insertaste el logo de La Taza en el menú. ¿Qué haces para que una persona con lector de pantalla sepa qué es?', opciones: ['Escribir el texto alternativo de la imagen («Logotipo de Cafetería La Taza»)', 'Poner la imagen en negrita', 'Agregar un comentario en A1', 'Agrupar la imagen con el título'], correcta: 0, explicacion: 'Clic derecho › Ver texto alternativo. Revisar › Comprobar accesibilidad detecta las imágenes que no lo tienen.', retro: { 2: 'Un comentario no está asociado a la imagen y el lector no lo relaciona.', 3: 'Agrupar sirve para moverlos juntos, no para describirlos.' } },
    ],
    autoeval: [
      { p: '¿Por qué una imagen no «ocupa» una celda?', r: 'Porque flota en una capa sobre la cuadrícula; tapa las celdas, pero no las usa ni cambia sus valores.' },
      { p: '¿Cómo cambias el tamaño de un logo sin deformarlo?', r: 'Arrastrando una de las esquinas (no los lados), o fijando la relación de aspecto en Tamaño y propiedades.' },
      { p: '¿Qué tipo de vínculo usas para ir de la hoja Índice a la celda A1 de la hoja Norte?', r: 'Insertar › Vínculo › Lugar de este documento › Norte, celda A1.' },
      { p: '¿Cuándo conviene un icono y cuándo una imagen?', r: 'El icono (SVG) es una figura simple que se escala sin perder nitidez y puede cambiar de color; la imagen sirve para fotos y logotipos con detalle.' },
      { p: 'Al insertar filas, tu logo se estira. ¿Qué propiedad cambias?', r: 'En Tamaño y propiedades › Propiedades: «No mover ni cambiar tamaño con celdas» (o «Mover, pero no cambiar tamaño»).' },
      { p: '¿Para qué sirve agrupar objetos?', r: 'Para moverlos, alinearlos y cambiar su tamaño como si fueran uno solo.' },
    ],
    conexiones: [
      { id: 4, texto: 'el encabezado del reporte combina formato de celdas con objetos.' },
      { id: 6, texto: 'los hipervínculos internos sirven como índice de un libro con varias hojas.' },
      { id: 24, texto: 'una forma puede convertirse en botón que ejecuta una macro.' },
    ],
  });
})();
