/**
 * ==========================================================================
 * BACKEND COMPLEMENTARIO: ACTUALIZAR REPORTE (GOOGLE APPS SCRIPT)
 * Empresa: JSERVICE RV E.I.R.L.
 * Sistema: Control de Mantenimiento Preventivo e Inventario Anual Coolbox 2026
 * ==========================================================================
 * Este módulo contiene la implementación oficial para integrar en doPost(e)
 * dentro de Codigo.gs en el proyecto de Google Apps Script.
 *
 * CARACTERÍSTICAS TÉCNICAS:
 * 1. Concurrencia protegida mediante LockService (waitLock de 30 segundos).
 * 2. Inmutabilidad estricta de firmas digitales y metadatos de auditoría
 *    (Columnas 19 a 22 en REGISTRO_MANTENIMIENTO nunca se alteran).
 * 3. Actualización atómica de columnas de mantenimiento (5 a 18).
 * 4. Reemplazo controlado por lotes (setValues) en INVENTARIO_EQUIPOS.
 * 5. Sincronización del estado de la sede en DB_TIENDAS.
 * 6. Gestión de imágenes Base64 hacia Google Drive con permisos públicos de lectura.
 */

/**
 * INTEGRACIÓN RECOMENDADA EN doPost(e):
 *
 * function doPost(e) {
 *   try {
 *     let contenido = {};
 *     if (e && e.postData && e.postData.contents) {
 *       contenido = JSON.parse(e.postData.contents);
 *     }
 *
 *     const accion = contenido.accion || contenido.action;
 *
 *     // RAMA DE ACTUALIZACIÓN / EDICIÓN DE REPORTES
 *     if (accion === "ACTUALIZAR_REPORTE_ADMIN" || accion === "ACTUALIZAR_REPORTE" || accion === "actualizarReporteAdmin" || accion === "actualizarReporte") {
 *       const resultado = actualizarReporteBackend(contenido);
 *       return ContentService.createTextOutput(JSON.stringify(resultado))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *
 *     // ... otras ramas existentes (enviarDocumentacionSede, registrarAtencionTecnica) ...
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({ success: false, exito: false, error: err.toString() }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

/**
 * MOTOR TRANSACCIONAL PARA ACTUALIZACIÓN DE REPORTES TÉCNICOS
 * @param {Object} payload Objeto recibido del frontend con idTienda / codigo y datos corregidos
 * @returns {Object} Respuesta estructurada con estado de la operación
 */
