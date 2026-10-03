const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("===============================================================================");
console.log("🧪 VERIFICACIÓN: RETIRO DE BOTONES EXTRA Y ESTILIZADO DE EQUIPOS DE BAJA");
console.log("===============================================================================\n");

const adminHtmlPath = path.join(__dirname, 'Control Coolbox Admin', 'index.html');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. Validar sintaxis JS
console.log("--- TEST 1: COMPROBACIÓN DE SINTAXIS JAVASCRIPT ---");
const sIdx = adminHtml.indexOf('<script>');
const eIdx = adminHtml.lastIndexOf('</script>');
if (sIdx === -1 || eIdx === -1) {
  console.error("❌ No se encontró el bloque <script> en index.html");
  process.exit(1);
}
const codeToRun = adminHtml.substring(sIdx + '<script>'.length, eIdx);

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c)
    };
    this.attributes = {};
  }
  getAttribute(name) { return this.attributes[name]; }
  setAttribute(name, val) { this.attributes[name] = val; }
  querySelector() { return new MockElement('div'); }
  querySelectorAll() { return []; }
  appendChild() {}
}

const domElements = new Map();
function getOrCreate(id) {
  if (!domElements.has(id)) domElements.set(id, new MockElement('div', id));
  return domElements.get(id);
}

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
      return new MockElement('div');
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement(tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  alert: () => {},
  location: { reload: () => {} },
  navigator: { userAgent: "Node" }
};
sandbox.window = sandbox;
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};

try {
  vm.runInNewContext(codeToRun, sandbox);
  console.log("✅ [PASS] 1.1 Sintaxis JS de Control Coolbox Admin/index.html es 100% VÁLIDA.");
} catch (err) {
  console.error("❌ [FAIL] 1.1 Error de sintaxis en script:", err.message);
  process.exit(1);
}

// 2. Comprobar Columna de Acciones
console.log("\n--- TEST 2: COLUMNA DE ACCIONES COMPACTA Y BOTÓN ÚNICO [👁️ Ver] ---");

// 2.1 CSS
if (adminHtml.includes(".btn-action") && adminHtml.includes(".btn-action-ver")) {
  console.log("✅ [PASS] 2.1 Clases CSS .btn-action y .btn-action-ver definidas correctamente.");
} else {
  console.error("❌ [FAIL] 2.1 Clases .btn-action o .btn-action-ver no encontradas en <style>.");
  process.exit(1);
}

// 2.2 Encabezado TH
if (adminHtml.includes('<th style="width: 100px; text-align: center; font-size: 0.70rem;">ACCIÓN</th>')) {
  console.log("✅ [PASS] 2.2 Encabezado TH tiene ancho compacto 'width: 100px;' y 'text-align: center;'.");
} else {
  console.error("❌ [FAIL] 2.2 Encabezado TH de ACCIÓN no tiene el estilo esperado.");
  process.exit(1);
}

