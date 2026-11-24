/* Páginas generales (versión 3): inicio, prueba de ubicación, proyectos completos y glosario.
   (La guía docente vive en docente/ y su contenido está cifrado.)
   Los proyectos (fases, entregables y pruebas) vienen de assets/js/actividades.js,
   que genera herramientas/generar_actividades.py junto con sus libros de Excel. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const C = LT.CURSO;
  const P = LT.pagina;
  const param = (n) => new URLSearchParams(location.search).get(n);
  const NIVEL_TXT = { explorador: 'Explorador', analista: 'Analista', experto: 'Experto' };
  const PROY = () => LT.PROYECTOS_DEF || {};

  /* ============================================================ INICIO */
  function inicio() {
    const prog = LT.progreso.cargar();
    const main = h('main');
    const total = C.MODULOS.length;
    const estados = C.MODULOS.map((m) => LT.progreso.estadoModulo(m.id));
    const insignias = estados.filter((e) => e.superado).length;
    const tareas = estados.reduce((s, e) => s + e.tareas, 0);
    const avance = Math.round(estados.reduce((s, e) => s + e.avance, 0) / total);
    const siguiente = C.MODULOS.find((m, i) => !estados[i].superado) || C.MODULOS[0];
    const nombre = h('input', { type: 'text', value: prog.participante.nombre || '', placeholder: 'Tu nombre completo', 'aria-label': 'Nombre' });
    const grupo = h('input', { type: 'text', value: prog.participante.grupo || '', placeholder: 'Grupo o área', 'aria-label': 'Grupo' });
    [nombre, grupo].forEach((x) => x.addEventListener('change', () => LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() })));
    main.appendChild(h('section', { class: 'portada' }, h('div', { class: 'contenedor portada-grid' },
      h('div', null,
        h('div', { class: 'chip', style: { background: 'rgba(255,255,255,.12)', color: '#f4e1cc', borderColor: 'rgba(255,255,255,.2)', marginBottom: '12px' } }, C.SESIONES.length + ' sesiones de 3 horas · ' + total + ' módulos · ' + C.PROYECTOS.length + ' proyectos completos'),
        h('h1', null, 'Excel de básico a avanzado, resolviendo retos y proyectos reales'),
        h('p', { class: 'lead' }, 'Eres el nuevo analista de la Cafetería La Taza: tres sucursales, 20 productos y un año de ventas. Cada módulo te pide una tarea real del negocio; la practicas en el simulador, que revisa tus fórmulas al instante, la demuestras en Excel y la consolidas con tres tareas de aprendizaje. Cada nivel cierra con un proyecto completo y el curso, con el plan de apertura de una nueva sucursal.'),
        h('div', { class: 'grupo-btn', style: { marginTop: '18px' } },
          h('a', { class: 'btn primario', href: P.urlModulo(siguiente.id) }, insignias ? 'Continuar: módulo ' + siguiente.id : 'Empezar con el módulo 1', ' →'),
          h('a', { class: 'btn fantasma', style: { color: '#fbefe2' }, href: 'ubicacion.html?nivel=basico' }, 'Prueba de ubicación'))),
      h('div', { class: 'ficha-participante' },
        h('div', { style: { fontWeight: 600, color: '#fff' } }, 'Tu avance'),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', margin: '8px 0 6px' } }, h('span', null, insignias + '/' + total + ' insignias · ' + tareas + '/' + total * 3 + ' tareas'), h('span', null, avance + ' %')),
        h('div', { class: 'barra-avance' }, h('span', { style: { width: avance + '%' } })),
        h('label', null, 'Nombre'), nombre, h('label', null, 'Grupo'), grupo,
        h('div', { class: 'grupo-btn', style: { marginTop: '12px' } },
          h('button', { class: 'btn chico', onclick: () => { LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() }); if (!nombre.value.trim()) { LT.ui.aviso('Falta tu nombre', 'Escribe tu nombre para que el docente identifique tu reporte.'); return; } LT.u.descargar('reporte-la-taza-' + nombre.value.trim().toLowerCase().replace(/\s+/g, '-') + '.json', LT.progreso.reporte(), 'application/json'); } }, LT.icono('descargar', 15), 'Reporte para el docente'),
          h('label', { class: 'btn chico fantasma', style: { color: '#fbefe2', cursor: 'pointer' } }, 'Cargar avance', h('input', { type: 'file', accept: '.json', class: 'sr', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = LT.progreso.importar(await f.text()); LT.ui.toast(r.integro ? 'Avance cargado.' : 'Avance cargado (el archivo fue modificado a mano).', r.integro ? 'ok' : 'aviso'); setTimeout(() => location.reload(), 600); } catch (er) { LT.ui.aviso('No se pudo cargar', er.message); } } }))),
        h('p', { style: { fontSize: '.78rem', color: '#e6cdb2', margin: '10px 0 0' } }, 'Tu avance se guarda en este navegador. Usa el reporte para entregarlo o para pasarlo a otra computadora.'))),
      h('div', { class: 'taza-fondo', html: LT.iconoSVG('taza', 300) })));

    const cont = h('div', { class: 'contenedor', id: 'modulos' });
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Cómo funciona cada módulo'),
      h('p', { class: 'intro', html: 'Cada módulo empieza con la <b>información de apoyo</b> (explicación, ejemplos dibujados y secciones «más a detalle») y avanza en cinco etapas, del ejemplo resuelto a la tarea autónoma. Al final tienes una autoevaluación y el mapa de dónde está cada comando.' }),
      h('div', { class: 'grid-modulos', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' } },
        [['1', 'Ver', 'Un ejemplo resuelto: predices el resultado antes de verlo.'], ['2', 'Completar', 'Micro-retos de una sola función, comando o atajo.'], ['3', 'Resolver', 'El reto principal en el simulador, en nivel Explorador, Analista o Experto, con pistas y revisión instantánea.'], ['4', 'Transferir', 'Un laboratorio en Excel real: descargas el libro, lo resuelves y lo subes para revisarlo.'], ['5', 'Practicar', 'Tres tareas de aprendizaje en contextos nuevos, con apoyo que se retira: modelo → completar → autónoma.']].map(([n, t, d]) => h('div', { class: 'tarjeta' }, h('div', { class: 'etiqueta-etapa' }, 'Etapa ' + n), h('h3', null, t), h('p', { style: { margin: 0, color: 'var(--tinta-2)', fontSize: '.93rem' } }, d))))));
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'La ruta: ' + C.SESIONES.length + ' sesiones de 3 horas'),
      h('p', { class: 'intro' }, 'Dos sesiones por nivel, cada una con un receso de 15 minutos. La segunda sesión de cada nivel termina con un taller para arrancar el proyecto del nivel, que se completa de forma autónoma junto con las tareas de aprendizaje.'),
      h('div', { class: 'ruta-sesiones' }, C.SESIONES.map((s) => {
        const nv = C.nivel(s.nivel);
        return h('div', { class: 'sesion-tarjeta', style: { borderTopColor: nv.color } },
          h('div', { class: 'sesion-cab' }, h('span', { class: 'chip ' + nv.id }, 'Sesión ' + s.n), h('b', null, 'Nivel ' + nv.nombre)),
          h('ol', { class: 'agenda' }, C.agenda(s.n).map((it) => h('li', { class: it.tipo === 'proyecto' ? 'bloque' : it.tipo }, h('span', { class: 'hora' }, it.inicio), it.tipo === 'modulo' ? h('a', { href: P.urlModulo(it.id) }, it.titulo) : it.tipo === 'proyecto' ? h('a', { href: 'proyecto.html?p=' + it.proyecto }, it.titulo) : h('span', null, it.titulo), h('span', { class: 'min' }, it.min + ' min')))));
      }))));
    for (const nv of C.NIVELES) {
      const ub = prog.ubicacion[nv.id];
      const bloque = h('section', { class: 'nivel-bloque', id: 'nivel-' + nv.id },
        h('div', { class: 'nivel-cab' },
          h('div', null, h('span', { class: 'chip ' + nv.id }, nv.horas), h('h2', { style: { marginTop: '6px' } }, 'Nivel ' + nv.nombre), h('p', { class: 'desc' }, nv.capa)),
          h('div', { class: 'grupo-btn' },
            h('a', { class: 'btn chico', href: 'ubicacion.html?nivel=' + nv.id }, ub && ub.pre ? 'Prueba de ubicación: ' + ub.pre.puntaje + '/' + ub.pre.total : 'Prueba de ubicación'),
            ub && ub.pre ? h('a', { class: 'btn chico fantasma', href: 'ubicacion.html?nivel=' + nv.id + '&momento=post' }, ub.post ? 'Prueba final: ' + ub.post.puntaje + '/' + ub.post.total : 'Prueba final') : null)));
      const grid = h('div', { class: 'grid-modulos' });
      for (const id of nv.modulos) {
        const m = C.modulo(id);
        const e = LT.progreso.estadoModulo(id);
        grid.appendChild(h('a', { class: 'tarjeta-modulo', href: P.urlModulo(id) },
          h('span', { class: 'insignia-mini', html: C.insignia(id, { tam: 42, estrella: e.estrella, tareas: e.tareas }), style: { filter: e.superado ? '' : 'grayscale(1) opacity(.35)' } }),
          h('span', { class: 'num' }, 'Módulo ' + id + ' · Sesión ' + m.sesion),
          h('h3', { style: { paddingRight: '40px' } }, m.titulo),
          h('span', { class: 'reto' }, 'Reto: ' + m.reto),
          h('div', { class: 'barra-avance', title: e.avance + ' % del módulo' }, h('span', { style: { width: e.avance + '%' } })),
          h('div', { class: 'meta' }, h('span', { class: 'chip' }, m.min + ' min'), h('span', { class: 'chip excel' }, m.entorno), e.superado ? h('span', { class: 'chip ok' }, '✓ ' + NIVEL_TXT[e.nivelReto]) : null, e.lab ? h('span', { class: 'chip ok' }, '✓ Lab') : null, e.tareas ? h('span', { class: 'chip ' + (e.tareas >= 3 ? 'ok' : 'pendiente') }, e.tareas + '/3 tareas') : null)));
      }
      grid.appendChild(tarjetaProyecto(C.proyecto(nv.proyecto)));
      bloque.appendChild(grid);
      cont.appendChild(bloque);
    }
    // proyecto final
    cont.appendChild(h('section', { class: 'nivel-bloque', id: 'proyecto-final' },
      h('div', { class: 'nivel-cab' }, h('div', null, h('span', { class: 'chip' }, 'Cierre del curso'), h('h2', { style: { marginTop: '6px' } }, 'Proyecto final'), h('p', { class: 'desc' }, 'Un caso nuevo y completo que integra los tres niveles: La Taza abre su cuarta sucursal y tú preparas el libro con el que se decide la apertura.'))),
      h('div', { class: 'grid-modulos' }, tarjetaProyecto(C.proyecto('final'), true))));
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Tus insignias'), h('p', { class: 'intro' }, 'Ganas la insignia al superar el reto principal de un módulo; la estrella, al aprobar también su laboratorio en Excel real; y cada punto dorado, al aprobar una de sus tres tareas de aprendizaje. Los sellos redondos son los proyectos.'),
      h('div', { class: 'vitrina' }, C.MODULOS.map((m, i) => h('div', { class: 'insignia' + (estados[i].superado ? '' : ' bloqueada') }, h('span', { html: C.insignia(m.id, { tam: 58, estrella: estados[i].estrella, tareas: estados[i].tareas }) }), m.titulo)),
        C.PROYECTOS.map((p) => { const ok = !!(prog.proyectos[p.id] && prog.proyectos[p.id].aprobado); return h('div', { class: 'insignia' + (ok ? '' : ' bloqueada') }, h('span', { html: C.selloProyecto(p.id, { tam: 58, aprobado: ok }) }), 'Proyecto: ' + p.titulo); }))));
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Antes de empezar'),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'tarjeta' }, h('h3', null, 'Lo que necesitas'), h('ul', null, h('li', null, 'Computadora con teclado y ratón, y un navegador actualizado.'), h('li', null, 'Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los módulos.'), h('li', null, 'Para los módulos 23 a 25 (Power Query, macros y combinar correspondencia): Excel y Word de escritorio. Excel para la web y iPad no ejecutan macros VBA ni combinan correspondencia con un libro local.'), h('li', null, 'Para repasar la sintaxis de una función, abre la ', h('a', { href: 'funciones.html' }, 'Guía gráfica de funciones'), '.'))),
        h('div', { class: 'tarjeta' }, h('h3', null, 'El caso: Cafetería La Taza'), h('p', null, 'Todos los módulos usan los mismos datos: el catálogo de 20 productos, las ventas de 2025 de las sucursales Centro, Norte y Sur, empleados, clientes, pedidos e inventario. Las tareas de aprendizaje llevan esos datos a contextos nuevos del negocio: proveedores, eventos, turnos, entregas y la nueva sucursal Poniente.'), h('div', { class: 'grupo-btn' }, h('a', { class: 'btn chico cafe', href: 'datos/la-taza-base.xlsx', download: 'la-taza-base.xlsx' }, LT.icono('descargar', 15), 'Libro de datos del caso'), h('a', { class: 'btn chico', href: 'funciones.html' }, 'Guía gráfica de funciones'), h('a', { class: 'btn chico', href: 'glosario.html' }, 'Glosario español-inglés'))))));
    main.appendChild(cont);
    P.montar(main);
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 50);
  }
  function tarjetaProyecto(p, ancho) {
    const info = LT.progreso.proyecto(p.id);
    const def = PROY()[p.id] || {};
    return h('a', { class: 'tarjeta-modulo tarjeta-especial', href: 'proyecto.html?p=' + p.id, style: ancho ? { gridColumn: '1 / -1' } : null },
      h('span', { class: 'insignia-mini', html: C.selloProyecto(p.id, { tam: 42, aprobado: info.aprobado }) }),
      h('span', { class: 'num' }, p.id === 'final' ? 'Proyecto final' : 'Proyecto completo · Nivel ' + C.nivel(p.nivel).nombre),
      h('h3', { style: { paddingRight: '44px' } }, p.titulo),
      h('span', { class: 'reto' }, (def.resumen || '') + ' ' + p.horas + '.'),
      h('div', { class: 'meta' }, def.fases ? h('span', { class: 'chip' }, def.fases.length + ' fases') : null, info.aprobado ? h('span', { class: 'chip ok' }, '✓ Constancia') : info.puntaje != null ? h('span', { class: 'chip pendiente' }, info.puntaje + ' %') : h('span', { class: 'chip pendiente' }, 'Pendiente')));
  }

  /* ================================================= PRUEBA DE UBICACIÓN */
  const op = (texto, opciones, correcta, explicacion) => ({ tipo: 'opcion', texto, opciones, correcta, explicacion });
  const fx = (texto, hoja, celda, solucion, usa) => ({ tipo: 'formula', texto, hoja, celda, solucion, usa });
  const D = window.LA_TAZA;
  const PRUEBAS = {
    basico: [
      op('¿Qué parte de la ventana muestra el contenido real de la celda activa (por ejemplo, su fórmula)?', ['Barra de fórmulas', 'Cuadro de nombres', 'Barra de estado', 'Cinta de opciones'], 0),
      op('Excel se cerró de repente. ¿Qué función guarda copias periódicas para recuperar tu trabajo?', ['Autorrecuperación', 'Autocorrección', 'Autoajustar', 'Autofiltro'], 0),
      op('¿Cómo se llama la celda que está en la columna C y la fila 5?', ['5C', 'C5', 'C:5', 'F5C'], 1),
      op('Copiaste un rango con fórmulas y quieres pegar solo los resultados, sin fórmulas. ¿Qué usas?', ['Pegado especial › Valores', 'Pegar vínculo', 'Copiar formato', 'Transponer'], 0),
      op('¿Qué resultado da <code>=10-2*3</code>?', ['24', '4', '16', '-4'], 1),
      op('¿Qué función cuenta las celdas que contienen números?', ['SUMA', 'CONTAR', 'CONTARA', 'MAX'], 1),
      fx('En B7 escribe una fórmula que sume las ventas de B2 a B6.', { hojas: [{ nombre: 'Hoja1', datos: [['Día', 'Ventas'], ['Lun', 3200], ['Mar', 2950], ['Mié', 3410], ['Jue', 3600], ['Vie', 4120], ['Total']], objetivo: 'B7', filas: 8, cols: 4 }] }, 'B7', { B7: '=SUMA(B2:B6)' }, ['SUMA']),
      op('Escribes <b>CAF-009</b> en A1 y arrastras el controlador de relleno dos celdas hacia abajo. ¿Qué aparece en A3?', ['CAF-009', 'CAF-010', 'CAF-011', 'CAF-0011'], 2),
      op('Una celda guarda 0.35 y le das formato de porcentaje. ¿Qué se ve?', ['0.35%', '35%', '3.5%', '$0.35'], 1),
      op('¿Cómo traes el valor de B5 de la hoja Norte?', ['=Norte.B5', '=Norte!B5', '=B5!Norte', '=[Norte]B5'], 1),
      op('Para mostrar cómo cambian las ventas mes a mes, ¿qué gráfico conviene?', ['Circular', 'Líneas', 'Dispersión', 'Anillos'], 1),
      op('Tu reporte ocupa tres páginas y los encabezados de columna solo salen en la primera. ¿Qué haces?', ['Diseño de página › Imprimir títulos › Filas que se repiten', 'Inmovilizar paneles', 'Insertar un encabezado de página', 'Reducir la fuente'], 0),
    ],
    intermedio: [
      op('En <code>=C2*$F$1</code>, ¿qué pasa con <code>$F$1</code> al copiar la fórmula hacia abajo?', ['Cambia a F2', 'Se queda fija en F1', 'Cambia a $F$2', 'Marca error'], 1),
      fx('En C2 escribe una fórmula que muestre «Aprobado» si B2 es 70 o más, y «Revisar» si no. Cópiala hasta C5.', { hojas: [{ nombre: 'Hoja1', datos: [['Alumno', 'Puntos', 'Resultado'], ['Ana', 82], ['Beto', 69], ['Caro', 70], ['Dani', 45]], objetivo: 'C2:C5', filas: 7, cols: 4 }] }, 'C2:C5', { 'C2:C5': '=SI(B2>=70,"Aprobado","Revisar")' }, ['SI']),
      op('¿Cuál fórmula cuenta cuántas ventas de B2:B21 son de «Norte»?', ['=CONTAR(B2:B21,"Norte")', '=CONTAR.SI(B2:B21,"Norte")', '=SUMAR.SI(B2:B21,"Norte")', '=SI(B2:B21="Norte")'], 1),
      op('Quieres sumar las ventas de la sucursal Norte <b>y</b> de la categoría Postres. ¿Qué función usas?', ['SUMAR.SI', 'SUMAR.SI.CONJUNTO', 'SUMAPRODUCTO de dos SUMA', 'CONTAR.SI.CONJUNTO'], 1),
      fx('En B2 extrae las tres primeras letras del código de A2 (de «CAF-001» debe salir «CAF»). Cópiala hasta B4.', { hojas: [{ nombre: 'Hoja1', datos: [['Código', 'Prefijo'], ['CAF-001'], ['POS-012'], ['BEB-007']], objetivo: 'B2:B4', filas: 6, cols: 3 }] }, 'B2:B4', { 'B2:B4': '=IZQUIERDA(A2,3)' }, ['IZQUIERDA', 'EXTRAE']),
      op('A2 tiene la fecha del pedido y B2 la de entrega. ¿Qué devuelve <code>=B2-A2</code>?', ['El número de días entre las dos fechas', 'Un error, porque no se restan fechas', 'El número de meses', 'Siempre 0'], 0),
      op('¿Dónde está «Quitar duplicados»?', ['Inicio', 'Datos', 'Insertar', 'Fórmulas'], 1),
      op('La columna A tiene «Lucía Pérez». ¿Qué herramienta separa nombre y apellido en dos columnas?', ['Texto en columnas', 'Combinar y centrar', 'Validación de datos', 'Ordenar'], 0),
      op('En una tabla, ¿qué significa <code>[@Cantidad]</code>?', ['La cantidad de la misma fila', 'La suma de la columna Cantidad', 'La primera cantidad', 'Un nombre definido'], 0),
      op('Aplicas a C2:C16 la regla «menor que =$D2». ¿Con qué se compara C9?', ['D2', 'D9', 'C2', 'D16'], 1),
      op('Quieres que en la columna Estado solo se pueda elegir «Pendiente» o «Entregado». ¿Qué usas?', ['Validación de datos › Lista', 'Formato condicional', 'Proteger hoja', 'Texto en columnas'], 0),
      op('Vas a proteger la hoja, pero tus compañeros deben poder escribir en las celdas amarillas de captura. ¿Qué haces antes?', ['Desbloquear esas celdas (Formato de celdas › Proteger)', 'Ocultar la hoja', 'Combinar las celdas', 'Convertirlas en tabla'], 0),
    ],
    avanzado: [
      op('En una tabla dinámica, ¿qué área usas para sumar el Total de ventas?', ['Filas', 'Columnas', 'Valores', 'Filtros'], 2),
      op('Pones la Fecha en Filas y quieres ver trimestres. ¿Qué haces?', ['Agrupar por trimestres', 'Ordenar por fecha', 'Cambiar el formato de fecha', 'Usar un filtro'], 0),
      op('¿Qué herramienta agrega botones para filtrar una tabla dinámica (y su gráfico) con un clic?', ['Segmentación de datos', 'Validación de datos', 'Formato condicional', 'Inmovilizar paneles'], 0),
      fx('En F2 trae el precio del código de E2 desde la tabla A1:C6 (usa BUSCARX o INDICE+COINCIDIR).', { hojas: [{ nombre: 'Hoja1', datos: [['Código', 'Producto', 'Precio', '', 'Buscar', 'Precio'], ...D.productos.slice(0, 5).map((p) => [p.codigo, p.nombre, p.precio])], celdas: { E2: 'CAF-004' }, objetivo: 'F2', filas: 8, cols: 7 }] }, 'F2', { F2: '=BUSCARX(E2,A2:A6,C2:C6)' }, ['BUSCARX', 'INDICE', 'BUSCARV']),
      op('Tu BUSCARX muestra <b>#N/A</b>. ¿Qué significa casi siempre?', ['Que el valor buscado no está en la columna de búsqueda (o tiene espacios de más)', 'Que se dividió entre cero', 'Que la función está mal escrita', 'Que la hoja está protegida'], 0),
      op('Quieres resaltar la <b>fila completa</b> (A:J) de cada pedido atrasado según la fecha de la columna H. ¿Qué regla usas en A2:J41?', ['=$H2<HOY()', '=H2<HOY()', '=$H$2<HOY()', '=H$2<HOY()'], 0),
      op('¿Cuántos cafés hay que vender para que la utilidad sea 0? ¿Qué herramienta responde directamente?', ['Buscar objetivo', 'Escenarios', 'Tabla dinámica', 'Formato condicional'], 0),
      op('Cada mes recibes un CSV por sucursal con la misma estructura. ¿Cómo los unes sin copiar y pegar, y con un clic el mes siguiente?', ['Con Power Query: obtener datos de cada archivo (o de la carpeta), anexar las consultas y luego Actualizar', 'Abriendo cada CSV y pegándolos debajo', 'Con una tabla dinámica de cada archivo', 'Con BUSCARX entre los tres archivos'], 0),
      op('En el Editor de Power Query, ¿qué pasa con los «pasos aplicados» cuando llegan datos nuevos y pulsas Actualizar?', ['Se repiten automáticamente sobre los datos nuevos', 'Se borran', 'Hay que volver a hacerlos a mano', 'Solo se aplican a la primera fila'], 0),
      op('¿En qué formato se guarda un libro con macros?', ['.xlsx', '.xlsm', '.csv', '.pdf'], 1),
      op('Abres un libro con macros y aparece la barra «Habilitar contenido». ¿Qué haces?', ['La habilito solo si confío en el origen del archivo', 'Siempre la habilito', 'Guardo como .xlsx para quitarla', 'Cierro Excel sin guardar'], 0),
      op('Al combinar correspondencia, ¿de dónde toma Word los datos de cada carta?', ['De una lista (por ejemplo, una hoja de Excel) donde cada fila es un destinatario', 'Del portapapeles', 'De las propiedades del documento', 'De una imagen de la tabla'], 0),
    ],
  };

  function ubicacion() {
    const nivelId = PRUEBAS[param('nivel')] ? param('nivel') : 'basico';
    const momento = param('momento') === 'post' ? 'post' : 'pre';
    const nv = C.nivel(nivelId);
    const items = PRUEBAS[nivelId];
    const minimo = Math.ceil(items.length * 0.8);
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'etiqueta-etapa' }, momento === 'pre' ? 'Prueba de ubicación' : 'Prueba final'),
      h('h1', null, 'Nivel ' + nv.nombre),
      h('p', { class: 'intro' }, momento === 'pre' ? items.length + ' preguntas sobre los módulos ' + nv.modulos[0] + ' a ' + nv.modulos[nv.modulos.length - 1] + '. Si aciertas ' + minimo + ' o más, puedes ir directo a la etapa 4 (laboratorio en Excel) de cada módulo del nivel. Al terminar el nivel repetirás la misma prueba para medir tu avance.' : 'Las mismas preguntas de la prueba de ubicación, para medir cuánto avanzaste.'),
      h('div', { class: 'grupo-btn' }, C.NIVELES.map((n) => h('a', { class: 'btn chico' + (n.id === nivelId ? ' primario' : ''), href: 'ubicacion.html?nivel=' + n.id + (momento === 'post' ? '&momento=post' : '') }, n.nombre)))));
    const respuestas = {};
    const lista = h('div');
    items.forEach((it, i) => {
      const caja = h('div', { class: 'prueba-item' }, h('div', { class: 'num' }, 'Pregunta ' + (i + 1) + ' de ' + items.length), h('p', { style: { fontWeight: 600 }, html: it.texto }));
      if (it.tipo === 'opcion') {
        const ops = h('div', { class: 'opciones' });
        it.opciones.forEach((o, j) => {
          const b = h('button', { class: 'opcion', type: 'button' }, h('span', { class: 'letra' }, String.fromCharCode(65 + j)), h('span', { html: o }));
          b.addEventListener('click', () => { ops.querySelectorAll('.opcion').forEach((x) => x.classList.remove('elegida')); b.classList.add('elegida'); respuestas[i] = j === it.correcta; });
          ops.appendChild(b);
        });
        caja.appendChild(ops);
      } else {
        const hc = h('div', { id: LT.u.uid('hoja') });
        caja.appendChild(hc);
        setTimeout(() => {
          const hj = new LT.Hoja(hc, Object.assign({ altura: 200 }, it.hoja));
          const revisar = () => {
            const r = LT.verificar(hj, { solucion: it.solucion, pruebas: [{ tipo: 'formula', rango: it.celda }, { tipo: 'usa', rango: it.celda, funciones: it.usa, alguna: true }, { tipo: 'valores', rango: it.celda }] });
            respuestas[i] = r.ok;
          };
          hj.on('cambio', revisar);
          respuestas[i] = false;
        }, 0);
      }
      lista.appendChild(caja);
    });
    main.appendChild(lista);
    const resultado = h('div');
    main.appendChild(h('div', { class: 'grupo-btn', style: { margin: '16px 0 30px' } }, h('button', { class: 'btn primario', onclick: () => {
      const faltan = items.map((_, i) => i).filter((i) => !(i in respuestas));
      if (faltan.length) { LT.ui.aviso('Faltan respuestas', 'Contesta todas las preguntas (faltan: ' + faltan.map((i) => i + 1).join(', ') + ').'); return; }
      const puntaje = Object.values(respuestas).filter(Boolean).length;
      const prog = LT.progreso.cargar();
      prog.ubicacion[nivelId] = prog.ubicacion[nivelId] || {};
      prog.ubicacion[nivelId][momento] = { puntaje, total: items.length, fecha: new Date().toISOString() };
      if (momento === 'pre') prog.ubicacion[nivelId].salto = puntaje >= minimo;
      LT.progreso.guardar();
      resultado.innerHTML = '';
      const salto = momento === 'pre' && prog.ubicacion[nivelId].salto;
      const previo = prog.ubicacion[nivelId].pre;
      resultado.appendChild(h('div', { class: 'tarjeta resultado-prueba' },
        h('div', { class: 'grande' }, puntaje + ' / ' + items.length),
        momento === 'post' && previo ? h('p', null, 'En la prueba de ubicación obtuviste ' + previo.puntaje + ' / ' + previo.total + '. ' + (puntaje > previo.puntaje ? '¡Avanzaste ' + (puntaje - previo.puntaje) + ' aciertos!' : 'Repasa los módulos donde fallaste.')) : null,
        h('p', null, salto ? '¡Excelente! Puedes ir directo a la etapa 4 (laboratorio) de cada módulo de este nivel. Las etapas 1 a 3 siguen disponibles para repasar, y las tareas de aprendizaje (etapa 5) cuentan para tu avance.' : momento === 'pre' ? 'Recorre los módulos del nivel en orden: cada uno empieza con un ejemplo resuelto.' : ''),
        h('div', { class: 'grupo-btn', style: { justifyContent: 'center' } }, nv.modulos.map((id) => h('a', { class: 'btn chico', href: P.urlModulo(id) + (salto ? '#etapa4' : '') }, 'Módulo ' + id)))));
      resultado.scrollIntoView({ behavior: 'smooth' });
    } }, 'Calificar')));
    main.appendChild(resultado);
    P.montar(main);
  }

  /* ====================================================== PROYECTOS */
  const RUBRICA = [
    ['Exactitud', ['Resultados incorrectos', 'Correctos con errores aislados', 'Todos correctos', 'Correctos aun si cambian los datos']],
    ['Uso de herramientas', ['Valores escritos a mano', 'Usa algunas herramientas del nivel', 'Usa las que pide cada fase', 'Elige la herramienta más eficiente y la justifica']],
    ['Diseño y presentación', ['Difícil de leer', 'Formato inconsistente', 'Claro y consistente', 'Listo para entregar a la gerencia']],
    ['Robustez y automatización', ['Se rompe con cualquier cambio', 'Funciona solo con los datos actuales', 'Resiste cambios de datos', 'Se actualiza solo y evita errores de captura']],
    ['Comunicación', ['No explica su libro', 'Explica con ayuda', 'Explica cómo lo hizo', 'Explica por qué y qué decisión apoya']],
  ];
  function proyecto() {
    const pid = PROY()[param('p')] ? param('p') : PROY()[param('nivel')] ? param('nivel') : 'basico';
    const meta = C.proyecto(pid);
    const I = PROY()[pid];
    const nv = meta.nivel ? C.nivel(meta.nivel) : null;
    const guardado = LT.progreso.proyecto(pid);
    const main = h('main', { class: 'contenedor' });
    if (!I) { main.appendChild(h('section', { class: 'seccion' }, h('h1', null, 'Proyecto no disponible'), h('p', null, 'Falta el archivo assets/js/actividades.js.'))); P.montar(main); return; }
    const sello = h('div', { class: 'sello', html: C.selloProyecto(pid, { tam: 96, aprobado: guardado.aprobado }) });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'proyecto-cab' },
        h('div', null,
          h('div', { class: 'etiqueta-etapa' }, pid === 'final' ? 'Proyecto final del curso' : 'Proyecto completo · Nivel ' + nv.nombre),
          h('h1', null, meta.titulo),
          h('div', { class: 'grupo-btn' }, C.PROYECTOS.map((p) => h('a', { class: 'btn chico' + (p.id === pid ? ' primario' : ''), href: 'proyecto.html?p=' + p.id }, p.id === 'final' ? 'Final' : C.nivel(p.nivel).nombre)))),
        sello),
      h('div', { class: 'situacion' }, h('div', { class: 'avatar' }, 'M'), h('div', null, h('div', { class: 'de' }, (I.de || 'Marta Ríos, gerente general de La Taza') + ' escribe:'), h('div', { class: 'msj', html: I.situacion }))),
      h('p', { class: 'intro', html: (I.intro || '') + ' <b>Tiempo:</b> ' + meta.horas + '.' }),
      I.producto ? h('div', { class: 'aviso-caja info', html: '<b>Producto final:</b> ' + I.producto }) : null));
    // fases
    const fasesCont = h('div', { class: 'fases' });
    const dibujarFases = (resultados) => {
      fasesCont.innerHTML = '';
      I.fases.forEach((f, i) => {
        const r = resultados && resultados[f.id];
        const ok = r && r.every((x) => x.ok);
        fasesCont.appendChild(h('div', { class: 'fase' + (ok ? ' ok' : '') },
          h('div', { class: 'fase-num' }, ok ? '✓' : String(i + 1)),
          h('div', null, h('h3', null, 'Fase ' + (i + 1) + '. ' + f.titulo), f.descripcion ? h('p', { class: 'chico', html: f.descripcion }) : null, LT.modulo.lista(f.pasos, true),
            h('div', { class: 'modulos-fase' }, (f.modulos || []).map((m) => h('a', { class: 'chip', href: P.urlModulo(m), title: C.modulo(m).titulo }, 'M' + m)))),
          h('div', null, r ? h('span', { class: 'chip ' + (ok ? 'ok' : 'pendiente') }, r.filter((x) => x.ok).length + '/' + r.length) : h('span', { class: 'chip' }, (f.pruebas || []).length + ' criterios'))));
      });
    };
    dibujarFases(guardado.detalle || null);
    const res = h('div');
    const procesar = async (archivos) => {
      res.innerHTML = '';
      try {
        const { L, archivo } = await LT.modulo.leerSubidos(archivos);
        const porFase = {};
        let ok = 0, total = 0;
        const bloques = [];
        for (const f of I.fases) {
          const r = LT.revision.revisarConjunto(L, { sol: Object.assign({}, I.sol || {}, f.sol || {}), solNombres: I.solNombres, hoja: f.hoja || I.hoja, pruebas: f.pruebas }, 'analista');
          porFase[f.id] = r.map((x) => ({ ok: x.ok }));
          ok += r.filter((x) => x.ok).length; total += r.length;
          bloques.push(h('div', { class: 'tarea-resultado' + (r.every((x) => x.ok) ? ' ok' : '') }, h('h4', null, 'Fase ' + (I.fases.indexOf(f) + 1) + ' · ' + f.titulo + ' — ' + r.filter((x) => x.ok).length + ' de ' + r.length), LT.modulo.resultadosLista(r, true)));
        }
        const pct = Math.round((ok / Math.max(1, total)) * 100);
        const aprobado = pct >= (I.minimo || 80);
        LT.progreso.proyecto(pid, { puntaje: Math.max(pct, LT.progreso.proyecto(pid).puntaje || 0), ultimo: pct, aprobado: aprobado || !!LT.progreso.proyecto(pid).aprobado, fecha: new Date().toISOString(), archivo: archivo.name, fases: Object.fromEntries(Object.entries(porFase).map(([k, v]) => [k, v.filter((x) => x.ok).length + '/' + v.length])), detalle: porFase });
        dibujarFases(porFase);
        res.append(h('p', null, h('b', null, ok + ' de ' + total + ' criterios superados (' + pct + ' %).'), ' Se aprueba con ' + (I.minimo || 80) + ' % o más.'), ...bloques);
        if (aprobado) res.prepend(h('div', { class: 'exito' }, h('div', { html: C.selloProyecto(pid, { tam: 52, aprobado: true }) }), h('div', null, h('h4', null, '¡Proyecto aprobado!'), h('p', null, 'Completa la autoevaluación con la rúbrica y descarga tu constancia (abajo).'))));
        sello.innerHTML = C.selloProyecto(pid, { tam: 96, aprobado: LT.progreso.proyecto(pid).aprobado });
        dibujarConstancia();
      } catch (e) { console.error(e); res.appendChild(h('div', { class: 'aviso-caja error' }, e.message)); }
    };
    const necesita = [I.acepta || '.xlsx'].concat(I.pdf ? ['.pdf'] : [], I.docx ? ['.docx'] : []);
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Fases del proyecto'), h('p', { class: 'intro' }, 'Trabaja las fases en orden sobre el mismo libro. Cada fase usa lo que aprendiste en los módulos indicados; puedes subir el libro al terminar cada fase para ver tu avance.'), fasesCont));
    main.appendChild(h('div', { class: 'lab-grid' },
      h('div', { class: 'widget' }, h('h3', null, 'Materiales'), I.materiales ? h('p', { html: I.materiales }) : null,
        h('div', { class: 'grupo-btn' }, h('a', { class: 'btn cafe', href: 'proyectos/' + meta.archivo, download: meta.archivo }, LT.icono('descargar', 16), 'Descargar ' + meta.archivo), (I.descargas || []).map((d) => h('a', { class: 'btn chico', href: d.ruta, download: d.ruta.split('/').pop() }, LT.icono('descargar', 15), d.texto))),
        h('h4', { style: { marginTop: '14px' } }, 'Entregables'), LT.modulo.lista(I.entregables || []),
        (I.acepta || '').includes('xlsm') ? h('p', { class: 'chico' }, 'La macro necesita Excel de escritorio; guarda como Libro de Excel habilitado para macros (.xlsm).') : null),
      h('div', { class: 'widget' }, h('h3', null, 'Verificador del proyecto'), LT.modulo.zonaSubir({ acepta: necesita.join(','), multiple: necesita.length > 1, titulo: 'Sube tu proyecto', texto: 'Archivo ' + necesita.join(' + ') + (necesita.length > 1 ? ' (selecciónalos a la vez)' : '') + '.' }, procesar), res)));
    // presentación
    if (I.presentacion) main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Presentación'), h('p', { class: 'intro', html: I.presentacion.intro }), LT.modulo.lista(I.presentacion.guion, true)));
    // rúbrica de autoevaluación
    const sel = Object.assign({}, guardado.rubrica || {});
    const tabla = h('table', { class: 'tabla-sitio rubrica' });
    const RB = I.rubrica || RUBRICA;
    const dibujarRubrica = () => {
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['Inicial (1)', 'En desarrollo (2)', 'Logrado (3)', 'Destacado (4)'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      RB.forEach(([crit, niveles]) => tb.appendChild(h('tr', null, h('th', null, crit), niveles.map((t, j) => h('td', { class: 'clic' + (sel[crit] === j + 1 ? ' sel' : ''), tabindex: '0', onclick: () => { sel[crit] = j + 1; LT.progreso.proyecto(pid, { rubrica: Object.assign({}, sel) }); dibujarRubrica(); } }, t)))));
      tabla.appendChild(tb);
    };
    dibujarRubrica();
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Rúbrica'), h('p', { class: 'intro' }, 'Autoevalúate haciendo clic en el nivel que alcanzaste en cada criterio. El docente revisa la rúbrica junto con tu archivo' + (I.presentacion ? ' y tu presentación' : '') + '.'), h('div', { class: 'tabla-scroll' }, tabla)));
    const constCont = h('section', { class: 'seccion' });
    main.appendChild(constCont);
    const dibujarConstancia = () => {
      constCont.innerHTML = '';
      const info = LT.progreso.proyecto(pid);
      if (!info.aprobado) { constCont.append(h('h2', null, 'Constancia'), h('p', { class: 'intro' }, 'La constancia se habilita al aprobar el proyecto (' + (I.minimo || 80) + ' % de los criterios o más).')); return; }
      const nombre = LT.progreso.participante().nombre || '(escribe tu nombre en la página de inicio)';
      const titulo = pid === 'final' ? 'Constancia de Analista de Datos con Excel' : 'Constancia de Analista ' + nv.nombre;
      const texto = pid === 'final' ? 'por aprobar el proyecto final «' + meta.titulo + '», que integra los niveles básico, intermedio y avanzado del curso Excel de básico a avanzado (' + C.horas + ' horas).' : 'por aprobar el proyecto «' + meta.titulo + '» del nivel ' + nv.nombre.toLowerCase() + ' (' + nv.horas.toLowerCase() + ' del curso Excel de básico a avanzado).';
      constCont.append(h('div', { class: 'grupo-btn no-imprimir' }, h('h2', { style: { margin: 0 } }, 'Constancia'), h('button', { class: 'btn primario chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF')),
        h('div', { class: 'constancia' }, h('div', { html: LT.GALERIA.logoSVG, style: { width: '90px', margin: '0 auto' } }), h('p', null, 'Excel con La Taza otorga la presente'), h('h1', null, titulo), h('p', null, 'a'), h('div', { class: 'nombre' }, nombre), h('p', null, texto), h('p', { style: { color: 'var(--tinta-3)', fontSize: '.9rem' } }, new Date(info.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + ' · Puntaje del verificador: ' + info.puntaje + ' %')));
    };
    dibujarConstancia();
    P.montar(main);
  }
  /* integrador.html (versión 2) redirige al proyecto del nivel */
  function integrador() { location.replace('proyecto.html?p=' + (C.nivel(param('nivel')) ? param('nivel') : 'basico')); }

  /* ========================================================= GLOSARIO */
  function glosario() {
    const main = h('main', { class: 'contenedor' });
    const buscar = h('input', { class: 'buscador', type: 'search', placeholder: 'Buscar en español o inglés (por ejemplo: buscar, IF, contar)', 'aria-label': 'Buscar función' });
    const tabla = h('table', { class: 'tabla-sitio' });
    const dibujar = () => {
      const q = buscar.value.trim().toLowerCase();
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, ['Función (español)', 'En inglés / en el archivo', 'Sintaxis', 'Qué hace', 'Ejemplo de La Taza', 'Módulo'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      Object.values(LT.FUNCIONES).filter((f) => !q || [f.es, f.en, f.desc, f.categoria].some((x) => x.toLowerCase().includes(q))).sort((a, b) => a.es.localeCompare(b.es, 'es')).forEach((f) => {
        tb.appendChild(h('tr', null, h('td', null, h('b', null, f.es), f.simulador ? null : h('div', { style: { fontSize: '.78rem', color: 'var(--ambar)' } }, 'Solo en Excel')), h('td', null, h('code', null, f.en), f.archivo !== f.en ? h('div', { style: { fontSize: '.78rem', color: 'var(--tinta-3)' } }, f.archivo) : null), h('td', null, h('code', { style: { whiteSpace: 'normal' } }, f.sintaxis)), h('td', null, f.desc), h('td', null, f.ejemplo), h('td', null, h('a', { href: P.urlModulo(f.modulo) }, 'M' + f.modulo))));
      });
      tabla.appendChild(tb);
    };
    buscar.addEventListener('input', dibujar);
    dibujar();
    const atajos = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Atajo'), h('th', null, 'Qué hace'), h('th', null, 'Módulo'))), h('tbody', null, LT.ATAJOS.map(([a, d, m]) => h('tr', null, h('td', null, h('kbd', null, a)), h('td', null, d), h('td', null, h('a', { href: P.urlModulo(m) }, 'M' + m))))));
    main.append(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia'), h('h1', null, 'Glosario de funciones español-inglés'), h('p', { class: 'intro' }, 'Excel en español usa nombres traducidos (SUMA, SI, BUSCARX), pero el archivo los guarda en inglés (SUM, IF, _xlfn.XLOOKUP). En México el separador de argumentos es la coma; en otras configuraciones regionales es el punto y coma (el simulador acepta ambos). Para ver cómo trabaja cada función con un ejemplo dibujado, abre la ', h('a', { href: 'funciones.html' }, 'Guía gráfica de funciones'), '.'), buscar),
      h('div', { class: 'tabla-scroll', style: { marginTop: '12px' } }, tabla),
      h('section', { class: 'seccion' }, h('h2', null, 'Atajos de teclado'), h('p', { class: 'intro' }, 'Atajos de Excel para Windows en español. En Mac, Ctrl suele ser ⌘.'), h('div', { class: 'tabla-scroll' }, atajos)));
    P.montar(main);
  }

  LT.paginas = { inicio, ubicacion, proyecto, integrador, glosario, PRUEBAS, RUBRICA, NIVEL_TXT, INTEGRADORES: {} };
})();