function actualizarReporteBackend(payload) {
  const lock = LockService.getScriptLock();
  try {
    // 1. Bloqueo de concurrencia defensivo de hasta 30 segundos
    lock.waitLock(30000);
  } catch (eLock) {
    return {
      success: false,
      exito: false,
      status: "error",
      message: "Servidor ocupado procesando otra transacción. Por favor reintente en unos segundos.",
      mensaje: "Servidor ocupado procesando otra transacción. Por favor reintente en unos segundos."
    };
  }

  try {
    const libro = typeof obtenerLibroSeguro === "function" 
      ? obtenerLibroSeguro() 
      : SpreadsheetApp.getActiveSpreadsheet();

    // 2. Extracción y validación del código de tienda
    const codigoTienda = (
      payload.idTienda || 
      payload.codigoTienda || 
      payload.codigo || 
      (payload.datos && (payload.datos.codigo || payload.datos.codigoTienda)) || 
      ""
    ).toString().trim().toUpperCase();

    if (!codigoTienda) {
      return {
        success: false,
        exito: false,
        status: "error",
        message: "Error de validación: Código de tienda no especificado en el payload.",
        mensaje: "Error de validación: Código de tienda no especificado en el payload."
      };
    }

    const datos = payload.datos || payload;
    const carpetaDestino = typeof obtenerOCrearCarpetaDrive === "function"
      ? obtenerOCrearCarpetaDrive("Evidencias Coolbox 2026")
      : null;

    // Helper interno para procesar imágenes Base64 o preservar URLs existentes
    function resolverUrlImagen(valorFoto, prefijoNombre) {
      if (!valorFoto || typeof valorFoto !== "string") return "";
      const str = valorFoto.trim();
      if (str.startsWith("http://") || str.startsWith("https://")) {
        return str;
      }
      if (str.startsWith("data:image/") || str.includes("base64,")) {
        if (typeof guardarImagenBase64EnDrive === "function" && carpetaDestino) {
          const extension = str.includes("image/png") ? ".png" : ".jpg";
          const nombreArchivo = prefijoNombre + "_" + codigoTienda + "_" + Utilities.formatDate(new Date(), "GMT-5", "yyyyMMdd-HHmmss") + extension;
          return guardarImagenBase64EnDrive(str, nombreArchivo, carpetaDestino);
        }
      }
      return str;
    }

    // 3. Resolución de evidencias fotográficas (Soporte para mapa fotos plano y campos individuales)
    const fObj = datos.fotos || payload.fotos || datos;
    const urlFotoAntes = resolverUrlImagen(fObj.fotoAntes || datos.urlFotoAntes || datos.fotoAntes, "Foto_Antes");
    const urlFotoDespues = resolverUrlImagen(fObj.fotoDespues || datos.urlFotoDespues || datos.fotoDespues, "Foto_Despues");
    const urlFotoPos1 = resolverUrlImagen(fObj.pos1 || datos.urlFotoPos1 || datos.fotoPos1, "Foto_POS1");
    const urlFotoPos2 = resolverUrlImagen(fObj.pos2 || datos.urlFotoPos2 || datos.fotoPos2, "Foto_POS2");
    const urlFotoBackup = resolverUrlImagen(fObj.backup || datos.urlFotoBackup || datos.fotoBackup, "Foto_Backup");
    const urlFotoPdu = resolverUrlImagen(fObj.pdu || datos.urlFotoPdu || datos.fotoPdu, "Foto_PDU");
    const urlFotoPanoramica = resolverUrlImagen(fObj.panoramica || datos.urlFotoPanoramica || datos.fotoPanoramica, "Foto_Panoramica");
    const urlFotoActa = resolverUrlImagen(fObj.acta || datos.urlFotoActa || datos.fotoActa, "Foto_Acta");

    // 4. Actualización en REGISTRO_MANTENIMIENTO
    const nombreHojaMantenimiento = typeof NOMBRE_HOJA_MANTENIMIENTO !== "undefined" 
      ? NOMBRE_HOJA_MANTENIMIENTO 
      : "REGISTRO_MANTENIMIENTO";
    const hojaMantenimiento = libro.getSheetByName(nombreHojaMantenimiento);

    let idVisitaExistente = "";
    let filaEncontrada = -1;

    if (hojaMantenimiento) {
      const matrizMant = hojaMantenimiento.getDataRange().getValues();
      // Búsqueda de la fila de atención por código de tienda (Col 4 -> índice 3)
      for (let i = matrizMant.length - 1; i >= 1; i--) {
        const codFila = (matrizMant[i][3] || "").toString().trim().toUpperCase();
        if (codFila === codigoTienda) {
          filaEncontrada = i + 1; // Fila 1-indexed en Google Sheets
          idVisitaExistente = matrizMant[i][0]; // ID_VISITA existente
          break;
        }
      }

      // Preparar serialización de estaciones de cómputo y POS
      let computoEstadoJson = "";
      if (datos.estacionesMantenimiento) {
        computoEstadoJson = typeof datos.estacionesMantenimiento === "string" 
          ? datos.estacionesMantenimiento 
          : JSON.stringify(datos.estacionesMantenimiento);
      } else if (datos.computoEstado) {
        computoEstadoJson = typeof datos.computoEstado === "string"
          ? datos.computoEstado
          : JSON.stringify(datos.computoEstado);
      } else {
        computoEstadoJson = "Operativo";
      }

      const obsComputo = datos.observacionesComputo || datos.observacionesGenerales || "";
      const ahora = new Date();
      const fechaHoraActual = Utilities.formatDate(ahora, "GMT-5", "dd/MM/yyyy HH:mm:ss");

      if (filaEncontrada > 1) {
        // ACTUALIZACIÓN DE FILA EXISTENTE (Preservando columnas 19-22: Firmas y Recepción)
        // Col 05: GABINETE_LIMPIEZA
        if (datos.gabineteLimpieza) hojaMantenimiento.getRange(filaEncontrada, 5).setValue(datos.gabineteLimpieza);
        // Col 06: GABINETE_VENTILADORES
        if (datos.gabineteVentiladores) hojaMantenimiento.getRange(filaEncontrada, 6).setValue(datos.gabineteVentiladores);
        // Col 07: GABINETE_PDU
        if (datos.gabinetePDU) hojaMantenimiento.getRange(filaEncontrada, 7).setValue(datos.gabinetePDU);
        // Col 08: URL_FOTO_ANTES
        if (urlFotoAntes) hojaMantenimiento.getRange(filaEncontrada, 8).setValue(urlFotoAntes);
        // Col 09: URL_FOTO_DESPUES
        if (urlFotoDespues) hojaMantenimiento.getRange(filaEncontrada, 9).setValue(urlFotoDespues);
        // Col 10: OBSERVACIONES_GABINETE
        if (datos.observacionesGabinete !== undefined) hojaMantenimiento.getRange(filaEncontrada, 10).setValue(datos.observacionesGabinete);
        // Col 11: COMPUTO_ESTADO
        hojaMantenimiento.getRange(filaEncontrada, 11).setValue(computoEstadoJson);
        // Col 12: OBSERVACIONES_COMPUTO
        if (obsComputo !== undefined) hojaMantenimiento.getRange(filaEncontrada, 12).setValue(obsComputo);
        // Col 13: URL_FOTO_POS1
        if (urlFotoPos1) hojaMantenimiento.getRange(filaEncontrada, 13).setValue(urlFotoPos1);
        // Col 14: URL_FOTO_POS2
        if (urlFotoPos2) hojaMantenimiento.getRange(filaEncontrada, 14).setValue(urlFotoPos2);
        // Col 15: URL_FOTO_BACKUP
        if (urlFotoBackup) hojaMantenimiento.getRange(filaEncontrada, 15).setValue(urlFotoBackup);
        // Col 16: URL_FOTO_PDU
        if (urlFotoPdu) hojaMantenimiento.getRange(filaEncontrada, 16).setValue(urlFotoPdu);
        // Col 17: URL_FOTO_PANORAMICA
        if (urlFotoPanoramica) hojaMantenimiento.getRange(filaEncontrada, 17).setValue(urlFotoPanoramica);
        // Col 18: URL_FOTO_ACTA
        if (urlFotoActa) hojaMantenimiento.getRange(filaEncontrada, 18).setValue(urlFotoActa);
        
        // ¡IMPORTANTE! Columnas 19 a 22 (FIRMA_TECNICO_URL, FIRMA_CLIENTE_URL, NOMBRE_ENCARGADO, DNI_ENCARGADO)
        // se mantienen estrictamente intactas para preservar validez legal y de auditoría.
      } else {
        // Inserción si la sede no tenía registro previo en REGISTRO_MANTENIMIENTO
        idVisitaExistente = "VIS-" + codigoTienda + "-" + Utilities.formatDate(ahora, "GMT-5", "yyyyMMdd-HHmm");
        const nuevaFila = [
          idVisitaExistente,                                  // Col 01: ID_VISITA
          fechaHoraActual,                                    // Col 02: FECHA_HORA
          datos.tecnicoLider || "Técnico JSERVICE RV",        // Col 03: TECNICO
          codigoTienda,                                       // Col 04: CODIGO_TIENDA
          datos.gabineteLimpieza || "Conforme",               // Col 05: GABINETE_LIMPIEZA
          datos.gabineteVentiladores || "Operativo",          // Col 06: GABINETE_VENTILADORES
          datos.gabinetePDU || "Operativo",                   // Col 07: GABINETE_PDU
          urlFotoAntes,                                       // Col 08: URL_FOTO_ANTES
          urlFotoDespues,                                     // Col 09: URL_FOTO_DESPUES
          datos.observacionesGabinete || "",                  // Col 10: OBSERVACIONES_GABINETE
          computoEstadoJson,                                  // Col 11: COMPUTO_ESTADO
          obsComputo,                                         // Col 12: OBSERVACIONES_COMPUTO
          urlFotoPos1,                                        // Col 13: URL_FOTO_POS1
          urlFotoPos2,                                        // Col 14: URL_FOTO_POS2
          urlFotoBackup,                                      // Col 15: URL_FOTO_BACKUP
          urlFotoPdu,                                         // Col 16: URL_FOTO_PDU
          urlFotoPanoramica,                                  // Col 17: URL_FOTO_PANORAMICA
          urlFotoActa,                                        // Col 18: URL_FOTO_ACTA
          "",                                                 // Col 19: FIRMA_TECNICO_URL
          "",                                                 // Col 20: FIRMA_CLIENTE_URL
          datos.nombreEncargado || "Encargado de Tienda",     // Col 21: NOMBRE_ENCARGADO
          datos.dniEncargado || ""                            // Col 22: DNI_ENCARGADO
        ];
        hojaMantenimiento.appendRow(nuevaFila);
      }
    }

    if (!idVisitaExistente) {
      idVisitaExistente = "VIS-" + codigoTienda + "-" + Utilities.formatDate(new Date(), "GMT-5", "yyyyMMdd-HHmm");
    }

    // 5. Actualización controlada en INVENTARIO_EQUIPOS (Preservando integridad referencial)
    const nombreHojaInventario = typeof NOMBRE_HOJA_INVENTARIO !== "undefined"
      ? NOMBRE_HOJA_INVENTARIO
      : "INVENTARIO_EQUIPOS";
    const hojaInventario = libro.getSheetByName(nombreHojaInventario);

    const listaEquipos = datos.equipos || [];
    if (hojaInventario && Array.isArray(listaEquipos)) {
      const matrizInv = hojaInventario.getDataRange().getValues();
      // Eliminar filas previas de esta tienda (recorrido inverso para no alterar índices)
      for (let f = matrizInv.length - 1; f >= 1; f--) {
        const codTiendaFila = (matrizInv[f][3] || "").toString().trim().toUpperCase();
        if (codTiendaFila === codigoTienda) {
          hojaInventario.deleteRow(f + 1);
        }
      }

      // Inserción en bloque masivo atómico (setValues)
      if (listaEquipos.length > 0) {
        const fechaHoraRegistro = Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy HH:mm:ss");
        const filasLote = listaEquipos.map(function(eq, idx) {
          return [
            eq.ID_ITEM || ("ITEM-" + codigoTienda + "-" + (idx + 1)), // Col 01: ID_ITEM
            idVisitaExistente,                                        // Col 02: ID_VISITA
            fechaHoraRegistro,                                        // Col 03: FECHA_REGISTRO
            codigoTienda,                                             // Col 04: CODIGO_TIENDA
            eq.TIPO_EQUIPO || eq.tipo || eq.tipoEquipo || "EQUIPO",   // Col 05: TIPO_EQUIPO
            eq.MARCA || eq.marca || "GENÉRICO",                       // Col 06: MARCA
            eq.MODELO || eq.modelo || "ESTÁNDAR",                     // Col 07: MODELO
            eq.NUMERO_SERIE || eq.serie || "S/N",                     // Col 08: NUMERO_SERIE
            eq.COD_INVENTARIO || eq.codInventario || "",              // Col 09: COD_INVENTARIO
            eq.UBICACION_CAJA || eq.ubicacion || "Caja 01",           // Col 10: UBICACION_CAJA
            eq.CONDICION || eq.condicion || "OPERATIVO"               // Col 11: CONDICION
          ];
        });

        const filaDestino = hojaInventario.getLastRow() + 1;
        hojaInventario.getRange(filaDestino, 1, filasLote.length, 11).setValues(filasLote);
      }
    }

    // 6. Actualización del estado en DB_TIENDAS
    const nuevoEstadoTienda = datos.estado || "REALIZADO";
    if (typeof actualizarEstadoEnDbTiendas === "function") {
      actualizarEstadoEnDbTiendas(libro, codigoTienda, nuevoEstadoTienda);
    } else {
      const nombreHojaTiendas = typeof NOMBRE_HOJA_TIENDAS !== "undefined"
        ? NOMBRE_HOJA_TIENDAS
        : "DB_TIENDAS";
      const hojaTiendas = libro.getSheetByName(nombreHojaTiendas);
      if (hojaTiendas) {
        const matrizTiendas = hojaTiendas.getDataRange().getValues();
        for (let t = 1; t < matrizTiendas.length; t++) {
          if ((matrizTiendas[t][0] || "").toString().trim().toUpperCase() === codigoTienda) {
            hojaTiendas.getRange(t + 1, 7).setValue(nuevoEstadoTienda); // Col 07: ESTADO_ATENCION
            break;
          }
        }
      }
    }

    return {
      success: true,
      exito: true,
      status: "success",
      resultado: "EXITO",
      codigoTienda: codigoTienda,
      message: "Reporte de la sede " + codigoTienda + " actualizado con éxito",
      mensaje: "Reporte de la sede " + codigoTienda + " actualizado con éxito"
    };

  } catch (error) {
    Logger.log("Error en actualizarReporteBackend: " + error.toString());
    return {
      success: false,
      exito: false,
      status: "error",
      error: error.toString(),
      message: "Error al actualizar reporte: " + error.toString(),
      mensaje: "Error al actualizar reporte: " + error.toString()
    };
  } finally {
    // Liberación rigurosa del bloqueo
    lock.releaseLock();
  }
}

/**
 * Alias de compatibilidad directa para la acción ACTUALIZAR_REPORTE_ADMIN
 */
function actualizarReporteAdmin(payload) {
  return actualizarReporteBackend(payload);
}

