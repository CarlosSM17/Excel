/* Módulo 9 · Referencias, nombres y decisiones con SI */
(function () {
  const { D, ENC } = LT.caso;
  const emp = D.empleados;
  const datosVentas = [['Vendedor', 'Sucursal', 'Ventas del mes', 'Comisión', 'Meta mensual', 10000], ...emp.map((e, i) => [e.nombre, e.sucursal, e.ventasMes, '', i === 0 ? 'Tasa de comisión' : i === 2 ? 'Alcanzaron la meta' : '', i === 0 ? '5%' : ''])];
  const hojaVentas = (extra) => ({
    nombre: 'Ventas', datos: datosVentas,
    formatos: { 'C2:C21': '$#,##0', 'D2:D21': '$#,##0.00', F1: '$#,##0', F2: '0%', H1: '$#,##0', H2: '0%' },
    estilos: { 'A1:D1': ENC, 'E1:E4': { b: true } }, anchos: { A: 140, B: 82, C: 110, D: 100, E: 150, F: 86, G: 90, H: 80 },
    objetivo: 'D2:D21,F4', inmovilizar: { filas: 1 }, celdas: extra || {},
  });
  const pruebasBase = (conOro) => [
    { tipo: 'formula', rango: 'D2:D21', mensaje: '{celda} tiene un número escrito; usa una fórmula para que se actualice sola.', mensajeVacia: '{celda} está vacía: calcula la comisión de cada vendedor (copia la fórmula hasta D21).', titulo: 'Las comisiones D2:D21 son fórmulas' },
    { tipo: 'valores', rango: 'D2:D21', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}: revisa la comparación (¿>= incluye a quien llega exacto a la meta?).', titulo: 'Las comisiones son correctas' },
    { tipo: 'formula', rango: 'F4', mensaje: 'F4 tiene un número escrito: cuenta con una fórmula para que cambie si cambian las ventas.', mensajeVacia: 'Falta F4: cuenta cuántos vendedores alcanzaron la meta.', titulo: 'F4 usa una fórmula' },
    { tipo: 'valores', rango: 'F4', mensaje: 'F4 muestra {obtenido}, pero {esperado} vendedores alcanzaron la meta.', titulo: 'F4 cuenta bien a quienes alcanzaron la meta' },
    { tipo: 'usa', rango: 'F4', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'Para contar con una condición usa CONTAR.SI en F4.', titulo: 'F4 usa CONTAR.SI' },
    { tipo: 'robustez', cambios: conOro ? [{ F1: 8000, F2: 0.07 }, { H1: 13000, H2: 0.09 }] : { F1: 8000, F2: 0.07 }, rango: 'D2:D21,F4', mensaje: conOro ? 'Al cambiar las metas y las tasas, {celda} no se actualizó: ¿fijaste F1, F2, H1 y H2 con signos de pesos?' : 'Al cambiar la meta a 8,000 y la tasa a 7 %, {celda} no se actualizó: ¿fijaste F2 (y F1) con signos de pesos?', titulo: 'Resiste cambios de meta y tasa (referencias absolutas)' },
  ];

  LT.definirModulo({
    id: 9,
    objetivo: 'Fijar referencias con $ (absolutas y mixtas), nombrar rangos y tomar decisiones con SI, SI anidados, SI.CONJUNTO, Y, O y NO.',
    situacion: 'Necesito saber <b>cuánto pagar de comisión este mes</b> y <b>cuántos vendedores alcanzaron la meta</b>. La meta es de $10,000 y la comisión es del 5 % de las ventas para quien la alcance.',
    explicacion: [
      { html: '<h3>Referencias que se mueven y referencias fijas</h3><p>Cuando copias una fórmula, Excel ajusta sus referencias: <code>=C2*F2</code> copiada una fila abajo se convierte en <code>=C3*F3</code>. Eso es útil para C (cada vendedor tiene sus ventas), pero no para F2: la tasa está en una sola celda. Para fijarla se usan signos de pesos: <code>$F$2</code>. Al escribir la fórmula, pon el cursor en la referencia y pulsa <kbd>F4</kbd>: <code>F2 → $F$2 → F$2 → $F2</code>.</p>' },
      { widget: 'copiarReferencias', titulo: 'Pruébalo: copia la comisión hacia abajo', instr: 'La fórmula de D2 multiplica las ventas por la tasa, que está en F1. Cambia el tipo de referencia de F1 y observa qué pasa al copiarla hasta D6. Pasa el cursor sobre cada fila para ver a qué celdas apunta.', opts: { datos: [['Vendedor', 'Sucursal', 'Ventas', 'Comisión', 'Tasa', 0.05], ...emp.slice(0, 5).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formula: '=C2*F1', celda: 'D2', hasta: 'D6', formatos: { 2: '$#,##0', 5: '0%' }, valorCorrecto: (r) => emp[r - 1].ventasMes * 0.05, formatoResultado: '$#,##0.00', instruccion: '' } },
      { html: '<h3>Decidir con SI, Y, O</h3><ul><li><code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>: elige entre dos resultados. Ejemplo: <code>=SI(C2&gt;=$F$1, C2*$F$2, 0)</code>.</li><li>La <b>prueba lógica</b> es una comparación que da VERDADERO o FALSO: <code>=</code>, <code>&lt;&gt;</code> (distinto), <code>&gt;</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&lt;=</code>. Los textos van entre comillas: <code>B2="Centro"</code>.</li><li><code>Y(…)</code> es verdadero si <b>todas</b> las condiciones se cumplen; <code>O(…)</code> si se cumple <b>al menos una</b>; <code>NO(…)</code> invierte: <code>=SI(Y(C2&gt;=10000, B2="Centro"), "Bono", "")</code>.</li></ul><h3>Un adelanto: contar con condición</h3><p>Para saber cuántos vendedores alcanzaron la meta se usa <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>: el <code>&amp;</code> une el operador con el valor de la celda. En el módulo 10 verás a fondo CONTAR.SI, SUMAR.SI y sus versiones con varias condiciones.</p><h3>Rangos con nombre</h3><p>Selecciona F1, escribe <b>Meta</b> en el cuadro de nombres (a la izquierda de la barra de fórmulas) y pulsa Enter: ahora puedes escribir <code>=C2&gt;=Meta</code>. Un nombre es <b>absoluto por naturaleza</b> (no se mueve al copiar) y hace que la fórmula se lea como una frase. Se revisan en Fórmulas › Administrador de nombres (<kbd>Ctrl</kbd>+<kbd>F3</kbd>).</p><h3>Redondear de verdad</h3><p><code>=REDONDEAR(C2*$F$2, 2)</code> cambia el valor (no solo cómo se ve): úsalo cuando el resultado se paga o se factura.</p>' },
    ],
    ejemplo: {
      titulo: 'Comisión de Andrea Solís',
      hoja: { hojas: [Object.assign(hojaVentas(), { objetivo: null, filas: 10 })], altura: 200 },
      celda: 'D2', formula: '=SI(C2>=$F$1, C2*$F$2, 0)',
      pregunta: '¿Cuánto mostrará D2?', respuesta: emp[0].ventasMes * 0.05, formato: '$#,##0.00',
      explicacion: [
        'La prueba es <code>C2&gt;=$F$1</code>: ¿' + LT.u.formatoMiles(emp[0].ventasMes) + ' es mayor o igual que 10,000? <b>Sí</b>, es VERDADERO.',
        'Como la prueba es verdadera, SI devuelve el segundo argumento: <code>C2*$F$2</code> = ' + LT.u.formatoMiles(emp[0].ventasMes) + ' × 5 % = <b>$' + LT.u.formatoMiles(emp[0].ventasMes * 0.05, 2) + '</b>.',
        'Si las ventas fueran menores, devolvería el tercer argumento: <b>0</b>.',
        'Los signos de pesos en <code>$F$1</code> y <code>$F$2</code> hacen que, al copiar la fórmula hacia abajo, todas las filas usen la misma meta y la misma tasa.',
      ],
    },
    micro: [
      {
        titulo: 'Fija la referencia', tipo: 'widget',
        enunciado: 'El precio con IVA se calcula con <code>=B2*(1+F1)</code>, pero al copiarlo hacia abajo deja de funcionar. Cambia el tipo de referencia de F1 hasta que todas las filas den el resultado correcto.',
        crear: (c, listo) => LT.widgets.copiarReferencias(c, { datos: [['Producto', 'Precio', 'Con IVA', '', 'IVA', 0.16], ...D.productos.slice(0, 5).map((p) => [p.nombre, p.precio])], formula: '=B2*(1+F1)', celda: 'C2', hasta: 'C6', formatos: { 1: '$#,##0', 5: '0%' }, valorCorrecto: (r) => D.productos[r - 1].precio * 1.16, formatoResultado: '$#,##0.00', instruccion: '', alCambiar: (e) => { if (e.todasBien) listo(); } }),
      },
      {
        titulo: 'Rango con nombre', tipo: 'hoja',
        enunciado: 'Selecciona F1, escribe <b>Meta</b> en el cuadro de nombres y pulsa Enter. Después, en D2:D6 escribe una fórmula que muestre «Sí» si las ventas alcanzan la meta y «No» si no, <b>usando el nombre Meta</b>.',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Vendedor', 'Sucursal', 'Ventas', '¿Meta?', 'Meta', 10000], ...emp.slice(5, 10).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formatos: { 'C2:C6': '$#,##0', F1: '$#,##0' }, estilos: { 'A1:D1': ENC, E1: { b: true } }, anchos: { A: 140 }, objetivo: 'D2:D6' }], herramientas: ['formulas'] },
        solucion: { 'D2:D6': '=SI(C2>=Meta,"Sí","No")' }, nombresSolucion: { Meta: '=Ventas!$F$1' },
        pruebas: [
          { tipo: 'fn', fn: (x) => (x.estado.nombres.Meta && /\$F\$1$/i.test(x.estado.nombres.Meta) ? true : 'Todavía no existe el nombre «Meta» para F1: selecciona F1, escribe Meta en el cuadro de nombres y pulsa Enter.') },
          { tipo: 'formula', rango: 'D2:D6' },
          { tipo: 'contiene', rango: 'D2:D6', texto: 'META', mensaje: 'En {celda} usa el nombre Meta en lugar de F1.' },
          { tipo: 'valores', rango: 'D2:D6' },
        ],
        pista: ['El cuadro de nombres es la casilla donde normalmente dice «F1».', 'La fórmula de D2 es <code>=SI(C2&gt;=Meta,"Sí","No")</code>; luego cópiala hasta D6.'],
      },
    ],
    reto: {
      titulo: 'Comisiones de los vendedores', tipo: 'hoja',
      intro: 'En la hoja <i>Ventas</i>, la columna A tiene 20 vendedores (filas 2 a 21), B la sucursal y C las ventas del mes. En F1 está la meta mensual y en F2 la tasa de comisión.',
      base: {
        hoja: { hojas: [hojaVentas()], herramientas: ['portapapeles', 'formulas'] },
        solucion: { 'D2:D21': '=SI(C2>=$F$1, C2*$F$2, 0)', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
        pruebas: pruebasBase(false),
        instrucciones: ['En <b>D2</b>, calcula la comisión: si las ventas alcanzan la meta, ventas × tasa; si no, 0. Cópiala hasta <b>D21</b>.', 'En <b>F4</b>, cuenta cuántos vendedores alcanzaron la meta.'],
        pistas: ['Necesitas una función que elija entre dos resultados.', 'Su forma es <code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>; para contar con condición: <code>=CONTAR.SI(rango, criterio)</code>.', 'Al copiar hacia abajo, F1 se vuelve F2, F3…: fíjala con <code>$F$1</code> (tecla F4). En F4: <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'D2', texto: '=SI(C2>=___, C2*___, 0)', copiar: 'D21' },
          instrucciones: ['Completa los huecos de la fórmula: la meta está en <b>F1</b> y la tasa en <b>F2</b>. Usa <b>$</b> para fijarlas (por ejemplo <code>$F$1</code>).', 'Pulsa «Escribir en D2» y copia D2 hasta D21 arrastrando el cuadrito verde (controlador de relleno).', 'En <b>F4</b> escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
        },
        experto: {
          hoja: { hojas: [hojaVentas({ G1: 'Meta oro', H1: '15000', G2: 'Tasa oro', H2: '8%' })], herramientas: ['portapapeles', 'formulas'] },
          solucion: { 'D2:D21': '=SI(C2>=$H$1, C2*$H$2, SI(C2>=$F$1, C2*$F$2, 0))', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
          pruebas: pruebasBase(true),
          instrucciones: ['Comisión escalonada en <b>D2:D21</b>: 8 % (H2) desde la meta oro de $15,000 (H1); 5 % (F2) desde la meta de F1; 0 si no se alcanza. Resuélvelo con <b>SI anidados</b> en una sola fórmula.', 'En <b>F4</b>, cuenta cuántos vendedores alcanzaron la meta de F1.'],
          pistas: ['Evalúa primero la condición más exigente (la meta oro).', '<code>=SI(prueba1, valor1, SI(prueba2, valor2, 0))</code>', '<code>=SI(C2&gt;=$H$1, C2*$H$2, SI(C2&gt;=$F$1, C2*$F$2, 0))</code>'],
        },
      },
    },
    lab: {
      archivo: 'lab09-comisiones.xlsx', titulo: 'Comisiones de noviembre',
      contexto: 'El mismo cálculo con las ventas de noviembre, y un resumen de comisiones por sucursal.',
      pasos: {
        explorador: [
          { texto: 'En la hoja <b>Ventas</b>, escribe en D2 <code>=SI(C2&gt;=$F$1, C2*$F$2, 0)</code> y cópiala hasta D21.' },
          { texto: 'En F4 escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.' },
          { texto: 'En F8, F9 y F10 suma las comisiones de Centro, Norte y Sur: <code>=SUMAR.SI($B$2:$B$21, E8, $D$2:$D$21)</code> y cópiala.', ruta: ['Fórmulas', 'Insertar función'] },
          'Guarda el libro (Ctrl+G) y súbelo aquí.',
        ],
        analista: ['En <b>D2:D21</b>, calcula la comisión de cada vendedor (meta en F1, tasa en F2).', 'En <b>F4</b>, cuenta cuántos alcanzaron la meta.', 'En <b>F8:F10</b>, suma las comisiones por sucursal con SUMAR.SI.', 'Guarda y sube el libro.'],
        experto: ['Resuelve D2:D21, F4 y F8:F10 como en el nivel Analista.', 'Asigna el nombre <b>Meta</b> a F1 y úsalo en las fórmulas de la columna D.', 'En <b>G8:G10</b>, calcula el promedio de ventas de cada sucursal con PROMEDIO.SI.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'D2:D21 tiene fórmulas', fn: (L, A) => { A.hoja('Ventas'); const x = A.sinFormula('Ventas', 'D2:D21'); return x ? x.dir + ' no tiene fórmula: calcula la comisión con SI.' : true; } },
        { titulo: 'Las comisiones son correctas', fn: (L, A) => {
          const meta = A.num(L.valor('Ventas', 'F1')), tasa = A.num(L.valor('Ventas', 'F2'));
          const mal = A.valoresMal('Ventas', 'D2:D21', (d, r) => { const v = A.num(L.valor('Ventas', 'C' + (r + 1))); return v >= meta ? v * tasa : 0; });
          return mal ? mal.dir + ' muestra ' + A.fmtEs(mal.v) + ' y debería ser ' + A.fmtEs(mal.e) + '.' : true;
        } },
        { titulo: 'F4 cuenta con CONTAR.SI', fn: (L, A) => {
          const meta = A.num(L.valor('Ventas', 'F1'));
          const n = L.celdasRango('C2:C21').filter((x) => A.num(L.valor('Ventas', x.dir)) >= meta).length;
          if (!L.usaFuncion('Ventas', 'F4', ['COUNTIF', 'COUNTIFS'])) return 'F4 debe usar CONTAR.SI.';
          return A.cerca(A.num(L.valor('Ventas', 'F4')), n) ? true : 'F4 muestra ' + A.fmtEs(L.valor('Ventas', 'F4')) + ', pero ' + n + ' vendedores alcanzaron la meta.';
        } },
        { titulo: 'Las fórmulas resisten cambios de meta y tasa', fn: (L, A) => {
          const v = A.conCambios({ 'Ventas!F1': 8000, 'Ventas!F2': 0.07 });
          let msg = true;
          for (const x of L.celdasRango('D2:D21')) {
            const c = A.num(v('Ventas', 'C' + (x.r + 1))), e = c >= 8000 ? c * 0.07 : 0;
            if (!A.cerca(A.num(v('Ventas', x.dir)), e)) { msg = 'Si la meta cambia a 8,000 y la tasa a 7 %, ' + x.dir + ' no se actualiza bien: ¿fijaste F1 y F2 con $?'; break; }
          }
          v.restaurar();
          return msg;
        } },
        { titulo: 'Comisiones por sucursal (F8:F10)', fn: (L, A) => {
          for (const r of [8, 9, 10]) {
            const suc = L.valor('Ventas', 'E' + r);
            const esp = L.celdasRango('D2:D21').filter((x) => L.valor('Ventas', 'B' + (x.r + 1)) === suc).reduce((s, x) => s + (A.num(L.valor('Ventas', x.dir)) || 0), 0);
            if (!L.usaFuncion('Ventas', 'F' + r, ['SUMIF', 'SUMIFS'])) return 'F' + r + ' debe usar SUMAR.SI.';
            if (!A.cerca(A.num(L.valor('Ventas', 'F' + r)), esp)) return 'F' + r + ' (' + suc + ') muestra ' + A.fmtEs(L.valor('Ventas', 'F' + r)) + '; debería ser ' + A.fmtEs(esp) + '.';
          }
          return true;
        } },
        { titulo: 'Nombre «Meta» definido y usado', nivel: 'experto', fn: (L) => {
          const n = L.nombre('Meta');
          if (!n || !/\$F\$1$/i.test(n.ref)) return 'Asigna el nombre Meta a la celda F1.';
          return /META/i.test(L.formula('Ventas', 'D2') || '') ? true : 'Usa el nombre Meta en la fórmula de D2.';
        } },
        { titulo: 'Promedio de ventas por sucursal (G8:G10)', nivel: 'experto', fn: (L, A) => {
          for (const r of [8, 9, 10]) {
            const suc = L.valor('Ventas', 'E' + r);
            const vals = L.celdasRango('C2:C21').filter((x) => L.valor('Ventas', 'B' + (x.r + 1)) === suc).map((x) => A.num(L.valor('Ventas', x.dir)));
            const esp = vals.reduce((a, b) => a + b, 0) / vals.length;
            if (!L.usaFuncion('Ventas', 'G' + r, ['AVERAGEIF', 'AVERAGEIFS'])) return 'G' + r + ' debe usar PROMEDIO.SI.';
            if (!A.cerca(A.num(L.valor('Ventas', 'G' + r)), esp)) return 'G' + r + ' (' + suc + ') debería ser ' + A.fmtEs(esp) + '.';
          }
          return true;
        } },
      ],
    },
    donde: [
      { comando: 'Asignar nombre', ruta: ['Fórmulas', 'Asignar nombre'], nota: 'Atajo: escribe el nombre en el cuadro de nombres y pulsa Enter.' },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'], nota: 'También con el botón fx junto a la barra de fórmulas.' },
      { comando: 'Funciones lógicas (SI, Y, O)', ruta: ['Fórmulas', 'Lógicas'] },
      { comando: 'Administrador de nombres', ruta: ['Fórmulas', 'Administrador de nombres'] },
    ],
    glosario: ['SI', 'Y', 'O', 'NO', 'SI.CONJUNTO', 'CONTAR.SI', 'REDONDEAR', 'RESIDUO'],
    atajos: ['<kbd>F4</kbd> mientras escribes una referencia: alterna A1 → $A$1 → A$1 → $A1.', 'Escribe el nombre en el cuadro de nombres y pulsa <kbd>Enter</kbd> para crear un rango con nombre.'],
  });
})();

/* Versión 3 · información a detalle, autoevaluación y conexiones */
(function () {
  const { D, ENC } = LT.caso;
  const emp = D.empleados;
  const anclas = `<figure class="figura-explica"><svg viewBox="0 0 600 170" role="img" aria-label="Tipos de referencia">
  <g font-family="Segoe UI,Arial" font-size="13">
  <rect x="10" y="12" width="135" height="64" rx="8" fill="#fff" stroke="#999"/><text x="77" y="36" text-anchor="middle" font-weight="700">F2</text><text x="77" y="58" text-anchor="middle" font-size="11">relativa: se mueve</text>
  <rect x="155" y="12" width="135" height="64" rx="8" fill="#fde9e7" stroke="#c0392b"/><text x="222" y="36" text-anchor="middle" font-weight="700">$F$2</text><text x="222" y="58" text-anchor="middle" font-size="11">absoluta: fija</text>
  <rect x="300" y="12" width="135" height="64" rx="8" fill="#e7effc" stroke="#2259b8"/><text x="367" y="36" text-anchor="middle" font-weight="700">F$2</text><text x="367" y="58" text-anchor="middle" font-size="11">fija la fila</text>
  <rect x="445" y="12" width="145" height="64" rx="8" fill="#e2f1e8" stroke="#1e7145"/><text x="517" y="36" text-anchor="middle" font-weight="700">$F2</text><text x="517" y="58" text-anchor="middle" font-size="11">fija la columna</text>
  <text x="10" y="104">Tecla F4 mientras escribes la referencia:  F2 → $F$2 → F$2 → $F2 → F2</text>
  <text x="10" y="128">Regla práctica: el $ va delante de lo que NO debe cambiar al copiar.</text>
  <text x="10" y="152">Copiar hacia abajo cambia filas; copiar a la derecha cambia columnas.</text></g></svg></figure>`;
  LT.ampliarModulo(9, {
    objetivos: [
      'Decidir qué partes de una referencia fijar con $ al copiar una fórmula (absolutas y mixtas).',
      'Crear, usar y administrar rangos con nombre.',
      'Escribir pruebas lógicas con operadores de comparación y combinarlas con Y, O y NO.',
      'Resolver decisiones con SI, SI anidados y SI.CONJUNTO, en el orden correcto.',
      'Redondear resultados de verdad con REDONDEAR cuando se van a pagar o facturar.',
    ],
    detalle: [
      { titulo: 'Referencias relativas, absolutas y mixtas', abierto: true, html: anclas + '<p><b>Mixtas en acción:</b> una tabla de precios con IVA y propina tiene precios en A2:A6 y porcentajes en B1:D1. La fórmula de B2, <code>=$A2*(1+B$1)</code>, se copia a todo B2:D6: <code>$A</code> mantiene la columna de precios y <code>$1</code> la fila de porcentajes.</p>' },
      { titulo: 'Cómo leer y ordenar SI anidados', html: '<p>Las condiciones se evalúan <b>en orden</b> y se detienen en la primera verdadera. Por eso, con rangos de valores, empieza por la más exigente:</p><table><tr><th>Bien</th><th>Mal</th></tr><tr><td><code>=SI(C2&gt;=15000,"Oro",SI(C2&gt;=10000,"Plata","Bronce"))</code></td><td><code>=SI(C2&gt;=10000,"Plata",SI(C2&gt;=15000,"Oro","Bronce"))</code><br>Nadie llega a «Oro»: 16,000 ya cumple la primera.</td></tr></table><p><b>SI.CONJUNTO</b> evita los paréntesis encadenados: <code>=SI.CONJUNTO(C2&gt;=15000,"Oro", C2&gt;=10000,"Plata", VERDADERO,"Bronce")</code>. El último par con <code>VERDADERO</code> es el «si no».</p>' },
      { titulo: 'Y, O y NO en una tabla de verdad', html: '<table><tr><th>Ventas ≥ 10,000</th><th>Sucursal = Centro</th><th>Y</th><th>O</th></tr><tr><td>VERDADERO</td><td>VERDADERO</td><td>VERDADERO</td><td>VERDADERO</td></tr><tr><td>VERDADERO</td><td>FALSO</td><td>FALSO</td><td>VERDADERO</td></tr><tr><td>FALSO</td><td>VERDADERO</td><td>FALSO</td><td>VERDADERO</td></tr><tr><td>FALSO</td><td>FALSO</td><td>FALSO</td><td>FALSO</td></tr></table><p><code>NO(B2="Centro")</code> equivale a <code>B2&lt;&gt;"Centro"</code>. Los textos se comparan sin distinguir mayúsculas («centro» = «Centro»), pero un espacio de más sí cuenta.</p>' },
      { titulo: 'Nombres: buenas reglas', html: '<ul><li>Sin espacios ni signos (usa <code>Tasa_Comision</code> o <code>TasaComision</code>), sin parecer una celda (<code>IVA1</code> no, porque existe la celda IVA1).</li><li>El ámbito puede ser el libro (todas las hojas) o una hoja.</li><li>Fórmulas › Crear desde la selección nombra varias celdas a la vez usando los rótulos de al lado.</li><li>Fórmulas › Utilizar en la fórmula los inserta sin escribirlos.</li></ul>' },
    ],
    errores: [
      'Copiar la comisión sin $: la meta «se mueve» y aparecen ceros o errores.',
      'Poner el $ en el lugar equivocado en tablas de dos entradas (<code>$B1</code> en vez de <code>B$1</code>).',
      'Escribir el texto sin comillas en la prueba lógica (<code>B2=Centro</code> da #¿NOMBRE?).',
      'Ordenar los SI anidados de la condición más fácil a la más exigente.',
      'Usar <code>&gt;</code> cuando se pedía <code>&gt;=</code>: quien llega exactamente a la meta queda fuera.',
    ],
    consejos: [
      'Pon los supuestos (metas, tasas, precios) en celdas propias, rotuladas, y nunca dentro de las fórmulas.',
      'Antes de copiar, pregúntate: ¿qué parte de esta referencia debe quedarse quieta?',
      'Prueba los casos frontera: alguien exactamente en la meta, alguien un peso abajo.',
      'Si un SI anidado pasa de tres niveles, usa SI.CONJUNTO o una tabla de búsqueda (módulo 19).',
    ],
    microExtra: [
      {
        titulo: 'Dos condiciones con Y', tipo: 'hoja',
        enunciado: 'Hay bono para quien vende <b>12,000 o más</b> y además es de la sucursal <b>Centro</b>. En D2:D8 escribe «Bono» si cumple ambas condiciones y deja vacío ("") si no.',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Vendedor', 'Sucursal', 'Ventas', 'Bono'], ...emp.slice(0, 7).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formatos: { 'C2:C8': '$#,##0' }, estilos: { 'A1:D1': ENC }, anchos: { A: 140 }, objetivo: 'D2:D8', filas: 10, cols: 5 }], herramientas: ['formulas'] },
        solucion: { 'D2:D8': '=SI(Y(C2>=12000,B2="Centro"),"Bono","")' },
        pruebas: [{ tipo: 'formula', rango: 'D2:D8' }, { tipo: 'usa', rango: 'D2:D8', funciones: ['Y'], mensaje: 'En {celda} combina las dos condiciones con Y.' }, { tipo: 'valores', rango: 'D2:D8', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}.' }],
        pista: ['<code>=SI(Y(prueba1, prueba2), "Bono", "")</code>', '<code>=SI(Y(C2&gt;=12000,B2="Centro"),"Bono","")</code>'],
      },
      {
        titulo: 'Clasificar con SI.CONJUNTO', tipo: 'hoja',
        enunciado: 'Clasifica a cada vendedor en D2:D9: <b>Oro</b> desde $15,000, <b>Plata</b> desde $10,000 y <b>Bronce</b> en otro caso. Usa SI.CONJUNTO (o SI anidados).',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Vendedor', 'Sucursal', 'Ventas', 'Nivel'], ...emp.slice(7, 15).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formatos: { 'C2:C9': '$#,##0' }, estilos: { 'A1:D1': ENC }, anchos: { A: 140 }, objetivo: 'D2:D9', filas: 11, cols: 5 }], herramientas: ['formulas'] },
        solucion: { 'D2:D9': '=SI.CONJUNTO(C2>=15000,"Oro",C2>=10000,"Plata",VERDADERO,"Bronce")' },
        pruebas: [{ tipo: 'formula', rango: 'D2:D9' }, { tipo: 'usa', rango: 'D2:D9', funciones: ['SI.CONJUNTO', 'SI'], alguna: true }, { tipo: 'valores', rango: 'D2:D9', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}: ¿empezaste por la condición más exigente?' }],
        pista: ['Evalúa primero «Oro» (≥ 15,000) y después «Plata».', '<code>=SI.CONJUNTO(C2&gt;=15000,"Oro",C2&gt;=10000,"Plata",VERDADERO,"Bronce")</code>'],
      },
    ],
    autoeval: [
      { p: 'D2 tiene <code>=C2*F2</code> y la tasa está solo en F2. ¿Qué pasa al copiar D2 hasta D21 y cómo se corrige?', r: 'F2 se convierte en F3, F4…, celdas vacías: los resultados dan 0. Se corrige fijando la tasa: <code>=C2*$F$2</code> (o con un nombre).' },
      { p: 'En una tabla de dos entradas, ¿qué referencia usas para la fila de porcentajes B1:D1 si copias hacia abajo y a la derecha?', r: '<code>B$1</code>: la fila 1 queda fija y la columna cambia.' },
      { p: '¿Qué devuelve <code>=Y(5&gt;3, "Norte"="norte")</code>?', r: 'VERDADERO: ambas condiciones son verdaderas (la comparación de textos no distingue mayúsculas).' },
      { p: '¿Por qué en un SI anidado de rangos se empieza por la condición más exigente?', r: 'Porque Excel se detiene en la primera condición verdadera; si la primera es la más fácil, las siguientes nunca se evalúan.' },
      { p: '¿Qué ventaja tiene <code>=C2*Tasa</code> sobre <code>=C2*$F$2</code>?', r: 'Se lee mejor, no depende de recordar dónde está la tasa y también es absoluta al copiar; si la tasa se mueve, el nombre la sigue.' },
      { p: '¿Cómo se escribe «si no» en SI.CONJUNTO?', r: 'Con un último par cuya prueba sea VERDADERO: <code>…, VERDADERO, "Bronce")</code>.' },
      { p: 'Escribe una fórmula que muestre «Revisar» si las ventas están por debajo de 8,000 <b>o</b> el puesto es «Cajero».', r: '<code>=SI(O(C2&lt;8000, D2="Cajero"), "Revisar", "")</code>.' },
      { p: '¿Qué diferencia hay entre REDONDEAR y quitar decimales con el botón?', r: 'REDONDEAR cambia el valor guardado; el botón solo cambia cómo se ve.' },
    ],
    conexiones: [
      { id: 3, texto: 'aquí completas lo que viste de referencias relativas.' },
      { id: 10, texto: 'SUMAR.SI y CONTAR.SI usan los mismos criterios y referencias fijas.' },
      { id: 14, texto: 'el formato condicional usa pruebas lógicas como las de SI.' },
      { id: 22, texto: 'los modelos de escenarios dependen de supuestos en celdas propias, fijados con $.' },
    ],
  });
})();
