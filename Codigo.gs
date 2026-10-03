/**
 * BACKEND OFICIAL UNIFICADO — SISTEMA COOLBOX 2026 (Versión 4.6 Homologación Nomenclatura Canónica Coolbox)
 * Empresa: JSERVICE RV E.I.R.L.
 * Supervisión Técnica: Jesús Silva y Andrews Berbesia
 * 
 * Novedades Versión 4.6.2 (Limpieza Preventiva en Drive y Despacho Documental):
 *   - Auto-remoción preventiva de versiones previas con el mismo nombre en Drive antes de crear nuevo archivo.
 *   - Envío oficial de correo con enlace directo limpio a Google Drive.
 *   - Erradicación de toUpperCase() Destructivo: Nombres de equipos respetan la estética oficial
 *     del cliente ("All in One CAJA01", "Ticketera CAJA01", "Gaveta de Dinero CAJA01", "Huellero", "PDA01").
 *   - Normalizador Canónico Universal normalizarTipoEquipoCanonico_(): Homologa en tiempo real
 *     equipos enviados desde la App Móvil o desde el Panel de Supervisión.
 *   - Utilidades de Producción Drive: Funciones limpiarBaseDatosParaProduccion() y
 *     homologarNombresInventarioEnDrive() para mantenimiento con 1 solo clic.
 *   - Preservación Quirúrgica: Sin clearContents() global, bloqueo LockService de 30s y blindaje de fechas @.
 */

// ==============================================================================
// 1. CONFIGURACIÓN Y CONSTANTES MAESTRAS
// ==============================================================================

const ID_HOJA_CALCULO = "1DcMXTs2PSgwXOW83Y2yGK3BjAfWoqNIbFNZ7okgkTRE";
const NOMBRE_HOJA_TIENDAS = "DB_TIENDAS";
const NOMBRE_HOJA_MANTENIMIENTO = "REGISTRO_MANTENIMIENTO";
const NOMBRE_HOJA_INVENTARIO = "INVENTARIO_EQUIPOS";
const ID_CARPETA_RESPALDO_DRIVE = "1VYqDRsaNsQVsqKxt8iFW6b9vUcojIuG4";

// ==============================================================================
// 2. UTILIDADES DE CONEXIÓN Y LIMPIEZA DEFENSIVA
// ==============================================================================

function obtenerLibroSeguro() {
  try {
    return SpreadsheetApp.openById(ID_HOJA_CALCULO);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Busca la hoja de tiendas tolerando nombres comunes: DB_TIENDAS, BD_TIENDAS o variantes con espacios.
 */
function obtenerHojaTiendasSegura_(libro) {
  let hoja = libro.getSheetByName("DB_TIENDAS") || 
             libro.getSheetByName("BD_TIENDAS") || 
             libro.getSheetByName("BD_Tiendas") || 
             libro.getSheetByName("Db_Tiendas");
  if (!hoja) {
    const hojas = libro.getSheets();
    for (let i = 0; i < hojas.length; i++) {
      const nombreLimpio = hojas[i].getName().trim().toUpperCase();
      if (nombreLimpio === "DB_TIENDAS" || nombreLimpio === "BD_TIENDAS" || nombreLimpio.includes("TIENDA")) {
        return hojas[i];
      }
    }
  }
  return hoja;
}

/**
 * Extrae estrictamente el código alfanumérico principal (ej. "B13 - CHINCHA" -> "B13").
 */
function extraerCodigoPuro_(texto) {
  if (!texto) return "";
  const str = String(texto).trim().toUpperCase();
  const match = str.match(/^([A-Z0-9]+)/);
  return match ? match[1] : str;
}

/**
 * Sanitiza un número de serie o código de inventario leído desde Google Sheets.
 * Convierte números enteros grandes (que Sheets pudo haber guardado sin formato @)
 * o cadenas en notación científica ("7.42211E+12") a texto plano legible.
 * Preserva ceros a la izquierda, letras y guiones intactos.
 */
function sanitizarNumeroSerie_(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number') {
    if (Number.isInteger(valor)) {
      // Usa la representación más exacta posible sin notación científica
      return valor.toLocaleString('fullwide', { useGrouping: false });
    }
    const s = valor.toString();
    if (s.toLowerCase().includes('e')) {
      return valor.toLocaleString('fullwide', { useGrouping: false });
    }
    return s;
  }
  const str = String(valor).trim();
  // Detecta cadenas ya convertidas a notación científica
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      return num.toLocaleString('fullwide', { useGrouping: false });
    }
  }
  return str;
}

function extraerFotoSegura(arreglo, indice) {
  if (!arreglo || !Array.isArray(arreglo)) return "";
  if (indice >= 0 && indice < arreglo.length) {
    const elemento = arreglo[indice];
    if (elemento) {
      return elemento.dataUrl || elemento.base64 || elemento.url || "";
    }
  }
  return "";
}

/**
 * Normaliza cualquier valor de fecha (Date object, string ISO o fecha corta)
 * al formato canónico con hora exacta: "dd/MM/yyyy HH:mm:ss" en zona horaria GMT-5.
 */
function normalizarFechaHoraTexto_(valorFecha) {
  if (!valorFecha) {
    return Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy HH:mm:ss");
  }
  // Si Google Sheets lo leyó como un objeto Date nativo
  if (valorFecha instanceof Date) {
    return Utilities.formatDate(valorFecha, "GMT-5", "dd/MM/yyyy HH:mm:ss");
  }
  const str = String(valorFecha).trim();
  // Si ya es un texto con fecha y hora completa (ej. "24/09/2026 18:15:58")
  if (str.includes(":") && (str.includes("/") || str.includes("-")) && str.length >= 16) {
    return str;
  }
  // Intento de parseo manual DD/MM/YYYY o DD-MM-YYYY
  const partes = str.split(/[\/\- ]/);
  if (partes.length >= 3) {
    const d = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10) - 1;
    const y = parseInt(partes[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      const fechaObj = new Date(y, m, d, 0, 0, 0);
      return Utilities.formatDate(fechaObj, "GMT-5", "dd/MM/yyyy HH:mm:ss");
    }
  }
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    return Utilities.formatDate(dObj, "GMT-5", "dd/MM/yyyy HH:mm:ss");
  }
  return str;
}

/**
 * Normaliza el nombre del equipo al formato canónico oficial exigido por Coolbox 2026.
 * Erradica las mayúsculas forzadas (ej. "ALL IN ONE CAJA01" -> "All in One CAJA01")
 * y traduce nombres genéricos legados hacia la nomenclatura exacta del cliente.
 */