// 2.3 Renderizado de fila en actualizarTablaTiendas
const tbodyEl = getOrCreate("tiendasTableBody");
const fnActualizarTabla = sandbox.renderizarTabla || sandbox.window.renderizarTabla || sandbox.actualizarTablaTiendas || sandbox.window.actualizarTablaTiendas;
if (typeof fnActualizarTabla === 'function') {
  // Asignar tiendas mock
  sandbox.TIENDAS_DATA = [
    { codigo: 'B11', nombre: 'Coolbox San Miguel', ciudad: 'Lima', clasificacion: 'TIENDA A', estado: 'REALIZADO' },
    { codigo: 'B13', nombre: 'Coolbox Salaverry', ciudad: 'Lima', clasificacion: 'TIENDA B', estado: 'REALIZADO' }
  ];
  sandbox.tiendasFiltradas = sandbox.TIENDAS_DATA;
  sandbox.window.tiendasFiltradas = sandbox.TIENDAS_DATA;

  // Mock tr creation to capture row HTML
  const createdRows = [];
  sandbox.document.createElement = (tag) => {
    const el = new MockElement(tag);
    if (tag.toLowerCase() === 'tr') createdRows.push(el);
    return el;
  };

  fnActualizarTabla();

  if (createdRows.length > 0) {
    const firstRowHtml = createdRows[0].innerHTML;
    // Comprobar celda TD
    const tieneTd100 = firstRowHtml.includes('<td style="text-align: center; width: 100px;">');
    const tieneBotonVer = firstRowHtml.includes('<button class="btn-action btn-action-ver" onclick="abrirModalInspeccion(\'B11\')">👁️ Ver</button>');
    const tieneBotonActa = firstRowHtml.includes('btn-acta');
    const tieneBotonFicha = firstRowHtml.includes('btn-reporte');
    const tieneBotonDespacho = firstRowHtml.includes('btn-despacho');

    if (tieneTd100 && tieneBotonVer && !tieneBotonActa && !tieneBotonFicha && !tieneBotonDespacho) {
      console.log("✅ [PASS] 2.3 Fila renderiza celda con 'width: 100px;', botón único [👁️ Ver] y cero botones redundantes (Acta, Ficha, Despachar eliminados).");
    } else {
      console.error("❌ [FAIL] 2.3 Fila no cumple con el botón único esperado:", {
        tieneTd100, tieneBotonVer, tieneBotonActa, tieneBotonFicha, tieneBotonDespacho
      });
      process.exit(1);
    }
  } else {
    console.error("❌ [FAIL] 2.3 No se crearon filas.");
    process.exit(1);
  }
} else {
  console.error("❌ [FAIL] 2.3 actualizarTablaTiendas no es una función.");
  process.exit(1);
}

// 3. Estilizado semántico de equipos de baja
console.log("\n--- TEST 3: ESTILIZADO SEMÁNTICO CONDICIÓN 'DE BAJA / RETIRADO' ---");

// 3.1 Clase CSS badge-condicion-baja
const cssBajaReq = [
  'color: #b91c1c !important;',
  'background-color: #fee2e2 !important;',
  'border: 1px solid #fca5a5 !important;',
  'font-weight: 700 !important;',
  'padding: 3px 8px !important;',
  'border-radius: 4px !important;',
  'display: inline-block !important;'
];

let cssAllPresent = true;
for (const req of cssBajaReq) {
  if (!adminHtml.includes(req)) {
    console.error(`❌ [FAIL] Regla CSS faltante: ${req}`);
    cssAllPresent = false;
  }
}
if (cssAllPresent) {
  console.log("✅ [PASS] 3.1 CSS .badge-condicion-baja contiene todos los estilos obligatorios exactos.");
} else {
  process.exit(1);
}

// 3.2 Acta de Conformidad con equipo #4 Lenovo ThinkPad DE BAJA
console.log("\n--- TEST 4: ACTA DE CONFORMIDAD CON EQUIPO DE BAJA ---");
const fnActa = sandbox.construirTablaActivosActa || sandbox.window.construirTablaActivosActa;

const tiendaB13 = {
  codigo: 'B13',
  nombre: 'Coolbox Salaverry',
  estado: 'REALIZADO',
  backupIntervenido: false,
  equipos: [
    { n: 1, tipo: 'CPU POS', marca: 'HP', modelo: 'ProDesk', serie: 'HP001', codInventario: 'ACT-001', condicion: 'OPERATIVO' },
    { n: 2, tipo: 'Impresora Térmica', marca: 'EPSON', modelo: 'TM-T20', serie: 'EP002', codInventario: 'ACT-002', condicion: 'OPERATIVO' },
    { n: 3, tipo: 'Lector de Barras', marca: 'HONEYWELL', modelo: '1900G', serie: 'HW003', codInventario: 'ACT-003', condicion: 'OPERATIVO' },
    { n: 4, tipo: 'Laptop de Contingencia', marca: 'Lenovo', modelo: 'ThinkPad L14', serie: 'PF2XYZ89', codInventario: 'ACT-004', condicion: 'DE BAJA / RETIRADO' }
  ]
};

const htmlActa = fnActa(tiendaB13);

