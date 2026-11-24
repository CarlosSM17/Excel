/* Catálogo del curso (versión 3): 25 módulos en 6 sesiones de 3 horas, 3 niveles,
   un proyecto completo por nivel y un proyecto final. Cada módulo termina con una
   secuencia de tres tareas de aprendizaje (modelo → completar → autónoma). */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const NIVELES = [
    { id: 'basico', nombre: 'Básico', sesiones: [1, 2], horas: 'Sesiones 1 y 2 · 6 horas', color: '#1e7145', capa: 'Conocer Excel, capturar, calcular, presentar, graficar e imprimir el reporte de una sucursal.', modulos: [1, 2, 3, 4, 5, 6, 7, 8], proyecto: 'basico', integrador: 'Reporte mensual de la sucursal Sur' },
    { id: 'intermedio', nombre: 'Intermedio', sesiones: [3, 4], horas: 'Sesiones 3 y 4 · 6 horas', color: '#2463a6', capa: 'Decidir con fórmulas, limpiar y organizar datos, convertirlos en tablas confiables y trabajar en equipo.', modulos: [9, 10, 11, 12, 13, 14, 15, 16], proyecto: 'intermedio', integrador: 'Control de pedidos corporativos' },
    { id: 'avanzado', nombre: 'Avanzado', sesiones: [5, 6], horas: 'Sesiones 5 y 6 · 6 horas', color: '#7b3f9e', capa: 'Analizar el año con tablas dinámicas y búsquedas, auditar, proyectar escenarios, importar datos y automatizar.', modulos: [17, 18, 19, 20, 21, 22, 23, 24, 25], proyecto: 'avanzado', integrador: 'Tablero anual automatizado' },
  ];
  // compatibilidad con código de la versión 2 (una sesión por nivel)
  NIVELES.forEach((n) => { n.sesion = n.sesiones[0]; });

  // id, título, nivel, sesión, minutos, entorno, reto principal, glifo de insignia, micro-retos
  const MODULOS = [
    [1, 'Inicio: la pantalla de Excel', 'basico', 1, 15, 'Simulador + Excel real', 'Recorrido por la pantalla y tu barra de acceso rápido', '⌂', 4],
    [2, 'Editar un libro de trabajo', 'basico', 1, 30, 'Simulador', 'Pasar a limpio la lista de precios', '✎', 4],
    [3, 'Fórmulas básicas', 'basico', 1, 50, 'Simulador', 'Corte de caja del día', 'Σ', 4],
    [4, 'Formato a hojas de trabajo', 'basico', 1, 40, 'Simulador + Excel real', 'Reporte semanal presentable', 'A', 4],
    [5, 'Insertar objetos', 'basico', 1, 20, 'Excel real', 'Encabezado del menú con logo y enlace', '◆', 3],
    [6, 'Hojas y referencias entre hojas', 'basico', 2, 30, 'Simulador + Excel real', 'Una hoja por sucursal y una de resumen', '▤', 4],
    [7, 'Gráficos', 'basico', 2, 45, 'Simulador + Excel real', '¿Qué producto vende más y cómo cambia por mes?', '▮', 4],
    [8, 'Imprimir y distribuir', 'basico', 2, 30, 'Simulador + Excel real', 'El reporte cabe en una hoja y sale en PDF', '⎙', 3],
    [9, 'Referencias, nombres y decisiones con SI', 'intermedio', 3, 45, 'Simulador', 'Comisiones de los vendedores', 'ƒ', 4],
    [10, 'Resumir con condiciones', 'intermedio', 3, 35, 'Simulador', 'Resumen de ventas por sucursal y categoría', '≥', 4],
    [11, 'Funciones de texto y de fecha', 'intermedio', 3, 40, 'Simulador', 'Códigos, nombres y plazos de entrega', 'Aa', 4],
    [12, 'Organizar datos', 'intermedio', 3, 35, 'Simulador + Excel real', 'Limpiar la base de clientes', '⇅', 4],
    [13, 'Tablas', 'intermedio', 4, 35, 'Simulador + Excel real', 'Tabla de pedidos con totales y filtros visuales', '▦', 3],
    [14, 'Formato intermedio', 'intermedio', 4, 30, 'Simulador + Excel real', 'Semáforo de inventario', '●', 4],
    [15, 'Validación de datos', 'intermedio', 4, 25, 'Simulador + Excel real', 'Captura sin errores en el registro de pedidos', '✓', 4],
    [16, 'Colaborar y proteger', 'intermedio', 4, 25, 'Simulador + Excel real', 'Revisión del presupuesto en parejas', '✉', 3],
    [17, 'Tablas dinámicas', 'avanzado', 5, 45, 'Simulador + Excel real', 'Analizar el año: sucursales, trimestres y productos', '⊞', 4],
    [18, 'Gráficos dinámicos y tableros', 'avanzado', 5, 35, 'Simulador + Excel real', 'Mini tablero de ventas con segmentación', '◩', 3],
    [19, 'Búsqueda y matrices dinámicas', 'avanzado', 5, 45, 'Simulador + Excel real', 'Buscador de productos por código', '⌕', 4],
    [20, 'Errores de fórmula y auditoría', 'avanzado', 5, 30, 'Simulador + Excel real', 'Cazador de errores: 8 errores sembrados', '⚠', 3],
    [21, 'Formato avanzado', 'avanzado', 6, 20, 'Simulador + Excel real', 'Resaltar la fila completa de los pedidos atrasados', '#', 3],
    [22, 'Análisis de hipótesis', 'avanzado', 6, 30, 'Simulador + Excel real', '¿Cuántos cafés hay que vender para no perder?', '◎', 3],
    [23, 'Obtener y transformar datos (Power Query)', 'avanzado', 6, 30, 'Simulador + Excel real', 'Unir las ventas de las tres sucursales sin copiar y pegar', '⇄', 3],
    [24, 'Macros y automatización', 'avanzado', 6, 30, 'Simulador + Excel de escritorio', 'Botón que da formato al reporte semanal', '▶', 3],
    [25, 'Bases de datos y combinar correspondencia', 'avanzado', 6, 20, 'Simulador + Excel y Word', 'Registro de pedidos: captura, consulta y cartas', '⚙', 3],
  ].map(([id, titulo, nivel, sesion, min, entorno, reto, glifo, micro]) => ({ id, titulo, nivel, sesion, min, entorno, reto, glifo, micro, tareas: 3, slug: 'm' + String(id).padStart(2, '0') }));

  /* Agenda de cada sesión de 180 minutos: números = módulos; [texto, minutos] = bloques fijos */
  const SESIONES = [
    { n: 1, nivel: 'basico', agenda: [['Arranque', 5], 1, 2, 3, ['Receso', 15], 4, 5, ['Cierre', 5]] },
    { n: 2, nivel: 'basico', agenda: [['Arranque', 5], 6, 7, ['Receso', 15], 8, ['Taller del proyecto Básico', 50, 'basico'], ['Cierre', 5]] },
    { n: 3, nivel: 'intermedio', agenda: [['Arranque', 5], 9, 10, ['Receso', 15], 11, 12, ['Cierre', 5]] },
    { n: 4, nivel: 'intermedio', agenda: [['Arranque', 5], 13, 14, ['Receso', 15], 15, 16, ['Taller del proyecto Intermedio', 40, 'intermedio'], ['Cierre', 5]] },
    { n: 5, nivel: 'avanzado', agenda: [['Arranque', 5], 17, 18, ['Receso', 15], 19, 20, ['Cierre', 5]] },
    { n: 6, nivel: 'avanzado', agenda: [['Arranque', 5], 21, 22, 23, ['Receso', 15], 24, 25, ['Taller: proyecto Avanzado y proyecto final', 25, 'avanzado'], ['Cierre', 5]] },
  ].map((s) => Object.assign(s, { modulos: s.agenda.filter((x) => typeof x === 'number') }));

  /* Proyectos completos: uno por nivel y uno final que integra todo el curso */
  const PROYECTOS = [
    { id: 'basico', nivel: 'basico', titulo: 'Reporte mensual de la sucursal Sur', archivo: 'proyecto-basico.xlsx', modulos: [1, 2, 3, 4, 5, 6, 7, 8], horas: 'Taller de 50 min en la sesión 2 + unas 2 horas de trabajo autónomo', glifo: 'B' },
    { id: 'intermedio', nivel: 'intermedio', titulo: 'Control de pedidos corporativos', archivo: 'proyecto-intermedio.xlsx', modulos: [9, 10, 11, 12, 13, 14, 15, 16], horas: 'Taller de 40 min en la sesión 4 + unas 2.5 horas de trabajo autónomo', glifo: 'I' },
    { id: 'avanzado', nivel: 'avanzado', titulo: 'Tablero anual automatizado', archivo: 'proyecto-avanzado.xlsx', modulos: [17, 18, 19, 20, 21, 22, 23, 24, 25], horas: 'Taller de 25 min en la sesión 6 + unas 3 horas de trabajo autónomo', glifo: 'A' },
    { id: 'final', nivel: null, titulo: 'Plan de apertura de la sucursal Poniente', archivo: 'proyecto-final.xlsx', modulos: MODULOS.map((m) => m.id), horas: 'Unas 5 horas de trabajo autónomo, después de la sesión 6, y una presentación de 5 minutos', glifo: '★' },
  ];

  const APOYOS = {
    modelo: { nombre: 'Tarea con modelo', corto: 'Modelo', desc: 'Trae una parte resuelta y explicada: obsérvala y continúa con el mismo procedimiento.' },
    completar: { nombre: 'Tarea para completar', corto: 'Completar', desc: 'Una parte ya está hecha; tú completas los pasos que faltan.' },
    autonoma: { nombre: 'Tarea autónoma', corto: 'Autónoma', desc: 'Solo la meta y los datos, en un contexto nuevo: decides tú cómo resolverla.' },
  };

  function modulo(id) { return MODULOS.find((m) => m.id === +id) || null; }
  function nivel(id) { return NIVELES.find((n) => n.id === id) || null; }
  function proyecto(id) { return PROYECTOS.find((p) => p.id === id) || null; }
  function sesionesDeNivel(id) { return SESIONES.filter((s) => s.nivel === id); }
  /* Agenda con horas de inicio y fin: [{tipo:'modulo'|'bloque', titulo, min, inicio, fin, proyecto?}] */
  function agenda(n) {
    const s = SESIONES.find((x) => x.n === n);
    let t = 0;
    const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    return s.agenda.map((x) => {
      const it = typeof x === 'number' ? { tipo: 'modulo', id: x, titulo: 'Módulo ' + x + '. ' + modulo(x).titulo, min: modulo(x).min } : { tipo: x[2] ? 'proyecto' : 'bloque', titulo: x[0], min: x[1], proyecto: x[2] || null };
      it.inicio = hhmm(t); t += it.min; it.fin = hhmm(t);
      return it;
    });
  }

  /* Insignia SVG. opc: {tam, estrella, tareas: número de tareas aprobadas (0–3)} */
  function insignia(id, opc) {
    opc = opc || {};
    const m = modulo(id);
    const n = nivel(m.nivel);
    const t = opc.tam || 64;
    const estrella = opc.estrella ? '<path d="M50 4l3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8L50 21.8l-7 3.7 1.3-7.8-5.6-5.5 7.8-1.1z" fill="#f5c542" stroke="#fff" stroke-width="1.5"/>' : '';
    const nt = Math.max(0, Math.min(3, opc.tareas || 0));
    let puntos = '';
    if (opc.tareas != null) for (let i = 0; i < 3; i++) puntos += '<circle cx="' + (38 + i * 12) + '" cy="88" r="4.2" fill="' + (i < nt ? '#f5c542' : 'rgba(255,255,255,.35)') + '" stroke="#fff" stroke-width="1"/>';
    const fs = m.glifo.length > 1 ? 24 : 30;
    return '<svg viewBox="0 0 100 100" width="' + t + '" height="' + t + '" role="img" aria-label="Insignia del módulo ' + id + ': ' + m.titulo + (opc.tareas != null ? ' · ' + nt + ' de 3 tareas' : '') + '">' +
      '<path d="M50 6 88 28v44L50 94 12 72V28z" fill="' + n.color + '"/>' +
      '<path d="M50 14 81 32v36L50 86 19 68V32z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>' +
      '<text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="' + fs + '" fill="#fff" font-weight="700">' + m.glifo + '</text>' +
      '<text x="50" y="74" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" fill="rgba(255,255,255,.9)" font-weight="700">M' + id + '</text>' + puntos + estrella + '</svg>';
  }
  /* Sello SVG de un proyecto */
  function selloProyecto(id, opc) {
    opc = opc || {};
    const p = proyecto(id);
    const color = p.nivel ? nivel(p.nivel).color : '#8a5a3c';
    const t = opc.tam || 64;
    const ok = opc.aprobado;
    return '<svg viewBox="0 0 100 100" width="' + t + '" height="' + t + '" role="img" aria-label="Sello del proyecto ' + p.titulo + '">' +
      '<circle cx="50" cy="50" r="44" fill="' + color + '"' + (ok ? '' : ' opacity=".45"') + '/>' +
      '<circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-dasharray="4 3"/>' +
      '<text x="50" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#fff" font-weight="700">' + p.glifo + '</text>' +
      (ok ? '<path d="M66 70l7 7 13-15" fill="none" stroke="#f5c542" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' : '') + '</svg>';
  }

  const HORAS_TOTALES = SESIONES.length * 3;
  LT.CURSO = { version: 3, NIVELES, MODULOS, SESIONES, PROYECTOS, APOYOS, modulo, nivel, proyecto, sesionesDeNivel, agenda, insignia, selloProyecto, gerente: 'Marta Ríos', cafeteria: 'Cafetería La Taza', formato: '6 sesiones de 3 horas', horas: HORAS_TOTALES };
})();
