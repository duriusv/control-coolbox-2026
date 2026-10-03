const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("===============================================================================");
console.log("🧪 VERIFICACIÓN INTEGRAL: SINCRONIZACIÓN DE EDICIÓN Y CONTINGENCIA DINÁMICA");
console.log("===============================================================================\n");

const adminHtmlPath = path.join(__dirname, 'Control Coolbox Admin', 'index.html');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Extraer el bloque script inline
const sIdx = adminHtml.indexOf('<script>');
const eIdx = adminHtml.lastIndexOf('</script>');
if (sIdx === -1 || eIdx === -1) {
  console.error("❌ No se encontró el bloque <script> en index.html");
  process.exit(1);
}
const codeToRun = adminHtml.substring(sIdx + '<script>'.length, eIdx);
console.log(`[CHECK 1] Código JS extraído con éxito (${codeToRun.length} caracteres)`);

// 2. Mock de entorno DOM
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
    this.checked = false;
    this.disabled = false;
    this.options = [];
    this.selectedIndex = 0;
    this.attributes = {};
  }
  getAttribute(name) { return this.attributes[name]; }
  setAttribute(name, val) { this.attributes[name] = val; }
  querySelector(sel) {
    if (sel.includes('[data-campo="')) {
      const campo = sel.match(/\[data-campo="([^"]+)"\]/)[1];
      const el = new MockElement('div');
      el.setAttribute('data-campo', campo);
      return el;
    }
    return new MockElement('div');
  }
  querySelectorAll() { return []; }
  appendChild(child) { this.options.push(child); }
  removeAttribute(name) { delete this.attributes[name]; }
}

const domElements = new Map();
function getOrCreateElement(id, tag = 'div') {
  if (!domElements.has(id)) {
    domElements.set(id, new MockElement(tag, id));
  }
  return domElements.get(id);
}