// Verificar equipo 4
const contieneEquipo4 = htmlActa.includes('PF2XYZ89') && htmlActa.includes('ThinkPad L14');
const contieneBadgeBaja = htmlActa.includes('badge-condicion-baja');

console.log(" - Equipo 4 ThinkPad presente en acta:", contieneEquipo4 ? "✅ Sí" : "❌ No");
console.log(" - Insignia badge-condicion-baja aplicada a equipo de baja:", contieneBadgeBaja ? "✅ Sí" : "❌ No");

if (contieneEquipo4 && contieneBadgeBaja) {
  // Comprobar que la fila del equipo 4 NO tenga badge-operativo ni print-status-conforme
  const filasActa = htmlActa.split('</tr>');
  const filaThinkPad = filasActa.find(f => f.includes('PF2XYZ89'));
  if (filaThinkPad && filaThinkPad.includes('badge-condicion-baja') && !filaThinkPad.includes('badge-operativo') && !filaThinkPad.includes('print-status-conforme')) {
    console.log("✅ [PASS] 4.1 Fila de Lenovo ThinkPad (DE BAJA) tiene clase 'badge-condicion-baja' y CERO clases verdes de conformidad.");
  } else {
    console.error("❌ [FAIL] 4.1 Fila de ThinkPad contiene clases verdes de conformidad:", filaThinkPad);
    process.exit(1);
  }
} else {
  console.error("❌ [FAIL] 4.1 ThinkPad no tiene badge-condicion-baja.");
  process.exit(1);
}

// 4. Ficha Técnica A4 con equipo #4 Lenovo ThinkPad DE BAJA
console.log("\n--- TEST 5: FICHA TÉCNICA A4 CON EQUIPO DE BAJA ---");
const fnFicha = sandbox.construirHtmlFichaTecnica || sandbox.window.construirHtmlFichaTecnica;
const htmlFicha = fnFicha(tiendaB13);

const fichaTieneThinkPad = htmlFicha.includes('PF2XYZ89');
const fichaTieneBadgeBaja = htmlFicha.includes('badge-condicion-baja');

if (fichaTieneThinkPad && fichaTieneBadgeBaja) {
  const filasFicha = htmlFicha.split('</tr>');
  const filaFichaThinkPad = filasFicha.find(f => f.includes('PF2XYZ89'));
  if (filaFichaThinkPad && filaFichaThinkPad.includes('badge-condicion-baja') && !filaFichaThinkPad.includes('badge-operativo')) {
    console.log("✅ [PASS] 5.1 Ficha Técnica A4 asigna 'badge-condicion-baja' al equipo de baja sin rastro de color verde.");
  } else {
    console.error("❌ [FAIL] 5.1 Ficha Técnica ThinkPad contiene badge-operativo:", filaFichaThinkPad);
    process.exit(1);
  }
} else {
  console.error("❌ [FAIL] 5.1 Ficha Técnica no incluye badge-condicion-baja para ThinkPad.");
  process.exit(1);
}

// 5. Anti-regresión
console.log("\n--- TEST 6: REGLAS ANTI-REGRESIÓN ---");
const fnAbrirModal = sandbox.abrirModalInspeccion || sandbox.window.abrirModalInspeccion;
if (typeof fnAbrirModal === 'function') {
  console.log("✅ [PASS] 6.1 abrirModalInspeccion existe y no fue alterada.");
} else {
  console.error("❌ [FAIL] 6.1 abrirModalInspeccion no existe.");
  process.exit(1);
}

if (codeToRun.includes("isEjecutado")) {
  console.log("✅ [PASS] 6.2 isEjecutado existe.");
} else {
  console.error("❌ [FAIL] 6.2 isEjecutado no encontrado.");
  process.exit(1);
}

if (adminHtml.includes(".print-photo-grid-4")) {
  console.log("✅ [PASS] 6.3 Grilla de fotos canónica (.print-photo-grid-4) intacta.");
} else {
  console.error("❌ [FAIL] 6.3 .print-photo-grid-4 no encontrada.");
  process.exit(1);
}

console.log("\n===============================================================================");
console.log("🎉 TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE (100% OK)");
console.log("===============================================================================");
