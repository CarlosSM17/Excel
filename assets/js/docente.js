/* Área docente (versión 2). El contenido (guía teórica, plan de sesiones y libros de
   solución) está cifrado con AES-GCM; la llave se deriva de la contraseña con PBKDF2-SHA256
   en el navegador (WebCrypto). Nada se envía a ningún servidor.
   Archivos: docente/contenido.js y docente/archivos/*.js, generados por
   herramientas/proteger_docente.py a partir de la carpeta privada. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const C = LT.CURSO;
  const P = LT.pagina;
  const NIVEL_TXT = { explorador: 'Explorador', analista: 'Analista', experto: 'Experto' };
  const SESION = 'laTaza3.docente.';
  const TIPOS = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

  /* ------------------------------------------------------- criptografía */
  const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const aB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  async function derivar(clave, sal, iter) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iter }, base, 256));
  }
  async function descifrar(raw, obj) {
    const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(obj.iv) }, k, deB64(obj.datos)));
  }
  const ses = {
    leer() { try { return sessionStorage.getItem(SESION + window.LT_DOCENTE_CIFRADO.sal); } catch (e) { return null; } },
    guardar(v) { try { sessionStorage.setItem(SESION + window.LT_DOCENTE_CIFRADO.sal, v); } catch (e) { /* sin almacenamiento */ } },
    borrar() { try { Object.keys(sessionStorage).filter((k) => k.startsWith(SESION)).forEach((k) => sessionStorage.removeItem(k)); } catch (e) { /* nada */ } },
  };

  let llave = null;
  let contenido = null;

  async function abrir(raw) {
    const datos = await descifrar(raw, window.LT_DOCENTE_CIFRADO);
    contenido = JSON.parse(new TextDecoder().decode(datos));
    llave = raw;
  }
  function cargarScript(src) {
    return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se encontró ' + src)); document.head.appendChild(s); });
  }
  async function descargarSolucion(a) {
    const almacen = (window.LT_DOCENTE_ARCHIVOS = window.LT_DOCENTE_ARCHIVOS || {});
    if (!almacen[a.nombre]) await cargarScript(a.js);
    const datos = await descifrar(llave, almacen[a.nombre]);
    const ext = a.nombre.split('.').pop().toLowerCase();
    LT.u.descargar(a.nombre, new Blob([datos], { type: TIPOS[ext] || 'application/octet-stream' }));
  }

  /* ------------------------------------------------------------ inicio */
  function iniciar() {
    const main = h('main', { class: 'contenedor docente' });
    P.montar(main);
    if (!window.LT_DOCENTE_CIFRADO) { main.appendChild(aviso('Falta el contenido del área docente', 'No se encontró docente/contenido.js. Genera el contenido con: python herramientas/proteger_docente.py')); return; }
    if (!window.crypto || !crypto.subtle) { main.appendChild(aviso('Este navegador no puede abrir el área docente', 'El descifrado necesita una conexión segura (https) o abrir el archivo local en Chrome, Edge o Firefox actualizados.')); return; }
    const guardada = ses.leer();
    if (guardada) abrir(deB64(guardada)).then(() => panel(main)).catch(() => { ses.borrar(); acceso(main); });
    else acceso(main);
  }
  function aviso(titulo, texto) { return h('section', { class: 'seccion' }, h('h1', null, titulo), h('p', { class: 'intro' }, texto)); }

  function acceso(main) {
    main.innerHTML = '';
    const clave = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña docente', 'aria-label': 'Contraseña docente' });
    const msj = h('div', { class: 'retro', 'aria-live': 'polite' });
    const btn = h('button', { class: 'btn primario', type: 'submit' }, LT.icono('usuario', 16), 'Entrar');
    const form = h('form', { class: 'acceso-docente tarjeta' },
      h('div', { class: 'acceso-icono', html: LT.iconoSVG('taza', 54) }),
      h('h1', null, 'Área docente'),
      h('p', null, 'Plan de sesiones minuto a minuto, guía teórica de referencia, soluciones, libros resueltos y consolidación de reportes del grupo.'),
      h('label', null, 'Contraseña'), clave, btn, msj,
      h('p', { class: 'acceso-nota' }, 'El contenido se descifra en este navegador; la contraseña no se envía a ningún servidor. La sesión se cierra al cerrar la pestaña.'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!clave.value) { clave.focus(); return; }
      btn.disabled = true;
      msj.textContent = 'Verificando…';
      try {
        const c = window.LT_DOCENTE_CIFRADO;
        const raw = await derivar(clave.value, deB64(c.sal), c.iter);
        await abrir(raw);
        ses.guardar(aB64(raw));
        panel(main);
      } catch (er) {
        msj.innerHTML = '';
        msj.appendChild(h('div', { class: 'aviso-caja error' }, 'Contraseña incorrecta.'));
        btn.disabled = false;
        clave.select();
      }
    });
    main.append(form, h('p', { style: { textAlign: 'center', margin: '18px 0 40px' } }, h('a', { href: P.url('index.html') }, '← Volver al curso')));
    setTimeout(() => clave.focus(), 50);
  }

  /* ------------------------------------------------------------- panel */
  const PESTANAS = [
    ['plan', 'Plan de sesiones', plan],
    ['guia', 'Guía teórica', guia],
    ['retos', 'Soluciones de retos', soluciones],
    ['tareas', 'Tareas y proyectos', tareasProyectos],
    ['libros', 'Libros de solución', libros],
    ['reportes', 'Reportes del grupo', reportes],
    ['tecnico', 'Notas técnicas', tecnico],
  ];
  function panel(main) {
    main.innerHTML = '';
    const actual = (location.hash.slice(1) && PESTANAS.find((p) => p[0] === location.hash.slice(1))) ? location.hash.slice(1) : 'plan';
    const cuerpo = h('div', { class: 'docente-cuerpo' });
    const tabs = h('div', { class: 'tabs docente-tabs no-imprimir', role: 'tablist' });
    const mostrar = (id) => {
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
      cuerpo.innerHTML = '';
      const p = PESTANAS.find((x) => x[0] === id);
      p[2](cuerpo);
      if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    };
    for (const [id, txt] of PESTANAS) tabs.appendChild(h('button', { class: 'tab', role: 'tab', 'data-id': id, onclick: () => mostrar(id) }, txt));
    main.append(
      h('section', { class: 'seccion docente-cab no-imprimir' },
        h('div', null, h('div', { class: 'etiqueta-etapa' }, 'Área docente'), h('h1', null, 'Excel con La Taza · ' + C.formato), h('p', { class: 'intro' }, 'Contenido generado el ' + new Date(contenido.generado).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '.')),
        h('button', { class: 'btn chico fantasma', onclick: () => { ses.borrar(); llave = null; contenido = null; location.hash = ''; acceso(main); } }, 'Cerrar sesión')),
      tabs, cuerpo);
    mostrar(actual);
  }

  /* ---------------------------------------------------- plan de sesiones */
  const aMin = (hhmm) => { const [a, b] = hhmm.split(':').map(Number); return a * 60 + b; };
  const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  function plan(cont) {
    const PL = contenido.plan;
    cont.appendChild(h('div', { class: 'grupo-btn no-imprimir', style: { margin: '6px 0 14px' } }, h('button', { class: 'btn chico', onclick: () => window.print() }, 'Imprimir el plan'),
      h('span', { class: 'chip' }, 'Horas relativas al inicio de cada sesión (0:00)')));
    cont.appendChild(h('div', { class: 'ruta-sesiones' }, C.SESIONES.map((s) => { const nv = C.nivel(s.nivel); return h('a', { class: 'sesion-tarjeta compacta', href: '#plan-s' + s.n, style: { borderTopColor: nv.color }, onclick: (e) => { e.preventDefault(); document.getElementById('plan-s' + s.n).scrollIntoView({ behavior: 'smooth' }); } }, h('b', null, 'Sesión ' + s.n + ' · ' + nv.nombre), h('span', null, s.modulos.length + ' módulos · proyecto ' + nv.nombre)); })));
    for (const s of C.SESIONES) {
      const nv = C.nivel(s.nivel);
      const info = PL.sesiones[s.n] || {};
      const t = h('table', { class: 'tabla-sitio plan-tabla' }, h('thead', null, h('tr', null, ['Hora', 'Etapa', 'El docente', 'El grupo', 'Evidencia'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      for (const it of C.agenda(s.n)) {
        if (it.tipo === 'proyecto') {
          const pr = C.proyecto(it.proyecto);
          tb.appendChild(h('tr', { class: 'plan-modulo' }, h('td', null, it.inicio + '–' + it.fin), h('td', { colspan: '4' }, h('a', { href: P.url('proyecto.html?p=' + it.proyecto) }, it.titulo), ' · ' + it.min + ' min · ' + (pr ? pr.titulo : ''))));
          tb.appendChild(h('tr', null, h('td', { class: 'hora' }, it.min + '′'), h('td', null, 'Proyecto'), h('td', { colspan: '3' }, info.proyecto || '')));
          continue;
        }
        if (it.tipo === 'bloque') {
          const txt = /arranque/i.test(it.titulo) ? info.arranque : /receso/i.test(it.titulo) ? info.receso : info.cierre;
          tb.appendChild(h('tr', { class: 'plan-bloque' }, h('td', null, it.inicio + '–' + it.fin), h('td', null, h('b', null, it.titulo)), h('td', { colspan: '3' }, txt || '')));
          continue;
        }
        const m = C.modulo(it.id);
        const pasos = (PL.modulos && PL.modulos[it.id]) || [];
        const suma = pasos.reduce((a, p) => a + p.min, 0);
        tb.appendChild(h('tr', { class: 'plan-modulo' }, h('td', null, it.inicio + '–' + it.fin), h('td', { colspan: '4' }, h('a', { href: P.urlModulo(it.id) }, it.titulo), ' · ' + it.min + ' min · ' + m.entorno, suma && suma !== it.min ? h('span', { class: 'chip pendiente', style: { marginLeft: '8px' } }, 'Los pasos suman ' + suma + ' min') : null)));
        let t0 = aMin(it.inicio);
        for (const p of pasos) {
          tb.appendChild(h('tr', null, h('td', { class: 'hora' }, hhmm(t0) + ' · ' + p.min + '′'), h('td', null, p.etapa), h('td', null, p.docente || '—'), h('td', null, p.grupo), h('td', null, p.evidencia || '')));
          t0 += p.min;
        }
      }
      t.appendChild(tb);
      cont.appendChild(h('section', { class: 'seccion plan-sesion', id: 'plan-s' + s.n },
        h('h2', null, 'Sesión ' + s.n + ' · Nivel ' + nv.nombre),
        info.objetivo ? h('p', { class: 'intro' }, info.objetivo) : null,
        info.antes && info.antes.length ? h('div', { class: 'tarjeta plan-lista' }, h('b', null, 'Antes de la sesión'), h('ul', null, info.antes.map((x) => h('li', null, x)))) : null,
        h('div', { class: 'tabla-scroll' }, t),
        info.despues && info.despues.length ? h('div', { class: 'tarjeta plan-lista' }, h('b', null, 'Después de la sesión'), h('ul', null, info.despues.map((x) => h('li', null, x)))) : null,
        h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'Trabajo autónomo: laboratorios pendientes, tareas de aprendizaje de los módulos ' + s.modulos[0] + ' a ' + s.modulos[s.modulos.length - 1] + ' (etapa 5) y, al cerrar el nivel, el proyecto «' + C.proyecto(nv.proyecto).titulo + '».')));
    }
  }

  /* ------------------------------------------------------- guía teórica */
  function guia(cont) {
    cont.appendChild(h('div', { class: 'grupo-btn no-imprimir', style: { margin: '6px 0 14px' } }, h('button', { class: 'btn chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF')));
    const div = h('div', { class: 'guia-teorica' });
    div.innerHTML = contenido.guiaTeorica; // contenido propio, generado desde la carpeta privada
    div.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = div.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } }));
    cont.appendChild(div);
  }

  /* -------------------------------------------------- soluciones de retos */
  function soluciones(cont) {
    cont.appendChild(h('p', { class: 'intro' }, 'Solución de referencia del reto principal de cada módulo, como la usa el verificador. Los retos que se resuelven con widgets (pantalla, objetos, gráficos, impresión, ordenar y filtrar, tablas dinámicas, Power Query, macros) no tienen fórmula de referencia: se resuelven con los pasos del nivel Explorador.'));
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.reto) continue;
      const r = def.reto;
      const det = h('details', { class: 'tarjeta', style: { marginBottom: '10px', padding: '12px 16px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Módulo ' + m.id + '. ' + m.titulo + ' — ' + (r.titulo || m.reto)));
      const base = r.base || {};
      const lista = (sol) => h('ul', null, Object.entries(sol).map(([k, v]) => h('li', null, h('code', null, k), ' → ', h('code', null, String(v)))));
      if (base.solucion && Object.keys(base.solucion).length) det.appendChild(h('div', null, h('p', null, h('b', null, 'Solución (nivel Analista):')), lista(base.solucion)));
      for (const [n, nv] of Object.entries(r.niveles || {})) if (nv.solucion) det.appendChild(h('div', null, h('p', null, h('b', null, 'Solución (nivel ' + NIVEL_TXT[n] + '):')), lista(nv.solucion)));
      if (base.pistas && base.pistas.length) det.appendChild(h('div', null, h('p', null, h('b', null, 'Paso exacto (última pista):')), h('p', { html: base.pistas[base.pistas.length - 1] })));
      const exp = r.niveles && r.niveles.explorador && r.niveles.explorador.instrucciones;
      if (exp) det.appendChild(h('div', null, h('p', null, h('b', null, 'Pasos del nivel Explorador:')), h('ol', null, exp.map((x) => h('li', { html: x })))));
      if (def.lab) det.appendChild(h('div', null, h('p', null, h('b', null, 'Laboratorio · qué revisa el verificador:')), h('ul', null, def.lab.pruebas.map((p) => h('li', null, p.titulo + (p.nivel ? ' (' + NIVEL_TXT[p.nivel] + ')' : ''))))));
      cont.appendChild(det);
    }
  }

  /* -------------------------------------------------- tareas y proyectos */
  function solLista(sol, nombres) {
    const filas = Object.entries(sol || {}).map(([k, v]) => h('li', null, h('code', null, k), ' → ', h('code', null, Array.isArray(v) ? (v.length + ' filas de valores') : String(v))));
    for (const [n, r] of Object.entries(nombres || {})) filas.push(h('li', null, 'Nombre ', h('code', null, n), ' = ', h('code', null, r)));
    return filas.length ? h('ul', null, filas) : h('p', { class: 'chico' }, 'Sin fórmulas de referencia: la tarea se resuelve con herramientas de Excel (ver la hoja «Solución» del libro resuelto).');
  }
  function tareasProyectos(cont) {
    const APOYO = { modelo: 'con modelo', completar: 'para completar', autonoma: 'autónoma' };
    cont.appendChild(h('p', { class: 'intro' }, 'Fórmulas de referencia (en inglés, como se guardan en el archivo) y criterios que revisa el verificador en cada tarea de aprendizaje y cada fase de proyecto. Lo esperado se calcula aplicando estas fórmulas a los datos del propio participante.'));
    cont.appendChild(h('h2', null, 'Proyectos'));
    for (const pr of C.PROYECTOS) {
      const D = (LT.PROYECTOS_DEF || {})[pr.id];
      if (!D) continue;
      const det = h('details', { class: 'tarjeta', style: { marginBottom: '10px', padding: '12px 16px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Proyecto ' + (pr.nivel ? C.nivel(pr.nivel).nombre : 'final') + ' — ' + pr.titulo));
      for (const f of D.fases) det.append(h('h4', null, f.id + ' · ' + f.titulo + ' (' + (f.modulos || []).map((x) => 'M' + x).join(', ') + ')'), solLista(f.sol, f.solNombres), h('p', { class: 'chico' }, 'Criterios: ' + f.pruebas.map((x) => x.titulo).join(' · ')));
      cont.appendChild(det);
    }
    cont.appendChild(h('h2', null, 'Tareas de aprendizaje'));
    for (const m of C.MODULOS) {
      const T = (LT.TAREAS || {})[m.id];
      if (!T) continue;
      const det = h('details', { class: 'tarjeta', style: { marginBottom: '10px', padding: '12px 16px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Módulo ' + m.id + '. ' + m.titulo + ' — ' + T.archivo));
      for (const t of T.tareas) det.append(h('h4', null, t.id + ' · ' + t.titulo + ' (' + APOYO[t.apoyo] + ', hoja ' + t.hoja + ')'), solLista(t.sol, t.solNombres), h('p', { class: 'chico' }, 'Criterios: ' + t.pruebas.map((x) => x.titulo).join(' · ')));
      cont.appendChild(det);
    }
  }

  /* -------------------------------------------------- libros de solución */
  function libros(cont) {
    const arch = contenido.archivos || [];
    const boton = (a) => { const b = h('button', { class: 'btn chico cafe' }, LT.icono('descargar', 14), a.nombre); b.addEventListener('click', async () => { b.disabled = true; try { await descargarSolucion(a); } catch (e) { LT.ui.toast('No se pudo descargar: ' + e.message, 'error'); } b.disabled = false; }); return b; };
    const solDe = (archivo) => arch.filter((a) => a.nombre.startsWith(archivo.replace(/\.(xlsx|xlsm|docx)$/, '') + '-solucion'));
    const t = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Módulo'), h('th', null, 'Libro del participante'), h('th', null, 'Solución (cifrada)'))));
    const tb = h('tbody');
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.lab) continue;
      const publicos = [{ ruta: 'laboratorios/' + def.lab.archivo, nombre: def.lab.archivo }].concat((def.lab.descargas || []).filter((d) => /^laboratorios\//.test(d.ruta)).map((d) => ({ ruta: d.ruta, nombre: d.ruta.split('/').pop() })));
      const sols = publicos.flatMap((p) => solDe(p.nombre));
      tb.appendChild(h('tr', null, h('td', null, 'M' + m.id + ' · ' + m.titulo), h('td', null, publicos.map((p) => h('div', null, h('a', { href: P.url(p.ruta), download: p.nombre }, p.nombre)))), h('td', null, h('div', { class: 'grupo-btn' }, sols.length ? sols.map(boton) : '—'))));
    }
    const fila = (txt, publicos) => {
      const sols = publicos.flatMap((p) => solDe(p.nombre));
      tb.appendChild(h('tr', null, h('td', null, txt), h('td', null, publicos.map((p) => h('div', null, h('a', { href: P.url(p.ruta), download: p.nombre }, p.nombre)))), h('td', null, h('div', { class: 'grupo-btn' }, sols.length ? sols.map(boton) : '—'))));
    };
    tb.appendChild(h('tr', { class: 'plan-bloque' }, h('td', { colspan: '3' }, h('b', null, 'Tareas de aprendizaje (etapa 5)'))));
    for (const m of C.MODULOS) {
      const T = (LT.TAREAS || {})[m.id];
      if (T) fila('M' + m.id + ' · tareas T1–T3', [{ ruta: 'tareas/' + T.archivo, nombre: T.archivo }].concat((T.descargas || []).filter((d) => /\.docx$/.test(d.archivo)).map((d) => ({ ruta: 'tareas/' + d.archivo, nombre: d.archivo }))));
    }
    tb.appendChild(h('tr', { class: 'plan-bloque' }, h('td', { colspan: '3' }, h('b', null, 'Proyectos'))));
    for (const pr of C.PROYECTOS) {
      const D = (LT.PROYECTOS_DEF || {})[pr.id] || {};
      fila('Proyecto ' + (pr.nivel ? C.nivel(pr.nivel).nombre : 'final'), [{ ruta: 'proyectos/' + pr.archivo, nombre: pr.archivo }].concat((D.descargas || []).filter((d) => /^proyectos\/.*\.docx$/.test(d.ruta)).map((d) => ({ ruta: d.ruta, nombre: d.ruta.split('/').pop() }))));
    }
    t.appendChild(tb);
    cont.append(h('p', { class: 'intro' }, 'Las soluciones se descifran en este navegador al descargarlas. Las tablas dinámicas de las soluciones se crearon con LibreOffice; los gráficos dinámicos, segmentaciones, consultas de Power Query y macros se crean dentro de Excel, así que esos libros traen una hoja «Solución» con los pasos.'),
      h('div', { class: 'tabla-scroll' }, t),
      h('p', { style: { marginTop: '14px' } }, h('a', { class: 'btn chico', href: P.url('datos/la-taza-base.xlsx'), download: 'la-taza-base.xlsx' }, LT.icono('descargar', 15), 'Libro de datos del caso')));
  }

  /* ---------------------------------------------------- reportes del grupo */
  function reportes(cont) {
    const N = C.MODULOS.length;
    const NIVELES_P = ['basico', 'intermedio', 'avanzado'];
    const resultados = h('div');
    const sinFinal = h('input', { type: 'checkbox' });
    const reps = [];
    const puntaje = (d, id) => { const x = (d.proyectos || {})[id]; return x && x.puntaje ? Math.round(x.puntaje) : 0; };
    const calcular = (d) => {
      const mods = C.MODULOS.map((m) => d.modulos[m.id] || {});
      const retos = mods.filter((m) => m.reto && m.reto.ok && (m.reto.nivel === 'analista' || m.reto.nivel === 'experto')).length;
      const labs = mods.filter((m) => m.lab && m.lab.ok).length;
      const tareas = mods.reduce((a, m) => a + LT.progreso.tareasAprobadas(m), 0);
      const totalT = C.MODULOS.reduce((a, m) => a + (m.tareas || 3), 0);
      const proy = NIVELES_P.map((n) => puntaje(d, n));
      const fin = puntaje(d, 'final');
      const pctP = proy.reduce((a, b) => a + b, 0) / 300;
      const base = (retos / N) * 20 + (labs / N) * 25 + (tareas / totalT) * 20;
      const cal = sinFinal.checked ? base + pctP * 35 : base + pctP * 20 + (fin / 100) * 15;
      return { retos, labs, tareas, totalT, proy, fin, cal: Math.round(cal * 10) / 10 };
    };
    const celdaModulo = (d, m) => {
      const x = d.modulos[m.id] || {};
      const nt = LT.progreso.tareasAprobadas(x);
      const titulo = (x.reto && x.reto.ok ? 'Reto: ' + NIVEL_TXT[x.reto.nivel] : 'Reto pendiente') + (x.lab && x.lab.ok ? ' · Lab aprobado' : '') + ' · ' + nt + '/3 tareas';
      return h('td', { title: titulo }, (x.reto && x.reto.ok ? x.reto.nivel[0].toUpperCase() : '·') + (x.lab && x.lab.ok ? '★' : '') + (nt ? '•'.repeat(nt) : ''));
    };
    const dibujar = () => {
      resultados.innerHTML = '';
      if (!reps.length) return;
      const tabla = h('table', { class: 'tabla-sitio' });
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Participante'), h('th', null, 'Grupo'), C.MODULOS.map((m) => h('th', { title: m.titulo }, 'M' + m.id)), h('th', null, 'Retos'), h('th', null, 'Labs'), h('th', null, 'Tareas'), h('th', null, 'Proyectos B / I / A'), h('th', null, 'Final'), h('th', null, 'Ubicación (pre → post)'), h('th', null, 'Calificación'))));
      const tb = h('tbody');
      for (const r of reps) {
        const d = r.datos;
        const c = calcular(d);
        const ub = NIVELES_P.map((n) => { const u = (d.ubicacion || {})[n] || {}; return (u.pre ? u.pre.puntaje : '–') + '→' + (u.post ? u.post.puntaje : '–'); }).join(' · ');
        tb.appendChild(h('tr', null, h('td', null, (d.participante.nombre || '(sin nombre)') + (r.integro ? '' : ' ⚠')), h('td', null, d.participante.grupo || ''),
          C.MODULOS.map((m) => celdaModulo(d, m)),
          h('td', null, c.retos + '/' + N), h('td', null, c.labs + '/' + N), h('td', null, c.tareas + '/' + c.totalT), h('td', null, c.proy.join(' / ')), h('td', null, String(c.fin)), h('td', null, ub), h('td', null, h('b', null, String(c.cal)))));
      }
      tabla.appendChild(tb);
      resultados.append(h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'E/A/X = reto superado en nivel Explorador/Analista/Experto; ★ = laboratorio aprobado; • = tarea de aprendizaje aprobada; ⚠ = el reporte fue editado a mano. Calificación: retos en nivel Analista o Experto 20 %, laboratorios 25 %, tareas 20 %, proyectos de nivel 20 % y proyecto final 15 % (puntaje del verificador; ajústalo con la rúbrica y la presentación).'),
        h('div', { class: 'tabla-scroll' }, tabla),
        h('button', { class: 'btn chico', style: { marginTop: '10px' }, onclick: () => {
          const filas = [['Participante', 'Grupo', ...C.MODULOS.map((m) => 'M' + m.id + ' reto'), ...C.MODULOS.map((m) => 'M' + m.id + ' lab'), ...C.MODULOS.map((m) => 'M' + m.id + ' tareas'), 'Retos', 'Labs', 'Tareas', 'Proy. básico', 'Proy. intermedio', 'Proy. avanzado', 'Proy. final', 'Calificación']];
          for (const r of reps) {
            const d = r.datos; const c = calcular(d);
            filas.push([d.participante.nombre, d.participante.grupo, ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.reto && x.reto.ok ? x.reto.nivel : ''; }), ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.lab && x.lab.ok ? 'sí' : ''; }),
              ...C.MODULOS.map((m) => LT.progreso.tareasAprobadas(d.modulos[m.id] || {})), c.retos, c.labs, c.tareas, ...c.proy, c.fin, c.cal]);
          }
          const csv = '﻿' + filas.map((f) => f.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
          LT.u.descargar('calificaciones-la-taza.csv', csv, 'text/csv');
        } }, LT.icono('descargar', 15), 'Descargar CSV'));
    };
    sinFinal.addEventListener('change', dibujar);
    const inp = h('input', { type: 'file', accept: '.json', multiple: true, onchange: async (e) => {
      for (const f of e.target.files) { try { reps.push(LT.progreso.leerReporte(await f.text())); } catch (er) { LT.ui.toast(f.name + ': ' + er.message, 'error'); } }
      dibujar();
    } });
    const rub = (RB) => h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['Inicial (1)', 'En desarrollo (2)', 'Logrado (3)', 'Destacado (4)'].map((x) => h('th', null, x)))), h('tbody', null, RB.map(([c, n]) => h('tr', null, h('th', null, c), n.map((x) => h('td', null, x)))))));
    const DF = (LT.PROYECTOS_DEF || {}).final || {};
    cont.append(h('p', { class: 'intro' }, 'Cada participante descarga su reporte desde la página de inicio (botón «Reporte para el docente»). Selecciona aquí todos los archivos .json: se procesan en este navegador, sin enviarse a ningún servidor.'),
      h('div', { class: 'grupo-btn' }, inp, h('label', { class: 'en-linea', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, sinFinal, 'Sin proyecto final (su 15 % pasa a los proyectos de nivel)')), resultados,
      h('h3', { style: { marginTop: '22px' } }, 'Rúbrica de los proyectos de nivel'), rub(LT.paginas.RUBRICA),
      DF.rubrica ? h('h3', { style: { marginTop: '22px' } }, 'Rúbrica del proyecto final') : null, DF.rubrica ? rub(DF.rubrica) : null);
  }

  /* ------------------------------------------------------- notas técnicas */
  function tecnico(cont) {
    const pre = (txt) => h('pre', { class: 'mono', style: { background: '#fbfaf8', border: '1px solid var(--linea)', borderRadius: '10px', padding: '12px', overflow: 'auto', fontSize: '.85rem' } }, txt);
    cont.append(
      h('section', { class: 'seccion' }, h('h2', null, 'Qué protege la contraseña'),
        h('p', null, 'La guía teórica, el plan de sesiones y los libros de solución viajan cifrados (AES-GCM de 256 bits; la llave se deriva de la contraseña con PBKDF2-SHA256 y ' + window.LT_DOCENTE_CIFRADO.iter.toLocaleString('es-MX') + ' iteraciones). Sin la contraseña no se pueden leer, aunque el sitio sea público.'),
        h('p', null, 'Límite importante: las soluciones de los retos del simulador forman parte del código público de cada módulo, porque el verificador las necesita para comparar resultados. Alguien con conocimientos técnicos podría leerlas en el código fuente; lo mismo ocurre con las fórmulas de referencia de las tareas (assets/js/actividades.js). Por eso la calificación pesa más los laboratorios, las tareas y los proyectos, que se resuelven en Excel real y se entregan como archivo.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cambiar la contraseña o actualizar el contenido'),
        h('p', null, 'Las fuentes están en la carpeta privada (hermana del sitio, no se publica): docente/guia-teorica.html, docente/plan-sesiones.json y soluciones/. Después de editarlas, o para cambiar la contraseña, ejecuta:'),
        pre('python herramientas/generar_libros.py         # laboratorios (solo si los cambiaste)\npython herramientas/generar_actividades.py     # tareas de aprendizaje y proyectos\npython herramientas/proteger_docente.py --clave "tu-nueva-contraseña"'),
        h('p', null, 'generar_actividades.py usa LibreOffice (si está instalado) para agregar tablas dinámicas reales a las soluciones. Después sube a GitHub Pages las carpetas docente/, laboratorios/, tareas/ y proyectos/ y el archivo assets/js/actividades.js.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cómo agregar tareas de aprendizaje'),
        h('p', null, 'Las tareas se declaran en Python (herramientas/actividades_basico.py, _intermedio.py y _avanzado.py) con la clase Actividad: hoja, apoyo (modelo, completar o autonoma), instrucciones, una función que construye la hoja, la solución en fórmulas en inglés y las pruebas declarativas. El mismo archivo genera el libro del participante, el libro resuelto y el código que usa el verificador.'),
        pre("A('T2', 'Nombres definidos y SI', 'T2', apoyo='completar', construir=m9_t2,\n  instrucciones=['Copia D5 hasta D14.', …],\n  sol={'E5:E14': '=IF(C5>=Meta,Bono,0)'}, sol_nombres={'Bono': '=T2!$G$3'},\n  pruebas=[{'t': 'usa', 'r': 'E5:E14', 'f': ['IF']}, {'t': 'valores', 'r': 'E5:E14'},\n           {'t': 'robustez', 'r': 'E5:E14', 'cambios': {'G3': 650}}])"),
        h('p', null, 'Las pruebas «valores» y «robustez» calculan lo esperado aplicando la solución a los datos del propio libro del participante (con HyperFormula), así que no importa si ordenó o quitó filas. Otras pruebas revisan formatos, tablas, gráficos, validaciones, formato condicional, impresión, tablas dinámicas, consultas, macros y documentos de Word.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cómo agregar retos nuevos'),
        h('p', null, 'Cada módulo vive en ', h('code', null, 'assets/js/modulos/mXX.js'), ' y se declara con ', h('code', null, 'LT.definirModulo({…})'), '. Un reto en el simulador tiene tres partes:'),
        pre("base: {\n  hoja: { hojas: [{ nombre: 'Ventas', datos: [[...], ...], formatos: { 'C2:C21': '$#,##0' }, objetivo: 'D2:D21' }],\n          herramientas: ['formulas'] },\n  solucion: { 'D2:D21': '=SI(C2>=$F$1, C2*$F$2, 0)' },   // se copia hacia abajo como en Excel\n  pruebas: [\n    { tipo: 'formula', rango: 'D2:D21' },                  // hay fórmula, no un número\n    { tipo: 'valores', rango: 'D2:D21', mensaje: '{celda} muestra {obtenido}…' },\n    { tipo: 'usa', rango: 'F4', funciones: ['CONTAR.SI'] },\n    { tipo: 'robustez', cambios: { F1: 8000 }, rango: 'D2:D21' },  // recalcula con otros datos\n    { tipo: 'estilo', rango: 'A1', prop: 'b', valor: true },\n    { tipo: 'fn', fn: (x) => true || 'mensaje' },\n  ],\n  instrucciones: ['…'], pistas: ['concepto', 'sintaxis', 'paso exacto'],\n},\nniveles: { explorador: { plantilla: { celda: 'D2', texto: '=SI(C2>=___, …)' } }, experto: { pruebasExtra: [...] } }"),
        h('p', null, 'Los laboratorios declaran ', h('code', null, 'lab.pruebas: [{ titulo, fn(L, A, nivel) }]'), ', donde ', h('code', null, 'L'), ' es el libro leído y ', h('code', null, 'A'), ' trae ayudas como ', h('code', null, 'A.sinFormula'), ', ', h('code', null, 'A.valoresMal'), ' y ', h('code', null, 'A.conCambios'), '. Con ', h('code', null, 'lab.docx: true'), ' el laboratorio acepta además un documento de Word (', h('code', null, 'L.docx.campos'), ' lista los campos combinados).')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cómo revisa un archivo el verificador'),
        h('p', null, 'Un .xlsx es un paquete comprimido de archivos XML. La página lo descomprime en el navegador (JSZip) y lee celdas, formatos, gráficos, tablas, tablas dinámicas, segmentaciones, validaciones, propiedades del documento, vista y zoom de cada hoja. Las fórmulas se guardan en inglés (SUMA se guarda como SUM y BUSCARX como _xlfn.XLOOKUP). En un .xlsm, vbaProject.bin confirma que el libro guarda macros. En un .docx se leen los códigos de campo MERGEFIELD de la combinación de correspondencia.')));
  }

  LT.docente = { iniciar };
})();
