/* Módulo 7 · Gráficos */
(function () {
  const { D, totalesPor, mensualPorCategoria, mensualPorSucursal } = LT.caso;
  const MESES = D.mesesCortos;
  const porProducto = totalesPor('producto');
  const productos = D.productos.map((p) => p.nombre);
  const porCat = mensualPorCategoria();
  const porSuc = mensualPorSucursal();
  const lider = Object.entries(porProducto).sort((a, b) => b[1] - a[1])[0][0];
  const top5 = Object.entries(porProducto).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  const mesFrio = MESES[porCat['Café frío'].indexOf(Math.max(...porCat['Café frío']))];
  const CONJ = [
    { id: 'sucursales', nombre: 'Ventas mensuales por sucursal', categorias: MESES, series: Object.entries(porSuc).map(([n, v]) => ({ nombre: n, valores: v })), formato: '$#,##0' },
    { id: 'productos', nombre: 'Ventas anuales por producto (2025)', categorias: productos, series: [{ nombre: 'Ventas 2025', valores: productos.map((p) => porProducto[p] || 0) }], formato: '$#,##0' },
    { id: 'meses', nombre: 'Ventas mensuales por categoría', categorias: MESES, series: D.categorias.map((c) => ({ nombre: c, valores: porCat[c] })), formato: '$#,##0' },
  ];

  function galeria(c) {
    const fila = LT.u.h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' } });
    const casos = [
      ['Comparar categorías → columnas o barras', { tipo: 'columnas', categorias: ['Centro', 'Norte', 'Sur'], series: [{ nombre: 'Ventas', valores: Object.values(totalesPor('sucursal')) }], titulo: 'Ventas por sucursal', formato: '$#,##0' }],
      ['Cambio en el tiempo → líneas', { tipo: 'lineas', categorias: MESES, series: [{ nombre: 'Café frío', valores: porCat['Café frío'] }], titulo: 'Café frío por mes', formato: '$#,##0' }],
      ['Partes de un todo (pocas) → circular', { tipo: 'circular', categorias: ['Centro', 'Norte', 'Sur'], series: [{ nombre: 'Ventas', valores: Object.values(totalesPor('sucursal')) }], titulo: 'Participación por sucursal', formato: '$#,##0' }],
    ];
    for (const [t, o] of casos) {
      const g = LT.u.h('div', { class: 'graf-cont' });
      const lienzo = LT.u.h('div');
      g.append(LT.u.h('div', { style: { fontWeight: 600, fontSize: '.88rem', marginBottom: '4px' } }, t), lienzo);
      fila.appendChild(g);
      setTimeout(() => LT.graficos.dibujar(lienzo, Object.assign({ ancho: 420, alto: 260 }, o)), 0);
    }
    c.appendChild(fila);
  }

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const estado = { g1: null, g2: null, r1: '', r2: '' };
    const experto = nivel === 'experto', explorador = nivel === 'explorador';
    const pestanas = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const p1 = h('div'), p2 = h('div');
    const mostrar = (i) => { p1.style.display = i === 1 ? '' : 'none'; p2.style.display = i === 2 ? '' : 'none'; pestanas.querySelectorAll('button').forEach((b, k) => b.classList.toggle('primario', k + 1 === i)); };
    pestanas.append(h('button', { class: 'btn chico primario', onclick: () => mostrar(1) }, 'Gráfico 1: ¿qué producto vende más?'), h('button', { class: 'btn chico', onclick: () => mostrar(2) }, 'Gráfico 2: café caliente vs. frío por mes'));
    const preg1 = h('select', { class: 'herr-sel', onchange: (e) => { estado.r1 = e.target.value; } }, h('option', { value: '' }, 'Elige…'), top5.slice().sort().map((p) => h('option', { value: p }, p)));
    const preg2 = h('select', { class: 'herr-sel', onchange: (e) => { estado.r2 = e.target.value; } }, h('option', { value: '' }, 'Elige…'), MESES.map((m) => h('option', { value: m }, m)));
    const g1 = h('div'), g2 = h('div');
    p1.append(h('p', { class: 'instr' }, explorador ? 'Los datos ya están elegidos. Escoge el tipo de gráfico para comparar productos y escribe un título.' : 'Elige los datos, el tipo de gráfico y escribe un título.'), g1, h('div', { class: 'aviso-caja info' }, 'Según tu gráfico, ¿qué producto vendió más en 2025? ', preg1));
    p2.append(h('p', { class: 'instr' }, explorador ? 'Elige el conjunto «Ventas mensuales por categoría», deja solo Café caliente y Café frío, y escoge el tipo de gráfico para ver el cambio en el tiempo.' : 'Muestra solo el café caliente y el café frío a lo largo del año.'), g2, h('div', { class: 'aviso-caja info' }, 'Según tu gráfico, ¿en qué mes se vendió más café frío? ', preg2));
    cont.append(pestanas, p1, p2);
    setTimeout(() => {
      LT.graficos.Constructor(g1, { conjuntos: CONJ, estadoInicial: explorador ? { conjunto: 'productos' } : {}, alCambiar: (e) => { estado.g1 = e; } });
      LT.graficos.Constructor(g2, { conjuntos: CONJ, estadoInicial: explorador ? { conjunto: 'meses' } : {}, alCambiar: (e) => { estado.g2 = e; } });
      mostrar(1);
    }, 0);
    return {
      verificar: () => {
        const r = [];
        const a = estado.g1 || {}, b = estado.g2 || {};
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        add(a.conjunto === 'productos', 'Gráfico 1 usa las ventas por producto', 'Gráfico 1: elige los datos «Ventas anuales por producto».');
        add(experto ? a.tipo === 'barras' : ['columnas', 'barras'].includes(a.tipo), 'Gráfico 1: tipo adecuado para comparar', experto ? 'Gráfico 1: con 20 nombres largos, las barras horizontales se leen mejor.' : 'Gráfico 1: para comparar productos usa columnas o barras.');
        add(!!(a.titulo || '').trim(), 'Gráfico 1 tiene título', 'Gráfico 1: escribe un título que diga qué muestra.');
        if (experto) add(!!(a.ejeX || '').trim() && !!(a.ejeY || '').trim() && a.etiquetas, 'Gráfico 1 con títulos de ejes y etiquetas de datos', 'Gráfico 1: agrega títulos a los dos ejes y etiquetas de datos.');
        add(estado.r1 === lider, 'Respuesta 1 correcta', estado.r1 ? 'Revisa tu gráfico: el producto que más vendió no es ' + estado.r1 + '. Activa las etiquetas de datos o pasa el cursor sobre las barras.' : 'Responde qué producto vendió más.');
        add(b.conjunto === 'meses', 'Gráfico 2 usa las ventas mensuales por categoría', 'Gráfico 2: elige «Ventas mensuales por categoría».');
        const s = (b.series || []).slice().sort().join('|');
        add(s === 'Café caliente|Café frío', 'Gráfico 2 compara solo café caliente y frío', 'Gráfico 2: deja marcadas solo las series Café caliente y Café frío.');
        add(b.tipo === 'lineas', 'Gráfico 2: líneas para ver el cambio en el tiempo', 'Gráfico 2: para mostrar cómo cambian por mes, usa líneas.');
        add(!!(b.titulo || '').trim(), 'Gráfico 2 tiene título', 'Gráfico 2: escribe un título.');
        if (experto) add(!!(b.ejeY || '').trim(), 'Gráfico 2 con título del eje vertical', 'Gráfico 2: agrega el título del eje vertical (por ejemplo «Ventas ($)»).');
        add(estado.r2 === mesFrio, 'Respuesta 2 correcta', estado.r2 ? 'Revisa la línea del café frío: su punto más alto no está en ' + estado.r2 + '.' : 'Responde en qué mes se vendió más café frío.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 7,
    objetivo: 'Elegir el tipo de gráfico adecuado, crearlo y personalizarlo; agregar minigráficos.',
    situacion: 'En la junta del lunes quiero responder con imágenes dos preguntas: <b>¿qué producto nos deja más dinero en el año?</b> y <b>¿cómo cambian las ventas de café caliente y café frío mes a mes?</b>',
    explicacion: [
      { html: '<h3>Primero la pregunta, después el gráfico</h3><ul><li><b>Comparar</b> categorías (productos, sucursales): <b>columnas</b>; si los nombres son largos o son muchos, <b>barras</b> horizontales.</li><li><b>Cambio en el tiempo</b> (meses, días): <b>líneas</b>.</li><li><b>Partes de un todo</b> con pocas partes (2 a 5): <b>circular</b>. Con muchas partes, mejor barras.</li></ul><p>Un buen gráfico tiene <b>título</b> que dice qué muestra, ejes claros y, cuando hay varias series, una <b>leyenda</b>. Las <b>etiquetas de datos</b> ayudan cuando el número exacto importa.</p><p>Los <b>minigráficos</b> (Insertar › Minigráficos) son gráficos pequeñitos dentro de una celda: muestran la tendencia de cada fila de un vistazo.</p>' },
      { titulo: 'Cada pregunta, su gráfico', instr: 'Pasa el cursor sobre las marcas para ver los valores.', widget: galeria },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Crear un gráfico de columnas',
      pasos: ['Selecciona los datos con sus encabezados (por ejemplo, Producto y Ventas).', { texto: 'Insertar › Gráficos › Columnas (o «Gráficos recomendados»).', ruta: ['Insertar', 'Insertar gráfico de columnas o de barras'] }, { texto: 'Con el gráfico seleccionado, en Diseño de gráfico › Agregar elemento de gráfico agrega título, títulos de ejes o etiquetas.', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico'] }, 'Haz clic en el título para cambiar su texto.'],
      pregunta: { texto: 'Quieres mostrar cómo cambiaron las ventas <b>mes a mes</b> durante 2025. ¿Qué gráfico eliges?', opciones: ['Circular', 'Líneas', 'Barras apiladas', 'Dispersión'], correcta: 1, explicacion: 'Para ver cambios en el tiempo, las <b>líneas</b> muestran la tendencia de un vistazo.' },
    },
    micro: [
      { titulo: 'Partes de un todo', tipo: 'opcion', enunciado: 'Quieres mostrar qué parte de las ventas totales aporta cada una de las <b>3 sucursales</b>.', opciones: ['Circular', 'Líneas', 'Dispersión', 'Área'], correcta: 0, explicacion: 'Con pocas partes de un total, el gráfico <b>circular</b> funciona bien.' },
      { titulo: 'Nombres largos', tipo: 'opcion', enunciado: 'Vas a comparar las ventas de los 20 productos; algunos nombres son largos, como «Bagel con queso crema». ¿Qué tipo se lee mejor?', opciones: ['Columnas', 'Barras horizontales', 'Circular', 'Líneas'], correcta: 1, explicacion: 'Las <b>barras horizontales</b> dejan espacio para leer los nombres largos sin girarlos.' },
      {
        titulo: 'Minigráficos de tendencia', tipo: 'widget', enunciado: 'Elige el tipo de minigráfico que muestra mejor la <b>tendencia</b> mensual de cada sucursal.',
        crear: (c, listo) => {
          const { h } = LT.u;
          const tabla = h('table', { class: 'tabla-sitio', style: { maxWidth: '620px' } });
          const retro = h('div');
          const dibujar = (tipo) => {
            tabla.innerHTML = '';
            tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Sucursal'), h('th', null, 'Ene'), h('th', null, '…'), h('th', null, 'Dic'), h('th', null, 'Minigráfico'))));
            const tb = h('tbody');
            for (const [suc, v] of Object.entries(porSuc)) {
              const td = h('td');
              if (tipo) td.appendChild(LT.graficos.minigrafico(v, tipo, { ancho: 120, alto: 26 }));
              tb.appendChild(h('tr', null, h('td', null, suc), h('td', null, LT.formato.formatear(v[0], '$#,##0').texto), h('td', null, '…'), h('td', null, LT.formato.formatear(v[11], '$#,##0').texto), td));
            }
            tabla.appendChild(tb);
          };
          const botones = h('div', { class: 'grupo-btn', style: { margin: '8px 0' } });
          [['linea', 'Línea'], ['columna', 'Columna'], ['ganancia', 'Ganancia o pérdida']].forEach(([t, n]) => botones.appendChild(h('button', { class: 'btn chico', onclick: () => {
            dibujar(t);
            retro.innerHTML = '';
            if (t === 'linea') { retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ La línea muestra la tendencia: sube en verano para Norte y baja en otoño. El punto naranja marca el mes más alto.')); listo(); }
            else retro.appendChild(h('div', { class: 'aviso-caja alerta' }, t === 'ganancia' ? 'Ganancia o pérdida solo distingue positivos y negativos: aquí todos son positivos.' : 'Las columnas sirven para comparar meses, pero la tendencia se ve mejor con una línea continua.'));
          } }, n)));
          c.append(botones, tabla, retro);
          dibujar(null);
        },
      },
    ],
    reto: { titulo: '¿Qué producto vende más y cómo cambia por mes?', tipo: 'widget', crear: crearReto, base: { instrucciones: ['<b>Gráfico 1:</b> compara las ventas anuales de los 20 productos con el tipo de gráfico adecuado y un título. Responde qué producto vendió más.', '<b>Gráfico 2:</b> muestra cómo cambian por mes las ventas de <b>Café caliente</b> y <b>Café frío</b> (solo esas dos series), con un título. Responde en qué mes se vendió más café frío.'], pistas: ['Primero piensa qué pregunta responde cada gráfico: comparar o ver un cambio en el tiempo.', 'Comparar → columnas o barras; tiempo → líneas. Desmarca las series que no necesitas.', 'Gráfico 1: «Ventas anuales por producto» + Barras. Gráfico 2: «Ventas mensuales por categoría», solo Café caliente y Café frío, + Líneas.'] },
      niveles: { explorador: { instrucciones: ['Gráfico 1: los datos ya están elegidos; elige <b>Columnas</b> o <b>Barras</b> y escribe un título.', 'Gráfico 2: deja solo Café caliente y Café frío, elige <b>Líneas</b> y escribe un título.', 'Responde las dos preguntas usando tus gráficos (pasa el cursor para ver los valores).'] }, experto: { instrucciones: ['Gráfico 1: barras horizontales con título, títulos de ambos ejes y etiquetas de datos.', 'Gráfico 2: líneas de Café caliente y Café frío con título y título del eje vertical.', 'Responde las dos preguntas.'] } } },
    lab: {
      archivo: 'lab07-graficos.xlsx', titulo: 'Gráficos para la junta',
      contexto: 'El libro tiene tres hojas: Productos (ventas anuales), Meses (ventas mensuales por categoría) y Sucursales (ventas mensuales).',
      pasos: {
        explorador: [{ texto: 'En Productos, selecciona A1:B21 e inserta un gráfico de columnas o barras con título.', ruta: ['Insertar', 'Insertar gráfico de columnas o de barras'] }, { texto: 'En Meses, selecciona Mes, Café caliente y Café frío (A1:C13) e inserta un gráfico de líneas con título.', ruta: ['Insertar', 'Insertar gráfico de líneas o de áreas'] }, { texto: 'En Sucursales, selecciona N2:N4 e inserta minigráficos de línea con datos B2:M4.', ruta: ['Insertar', 'Línea'] }, 'Guarda y sube el libro.'],
        analista: ['Gráfico de columnas o barras de las ventas por producto, con título.', 'Gráfico de líneas de Café caliente y Café frío por mes, con título.', 'Minigráficos de línea en Sucursales!N2:N4.', 'Guarda y sube el libro.'],
        experto: ['Los dos gráficos y los minigráficos del nivel Analista.', 'Agrega títulos de ejes a ambos gráficos.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Gráfico de columnas o barras con título', fn: (L) => { const g = L.graficos.find((x) => x.tipos.some((t) => t === 'columnas' || t === 'barras')); if (!g) return 'No encontré un gráfico de columnas o barras.'; return g.tieneTitulo ? true : 'El gráfico de columnas o barras no tiene título.'; } },
        { titulo: 'Gráfico de líneas con dos series y título', fn: (L) => { const g = L.graficos.find((x) => x.tipos.includes('lineas')); if (!g) return 'No encontré un gráfico de líneas.'; if (g.series < 2) return 'El gráfico de líneas debe mostrar Café caliente y Café frío (2 series).'; return g.tieneTitulo ? true : 'El gráfico de líneas no tiene título.'; } },
        { titulo: 'Minigráficos en Sucursales', fn: (L) => { const h = L.hoja('Sucursales'); const n = h ? h.minigraficos.reduce((s, g) => s + g.cantidad, 0) : 0; return n >= 3 ? true : 'Inserta minigráficos para las tres sucursales (N2:N4).'; } },
        { titulo: 'Títulos de ejes', nivel: 'experto', fn: (L) => { const sin = L.graficos.filter((g) => !g.tipos.includes('circular')).find((g) => g.ejes.filter((e) => e.conTitulo).length < 2); return sin ? 'Agrega títulos a los dos ejes del gráfico de ' + sin.tipos[0] + '.' : true; } },
      ],
    },
    donde: [
      { comando: 'Gráficos recomendados', ruta: ['Insertar', 'Gráficos recomendados'] },
      { comando: 'Minigráficos de línea', ruta: ['Insertar', 'Línea'], nota: 'Grupo Minigráficos.' },
      { comando: 'Agregar elemento de gráfico (títulos de ejes)', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico', 'Títulos de ejes'], nota: 'La pestaña Diseño de gráfico aparece al seleccionar un gráfico.' },
      { comando: 'Cambiar tipo de gráfico', ruta: ['Diseño de gráfico', 'Cambiar tipo de gráfico'] },
    ],
    atajos: ['<kbd>Alt+F1</kbd> inserta un gráfico con los datos seleccionados (en Excel).', 'Selecciona columnas no contiguas manteniendo <kbd>Ctrl</kbd>.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const guia = `<figure class="figura-explica"><svg viewBox="0 0 620 210" role="img" aria-label="Qué gráfico elegir según la pregunta">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="10" width="140" height="90" rx="8" fill="#e7effc" stroke="#2259b8"/><text x="80" y="30" text-anchor="middle" font-weight="700">Comparar</text>
  <rect x="30" y="70" width="16" height="22" fill="#2259b8"/><rect x="52" y="50" width="16" height="42" fill="#2259b8"/><rect x="74" y="60" width="16" height="32" fill="#2259b8"/><rect x="96" y="40" width="16" height="52" fill="#2259b8"/><text x="80" y="114" text-anchor="middle">columnas / barras</text>
  <rect x="165" y="10" width="140" height="90" rx="8" fill="#e2f1e8" stroke="#1e7145"/><text x="235" y="30" text-anchor="middle" font-weight="700">Tendencia</text>
  <polyline points="180,85 205,70 230,75 255,52 280,45" fill="none" stroke="#1e7145" stroke-width="3"/><text x="235" y="114" text-anchor="middle">líneas</text>
  <rect x="320" y="10" width="140" height="90" rx="8" fill="#fff4dc" stroke="#a86a12"/><text x="390" y="30" text-anchor="middle" font-weight="700">Partes de un total</text>
  <circle cx="390" cy="66" r="26" fill="#a86a12"/><path d="M390 66 L390 40 A26 26 0 0 1 414 76 Z" fill="#f5c542"/><text x="390" y="114" text-anchor="middle">circular (≤ 5 partes)</text>
  <rect x="475" y="10" width="140" height="90" rx="8" fill="#f1e6f7" stroke="#7b3f9e"/><text x="545" y="30" text-anchor="middle" font-weight="700">Relación</text>
  <g fill="#7b3f9e"><circle cx="495" cy="80" r="4"/><circle cx="515" cy="70" r="4"/><circle cx="530" cy="62" r="4"/><circle cx="548" cy="60" r="4"/><circle cx="565" cy="48" r="4"/><circle cx="590" cy="42" r="4"/></g><text x="545" y="114" text-anchor="middle">dispersión</text>
  <text x="10" y="150">Combinado: columnas (ventas) + línea en eje secundario (% de crecimiento) cuando las magnitudes son distintas.</text>
  <text x="10" y="174">Minigráficos: una tendencia diminuta dentro de una celda, junto a cada fila de datos.</text>
  <text x="10" y="198">Primero escribe la pregunta que debe responder el gráfico; el tipo se deduce de ella.</text></g></svg></figure>`;
  LT.ampliarModulo(7, {
    objetivos: [
      'Elegir el tipo de gráfico según la pregunta: comparar, mostrar tendencia, partes de un total o relación.',
      'Crear un gráfico desde un rango y cambiar su tipo, su origen de datos y el orden de filas y columnas.',
      'Personalizar título, ejes, etiquetas de datos, leyenda y colores con los botones de elementos y estilos.',
      'Construir un gráfico combinado con eje secundario.',
      'Insertar minigráficos de línea, columna y ganancia/pérdida.',
      'Revisar que un gráfico no engañe (ejes que no empiezan en cero, demasiadas categorías, 3D).',
    ],
    detalle: [
      { titulo: '¿Qué gráfico responde mi pregunta?', abierto: true, html: guia },
      { titulo: 'Anatomía de un gráfico y cómo editarlo', html: '<table><tr><th>Elemento</th><th>Para qué</th><th>Dónde se cambia</th></tr><tr><td>Título</td><td>Dice la conclusión o la pregunta («Latte y Capuchino lideran las ventas»)</td><td>Botón + (Elementos de gráfico)</td></tr><tr><td>Ejes y títulos de eje</td><td>Unidades (pesos, piezas, meses)</td><td>Elementos › Títulos de ejes; doble clic en el eje para límites y unidades</td></tr><tr><td>Etiquetas de datos</td><td>Valor exacto sobre cada barra</td><td>Elementos › Etiquetas de datos</td></tr><tr><td>Leyenda</td><td>Identifica las series (innecesaria con una sola serie)</td><td>Elementos › Leyenda</td></tr><tr><td>Origen de datos</td><td>Qué celdas se grafican</td><td>Diseño de gráfico › Seleccionar datos</td></tr><tr><td>Filas/columnas</td><td>Intercambia categorías y series</td><td>Diseño de gráfico › Cambiar entre filas y columnas</td></tr></table>' },
      { titulo: 'Gráfico combinado y eje secundario', html: '<p>Si quieres ver las ventas mensuales (miles de pesos) y el porcentaje de crecimiento (−5 % a 12 %) en el mismo gráfico, la línea del porcentaje quedaría aplastada en cero. Solución: Diseño de gráfico › <b>Cambiar tipo de gráfico › Combinado</b>: ventas como columnas agrupadas y crecimiento como línea con la casilla <b>Eje secundario</b>. Rotula ambos ejes para que nadie confunda las escalas.</p>' },
      { titulo: 'Gráficos honestos', html: '<ul><li>En columnas y barras, el eje vertical debe empezar en <b>0</b>: si empieza en 80,000 una diferencia de 3 % parece del triple.</li><li>Evita 3D, sombras y degradados: distorsionan el tamaño.</li><li>Ordena las barras de mayor a menor cuando las categorías no tienen orden natural.</li><li>El circular solo funciona con pocas partes que suman 100 %.</li><li>Usa el mismo color para lo mismo en todos los gráficos del reporte.</li></ul>' },
    ],
    errores: [
      'Seleccionar también la fila de totales: la barra del total aplasta a las demás.',
      'Usar líneas para categorías sin orden (productos): la línea sugiere una tendencia que no existe.',
      'Dejar el título automático («Total») en lugar de uno que diga qué muestra.',
      'Graficar 20 categorías en un circular.',
    ],
    consejos: [
      'Selecciona una celda de los datos y pulsa <kbd>Alt</kbd>+<kbd>F1</kbd> para un gráfico rápido; <kbd>F11</kbd> lo crea en una hoja propia.',
      'Guarda un gráfico bien diseñado como plantilla (clic derecho › Guardar como plantilla).',
      'Si los datos crecen cada mes, conviértelos en tabla (módulo 13): el gráfico se amplía solo.',
      'Copia el gráfico a PowerPoint o Word con «Pegar vinculado» para que se actualice.',
    ],
    microExtra: [
      { titulo: 'Dos escalas distintas', tipo: 'opcion', enunciado: 'Graficas las ventas mensuales (alrededor de $85,000) y el porcentaje de crecimiento (entre −5 % y 12 %). La línea del porcentaje sale pegada al cero. ¿Qué haces?', opciones: ['Un gráfico combinado con el porcentaje en el eje secundario', 'Cambiar todo a gráfico circular', 'Multiplicar el porcentaje por 1,000', 'Quitar la leyenda'], correcta: 0, explicacion: 'Cambiar tipo de gráfico › Combinado: columnas para las ventas y línea con «Eje secundario» para el porcentaje.', retro: { 2: 'Alterar los datos para que «quepan» engaña al lector.' } },
    ],
    autoeval: [
      { p: '¿Qué gráfico usas para mostrar cómo cambiaron las ventas de enero a diciembre?', r: 'Un gráfico de líneas (o de columnas si son pocos periodos): el eje horizontal es el tiempo.' },
      { p: '¿Por qué un circular no sirve para comparar 20 productos?', r: 'Las porciones pequeñas no se distinguen y el ojo compara mal ángulos; con muchas categorías se usan barras ordenadas.' },
      { p: 'Tu gráfico muestra los meses como series y los productos como categorías, al revés de lo que querías. ¿Qué haces?', r: 'Diseño de gráfico › Cambiar entre filas y columnas.' },
      { p: '¿Qué es un minigráfico y dónde vive?', r: 'Un gráfico diminuto (línea, columna o ganancia/pérdida) dentro de una celda; resume la tendencia de una fila. Se inserta en Insertar › Minigráficos.' },
      { p: 'Agregaste datos de un mes nuevo debajo del rango y el gráfico no lo muestra. ¿Cómo lo corriges?', r: 'Diseño de gráfico › Seleccionar datos y amplía el rango, o arrastra el contorno azul del rango. Para que pase solo, convierte los datos en tabla.' },
      { p: '¿Cuándo usas un eje secundario?', r: 'Cuando combinas dos series con magnitudes o unidades muy distintas (pesos y porcentaje) en un gráfico combinado.' },
      { p: 'Escribe un buen título para un gráfico de barras de ventas por producto.', r: 'Uno que diga la conclusión o la pregunta, por ejemplo: «Latte y Capuchino concentran 30 % de las ventas de 2025».' },
    ],
    conexiones: [
      { id: 4, texto: 'los colores y fuentes del tema se aplican también a los gráficos.' },
      { id: 13, texto: 'un gráfico basado en una tabla crece solo al agregar filas.' },
      { id: 18, texto: 'los gráficos dinámicos y los tableros con segmentación llevan esto un paso más allá.' },
      { proyecto: 'basico', texto: 'el reporte mensual incluye un gráfico que responde una pregunta concreta.' },
    ],
  });
})();
