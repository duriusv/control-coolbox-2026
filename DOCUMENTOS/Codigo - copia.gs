/**
 * BACKEND OFICIAL UNIFICADO — SISTEMA COOLBOX 2026
 * Empresa: JSERVICE RV E.I.R.L.
 * Supervisión: Andrews Berbesia y Jesús Silva
 */

// IDENTIFICADOR DE TU HOJA REAL EN GOOGLE DRIVE
const ID_HOJA_CALCULO = "1DcMXTs2PSgwXOW83Y2yGK3BjAfWoqNIbFNZ7okgkTRE";

// NOMBRES REALES DE LAS PESTAÑAS CONFIRMADOS EN DISCO
const NOMBRE_HOJA_TIENDAS = "DB_TIENDAS";
const NOMBRE_HOJA_MANTENIMIENTO = "REGISTRO_MANTENIMIENTO";
const NOMBRE_HOJA_INVENTARIO = "INVENTARIO_EQUIPOS";

/**
 * Obtiene el libro de cálculo de forma segura.
 */
function obtenerLibroSeguro() {
  try {
    return SpreadsheetApp.openById(ID_HOJA_CALCULO);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * RECEPTOR GET: Entrega el catálogo de tiendas al panel administrativo.
 */
function doGet(e) {
  try {
    const libro = obtenerLibroSeguro();
    const hojaTiendas = libro.getSheetByName(NOMBRE_HOJA_TIENDAS);
    
    if (!hojaTiendas) {
      return ContentService.createTextOutput(JSON.stringify({ 
        exito: false, 
        status: "error",
        resultado: "ERROR",
        success: false,
        mensaje: "Hoja DB_TIENDAS no encontrada." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

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
      tienda.codigo = String(tienda.CODIGO_TIENDA || fila[0] || "").trim();
      tienda.nombre = String(tienda.NOMBRE_TIENDA || fila[1] || "").trim();
      tienda.ciudad = String(tienda.CIUDAD || fila[2] || "").trim();
      tienda.direccion = String(tienda.DIRECCION || fila[3] || "").trim();
      tienda.clasificacion = String(tienda.CLASIFICACION || fila[4] || "Bronce").trim();
      tienda.servidor = String(tienda.SERVIDOR_IGC || fila[5] || "NO").trim();
      tienda.estado = String(tienda.ESTADO_ATENCION || fila[6] || "PENDIENTE").trim();
      tienda.equiposAsignados = parseInt(tienda["EQUIPOS ASIGNADOS"] || fila[7] || 2, 10);
      tienda.cajasNominales = parseInt(tienda["CAJAS FIJAS"] || fila[9] || 2, 10);
      tiendas.push(tienda);
    }

    // Lectura de atenciones registradas (REGISTRO_MANTENIMIENTO)
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
        at.fechaHora = at.FECHA_HORA || filaM[1];
        at.fecha = at.FECHA_HORA || filaM[1];
        at.fechaEjecucion = at.FECHA_HORA || filaM[1];
        at.tecnico = at.TECNICO || filaM[2];
        at.tecnicoLider = at.TECNICO || filaM[2];
        at.codigo = at.CODIGO_TIENDA || filaM[3];
        at.codigoTienda = at.CODIGO_TIENDA || filaM[3];
        at.tiendaCodigo = at.CODIGO_TIENDA || filaM[3];
        at.gabineteLimpieza = at.GABINETE_LIMPIEZA || filaM[4];
        at.gabineteVentiladores = at.GABINETE_VENTILADORES || filaM[5];
        at.gabinetePDU = at.GABINETE_PDU || filaM[6];
        at.urlFotoAntes = at.URL_FOTO_ANTES || filaM[7];
        at.urlFotoDespues = at.URL_FOTO_DESPUES || filaM[8];
        at.observacionesGabinete = at.OBSERVACIONES_GABINETE || filaM[9];
        at.computoEstado = at.COMPUTO_ESTADO || filaM[10];
        at.observacionesComputo = at.OBSERVACIONES_COMPUTO || filaM[11];
        at.observaciones = at.OBSERVACIONES_COMPUTO || at.OBSERVACIONES_GABINETE || "Atención registrada en base de datos.";
        at.estado = "CONFORME";
        at.gabineteEstado = at.GABINETE_LIMPIEZA || "CONFORME";
        atenciones.push(at);
      }
    }

    // Lectura de inventario censado (INVENTARIO_EQUIPOS)
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
        inv.fechaRegistro = inv.FECHA_REGISTRO || filaI[2];
        inv.codigoTienda = inv.CODIGO_TIENDA || filaI[3];
        inv.tiendaCodigo = inv.CODIGO_TIENDA || filaI[3];
        inv.tipoEquipo = inv.TIPO_EQUIPO || filaI[4];
        inv.tipo = inv.TIPO_EQUIPO || filaI[4];
        inv.marca = inv.MARCA || filaI[5];
        inv.modelo = inv.MODELO || filaI[6];
        inv.serie = inv.NUMERO_SERIE || filaI[7];
        inv.numeroSerie = inv.NUMERO_SERIE || filaI[7];
        inv.codInventario = inv.COD_INVENTARIO || filaI[8];
        inv.ubicacionCaja = inv.UBICACION_CAJA || filaI[9];
        inv.ubicacion = inv.UBICACION_CAJA || filaI[9];
        inv.condicion = inv.CONDICION || filaI[10];
        inventario.push(inv);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      exito: true, 
      status: "success",
      resultado: "EXITO",
      success: true,
      tiendas: tiendas,
      locales: tiendas,
      atenciones: atenciones,
      inventario: inventario,
      equipos: inventario
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      exito: false, 
      status: "error",
      resultado: "ERROR",
      success: false,
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * RECEPTOR POST UNIFICADO (Sin duplicidades):
 * Atiende envíos de correo desde el panel y recepciona atenciones de los técnicos.
 */
function doPost(e) {
  try {
    const contenido = (e && e.postData && e.postData.contents) 
      ? JSON.parse(e.postData.contents) 
      : {};

    const accion = contenido.accion;

    // RAMA A: Despacho de Documentación Oficial por Correo (Panel Admin)
    if (accion === "enviarDocumentacionSede") {
      const resultado = enviarDocumentacionSede(contenido.datosTienda, contenido.correoDestino);
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // RAMA B: Registro de Atención Técnica (Desde petición HTTP fetch)
    if (accion === "registrarAtencionTecnica" || accion === "registrarAtencion" || contenido.codigoTienda) {
      const resultadoRegistro = procesarAtencionTecnicaCompleta(contenido);
      return ContentService.createTextOutput(JSON.stringify(resultadoRegistro))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      exito: false, 
      mensaje: "Acción no reconocida en el servidor." 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      exito: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * FUNCIÓN PUENTE: Resuelve la llamada de la App Móvil si corre bajo google.script.run
 */
function guardarAtencion(payload) {
  return procesarAtencionTecnicaCompleta(payload);
}

/**
 * MOTOR TRANSACCIONAL: Guarda la atención en REGISTRO_MANTENIMIENTO,
 * los activos en INVENTARIO_EQUIPOS y cambia el estado en DB_TIENDAS.
 */
function procesarAtencionTecnicaCompleta(payload) {
  try {
    const libro = obtenerLibroSeguro();
    const codigoTienda = (payload.codigoTienda || payload.codigo || "").toString().trim().toUpperCase();
    
    if (!codigoTienda) {
      return { exito: false, mensaje: "Error: Código de tienda no recibido." };
    }

    const carpetaDestino = obtenerOCrearCarpetaDrive("Evidencias Coolbox 2026");

    // 1. Guardar firmas digitales en Drive
    const rawFirmaTecnico = payload.firmaTecnicoBase64 || payload.firmaTecnico || "";
    const rawFirmaCliente = payload.firmaClienteBase64 || payload.firmaCliente || "";
    const urlFirmaTecnico = guardarImagenBase64EnDrive(rawFirmaTecnico, "Firma_Tecnico_" + codigoTienda + ".png", carpetaDestino);
    const urlFirmaCliente = guardarImagenBase64EnDrive(rawFirmaCliente, "Firma_Cliente_" + codigoTienda + ".png", carpetaDestino);

    // 2. Guardar fotos de rack principales (Col 08 y Col 09)
    const rawFotoAntes = payload.urlFotoAntes || payload.fotoAntesBase64 || payload.fotoAntes || "";
    const rawFotoDesp = payload.urlFotoDespues || payload.fotoDespuesBase64 || payload.fotoDespues || "";
    const urlFotoAntes = guardarImagenBase64EnDrive(rawFotoAntes, "Foto_Antes_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoDespues = guardarImagenBase64EnDrive(rawFotoDesp, "Foto_Despues_" + codigoTienda + ".jpg", carpetaDestino);

    // 3. Guardar las 6 evidencias fotográficas complementarias de REGISTRO_MANTENIMIENTO
    const fotosArray = payload.fotosReporte || [];
    
    // Extracción de cada foto por clave directa o por su slot correspondiente
    const rawPos1 = payload.urlFotoPos1 || payload.fotoPos1Base64 || payload.fotoPos1 || (fotosArray[1] && (fotosArray[1].dataUrl || fotosArray[1].base64)) || (fotosArray[0] && (fotosArray[0].dataUrl || fotosArray[0].base64)) || "";
    const rawPos2 = payload.urlFotoPos2 || payload.fotoPos2Base64 || payload.fotoPos2 || (fotosArray[2] && (fotosArray[2].dataUrl || fotosArray[2].base64)) || "";
    const rawBackup = payload.urlFotoBackup || payload.fotoBackupBase64 || payload.fotoBackup || (fotosArray[4] && (fotosArray[4].dataUrl || fotosArray[4].base64)) || (fotosArray[2] && (fotosArray[2].dataUrl || fotosArray[2].base64)) || "";
    const rawPdu = payload.urlFotoPdu || payload.fotoPduBase64 || payload.fotoPdu || (fotosArray[5] && (fotosArray[5].dataUrl || fotosArray[5].base64)) || (fotosArray[3] && (fotosArray[3].dataUrl || fotosArray[3].base64)) || "";
    const rawPanor = payload.urlFotoPanoramica || payload.fotoPanoramicaBase64 || payload.fotoPanoramica || (fotosArray[0] && (fotosArray[0].dataUrl || fotosArray[0].base64)) || "";
    const rawActa = payload.urlFotoActa || payload.fotoActaBase64 || payload.fotoActa || (fotosArray[7] && (fotosArray[7].dataUrl || fotosArray[7].base64)) || (fotosArray[5] && (fotosArray[5].dataUrl || fotosArray[5].base64)) || "";

    const urlFotoPos1 = guardarImagenBase64EnDrive(rawPos1, "Foto_POS1_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoPos2 = guardarImagenBase64EnDrive(rawPos2, "Foto_POS2_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoBackup = guardarImagenBase64EnDrive(rawBackup, "Foto_Backup_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoPdu = guardarImagenBase64EnDrive(rawPdu, "Foto_PDU_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoPanoramica = guardarImagenBase64EnDrive(rawPanor, "Foto_Panoramica_" + codigoTienda + ".jpg", carpetaDestino);
    const urlFotoActa = guardarImagenBase64EnDrive(rawActa, "Foto_Acta_" + codigoTienda + ".jpg", carpetaDestino);

    // 4. Escribir fila en REGISTRO_MANTENIMIENTO (22 Columnas Exactas)
    const hojaMantenimiento = libro.getSheetByName(NOMBRE_HOJA_MANTENIMIENTO);
    const ahora = new Date();
    const idVisita = "VIS-" + codigoTienda + "-" + Utilities.formatDate(ahora, "GMT-5", "yyyyMMdd-HHmm");
    const fechaHoraTexto = Utilities.formatDate(ahora, "GMT-5", "dd/MM/yyyy HH:mm:ss");

    if (hojaMantenimiento) {
      const filaRegistro = [
        idVisita,                                         // Col 01: ID_VISITA
        fechaHoraTexto,                                   // Col 02: FECHA_HORA
        payload.tecnico || "Técnico JSERVICE RV",         // Col 03: TECNICO
        codigoTienda,                                     // Col 04: CODIGO_TIENDA
        payload.gabineteLimpieza || "Conforme",           // Col 05: GABINETE_LIMPIEZA
        payload.gabineteVentiladores || "Operativo",      // Col 06: GABINETE_VENTILADORES
        payload.gabinetePDU || "Operativo",               // Col 07: GABINETE_PDU
        urlFotoAntes,                                     // Col 08: URL_FOTO_ANTES
        urlFotoDespues,                                   // Col 09: URL_FOTO_DESPUES
        payload.observacionesGabinete || "",              // Col 10: OBSERVACIONES_GABINETE
        JSON.stringify(payload.estacionesMantenimiento || "Operativo"), // Col 11: COMPUTO_ESTADO
        payload.observacionesComputo || "",               // Col 12: OBSERVACIONES_COMPUTO
        urlFotoPos1,                                      // Col 13: URL_FOTO_POS1
        urlFotoPos2,                                      // Col 14: URL_FOTO_POS2
        urlFotoBackup,                                    // Col 15: URL_FOTO_BACKUP
        urlFotoPdu,                                       // Col 16: URL_FOTO_PDU
        urlFotoPanoramica,                                // Col 17: URL_FOTO_PANORAMICA
        urlFotoActa,                                      // Col 18: URL_FOTO_ACTA
        urlFirmaTecnico,                                  // Col 19: FIRMA_TECNICO_URL
        urlFirmaCliente,                                  // Col 20: FIRMA_CLIENTE_URL
        payload.nombreEncargado || "Encargado de Tienda", // Col 21: NOMBRE_ENCARGADO
        payload.dniEncargado || ""                        // Col 22: DNI_ENCARGADO
      ];
      hojaMantenimiento.appendRow(filaRegistro);
    }

    // 5. Escribir activos censados en INVENTARIO_EQUIPOS (11 Columnas Exactas)
    const hojaInventario = libro.getSheetByName(NOMBRE_HOJA_INVENTARIO);
    const listaEquipos = payload.equipos || [];
    if (hojaInventario && listaEquipos.length > 0) {
      listaEquipos.forEach(function(eq, idx) {
        hojaInventario.appendRow([
          "ITEM-" + codigoTienda + "-" + (idx + 1),       // Col 01: ID_ITEM
          idVisita,                                       // Col 02: ID_VISITA
          fechaHoraTexto,                                 // Col 03: FECHA_REGISTRO
          codigoTienda,                                   // Col 04: CODIGO_TIENDA
          eq.tipo || eq.tipoEquipo || eq.dispositivo || "EQUIPO",    // Col 05: TIPO_EQUIPO
          eq.marca || "GENÉRICO",                         // Col 06: MARCA
          eq.modelo || "ESTÁNDAR",                        // Col 07: MODELO
          eq.serie || "S/N",                              // Col 08: NUMERO_SERIE
          eq.codInventario || "",                         // Col 09: COD_INVENTARIO
          eq.ubicacion || eq.ubicacionCaja || "TIENDA",   // Col 10: UBICACION_CAJA
          eq.condicion || "OPERATIVO"                     // Col 11: CONDICION
        ]);
      });
    }

    // 6. Actualizar estado a "REALIZADO" en DB_TIENDAS
    actualizarEstadoEnDbTiendas(libro, codigoTienda, "REALIZADO");

    return {
      exito: true,
      mensaje: "Atención registrada con éxito en REGISTRO_MANTENIMIENTO para la sede " + codigoTienda
    };

  } catch (error) {
    Logger.log("Error en procesarAtencionTecnicaCompleta: " + error.toString());
    return { exito: false, error: error.toString() };
  }
}

/**
 * Actualiza la columna ESTADO_ATENCION en DB_TIENDAS.
 */
function actualizarEstadoEnDbTiendas(libro, codigoTienda, nuevoEstado) {
  const hoja = libro.getSheetByName(NOMBRE_HOJA_TIENDAS);
  if (!hoja) return;
  const datos = hoja.getDataRange().getValues();
  for (let f = 1; f < datos.length; f++) {
    if ((datos[f][0] || "").toString().trim().toUpperCase() === codigoTienda) {
      hoja.getRange(f + 1, 7).setValue(nuevoEstado); // Columna 7: ESTADO_ATENCION
      break;
    }
  }
}

/**
 * Guarda una cadena Base64 como archivo de imagen en Google Drive.
 */
function guardarImagenBase64EnDrive(base64Data, nombreArchivo, carpeta) {
  if (!base64Data || typeof base64Data !== "string" || !carpeta) {
    return "";
  }
  const str = base64Data.trim();
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }
  try {
    let tipoMime = "image/jpeg";
    let base64Limpio = str;
    if (str.indexOf("base64,") !== -1) {
      const partes = str.split("base64,");
      const cabeceraMime = partes[0].split(":")[1];
      if (cabeceraMime) {
        tipoMime = cabeceraMime.split(";")[0].trim();
      }
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

/**
 * Obtiene o crea la carpeta de evidencias en Drive.
 */
function obtenerOCrearCarpetaDrive(nombreCarpeta) {
  const carpetas = DriveApp.getFoldersByName(nombreCarpeta);
  if (carpetas.hasNext()) {
    return carpetas.next();
  }
  return DriveApp.createFolder(nombreCarpeta);
}

/**
 * Función de despacho de correos oficial (Mantiene lo ya validado).
 */
function enviarDocumentacionSede(datosTienda, correoDestino) {
  try {
    const codigo = datosTienda.codigo || "Sede";
    GmailApp.sendEmail(
      correoDestino, 
      "Documentación Técnica Oficial — Coolbox " + codigo,
      "Se adjunta la documentación técnica correspondiente a la sede " + codigo + " emitida por JSERVICE RV E.I.R.L."
    );
    return { exito: true, mensaje: "Documentación despachada exitosamente a: " + correoDestino };
  } catch (e) {
    return { exito: false, mensaje: "Error al enviar correo: " + e.toString() };
  }
}
/**
 * BANCO DE PRUEBAS UNITARIO (Metodología SDD)
 * Ejecuta una simulación completa de atención técnica en campo.
 */
function probarAtencionUnitaria() {
  Logger.log("=== INICIANDO BANCO DE PRUEBAS UNITARIO ===");

  // 1. Fabricamos el paquete de datos simulado (Payload de prueba)
  const payloadPrueba = {
    codigoTienda: "B11",
    tecnico: "Técnico Certificador JSERVICE RV",
    gabineteLimpieza: "Conforme",
    gabineteVentiladores: "Operativo",
    gabinetePDU: "Operativo",
    fotoAntesBase64: "",
    fotoDespuesBase64: "",
    observacionesGabinete: "Prueba unitaria de soplado y verificación de energía en rack",
    estacionesMantenimiento: [
      { estacion: "Caja 01", estado: "Operativo", limpieza: true },
      { estacion: "Caja 02", estado: "Operativo", limpieza: true }
    ],
    observacionesComputo: "Prueba unitaria de conexionado y limpieza en mostrador",
    fotosReporte: [
      { slot: 1, base64: "" },
      { slot: 2, base64: "" },
      { slot: 3, base64: "" },
      { slot: 4, base64: "" },
      { slot: 5, base64: "" },
      { slot: 6, base64: "" }
    ],
    firmaTecnicoBase64: "",
    firmaClienteBase64: "",
    nombreEncargado: "Carlos Mendoza Silva",
    dniEncargado: "45879632",
    equipos: [
      {
        tipoEquipo: "CPU POS",
        marca: "HP",
        modelo: "ProDesk 400",
        serie: "TEST-SN-HP-001",
        codInventario: "ACT-CBX-101",
        ubicacionCaja: "Caja 01",
        condicion: "OPERATIVO"
      },
      {
        tipoEquipo: "Impresora Tickets",
        marca: "Epson",
        modelo: "TM-T20III",
        serie: "TEST-SN-EP-002",
        codInventario: "ACT-CBX-102",
        ubicacionCaja: "Caja 01",
        condicion: "OPERATIVO"
      }
    ]
  };

  // 2. Invocamos directamente el motor transaccional
  const resultado = procesarAtencionTecnicaCompleta(payloadPrueba);

  // 3. Mostramos el veredicto en la consola
  Logger.log("Resultado del procesamiento: " + JSON.stringify(resultado));
  
  if (resultado.exito) {
    Logger.log(">>> PRUEBA UNITARIA EXITOSA: Base de datos sincronizada.");
  } else {
    Logger.log(">>> FALLO EN PRUEBA UNITARIA: " + resultado.mensaje);
  }
}