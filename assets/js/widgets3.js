/* Widgets de la versión 3.
   editorPQ: simulador del Editor de Power Query (Obtener y transformar datos).
   Aplica pasos sobre una consulta (quitar columnas, filtrar, recortar, cambiar tipo,
   extraer, renombrar, agregar columnas) y los muestra como «pasos aplicados» con su
   código M. «Actualizar» vuelve a ejecutar los mismos pasos sobre datos nuevos. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const W = (LT.widgets = LT.widgets || {});

  const TIPOS = { any: ['ABC 123', 'Cualquiera'], texto: ['ABC', 'Texto'], entero: ['1²3', 'Número entero'], decimal: ['1.2', 'Número decimal'], fecha: ['📅', 'Fecha'] };
  const ERR = { error: true };
  const esErr = (v) => v && typeof v === 'object' && v.error;
  const vacio = (v) => v == null || v === '';
  const nomPropio = (s) => String(s).toLowerCase().replace(/(^|[\s\-/(])([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase());
  const fechaDe = (v) => {
    if (typeof v === 'number') return v;
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v).trim());
    return m ? LT.fechas.aSerial(+m[3], +m[2], +m[1]) : ERR;
  };
  const mostrarValor = (v, tipo) => {
    if (esErr(v)) return 'Error';
    if (v == null) return 'null';
    if (tipo === 'fecha' && typeof v === 'number') return LT.fechas.texto(v);
    if (typeof v === 'number') return LT.u.formatoMiles(v, Number.isInteger(v) ? 0 : 2);
    return String(v);
  };
  const qc = (n) => (/^[A-Za-z_][A-Za-z0-9_.]*$/.test(n) ? n : '#"' + n + '"');

  /* ---------------------------------------------------------- operaciones */
  const OPS = {
    quitarColumnas: { nombre: (a) => 'Columnas quitadas', m: (a, prev) => 'Table.RemoveColumns(' + prev + ', {' + a.cols.map((c) => '"' + c + '"').join(', ') + '})', aplicar: (t, a) => { const idx = a.cols.map((c) => t.cols.indexOf(c)); if (idx.some((i) => i < 0)) throw new Error('No existe la columna ' + a.cols[idx.findIndex((i) => i < 0)]); t.cols = t.cols.filter((c, i) => !idx.includes(i)); t.tipos = t.tipos.filter((c, i) => !idx.includes(i)); t.filas = t.filas.map((f) => f.filter((x, i) => !idx.includes(i))); } },
    renombrar: { nombre: () => 'Columnas con nombre cambiado', m: (a, prev) => 'Table.RenameColumns(' + prev + ', {{"' + a.col + '", "' + a.nuevo + '"}})', aplicar: (t, a) => { const i = col(t, a.col); if (t.cols.includes(a.nuevo)) throw new Error('Ya existe una columna «' + a.nuevo + '».'); t.cols[i] = a.nuevo; } },
    filtrar: { nombre: () => 'Filas filtradas', m: (a, prev) => 'Table.SelectRows(' + prev + ', each ' + (a.op === 'noVacio' ? '[' + a.col + '] <> null and [' + a.col + '] <> ""' : '[' + a.col + '] <> "' + a.valor + '"') + ')', aplicar: (t, a) => { const i = col(t, a.col); t.filas = t.filas.filter((f) => (a.op === 'noVacio' ? !vacio(f[i]) : String(f[i] == null ? '' : f[i]).trim().toLowerCase() !== String(a.valor).trim().toLowerCase())); } },
    quitarVacias: { nombre: () => 'Filas en blanco quitadas', m: (a, prev) => 'Table.SelectRows(' + prev + ', each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))', aplicar: (t) => { t.filas = t.filas.filter((f) => f.some((x) => !vacio(x))); } },
    transformar: { nombre: (a) => ({ recortar: 'Texto recortado', nompropio: 'Poner En Mayúsculas Cada Palabra', mayus: 'Texto en mayúsculas', minus: 'Texto en minúsculas' }[a.como]), m: (a, prev) => 'Table.TransformColumns(' + prev + ', {{"' + a.col + '", ' + { recortar: 'Text.Trim', nompropio: 'Text.Proper', mayus: 'Text.Upper', minus: 'Text.Lower' }[a.como] + ', type text}})', aplicar: (t, a) => { const i = col(t, a.col); t.filas.forEach((f) => { const v = f[i]; if (vacio(v) || esErr(v)) return; const s = String(v); f[i] = a.como === 'recortar' ? s.trim().replace(/\s+/g, ' ') : a.como === 'nompropio' ? nomPropio(s) : a.como === 'mayus' ? s.toUpperCase() : s.toLowerCase(); }); } },
    extraerEntre: { nombre: () => 'Texto extraído entre delimitadores', m: (a, prev) => 'Table.TransformColumns(' + prev + ', {{"' + a.col + '", each Text.BetweenDelimiters(_, "' + a.ini + '", "' + a.fin + '"), type text}})', aplicar: (t, a) => { const i = col(t, a.col); t.filas.forEach((f) => { const s = String(f[i] == null ? '' : f[i]); const p = s.indexOf(a.ini); const q = s.indexOf(a.fin, p + a.ini.length); f[i] = p < 0 ? '' : s.slice(p + a.ini.length, q < 0 ? undefined : q); }); } },
    reemplazar: { nombre: () => 'Valor reemplazado', m: (a, prev) => 'Table.ReplaceValue(' + prev + ', "' + a.de + '", "' + a.a + '", Replacer.ReplaceText, {"' + a.col + '"})', aplicar: (t, a) => { const i = col(t, a.col); t.filas.forEach((f) => { if (typeof f[i] === 'string') f[i] = f[i].split(a.de).join(a.a); }); } },
    tipo: { nombre: () => 'Tipo cambiado', m: (a, prev) => 'Table.TransformColumnTypes(' + prev + ', {{"' + a.col + '", ' + { texto: 'type text', entero: 'Int64.Type', decimal: 'type number', fecha: 'type date' }[a.tipo] + '}})', aplicar: (t, a) => {
      const i = col(t, a.col);
      t.tipos[i] = a.tipo;
      t.filas.forEach((f) => {
        const v = f[i];
        if (v == null || esErr(v)) return;
        if (a.tipo === 'texto') f[i] = String(v);
        else if (a.tipo === 'fecha') f[i] = fechaDe(v);
        else { const n = typeof v === 'number' ? v : String(v).trim() === '' ? null : Number(String(v).replace(/[$,\s]/g, '')); f[i] = n == null ? null : isFinite(n) ? (a.tipo === 'entero' ? Math.round(n) : n) : ERR; }
      });
    } },
    producto: { nombre: (a) => 'Columna «' + a.nuevo + '» agregada', m: (a, prev) => 'Table.AddColumn(' + prev + ', "' + a.nuevo + '", each [' + a.a + '] * [' + a.b + '], type number)', aplicar: (t, a) => { const i = col(t, a.a), j = col(t, a.b); if (t.cols.includes(a.nuevo)) throw new Error('Ya existe una columna «' + a.nuevo + '».'); t.cols.push(a.nuevo); t.tipos.push('decimal'); t.filas.forEach((f) => { const x = f[i], y = f[j]; f.push(typeof x === 'number' && typeof y === 'number' ? x * y : ERR); }); } },
    mes: { nombre: (a) => 'Mes insertado', m: (a, prev) => 'Table.AddColumn(' + prev + ', "' + a.nuevo + '", each Date.Month([' + a.col + ']), Int64.Type)', aplicar: (t, a) => { const i = col(t, a.col); if (t.tipos[i] !== 'fecha') throw new Error('Para extraer el mes, la columna «' + a.col + '» debe ser de tipo Fecha.'); t.cols.push(a.nuevo); t.tipos.push('entero'); t.filas.forEach((f) => { const v = f[i]; f.push(typeof v === 'number' ? LT.fechas.deSerial(v).m : ERR); }); } },
    encabezados: { nombre: () => 'Encabezados promovidos', m: (a, prev) => 'Table.PromoteHeaders(' + prev + ', [PromoteAllScalars=true])', aplicar: (t) => { if (!t.filas.length) return; t.cols = t.filas[0].map((x, i) => (vacio(x) ? 'Column' + (i + 1) : String(x))); t.filas = t.filas.slice(1); t.tipos = t.cols.map(() => 'any'); } },
  };
  function col(t, n) { const i = t.cols.indexOf(n); if (i < 0) throw new Error('No existe la columna «' + n + '» (¿la quitaste o la renombraste en un paso anterior?).'); return i; }
  function ejecutar(origen, pasos) {
    const t = { cols: origen.cols.slice(), tipos: (origen.tipos || origen.cols.map(() => 'any')).slice(), filas: origen.filas.map((f) => f.slice()) };
    const res = [];
    for (const p of pasos) {
      try { OPS[p.op].aplicar(t, p.args); res.push({ ok: true }); } catch (e) { res.push({ ok: false, error: e.message }); return { tabla: t, res, fallo: res.length - 1 }; }
    }
    return { tabla: t, res, fallo: -1 };
  }

  /* opts: {origen(version) -> {nombre, cols, tipos?, filas, descripcion}, pasosIniciales, alCambiar, versiones} */
  W.editorPQ = function (cont, opts) {
    let version = 0;
    let pasos = (opts.pasosIniciales || []).map((p) => Object.assign({}, p));
    let seleccion = null;
    let pasoVisto = null;
    let cargado = false;
    const raiz = h('div', { class: 'pq' });
    cont.appendChild(raiz);
    const origen = () => opts.origen(version);
    const nombrePaso = (p, i) => (i === -1 ? 'Origen' : OPS[p.op].nombre(p.args));
    const codigoM = (hasta) => {
      const nombres = ['Origen'].concat(pasos.map((p, i) => nombrePaso(p, i)));
      const ids = nombres.map((n, i) => (i === 0 ? 'Origen' : qc(n + (nombres.slice(0, i).filter((x) => x === n).length ? ' ' + (nombres.slice(0, i).filter((x) => x === n).length + 1) : ''))));
      const lineas = ['let', '    Origen = ' + (origen().m || 'Folder.Files("C:\\La Taza\\Ventas")') + ','];
      pasos.slice(0, hasta + 1).forEach((p, i) => lineas.push('    ' + ids[i + 1] + ' = ' + OPS[p.op].m(p.args, ids[i]) + ','));
      lineas[lineas.length - 1] = lineas[lineas.length - 1].replace(/,$/, '');
      lineas.push('in', '    ' + ids[Math.min(hasta + 1, pasos.length)]);
      return lineas.join('\n');
    };
    const agregar = (op, args) => { pasos.push({ op, args }); pasoVisto = pasos.length - 1; cargado = false; render(); };
    const pedir = async (titulo, campos) => {
      const ins = {};
      const cuerpo = h('div', null, campos.map((c) => {
        const el = c.opciones ? h('select', { class: 'herr-sel', style: { width: '100%' } }, c.opciones.map((o) => h('option', { value: Array.isArray(o) ? o[0] : o, selected: (Array.isArray(o) ? o[0] : o) === c.valor ? true : null }, Array.isArray(o) ? o[1] : o))) : h('input', { type: 'text', value: c.valor || '', style: { width: '100%', padding: '6px 8px', border: '1px solid var(--linea-2)', borderRadius: '6px' } });
        ins[c.id] = el;
        return h('label', { style: { display: 'block', margin: '8px 0' } }, h('div', { style: { fontSize: '.86rem', marginBottom: '3px' } }, c.texto), el);
      }));
      const r = await LT.ui.modal({ titulo, cuerpo, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
      if (!r) return null;
      const out = {};
      for (const [k, el] of Object.entries(ins)) out[k] = el.value;
      return out;
    };
    const conCol = (fn) => () => { if (!seleccion) { LT.ui.toast('Primero haz clic en el encabezado de una columna.', 'aviso'); return; } fn(seleccion); };
    function render() {
      raiz.innerHTML = '';
      const o = origen();
      const { tabla, res, fallo } = ejecutar(o, pasos);
      const hasta = pasoVisto == null ? pasos.length - 1 : pasoVisto;
      const vista = hasta === pasos.length - 1 ? tabla : ejecutar(o, pasos.slice(0, hasta + 1)).tabla;
      if (seleccion && !vista.cols.includes(seleccion)) seleccion = null;
      const btn = (txt, fn, t) => h('button', { class: 'btn chico', title: t || txt, onclick: fn }, txt);
      const cinta = h('div', { class: 'pq-cinta' },
        h('div', { class: 'pq-grupo' }, h('span', { class: 'pq-g' }, 'Inicio'), btn('Usar primera fila como encabezado', () => agregar('encabezados', {})), btn('Quitar columna', conCol((c) => agregar('quitarColumnas', { cols: [c] }))), btn('Quitar filas en blanco', () => agregar('quitarVacias', {}))),
        h('div', { class: 'pq-grupo' }, h('span', { class: 'pq-g' }, 'Transformar'),
          btn('Tipo de datos…', conCol(async (c) => { const r = await pedir('Cambiar tipo de «' + c + '»', [{ id: 'tipo', texto: 'Tipo de datos', opciones: [['texto', 'Texto'], ['entero', 'Número entero'], ['decimal', 'Número decimal'], ['fecha', 'Fecha']] }]); if (r) agregar('tipo', { col: c, tipo: r.tipo }); })),
          btn('Formato…', conCol(async (c) => { const r = await pedir('Formato de texto de «' + c + '»', [{ id: 'como', texto: 'Transformación', opciones: [['recortar', 'Recortar (quitar espacios sobrantes)'], ['nompropio', 'Poner En Mayúsculas Cada Palabra'], ['mayus', 'MAYÚSCULAS'], ['minus', 'minúsculas']] }]); if (r) agregar('transformar', { col: c, como: r.como }); })),
          btn('Extraer…', conCol(async (c) => { const r = await pedir('Extraer texto entre delimitadores de «' + c + '»', [{ id: 'ini', texto: 'Delimitador inicial', valor: '-' }, { id: 'fin', texto: 'Delimitador final', valor: '.' }]); if (r) agregar('extraerEntre', { col: c, ini: r.ini, fin: r.fin }); })),
          btn('Reemplazar valores…', conCol(async (c) => { const r = await pedir('Reemplazar valores en «' + c + '»', [{ id: 'de', texto: 'Valor que buscar' }, { id: 'a', texto: 'Reemplazar con' }]); if (r && r.de) agregar('reemplazar', { col: c, de: r.de, a: r.a }); })),
          btn('Cambiar nombre…', conCol(async (c) => { const r = await pedir('Cambiar el nombre de «' + c + '»', [{ id: 'nuevo', texto: 'Nombre nuevo', valor: c }]); if (r && r.nuevo && r.nuevo !== c) agregar('renombrar', { col: c, nuevo: r.nuevo.trim() }); })),
          btn('Filtrar…', conCol(async (c) => { const r = await pedir('Filtrar filas de «' + c + '»', [{ id: 'op', texto: 'Conservar las filas donde la columna…', opciones: [['distinto', 'no es igual a'], ['noVacio', 'no está vacía']] }, { id: 'valor', texto: 'Valor (para «no es igual a»)' }]); if (r) agregar('filtrar', { col: c, op: r.op, valor: r.valor }); }))),
        h('div', { class: 'pq-grupo' }, h('span', { class: 'pq-g' }, 'Agregar columna'),
          btn('Columna personalizada (×)…', async () => { const num = vista.cols; const r = await pedir('Columna personalizada: [A] × [B]', [{ id: 'nuevo', texto: 'Nombre de la columna nueva', valor: 'Total' }, { id: 'a', texto: 'Columna A', opciones: num }, { id: 'b', texto: 'Columna B', opciones: num, valor: num[1] }]); if (r && r.nuevo) agregar('producto', { nuevo: r.nuevo.trim(), a: r.a, b: r.b }); }),
          btn('Fecha › Mes', conCol(async (c) => { const r = await pedir('Insertar el mes de «' + c + '»', [{ id: 'nuevo', texto: 'Nombre de la columna nueva', valor: 'Mes' }]); if (r && r.nuevo) agregar('mes', { col: c, nuevo: r.nuevo.trim() }); }))));
      const formula = h('div', { class: 'pq-formula mono' }, 'fx  ', hasta < 0 ? '= ' + (o.m || 'Origen') : '= ' + OPS[pasos[hasta].op].m(pasos[hasta].args, hasta === 0 ? 'Origen' : qc(nombrePaso(pasos[hasta - 1], hasta - 1))));
      const errores = vista.filas.reduce((s, f) => s + f.filter(esErr).length, 0);
      const t = h('table', { class: 'pq-tabla' });
      t.appendChild(h('thead', null, h('tr', null, h('th', { class: 'pq-n' }, ''), vista.cols.map((c, i) => h('th', { class: c === seleccion ? 'sel' : '', onclick: () => { seleccion = c; render(); }, title: 'Clic para seleccionar la columna' }, h('span', { class: 'pq-tipo' }, TIPOS[vista.tipos[i] || 'any'][0]), ' ', c)))));
      const tb = h('tbody');
      vista.filas.slice(0, 60).forEach((f, r) => tb.appendChild(h('tr', null, h('td', { class: 'pq-n' }, r + 1), f.map((v, i) => h('td', { class: (esErr(v) ? 'err ' : '') + (v == null ? 'nulo ' : '') + (vista.cols[i] === seleccion ? 'sel' : '') }, mostrarValor(v, vista.tipos[i]))))));
      t.appendChild(tb);
      const listaPasos = h('ol', { class: 'pq-pasos', start: '0' }, h('li', { class: hasta === -1 ? 'activo' : '', onclick: () => { pasoVisto = -1; render(); } }, 'Origen'),
        pasos.map((p, i) => h('li', { class: (hasta === i ? 'activo ' : '') + (res[i] && !res[i].ok ? 'falla' : '') + (fallo >= 0 && i > fallo ? ' inactivo' : ''), title: res[i] && !res[i].ok ? res[i].error : 'Clic para ver la tabla en este paso' }, h('span', { onclick: () => { pasoVisto = i; render(); } }, nombrePaso(p, i), res[i] && !res[i].ok ? ' ⚠' : ''), h('button', { class: 'pq-x', title: 'Eliminar paso', onclick: (e) => { e.stopPropagation(); pasos.splice(i, 1); pasoVisto = null; cargado = false; render(); } }, '✕'))));
      raiz.append(cinta, formula,
        h('div', { class: 'pq-cuerpo' },
          h('div', { class: 'pq-datos' }, h('div', { class: 'pq-info' }, h('b', null, o.nombre || 'Consulta'), ' · ' + vista.filas.length + ' filas · ' + vista.cols.length + ' columnas', errores ? h('span', { class: 'chip', style: { background: 'var(--rojo-claro)', color: 'var(--rojo)', marginLeft: '8px' } }, errores + ' errores') : null, fallo >= 0 ? h('span', { class: 'chip pendiente', style: { marginLeft: '8px' } }, 'Un paso falla: ' + res[fallo].error) : null), h('div', { class: 'pq-scroll' }, t)),
          h('div', { class: 'pq-lateral' }, h('div', { class: 'pq-g' }, 'Configuración de la consulta'), h('div', { class: 'chico' }, 'Nombre: ', h('b', null, o.nombre || 'Consulta')), h('div', { class: 'pq-g', style: { marginTop: '8px' } }, 'Pasos aplicados'), listaPasos,
            h('details', { class: 'pq-m' }, h('summary', null, 'Editor avanzado (código M)'), h('pre', { class: 'mono' }, codigoM(hasta))))),
        h('div', { class: 'grupo-btn', style: { marginTop: '8px' } },
          h('button', { class: 'btn primario chico', onclick: () => { cargado = true; LT.ui.toast('Cerrar y cargar: ' + tabla.filas.length + ' filas cargadas en la tabla «' + (o.nombre || 'Consulta') + '».', 'ok'); avisar(); } }, 'Cerrar y cargar'),
          opts.versiones > 1 ? h('button', { class: 'btn chico cafe', onclick: () => { version = Math.min(version + 1, opts.versiones - 1); cargado = false; render(); LT.ui.toast(opts.textoActualizar || 'Llegaron datos nuevos: los pasos se aplicaron otra vez.', 'ok'); } }, '⟳ Actualizar (llegan datos nuevos)') : null,
          cargado ? h('span', { class: 'chip ok' }, '✓ Cargada: ' + tabla.filas.length + ' filas') : h('span', { class: 'chip' }, 'Sin cargar')));
      avisar();
    }
    function avisar() { if (opts.alCambiar) opts.alCambiar(estado()); }
    function estado() { const r = ejecutar(origen(), pasos); return { pasos: JSON.parse(JSON.stringify(pasos)), tabla: r.tabla, fallo: r.fallo, cargado, version }; }
    render();
    return { estado, render, ejecutar: (p) => ejecutar(origen(), p), fijarPasos: (p) => { pasos = p.map((x) => Object.assign({}, x)); render(); }, cargar: () => { cargado = true; avisar(); } };
  };
  W.editorPQ.OPS = OPS;
  W.editorPQ.esErr = esErr;
})();