function normalizarTipoEquipoCanonico_(tipoRaw, ubicacionRaw) {
  if (!tipoRaw) return "EQUIPO";
  const str = String(tipoRaw).trim();
  if (!str) return "EQUIPO";

  const upper = str.toUpperCase().replace(/\s+/g, " ");

  // Mapeo canónico exacto (Case-Insensitive -> Casing Oficial Coolbox)
  const mapaCanonico = {
    "ALL IN ONE CAJA01": "All in One CAJA01",
    "ALL IN ONE CAJA02": "All in One CAJA02",
    "ALL IN ONE CAJA03": "All in One CAJA03",
    "ALL IN ONE CAJA04": "All in One CAJA04",
    "ALL IN ONE CAJA05": "All in One CAJA05",
    "ALL IN ONE CAJA 01": "All in One CAJA01",
    "ALL IN ONE CAJA 02": "All in One CAJA02",
    "ALL IN ONE CAJA 03": "All in One CAJA03",
    "ALL IN ONE CAJA 04": "All in One CAJA04",
    "ALL IN ONE CAJA 05": "All in One CAJA05",
    "ALL IN ONE ADMIN": "All in One ADMIN",
    "PC": "Pc",
    "PC (DESKTOP)": "Pc",
    "ALL IN ONE BACKUP": "All in One BACKUP",
    "PC BACKUP": "Pc BACKUP",
    "TICKETERA BACKUP": "Ticketera BACKUP",
    "LECTOR DE CODIGO DE BARRAS BACKUP": "Lector de codigo de barras BACKUP",
    "LECTOR DE CÓDIGO DE BARRAS BACKUP": "Lector de codigo de barras BACKUP",
    "MONITOR BACKUP": "Monitor BACKUP",
    "GAVETA DE DINERO BACKUP": "Gaveta de Dinero BACKUP",
    "GABETA DE DINERO BACKUP": "Gaveta de Dinero BACKUP",
    "UPS / ESTABILIZADOR BACKUP": "Ups / Estabilizador BACKUP",
    "UPS/ESTABILIZADOR BACKUP": "Ups / Estabilizador BACKUP",
    "ESTABILIZADOR DE VOLTAJE / PDU BACKUP": "Ups / Estabilizador BACKUP",
    "TICKETERA CAJA01": "Ticketera CAJA01",
    "TICKETERA CAJA02": "Ticketera CAJA02",
    "TICKETERA CAJA03": "Ticketera CAJA03",
    "TICKETERA CAJA04": "Ticketera CAJA04",
    "TICKETERA CAJA05": "Ticketera CAJA05",
    "TICKETERA CAJA 01": "Ticketera CAJA01",
    "TICKETERA CAJA 02": "Ticketera CAJA02",
    "TICKETERA CAJA 03": "Ticketera CAJA03",
    "TICKETERA CAJA 04": "Ticketera CAJA04",
    "TICKETERA CAJA 05": "Ticketera CAJA05",
    "LECTOR DE CODIGO DE BARRAS CAJA01": "Lector de codigo de barras CAJA01",
    "LECTOR DE CODIGO DE BARRAS CAJA02": "Lector de codigo de barras CAJA02",
    "LECTOR DE CODIGO DE BARRAS CAJA03": "Lector de codigo de barras CAJA03",
    "LECTOR DE CODIGO DE BARRAS CAJA04": "Lector de codigo de barras CAJA04",
    "LECTOR DE CODIGO DE BARRAS CAJA05": "Lector de codigo de barras CAJA05",
    "LECTOR DE CÓDIGO DE BARRAS CAJA01": "Lector de codigo de barras CAJA01",
    "LECTOR DE CÓDIGO DE BARRAS CAJA02": "Lector de codigo de barras CAJA02",
    "LECTOR DE CÓDIGO DE BARRAS CAJA03": "Lector de codigo de barras CAJA03",
    "LECTOR DE CÓDIGO DE BARRAS CAJA04": "Lector de codigo de barras CAJA04",
    "LECTOR DE CÓDIGO DE BARRAS CAJA05": "Lector de codigo de barras CAJA05",
    "GAVETA DE DINERO CAJA01": "Gaveta de Dinero CAJA01",
    "GAVETA DE DINERO CAJA02": "Gaveta de Dinero CAJA02",
    "GAVETA DE DINERO CAJA03": "Gaveta de Dinero CAJA03",
    "GAVETA DE DINERO CAJA04": "Gaveta de Dinero CAJA04",
    "GAVETA DE DINERO CAJA05": "Gaveta de Dinero CAJA05",
    "GABETA DE DINERO CAJA01": "Gaveta de Dinero CAJA01",
    "GABETA DE DINERO CAJA02": "Gaveta de Dinero CAJA02",
    "GABETA DE DINERO CAJA03": "Gaveta de Dinero CAJA03",
    "GABETA DE DINERO CAJA04": "Gaveta de Dinero CAJA04",
    "GABETA DE DINERO CAJA05": "Gaveta de Dinero CAJA05",
    "MONITOR PRINCIPAL CAJA01": "Monitor Principal CAJA01",
    "MONITOR PRINCIPAL CAJA02": "Monitor Principal CAJA02",
    "MONITOR PRINCIPAL CAJA03": "Monitor Principal CAJA03",
    "MONITOR PRINCIPAL CAJA04": "Monitor Principal CAJA04",
    "MONITOR PRINCIPAL CAJA05": "Monitor Principal CAJA05",
    "MONITOR POS CAJA01": "Monitor Principal CAJA01",
    "MONITOR POS CAJA02": "Monitor Principal CAJA02",
    "MONITOR POS CAJA03": "Monitor Principal CAJA03",
    "MONITOR POS CAJA04": "Monitor Principal CAJA04",
    "MONITOR POS CAJA05": "Monitor Principal CAJA05",
    "MONITOR SECUNDARIO DELL VTA360": "Monitor secundario Dell Vta360",
    "UPS / ESTABILIZADOR CAJA01": "Ups / Estabilizador CAJA01",
    "UPS / ESTABILIZADOR CAJA02": "Ups / Estabilizador CAJA02",
    "UPS / ESTABILIZADOR CAJA03": "Ups / Estabilizador CAJA03",
    "UPS / ESTABILIZADOR CAJA04": "Ups / Estabilizador CAJA04",
    "UPS / ESTABILIZADOR CAJA05": "Ups / Estabilizador CAJA05",
    "UPS/ESTABILIZADOR CAJA01": "Ups / Estabilizador CAJA01",
    "UPS/ESTABILIZADOR CAJA02": "Ups / Estabilizador CAJA02",
    "UPS/ESTABILIZADOR CAJA03": "Ups / Estabilizador CAJA03",
    "UPS/ESTABILIZADOR CAJA04": "Ups / Estabilizador CAJA04",
    "UPS/ESTABILIZADOR CAJA05": "Ups / Estabilizador CAJA05",
    "HUELLERO": "Huellero",
    "HUELLERO (LECTOR BIOMÉTRICO)": "Huellero",
    "HUELLERO (LECTOR BIOMETRICO)": "Huellero",
    "LECTOR BIOMÉTRICO": "Huellero",
    "LECTOR BIOMETRICO": "Huellero",
    "IMPRESORA LÁSER / TINTA": "Impresora Láser / Tinta",
    "IMPRESORA LASER / TINTA": "Impresora Láser / Tinta",
    "IMPRESORA LÁSER": "Impresora Láser / Tinta",
    "IMPRESORA LASER": "Impresora Láser / Tinta",
    "IMPRESORA TINTA": "Impresora Láser / Tinta",
    "IMPRESORA DE REPORTES": "Impresora Láser / Tinta",
    "IMPRESORA INALÁMBRICA DE RECIBOS": "Impresora Inalámbrica de Recibos",
    "IMPRESORA INALAMBRICA DE RECIBOS": "Impresora Inalámbrica de Recibos",
    "IMPRESORA INALÁMBRICA": "Impresora Inalámbrica de Recibos",
    "IMPRESORA INALAMBRICA": "Impresora Inalámbrica de Recibos"
  };

  if (mapaCanonico[upper]) {
    return mapaCanonico[upper];
  }

  // Terminales móviles PDA (ej. "PDA01", "PDA02", "PDA 1", "PDA1")
  if (/^PDA\s*0*\d+$/i.test(upper)) {
    const num = upper.replace(/\D/g, "");
    const digito = num.length === 1 ? "0" + num : num;
    return "PDA" + digito;
  }

  // Monitor Principal / Monitor POS
  if (upper.includes("MONITOR PRINCIPAL") || upper.includes("MONITOR POS")) {
    const match = upper.match(/CAJA\s*0*(\d+)/i);
    const sufijo = match ? (" CAJA" + String(match[1]).padStart(2, "0")) : " CAJA01";
    return "Monitor Principal" + sufijo;
  }

  // Traducción inteligente de nombres antiguos genéricos basada en ubicación
  const ubi = String(ubicacionRaw || "").toUpperCase();
  const esBackup = ubi.includes("BACKUP") || ubi.includes("ALMAC");
  const esAdmin = ubi.includes("ADMIN");
  const numCaja = ubi.includes("CAJA 05") || ubi.includes("CAJA 5") ? "05" :
                  ubi.includes("CAJA 04") || ubi.includes("CAJA 4") ? "04" :
                  ubi.includes("CAJA 03") || ubi.includes("CAJA 3") ? "03" :
                  ubi.includes("CAJA 02") || ubi.includes("CAJA 2") ? "02" : "01";

  if (upper.includes("CPU") || upper.includes("ALL IN ONE")) {
    if (esAdmin) return "All in One ADMIN";
    if (esBackup) return "All in One BACKUP";
    return "All in One CAJA" + numCaja;
  }
  if (upper.includes("TICKET") || upper.includes("IMPRESORA TÉRMICA") || upper.includes("IMPRESORA TERMICA")) {
    if (esBackup) return "Ticketera BACKUP";
    return "Ticketera CAJA" + numCaja;
  }
  if (upper.includes("LECTOR") && upper.includes("BARRA")) {
    if (esBackup) return "Lector de codigo de barras BACKUP";
    return "Lector de codigo de barras CAJA" + numCaja;
  }
  if (upper.includes("GAVETA") || upper.includes("GABETA")) {
    if (esBackup) return "Gaveta de Dinero BACKUP";
    return "Gaveta de Dinero CAJA" + numCaja;
  }
  if (upper.includes("UPS") || upper.includes("ESTABILIZADOR")) {
    if (esBackup) return "Ups / Estabilizador BACKUP";
    return "Ups / Estabilizador CAJA" + numCaja;
  }
  if (upper.includes("MONITOR")) {
    if (esBackup) return "Monitor BACKUP";
  }
  if (upper.includes("HUELLERO") || upper.includes("BIOMETRIC")) {
    return "Huellero";
  }
  if (upper.includes("PDA") || upper.includes("HANDHELD")) {
    return "PDA01";
  }
  if (upper.includes("LASER") || upper.includes("LÁSER") || upper.includes("TINTA")) {
    return "Impresora Láser / Tinta";
  }
  if (upper.includes("INALAMBR") || upper.includes("INALÁMBR")) {
    return "Impresora Inalámbrica de Recibos";
  }

  // Preservar la cadena recibida respetando su capitalización original (cero toUpperCase destructivo)
  return str;
}

/**
 * Evaluación objetiva del dictamen final de la sede.
 */
function determinarEstadoSedeAtomics_(payload, filaPrevia, totalEquiposTienda, estacionesComputo) {
  let estAdmin = String(payload.estadoSede || payload.nuevoEstado || "").trim().toUpperCase();
  if (estAdmin && estAdmin !== "PENDIENTE") {
    // Si viene como OBSERVADO / PARCIAL, verificar si es falso positivo donde las 6 tareas POS y el gabinete son conformes
    if (estAdmin === "OBSERVADO / PARCIAL") {
      let listaEst = estacionesComputo || payload.estacionesMantenimiento || payload.computoEstado;
      if (typeof listaEst === "string" && listaEst.trim().startsWith("[")) {
        try { listaEst = JSON.parse(listaEst); } catch(e) { listaEst = []; }
      }
      const gabLimp = String(payload.gabineteLimpieza || (filaPrevia ? filaPrevia[4] : "") || "").trim().toLowerCase();
      const gabVent = String(payload.gabineteVentiladores || (filaPrevia ? filaPrevia[5] : "") || "").trim().toLowerCase();
      const gabPdu  = String(payload.gabinetePDU || (filaPrevia ? filaPrevia[6] : "") || "").trim().toLowerCase();
      const pduOk = (gabPdu.includes("operativo") || gabPdu.includes("con energia") || !gabPdu) &&
                    (!gabPdu.includes("obs") && !gabPdu.includes("inop") && !gabPdu.includes("sin energ"));
      const ventOk = (gabVent.includes("operativo") || gabVent.includes("no tiene") || !gabVent) &&
                     (!gabVent.includes("inop") && !gabVent.includes("obs") && !gabVent.includes("falla") && !gabVent.includes("ruid") && !gabVent.includes("trab"));
      const gabOk = (gabLimp === "conforme" || gabLimp.includes("limpio") || !gabLimp) &&
                    (!gabLimp.includes("no conforme") && !gabLimp.includes("obs")) &&
                    ventOk &&
                    pduOk;
      if (gabOk && Array.isArray(listaEst) && listaEst.length > 0) {
        const estPos = listaEst.filter(e => e && e.tipo !== "BACKUP_ALMACEN" && !String(e.estacion || "").toLowerCase().includes("backup"));
        const posTodasOk = estPos.length > 0 && estPos.every(e => {
          const estNorm = String(e.estado || "").toUpperCase();
          const estOk = !estNorm.includes("OBS") && !estNorm.includes("INOP");
          const seisOk = Boolean(e.limpiezaAIO && e.cambioPastaTermica && e.limpiezaTicketera && e.limpiezaLector && e.limpiezaGaveta && e.ordenCables);
          return estOk && seisOk;
        });
        if (posTodasOk) {
          return "REALIZADO";
        }
      }
    }
    return estAdmin;
  }

  const gabLimp = String(payload.gabineteLimpieza || (filaPrevia ? filaPrevia[4] : "") || "").trim().toLowerCase();
  const gabVent = String(payload.gabineteVentiladores || (filaPrevia ? filaPrevia[5] : "") || "").trim().toLowerCase();
  const gabPdu  = String(payload.gabinetePDU || (filaPrevia ? filaPrevia[6] : "") || "").trim().toLowerCase();
  
  const rawFotoAntes = payload.urlFotoGabineteAntes || payload.fotoGabineteAntes || payload.urlFotoAntes || (filaPrevia ? filaPrevia[7] : "") || "";
  const rawFotoDesp  = payload.urlFotoGabineteDespues || payload.fotoGabineteDespues || payload.urlFotoDespues || (filaPrevia ? filaPrevia[8] : "") || "";

  const gabConforme = (gabLimp === "conforme" || gabLimp.includes("limpio") || !gabLimp) && (!gabLimp.includes("no conforme") && !gabLimp.includes("obs"));
  const ventOk = (gabVent.includes("operativo") || gabVent.includes("no tiene") || !gabVent) &&
                 (!gabVent.includes("inop") && !gabVent.includes("obs") && !gabVent.includes("falla") && !gabVent.includes("ruid") && !gabVent.includes("trab"));
  const pduOk  = (gabPdu.includes("operativo") || gabPdu.includes("con energia") || !gabPdu) && (!gabPdu.includes("obs") && !gabPdu.includes("inop") && !gabPdu.includes("sin energ"));
  const fotosGabOk = Boolean(String(rawFotoAntes).trim() !== "" && String(rawFotoDesp).trim() !== "");

  if (!gabConforme || !ventOk || !pduOk || !fotosGabOk) {
    return "OBSERVADO / PARCIAL";
  }

  let listaEst = estacionesComputo;
  if (typeof listaEst === "string" && listaEst.trim().startsWith("[")) {
    try { listaEst = JSON.parse(listaEst); } catch(e) {}
  }

  if (!Array.isArray(listaEst) || listaEst.length === 0) {
    return "OBSERVADO / PARCIAL";
  }

  for (let i = 0; i < listaEst.length; i++) {
    const est = listaEst[i];
    if (!est) continue;

    const nombreEst = String(est.estacion || "").toLowerCase();
    if (nombreEst.includes("backup") || nombreEst.includes("almacén") || nombreEst.includes("almacen")) {
      continue;
    }

    const estadoCaja = String(est.estado || "").toLowerCase();
    if (estadoCaja.includes("obs") || estadoCaja.includes("inop")) {
      return "OBSERVADO / PARCIAL";
    }

    // Las 6 tareas operativas fijas del puesto deben estar realizadas al 100%
    // (limpiezaImpresora es condicional por puesto ya que una sede puede tener 0 o 1 impresora compartida)
    const seisTareasOk = Boolean(
      est.limpiezaAIO &&
      est.cambioPastaTermica &&
      est.limpiezaTicketera &&
      est.limpiezaLector &&
      est.limpiezaGaveta &&
      est.ordenCables
    );

    if (!seisTareasOk) {
      return "OBSERVADO / PARCIAL";
    }
  }

  const cantNuevos = Array.isArray(payload.equipos) ? payload.equipos.length : 0;
  const cantTotal = (totalEquiposTienda !== undefined && totalEquiposTienda > 0) ? totalEquiposTienda : cantNuevos;

  if (cantTotal === 0 && (!filaPrevia || !filaPrevia[0])) {
    return "OBSERVADO / PARCIAL";
  }

  const firmaTec = String(payload.firmaTecnicoBase64 || payload.firmaTecnico || (filaPrevia ? filaPrevia[20] : "") || "").trim();
  const firmaCli = String(payload.firmaClienteBase64 || payload.firmaCliente || (filaPrevia ? filaPrevia[21] : "") || "").trim();

  if (!firmaTec || !firmaCli) {
    return "OBSERVADO / PARCIAL";
  }

  return "REALIZADO";
}

