/* Módulo 13 · Tablas */
(function () {
  const { D, fecha } = LT.caso;
  const COLS = ['Folio', 'Fecha', 'Cliente', 'Sucursal', 'Producto', 'Cantidad', 'Precio', 'Compromiso', 'Estado'];
  const filas = D.pedidos.map((p) => [p.folio, fecha(p.fecha), p.cliente, p.sucursal, p.producto, p.cantidad, p.precio, fecha(p.compromiso), p.estado]);
  const ESTILOS = { 'Azul, Estilo de tabla medio 2': ['#4472c4', '#d9e1f2'], 'Verde, Estilo de tabla medio 7': ['#70ad47', '#e2efda'], 'Café, Estilo de tabla medio 4': ['#8a5a3c', '#f3ebdf'], 'Gris, Estilo de tabla claro 1': ['#7f7f7f', '#f2f2f2'] };
  const FUNC = { '': 'Ninguno', suma: 'Suma', promedio: 'Promedio', cuenta: 'Recuento', max: 'Máx.', min: 'Mín.' };
  const sumaNorte = D.pedidos.filter((p) => p.sucursal === 'Norte').reduce((s, p) => s + p.cantidad * p.precio, 0);
  const sumaNortePend = D.pedidos.filter((p) => p.sucursal === 'Norte' && p.estado === 'Pendiente').reduce((s, p) => s + p.cantidad * p.precio, 0);

  function normalizarFormula(f) { return String(f || '').toUpperCase().replace(/\s+/g, '').replace(/PEDIDOS\[@/g, '[@').replace(/TABLA1\[@/g, '[@').replace(/\[@\[(\w+)\]\]/g, '[@$1]'); }
  function formulaValida(f) {
    const n = normalizarFormula(f);
    return ['=[@CANTIDAD]*[@PRECIO]', '=[@PRECIO]*[@CANTIDAD]'].includes(n) ? 'estructurada' : ['=F2*G2', '=G2*F2'].includes(n) ? 'a1' : null;
  }

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const F = LT.formato;
    const est = { tabla: false, nombre: 'Tabla1', formula: '', totales: false, fCant: '', fImp: 'suma', estilo: 'Azul, Estilo de tabla medio 2', segm: [], filtros: {}, respuesta: '' };
    const panel = h('div', { class: 'widget', style: { padding: '12px' } });
    const vista = h('div', { class: 'tabla-scroll', style: { maxHeight: '420px', overflow: 'auto', background: '#fff' } });
    const segmCont = h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '8px 0' } });
    cont.append(panel, segmCont, vista);
    const agregado = (vals, fn) => {
      const n = vals.filter((v) => typeof v === 'number');
      if (fn === 'suma') return n.reduce((a, b) => a + b, 0);
      if (fn === 'promedio') return n.reduce((a, b) => a + b, 0) / (n.length || 1);
      if (fn === 'cuenta') return vals.length;
      if (fn === 'max') return Math.max(...n);
      if (fn === 'min') return Math.min(...n);
      return null;
    };
    const dibujar = () => {
      // panel de diseño
      panel.innerHTML = '';
      if (!est.tabla) {
        panel.append(h('p', { style: { margin: '0 0 8px' } }, 'Selecciona una celda de la lista y conviértela en tabla.'), h('button', { class: 'btn primario chico', onclick: () => { est.tabla = true; dibujar(); } }, LT.icono('tablaDatos', 15), 'Inicio › Dar formato como tabla'));
      } else {
        const nombre = h('input', { type: 'text', value: est.nombre, style: { width: '140px', padding: '5px 7px', borderRadius: '6px', border: '1px solid var(--linea-2)' }, 'aria-label': 'Nombre de la tabla' });
        nombre.addEventListener('change', () => { est.nombre = nombre.value.trim(); dibujar(); });
        const formula = h('input', { type: 'text', value: est.formula, placeholder: '=[@Cantidad]*[@Precio]', style: { width: '210px', padding: '5px 7px', borderRadius: '6px', border: '1px solid var(--linea-2)', fontFamily: 'var(--mono)' }, 'aria-label': 'Fórmula de Importe' });
        formula.addEventListener('change', () => { est.formula = formula.value.trim(); dibujar(); });
        const tot = h('input', { type: 'checkbox', checked: est.totales ? true : null });
        tot.addEventListener('change', () => { est.totales = tot.checked; dibujar(); });
        const sel = (k) => { const s = h('select', { class: 'herr-sel' }, Object.entries(FUNC).map(([v, n]) => h('option', { value: v, selected: est[k] === v ? true : null }, n))); s.addEventListener('change', () => { est[k] = s.value; dibujar(); }); return s; };
        const estilo = h('select', { class: 'herr-sel' }, Object.keys(ESTILOS).map((n) => h('option', { value: n, selected: est.estilo === n ? true : null }, n)));
        estilo.addEventListener('change', () => { est.estilo = estilo.value; dibujar(); });
        const segBtns = h('span', null, ['Sucursal', 'Estado', 'Cliente'].map((c) => h('label', { style: { marginRight: '8px', fontSize: '.88rem' } }, h('input', { type: 'checkbox', checked: est.segm.includes(c) ? true : null, onchange: (e) => { est.segm = e.target.checked ? est.segm.concat(c) : est.segm.filter((x) => x !== c); if (!e.target.checked) delete est.filtros[c]; dibujar(); } }), ' ' + c)));
        panel.append(
          h('div', { style: { fontWeight: 700, color: '#217346', marginBottom: '6px' } }, 'Diseño de tabla'),
          h('div', { class: 'grupo-btn', style: { gap: '14px' } },
            h('label', { style: { fontSize: '.88rem' } }, 'Nombre de la tabla: ', nombre),
            h('label', { style: { fontSize: '.88rem' } }, 'Estilo: ', estilo)),
          h('div', { class: 'grupo-btn', style: { marginTop: '8px', gap: '14px' } },
            h('label', { style: { fontSize: '.88rem' } }, 'Nueva columna «Importe», fórmula de la primera fila: ', formula)),
          h('div', { class: 'grupo-btn', style: { marginTop: '8px', gap: '14px' } },
            h('label', { style: { fontSize: '.88rem' } }, tot, ' Fila de totales'),
            est.totales ? h('label', { style: { fontSize: '.88rem' } }, 'Total de Cantidad: ', sel('fCant')) : null,
            est.totales ? h('label', { style: { fontSize: '.88rem' } }, 'Total de Importe: ', sel('fImp')) : null),
          h('div', { style: { marginTop: '8px', fontSize: '.88rem' } }, 'Insertar segmentación de datos: ', segBtns));
        const fv = formulaValida(est.formula);
        if (est.formula && !fv) panel.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Esa fórmula no calcula cantidad × precio. En una tabla puedes escribir =[@Cantidad]*[@Precio] (o hacer clic en las celdas).'));
        if (fv === 'a1') panel.appendChild(h('div', { class: 'aviso-caja info' }, 'Funciona, pero en una tabla Excel la escribe como =[@Cantidad]*[@Precio] cuando haces clic en las celdas: se lee mejor.'));
      }
      // segmentaciones
      segmCont.innerHTML = '';
      for (const campo of est.segm) {
        const i = COLS.indexOf(campo);
        const vals = Array.from(new Set(filas.map((f) => f[i]))).sort();
        const caja = h('div', { class: 'segmentacion' }, h('div', { class: 't' }, campo, h('button', { class: 'btn chico fantasma', style: { padding: '0 4px' }, title: 'Borrar filtro', onclick: () => { delete est.filtros[campo]; dibujar(); } }, '⨯')));
        for (const v of vals) {
          const on = !est.filtros[campo] || est.filtros[campo].includes(v);
          caja.appendChild(h('button', { class: 'item' + (on ? ' on' : ''), onclick: () => { est.filtros[campo] = est.filtros[campo] && est.filtros[campo].length === 1 && est.filtros[campo][0] === v ? null : [v]; if (!est.filtros[campo]) delete est.filtros[campo]; dibujar(); } }, v));
        }
        segmCont.appendChild(caja);
      }
      // tabla
      const visibles = filas.filter((f) => Object.entries(est.filtros).every(([c, vs]) => vs.includes(f[COLS.indexOf(c)])));
      const [c1, c2] = ESTILOS[est.estilo];
      const conImporte = !!formulaValida(est.formula);
      const t = h('table', { class: 'tabla-sitio', style: { fontFamily: 'var(--fuente-hoja)', fontSize: '.84rem' } });
      const enc = COLS.concat(est.tabla ? ['Importe'] : []);
      t.appendChild(h('thead', null, h('tr', null, enc.map((c) => h('th', { style: est.tabla ? { background: c1, color: '#fff', top: '0' } : { top: '0' } }, c + (est.tabla ? ' ▾' : ''))))));
      const tb = h('tbody');
      visibles.forEach((f, i) => {
        const tr = h('tr', { style: est.tabla && i % 2 ? { background: c2 } : null });
        f.forEach((v, j) => tr.appendChild(h('td', { style: { textAlign: typeof v === 'number' ? 'right' : 'left' } }, j === 6 ? F.formatear(v, '$#,##0').texto : v)));
        if (est.tabla) tr.appendChild(h('td', { style: { textAlign: 'right', background: conImporte ? '' : '#fff8d6' } }, conImporte ? F.formatear(f[5] * f[6], '$#,##0').texto : ''));
        tb.appendChild(tr);
      });
      if (est.tabla && est.totales) {
        const tr = h('tr', { style: { fontWeight: 700, borderTop: '2px solid ' + c1 } });
        enc.forEach((c, j) => {
          let txt = j === 0 ? 'Total' : '';
          if (c === 'Cantidad' && est.fCant) txt = F.formatear(agregado(visibles.map((f) => f[5]), est.fCant), '#,##0.##').texto;
          if (c === 'Importe' && est.fImp && conImporte) txt = F.formatear(agregado(visibles.map((f) => f[5] * f[6]), est.fImp), est.fImp === 'cuenta' ? '#,##0' : '$#,##0').texto;
          tr.appendChild(h('td', { style: { textAlign: j ? 'right' : 'left' } }, txt));
        });
        tb.appendChild(tr);
      }
      t.appendChild(tb);
      vista.innerHTML = '';
      vista.appendChild(t);
    };
    const resp = h('input', { type: 'text', placeholder: '$0', style: { width: '120px', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--linea-2)' }, 'aria-label': 'Respuesta' });
    resp.addEventListener('input', () => { est.respuesta = resp.value; });
    cont.appendChild(h('div', { class: 'aviso-caja info' }, nivel === 'experto' ? 'Con las segmentaciones, ¿cuánto suman los importes de los pedidos PENDIENTES de NORTE? ' : 'Con la segmentación, filtra la sucursal Norte: ¿cuánto suma el Importe? ', resp));
    dibujar();
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        add(est.tabla, 'El rango se convirtió en tabla', 'Primero convierte el rango en tabla (Dar formato como tabla).');
        add(/^pedidos$/i.test(est.nombre), 'La tabla se llama «Pedidos»', 'Cambia el nombre de la tabla a «Pedidos» (sin espacios).');
        add(formulaValida(est.formula) === 'estructurada' || (nivel !== 'experto' && formulaValida(est.formula) === 'a1'), 'Columna calculada Importe', nivel === 'experto' ? 'Escribe la columna Importe con referencias estructuradas: =[@Cantidad]*[@Precio].' : 'Agrega la columna Importe = Cantidad × Precio.');
        add(est.totales && est.fImp === 'suma', 'Fila de totales con la suma de Importe', 'Activa la fila de totales y elige «Suma» para Importe.');
        if (nivel === 'experto') add(est.totales && est.fCant === 'suma', 'Total de Cantidad', 'En la fila de totales, suma también la Cantidad.');
        add(est.segm.includes('Sucursal'), 'Segmentación por Sucursal', 'Inserta una segmentación de datos por Sucursal.');
        if (nivel === 'experto') add(est.segm.includes('Estado'), 'Segmentación por Estado', 'Inserta también una segmentación por Estado.');
        const n = parseFloat(String(est.respuesta).replace(/[$,\s]/g, ''));
        const esp = nivel === 'experto' ? sumaNortePend : sumaNorte;
        add(Math.abs(n - esp) < 1, 'Respuesta correcta', est.respuesta ? 'Revisa la suma: filtra con la segmentación y lee el total de Importe.' : 'Escribe la respuesta usando la fila de totales filtrada.');
        if (nivel !== 'experto' && est.estilo !== 'Azul, Estilo de tabla medio 2') r.push({ ok: true, titulo: 'Estilo de tabla personalizado', mensaje: 'Estilo de tabla personalizado' });
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 13,
    objetivo: 'Convertir rangos en tablas con fila de totales, columnas calculadas y segmentación de datos.',
    situacion: 'Llevo los pedidos de catering en una lista que crece todos los días; cada vez que agrego uno tengo que arrastrar fórmulas y corregir los totales. <b>¿No hay una forma de que se actualice sola?</b>',
    explicacion: [
      { html: '<h3>Una tabla de Excel es más que formato</h3><p>Con <b>Inicio › Dar formato como tabla</b> (o <b>Insertar › Tabla</b>) un rango se vuelve una <b>tabla</b> con nombre propio. Ventajas:</p><ul><li>Crece sola: al escribir en la fila de abajo, la fila nueva se agrega a la tabla con su formato.</li><li><b>Columnas calculadas:</b> escribes la fórmula una vez y se copia a toda la columna.</li><li><b>Referencias estructuradas:</b> <code>=[@Cantidad]*[@Precio]</code> se lee «la cantidad de esta fila por el precio de esta fila».</li><li><b>Fila de totales</b> con suma, promedio o recuento que respeta los filtros (usa <code>SUBTOTALES</code>).</li><li><b>Segmentación de datos:</b> botones para filtrar con un clic.</li></ul>' },
      { widget: 'rangoVsTabla', titulo: 'Rango normal vs. tabla', instr: 'Agrega un pedido debajo de cada lista y compara qué pasa con las fórmulas y el total.', opts: { filas: D.pedidos.slice(0, 5).map((p) => [p.folio, p.producto, p.cantidad, p.precio]), extras: D.pedidos.slice(5, 8).map((p) => [p.folio, p.producto, p.cantidad, p.precio]) } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Convertir la lista de pedidos en tabla',
      pasos: ['Haz clic en cualquier celda de la lista.', { texto: 'Inicio › Dar formato como tabla y elige un estilo. Confirma que «La tabla tiene encabezados» esté marcado.', ruta: ['Inicio', 'Dar formato como tabla'] }, { texto: 'En Diseño de tabla › Nombre de la tabla escribe Pedidos.', ruta: ['Diseño de tabla', 'Nombre de la tabla'] }, 'En la primera celda vacía a la derecha escribe el encabezado Importe y debajo =[@Cantidad]*[@Precio].', { texto: 'Diseño de tabla › Fila de totales.', ruta: ['Diseño de tabla', 'Fila de totales'] }],
      pregunta: { texto: 'En la columna Importe de una tabla escribes <code>=[@Cantidad]*[@Precio]</code> en la primera fila y pulsas Enter. ¿Qué pasa?', opciones: ['Excel copia la fórmula a toda la columna automáticamente', 'Solo se calcula esa fila', 'Aparece #¿NOMBRE?', 'La tabla se convierte en rango'], correcta: 0, explicacion: 'Es una <b>columna calculada</b>: la fórmula se aplica a toda la columna y a las filas que agregues después.' },
    },
    micro: [
      { titulo: 'Referencias estructuradas', tipo: 'opcion', enunciado: 'En una tabla, ¿qué significa <code>[@Precio]</code>?', opciones: ['El precio de la misma fila', 'La suma de toda la columna Precio', 'El primer precio de la tabla', 'Una celda llamada Precio'], correcta: 0, explicacion: 'La <b>@</b> significa «esta fila».' },
      { titulo: 'Totales con filtros', tipo: 'opcion', enunciado: 'La fila de totales usa <code>SUBTOTALES(109, …)</code> en lugar de SUMA. ¿Por qué?', opciones: ['Porque así el total ignora las filas ocultas por un filtro', 'Porque SUMA no funciona en tablas', 'Porque es más rápido', 'Porque redondea'], correcta: 0, explicacion: 'Con el código 109, SUBTOTALES suma solo lo visible: al filtrar con una segmentación, el total cambia.' },
    ],
    reto: { titulo: 'Tabla de pedidos con totales y filtros visuales', tipo: 'widget', crear: crearReto,
      base: { instrucciones: ['Convierte la lista en tabla y llámala <b>Pedidos</b>.', 'Agrega la columna calculada <b>Importe</b> = cantidad × precio.', 'Activa la <b>fila de totales</b> con la suma del Importe.', 'Inserta una <b>segmentación</b> por Sucursal y responde la pregunta.'], pistas: ['Todo lo de tablas está en la pestaña contextual Diseño de tabla.', 'La fórmula con referencias estructuradas es =[@Cantidad]*[@Precio].', 'Marca «Fila de totales», elige Suma en Importe, marca la segmentación Sucursal y haz clic en «Norte».'] },
      niveles: { explorador: { instrucciones: ['Pulsa «Dar formato como tabla».', 'En «Nombre de la tabla» escribe <b>Pedidos</b>.', 'En la fórmula de Importe escribe <code>=[@Cantidad]*[@Precio]</code> y pulsa Enter.', 'Marca «Fila de totales» (Importe: Suma).', 'Marca la segmentación «Sucursal», haz clic en «Norte» y escribe el total de Importe.'] }, experto: { instrucciones: ['Tabla «Pedidos» con columna calculada Importe usando referencias estructuradas.', 'Fila de totales con la suma de Cantidad y de Importe.', 'Segmentaciones por Sucursal y por Estado; responde la pregunta combinando ambas.'] } } },
    lab: {
      archivo: 'lab13-pedidos.xlsx', titulo: 'Tabla de pedidos en Excel',
      contexto: 'La hoja Pedidos tiene la lista de pedidos de catering (A1:I41).',
      pasos: {
        explorador: [{ texto: 'Convierte A1:I41 en tabla.', ruta: ['Inicio', 'Dar formato como tabla'] }, { texto: 'Nómbrala Pedidos.', ruta: ['Diseño de tabla', 'Nombre de la tabla'] }, 'En J1 escribe Importe y en J2 =[@Cantidad]*[@Precio].', { texto: 'Activa la fila de totales y elige Suma en Importe.', ruta: ['Diseño de tabla', 'Fila de totales'] }, { texto: 'Inserta una segmentación por Sucursal.', ruta: ['Diseño de tabla', 'Insertar segmentación de datos'] }, 'Guarda y sube el libro.'],
        analista: ['Tabla «Pedidos» con columna calculada Importe, fila de totales (suma de Importe) y segmentación por Sucursal.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista, con referencias estructuradas.', 'Total también en Cantidad.', 'Segunda segmentación por Estado.', 'Cambia el estilo de la tabla.', 'Guarda y sube el libro.'],
      },
      notaWeb: 'Excel para la web permite crear tablas, fila de totales y segmentaciones de tabla.',
      pruebas: [
        { titulo: 'Tabla llamada «Pedidos»', fn: (L) => { const t = L.tablas[0]; if (!t) return 'No encontré ninguna tabla: usa Dar formato como tabla.'; return L.tablas.some((x) => /^pedidos$/i.test(x.nombre)) ? true : 'La tabla se llama «' + t.nombre + '»: cámbiale el nombre a Pedidos.'; } },
        { titulo: 'Columna calculada Importe', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)) || L.tablas[0]; if (!t) return 'Falta la tabla.'; const c = t.columnas.find((x) => /importe/i.test(x.nombre)); if (!c) return 'Agrega la columna Importe a la tabla.'; const f = (c.formulaCalculada || '').toUpperCase(); return /CANTIDAD/.test(f) && /PRECIO/.test(f) && f.includes('*') ? true : 'La columna Importe debe calcularse con =[@Cantidad]*[@Precio] (columna calculada).'; } },
        { titulo: 'Fila de totales con suma de Importe', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)) || L.tablas[0]; if (!t || !t.filaTotales) return 'Activa la fila de totales.'; const c = t.columnas.find((x) => /importe/i.test(x.nombre)); return c && (c.funcionTotal === 'sum' || /SUBTOTAL\(109/i.test(c.formulaTotal || '')) ? true : 'En la fila de totales elige Suma para Importe.'; } },
        { titulo: 'Segmentación por Sucursal', fn: (L) => (L.segmentaciones.some((s) => /sucursal/i.test(s.campo || s.nombre)) ? true : 'Inserta una segmentación de datos por Sucursal.') },
        { titulo: 'Total de Cantidad', nivel: 'experto', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)) || L.tablas[0]; const c = t && t.columnas.find((x) => /cantidad/i.test(x.nombre)); return c && c.funcionTotal === 'sum' ? true : 'En la fila de totales suma también la Cantidad.'; } },
        { titulo: 'Segmentación por Estado', nivel: 'experto', fn: (L) => (L.segmentaciones.some((s) => /estado/i.test(s.campo || s.nombre)) ? true : 'Agrega una segmentación por Estado.') },
        { titulo: 'Estilo de tabla cambiado', nivel: 'experto', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)) || L.tablas[0]; return t && t.estilo && t.estilo !== 'TableStyleMedium2' ? true : 'Elige un estilo de tabla distinto al predeterminado.'; } },
      ],
    },
    donde: [
      { comando: 'Dar formato como tabla', ruta: ['Inicio', 'Dar formato como tabla'], nota: 'También: Insertar › Tabla.' },
      { comando: 'Fila de totales', ruta: ['Diseño de tabla', 'Fila de totales'], nota: 'La pestaña Diseño de tabla aparece al seleccionar una celda de la tabla.' },
      { comando: 'Insertar segmentación de datos', ruta: ['Diseño de tabla', 'Insertar segmentación de datos'] },
      { comando: 'Nombre de la tabla', ruta: ['Diseño de tabla', 'Nombre de la tabla'] },
    ],
    glosario: ['SUBTOTALES'],
    atajos: ['<kbd>Ctrl+T</kbd> convierte el rango en tabla (en algunas versiones en español es <kbd>Ctrl+Q</kbd>).', 'Escribe en la fila de abajo de la tabla: la fila nueva se agrega sola.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const anatomia = `<figure class="figura-explica"><svg viewBox="0 0 620 200" role="img" aria-label="Partes de una tabla de Excel">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="10" width="440" height="26" fill="#8a5a3c"/><text x="20" y="28" fill="#fff" font-weight="700">Folio ▾   Cliente ▾        Cantidad ▾   Precio ▾   Importe ▾</text>
  <rect x="10" y="36" width="440" height="22" fill="#f3ebdf"/><text x="20" y="51">2501      Coworking Nodo     20         $52        =[@Cantidad]*[@Precio]</text>
  <rect x="10" y="58" width="440" height="22" fill="#fff"/><text x="20" y="73">2502      Clínica Sonrisa    15         $54        $810</text>
  <rect x="10" y="80" width="440" height="22" fill="#f3ebdf"/><text x="20" y="95">2503      Coworking Nodo     24         $68        $1,632</text>
  <rect x="10" y="102" width="440" height="24" fill="#fff" stroke="#8a5a3c"/><text x="20" y="119" font-weight="700">Total                                                        =SUBTOTALES(109,[Importe])</text>
  <text x="465" y="28">← encabezados con filtros</text><text x="465" y="56">← columna calculada</text><text x="465" y="80">← filas con bandas</text><text x="465" y="119">← fila de totales</text>
  <text x="10" y="152">Nombre de la tabla: Pedidos · toda la columna: Pedidos[Importe] · la fila actual: [@Importe]</text>
  <text x="10" y="176">Al escribir debajo de la última fila, la tabla crece y copia formato y fórmulas.</text></g></svg></figure>`;
  LT.ampliarModulo(13, {
    objetivos: [
      'Convertir un rango en tabla, darle nombre y elegir su estilo.',
      'Escribir columnas calculadas con referencias estructuradas (<code>[@Cantidad]</code>, <code>Pedidos[Importe]</code>).',
      'Activar la fila de totales y explicar por qué usa SUBTOTALES.',
      'Filtrar con los encabezados y con segmentaciones de datos.',
      'Aprovechar que la tabla crece sola: fórmulas, gráficos y tablas dinámicas que se actualizan.',
      'Saber cuándo convertir una tabla de nuevo en rango.',
    ],
    detalle: [
      { titulo: 'Anatomía de una tabla', abierto: true, html: anatomia },
      { titulo: 'Referencias estructuradas', html: '<table><tr><th>Referencia</th><th>Significa</th><th>Ejemplo</th></tr><tr><td><code>[@Precio]</code></td><td>El precio de la fila actual</td><td><code>=[@Cantidad]*[@Precio]</code></td></tr><tr><td><code>Pedidos[Importe]</code></td><td>Toda la columna (solo datos)</td><td><code>=SUMA(Pedidos[Importe])</code> desde otra hoja</td></tr><tr><td><code>Pedidos[#Totales]</code></td><td>La fila de totales</td><td><code>=Pedidos[[#Totales],[Importe]]</code></td></tr><tr><td><code>Pedidos[#Todo]</code></td><td>Encabezados, datos y totales</td><td>Origen de una búsqueda</td></tr><tr><td><code>Pedidos[[Cliente]:[Producto]]</code></td><td>Varias columnas contiguas</td><td>Matriz de BUSCARX o FILTRAR</td></tr></table><p>Con tablas, <code>=SUMAR.SI(Pedidos[Sucursal],"Norte",Pedidos[Importe])</code> se lee como una frase y no hay que fijar rangos con $: la referencia crece con la tabla.</p>' },
      { titulo: 'La fila de totales y SUBTOTALES', html: '<p>La lista desplegable de la fila de totales escribe <code>=SUBTOTALES(109,[Importe])</code>. El primer argumento elige la operación: 101 promedio, 102 contar, 103 contara, 104 máximo, 105 mínimo, 109 suma. Los códigos 101–111 ignoran las filas ocultas por filtros (y las ocultas a mano); los 1–11 solo las filtradas. Por eso, al filtrar «Norte», el total muestra solo lo de Norte.</p>' },
      { titulo: 'Segmentaciones y cuándo volver a rango', html: '<p>Diseño de tabla › <b>Insertar segmentación de datos</b> agrega botones para filtrar con un clic, muy útiles en tableros. Ctrl+clic selecciona varios botones; el embudo con ✕ borra el filtro.</p><p><b>Convertir en rango</b> (Diseño de tabla › Herramientas) quita el objeto tabla pero conserva el formato; las referencias estructuradas se vuelven normales. Hazlo si necesitas combinar celdas o si el libro se usará en una herramienta que no acepta tablas.</p>' },
    ],
    errores: [
      'Dejar filas vacías dentro de los datos antes de crear la tabla: queda partida en dos.',
      'Escribir el total con SUMA debajo de la tabla: no ignora los filtros y estorba al crecer.',
      'Sobrescribir una celda de una columna calculada con un valor: Excel la marca como inconsistente.',
      'Dejar el nombre genérico «Tabla1»: las fórmulas se leen peor.',
    ],
    consejos: [
      'Crea la tabla con <kbd>Ctrl</kbd>+<kbd>T</kbd> y nómbrala de inmediato (Pedidos, Clientes, Catálogo).',
      'Usa encabezados cortos y sin repetir: se vuelven los nombres de las columnas en las fórmulas.',
      'Basa gráficos, tablas dinámicas y validaciones en tablas: crecen solos.',
      'Para agregar un registro, escribe en la primera fila vacía debajo de la tabla o pulsa <kbd>Tab</kbd> en la última celda.',
    ],
    microExtra: [
      { titulo: 'La tabla crece sola', tipo: 'opcion', enunciado: 'La tabla Pedidos tiene 40 registros y en otra hoja calculas <code>=SUMA(Pedidos[Importe])</code>. Capturas el pedido 41 en la fila de abajo. ¿Qué pasa con la suma?', opciones: ['Incluye el pedido nuevo automáticamente', 'Hay que cambiar el rango a mano', 'Marca #¡REF!', 'Solo cambia si guardas el libro'], correcta: 0, explicacion: 'La tabla se amplía al escribir junto a ella y la referencia Pedidos[Importe] siempre abarca toda la columna de datos.', retro: { 1: 'Eso pasaría con un rango fijo como F2:F41, no con una referencia estructurada.' } },
    ],
    autoeval: [
      { p: '¿Qué tres cosas hace Excel por ti cuando conviertes un rango en tabla?', r: 'Agrega filtros en los encabezados, aplica un estilo con bandas y hace que la tabla crezca sola con formato y fórmulas; además los encabezados quedan visibles al desplazarte.' },
      { p: 'Escribe la columna calculada Importe de una tabla con Cantidad y Precio.', r: '<code>=[@Cantidad]*[@Precio]</code>, escrita una vez en la primera fila de la columna.' },
      { p: '¿Cómo sumas desde otra hoja la columna Importe de la tabla Pedidos?', r: '<code>=SUMA(Pedidos[Importe])</code>.' },
      { p: '¿Por qué la fila de totales usa SUBTOTALES(109, …)?', r: 'Porque 109 suma ignorando las filas ocultas por filtros, así el total refleja lo que se ve.' },
      { p: '¿Dónde cambias el nombre de una tabla?', r: 'Diseño de tabla › Propiedades › Nombre de la tabla.' },
      { p: '¿Para qué sirve una segmentación de datos?', r: 'Para filtrar la tabla (o una tabla dinámica) con botones visibles, de un clic.' },
      { p: '¿Cuándo convertirías una tabla en rango?', r: 'Cuando necesitas una función que las tablas no permiten (como combinar celdas) o compatibilidad con otra herramienta; se pierde el crecimiento automático.' },
    ],
    conexiones: [
      { id: 10, texto: 'SUMAR.SI.CONJUNTO con columnas de tabla no necesita fijar rangos.' },
      { id: 15, texto: 'una lista desplegable basada en una columna de tabla se amplía sola.' },
      { id: 17, texto: 'una tabla dinámica basada en una tabla incluye los registros nuevos al actualizar.' },
      { id: 23, texto: 'Power Query carga sus resultados como tablas.' },
    ],
  });
})();
