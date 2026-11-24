/* Pruebas declarativas para libros de Excel reales (versión 3).
   Las usan las tareas de aprendizaje, los proyectos y los laboratorios nuevos.
   Cada prueba es un objeto JSON {t: tipo, titulo, ...}; LT.revision.compilar() las
   convierte en pruebas {titulo, nivel, fn(L, A)} que LT.xlsx.revisar() ya sabe ejecutar.

   Los valores esperados se calculan aplicando las fórmulas de la solución (en inglés,
   como se guardan en el archivo) sobre los datos del propio libro del participante, con
   el mismo motor HyperFormula del simulador. Así la revisión no depende de datos fijos. */
(function () {
  'use strict';
  const LT = window.LT;
  const R = LT.refs;

  /* ------------------------------------------------------------ utilidades */
  function separar(ref, hojaDef) {
    const s = String(ref).trim();
    const i = s.lastIndexOf('!');
    if (i < 0) return { hoja: hojaDef, rango: s };
    return { hoja: s.slice(0, i).replace(/^'(.*)'$/, '$1').replace(/''/g, "'"), rango: s.slice(i + 1) };
  }
  function celdas(lista, hojaDef) {
    const out = [];
    for (const parte of String(lista).split(',')) {
      if (!parte.trim()) continue;
      const { hoja, rango } = separar(parte, hojaDef);
      for (const x of R.celdasDe(rango.replace(/\$/g, ''))) out.push({ hoja, r: x.r, c: x.c, dir: x.dir });
    }
    return out;
  }
  const aMotorArchivo = (f) => String(f).replace(/_xlfn\.(_xlws\.)?/gi, '').replace(/_xlws\./gi, '').replace(/\bCONCAT\(/gi, 'CONCATENATE(').replace(/\b(TRUE|FALSE)\b(?!\s*\()/gi, '$1()');
  function hojaReal(L, nombre) {
    const h = L.hoja(nombre);
    if (!h) throw new Error('No encontré la hoja «' + nombre + '». No cambies su nombre (hojas del libro: ' + L.hojas.map((x) => x.nombre).join(', ') + ').');
    return h;
  }
  const num = (v) => (typeof v === 'number' ? v : v != null && v !== '' && typeof v !== 'object' && !isNaN(+String(v).replace(/[$,\s]/g, '')) ? +String(v).replace(/[$,\s]/g, '') : null);
  const esErr = (v) => (v && typeof v === 'object' && 'error' in v) || (typeof v === 'string' && /^#(N\/A|NA|DIV|VALUE|REF|NAME|NUM|NULL|SPILL|CALC|ERROR|¡|¿)/i.test(v));
  function iguales(a, b, tol) {
    if (esErr(b)) return esErr(a);
    if (esErr(a)) return false;
    if (typeof b === 'number') { const n = num(a); return n != null && Math.abs(n - b) <= (tol != null ? tol : 0.01) + 1e-9 * Math.abs(b); }
    if (typeof b === 'boolean') return a === b || (typeof a === 'string' && a.trim().toUpperCase() === (b ? 'TRUE' : 'FALSE')) || (typeof a === 'string' && a.trim().toUpperCase() === (b ? 'VERDADERO' : 'FALSO'));
    if (b == null || b === '') return a == null || a === '';
    return String(a == null ? '' : a).trim().toLowerCase().replace(/\s+/g, ' ') === String(b).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  const mostrar = (v) => (v && typeof v === 'object' && 'error' in v ? v.error : LT.verificador.mostrar(v));
  const plantilla = (m, d) => String(m || '').replace(/\{(\w+)\}/g, (x, k) => (d[k] != null ? d[k] : x));

  /* Expande la solución {'T1!D2:D21': '=IF(C2>…)'} en {hoja(minúsculas): {dir: valor}} */
  function expandir(sol, hojaDef) {
    const o = {};
    for (const [clave, valor] of Object.entries(sol || {})) {
      for (const parte of clave.split(',')) {
        const { hoja, rango } = separar(parte, hojaDef);
        const rg = R.parseRango(rango.replace(/\$/g, ''));
        if (!rg) continue;
        const k = String(hoja).toLowerCase();
        o[k] = o[k] || {};
        for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
          let v;
          if (Array.isArray(valor)) v = Array.isArray(valor[0]) ? (valor[r - rg.r1] || [])[c - rg.c1] : valor[(r - rg.r1) + (c - rg.c1)];
          else if (typeof valor === 'string' && valor[0] === '=') v = '=' + aMotorArchivo(R.desplazarFormula(valor.slice(1), r - rg.r1, c - rg.c1));
          else v = valor;
          o[k][R.dir(r, c)] = v === undefined ? null : v;
        }
      }
    }
    return o;
  }
  function fusionar(a, b) {
    const o = {};
    for (const src of [a, b]) for (const [h, cs] of Object.entries(src || {})) o[h] = Object.assign(o[h] || {}, cs);
    return o;
  }
  /* Construye un motor con las celdas del libro y, encima, las celdas de «sobre» */
  function motor(L, sobre, nombresExtra) {
    const sheets = {};
    for (const hj of L.hojas) {
      const mat = [];
      const poner = (dir, val) => { const p = R.parseCelda(dir); if (!p) return; while (mat.length <= p.r) mat.push([]); while (mat[p.r].length <= p.c) mat[p.r].push(null); mat[p.r][p.c] = val; };
      const derrame = new Set();
      for (const [dir, c] of hj.celdas) {
        if (c.matricial && c.f) { for (const x of R.celdasDe(c.matricial)) if (x.dir !== dir) derrame.add(x.dir); }
      }
      for (const [dir, c] of hj.celdas) {
        if (derrame.has(dir) && !(c.f)) continue;
        let val;
        if (c.ft === 'dataTable') val = typeof c.v === 'number' ? c.v : null;
        else if (c.f != null && c.f !== '' && /\[/.test(c.f.replace(/"(?:[^"]|"")*"/g, ''))) val = c.v == null ? null : typeof c.v === 'string' ? (/^[=+\-]/.test(c.v) || /^\d/.test(c.v) ? "'" + c.v : c.v) : c.v; // referencias estructuradas o externas: el motor no las entiende, se usa el valor guardado
        else if (c.f != null && c.f !== '') val = '=' + aMotorArchivo(c.f);
        else if (c.t === 'e') val = null;
        else val = c.v == null ? null : typeof c.v === 'string' ? (/^[=+\-]/.test(c.v) || /^\d/.test(c.v) ? "'" + c.v : c.v) : c.v;
        poner(dir, val);
      }
      const o = sobre && sobre[hj.nombre.toLowerCase()];
      if (o) for (const [dir, val] of Object.entries(o)) poner(dir, val);
      sheets[hj.nombre] = mat.map((f) => f.map((x) => (x === undefined ? null : x)));
    }
    const hf = window.HyperFormula.buildFromSheets(sheets, { licenseKey: 'gpl-v3', useArrayArithmetic: true });
    const definidos = new Set();
    for (const n of L.nombres) {
      if (n.nombre.startsWith('_xlnm') || n.hoja != null) continue;
      try { hf.addNamedExpression(n.nombre, '=' + aMotorArchivo(n.ref)); definidos.add(n.nombre.toLowerCase()); } catch (e) { /* nombre no compatible */ }
    }
    for (const [n, ref] of Object.entries(nombresExtra || {})) {
      if (definidos.has(n.toLowerCase())) continue;
      try { hf.addNamedExpression(n, ref[0] === '=' ? ref : '=' + ref); } catch (e) { /* */ }
    }
    return hf;
  }
  function leer(L, hf, hoja, dir) {
    const hj = L.hoja(hoja);
    if (!hj) return null;
    const id = hf.getSheetId(hj.nombre);
    const p = R.parseCelda(dir);
    const v = hf.getCellValue({ sheet: id, row: p.r, col: p.c });
    if (LT.motor.esError(v)) return { error: '#' + v.type, tipo: v.type };
    return v;
  }

  /* Contexto de revisión de un libro: valores del participante y de la solución */
  function contexto(L, A, spec) {
    const hojaDef = spec.hoja || (L.hojas[1] || L.hojas[0] || {}).nombre;
    let hfSol = null;
    const X = {
      L, A, hojaDef,
      celdas: (r) => celdas(r, hojaDef),
      valor: (x) => { hojaReal(L, x.hoja); return L.valor(x.hoja, x.dir); },
      esperado: (x) => { if (!hfSol) hfSol = motor(L, expandir(spec.sol, hojaDef), spec.solNombres); return leer(L, hfSol, x.hoja, x.dir); },
      motor: (sobre) => motor(L, sobre, spec.solNombres),
      leer: (hf, x) => leer(L, hf, x.hoja, x.dir),
      expandir: (sol) => expandir(sol, hojaDef),
      fusionar, iguales, mostrar, num, esErr,
      cerrar: () => { if (hfSol) { hfSol.destroy(); hfSol = null; } },
    };
    return X;
  }

  /* -------------------------------------------------------- tipos de prueba */
  const ESTILO = {
    negrita: (e) => e.negrita, cursiva: (e) => e.cursiva, subrayado: (e) => e.subrayado,
    relleno: (e) => !!e.relleno, bordes: (e) => e.tieneBordes, ajustar: (e) => !!e.alineacion.wrap,
    centrado: (e) => /center/.test(e.alineacion.h || ''), derecha: (e) => e.alineacion.h === 'right',
    desbloqueada: (e) => e.bloqueada === false, estiloCelda: (e) => e.estiloNombre && e.estiloNombre !== 'Normal',
  };
  const NOMBRE_ESTILO = { negrita: 'negrita', cursiva: 'cursiva', subrayado: 'subrayado', relleno: 'color de relleno', bordes: 'bordes', ajustar: '«Ajustar texto»', centrado: 'alineación centrada', derecha: 'alineación a la derecha', desbloqueada: 'celdas desbloqueadas (Formato de celdas › Proteger)', estiloCelda: 'un estilo de celda' };
  function formatoOk(cod, tipo, patron) {
    const c = cod || 'General';
    switch (tipo) {
      case 'moneda': return /\$|\[\$|"\$"|€|MXN/.test(c);
      case 'porcentaje': return /%/.test(c);
      case 'fecha': return LT.formato.esFecha(c);
      case 'miles': return /#,##0/.test(c);
      case 'entero': return /^[^.]*0(_|;|$|\))/.test(c.split(';')[0]) && !/\.0/.test(c.split(';')[0]);
      case 'decimales2': return /0\.00(?!0)/.test(c);
      case 'texto': return c === '@';
      case 'general': return c === 'General';
      default: return patron ? new RegExp(patron, 'i').test(c) : c !== 'General';
    }
  }
  const NOMBRE_FMT = { moneda: 'formato de moneda', porcentaje: 'formato de porcentaje', fecha: 'formato de fecha', miles: 'separador de miles', entero: 'formato sin decimales', decimales2: 'dos decimales', texto: 'formato de texto' };

  const T = {};
  /* Celdas con fórmula (no valores escritos a mano) */
  T.formula = (p, X) => {
    for (const x of X.celdas(p.r)) {
      const hj = hojaReal(X.L, x.hoja);
      const c = X.L.celda(hj, x.dir);
      if (!c || c.f == null) return plantilla(c && c.v != null && c.v !== '' ? (p.msg || '{celda} tiene un valor escrito: usa una fórmula para que se actualice sola.') : (p.msgVacia || p.msg || '{celda} está vacía: escribe la fórmula.'), { celda: x.hoja + '!' + x.dir });
    }
    return true;
  };
  /* Valores correctos: contra un valor fijo (v) o contra la solución */
  T.valores = (p, X) => {
    const lista = X.celdas(p.r);
    for (let i = 0; i < lista.length; i++) {
      const x = lista[i];
      hojaReal(X.L, x.hoja);
      const obt = X.valor(x);
      let esp;
      if (p.v !== undefined) esp = Array.isArray(p.v) ? (Array.isArray(p.v[0]) ? null : p.v[i]) : p.v;
      else esp = X.esperado(x);
      if (Array.isArray(p.v) && Array.isArray(p.v[0])) { const rg = R.parseRango(separar(String(p.r).split(',')[0], X.hojaDef).rango); esp = (p.v[x.r - rg.r1] || [])[x.c - rg.c1]; }
      if (!iguales(obt, esp, p.tol)) return plantilla(p.msg || '{celda} muestra {obtenido}, pero debería mostrar {esperado}.', { celda: x.hoja + '!' + x.dir, obtenido: mostrar(obt), esperado: mostrar(esp) });
    }
    return true;
  };
  /* Usa alguna (o todas) de las funciones indicadas, con nombre en inglés: SUMIF, XLOOKUP… */
  T.usa = (p, X) => {
    const req = [].concat(p.f).map((x) => x.toUpperCase());
    for (const x of X.celdas(p.r)) {
      const hj = hojaReal(X.L, x.hoja);
      const f = X.L.formula(hj, x.dir) || '';
      const usadas = LT.verificador.funcionesEn(f.replace(/_xlfn\.(_xlws\.)?/gi, '').replace(/_xlws\./gi, ''));
      const ok = p.todas ? req.every((n) => usadas.has(n)) : req.some((n) => usadas.has(n));
      if (!ok) return plantilla(p.msg || 'En {celda} usa ' + (p.nombres || req.map((n) => (LT.funcionPorArchivo(n) || { es: n }).es)).join(p.todas ? ' y ' : ' o ') + '.', { celda: x.hoja + '!' + x.dir });
    }
    return true;
  };
  T.noUsa = (p, X) => {
    const req = [].concat(p.f).map((x) => x.toUpperCase());
    for (const x of X.celdas(p.r)) {
      const f = X.L.formula(hojaReal(X.L, x.hoja), x.dir) || '';
      const usadas = LT.verificador.funcionesEn(f.replace(/_xlfn\.(_xlws\.)?/gi, ''));
      if (req.some((n) => usadas.has(n))) return plantilla(p.msg || 'En {celda} no uses ' + req.join(', ') + '.', { celda: x.hoja + '!' + x.dir });
    }
    return true;
  };
  /* La fórmula contiene un texto (por ejemplo, una referencia absoluta) */
  T.contiene = (p, X) => {
    const lista = [].concat(p.texto).map((s) => String(s).toUpperCase().replace(/\s+/g, ''));
    for (const x of X.celdas(p.r)) {
      const f = (X.L.formula(hojaReal(X.L, x.hoja), x.dir) || '').toUpperCase().replace(/\s+/g, '').replace(/_XLFN\./g, '');
      const ok = p.alguna ? lista.some((t) => f.includes(t)) : lista.every((t) => f.includes(t));
      if (!ok) return plantilla(p.msg || 'Revisa la fórmula de {celda}.', { celda: x.hoja + '!' + x.dir });
    }
    return true;
  };
  /* Al cambiar los datos de entrada, las fórmulas siguen dando el resultado correcto */
  const conEstructuradas = (L) => {
    if (L._estructuradas == null) L._estructuradas = L.hojas.some((h) => Array.from(h.celdas.values()).some((c) => c.f && /\[/.test(String(c.f).replace(/"(?:[^"]|"")*"/g, ''))));
    return L._estructuradas;
  };
  T.robustez = (p, X) => {
    if (conEstructuradas(X.L)) return { ok: true, nota: 'Tu libro usa referencias estructuradas de tabla: la prueba de cambios se hace en Excel (cambia un dato y revisa que todo se actualice).' };
    const conjuntos = Array.isArray(p.cambios) ? p.cambios : [p.cambios];
    for (const cambios of conjuntos) {
      const sobre = X.expandir(cambios);
      const hu = X.motor(sobre);
      const hs = X.motor(fusionar(X.expandir(X.solucion || {}), sobre));
      try {
        for (const x of X.celdas(p.r)) {
          const obt = X.leer(hu, x), esp = X.leer(hs, x);
          if (obt && (obt.tipo === 'NAME' || obt.tipo === 'ERROR' || obt.tipo === 'REF') && !(esp && esp.tipo === obt.tipo)) return { ok: true, nota: 'No se pudo recalcular ' + x.dir + ' en el navegador (usa una función que el motor no conoce); revísalo a mano.' };
          if (!iguales(obt, esp, p.tol)) return plantilla(p.msg || 'Al cambiar los datos de entrada, {celda} no se actualiza bien (muestra {obtenido} y debería mostrar {esperado}): ¿fijaste las referencias con $?', { celda: x.hoja + '!' + x.dir, obtenido: mostrar(obt), esperado: mostrar(esp) });
        }
      } finally { hu.destroy(); hs.destroy(); }
    }
    return true;
  };
  /* Valores escritos (sin fórmula): pegado especial, relleno, captura */
  T.sinFormula = (p, X) => {
    for (const x of X.celdas(p.r)) { const c = X.L.celda(hojaReal(X.L, x.hoja), x.dir); if (c && c.f != null) return plantilla(p.msg || '{celda} debe ser un valor (no una fórmula): usa Pegado especial › Valores.', { celda: x.hoja + '!' + x.dir }); }
    return true;
  };
  /* Vista y zoom de una hoja */
  T.vista = (p, X) => {
    const h = hojaReal(X.L, p.h);
    if (p.vista && h.vista !== p.vista) return p.msg || 'Cambia la vista de «' + h.nombre + '» a ' + ({ pageLayout: 'Diseño de página', pageBreakPreview: 'Ver salto de página', normal: 'Normal' }[p.vista] || p.vista) + '.';
    if (p.zoom && h.zoom !== p.zoom) return p.msg || 'Cambia el zoom de «' + h.nombre + '» a ' + p.zoom + ' %.';
    if (p.sinCuadricula && !h.sinCuadricula) return p.msg || 'Oculta las líneas de cuadrícula de «' + h.nombre + '» (Vista › Líneas de cuadrícula).';
    return true;
  };
  /* Formato de número */
  T.fmt = (p, X) => {
    for (const x of X.celdas(p.r)) {
      const e = X.L.estilo(hojaReal(X.L, x.hoja), x.dir);
      if (!formatoOk(e.numFmt, p.tipo, p.patron)) return plantilla(p.msg || '{celda} necesita ' + (NOMBRE_FMT[p.tipo] || 'otro formato de número') + ' (tiene «{formato}»).', { celda: x.hoja + '!' + x.dir, formato: e.numFmt });
    }
    return true;
  };
  /* Estilo de celda: negrita, relleno, bordes, ajustar, centrado, desbloqueada… */
  T.estilo = (p, X) => {
    const props = [].concat(p.prop);
    for (const x of X.celdas(p.r)) {
      const e = X.L.estilo(hojaReal(X.L, x.hoja), x.dir);
      for (const pr of props) if (!ESTILO[pr](e)) return plantilla(p.msg || '{celda} necesita ' + NOMBRE_ESTILO[pr] + '.', { celda: x.hoja + '!' + x.dir });
      if (p.tamMin && !((e.tamano || 11) >= p.tamMin)) return plantilla(p.msg || '{celda} debe tener una fuente de al menos ' + p.tamMin + ' puntos.', { celda: x.hoja + '!' + x.dir });
    }
    return true;
  };
  T.ancho = (p, X) => { const h = hojaReal(X.L, p.h); for (const col of [].concat(p.col)) if (!((h.anchos[col] || 8.43) >= p.min)) return p.msg || 'Ensancha la columna ' + col + ' de la hoja ' + h.nombre + ' para que se lea completa.'; return true; };
  T.combinadas = (p, X) => { const h = hojaReal(X.L, p.h); return h.combinadas.some((c) => A_cubre(c, p.r)) ? true : p.msg || 'Combina y centra ' + p.r + ' en la hoja ' + h.nombre + '.'; };
  function A_cubre(sqref, ref) {
    const obj = R.parseRango(String(ref).replace(/\$/g, ''));
    return String(sqref || '').split(/\s+/).some((s) => { const g = R.parseRango(s.replace(/\$/g, '')); return g && obj && g.r1 <= obj.r1 && g.c1 <= obj.c1 && g.r2 >= obj.r2 && g.c2 >= obj.c2; });
  }
  /* Hojas */
  T.hoja = (p, X) => {
    for (const n of [].concat(p.h)) if (!X.L.hoja(n)) return p.msg || 'Falta la hoja «' + n + '» (revisa que el nombre esté escrito igual).';
    if (p.colorPestana && !X.L.hoja([].concat(p.h)[0]).colorPestana) return p.msg || 'Da color a la pestaña de la hoja «' + p.h + '».';
    if (p.antesDe) { const i = X.L.hojas.indexOf(X.L.hoja([].concat(p.h)[0])), j = X.L.hojas.indexOf(X.L.hoja(p.antesDe)); if (j >= 0 && i > j) return p.msg || 'Mueve la hoja «' + p.h + '» antes de «' + p.antesDe + '».'; }
    return true;
  };
  T.hojaOculta = (p, X) => (hojaReal(X.L, p.h).estado !== 'visible' ? true : p.msg || 'Oculta la hoja «' + p.h + '».');
  T.inmovilizada = (p, X) => {
    const h = hojaReal(X.L, p.h);
    if (!h.inmovilizada) return p.msg || 'Inmoviliza los encabezados de la hoja «' + h.nombre + '» (Vista › Inmovilizar).';
    if (p.filas != null && h.panel.y !== p.filas) return p.msg || 'Inmoviliza exactamente ' + p.filas + ' fila(s) en «' + h.nombre + '».';
    if (p.cols != null && h.panel.x !== p.cols) return p.msg || 'Inmoviliza exactamente ' + p.cols + ' columna(s) en «' + h.nombre + '».';
    return true;
  };
  /* Nombres definidos */
  T.nombre = (p, X) => {
    const n = X.L.nombre(p.n);
    if (!n) return p.msg || 'Define el nombre «' + p.n + '» (Fórmulas › Asignar nombre o cuadro de nombres).';
    if (p.ref && !new RegExp(p.ref.replace(/\$/g, '\\$?').replace(/!/g, '!') + '$', 'i').test(n.ref.replace(/'/g, ''))) return p.msg || 'El nombre «' + p.n + '» debe referirse a ' + p.ref + ' (ahora apunta a ' + n.ref + ').';
    return true;
  };
  /* Orden de un rango */
  T.orden = (p, X) => {
    const h = hojaReal(X.L, p.h);
    const claves = [].concat(p.claves);
    let ant = null;
    for (let r = p.desde; r <= p.hasta; r++) {
      const fila = claves.map((k) => { const v = X.L.valor(h, k.col + r); return typeof v === 'string' ? v.toLowerCase() : v; });
      if (ant) {
        for (let i = 0; i < claves.length; i++) {
          const a = ant[i], b = fila[i], desc = claves[i].desc;
          if (a === b) continue;
          const cmp = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'es');
          if ((desc ? -cmp : cmp) > 0) return p.msg || 'Los datos de «' + h.nombre + '» no están ordenados como se pide (revisa la fila ' + r + ').';
          break;
        }
      }
      ant = fila;
    }
    return true;
  };
  /* Número de registros con contenido en una columna (por ejemplo, tras quitar duplicados) */
  T.registros = (p, X) => {
    const h = hojaReal(X.L, p.h);
    let n = 0;
    const vistos = new Set();
    for (let r = p.desde; r <= (p.hasta || 2000); r++) {
      const v = X.L.valor(h, p.col + r);
      if (v == null || v === '') { if (!p.hasta) break; continue; }
      if (p.unicos) { const k = String(v).trim().toLowerCase(); if (vistos.has(k)) return p.msg || 'El valor «' + v + '» está repetido en la columna ' + p.col + '.'; vistos.add(k); }
      n++;
    }
    if (p.n != null && n !== p.n) return plantilla(p.msgN || p.msg || 'Deben quedar {esperado} registros en «' + h.nombre + '» (hay {obtenido}).', { esperado: p.n, obtenido: n });
    return true;
  };
  T.filtro = (p, X) => { const h = hojaReal(X.L, p.h); if (!h.autoFiltro && !h.tablas.length) return p.msg || 'Activa el filtro en la hoja «' + h.nombre + '» (Datos › Filtro).'; if (p.activo && !(h.autoFiltro && h.autoFiltro.columnasFiltradas)) return p.msg || 'Aplica el filtro que se pide en «' + h.nombre + '».'; return true; };
  /* Tablas de Excel */
  T.tabla = (p, X) => {
    const ts = X.L.tablas.filter((t) => (!p.h || t.hoja.toLowerCase() === String(p.h).toLowerCase()));
    const t = p.nombre ? ts.find((x) => x.nombre.toLowerCase() === p.nombre.toLowerCase()) : ts[0];
    if (!t) return p.msg || (p.nombre ? 'Convierte los datos en una tabla llamada «' + p.nombre + '» (Insertar › Tabla y Diseño de tabla › Nombre de la tabla).' : 'Convierte los datos en una tabla (Insertar › Tabla).');
    for (const col of p.columnas || []) if (!t.columnas.some((c) => c.nombre.toLowerCase() === col.toLowerCase())) return p.msg || 'La tabla ' + t.nombre + ' necesita la columna «' + col + '».';
    for (const [col, palabras] of Object.entries(p.calculadas || {})) {
      const c = t.columnas.find((x) => x.nombre.toLowerCase() === col.toLowerCase());
      if (!c || !c.formulaCalculada) return p.msg || '«' + col + '» debe ser una columna calculada (escribe la fórmula en la primera fila de la tabla).';
      for (const w of [].concat(palabras)) if (!new RegExp(w, 'i').test(c.formulaCalculada)) return p.msg || 'Revisa la fórmula de la columna calculada «' + col + '» (' + c.formulaCalculada + ').';
    }
    if (p.totales && !t.filaTotales) return p.msg || 'Activa la fila de totales de la tabla ' + t.nombre + '.';
    if (p.estilo && !t.estilo) return p.msg || 'Aplica un estilo a la tabla ' + t.nombre + '.';
    if (p.filas != null) { const rg = R.parseRango(t.ref); const n = rg.r2 - rg.r1 - (t.filaTotales ? 1 : 0); if (n < p.filas) return p.msg || 'La tabla ' + t.nombre + ' debe incluir ' + p.filas + ' registros (tiene ' + n + ').'; }
    return true;
  };
  /* Gráficos */
  T.grafico = (p, X) => {
    let gs = X.L.graficos.filter((g) => !p.h || g.hoja.toLowerCase() === String(p.h).toLowerCase());
    if (p.dinamico) gs = gs.filter((g) => g.dinamico);
    const nombres = { columnas: 'columnas', barras: 'barras', lineas: 'líneas', circular: 'circular', anillo: 'anillo', area: 'área', dispersion: 'dispersión' };
    const conTipo = p.tipos ? gs.filter((g) => g.tipos.some((t) => p.tipos.includes(t))) : gs;
    if ((p.min || 1) > conTipo.length) return p.msg || (gs.length && p.tipos ? 'El gráfico debe ser de tipo ' + p.tipos.map((t) => nombres[t] || t).join(' o ') + '.' : 'Falta ' + (p.dinamico ? 'el gráfico dinámico' : 'el gráfico') + (p.tipos ? ' de ' + p.tipos.map((t) => nombres[t] || t).join(' o ') : '') + (p.h ? ' en la hoja «' + p.h + '»' : '') + '.');
    const g = conTipo[0];
    if (p.conTitulo && !g.tieneTitulo) return p.msg || 'Agrega un título al gráfico.';
    if (p.tituloPatron && !new RegExp(p.tituloPatron, 'i').test(g.titulo)) return p.msg || 'El título del gráfico debe describir lo que muestra.';
    if (p.series && g.series < p.series) return p.msg || 'El gráfico debe mostrar ' + p.series + ' series (tiene ' + g.series + ').';
    if (p.combinado && new Set(g.tipos).size < 2) return p.msg || 'Combina dos tipos de gráfico (por ejemplo, columnas y una línea).';
    if (p.ejesTitulo && !g.ejes.some((e) => e.conTitulo)) return p.msg || 'Agrega títulos a los ejes.';
    return true;
  };
  /* Tablas dinámicas */
  T.dinamica = (p, X) => {
    const ds = X.L.dinamicas.filter((d) => !p.h || d.hoja.toLowerCase() === String(p.h).toLowerCase());
    if (!ds.length) return p.msg || 'Falta la tabla dinámica' + (p.h ? ' en la hoja «' + p.h + '»' : '') + ' (Insertar › Tabla dinámica).';
    const tiene = (lista, n) => lista.some((x) => new RegExp('^' + n, 'i').test(x.nombre) || new RegExp(n, 'i').test(x.campo || ''));
    const cand = ds.filter((d) => (p.filas || []).every((n) => tiene(d.filas, n)) && (p.columnas || []).every((n) => tiene(d.columnas, n)) && (p.filtros || []).every((n) => tiene(d.filtros, n)) && (p.valores || []).every((n) => d.valores.some((v) => new RegExp(n, 'i').test(v.campo) || new RegExp(n, 'i').test(v.nombre))));
    if (!cand.length) {
      const d = ds[0];
      const faltan = [];
      for (const n of p.filas || []) if (!tiene(d.filas, n)) faltan.push(n + ' en Filas');
      for (const n of p.columnas || []) if (!tiene(d.columnas, n)) faltan.push(n + ' en Columnas');
      for (const n of p.filtros || []) if (!tiene(d.filtros, n)) faltan.push(n + ' en Filtros');
      for (const n of p.valores || []) if (!d.valores.some((v) => new RegExp(n, 'i').test(v.campo) || new RegExp(n, 'i').test(v.nombre))) faltan.push(n + ' en Valores');
      return p.msg || 'A la tabla dinámica le falta: ' + faltan.join(', ') + '.';
    }
    const d = cand[0];
    if (p.funcion && !d.valores.some((v) => v.funcion === p.funcion)) return p.msg || 'Resume los valores con «' + ({ sum: 'Suma', count: 'Cuenta', average: 'Promedio', max: 'Máx.', min: 'Mín.' }[p.funcion] || p.funcion) + '» (Configuración de campo de valor).';
    if (p.mostrarComo && !d.valores.some((v) => v.mostrarComo)) return p.msg || 'Muestra los valores como porcentaje (Configuración de campo de valor › Mostrar valores como).';
    if (p.agrupada && !d.agrupaciones.length && !d.filas.some((f) => f.agruparPor)) return p.msg || 'Agrupa las fechas (clic derecho › Agrupar).';
    return true;
  };
  T.segmentacion = (p, X) => (X.L.segmentaciones.some((s) => !p.campo || new RegExp(p.campo, 'i').test(s.campo || s.nombre)) ? true : p.msg || 'Agrega una segmentación de datos' + (p.campo ? ' por ' + p.campo : '') + ' (Insertar › Segmentación de datos).');
  T.escalaTiempo = (p, X) => (X.L.escalasTiempo.length ? true : p.msg || 'Agrega una escala de tiempo (Insertar › Escala de tiempo).');
  /* Formato condicional */
  T.condicional = (p, X) => {
    const h = hojaReal(X.L, p.h);
    const reglas = h.condicionales.filter((c) => !p.r || A_cubre(c.sqref, p.r) || (p.parcial && String(c.sqref).split(/\s+/).some((s) => { const g = R.parseRango(s); const o = R.parseRango(String(p.r).split(':')[0]); return g && o && g.c1 <= o.c1 && g.c2 >= o.c1; })));
    if (!reglas.length) return p.msg || 'Agrega una regla de formato condicional que cubra ' + p.r + ' en «' + h.nombre + '».';
    const tipos = [].concat(p.tipo || []);
    const ok = reglas.filter((c) => (!tipos.length || tipos.includes(c.tipo)) && (!p.contiene || (c.formulas || []).concat([c.texto || '']).some((f) => new RegExp(p.contiene, 'i').test(f))) && (!p.operador || c.operador === p.operador) && (!p.relleno || (c.dxf && c.dxf.relleno && c.dxf.relleno.tipo !== 'none') || c.tipo === 'iconSet' || c.tipo === 'dataBar' || c.tipo === 'colorScale'));
    if (!ok.length) return p.msg || 'Revisa la regla de formato condicional de ' + p.r + ' en «' + h.nombre + '».';
    if (p.min && ok.length < p.min) return p.msg || 'Se necesitan al menos ' + p.min + ' reglas de formato condicional en ' + p.r + '.';
    return true;
  };
  /* Validación de datos */
  T.validacion = (p, X) => {
    const h = hojaReal(X.L, p.h);
    const v = h.validaciones.find((x) => A_cubre(x.sqref, p.r) && (!p.tipo || x.tipo === p.tipo));
    if (!v) return p.msg || 'Agrega una validación de datos' + ({ list: ' de tipo Lista', whole: ' de número entero', decimal: ' de número decimal', date: ' de fecha', textLength: ' de longitud de texto', custom: ' personalizada' }[p.tipo] || '') + ' que cubra ' + p.r + ' en «' + h.nombre + '».';
    if (p.contiene) { const lista = [].concat(p.contiene); const src = v.formula1 || ''; const esRef = /[A-Za-z]+\$?\d|^=?[A-Za-zÀ-ɏ_][\w.]*$/.test(src.replace(/"[^"]*"/g, '')); if (!esRef && !lista.every((w) => new RegExp(w, 'i').test(src))) return p.msg || 'La lista debe ofrecer: ' + lista.join(', ') + '.'; }
    if (p.origen && !new RegExp(p.origen, 'i').test(v.formula1 || '')) return p.msg || 'La lista de ' + p.r + ' debe tomar sus valores de ' + (p.origenTexto || p.origen) + ' (Origen: =' + (p.origenTexto || p.origen) + ').';
    if (p.formula && !new RegExp(p.formula, 'i').test(v.formula1 || '')) return p.msg || 'Revisa la fórmula de la validación personalizada de ' + p.r + ' (ahora dice ' + (v.formula1 || 'nada') + ').';
    if (p.min != null && +v.formula1 !== p.min) return p.msg || 'El mínimo permitido en ' + p.r + ' debe ser ' + p.min + '.';
    if (p.max != null && +(v.formula2 || v.formula1) !== p.max) return p.msg || 'El máximo permitido en ' + p.r + ' debe ser ' + p.max + '.';
    if (p.mensajeError && !v.mensajeError) return p.msg || 'Escribe un mensaje de error para la validación de ' + p.r + ' (pestaña «Mensaje de error»).';
    return true;
  };
  /* Revisar y proteger */
  T.comentarios = (p, X) => { const n = X.L.hojas.filter((h) => !p.h || h.nombre.toLowerCase() === String(p.h).toLowerCase()).reduce((s, h) => s + h.comentarios.filter((c) => !p.respuestas || c.padre).length, 0); return n >= (p.min || 1) ? true : p.msg || (p.respuestas ? 'Responde al menos ' + (p.min || 1) + ' comentario(s) (botón Responder del hilo).' : 'Agrega al menos ' + (p.min || 1) + ' comentario(s) (Revisar › Nuevo comentario).'); };
  T.notas = (p, X) => { const n = X.L.hojas.filter((h) => !p.h || h.nombre.toLowerCase() === String(p.h).toLowerCase()).reduce((s, h) => s + h.notas.length, 0); return n >= (p.min || 1) ? true : p.msg || 'Agrega al menos ' + (p.min || 1) + ' nota(s) (Revisar › Notas › Nueva nota).'; };
  T.protegida = (p, X) => (hojaReal(X.L, p.h).protegida ? true : p.msg || 'Protege la hoja «' + p.h + '» (Revisar › Proteger hoja).');
  T.libroProtegido = (p, X) => (X.L.proteccionLibro ? true : p.msg || 'Protege la estructura del libro (Revisar › Proteger libro).');
  /* Impresión y PDF */
  T.impresion = (p, X) => {
    const h = hojaReal(X.L, p.h);
    if (p.orientacion && h.pagina.orientacion !== p.orientacion) return p.msg || 'Cambia la orientación de «' + h.nombre + '» a ' + (p.orientacion === 'landscape' ? 'horizontal' : 'vertical') + '.';
    if (p.ajustarAncho && !(h.ajustarAPagina && h.pagina.ancho === 1)) return p.msg || 'Ajusta «' + h.nombre + '» a 1 página de ancho (Diseño de página › Ajustar área de impresión).';
    if (p.unaPagina && !(h.ajustarAPagina && h.pagina.ancho === 1 && h.pagina.alto === 1)) return p.msg || 'Ajusta «' + h.nombre + '» para que quepa en una página.';
    if (p.area && !X.L.areaImpresion(h)) return p.msg || 'Establece el área de impresión de «' + h.nombre + '».';
    if (p.areaRef && !(X.L.areaImpresion(h) || '').replace(/\$/g, '').toUpperCase().includes(p.areaRef.toUpperCase())) return p.msg || 'El área de impresión de «' + h.nombre + '» debe ser ' + p.areaRef + '.';
    if (p.titulos && !X.L.titulosImpresion(h)) return p.msg || 'Repite los encabezados en cada página (Diseño de página › Imprimir títulos).';
    if (p.encabezado && !h.encabezado) return p.msg || 'Agrega un encabezado de página a «' + h.nombre + '».';
    if (p.pie && !h.pie) return p.msg || 'Agrega un pie de página a «' + h.nombre + '» (por ejemplo, el número de página).';
    if (p.numeroPagina && !/&P/.test(h.pie + h.encabezado)) return p.msg || 'Agrega el número de página en el encabezado o pie.';
    if (p.centrado && !h.opcionesImpresion.centradoH) return p.msg || 'Centra la hoja horizontalmente en la página (Configurar página › Márgenes).';
    return true;
  };
  T.pdf = (p, X) => {
    if (!X.L.pdf) return p.msg || 'Sube también el PDF (selecciona el libro y el PDF a la vez).';
    if (!X.L.pdf.valido) return 'El archivo PDF no es válido.';
    if (p.max && X.L.pdf.paginas > p.max) return p.msg || 'El PDF tiene ' + X.L.pdf.paginas + ' páginas: ajústalo a ' + p.max + '.';
    return true;
  };
  /* Objetos */
  T.imagen = (p, X) => { const h = hojaReal(X.L, p.h); return h.dibujo.imagenes.length + h.dibujo.iconos.length >= (p.min || 1) ? true : p.msg || 'Inserta una imagen en «' + h.nombre + '» (Insertar › Imágenes).'; };
  T.forma = (p, X) => { const h = hojaReal(X.L, p.h); const fs = h.dibujo.formas.concat(h.dibujo.cuadrosTexto); return fs.some((f) => !p.texto || new RegExp(p.texto, 'i').test(f.texto)) ? true : p.msg || 'Inserta una forma o cuadro de texto' + (p.texto ? ' con el texto pedido' : '') + ' en «' + h.nombre + '».'; };
  T.hipervinculo = (p, X) => { const h = hojaReal(X.L, p.h); return h.hipervinculos.some((v) => (!p.destino || new RegExp(p.destino, 'i').test(v.destino || '')) && (!p.r || A_cubre(v.ref, p.r))) ? true : p.msg || 'Inserta el hipervínculo pedido en «' + h.nombre + '» (Insertar › Vínculo).'; };
  T.minigraficos = (p, X) => { const h = hojaReal(X.L, p.h); const n = h.minigraficos.reduce((s, g) => s + g.cantidad, 0); return n >= (p.min || 1) ? true : p.msg || 'Inserta minigráficos en «' + h.nombre + '» (Insertar › Minigráficos).'; };
  T.escenarios = (p, X) => { const h = hojaReal(X.L, p.h); return h.escenarios.length >= (p.min || 1) ? true : p.msg || 'Crea al menos ' + (p.min || 1) + ' escenarios en «' + h.nombre + '» (Datos › Análisis de hipótesis › Administrador de escenarios).'; };
  T.tablaDatos = (p, X) => { const h = hojaReal(X.L, p.h); return h.tablasDatos.length ? true : p.msg || 'Crea una tabla de datos en «' + h.nombre + '» (Datos › Análisis de hipótesis › Tabla de datos).'; };
  T.propiedad = (p, X) => (new RegExp(p.patron, 'i').test(X.L.propiedades[p.campo] || '') ? true : p.msg || 'Completa la propiedad del documento (Archivo › Información › Propiedades).');
  /* Macros y Power Query */
  T.macro = (p, X) => {
    if (!X.L.habilitadoMacros || !X.L.tieneVBA) return p.msg || 'Guarda el libro como «Libro de Excel habilitado para macros» (.xlsm) con tu macro.';
    if (p.boton && !X.L.hojas.some((h) => h.controles.some((c) => c.macro) || h.dibujo.conMacro.length)) return p.msg || 'Asigna la macro a un botón o a una forma (clic derecho › Asignar macro).';
    return true;
  };
  T.consulta = (p, X) => {
    const L = X.L;
    const hay = L.consultas.some((c) => c.mashup) || L.tieneMashup || L.nombresConsultas.length;
    if (!hay) return p.msg || 'No encontré consultas de Power Query: impórtalas con Datos › Obtener datos (no copies y pegues los datos).';
    if (p.min && Math.max(L.nombresConsultas.length, L.consultas.filter((c) => c.mashup).length) < p.min) return p.msg || 'Se esperan al menos ' + p.min + ' consultas (tienes ' + L.nombresConsultas.length + ').';
    for (const paso of p.pasos || []) if (L.codigoM && !new RegExp(paso.patron, 'i').test(L.codigoM)) return paso.msg;
    if (p.cargada && !L.tablasConsulta.length && !L.archivos.some((a) => /^xl\/queryTables\//.test(a))) return p.msg || 'Carga el resultado de la consulta en una hoja (Cerrar y cargar en › Tabla).';
    return true;
  };
  /* Documento de Word (combinar correspondencia) */
  T.docx = (p, X) => {
    const d = X.L.docx;
    if (!d) return p.msg || 'Sube también el documento de Word (.docx).';
    for (const c of p.campos || []) if (!d.campos.some((x) => x.toLowerCase() === c.toLowerCase())) return p.msg || 'Falta el campo combinado «' + c + '» (Correspondencia › Insertar campo combinado).';
    if (p.origen && !d.origenDatos) return p.msg || 'Conecta el documento con la lista de Excel (Correspondencia › Seleccionar destinatarios › Usar una lista existente).';
    return true;
  };
  /* Prueba escrita a mano: (L, A, X) => true | 'mensaje' */
  T.js = (p, X) => {
    const fn = typeof p.fn === 'function' ? p.fn : new Function('L', 'A', 'X', 'return (' + p.fn + ')(L, A, X);'); // eslint-disable-line no-new-func
    return fn(X.L, X.A, X);
  };

  /* Convierte pruebas declarativas en pruebas para LT.xlsx.revisar */
  function compilar(pruebas, spec) {
    spec = spec || {};
    return (pruebas || []).map((p) => ({
      titulo: p.titulo, nivel: p.nivel, exito: p.exito,
      fn: (L, A) => {
        const X = contexto(L, A, spec);
        X.solucion = spec.sol;
        try {
          const f = T[p.t];
          if (!f) return 'Prueba desconocida: ' + p.t;
          return f(p, X);
        } finally { X.cerrar(); }
      },
    }));
  }

  /* Revisa un libro ya leído con un conjunto {sol, pruebas, hoja}; devuelve resultados */
  function revisarConjunto(L, conjunto, nivel) {
    return LT.xlsx.revisar(L, compilar(conjunto.pruebas, conjunto), nivel);
  }

  LT.revision = { compilar, revisarConjunto, motor, expandir, iguales, celdas, TIPOS: T };
})();