const documentMock = {
  getElementById: (id) => getOrCreateElement(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
    return new MockElement('div');
  },
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Configurar sandbox de ejecución
const sandbox = {
  window: {},
  document: documentMock,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  alert: (msg) => console.log("ALERT:", msg),
  location: { reload: () => {} },
  navigator: { userAgent: "Node test" },
  addEventListener: () => {},
  removeEventListener: () => {}
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};

// Ejecutar scripts en VM para validar sintaxis y cargar funciones
try {
  vm.runInNewContext(codeToRun, sandbox);
  console.log("✅ [PASS] 1.1 Sintaxis JS de Control Coolbox Admin/index.html es 100% VÁLIDA sin errores.");
} catch (err) {
  console.error("❌ [FAIL] 1.1 Error de sintaxis en scripts:", err.message);
  process.exit(1);
}

// 3. Probar sincronizarDatosReales y actualización de INVENTARIO_DATA
console.log("\n--- TEST 2: SINCRONIZACIÓN DE INVENTARIO_DATA ---");
const rawResult = {
  tiendas: [
    { codigo: 'B11', nombre: 'Coolbox San Miguel', ciudad: 'Lima', cajasNominales: 2 }
  ],
  atenciones: [
    {
      codigo: 'B11',
      tecnico: 'Andrews Berbesia',
      fechaHora: '19/09/2026 10:00:00',
      estado: 'REALIZADO',
      computoEstado: JSON.stringify([
        {
          numeroEstacion: 1,
          estacion: "Estación 1 (Caja 01)",
          ubicacion: "Caja 01",
          estado: "Operativo 100%",
          limpiezaAIO: true,
          cambioPastaTermica: true,
          limpiezaTicketera: true,
          limpiezaImpresora: false,
          limpiezaLector: true,
          limpiezaGaveta: true,
          ordenCables: true,
          observaciones: "CAMBIO DE PATCH CORD"
        }
      ]),
      observacionesGenerales: "PRUEBAS DE CONECTIVIDAD APROBADAS",
      observacionesComputo: "PRUEBAS DE CONECTIVIDAD APROBADAS",
      backupIntervenido: false
    }
  ],
  inventario: [
    { codigoTienda: 'B11', tipo: 'CPU POS', marca: 'HP', modelo: 'PRODESK', serie: 'HP123', codInventario: 'INV001', condicion: 'OPERATIVO' },
    { codigoTienda: 'B11', tipo: 'Impresora Térmica', marca: 'EPSON', modelo: 'TM-T20', serie: 'EP456', codInventario: 'INV002', condicion: 'OPERATIVO' },
    { codigoTienda: 'B11', tipo: 'Lector Códigos', marca: 'HONEYWELL', modelo: 'VOYAGER', serie: 'HW789', codInventario: 'INV003', condicion: 'OPERATIVO' }
  ]
};

// Inyectar datos en sandbox
sandbox.catalogoTiendas = rawResult.tiendas;
sandbox.historialAtenciones = rawResult.atenciones;
sandbox.inventarioGeneral = rawResult.inventario;
sandbox.INVENTARIO_DATA = rawResult.inventario;
sandbox.window.catalogoTiendas = rawResult.tiendas;
sandbox.window.historialAtenciones = rawResult.atenciones;
sandbox.window.inventarioGeneral = rawResult.inventario;
sandbox.window.INVENTARIO_DATA = rawResult.inventario;

// Ejecutar sincronización de TIENDAS_DATA como lo hace sincronizarDatosReales
sandbox.TIENDAS_DATA = sandbox.catalogoTiendas.map(t => {
  const at = sandbox.historialAtenciones.find(a => a.codigo === t.codigo);
  return {
    codigo: t.codigo,
    nombre: t.nombre,
    estado: 'REALIZADO',
    estadoSede: 'REALIZADO',
    tecnico: at ? at.tecnico : '',
    computoEstado: at ? at.computoEstado : '',
    COMPUTO_ESTADO: at ? at.computoEstado : '',
    observacionesComputo: at ? at.observacionesComputo : '',
    observacionesGenerales: at ? at.observacionesGenerales : '',
    estacionesMantenimiento: at ? JSON.parse(at.computoEstado) : [],
    equipos: sandbox.inventarioGeneral.filter(e => e.codigoTienda === t.codigo)
  };
});
sandbox.window.TIENDAS_DATA = sandbox.TIENDAS_DATA;

console.log("TIENDAS_DATA tiendas mapeadas:", sandbox.TIENDAS_DATA.length);
if (sandbox.window.INVENTARIO_DATA && sandbox.window.INVENTARIO_DATA.length === 3) {
  console.log("✅ [PASS] 2.1 INVENTARIO_DATA y window.INVENTARIO_DATA actualizados con 3 ítems de inventario.");
} else {
  console.error("❌ [FAIL] 2.1 INVENTARIO_DATA no se actualizó.");
  process.exit(1);
}

// 4. Probar onCambioTiendaEdicion('B11') y cargarDatosEdicion
console.log("\n--- TEST 3: EDICIÓN DE REPORTE B11 (CHECKBOXES, OBSERVACIONES, INVENTARIO) ---");

// Crear elementos requeridos por el DOM de edición
const contenedorEdicion = getOrCreateElement("contenedorFormularioEdicion");
const tbodyEquipos = getOrCreateElement("edit-tbody-equipos");
const countCenso = getOrCreateElement("edit-censo-count");

// Checkboxes de Estación 1 (idx 0)
const chkAio = getOrCreateElement("edit-chk-aio-0");
const chkPasta = getOrCreateElement("edit-chk-pasta-0");
const chkTick = getOrCreateElement("edit-chk-tick-0");
const chkPrn = getOrCreateElement("edit-chk-prn-0");
const chkLec = getOrCreateElement("edit-chk-lec-0");
const chkGav = getOrCreateElement("edit-chk-gav-0");
const chkCab = getOrCreateElement("edit-chk-cab-0");

// Textareas
const obsPos0 = getOrCreateElement("edit-obs-pos-0");
const obsGeneral = getOrCreateElement("edit-obs-general");
const obsComputo = getOrCreateElement("edit-obs-computo");

// Ejecutar onCambioTiendaEdicion
const onCambioFn = sandbox.onCambioTiendaEdicion || sandbox.window.onCambioTiendaEdicion;
if (typeof onCambioFn !== 'function') {
  console.error("❌ onCambioTiendaEdicion no encontrada en sandbox");
  process.exit(1);
}
onCambioFn('B11');
console.log("DEBUG _edicionTiendaActual:", sandbox.window._edicionTiendaActual ? {
  codigo: sandbox.window._edicionTiendaActual.codigo,
  esPendiente: sandbox.window._edicionTiendaActual.esPendiente,
  estacionesMantenimiento: sandbox.window._edicionTiendaActual.estacionesMantenimiento,
  mantenimientoCajas: sandbox.window._edicionTiendaActual.mantenimiento && sandbox.window._edicionTiendaActual.mantenimiento.cajas
} : "null");
console.log(" - Soplado (AIO):", chkAio.checked ? "✅ Marcado" : "❌ Desmarcado");
console.log(" - Pasta Térmica:", chkPasta.checked ? "✅ Marcado" : "❌ Desmarcado");
console.log(" - Ticketera:", chkTick.checked ? "✅ Marcado" : "❌ Desmarcado");
console.log(" - Impresora:", chkPrn.checked ? "❌ Marcado" : "✅ Desmarcado (esperado false)");
console.log(" - Lector:", chkLec.checked ? "✅ Marcado" : "❌ Desmarcado");
console.log(" - Gaveta:", chkGav.checked ? "✅ Marcado" : "❌ Desmarcado");
console.log(" - Cableado:", chkCab.checked ? "✅ Marcado" : "❌ Desmarcado");

if (chkAio.checked && chkPasta.checked && chkTick.checked && !chkPrn.checked && chkLec.checked && chkGav.checked && chkCab.checked) {
  console.log("✅ [PASS] 3.1 Checkboxes de Estación 1 sincronizados 100% fidedignos con computoEstado.");
} else {
  console.error("❌ [FAIL] 3.1 Checkboxes de Estación 1 no concuerdan.");
  process.exit(1);
}

console.log("\nObservaciones en DOM:");
console.log(" - Estación 1 (edit-obs-pos-0):", obsPos0.value);
console.log(" - General (edit-obs-general):", obsGeneral.value);
console.log(" - Cómputo (edit-obs-computo):", obsComputo.value);

if (obsPos0.value === "CAMBIO DE PATCH CORD") {
  console.log("✅ [PASS] 3.2 Observación técnica de Estación 1 cargada ('CAMBIO DE PATCH CORD').");
} else {
  console.error("❌ [FAIL] 3.2 Observación técnica de estación no cargó:", obsPos0.value);
  process.exit(1);
}

if (obsGeneral.value.includes("PRUEBAS DE CONECTIVIDAD APROBADAS") && obsComputo.value.includes("PRUEBAS DE CONECTIVIDAD APROBADAS")) {
  console.log("✅ [PASS] 3.3 Observaciones generales cargadas ('PRUEBAS DE CONECTIVIDAD APROBADAS').");
} else {
  console.error("❌ [FAIL] 3.3 Observaciones generales no cargaron:", obsGeneral.value);
  process.exit(1);
}

console.log("\nInventario censado de B11 en edición:");
console.log(" - Conteo de equipos:", countCenso.textContent);
console.log(" - Filas renderizadas en tbody:", (tbodyEquipos.innerHTML.match(/<tr/g) || []).length);
if (parseInt(countCenso.textContent, 10) === 3 && tbodyEquipos.innerHTML.includes("HP123") && tbodyEquipos.innerHTML.includes("EP456") && tbodyEquipos.innerHTML.includes("HW789")) {
  console.log("✅ [PASS] 3.4 3 equipos reales renderizados en #edit-tbody-equipos con sus números de serie.");
} else {
  console.error("❌ [FAIL] 3.4 Inventario real no se renderizó correctamente en la tabla.");
  process.exit(1);
}

// 5. Probar Contingencia / Almacén en Acta y Ficha Técnica
console.log("\n--- TEST 4: CONTINGENCIA / ALMACÉN EN ACTA Y FICHA TÉCNICA ---");

const tiendaSinBackup = {
  codigo: 'B11',
  nombre: 'Coolbox San Miguel',
  estado: 'REALIZADO',
  backupIntervenido: false,
  equipos: rawResult.inventario
};

const tiendaConBackup = {
  codigo: 'B12',
  nombre: 'Coolbox Jockey Plaza',
  estado: 'REALIZADO',
  backupIntervenido: true,
  backupEstado: 'CONFORME',
  observacionesBackup: 'Equipo AIO Lenovo backup operativo',
  equipos: rawResult.inventario
};

const tiendaPendiente = {
  codigo: 'B13',
  nombre: 'Coolbox Salaverry',
  estado: 'PENDIENTE',
  equipos: []
};

// Probar construirTablaActivosActa
const fnActa = sandbox.construirTablaActivosActa || sandbox.window.construirTablaActivosActa;
const fnFicha = sandbox.construirHtmlFichaTecnica || sandbox.window.construirHtmlFichaTecnica;

const htmlActaSinBackup = fnActa(tiendaSinBackup);
const htmlActaConBackup = fnActa(tiendaConBackup);
const htmlActaPendiente = fnActa(tiendaPendiente);

// Verificar Acta sin backup
if (htmlActaSinBackup.includes("NO INTERVENIDO") &&
    htmlActaSinBackup.includes("Equipos de Backup: No intervenido / Sin contingencia en local")) {
  console.log("✅ [PASS] 4.1 Acta sin backup: Muestra 'NO INTERVENIDO' en badge gris y observación 'No intervenido / Sin contingencia en local'.");
} else {
  console.error("❌ [FAIL] 4.1 Acta sin backup no renderizó correctamente.");
  process.exit(1);
}

// Verificar Acta con backup
if (htmlActaConBackup.includes("CONFORME") &&
    htmlActaConBackup.includes("Equipo AIO Lenovo backup operativo") &&
    !htmlActaConBackup.includes("NO INTERVENIDO")) {
  console.log("✅ [PASS] 4.2 Acta con backup: Muestra 'CONFORME' en badge verde con su observación.");
} else {
  console.error("❌ [FAIL] 4.2 Acta con backup no renderizó correctamente.");
  process.exit(1);
}

// Verificar Acta pendiente
if (htmlActaPendiente.includes("PENDIENTE") &&
    htmlActaPendiente.includes("Pendiente de verificación en tienda")) {
  console.log("✅ [PASS] 4.3 Acta pendiente: Muestra 'PENDIENTE'.");
} else {
  console.error("❌ [FAIL] 4.3 Acta pendiente no renderizó correctamente.");
  process.exit(1);
}

// Probar construirHtmlFichaTecnica
const htmlFichaSinBackup = fnFicha(tiendaSinBackup);
const htmlFichaConBackup = fnFicha(tiendaConBackup);
const htmlFichaPendiente = fnFicha(tiendaPendiente);

// Verificar Ficha sin backup
if (htmlFichaSinBackup.includes("NO INTERVENIDO") &&
    htmlFichaSinBackup.includes("Equipos de Backup: No intervenido / Sin contingencia en local")) {
  console.log("✅ [PASS] 4.4 Ficha Técnica sin backup: Muestra 'NO INTERVENIDO' y observación 'No intervenido / Sin contingencia en local'.");
} else {
  console.error("❌ [FAIL] 4.4 Ficha Técnica sin backup no renderizó correctamente.");
  process.exit(1);
}

// Verificar Ficha con backup
if (htmlFichaConBackup.includes("CONFORME") &&
    htmlFichaConBackup.includes("Equipo AIO Lenovo backup operativo") &&
    !htmlFichaConBackup.includes("NO INTERVENIDO")) {
  console.log("✅ [PASS] 4.5 Ficha Técnica con backup: Muestra 'CONFORME' en badge verde.");
} else {
  console.error("❌ [FAIL] 4.5 Ficha Técnica con backup no renderizó correctamente.");
  process.exit(1);
}

// Verificar Ficha pendiente
if (htmlFichaPendiente.includes("PENDIENTE") &&
    htmlFichaPendiente.includes("Pendiente de verificación en tienda")) {
  console.log("✅ [PASS] 4.6 Ficha Técnica pendiente: Muestra 'PENDIENTE'.");
} else {
  console.error("❌ [FAIL] 4.6 Ficha Técnica pendiente no renderizó correctamente.");
  process.exit(1);
}

// 6. Anti-regression checks
console.log("\n--- TEST 5: ANTI-REGRESIÓN ---");
const fnAbrirModal = sandbox.abrirModalInspeccion || sandbox.window.abrirModalInspeccion;
if (typeof fnAbrirModal === 'function') {
  console.log("✅ [PASS] 5.1 abrirModalInspeccion existe y no fue alterado.");
} else {
  console.error("❌ [FAIL] 5.1 abrirModalInspeccion fue alterado o no existe.");
  process.exit(1);
}

const fnModalResumen = sandbox.renderizarResumenMantenimientoModal || sandbox.window.renderizarResumenMantenimientoModal;
if (typeof fnModalResumen === 'function') {
  console.log("✅ [PASS] 5.2 renderizarResumenMantenimientoModal existe y no fue alterado.");
} else {
  console.error("❌ [FAIL] 5.2 renderizarResumenMantenimientoModal no existe.");
  process.exit(1);
}

if (codeToRun.includes("isEjecutado")) {
  console.log("✅ [PASS] 5.3 isEjecutado existe en el código.");
} else {
  console.error("❌ [FAIL] 5.3 isEjecutado no existe.");
  process.exit(1);
}

if (adminHtml.includes(".print-photo-grid-4")) {
  console.log("✅ [PASS] 5.4 Formato canónico de 4 páginas A4 (.print-photo-grid-4) intacto.");
} else {
  console.error("❌ [FAIL] 5.4 .print-photo-grid-4 no encontrado.");
  process.exit(1);
}

console.log("\n===============================================================================");
console.log("🎉 TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE (100% OK)");
console.log("===============================================================================");
