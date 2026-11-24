/* Módulo 22 · Análisis de hipótesis */
(function () {
  const { D, ENC } = LT.caso;
  const E = D.equilibrio;
  const fijos = E.costosFijos.reduce((s, c) => s + c.monto, 0);
  const equilibrio = fijos / (E.precio - E.costoVariable);
  const datosModelo = [
    ['Punto de equilibrio · Cafetería La Taza'], [],
    ['Precio promedio por café', E.precio],
    ['Costo variable por café', E.costoVariable],
    ['Cafés vendidos al mes', E.cafes], [],
    ['Costos fijos mensuales'],
    ...E.costosFijos.map((c) => [c.concepto, c.monto]),
    ['Total costos fijos', '=SUMA(B8:B11)'], [],
    ['Ingresos', '=B3*B5'], ['Costos variables', '=B4*B5'], ['Utilidad', '=B14-B15-B12'],
  ];
  const hojaModelo = (extra) => ({ hojas: [{ nombre: 'Modelo', datos: datosModelo, celdas: Object.assign({ D2: 'Cafés completos' }, extra || {}), formatos: { 'B3:B4': '$#,##0.00', B5: '#,##0.00', 'B8:B16': '$#,##0', 'E14:E19': '$#,##0' }, estilos: { A1: { b: true, fs: 15 }, 'A3:A5': { bg: '#fff8d6' }, A7: { b: true }, 'A12:B12': { b: true }, 'A16:B16': { b: true, bd: { t: 1, b: 2 } }, D2: { b: true } }, anchos: { A: 200, B: 110, C: 30, D: 130, E: 110 }, filas: 22, cols: 7 }], herramientas: ['analisis', 'formulas'], altura: 430 });
  const cerca = (a, b, t) => typeof a === 'number' && Math.abs(a - b) <= t;
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Buscar objetivo: utilidad en cero', fn: (x) => {
      if (String(x.entrada('B5')).startsWith('=')) return 'B5 debe quedar como valor (Buscar objetivo cambia la celda por ti), no como fórmula.';
      if (!String(x.entrada('B16')).startsWith('=')) return 'B16 debe seguir siendo una fórmula: no escribas la utilidad a mano.';
      return cerca(x.valor('B5'), equilibrio, 0.5) && cerca(x.valor('B16'), 0, 20) ? true : 'La utilidad (B16) no está en cero: usa Buscar objetivo (definir B16, valor 0, cambiando B5). B5 muestra ' + LT.verificador.mostrar(x.valor('B5')) + '.';
    } },
    { tipo: 'usa', rango: 'D3', funciones: ['REDONDEAR.MAS'], titulo: 'Cafés completos con REDONDEAR.MAS', mensaje: 'En D3 redondea B5 hacia arriba con REDONDEAR.MAS (no se venden fracciones de café).' },
    { tipo: 'fn', titulo: 'Cafés completos correctos', fn: (x) => (x.valor('D3') === Math.ceil(x.valor('B5') - 1e-9) ? true : 'D3 debería mostrar ' + Math.ceil(x.valor('B5') - 1e-9) + '.') },
    { tipo: 'fn', titulo: 'Tres escenarios de costos', fn: (x) => {
      const esc = x.estado.escenarios;
      const req = { base: [28000, 96000], 'renta sube': [33000, 96000], 'más personal': [28000, 110000] };
      for (const [n, vals] of Object.entries(req)) {
        const e = esc.find((y) => y.nombre.trim().toLowerCase() === n);
        if (!e) return 'Falta el escenario «' + n[0].toUpperCase() + n.slice(1) + '» (Escenarios › Agregar).';
        if (e.celdas.replace(/\$/g, '') !== 'B8:B9') return 'Las celdas cambiantes de «' + e.nombre + '» deben ser B8:B9 (Renta y Sueldos).';
        if (e.valores.map((v) => +String(v).replace(/[$,]/g, '')).join() !== vals.join()) return 'Los valores de «' + e.nombre + '» deben ser Renta ' + vals[0] + ' y Sueldos ' + vals[1] + '.';
      }
      return true;
    } },
  ];

  LT.definirModulo({
    id: 22,
    objetivo: 'Responder preguntas «¿qué pasaría si…?» con Buscar objetivo, Escenarios y Tablas de datos.',
    situacion: 'Estamos pensando abrir los domingos. Antes quiero saber: <b>¿cuántos cafés al mes necesitamos vender para no perder dinero?</b> ¿Y qué pasa si sube la renta o contratamos más personal?',
    explicacion: [
      { html: '<h3>Un modelo: entradas → fórmulas → resultado</h3><p>El modelo de la hoja calcula la <b>utilidad</b> (B16) a partir de entradas: precio, costo variable, cafés vendidos y costos fijos. Con el modelo armado, Excel responde preguntas «¿qué pasaría si…?» (Datos › Análisis de hipótesis):</p><ul><li><b>Buscar objetivo:</b> trabaja hacia atrás. «Quiero que B16 valga 0; ¿qué valor debe tener B5?»</li><li><b>Administrador de escenarios:</b> guarda conjuntos de entradas con nombre (Base, Renta sube…), los muestra y crea un <b>resumen</b> comparativo.</li><li><b>Tabla de datos:</b> calcula el resultado para muchos valores de una entrada a la vez (por ejemplo, utilidad con 5 precios distintos).</li></ul>' },
      { titulo: 'Juega con el modelo', instr: 'Cambia el precio o los cafés vendidos (celdas amarillas) y observa la utilidad.', hoja: hojaModelo() },
    ],
    ejemplo: {
      titulo: '¿Ganamos o perdemos?', hoja: hojaModelo(), celda: 'B16', formula: '=B14-B15-B12',
      pregunta: '¿Qué utilidad mostrará B16 con 3,000 cafés?', respuesta: E.cafes * (E.precio - E.costoVariable) - fijos, formato: '$#,##0',
      explicacion: ['Ingresos (B14) = 3,000 × $' + E.precio + ' = $' + LT.u.formatoMiles(E.cafes * E.precio) + '.', 'Costos variables (B15) = 3,000 × $' + E.costoVariable + ' = $' + LT.u.formatoMiles(E.cafes * E.costoVariable) + '.', 'Utilidad = ingresos − costos variables − costos fijos ($' + LT.u.formatoMiles(fijos) + ') = <b>$' + LT.u.formatoMiles(E.cafes * (E.precio - E.costoVariable) - fijos) + '</b>: con 3,000 cafés se pierde dinero.'],
    },
    micro: [
      { titulo: 'Elegir la herramienta', tipo: 'opcion', enunciado: '¿Qué herramienta usas para saber cuántos cafés hay que vender para que la utilidad sea exactamente 0?', opciones: ['Buscar objetivo', 'Tabla de datos', 'Ordenar', 'Formato condicional'], correcta: 0, explicacion: 'Buscar objetivo ajusta una entrada hasta que una fórmula llegue al valor que quieres.' },
      { titulo: 'Buscar objetivo', tipo: 'hoja', enunciado: 'Con 3,000 cafés, ¿qué <b>precio promedio</b> (B3) da una utilidad de <b>$20,000</b>? Usa Buscar objetivo.',
        hoja: hojaModelo(), solucion: {},
        pruebas: [{ tipo: 'fn', fn: (x) => { if (String(x.entrada('B3')).startsWith('=')) return 'B3 debe quedar como valor.'; return cerca(x.valor('B16'), 20000, 5) ? true : 'B16 no vale $20,000: Buscar objetivo › Definir la celda B16, con el valor 20000, cambiando la celda B3.'; } }],
        pista: ['Botón «Buscar objetivo»: Definir la celda <b>B16</b>, Con el valor <b>20000</b>, Para cambiar la celda <b>B3</b>.'] },
    ],
    reto: {
      titulo: '¿Cuántos cafés hay que vender para no perder?', tipo: 'hoja', intro: 'La hoja <i>Modelo</i> calcula la utilidad mensual de la cafetería.',
      base: {
        hoja: hojaModelo(), pruebas: pruebasBase,
        instrucciones: ['Con <b>Buscar objetivo</b>, encuentra cuántos cafés al mes (B5) hacen que la utilidad (B16) sea 0.', 'En <b>D3</b> calcula los cafés completos necesarios: redondea B5 hacia arriba con REDONDEAR.MAS.', 'Crea tres <b>escenarios</b> con celdas cambiantes B8:B9 (Renta, Sueldos): «Base» (28000, 96000), «Renta sube» (33000, 96000) y «Más personal» (28000, 110000).'],
        pistas: ['Las tres herramientas están en la sección Análisis de hipótesis de la barra.', 'Buscar objetivo: Definir la celda B16, Con el valor 0, Para cambiar la celda B5. En D3: =REDONDEAR.MAS(B5,0).', 'Escenarios › Agregar… › nombre «Base», celdas cambiantes B8:B9 › valores 28000 y 96000; repite para los otros dos.'],
      },
      niveles: {
        explorador: { instrucciones: ['Botón <b>Buscar objetivo</b>: Definir la celda <b>B16</b>; Con el valor <b>0</b>; Para cambiar la celda <b>B5</b> › Aceptar.', 'En D3 escribe <code>=REDONDEAR.MAS(B5,0)</code>.', 'Botón <b>Escenarios</b> › Agregar…: «Base», celdas B8:B9, valores 28000 y 96000. Repite con «Renta sube» (33000, 96000) y «Más personal» (28000, 110000).'] },
        experto: {
          hoja: hojaModelo({ D13: 'Precio', E13: 'Utilidad', D14: '', E14: '=B16', D15: '44', D16: '48', D17: '52', D18: '56', D19: '60' }),
          instrucciones: ['Resuelve Buscar objetivo, D3 y los tres escenarios como en el nivel Analista.', 'Arma una <b>tabla de datos</b> en D14:E19: la utilidad (E14 =B16) para los precios de D15:D19, con celda de entrada (columna) B3. Hazla después de Buscar objetivo.'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Tabla de datos de precios', fn: (x) => {
            const td = x.estado.hojas[0].tablasDatos.find((t) => t.rango === 'D14:E19');
            if (!td) return 'Selecciona D14:E19 y usa Tabla de datos con celda de entrada (columna) B3.';
            const cafes = x.valor('B5');
            for (let r = 15; r <= 19; r++) { const p = x.valor('D' + r); const esp = cafes * (p - E.costoVariable) - fijos; if (!cerca(x.valor('E' + r), esp, 1)) return 'E' + r + ' debería ser ' + LT.verificador.mostrar(esp) + ' (con los cafés actuales de B5). ¿Elegiste B3 como celda de entrada de columna?'; }
            return true;
          } }],
        },
      },
    },
    lab: {
      archivo: 'lab22-equilibrio.xlsx', titulo: 'Punto de equilibrio de la sucursal Norte',
      contexto: 'El mismo modelo con los costos de Norte.',
      pasos: {
        explorador: [{ texto: 'Buscar objetivo: B16 con valor 0 cambiando B5.', ruta: ['Datos', 'Análisis de hipótesis', 'Buscar objetivo…'] }, 'D3: =REDONDEAR.MAS(B5,0).', { texto: 'Tres escenarios con celdas B8:B9.', ruta: ['Datos', 'Análisis de hipótesis', 'Administrador de escenarios…'] }, 'Guarda y sube el libro.'],
        analista: ['Encuentra con Buscar objetivo los cafés de equilibrio (B5) y redondéalos en D3.', 'Crea los escenarios Base, Renta sube (+5,000 de renta) y Más personal (+14,000 de sueldos) sobre B8:B9.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Tabla de datos en D14:E19 con la utilidad para distintos precios (celda de entrada B3).', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Utilidad en cero con Buscar objetivo', fn: (L, A) => { A.hoja('Modelo'); if (L.tieneFormula('Modelo', 'B5')) return 'B5 debe ser un valor, no una fórmula.'; if (!L.tieneFormula('Modelo', 'B16')) return 'B16 debe seguir siendo fórmula.'; return Math.abs(A.num(L.valor('Modelo', 'B16'))) < 20 ? true : 'La utilidad (B16) es ' + A.fmtEs(L.valor('Modelo', 'B16')) + ': usa Buscar objetivo para llevarla a 0.'; } },
        { titulo: 'Cafés completos (D3)', fn: (L, A) => (L.usaFuncion('Modelo', 'D3', 'ROUNDUP') && A.num(L.valor('Modelo', 'D3')) === Math.ceil(A.num(L.valor('Modelo', 'B5')) - 1e-9) ? true : 'D3 debe redondear B5 hacia arriba con REDONDEAR.MAS.') },
        { titulo: 'Tres escenarios', fn: (L) => { const e = L.hoja('Modelo').escenarios; if (e.length < 3) return 'Encontré ' + e.length + ' escenarios; deben ser 3.'; return e.every((x) => x.celdas.some((c) => /B8/.test(c.ref)) && x.celdas.some((c) => /B9/.test(c.ref))) ? true : 'Las celdas cambiantes de los escenarios deben ser B8:B9.'; } },
        { titulo: 'Tabla de datos', nivel: 'experto', fn: (L) => { const t = L.hoja('Modelo').tablasDatos; return t.length && t.some((x) => /B3/i.test(x.r1 || '')) ? true : 'Crea la tabla de datos (Análisis de hipótesis › Tabla de datos) con celda de entrada B3.'; } },
      ],
    },
    donde: [
      { comando: 'Buscar objetivo', ruta: ['Datos', 'Análisis de hipótesis', 'Buscar objetivo…'] },
      { comando: 'Administrador de escenarios', ruta: ['Datos', 'Análisis de hipótesis', 'Administrador de escenarios…'], nota: 'Excel para la web no tiene escenarios: usa Excel de escritorio.' },
      { comando: 'Tabla de datos', ruta: ['Datos', 'Análisis de hipótesis', 'Tabla de datos…'] },
    ],
    glosario: ['REDONDEAR.MAS', 'REDONDEAR.MENOS', 'PAGO'],
    atajos: ['El resumen de escenarios crea una hoja nueva comparando todas las entradas y resultados.', 'Una tabla de datos se recalcula sola cuando cambia el modelo.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const modelo = `<figure class="figura-explica"><svg viewBox="0 0 620 170" role="img" aria-label="Modelo de entradas, cálculos y resultado">
  <g font-family="Segoe UI,Arial" font-size="12">
  <rect x="10" y="20" width="170" height="110" rx="10" fill="#fff8d6" stroke="#b7950b"/><text x="95" y="42" text-anchor="middle" font-weight="700">Entradas (supuestos)</text><text x="22" y="66">Precio promedio: $52</text><text x="22" y="86">Costo variable: $14</text><text x="22" y="106">Cafés al mes: 3,000</text>
  <rect x="225" y="20" width="170" height="110" rx="10" fill="#e7effc" stroke="#2259b8"/><text x="310" y="42" text-anchor="middle" font-weight="700">Cálculos</text><text x="237" y="66">Ingresos = precio × cafés</text><text x="237" y="86">Costos = fijos + variable × cafés</text>
  <rect x="440" y="20" width="170" height="110" rx="10" fill="#e2f1e8" stroke="#1e7145"/><text x="525" y="42" text-anchor="middle" font-weight="700">Resultado</text><text x="452" y="70">Utilidad = ingresos − costos</text>
  <path d="M180 75 L225 75" stroke="#555" stroke-width="2" marker-end="url(#fa)"/><path d="M395 75 L440 75" stroke="#555" stroke-width="2" marker-end="url(#fa)"/>
  <defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#555"/></marker></defs>
  <text x="10" y="156">Buscar objetivo va del resultado a una entrada · Escenarios guardan juegos de entradas · Tabla de datos prueba muchos valores · Solver optimiza con restricciones.</text></g></svg></figure>`;
  LT.ampliarModulo(22, {
    objetivos: [
      'Organizar un modelo en entradas, cálculos y resultado para poder hacer preguntas «¿qué pasaría si…?».',
      'Encontrar con Buscar objetivo la entrada que produce un resultado deseado (punto de equilibrio).',
      'Guardar, mostrar y resumir escenarios (pesimista, base, optimista).',
      'Construir tablas de datos de una y dos variables.',
      'Reconocer cuándo usar Solver (optimizar con restricciones) y la previsión con Hoja de previsión.',
    ],
    detalle: [
      { titulo: 'Un modelo bien armado', abierto: true, html: modelo },
      { titulo: '¿Qué herramienta uso?', html: '<table><tr><th>Pregunta</th><th>Herramienta</th><th>Ruta</th></tr><tr><td>¿Cuántos cafés necesito para utilidad 0?</td><td>Buscar objetivo</td><td>Datos › Análisis de hipótesis › Buscar objetivo</td></tr><tr><td>¿Cómo queda el mes si las cosas van mal, normal o bien?</td><td>Escenarios (y Resumen)</td><td>Datos › Análisis de hipótesis › Administrador de escenarios</td></tr><tr><td>¿Cuál sería la utilidad con 2,000, 2,500, … 4,000 cafés?</td><td>Tabla de datos de una variable</td><td>Datos › Análisis de hipótesis › Tabla de datos</td></tr><tr><td>¿Y combinando precios y cantidades?</td><td>Tabla de datos de dos variables</td><td>Ídem (celda de entrada de fila y de columna)</td></tr><tr><td>¿Qué mezcla de productos maximiza la utilidad sin pasar de 8 horas de horno?</td><td>Solver (complemento)</td><td>Datos › Solver</td></tr><tr><td>¿Cuánto venderemos los próximos meses?</td><td>Hoja de previsión</td><td>Datos › Previsión › Hoja de previsión</td></tr></table>' },
      { titulo: 'Escenarios y su informe', html: '<p>Un <b>escenario</b> guarda valores para las celdas cambiantes (precio, costo variable, cafés). Con <b>Mostrar</b> los pones en el modelo; con <b>Resumen</b> Excel crea una hoja que compara los resultados de todos los escenarios lado a lado. Nombra las celdas (Precio, Cafés, Utilidad) antes: el resumen usa esos nombres y se lee mucho mejor.</p>' },
      { titulo: 'Tabla de datos: cómo se arma', html: '<ol><li>En una columna escribe los valores a probar (2,000 a 4,000 cafés).</li><li>Una fila arriba y una columna a la derecha, escribe <code>=B16</code> (la celda de utilidad).</li><li>Selecciona todo el bloque y usa Tabla de datos con «Celda de entrada (columna)» = la celda de cafés.</li></ol><p>Excel escribe <code>{=TABLA(;B5)}</code> en los resultados: no se editan una por una y se recalculan al cambiar el modelo. Con dos variables, la fórmula va en la esquina y se definen ambas celdas de entrada.</p>' },
    ],
    errores: [
      'Escribir números dentro de las fórmulas del modelo: Buscar objetivo y escenarios no tienen qué cambiar.',
      'Usar Buscar objetivo sobre una celda de entrada que contiene una fórmula (debe ser un valor).',
      'Olvidar redondear: «2,453.3 cafés» no se pueden vender (REDONDEAR.MAS).',
      'Escenarios con celdas sin nombre: el resumen muestra solo direcciones como $B$5.',
    ],
    consejos: [
      'Colorea las entradas (amarillo) y protege los cálculos.',
      'Guarda el escenario «Base» antes de probar los demás para poder regresar.',
      'Acompaña cada análisis con una conclusión en una frase para la gerente.',
      'Solver se activa en Archivo › Opciones › Complementos › Solver.',
    ],
    microExtra: [
      { titulo: 'Optimizar con restricciones', tipo: 'opcion', enunciado: 'Quieres saber cuántos panes de cada tipo hornear para <b>maximizar la utilidad</b>, sin pasar de 8 horas de horno ni de 40 kg de harina. ¿Qué herramienta usas?', opciones: ['Solver', 'Buscar objetivo', 'Escenarios', 'Tabla dinámica'], correcta: 0, explicacion: 'Solver cambia varias celdas a la vez para maximizar o minimizar un resultado respetando restricciones. Buscar objetivo cambia una sola celda para llegar a un valor fijo.', retro: { 1: 'Buscar objetivo solo cambia una celda y busca un valor exacto, no un máximo con restricciones.' } },
    ],
    autoeval: [
      { p: '¿Qué tres datos pide Buscar objetivo?', r: 'La celda que quieres fijar (resultado), el valor que debe alcanzar y la celda de entrada que Excel cambiará.' },
      { p: '¿Por qué el modelo debe tener las entradas en celdas propias?', r: 'Porque las herramientas de hipótesis solo pueden cambiar celdas con valores; si el dato está dentro de una fórmula, no hay qué cambiar.' },
      { p: '¿Qué diferencia hay entre escenarios y tabla de datos?', r: 'Los escenarios guardan unos pocos juegos de varias entradas con nombre; la tabla de datos prueba muchos valores de una o dos entradas a la vez.' },
      { p: 'Buscar objetivo dice que necesitas 2,453.33 cafés. ¿Qué reportas?', r: '2,454 cafés: no se venden fracciones, se redondea hacia arriba (REDONDEAR.MAS).' },
      { p: '¿Qué hace el botón Resumen del administrador de escenarios?', r: 'Crea una hoja que compara las entradas y los resultados de todos los escenarios lado a lado.' },
      { p: '¿Cuándo usarías Solver en lugar de Buscar objetivo?', r: 'Cuando quieres maximizar o minimizar un resultado cambiando varias celdas y con restricciones.' },
    ],
    conexiones: [
      { id: 9, texto: 'supuestos en celdas propias y referencias fijas.' },
      { id: 16, texto: 'proteger el modelo dejando libres solo las entradas.' },
      { proyecto: 'final', texto: 'el plan de la sucursal Poniente decide la apertura con un punto de equilibrio y escenarios.' },
    ],
  });
})();