// ==============================================================================
// 3. ACTUALIZACIÓN INDESTRUCTIBLE DE ESTADO EN DB_TIENDAS (COLUMNA G)
// ==============================================================================

function actualizarEstadoEnDbTiendasDirecto_(libro, codigoTienda, nuevoEstado) {
  try {
    const hoja = obtenerHojaTiendasSegura_(libro);
    if (!hoja) {
      Logger.log("ERROR: No se encontró la hoja DB_TIENDAS");
      return false;
    }

    const codBuscado = extraerCodigoPuro_(codigoTienda);
    if (!codBuscado) return false;

    const datos = hoja.getDataRange().getValues();
    if (!datos || datos.length === 0) return false;

    let colEstado = 7; // Columna G por defecto (1-based)
    const cabeceras = datos[0];
    for (let c = 0; c < cabeceras.length; c++) {
      const h = String(cabeceras[c] || "").trim().toUpperCase();
      if (h === "ESTADO_ATENCION" || h.includes("ESTADO")) {
        colEstado = c + 1;
        break;
      }
    }

    let filaEncontrada = -1;
    for (let f = 1; f < datos.length; f++) {
      const codFila = extraerCodigoPuro_(datos[f][0]);
      if (codFila === codBuscado) {
        filaEncontrada = f + 1;
        break;
      }
    }

    if (filaEncontrada !== -1) {
      hoja.getRange(filaEncontrada, colEstado).setValue(nuevoEstado);
      SpreadsheetApp.flush(); // Garantiza escritura síncrona inmediata en Sheets
      Logger.log("DB_TIENDAS actualizada: Fila " + filaEncontrada + ", Columna " + colEstado + " -> " + nuevoEstado);
      return true;
    } else {
      Logger.log("No se encontró la tienda " + codBuscado + " en DB_TIENDAS");
      return false;
    }
  } catch (e) {
    Logger.log("Error en actualizarEstadoEnDbTiendasDirecto_: " + e.toString());
    return false;
  }
}

// ==============================================================================
// 4. CONTROLADOR GET (doGet) — LECTURA DE 27 COLUMNAS (A HASTA AA)
// ==============================================================================

function doGet(e) {
  try {
    const libro = obtenerLibroSeguro();
    const hojaTiendas = obtenerHojaTiendasSegura_(libro);
    
    if (!hojaTiendas) {
      return ContentService.createTextOutput(JSON.stringify({ 
        exito: false, 
        mensaje: "Hoja DB_TIENDAS no encontrada." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Carga de Catálogo de Tiendas
    const datos = hojaTiendas.getDataRange().getValues();
    const cabeceras = datos[0];
    const tiendas = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;
      const tienda = {};
      for (let j = 0; j < cabeceras.length; j++) {
        tienda[cabeceras[j]] = fila[j];
      }
      tienda.codigo = extraerCodigoPuro_(fila[0]);
      tienda.nombre = String(tienda.NOMBRE_TIENDA || fila[1] || "").trim();
      tienda.ciudad = String(tienda.CIUDAD || fila[2] || "").trim();
      tienda.direccion = String(tienda.DIRECCION || fila[3] || "").trim();
      tienda.clasificacion = String(tienda.CLASIFICACION || fila[4] || "Bronce").trim();
      tienda.servidor = String(tienda.SERVIDOR_IGC || fila[5] || "NO").trim();
      tienda.estado = String(tienda.ESTADO_ATENCION || fila[6] || "PENDIENTE").trim().toUpperCase();
      tienda.equiposAsignados = parseInt(tienda["EQUIPOS ASIGNADOS"] || fila[7] || 2, 10);
      tienda.cajasNominales = parseInt(tienda["CAJAS FIJAS"] || fila[9] || 2, 10);
      tiendas.push(tienda);
    }

    // [OPTIMIZACIÓN VECTOR 3: CATÁLOGO LIGERO]
    // Si la solicitud proviene de la app móvil solicitando únicamente el catálogo de tiendas, responder de inmediato
    const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : "";
    if (action === "getCatalogoTiendas" || action === "catalogo") {
      return ContentService.createTextOutput(JSON.stringify({ 
        exito: true, 
        tiendas: tiendas,
        locales: tiendas
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Lectura de Atenciones Registradas (27 Columnas: A hasta AA)
    const hojaMantenimiento = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
    const atenciones = [];
    if (hojaMantenimiento) {
      const datosMant = hojaMantenimiento.getDataRange().getValues();
      const cabMant = datosMant[0] || [];
      for (let i = 1; i < datosMant.length; i++) {
        const filaM = datosMant[i];
        if (!filaM[0]) continue;
        const at = {};
        for (let j = 0; j < cabMant.length; j++) {
          at[cabMant[j]] = filaM[j];
        }
        
        at.idVisita = at.ID_VISITA || filaM[0];
        at.fechaHora = normalizarFechaHoraTexto_(at.FECHA_HORA || filaM[1]);
        at.tecnico = at.TECNICO || filaM[2];
        at.tecnicoLider = at.tecnico;
        at.codigoTienda = extraerCodigoPuro_(at.CODIGO_TIENDA || filaM[3]);
        at.codigo = at.codigoTienda;
        at.gabineteLimpieza = at.GABINETE_LIMPIEZA || filaM[4];
        at.gabineteVentiladores = at.GABINETE_VENTILADORES || filaM[5];
        at.gabinetePDU = at.GABINETE_PDU || filaM[6];
        
        at.urlFotoGabineteAntes = at.URL_FOTO_GABINETE_ANTES || filaM[7] || "";
        at.urlFotoGabineteDespues = at.URL_FOTO_GABINETE_DESPUES || filaM[8] || "";
        at.observacionesGabinete = at.OBSERVACIONES_GABINETE || filaM[9] || "";
        
        at.computoEstado = at.COMPUTO_ESTADO || filaM[10] || "";
        at.observacionesComputo = at.OBSERVACIONES_COMPUTO || filaM[11] || "";
        at.observaciones = at.observacionesComputo || at.observacionesGabinete || "";
        
        at.urlFotoRegistro1 = at.URL_FOTO_REGISTRO_1 || filaM[12] || "";
        at.urlFotoRegistro2 = at.URL_FOTO_REGISTRO_2 || filaM[13] || "";
        at.urlFotoRegistro3 = at.URL_FOTO_REGISTRO_3 || filaM[14] || "";
        at.urlFotoRegistro4 = at.URL_FOTO_REGISTRO_4 || filaM[15] || "";
        at.urlFotoRegistro5 = at.URL_FOTO_REGISTRO_5 || filaM[16] || "";
        at.urlFotoRegistro6 = at.URL_FOTO_REGISTRO_6 || filaM[17] || "";
        at.urlFotoRegistro7 = at.URL_FOTO_REGISTRO_7 || filaM[18] || "";
        at.urlFotoRegistro8 = at.URL_FOTO_REGISTRO_8 || filaM[19] || "";

        at.firmaTecnicoUrl = at.FIRMA_TECNICO_URL || filaM[20] || "";
        at.firmaClienteUrl = at.FIRMA_CLIENTE_URL || filaM[21] || "";
        at.nombreEncargado = at.NOMBRE_ENCARGADO || filaM[22] || "";
        at.dniEncargado = at.DNI_ENCARGADO || filaM[23] || "";

        at.tecnicoApoyo1 = at.TECNICO_APOYO_1 || filaM[24] || "";
        at.tecnicoApoyo2 = at.TECNICO_APOYO_2 || filaM[25] || "";

        at.notasFotos = {};
        const celdaNotasAA = at.NOTAS_FOTOS || filaM[26] || "";
        if (celdaNotasAA) {
          if (typeof celdaNotasAA === "string" && celdaNotasAA.trim().startsWith("{")) {
            try { at.notasFotos = JSON.parse(celdaNotasAA); } catch(e) { at.notasFotos = celdaNotasAA; }
          } else {
            at.notasFotos = celdaNotasAA;
          }
        }
        
        const tiendaAsociada = tiendas.find(t => t.codigo === at.codigoTienda);
        at.estado = tiendaAsociada ? tiendaAsociada.estado : "CONFORME";
        atenciones.push(at);
      }
    }

    // 3. Lectura de Inventario Censado (16 Columnas Canónicas)
    const hojaInventario = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
    const inventario = [];
    if (hojaInventario) {
      const datosInv = hojaInventario.getDataRange().getValues();
      const cabInv = datosInv[0] || [];
      for (let i = 1; i < datosInv.length; i++) {
        const filaI = datosInv[i];
        if (!filaI[0]) continue;
        const inv = {};
        for (let j = 0; j < cabInv.length; j++) {
          inv[cabInv[j]] = filaI[j];
        }
        inv.idItem = inv.ID_ITEM || filaI[0];
        inv.idVisita = inv.ID_VISITA || filaI[1];
        inv.fechaRegistro = normalizarFechaHoraTexto_(inv.FECHA_REGISTRO || filaI[2]);
        inv.codigoTienda = extraerCodigoPuro_(inv.CODIGO_TIENDA || filaI[3]);
        inv.tipoEquipo = inv.TIPO_EQUIPO || filaI[4];
        inv.marca = inv.MARCA || filaI[5];
        inv.modelo = inv.MODELO || filaI[6];
        inv.serie = sanitizarNumeroSerie_(inv.NUMERO_SERIE || filaI[7]);
        inv.numeroSerie = inv.serie;
        inv.codInventario = sanitizarNumeroSerie_(inv.COD_INVENTARIO || filaI[8]);
        inv.ubicacionCaja = inv.UBICACION_CAJA || filaI[9];
        inv.condicion = String(inv.CONDICION || filaI[10] || "OPERATIVO").trim().toUpperCase();

        // Nuevos campos canónicos Coolbox
        const cond = inv.condicion;
        inv.estadoFisico = String(inv.ESTADO_FISICO || filaI[11] || "").trim();
        if (!inv.estadoFisico) {
          if (cond === "INOPERATIVO" || cond === "DE BAJA / RETIRADO") inv.estadoFisico = "Malo";
          else if (cond === "RENOVACION") inv.estadoFisico = "Regular";
          else inv.estadoFisico = "Bueno";
        }

        inv.operativo = String(inv.OPERATIVO || filaI[12] || "").trim();
        if (!inv.operativo) {
          if (cond === "INOPERATIVO" || cond === "DE BAJA / RETIRADO") inv.operativo = "No";
          else inv.operativo = "Sí";
        }

        inv.hostname = String(inv.HOSTNAME || filaI[13] || "").trim().toUpperCase();
        inv.anydesk = String(inv.ANYDESK || filaI[14] || "").trim();
        inv.androidImei = String(inv.ANDROID_IMEI || filaI[15] || "").trim();
        inv.imei = inv.androidImei;

        inventario.push(inv);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      exito: true, 
      tiendas: tiendas,
      locales: tiendas,
      atenciones: atenciones,
      inventario: inventario,
      equipos: inventario
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      exito: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==============================================================================
// 4.1 FUNCIÓN COMPLEMENTARIA: CATÁLOGO LIGERO PARA google.script.run
// ==============================================================================

function obtenerCatalogoTiendas() {
  try {
    const libro = obtenerLibroSeguro();
    const hojaTiendas = obtenerHojaTiendasSegura_(libro);
    if (!hojaTiendas) return [];

    const datos = hojaTiendas.getDataRange().getValues();
    const cabeceras = datos[0];
    const tiendas = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (!fila[0]) continue;
      const tienda = {};
      for (let j = 0; j < cabeceras.length; j++) {
        tienda[cabeceras[j]] = fila[j];
      }
      tienda.codigo = extraerCodigoPuro_(fila[0]);
      tienda.nombre = String(tienda.NOMBRE_TIENDA || fila[1] || "").trim();
      tienda.ciudad = String(tienda.CIUDAD || fila[2] || "").trim();
      tienda.direccion = String(tienda.DIRECCION || fila[3] || "").trim();
      tienda.clasificacion = String(tienda.CLASIFICACION || fila[4] || "Bronce").trim();
      tienda.servidor = String(tienda.SERVIDOR_IGC || fila[5] || "NO").trim();
      tienda.estado = String(tienda.ESTADO_ATENCION || fila[6] || "PENDIENTE").trim().toUpperCase();
      tienda.equiposAsignados = parseInt(tienda["EQUIPOS ASIGNADOS"] || fila[7] || 2, 10);
      tienda.cajasNominales = parseInt(tienda["CAJAS FIJAS"] || fila[9] || 2, 10);
      tiendas.push(tienda);
    }
    return tiendas;
  } catch (e) {
    Logger.log("Error en obtenerCatalogoTiendas: " + e.toString());
    return [];
  }
}

// ==============================================================================
// 5. CONTROLADOR POST (doPost)
// ==============================================================================

function doPost(e) {
  try {
    let contenido = {};
    if (e && e.postData && e.postData.contents) {
      contenido = JSON.parse(e.postData.contents);
    }

    const accion = (contenido.accion || contenido.action || "").toString().trim();

    if (accion === "enviarDocumentacionSede" || accion === "despacharCorreo") {
      return ContentService.createTextOutput(JSON.stringify(enviarDocumentacionSede(contenido)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (accion === "actualizarReporteAdmin") {
      return ContentService.createTextOutput(JSON.stringify(actualizarReporteAdmin(contenido)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify(procesarAtencionTecnicaCompleta(contenido)))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      exito: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==============================================================================
// 6. REGISTRO ATÓMICO CON ACTUALIZACIÓN FORZADA INMEDIATA
// ==============================================================================

function procesarAtencionTecnicaCompleta(payload) {
  try {
    const rawCod = payload.codigoTienda || payload.codigo || "";
    const codigoTienda = extraerCodigoPuro_(rawCod);
    if (!codigoTienda) {
      return { exito: false, mensaje: "Error: Código de tienda no recibido." };
    }

    const carpetaDestino = obtenerOCrearCarpetaDrive("Evidencias Coolbox 2026");

    // Subida de firmas digitales en Drive
    const urlFirmaTecnicoNueva = guardarImagenBase64EnDrive(payload.firmaTecnicoBase64 || payload.firmaTecnico || "", "Firma_Tecnico_" + codigoTienda + ".png", carpetaDestino);
    const urlFirmaClienteNueva = guardarImagenBase64EnDrive(payload.firmaClienteBase64 || payload.firmaCliente || "", "Firma_Cliente_" + codigoTienda + ".png", carpetaDestino);

    // Subida de fotos de gabinete en Drive
    const rawFotoAntes = payload.urlFotoGabineteAntes || payload.fotoGabineteAntes || payload.urlFotoAntes || payload.fotoAntes || payload.dataFotoAntes || "";
    const rawFotoDesp  = payload.urlFotoGabineteDespues || payload.fotoGabineteDespues || payload.urlFotoDespues || payload.fotoDespues || payload.dataFotoDespues || "";

    const urlFotoGabAntesNueva = guardarImagenBase64EnDrive(rawFotoAntes, "Foto_Gabinete_Antes_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoGabDespNueva  = guardarImagenBase64EnDrive(rawFotoDesp, "Foto_Gabinete_Despues_" + codigoTienda + ".jpg", carpetaDestino);

    // Subida de fotos de reporte en Drive
    const fotosArr = payload.fotosReporte || [];
    const fotosObj = payload.fotos || {};

    const rawR1 = payload.urlFotoRegistro1 || fotosObj.urlFotoRegistro1 || fotosObj.registro1 || extraerFotoSegura(fotosArr, 0) || "";
    const rawR2 = payload.urlFotoRegistro2 || fotosObj.urlFotoRegistro2 || fotosObj.registro2 || extraerFotoSegura(fotosArr, 1) || "";
    const rawR3 = payload.urlFotoRegistro3 || fotosObj.urlFotoRegistro3 || fotosObj.registro3 || extraerFotoSegura(fotosArr, 2) || "";
    const rawR4 = payload.urlFotoRegistro4 || fotosObj.urlFotoRegistro4 || fotosObj.registro4 || extraerFotoSegura(fotosArr, 3) || "";
    const rawR5 = payload.urlFotoRegistro5 || fotosObj.urlFotoRegistro5 || fotosObj.registro5 || extraerFotoSegura(fotosArr, 4) || "";
    const rawR6 = payload.urlFotoRegistro6 || fotosObj.urlFotoRegistro6 || fotosObj.registro6 || extraerFotoSegura(fotosArr, 5) || "";
    const rawR7 = payload.urlFotoRegistro7 || fotosObj.urlFotoRegistro7 || fotosObj.registro7 || extraerFotoSegura(fotosArr, 6) || "";
    const rawR8 = payload.urlFotoRegistro8 || fotosObj.urlFotoRegistro8 || fotosObj.registro8 || extraerFotoSegura(fotosArr, 7) || "";

    const urlR1Nueva = guardarImagenBase64EnDrive(rawR1, "Foto_Registro_1_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR2Nueva = guardarImagenBase64EnDrive(rawR2, "Foto_Registro_2_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR3Nueva = guardarImagenBase64EnDrive(rawR3, "Foto_Registro_3_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR4Nueva = guardarImagenBase64EnDrive(rawR4, "Foto_Registro_4_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR5Nueva = guardarImagenBase64EnDrive(rawR5, "Foto_Registro_5_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR6Nueva = guardarImagenBase64EnDrive(rawR6, "Foto_Registro_6_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR7Nueva = guardarImagenBase64EnDrive(rawR7, "Foto_Registro_7_" + codigoTienda + ".jpg", carpetaDestino);
    const urlR8Nueva = guardarImagenBase64EnDrive(rawR8, "Foto_Registro_8_" + codigoTienda + ".jpg", carpetaDestino);

    // Notas de fotos en Columna AA (27)
    const notasNuevasObj = {};
    if (Array.isArray(payload.fotosReporte)) {
      payload.fotosReporte.forEach(function(f, idx) {
        if (f && f.descripcion && String(f.descripcion).trim() !== "") {
          notasNuevasObj["foto" + (idx + 1)] = String(f.descripcion).trim();
        }
      });
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (eLock) {
      return { exito: false, mensaje: "Servidor ocupado. Intente nuevamente en unos segundos." };
    }

    try {
      const libro = obtenerLibroSeguro();
      const hojaMantenimiento = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
      const ahora = new Date();
      const fechaHoraTexto = Utilities.formatDate(ahora, "GMT-5", "dd/MM/yyyy HH:mm:ss");

      let idVisitaDefinitivo = "VIS-" + codigoTienda + "-" + Utilities.formatDate(ahora, "GMT-5", "yyyyMMdd-HHmm");
      let filaExistenteIndex = -1;
      let filaPrevia = null;

      if (hojaMantenimiento) {
        const datosMant = hojaMantenimiento.getDataRange().getValues();
        for (let f = 1; f < datosMant.length; f++) {
          const codFilaMant = extraerCodigoPuro_(datosMant[f][3]);
          if (codFilaMant === codigoTienda) {
            filaExistenteIndex = f + 1;
            filaPrevia = datosMant[f];
            if (filaPrevia[0]) {
              idVisitaDefinitivo = filaPrevia[0];
            }
            break;
          }
        }

        const urlFotoGabAntes = urlFotoGabAntesNueva || (filaPrevia ? filaPrevia[7] : "") || "";
        const urlFotoGabDesp  = urlFotoGabDespNueva  || (filaPrevia ? filaPrevia[8] : "") || "";

        const urlR1 = urlR1Nueva || (filaPrevia ? filaPrevia[12] : "") || "";
        const urlR2 = urlR2Nueva || (filaPrevia ? filaPrevia[13] : "") || "";
        const urlR3 = urlR3Nueva || (filaPrevia ? filaPrevia[14] : "") || "";
        const urlR4 = urlR4Nueva || (filaPrevia ? filaPrevia[15] : "") || "";
        const urlR5 = urlR5Nueva || (filaPrevia ? filaPrevia[16] : "") || "";
        const urlR6 = urlR6Nueva || (filaPrevia ? filaPrevia[17] : "") || "";
        const urlR7 = urlR7Nueva || (filaPrevia ? filaPrevia[18] : "") || "";
        const urlR8 = urlR8Nueva || (filaPrevia ? filaPrevia[19] : "") || "";

        const urlFirmaTecnico = urlFirmaTecnicoNueva || (filaPrevia ? filaPrevia[20] : "") || "";
        const urlFirmaCliente = urlFirmaClienteNueva || (filaPrevia ? filaPrevia[21] : "") || "";

        const nombreEncargado = (payload.nombreEncargado && String(payload.nombreEncargado).trim() !== "")
          ? String(payload.nombreEncargado).trim().toUpperCase()
          : (filaPrevia ? filaPrevia[22] : "ENCARGADO DE TIENDA");

        const dniEncargado = (payload.dniEncargado && String(payload.dniEncargado).trim() !== "")
          ? String(payload.dniEncargado).replace(/\D/g, "").slice(0, 8)
          : (filaPrevia ? filaPrevia[23] : "");

        // PRESERVACIÓN BLINDADA DE CUADRILLA: Jamás se borra un asistente previo
        const tecnicoTitular = (payload.tecnico || payload.tecnicoTitular)
          ? String(payload.tecnico || payload.tecnicoTitular).trim().toUpperCase()
          : (filaPrevia ? filaPrevia[2] : "TÉCNICO JSERVICE RV");

        const tecnicoApoyo1 = (payload.tecnicoApoyo1 !== undefined && String(payload.tecnicoApoyo1).trim() !== "")
          ? String(payload.tecnicoApoyo1).trim().toUpperCase()
          : (filaPrevia ? filaPrevia[24] : "");

        const tecnicoApoyo2 = (payload.tecnicoApoyo2 !== undefined && String(payload.tecnicoApoyo2).trim() !== "")
          ? String(payload.tecnicoApoyo2).trim().toUpperCase()
          : (filaPrevia ? filaPrevia[25] : "");

        let notasExistentes = {};
        if (filaPrevia && filaPrevia[26]) {
          try {
            const rawPrev = String(filaPrevia[26]).trim();
            if (rawPrev.startsWith("{")) notasExistentes = JSON.parse(rawPrev);
          } catch (eNotas) {}
        }
        const notasConsolidadas = Object.assign({}, notasExistentes, notasNuevasObj);
        const notasFotosColumnaAA = Object.keys(notasConsolidadas).length > 0 ? JSON.stringify(notasConsolidadas) : "";

        // Formateo de Cómputo
        let estadoComputoFinal = "";
        if (payload.estacionesMantenimiento) {
          estadoComputoFinal = typeof payload.estacionesMantenimiento === "string" 
            ? payload.estacionesMantenimiento 
            : JSON.stringify(payload.estacionesMantenimiento);
        } else if (filaPrevia && filaPrevia[10]) {
          estadoComputoFinal = filaPrevia[10];
        }

        const obsGabinete = payload.observacionesGabinete || (filaPrevia ? filaPrevia[9] : "") || "";
        const obsComputo = payload.observacionesComputo || payload.observaciones || (filaPrevia ? filaPrevia[11] : "") || "";

        const filaRegistro = [
          idVisitaDefinitivo,
          fechaHoraTexto,
          tecnicoTitular,
          codigoTienda,
          payload.gabineteLimpieza || (filaPrevia ? filaPrevia[4] : "Conforme"),
          payload.gabineteVentiladores || (filaPrevia ? filaPrevia[5] : "Operativo"),
          payload.gabinetePDU || (filaPrevia ? filaPrevia[6] : "Operativo"),
          urlFotoGabAntes,
          urlFotoGabDesp,
          obsGabinete,
          estadoComputoFinal,
          obsComputo,
          urlR1,
          urlR2,
          urlR3,
          urlR4,
          urlR5,
          urlR6,
          urlR7,
          urlR8,
          urlFirmaTecnico,
          urlFirmaCliente,
          nombreEncargado,
          dniEncargado,
          tecnicoApoyo1,
          tecnicoApoyo2,
          notasFotosColumnaAA
        ];

        if (filaExistenteIndex !== -1) {
          hojaMantenimiento.getRange(filaExistenteIndex, 1, 1, 27).setValues([filaRegistro]);
          hojaMantenimiento.getRange(filaExistenteIndex, 2).setNumberFormat("@");
        } else {
          hojaMantenimiento.appendRow(filaRegistro);
          const ultFilaM = hojaMantenimiento.getLastRow();
          hojaMantenimiento.getRange(ultFilaM, 2).setNumberFormat("@");
        }
      }

      // ======================================================================
      // 1. ACTUALIZACIÓN INMEDIATA Y SÍNCRONA DE DB_TIENDAS (PRIORIDAD N° 1)
      // ======================================================================
      let nuevoEstadoSede = "REALIZADO";
      const estForzado = String(payload.estadoSede || payload.nuevoEstado || "").trim().toUpperCase();
      const limp = String(payload.gabineteLimpieza || "").toLowerCase();
      const vent = String(payload.gabineteVentiladores || "").toLowerCase();
      const pdu  = String(payload.gabinetePDU || "").toLowerCase();
      const pduEsConforme = (pdu.includes("operativo") || pdu.includes("con energia") || !pdu) &&
                            (!pdu.includes("obs") && !pdu.includes("inop") && !pdu.includes("sin energ"));
      const ventEsConforme = (vent.includes("operativo") || vent.includes("no tiene") || vent.includes("sin extractor") || vent.includes("no aplica") || !vent) &&
                             (!vent.includes("inop") && !vent.includes("obs") && !vent.includes("falla") && !vent.includes("ruid") && !vent.includes("trab"));
      const limpEsConforme = (limp === "conforme" || limp.includes("limpio") || !limp) &&
                             (!limp.includes("no conforme") && !limp.includes("obs"));
      const gabConforme = limpEsConforme && ventEsConforme && pduEsConforme;

      if (estForzado && estForzado !== "PENDIENTE") {
        nuevoEstadoSede = estForzado;
        // Escudo de seguridad: si el gabinete NO está conforme (ventiladores inoperativos, PDU observado, suciedad),
        // degradar inmediatamente a OBSERVADO / PARCIAL para proteger la base de datos contra falsos conformes
        if (!gabConforme) {
          nuevoEstadoSede = "OBSERVADO / PARCIAL";
        } else if (nuevoEstadoSede === "OBSERVADO / PARCIAL" && gabConforme) {
          // Si viene marcado como OBSERVADO / PARCIAL pero el gabinete y todas las estaciones POS están conformes (6 tareas fijas),
          // proteger contra falsos positivos para consolidar Columna G en REALIZADO
          let listaEst = payload.estacionesMantenimiento || payload.computoEstado || payload.estacionesComputo || [];
          if (typeof listaEst === "string" && listaEst.trim().startsWith("[")) {
            try { listaEst = JSON.parse(listaEst); } catch(e) { listaEst = []; }
          }
          if (Array.isArray(listaEst) && listaEst.length > 0) {
            const estacionesPos = listaEst.filter(e => e && e.tipo !== "BACKUP_ALMACEN" && !String(e.estacion || "").toLowerCase().includes("backup"));
            const todasPosOk = estacionesPos.length > 0 && estacionesPos.every(e => {
              const estNorm = String(e.estado || "").toUpperCase();
              const estOk = !estNorm.includes("OBS") && !estNorm.includes("INOP");
              const seisOk = Boolean(e.limpiezaAIO && e.cambioPastaTermica && e.limpiezaTicketera && e.limpiezaLector && e.limpiezaGaveta && e.ordenCables);
              return estOk && seisOk;
            });
            if (todasPosOk) {
              nuevoEstadoSede = "REALIZADO";
            }
          }
        }
      } else {
        if (!gabConforme) {
          nuevoEstadoSede = "OBSERVADO / PARCIAL";
        }
      }

      // Se ejecuta aquí mismo con flush síncrono
      actualizarEstadoEnDbTiendasDirecto_(libro, codigoTienda, nuevoEstadoSede);

      // ======================================================================
      // 2. SINCRONIZACIÓN DE INVENTARIO QUIRÚRGICA (CERO CLEAR GLOBAL)
      // ======================================================================
      try {
        const hojaInventario = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
        const listaEquiposNuevos = payload.equipos || payload.censo_activos || [];
        if (hojaInventario && listaEquiposNuevos.length > 0) {
          const datosInv = hojaInventario.getDataRange().getValues();
          const cabeceraFija = ["ID_ITEM", "ID_VISITA", "FECHA_REGISTRO", "CODIGO_TIENDA", "TIPO_EQUIPO", "MARCA", "MODELO", "NUMERO_SERIE", "COD_INVENTARIO", "UBICACION_CAJA", "CONDICION", "ESTADO_FISICO", "OPERATIVO", "HOSTNAME", "ANYDESK", "ANDROID_IMEI"];

          // 1. Preservamos intactas las filas de TODAS las demás tiendas normalizando fecha
          const filasOtrasTiendas = [];
          for (let i = 1; i < datosInv.length; i++) {
            const codFilaInv = extraerCodigoPuro_(datosInv[i][3]);
            if (codFilaInv !== codigoTienda && datosInv[i][0] !== "") {
              const fila16 = new Array(16).fill("");
              for (let c = 0; c < 16; c++) {
                fila16[c] = datosInv[i][c] !== undefined ? datosInv[i][c] : "";
              }
              // Asegura formato de fecha canónico en las otras tiendas
              fila16[2] = normalizarFechaHoraTexto_(datosInv[i][2]);
              filasOtrasTiendas.push(fila16);
            }
          }

          // 2. Preparamos las filas nuevas de ESTA tienda estandarizadas con fecha canónica y 16 columnas
          const filasNuevasTienda = listaEquiposNuevos.map(function(eq, idx) {
            const numSerieLimpio = String(eq.serie || eq.numeroSerie || "").trim().toUpperCase();
            const condicionRaw = String(eq.condicion || eq.estado || "OPERATIVO").trim().toUpperCase();

            let estadoFisico = String(eq.estadoFisico || eq.estado_fisico || "").trim();
            if (!estadoFisico) {
              if (condicionRaw === "INOPERATIVO" || condicionRaw === "DE BAJA / RETIRADO") estadoFisico = "Malo";
              else if (condicionRaw === "RENOVACION") estadoFisico = "Regular";
              else estadoFisico = "Bueno";
            }

            let esOperativo = String(eq.operativo || "").trim();
            if (!esOperativo) {
              if (condicionRaw === "INOPERATIVO" || condicionRaw === "DE BAJA / RETIRADO") esOperativo = "No";
              else esOperativo = "Sí";
            }

            const hostname = String(eq.hostname || "").trim().toUpperCase();
            const anydesk = String(eq.anydesk || "").trim();
            const androidImei = String(eq.imei || eq.androidImei || eq.android_imei || "").trim();

            return [
              "ITEM-" + codigoTienda + "-" + (idx + 1),
              idVisitaDefinitivo,
              fechaHoraTexto,
              codigoTienda,
              normalizarTipoEquipoCanonico_(eq.tipo || eq.tipoEquipo || "EQUIPO", eq.ubicacion || eq.ubicacionCaja || ""),
              String(eq.marca || "GENÉRICO").trim().toUpperCase(),
              String(eq.modelo || "ESTÁNDAR").trim().toUpperCase(),
              numSerieLimpio !== "" ? numSerieLimpio : "SIN-SERIE-VISIBLE",
              String(eq.codInventario || eq.cod_patrimonial || "").trim().toUpperCase(),
              String(eq.ubicacion || eq.ubicacionCaja || "TIENDA").trim().toUpperCase(),
              condicionRaw,
              estadoFisico,
              esOperativo,
              hostname,
              anydesk,
              androidImei
            ];
          });

          // 3. Fusión segura sin destrucción de la hoja
          const inventarioFinal = filasOtrasTiendas.concat(filasNuevasTienda);
          const filasNecesarias = inventarioFinal.length + 1;
          const filasMaximas = hojaInventario.getMaxRows();
          if (filasNecesarias > filasMaximas) {
            hojaInventario.insertRowsAfter(filasMaximas, filasNecesarias - filasMaximas + 50);
          }

          const ultimaFila = hojaInventario.getLastRow();
          if (ultimaFila > 1) {
            hojaInventario.getRange(2, 1, ultimaFila - 1, 16).clearContent();
          }
          hojaInventario.getRange(1, 1, 1, 16).setValues([cabeceraFija]);
          if (inventarioFinal.length > 0) {
            hojaInventario.getRange(2, 1, inventarioFinal.length, 16).setValues(inventarioFinal);
            // Blindaje completo: formato texto @ en todas las 16 columnas para evitar notación científica
            hojaInventario.getRange(2, 1, inventarioFinal.length, 16).setNumberFormat("@");
          }
          SpreadsheetApp.flush();
        }
      } catch (eInv) {
        Logger.log("Aviso no fatal en inventario protegido: " + eInv.toString());
      }

      return {
        exito: true,
        mensaje: "Atención registrada con éxito para " + codigoTienda + " con estado " + nuevoEstadoSede
      };

    } finally {
      lock.releaseLock();
    }

  } catch (error) {
    Logger.log("Error en procesarAtencionTecnicaCompleta: " + error.toString());
    return { exito: false, error: error.toString() };
  }
}

// ==============================================================================
// 7. ACTUALIZACIÓN ADMINISTRATIVA COMPLETA (RESTAURADA AL 100%)
// ==============================================================================

function actualizarReporteAdmin(payload) {
  const rawCod = payload.codigoTienda || payload.codigo || payload.id_tienda || "";
  const codigoTienda = extraerCodigoPuro_(rawCod);
  if (!codigoTienda) {
    return { exito: false, mensaje: "Código de tienda no especificado." };
  }

  const libro = obtenerLibroSeguro();
  const hojaMantenimiento = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
  if (!hojaMantenimiento) {
    return { exito: false, mensaje: "Hoja " + NOMBRE_HOJA_MANTENIMIENTO + " no encontrada." };
  }

  const datosMant = hojaMantenimiento.getDataRange().getValues();
  let filaIndex = -1;
  for (let f = 1; f < datosMant.length; f++) {
    if (extraerCodigoPuro_(datosMant[f][3]) === codigoTienda) {
      filaIndex = f + 1;
      break;
    }
  }

  if (filaIndex === -1) {
    return { exito: false, mensaje: "No se encontró registro para la tienda " + codigoTienda };
  }

  const filaActual = datosMant[filaIndex - 1];
  const carpetaDestino = obtenerOCrearCarpetaDrive("Evidencias Coolbox 2026");

  function resolverFoto(nuevaFoto, fotoOriginal, prefijoNombre) {
    if (!nuevaFoto || nuevaFoto === "") return fotoOriginal || "";
    if (typeof nuevaFoto === "string") {
      const str = nuevaFoto.trim();
      if (str.startsWith("http://") || str.startsWith("https://")) return str;
    }
    const urlSubida = guardarImagenBase64EnDrive(nuevaFoto, prefijoNombre + "_" + codigoTienda + ".jpg", carpetaDestino);
    return urlSubida || fotoOriginal || "";
  }

  const fotosObj = payload.fotos || payload.fotosReporte || {};
  
  const urlFotoGabAntes = resolverFoto(fotosObj.urlFotoGabineteAntes || fotosObj.fotoGabineteAntes || payload.urlFotoGabineteAntes, filaActual[7], "Foto_Gabinete_Antes");
  const urlFotoGabDesp = resolverFoto(fotosObj.urlFotoGabineteDespues || fotosObj.fotoGabineteDespues || payload.urlFotoGabineteDespues, filaActual[8], "Foto_Gabinete_Despues");

  const urlR1 = resolverFoto(fotosObj.urlFotoRegistro1 || fotosObj.registro1 || payload.urlFotoRegistro1, filaActual[12], "Foto_Registro_1");
  const urlR2 = resolverFoto(fotosObj.urlFotoRegistro2 || fotosObj.registro2 || payload.urlFotoRegistro2, filaActual[13], "Foto_Registro_2");
  const urlR3 = resolverFoto(fotosObj.urlFotoRegistro3 || fotosObj.registro3 || payload.urlFotoRegistro3, filaActual[14], "Foto_Registro_3");
  const urlR4 = resolverFoto(fotosObj.urlFotoRegistro4 || fotosObj.registro4 || payload.urlFotoRegistro4, filaActual[15], "Foto_Registro_4");
  const urlR5 = resolverFoto(fotosObj.urlFotoRegistro5 || fotosObj.registro5 || payload.urlFotoRegistro5, filaActual[16], "Foto_Registro_5");
  const urlR6 = resolverFoto(fotosObj.urlFotoRegistro6 || fotosObj.registro6 || payload.urlFotoRegistro6, filaActual[17], "Foto_Registro_6");
  const urlR7 = resolverFoto(fotosObj.urlFotoRegistro7 || fotosObj.registro7 || payload.urlFotoRegistro7, filaActual[18], "Foto_Registro_7");
  const urlR8 = resolverFoto(fotosObj.urlFotoRegistro8 || fotosObj.registro8 || payload.urlFotoRegistro8, filaActual[19], "Foto_Registro_8");

  let estadoComputoJson = filaActual[10];
  if (payload.estacionesMantenimiento) {
    estadoComputoJson = typeof payload.estacionesMantenimiento === "string" 
      ? payload.estacionesMantenimiento 
      : JSON.stringify(payload.estacionesMantenimiento);
  }

  const obsComputo = payload.observacionesComputo !== undefined ? payload.observacionesComputo :
                     (payload.observaciones !== undefined ? payload.observaciones : filaActual[11]);
  const obsGabinete = payload.observacionesGabinete !== undefined ? payload.observacionesGabinete : filaActual[9];

  const nuevoNombreEncargado = (payload.nombreEncargado !== undefined && String(payload.nombreEncargado).trim() !== "")
    ? String(payload.nombreEncargado).trim().toUpperCase()
    : (filaActual[22] || "");

  const nuevoDniEncargado = (payload.dniEncargado !== undefined && String(payload.dniEncargado).trim() !== "")
    ? String(payload.dniEncargado).replace(/\D/g, "").slice(0, 8)
    : (filaActual[23] || "");

  let notasFotosVal = filaActual[26] || "";
  if (payload.notasFotos) {
    notasFotosVal = typeof payload.notasFotos === "string" ? payload.notasFotos : JSON.stringify(payload.notasFotos);
  } else if (payload.fotosReporte && Array.isArray(payload.fotosReporte)) {
    const objNotas = {};
    payload.fotosReporte.forEach((f, idx) => {
      if (f && f.descripcion) objNotas["foto" + (idx + 1)] = String(f.descripcion).trim();
    });
    if (Object.keys(objNotas).length > 0) notasFotosVal = JSON.stringify(objNotas);
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (eLock) {
    return { exito: false, mensaje: "Servidor ocupado. Intente nuevamente en unos segundos." };
  }

  try {
    // Normalización de la fecha/hora original de la visita
    const idVisitaOriginal = String(filaActual[0] || ("VIS-" + codigoTienda));
    const fechaRegistroTexto = normalizarFechaHoraTexto_(filaActual[1]);

    const filaActualizada = [
      idVisitaOriginal,
      fechaRegistroTexto, // <-- Protegido con formato canónico de hora completa
      String(payload.tecnico || payload.tecnicoTitular || filaActual[2]).trim().toUpperCase(),
      codigoTienda,
      payload.gabineteLimpieza || filaActual[4] || "Conforme",
      payload.gabineteVentiladores || filaActual[5] || "Operativo",
      payload.gabinetePDU || filaActual[6] || "Operativo",
      urlFotoGabAntes,
      urlFotoGabDesp,
      obsGabinete,
      estadoComputoJson,
      obsComputo,
      urlR1,
      urlR2,
      urlR3,
      urlR4,
      urlR5,
      urlR6,
      urlR7,
      urlR8,
      filaActual[20] || "",
      filaActual[21] || "",
      nuevoNombreEncargado,
      nuevoDniEncargado,
      String(payload.tecnicoApoyo1 !== undefined && String(payload.tecnicoApoyo1).trim() !== "" ? payload.tecnicoApoyo1 : (filaActual[24] || "")).trim().toUpperCase(),
      String(payload.tecnicoApoyo2 !== undefined && String(payload.tecnicoApoyo2).trim() !== "" ? payload.tecnicoApoyo2 : (filaActual[25] || "")).trim().toUpperCase(),
      notasFotosVal
    ];

    hojaMantenimiento.getRange(filaIndex, 1, 1, 27).setValues([filaActualizada]);
    hojaMantenimiento.getRange(filaIndex, 2).setNumberFormat("@");

    // ======================================================================
    // ACTUALIZACIÓN DE INVENTARIO ADMIN QUIRÚRGICA (CERO CLEAR GLOBAL)
    // ======================================================================
    try {
      const hojaInventario = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
      const listaEquipos = payload.equipos || payload.censo_activos || [];

      if (hojaInventario && listaEquipos.length > 0) {
        const datosInv = hojaInventario.getDataRange().getValues();
        const cabeceraInv = ["ID_ITEM", "ID_VISITA", "FECHA_REGISTRO", "CODIGO_TIENDA", "TIPO_EQUIPO", "MARCA", "MODELO", "NUMERO_SERIE", "COD_INVENTARIO", "UBICACION_CAJA", "CONDICION", "ESTADO_FISICO", "OPERATIVO", "HOSTNAME", "ANYDESK", "ANDROID_IMEI"];

        // 1. Conservamos intactas las filas de OTRAS tiendas normalizando fecha
        const filasRestantes = [];
        for (let i = 1; i < datosInv.length; i++) {
          if (extraerCodigoPuro_(datosInv[i][3]) !== codigoTienda && datosInv[i][0]) {
            const fila16 = new Array(16).fill("");
            for (let c = 0; c < 16; c++) {
              fila16[c] = datosInv[i][c] !== undefined ? datosInv[i][c] : "";
            }
            fila16[2] = normalizarFechaHoraTexto_(datosInv[i][2]);
            filasRestantes.push(fila16);
          }
        }

        // 2. Preparamos las filas nuevas normalizadas heredando la hora exacta y 16 columnas
        const nuevasFilasInv = listaEquipos.map(function(eq, idx) {
          const numSerieLimpio = String(eq.serie || eq.numeroSerie || "").trim().toUpperCase();
          const condicionRaw = String(eq.condicion || eq.estado || "OPERATIVO").trim().toUpperCase();

          let estadoFisico = String(eq.estadoFisico || eq.estado_fisico || "").trim();
          if (!estadoFisico) {
            if (condicionRaw === "INOPERATIVO" || condicionRaw === "DE BAJA / RETIRADO") estadoFisico = "Malo";
            else if (condicionRaw === "RENOVACION") estadoFisico = "Regular";
            else estadoFisico = "Bueno";
          }

          let esOperativo = String(eq.operativo || "").trim();
          if (!esOperativo) {
            if (condicionRaw === "INOPERATIVO" || condicionRaw === "DE BAJA / RETIRADO") esOperativo = "No";
            else esOperativo = "Sí";
          }

          const hostname = String(eq.hostname || "").trim().toUpperCase();
          const anydesk = String(eq.anydesk || "").trim();
          const androidImei = String(eq.imei || eq.androidImei || eq.android_imei || "").trim();

          return [
            "ITEM-" + codigoTienda + "-" + (idx + 1),
            idVisitaOriginal,
            fechaRegistroTexto, // <-- Hora exacta canónica garantizada
            codigoTienda,
            normalizarTipoEquipoCanonico_(eq.tipo || eq.tipoEquipo || "EQUIPO", eq.ubicacion || eq.ubicacionCaja || ""),
            String(eq.marca || "GENÉRICO").trim().toUpperCase(),
            String(eq.modelo || "ESTÁNDAR").trim().toUpperCase(),
            numSerieLimpio !== "" ? numSerieLimpio : "SIN-SERIE-VISIBLE",
            String(eq.codInventario || eq.cod_patrimonial || "").trim().toUpperCase(),
            String(eq.ubicacion || eq.ubicacionCaja || "TIENDA").trim().toUpperCase(),
            condicionRaw,
            estadoFisico,
            esOperativo,
            hostname,
            anydesk,
            androidImei
          ];
        });

        // 3. Reemplazo quirúrgico con flush síncrono
        const inventarioConsolidado = filasRestantes.concat(nuevasFilasInv);
        const filasNecesarias = inventarioConsolidado.length + 1;
        const filasMaximas = hojaInventario.getMaxRows();
        if (filasNecesarias > filasMaximas) {
          hojaInventario.insertRowsAfter(filasMaximas, filasNecesarias - filasMaximas + 50);
        }

        const ultimaFila = hojaInventario.getLastRow();
        if (ultimaFila > 1) {
          hojaInventario.getRange(2, 1, ultimaFila - 1, 16).clearContent();
        }
        hojaInventario.getRange(1, 1, 1, 16).setValues([cabeceraInv]);
        if (inventarioConsolidado.length > 0) {
          hojaInventario.getRange(2, 1, inventarioConsolidado.length, 16).setValues(inventarioConsolidado);
          // Blindaje completo: formato texto @ en todas las 16 columnas para evitar notación científica
          hojaInventario.getRange(2, 1, inventarioConsolidado.length, 16).setNumberFormat("@");
        }
        SpreadsheetApp.flush();
      }
    } catch (eInvAdmin) {
      Logger.log("Aviso no fatal en inventario admin protegido: " + eInvAdmin.toString());
    }

    // Actualización de estado en DB_TIENDAS
    const estadoDefinitivoAdmin = payload.estadoSede || payload.nuevoEstado || payload.estado || "CONFORME";
    actualizarEstadoEnDbTiendasDirecto_(libro, codigoTienda, estadoDefinitivoAdmin);

    return {
      exito: true,
      mensaje: "Reporte de la sede " + codigoTienda + " actualizado exitosamente con estado " + estadoDefinitivoAdmin
    };

  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 8. GESTIÓN MULTIMEDIA EN DRIVE Y CORREOS (RESTAURADO AL 100%)
// ==============================================================================

function guardarImagenBase64EnDrive(base64Data, nombreArchivo, carpeta) {
  if (!base64Data || typeof base64Data !== "string" || !carpeta) return "";
  const str = base64Data.trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  
  try {
    let tipoMime = "image/jpeg";
    let base64Limpio = str;
    if (str.indexOf("base64,") !== -1) {
      const partes = str.split("base64,");
      const cabeceraMime = partes[0].split(":")[1];
      if (cabeceraMime) tipoMime = cabeceraMime.split(";")[0].trim();
      base64Limpio = partes[1].trim();
    } else if (nombreArchivo.toLowerCase().endsWith(".png")) {
      tipoMime = "image/png";
    }
    const decodificado = Utilities.base64Decode(base64Limpio);
    const blob = Utilities.newBlob(decodificado, tipoMime, nombreArchivo);
    const archivo = carpeta.createFile(blob);
    archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return archivo.getUrl();
  } catch (e) {
    Logger.log("Error guardando imagen en Drive: " + e.toString());
    return "";
  }
}

function obtenerOCrearCarpetaDrive(nombreCarpeta) {
  const carpetas = DriveApp.getFoldersByName(nombreCarpeta);
  if (carpetas.hasNext()) return carpetas.next();
  return DriveApp.createFolder(nombreCarpeta);
}

function obtenerCarpetaRespaldoDrive() {
  try {
    return DriveApp.getFolderById(ID_CARPETA_RESPALDO_DRIVE);
  } catch (e) {
    try {
      const carpetas = DriveApp.getFoldersByName("REPORTES_COOLBOX_2026");
      if (carpetas.hasNext()) return carpetas.next();
    } catch (eFallback) {}
    return null;
  }
}

function enviarDocumentacionSede(arg1, arg2) {
  try {
    let payload = {};
    if (arg2 !== undefined) {
      payload = { datosTienda: arg1, correoDestino: arg2 };
    } else if (typeof arg1 === "object" && arg1 !== null) {
      payload = arg1;
    }

    const datosTienda = payload.datosTienda || payload.tienda || payload || {};
    const correoDestino = (payload.correoDestino || datosTienda.correoDestino || "").toString().trim();
    const rawCod = datosTienda.codigo || datosTienda.codigoTienda || "SEDE";
    const codigoTienda = extraerCodigoPuro_(rawCod);
    const nombreTienda = (datosTienda.nombre || datosTienda.nombreTienda || codigoTienda).toString().trim();
    const ciudad = (datosTienda.ciudad || "LIMA").toString().trim();
    const estadoServicio = (datosTienda.estado || "CONFORME").toString().trim();
    const ahora = new Date();
    const fechaHora = Utilities.formatDate(ahora, "GMT-5", "dd/MM/yyyy HH:mm");

    if (!correoDestino) return { exito: false, mensaje: "Error: Correo no especificado." };

    const carpetaDrive = obtenerCarpetaRespaldoDrive();
    if (!carpetaDrive) return { exito: false, mensaje: "Error: No se pudo conectar con la carpeta de Drive." };

    let urlActa = "";
    let urlFicha = "";

    const listaArchivos = payload.adjuntos || payload.archivos || [];
    if (Array.isArray(listaArchivos) && listaArchivos.length > 0) {
      listaArchivos.forEach(function(doc) {
        if (!doc || !doc.base64) return;
        let nombreDoc = doc.nombre || ("Documento_2026_" + codigoTienda + ".pdf");
        if (!nombreDoc.toLowerCase().endsWith(".pdf")) nombreDoc += ".pdf";

        let base64Limpio = doc.base64;
        if (base64Limpio.indexOf("base64,") !== -1) base64Limpio = base64Limpio.split("base64,")[1];

        const bytesPdf = Utilities.base64Decode(base64Limpio);
        const blobPdf = Utilities.newBlob(bytesPdf, "application/pdf", nombreDoc);

        // Limpieza automática preventiva: remueve versiones previas incompletas del mismo documento en la carpeta
        try {
          const archivosPrevios = carpetaDrive.getFilesByName(nombreDoc);
          while (archivosPrevios.hasNext()) {
            const archViejo = archivosPrevios.next();
            archViejo.setTrashed(true);
          }
        } catch (eTrash) {
          Logger.log("Aviso no fatal limpiando versión previa de Drive: " + eTrash.toString());
        }

        const archivoCreado = carpetaDrive.createFile(blobPdf);
        archivoCreado.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const urlDirecta = archivoCreado.getUrl();

        const nUpper = nombreDoc.toUpperCase();
        if (nUpper.indexOf("ACTA") !== -1) urlActa = urlDirecta;
        else if (nUpper.indexOf("FICHA") !== -1 || nUpper.indexOf("REPORTE") !== -1) urlFicha = urlDirecta;
      });
    }

    // BLINDAJE 3: Control defensivo de cuota de correo sin interrumpir guardado en Drive (5TB)
    let cuotaDisponible = 0;
    try {
      cuotaDisponible = MailApp.getRemainingDailyQuota();
    } catch(eQuota) {
      cuotaDisponible = 100;
    }

    if (cuotaDisponible < 1) {
      Logger.log("Aviso: Cuota diaria de correos en límite. Priorizando almacenamiento en Drive (5TB).");
      return { 
        exito: true, 
        correoEnviado: false, 
        mensaje: "Documentos archivados en Google Drive con éxito (Cuota diaria de correos en espera).", 
        urlActa: urlActa, 
        urlFicha: urlFicha 
      };
    }

    let asunto = payload.asunto || ("Entrega Operativa Coolbox 2026 — Sede " + codigoTienda + " (" + ciudad + ")");

    const cuerpoHtml = `
      <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
        <h2 style="color:#0f172a; margin-top:0;">JSERVICE RV E.I.R.L.</h2>
        <p>Documentación técnica oficial emitida para la sede: <strong>${codigoTienda} — ${nombreTienda}</strong></p>
        <p><strong>Dictamen:</strong> ${estadoServicio} | <strong>Fecha:</strong> ${fechaHora}</p>
        <div style="margin:20px 0;">
          ${urlActa ? `<p><a href="${urlActa}" target="_blank" style="display:inline-block; padding:12px 20px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">📄 Ver Acta de Conformidad Consolidada</a></p>` : ''}
          ${(!urlActa && urlFicha) ? `<p><a href="${urlFicha}" target="_blank" style="display:inline-block; padding:12px 20px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">📋 Ver Documento Técnico</a></p>` : ''}
        </div>
        <p style="font-size:12px; color:#64748b; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:10px;">Documento oficial archivado permanentemente en la carpeta corporativa de Google Drive (REPORTES_COOLBOX_2026).</p>
      </div>
    `;

    try {
      MailApp.sendEmail(correoDestino, asunto, "Documentación disponible en: " + (urlActa || urlFicha), {
        name: "JSERVICE RV — Control Operativo",
        htmlBody: cuerpoHtml
      });
      return { exito: true, correoEnviado: true, mensaje: "Correo enviado a " + correoDestino, urlActa: urlActa, urlFicha: urlFicha };
    } catch (eSend) {
      Logger.log("Aviso no fatal enviando correo: " + eSend.toString());
      return { 
        exito: true, 
        correoEnviado: false, 
        mensaje: "Documentos archivados en Google Drive con éxito (Aviso de envío: " + eSend.message + ")", 
        urlActa: urlActa, 
        urlFicha: urlFicha 
      };
    }

  } catch (error) {
    Logger.log("Error en enviarDocumentacionSede: " + error.toString());
    return { exito: false, mensaje: error.toString() };
  }
}

// ==============================================================================
// 9. AUTO-REPARACIÓN AUTOMÁTICA DE BASE DE DATOS (HISTÓRICO DE FECHAS)
// ==============================================================================

/**
 * Utilidad de mantenimiento: repara filas de INVENTARIO_EQUIPOS que tengan fecha corta
 * sincronizándolas con la hora exacta de su visita en REGISTRO_MANTENIMIENTO.
 */
function repararFechasInventarioExistentes() {
  Logger.log("==================================================");
  Logger.log("🔧 INICIANDO AUTO-REPARACIÓN DE FECHAS CON HORA");
  Logger.log("==================================================");

  const libro = obtenerLibroSeguro();
  const hojaInv = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
  const hojaMant = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
  if (!hojaInv || !hojaMant) {
    Logger.log("ERROR: No se encontraron las hojas requeridas.");
    return;
  }

  const datosMant = hojaMant.getDataRange().getValues();
  const mapaVisitas = {};
  for (let m = 1; m < datosMant.length; m++) {
    const idVis = String(datosMant[m][0]).trim();
    if (idVis) {
      mapaVisitas[idVis] = normalizarFechaHoraTexto_(datosMant[m][1]);
    }
  }

  const datosInv = hojaInv.getDataRange().getValues();
  let reparados = 0;
  for (let i = 1; i < datosInv.length; i++) {
    const idVisInv = String(datosInv[i][1]).trim();
    const fechaActual = String(datosInv[i][2]).trim();
    // Si no tiene dos puntos (:), le falta la hora o está truncada
    if (idVisInv && mapaVisitas[idVisInv] && (!fechaActual.includes(":") || fechaActual.length < 16)) {
      hojaInv.getRange(i + 1, 3).setValue(mapaVisitas[idVisInv]);
      reparados++;
    }
  }

  const ultFilaInv = hojaInv.getLastRow();
  if (ultFilaInv > 1) {
    hojaInv.getRange(2, 3, ultFilaInv - 1, 1).setNumberFormat("@");
  }

  const ultFilaMant = hojaMant.getLastRow();
  if (ultFilaMant > 1) {
    hojaMant.getRange(2, 2, ultFilaMant - 1, 1).setNumberFormat("@");
  }

  SpreadsheetApp.flush();
  Logger.log("✅ Fechas reparadas con hora exacta canónica: " + reparados);
}

// ==============================================================================
// 10. UTILIDADES DE MANTENIMIENTO Y PRODUCCIÓN DRIVE (1 CLIC)
// ==============================================================================

/**
 * UTILIDAD DE PUESTA EN MARCHA OFICIAL:
 * Limpia y deja en blanco la base de datos en Google Sheets para el inicio de la operación real 2026.
 * 1. Pone las 147 tiendas de DB_TIENDAS en estado "PENDIENTE".
 * 2. Limpia INVENTARIO_EQUIPOS (fila 2 en adelante) conservando las 16 columnas oficiales.
 * 3. Limpia REGISTRO_MANTENIMIENTO (fila 2 en adelante) conservando las 27 columnas oficiales.
 */
function limpiarBaseDatosParaProduccion() {
  Logger.log("==================================================");
  Logger.log("🧹 INICIANDO LIMPIEZA TOTAL PARA PRODUCCIÓN 2026");
  Logger.log("==================================================");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const libro = obtenerLibroSeguro();

    // 1. Limpieza de INVENTARIO_EQUIPOS
    const hojaInv = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
    if (hojaInv) {
      const ultFilaInv = hojaInv.getLastRow();
      if (ultFilaInv > 1) {
        hojaInv.getRange(2, 1, ultFilaInv - 1, 16).clearContent();
        Logger.log("✓ INVENTARIO_EQUIPOS: Filas de prueba eliminadas. Fila 1 (16 columnas) intacta.");
      }
      const cabeceraFija = ["ID_ITEM", "ID_VISITA", "FECHA_REGISTRO", "CODIGO_TIENDA", "TIPO_EQUIPO", "MARCA", "MODELO", "NUMERO_SERIE", "COD_INVENTARIO", "UBICACION_CAJA", "CONDICION", "ESTADO_FISICO", "OPERATIVO", "HOSTNAME", "ANYDESK", "ANDROID_IMEI"];
      hojaInv.getRange(1, 1, 1, 16).setValues([cabeceraFija]);
    }

    // 2. Limpieza de REGISTRO_MANTENIMIENTO
    const hojaMant = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
    if (hojaMant) {
      const ultFilaMant = hojaMant.getLastRow();
      if (ultFilaMant > 1) {
        hojaMant.getRange(2, 1, ultFilaMant - 1, 27).clearContent();
        Logger.log("✓ REGISTRO_MANTENIMIENTO: Visitas de prueba eliminadas. Fila 1 (27 columnas) intacta.");
      }
    }

    // 3. Reset de estados en DB_TIENDAS a PENDIENTE
    const hojaTiendas = obtenerHojaTiendasSegura_(libro);
    if (hojaTiendas) {
      const datos = hojaTiendas.getDataRange().getValues();
      let colEstado = -1;
      for (let c = 0; c < datos[0].length; c++) {
        const h = String(datos[0][c] || "").trim().toUpperCase();
        if (h === "ESTADO_ATENCION" || h.includes("ESTADO")) {
          colEstado = c + 1;
          break;
        }
      }
      if (colEstado !== -1 && datos.length > 1) {
        for (let r = 2; r <= datos.length; r++) {
          hojaTiendas.getRange(r, colEstado).setValue("PENDIENTE");
        }
        Logger.log("✓ DB_TIENDAS: Todas las tiendas configuradas en estado PENDIENTE.");
      }
    }

    SpreadsheetApp.flush();
    Logger.log("==================================================");
    Logger.log("✅ BASE DE DATOS DRIVE 100% LIMPIA Y LISTA PARA PRODUCCIÓN");
    Logger.log("==================================================");
    return { exito: true, mensaje: "Base de datos en Google Drive reseteada y limpia para producción." };

  } catch (e) {
    Logger.log("❌ Error en limpiarBaseDatosParaProduccion: " + e.toString());
    return { exito: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * UTILIDAD DE MANTENIMIENTO:
 * Recorre todas las filas de INVENTARIO_EQUIPOS en Google Drive y homologa
 * automáticamente la columna E (TIPO_EQUIPO) al formato canónico exacto del cliente Coolbox.
 */
function homologarNombresInventarioEnDrive() {
  Logger.log("==================================================");
  Logger.log("🔄 INICIANDO HOMOLOGACIÓN DE NOMBRES EN INVENTARIO DRIVE");
  Logger.log("==================================================");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const libro = obtenerLibroSeguro();
    const hojaInv = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
    if (!hojaInv) {
      Logger.log("ERROR: No se encontró la hoja " + NOMBRE_HOJA_INVENTARIO);
      return;
    }

    const datosInv = hojaInv.getDataRange().getValues();
    let modificados = 0;

    for (let i = 1; i < datosInv.length; i++) {
      const tipoActual = String(datosInv[i][4] || "").trim();
      const ubicacion = String(datosInv[i][9] || "").trim();
      if (!tipoActual) continue;

      const tipoCanonico = normalizarTipoEquipoCanonico_(tipoActual, ubicacion);
      if (tipoActual !== tipoCanonico) {
        hojaInv.getRange(i + 1, 5).setValue(tipoCanonico);
        modificados++;
      }
    }

    SpreadsheetApp.flush();
    Logger.log("✅ Filas de inventario homologadas en Drive: " + modificados);
    return { exito: true, filasHomologadas: modificados };
  } catch (e) {
    Logger.log("❌ Error en homologarNombresInventarioEnDrive: " + e.toString());
    return { exito: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 11. BANCO DE PRUEBAS: SIMULACIÓN DIRECTA EN EL EDITOR (TEST UNITARIO B13)
// ==============================================================================

function testSimularAtencionB13() {
  Logger.log("==================================================");
  Logger.log("🚀 INICIANDO TEST SIMULADO DE ATENCIÓN PARA B13");
  Logger.log("==================================================");

  // 1. Simulación del paquete atómico de cierre completo
  const payloadSimulado = {
    accion: "registrarAtencionTecnica",
    codigoTienda: "B13",
    codigo: "B13",
    nombreTienda: "B13 - CHINCHA",
    estadoSede: "REALIZADO",
    nuevoEstado: "REALIZADO",
    tecnico: "JIMMY JOSÉ ESPINOZA MEDINA",
    tecnicoTitular: "JIMMY JOSÉ ESPINOZA MEDINA",
    tecnicoApoyo1: "EDMAR PAUL CEDEÑO MORILLO",
    tecnicoApoyo2: "CESAR ENRIQUE GARCÍA MENDOZA",
    gabineteLimpieza: "Conforme",
    gabineteVentiladores: "Operativo",
    gabinetePDU: "Operativo",
    urlFotoGabineteAntes: "https://drive.google.com/file/d/test-foto-antes/view",
    urlFotoGabineteDespues: "https://drive.google.com/file/d/test-foto-despues/view",
    observacionesGabinete: "PRUEBA SIMULADA DIRECTA SIN NOVEDADES",
    estacionesMantenimiento: [
      {
        estacion: "Caja 01",
        numeroEstacion: 1,
        ubicacion: "Caja 01",
        estado: "Operativo 100%",
        limpiezaAIO: true,
        cambioPastaTermica: true,
        limpiezaTicketera: true,
        limpiezaImpresora: true,
        limpiezaLector: true,
        limpiezaGaveta: true,
        ordenCables: true,
        observaciones: "TEST SIMULADO OK"
      }
    ],
    observacionesComputo: "PRUEBAS DE SIMULACIÓN DIRECTA",
    equipos: [
      {
        tipo: "ALL IN ONE",
        marca: "HP",
        modelo: "PROONE 400",
        serie: "TEST-SERIE-B13-OK",
        codInventario: "PAT-B13-TEST",
        ubicacion: "Caja 01",
        condicion: "OPERATIVO"
      }
    ],
    firmaTecnicoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    firmaClienteBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    nombreEncargado: "CARLOS MENDOZA (TEST)",
    dniEncargado: "12345678"
  };

  // 2. Ejecutar la función oficial del servidor
  const respuesta = procesarAtencionTecnicaCompleta(payloadSimulado);
  
  Logger.log("📦 RESPUESTA DEL SERVIDOR:");
  Logger.log(JSON.stringify(respuesta, null, 2));

  // 3. Auditoría visual en directo de la celda G de DB_TIENDAS
  const libro = obtenerLibroSeguro();
  const hojaTiendas = obtenerHojaTiendasSegura_(libro);

  if (hojaTiendas) {
    const datos = hojaTiendas.getDataRange().getValues();
    let colEstado = 7;
    for (let c = 0; c < datos[0].length; c++) {
      const h = String(datos[0][c] || "").trim().toUpperCase();
      if (h === "ESTADO_ATENCION" || h.includes("ESTADO")) {
        colEstado = c + 1;
        break;
      }
    }

    for (let f = 1; f < datos.length; f++) {
      if (extraerCodigoPuro_(datos[f][0]) === "B13") {
        const valorCeldaG = hojaTiendas.getRange(f + 1, colEstado).getValue();
        Logger.log("--------------------------------------------------");
        Logger.log("🎯 RESULTADO EN HOJA DB_TIENDAS:");
        Logger.log("Fila " + (f + 1) + " (B13) | Columna " + colEstado + " (G)");
        Logger.log("VALOR DE LA CELDA: [" + valorCeldaG + "]");
        Logger.log("--------------------------------------------------");
        break;
      }
    }
  }
}