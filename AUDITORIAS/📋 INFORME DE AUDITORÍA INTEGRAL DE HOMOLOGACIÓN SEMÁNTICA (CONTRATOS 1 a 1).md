# 📋 INFORME DE AUDITORÍA INTEGRAL DE HOMOLOGACIÓN SEMÁNTICA (CONTRATOS 1:1)

**Sistema:** Control de Mantenimiento Preventivo Integral de Cómputo POS y Censo de Activos Tecnológicos Coolbox 2026  
**Empresa Contratista:** JSERVICE RV E.I.R.L.  
**Supervisión Técnica:** Andrews Berbesia (Venezuela) & Jesús Silva (Perú)  
**Universo Operativo:** 140 tiendas Coolbox a nivel nacional (86 Lima/Callao, 54 Provincias)  
**Fecha de Auditoría:** 18 de Septiembre de 2026  
**Fase:** Fase 1 — Diagnóstico y Auditoría Cruzada Exhaustiva (Solo Lectura, Cero Modificación de Código de Producción)  

---

## 1. RESUMEN EJECUTIVO Y ALCANCE

La presente auditoría cruzada analiza la integridad semántica, coherencia terminológica, contratos de datos (JSON/Payload) y tratamiento de mayúsculas/minúsculas entre los cuatro componentes arquitectónicos del sistema:

1. **PWA Móvil de Campo (`./index.html`):** Interfaz táctil utilizada por las cuadrillas de 4 personas para capturar checklist de gabinete, censo de hardware 1 a 1, fotografías y firmas de conformidad.
2. **Panel de Control Operativo (`./Control Coolbox Admin/index.html`):** Estación de supervisión remota, visualización de KPIs, auditoría modal, edición de atenciones (`actualizarReporteAdmin`) y emisión de Ficha Técnica A4.
3. **Backend Google Apps Script (`Codigo.gs`):** Servidor transaccional encargado de `doGet`, `doPost` (`registrarAtencionTecnica`, `actualizarReporteAdmin`, `enviarDocumentacionSede`), guardado de imágenes en Drive y transacciones atómicas con `LockService`. Se contrasta además contra la especificación avanzada de 26 columnas (`Codigo.md` v3.0).
4. **Base de Datos Central (Google Sheets):** Estructura central de datos conformada por las pestañas:
   - `DB_TIENDAS` (13 columnas: Catálogo maestro de 140 sedes).
   - `REGISTRO_MANTENIMIENTO` (26 columnas A–Z: Auditorías de infraestructura y evidencias fotográficas).
   - `INVENTARIO_EQUIPOS` (11 columnas: Censo consolidado de hardware individualizado por serial).

---

## 2. MATRIZ MAESTRA DE HOMOLOGACIÓN SEMÁNTICA (CONTRATOS 1:1)

| Concepto Operativo | PWA Técnico (`./index.html`) | Backend (`Codigo.gs` v2.7) | Base de Datos (Sheets) | Panel Admin (`Control Coolbox Admin/index.html`) | Estado / Discrepancia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MÓDULO 1: IDENTIFICACIÓN Y METADATOS DE TIENDA** | | | | | |
| **Código de Tienda** | `tienda` (Select `#tiendaSelect`), payload: `codigoTienda` | `payload.codigoTienda \|\| payload.codigo`, normalizado con `.toUpperCase()` | Col A: `CODIGO_TIENDA` (ej. "B11", "B22", "B25") | `t.codigo \|\| t.CODIGO_TIENDA`, `codigoTienda` | 🟢 **HOMOLOGADO** (Consistente en mayúsculas). |
| **Nombre de Tienda** | Obtenido de catálogo local/remoto (`t.nombre`) | `tienda.nombre = String(tienda.NOMBRE_TIENDA \|\| fila[1])` | Col B: `NOMBRE_TIENDA` (ej. "B11 - LIMA", "B25 - PIURA") | `t.nombre \|\| t.NOMBRE_TIENDA`, extracción limpia `extraerNombreLimpioTienda` | 🟡 **LEVE**: PWA y Admin usan "Coolbox [Nombre]" o limpian prefijos, Sheets almacena prefijo con código (`B11 - LIMA`). No bloqueante. |
| **Ciudad / Región** | Propiedad de catálogo `t.ciudad` | `tienda.ciudad = String(tienda.CIUDAD \|\| fila[2])` | Col C: `CIUDAD` (ej. "LIMA", "PIURA", "AREQUIPA") | `t.ciudad`, `t.region` ("LIMA" o "PROVINCIA") | 🟢 **HOMOLOGADO**. |
| **Dirección de Sede** | `t.direccion` | `tienda.direccion = String(tienda.DIRECCION \|\| fila[3])` | Col D: `DIRECCION` | `t.direccion \|\| t.DIRECCION` | 🟢 **HOMOLOGADO**. |
| **Clasificación Comercial** | `t.clasificacion` | `tienda.clasificacion = String(tienda.CLASIFICACION \|\| fila[4] \|\| "Bronce")` | Col E: `CLASIFICACION` ("Oro", "Platino", "Bronce", "Diamante") | Normalizado: Oro, Platino, Bronce. Si es "Diamante", cae a "BRONCE" | 🔴 **DISCREPANCIA**: Tiendas categoría "Diamante" (ej. K71 Plaza Lima Norte) son degradadas a "BRONCE" en Admin al no estar en su lista de clasificación. |
| **Servidor IGC** | Indicador en catálogo | `tienda.servidor = String(tienda.SERVIDOR_IGC \|\| fila[5] \|\| "NO")` | Col F: `SERVIDOR_IGC` ("SÍ", "NO", "Servidor IGC", vacío) | Indicador visual de servidor | 🟡 **LEVE**: Valores heterogéneos en base de datos ("SÍ", "NO", texto descriptivo). |
| **Estado de Sede / Atención** | Muestra estado del catálogo | `actualizarEstadoEnDbTiendas` escribe "REALIZADO" en Col G de `DB_TIENDAS`. En `doGet`: `at.estado = "CONFORME"` | Col G: `ESTADO_ATENCION` ("REALIZADO", "PENDIENTE", o enteros corruptos "2", "1") | `estadoSede`, `estadoAtencion`, `estado` ("REALIZADO", "OBSERVADO", "PENDIENTE") | 🔴 **DISCREPANCIA**: `Codigo.gs` v2.7 marca siempre "REALIZADO" en `DB_TIENDAS` sin importar si hubo fallas críticas. En `DB_TIENDAS.csv` existen filas con números "2" y "1" por desalineación previa. |
| **Cajas Fijas / Nominales** | `cajasNominalesTienda` (calcula cajas activas y adicionales) | `tienda.cajasNominales = parseInt(fila[9] \|\| 2)` (Col J: `CAJAS FIJAS`) | Col J: `CAJAS FIJAS` y Col H: `EQUIPOS ASIGNADOS` | `t.cajasNominales \|\| t["CAJAS FIJAS"]` | 🟢 **HOMOLOGADO** (Fallback tolerante a 2 cajas). |
| **MÓDULO 2: CUADRILLA TÉCNICA Y ROLES OPERATIVOS** | | | | | |
| **Técnico Titular (Líder)** | Inputs `#tecnicoTitular` / `#tecnico1`. Payload: `tecnico`, `tecnicoTitular`, `tecnicoLider` | Escribe en Col 3 (C) `TECNICO`. En actualización in-situ: `payload.tecnico \|\| filaActual[2]` | Col C (3): `TECNICO` (ej. "Diego Rodríguez", "DIEGO RODRÍGUEZ") | `atencion.tecnico \|\| atencion.tecnicoLider`. Campo bloqueado en edición (🔒 `disabled`) | 🟡 **DISCREPANCIA DE FORMATO**: En Sheets conviven registros en Mayúsculas sostenidas y registros en Formato Título con tildes. PWA fuerza mayúsculas con `inicializarMayusculasUniversales()`. |
| **Técnico de Apoyo 1** | Input `#tecnicoApoyo1` / `#tecnico2`. Payload: `tecnicoApoyo1` | En v2.7 escribe en Col 23 (W). En `doGet` busca `TECNICO_APOYO1` o `filaM[22]` | Col Y (25): `TECNICO_APOYO_1` (con guión bajo) | `atencion.tecnicoApoyo1 \|\| atencion.TECNICO_APOYO1 \|\| atencion.TECNICO_APOYO_1` | 🔴 **DESFASE CRÍTICO**: En la BD de 26 columnas, Apoyo 1 está en la Col Y (25) con nombre `TECNICO_APOYO_1`. `Codigo.gs` v2.7 lo escribe en Col 23 (W) donde reside `NOMBRE_ENCARGADO`, provocando sobreescritura cruzada. |
| **Técnico de Apoyo 2** | Input `#tecnicoApoyo2` / `#tecnico3`. Payload: `tecnicoApoyo2` | En v2.7 escribe en Col 24 (X). En `doGet` busca `TECNICO_APOYO2` o `filaM[23]` | Col Z (26): `TECNICO_APOYO_2` (con guión bajo) | `atencion.tecnicoApoyo2 \|\| atencion.TECNICO_APOYO2 \|\| atencion.TECNICO_APOYO_2` | 🔴 **DESFASE CRÍTICO**: En la BD de 26 columnas, Apoyo 2 está en la Col Z (26). `Codigo.gs` v2.7 lo escribe en Col 24 (X) donde reside `DNI_ENCARGADO`. |
| **Consolidado de Cuadrilla** | Payload envía `tecnicosConsolidados` | No tiene columna propia en Sheets. Se deriva concatenando | No existe columna de cuadrilla consolidada | `extraerCuadrillaDesglosada`: concatena líder y apoyos para badges y visualización | 🟢 **HOMOLOGADO** (Comportamiento virtual correcto). |
| **MÓDULO 3: GABINETE DE COMUNICACIONES (RACK)** | | | | | |
| **Limpieza / Soplado Gabinete** | Select `#gabLimpieza` ("Conforme", "Observado"). Payload: `gabineteLimpieza` | Escribe en Col 5 (E): `payload.gabineteLimpieza \|\| "Conforme"` | Col E (5): `GABINETE_LIMPIEZA` (ej. "Conforme", "Conforme (Limpio y aspirado)") | `atencion.gabineteLimpieza`. En edición: `#edit-select-gabinete-limpieza` | 🟡 **MODERADO**: La BD contiene cadenas descriptivas largas ("Conforme (Limpio y aspirado)"). PWA envía solo "Conforme" u "Observado". |
| **Ventiladores / Extractores** | Select `#gabVentiladores` ("Operativo", "Inoperativo", "No Tiene"). Payload: `gabineteVentiladores` | Escribe en Col 6 (F): `payload.gabineteVentiladores \|\| "Operativo"` | Col F (6): `GABINETE_VENTILADORES` (ej. "Operativo (Flujo de aire óptimo)") | `atencion.gabineteVentiladores`. En edición: `#edit-select-gabinete-ventiladores` | 🟡 **MODERADO**: Misma discrepancia de cadenas largas en la BD vs valores estándar del formulario. |
| **PDU / Supresor Gabinete** | Select `#gabPDU` ("Operativo", "Inoperativo", "No Tiene"). Payload: `gabinetePDU` | Escribe en Col 7 (G): `payload.gabinetePDU \|\| "Operativo"` | Col G (7): `GABINETE_PDU` | `atencion.gabinetePDU`. En edición: `#edit-select-gabinete-pdu` | 🟢 **HOMOLOGADO**. |
| **Observaciones Gabinete** | Textarea `#gabObs`. Payload: `observacionesGabinete` (en mayúsculas) | Escribe en Col 10 (J): `payload.observacionesGabinete \|\| ""` | Col J (10): `OBSERVACIONES_GABINETE` | `atencion.observacionesGabinete`. En edición: `#edit-input-obs-gabinete` | 🟢 **HOMOLOGADO**. |
| **Foto Gabinete Antes** | `fotoAntesBase64`. Payload: `urlFotoAntes`, `fotoAntesBase64` | Guarda imagen en Drive. En v2.7 busca `URL_FOTO_ANTES`, escribe Col 8 (H) | Col H (8): `URL_FOTO_GABINETE_ANTES` | `urlFotoGabineteAntes`, `urlFotoAntes`, `fotoAntes` | 🟡 **DISCREPANCIA SEMÁNTICA**: PWA envía `urlFotoAntes`, `Codigo.gs` v2.7 lee `urlFotoAntes`, pero el encabezado canónico de Sheets es `URL_FOTO_GABINETE_ANTES`. Admin implementa puente dual. |
| **Foto Gabinete Después** | `fotoDespuesBase64`. Payload: `urlFotoDespues`, `fotoDespuesBase64` | Guarda imagen en Drive. En v2.7 busca `URL_FOTO_DESPUES`, escribe Col 9 (I) | Col I (9): `URL_FOTO_GABINETE_DESPUES` | `urlFotoGabineteDespues`, `urlFotoDespues`, `fotoDespues` | 🟡 **DISCREPANCIA SEMÁNTICA**: Encabezado en Sheets es `URL_FOTO_GABINETE_DESPUES`. `Codigo.gs` v2.7 lee `urlFotoDespues`. |
| **MÓDULO 4: ANEXO FOTOGRÁFICO OFICIAL (8 REGISTROS CONSECUTIVOS)** | | | | | |
| **Registro 1 (POS 1)** | `fotosReporteArray[1]`. Payload: `urlFotoPos1` | Guarda en Drive como `Foto_POS1`. Escribe en Col 13 (M) | Col M (13): `URL_FOTO_REGISTRO_1` | `urlFotoRegistro1`, `urlFoto1`, `urlFotoPos1` | 🟡 **DISCREPANCIA**: En PWA se mapea desde el índice 1 del array. En Sheets se denomina `URL_FOTO_REGISTRO_1`. |
| **Registro 2 (POS 2)** | `fotosReporteArray[2]`. Payload: `urlFotoPos2` | Guarda en Drive como `Foto_POS2`. Escribe en Col 14 (N) | Col N (14): `URL_FOTO_REGISTRO_2` | `urlFotoRegistro2`, `urlFoto2`, `urlFotoPos2` | 🟡 **DISCREPANCIA**: PWA envía `urlFotoPos2`, Sheets almacena `URL_FOTO_REGISTRO_2`. |
| **Registro 3 (POS 3 / Adicional)** | `fotosReporteArray[2]` o `[3]` en UI. **NO se envía en propiedad de primer nivel** | **`Codigo.gs` v2.7 NO TIENE COLUMNA PARA POS 3**. Escribe `urlFotoBackup` en Col 15 | Col O (15): `URL_FOTO_REGISTRO_3` | `urlFotoRegistro3`, `urlFoto3` | 🔴 **DESFASE CRÍTICO**: En `Codigo.gs` v2.7, Col 15 está asignada a Backup. Pero en Sheets de 26 cols, Col 15 es `URL_FOTO_REGISTRO_3`. En tiendas con 3 o 4 cajas (ej. B11), la foto de Backup sobreescribe el Registro 3. |
| **Registro 4 (POS 4 / Adicional)** | `fotosReporteArray[3]` en UI. **NO se envía en propiedad de primer nivel** | **`Codigo.gs` v2.7 NO TIENE COLUMNA PARA POS 4**. Escribe `urlFotoPdu` en Col 16 | Col P (16): `URL_FOTO_REGISTRO_4` | `urlFotoRegistro4`, `urlFoto4` | 🔴 **DESFASE CRÍTICO**: En `Codigo.gs` v2.7, Col 16 es PDU. En Sheets 26 cols, Col 16 es `URL_FOTO_REGISTRO_4`. Causa directa del estado "Sin foto registrada" en Registro 4. |
| **Registro 5 (Backup Almacén)** | `fotosReporteArray[4]`. Payload: `urlFotoBackup` | Escribe en Col 15 en v2.7 | Col Q (17): `URL_FOTO_REGISTRO_5` | `urlFotoRegistro5`, `urlFotoBackup` | 🔴 **DESFASE DE COLUMNA**: Backup se escribe en Col 15 (O) en v2.7, pero su ubicación oficial en Sheets es Col 17 (Q). |
| **Registro 6 (PDU / Estabilizador)** | `fotosReporteArray[5]`. Payload: `urlFotoPdu` | Escribe en Col 16 en v2.7 | Col R (18): `URL_FOTO_REGISTRO_6` | `urlFotoRegistro6`, `urlFotoPdu` | 🔴 **DESFASE DE COLUMNA**: PDU se escribe en Col 16 (P) en v2.7, pero en Sheets oficial es Col 18 (R). |
| **Registro 7 (Panorámica Tienda)** | `fotosReporteArray[0]`. Payload: `urlFotoPanoramica` | Escribe en Col 17 en v2.7 | Col S (19): `URL_FOTO_REGISTRO_7` | `urlFotoRegistro7`, `urlFotoPanoramica` | 🔴 **DESFASE DE COLUMNA Y ARRAY**: En PWA, Panorámica es `fotosReporteArray[0]` (índice 0). En `Codigo.gs` v2.7 se escribe en Col 17 (Q). En Sheets de 26 cols es Col 19 (S). |
| **Registro 8 (Acta de Conformidad)** | `fotosReporteArray[7]`. Payload: `urlFotoActa` | Escribe en Col 18 en v2.7 | Col T (20): `URL_FOTO_REGISTRO_8` | `urlFotoRegistro8`, `urlFotoActa` | 🔴 **DESFASE DE COLUMNA**: Acta se escribe en Col 18 (R) en v2.7, pero en Sheets oficial es Col 20 (T). |
| **Colección de Fotos (`fotosReporte`)** | Array de 8 elementos `fotosReporteArray` | `extraerFotoSegura(fotosArray, idx)` con índices cruzados y dispersos | No existe columna JSON de fotos en Sheets | Procesa tanto array como propiedades individuales de 10 ranuras | 🔴 **ASIMETRÍA EN PWA**: La UI de `vistaFotos` rotula "Foto 1: Registro Fotográfico 1" al slot 1, pero internamente lo envía como `urlFotoPanoramica`. Causa de confusión en el técnico en campo. |
| **MÓDULO 5: ESTACIONES DE CÓMPUTO POS Y CONTINGENCIA** | | | | | |
| **Checklist Estaciones de Venta** | `obtenerDetalleEstacionesMantenimiento()`. Array con objetos por cada caja activa | Serializa con `JSON.stringify(payload.estacionesMantenimiento)` y escribe en Col 11 (K) | Col K (11): `COMPUTO_ESTADO` (almacena el string JSON del array completo) | Deserializa con `JSON.parse` desde `computoEstado` / `COMPUTO_ESTADO`. En edición genera tarjetas interactivas | 🟢 **HOMOLOGADO** (Arquitectura JSON embedida compartida y funcional). |
| **Campos de Checklist por Caja** | Booleans: `limpiezaAIO`, `cambioPastaTermica`, `limpiezaTicketera`, `limpiezaImpresora`, `limpiezaLector`, `limpiezaGaveta`, `ordenCables` | Preservados dentro del JSON serializado | Estructura interna dentro de Col K | Mapeados 1:1 en la interfaz de edición y en la Ficha Técnica | 🟢 **HOMOLOGADO**. |
| **Mantenimiento Backup Almacén** | Objeto `{ tipo: "BACKUP_ALMACEN", realizado, soplado, chasis, electrica, observaciones }` integrado en el array | Serializado dentro de Col 11 (K) | Estructura interna dentro de Col K | Extrae estación con `tipo === "BACKUP_ALMACEN"`. Mapea campos y checkboxes | 🟢 **HOMOLOGADO**. |
| **Observaciones de Cómputo** | Textarea `#compObs`. Payload: `observacionesComputo` (en mayúsculas) | Escribe en Col 12 (L): `payload.observacionesComputo \|\| ""` | Col L (12): `OBSERVACIONES_COMPUTO` | `atencion.observacionesComputo`. En edición: `#edit-input-obs-general` | 🟢 **HOMOLOGADO**. |
| **MÓDULO 6: CENSO DE ACTIVOS TECNOLÓGICOS (`INVENTARIO_EQUIPOS`)** | | | | | |
| **ID de Ítem Patrimonial** | No lo genera el frontend móvil | Genera: `"ITEM-" + codigoTienda + "-" + (idx + 1)` (Col A) | Col A (1): `ID_ITEM` (ej. `ITEM-B11-1`) | Fallback: `"ITEM-" + tienda.codigo + "-" + (idx + 1)` | 🟢 **HOMOLOGADO**. |
| **ID de Visita (Clave Foránea)** | No lo maneja el frontend móvil | Escribe `idVisita` (inicial) o `idVisitaOriginal` (edición) | Col B (2): `ID_VISITA` | Enlazado para trazabilidad | 🟢 **HOMOLOGADO**. |
| **Fecha de Registro Censo** | No lo genera el frontend móvil | Escribe `fechaHoraTexto` (`dd/MM/yyyy HH:mm:ss`) | Col C (3): `FECHA_REGISTRO` (ej. "13/09/2026", "16/09/2026 19:48:24") | `fechaRegistro` | 🟢 **HOMOLOGADO**. |
| **Código de Tienda (Inventario)** | `tienda` | `codigoTienda` | Col D (4): `CODIGO_TIENDA` | `tienda.codigo` | 🟢 **HOMOLOGADO**. |
| **Tipo de Dispositivo** | `tipo`, `tipoEquipo`. Generado desde `PERIFERICOS_CAJA_CANONICOS` y rack | `eq.tipo \|\| eq.tipoEquipo \|\| eq.dispositivo \|\| "EQUIPO"` | Col E (5): `TIPO_EQUIPO` (ej. "CPU POS / All in One", "CPU POS / ALL IN ONE") | `TIPOS_EQUIPO_OFICIALES` (11 tipos canónicos). Normaliza variantes | 🟡 **MODERADO**: La BD contiene tipos en Mayúsculas sostenidas ("CPU POS / ALL IN ONE") y tipos en Título ("CPU POS / All in One"). Admin normaliza en memoria. |
| **Marca de Hardware** | `eq.marca`, sanitizado con `.toUpperCase()` | `eq.marca \|\| "GENÉRICO"` | Col F (6): `MARCA` (ej. "HP", "EPSON", "HONEYWELL") | `eq.marca`, forzado a mayúsculas | 🟢 **HOMOLOGADO** (Estricto mayúsculas). |
| **Modelo de Hardware** | `eq.modelo`, sanitizado con `.toUpperCase()` | `eq.modelo \|\| "ESTÁNDAR"` | Col G (7): `MODELO` (ej. "ENGAGE ONE PRO AIO", "TM-T20III") | `eq.modelo`, forzado a mayúsculas | 🟢 **HOMOLOGADO** (Estricto mayúsculas). |
| **Número de Serie (S/N)** | `eq.serie` (forzado mayúsculas) | `eq.serie \|\| eq.numeroSerie \|\| "S/N"` | Col H (8): `NUMERO_SERIE` | `serie`, `numeroSerie`, `NUMERO_SERIE` | 🟡 **VARIACIÓN DE NOMBRE**: PWA envía `serie`, Backend lee `serie \|\| numeroSerie`, Sheets almacena `NUMERO_SERIE`. Funciona por cascada de fallbacks pero carece de nombre uniforme. |
| **Código Patrimonial / Inventario** | Input `#caja_X_patr`. Payload: `codInventario` (mayúsculas) | `eq.codInventario \|\| eq.cod_patrimonial \|\| ""` | Col I (9): `COD_INVENTARIO` | `codInventario`, `cod_patrimonial`, `COD_INVENTARIO` | 🟡 **VARIACIÓN DE NOMBRE**: Input se llama `patr`, propiedad se llama `codInventario`, columna en Sheets es `COD_INVENTARIO`. |
| **Ubicación Física del Equipo** | Genera "Caja 01", "Caja 02 (Adicional)", "Mesón de Ventas / Tienda", "Rack de Comunicaciones", "Backup / Almacén" | `eq.ubicacion \|\| eq.ubicacionCaja \|\| "TIENDA"` | Col J (10): `UBICACION_CAJA` (ej. "Caja 01", "Gabinete Rack", "Retirado / Baja") | `UBICACIONES_CENSO_ESTANDAR`: "Caja 01", "Caja 02", "Backup / Almacén", "Gabinete Rack", "Mesón de Ventas / Tienda" | 🔴 **DISCREPANCIA TERMINOLÓGICA**: PWA asigna "Rack de Comunicaciones", mientras que Sheets y Admin usan "Gabinete Rack". PWA agrega sufijo "(Adicional)" en cajas > nominales, ausente en el catálogo estándar de Admin. |
| **Condición Operativa del Activo** | Select: "OPERATIVO", "OBSERVADO", "DE BAJA / RETIRADO", "DE BAJA", "RETIRADO", "INOPERATIVO" | `eq.condicion \|\| eq.estado \|\| "OPERATIVO"` | Col K (11): `CONDICION` (ej. "OPERATIVO", "RENOVACION") | `CONDICIONES_CENSO_ESTANDAR`: "OPERATIVO", "INOPERATIVO", "POR RENOVAR", "RETIRADO" | 🔴 **DISCREPANCIA SEMÁNTICA**: La BD tiene "RENOVACION", Admin ofrece "POR RENOVAR", PWA ofrece "OBSERVADO" y "DE BAJA / RETIRADO". La falta de un enum universal causa dispersión en los filtros de condición. |
| **MÓDULO 7: CIERRE LEGAL, ACTAS Y FIRMAS DIGITALES** | | | | | |
| **Firma Digital del Técnico** | Canvas `#canvasFirmaTecnico`. Payload: `firmaTecnicoBase64` | Convierte a PNG en Drive (`Firma_Tecnico_[CODIGO].png`). Escribe Col 19 en v2.7 | Col U (21): `FIRMA_TECNICO_URL` | `firmaTecnicoUrl`, `firmaTecnico`, `FIRMA_TECNICO_URL`. Inmutable en edición | 🔴 **DESFASE CRÍTICO**: En `Codigo.gs` v2.7, se escribe en Col 19 (S), sobreescribiendo `URL_FOTO_REGISTRO_7` en la BD de 26 columnas. Su posición oficial es Col 21 (U). |
| **Firma Digital del Encargado** | Canvas `#canvasFirmaCliente`. Payload: `firmaClienteBase64` | Convierte a PNG en Drive (`Firma_Cliente_[CODIGO].png`). Escribe Col 20 en v2.7 | Col V (22): `FIRMA_CLIENTE_URL` | `firmaClienteUrl`, `firmaCliente`, `FIRMA_CLIENTE_URL`. Inmutable en edición | 🔴 **DESFASE CRÍTICO**: En `Codigo.gs` v2.7, se escribe en Col 20 (T), sobreescribiendo `URL_FOTO_REGISTRO_8`. Su posición oficial es Col 22 (V). |
| **Nombre del Encargado de Tienda** | Input `#nombreEncargado`. Payload: `nombreEncargado` | Escribe `payload.nombreEncargado \|\| "Encargado de Tienda"` en Col 21 en v2.7 | Col W (23): `NOMBRE_ENCARGADO` | `nombreEncargado`, `NOMBRE_ENCARGADO`. Inmutable en edición | 🔴 **DESFASE CRÍTICO Y CASING**: En v2.7 se escribe en Col 21 (U) en vez de Col 23 (W). En la BD conviven nombres en minúsculas ("jose quispe"), mayúsculas ("CARLOS QUISPE") y título ("Carlos Eduardo Mendoza"). |
| **DNI del Encargado de Tienda** | Input `#dniEncargado`. Payload: `dniEncargado` | Escribe `payload.dniEncargado \|\| ""` en Col 22 en v2.7 | Col X (24): `DNI_ENCARGADO` | `dniEncargado`, `DNI_ENCARGADO`. Inmutable en edición | 🔴 **DESFASE CRÍTICO**: En v2.7 se escribe en Col 22 (V) en vez de Col 24 (X). |

---

## 3. DIAGNÓSTICO PROFUNDO DE DISCREPANCIAS CRÍTICAS

### 🚨 Hallazgo Crítico 1: Desfase Estructural de 24 vs 26 Columnas en `REGISTRO_MANTENIMIENTO`

#### Causa Raíz
El archivo `Codigo.gs` desplegado en el proyecto corresponde a la **Versión 2.7** estructurada para **24 columnas**, mientras que la hoja física de cálculo de Google Sheets ya fue actualizada a **26 columnas (A–Z)** (evidenciado en `Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv` y formalizado en la especificación `Codigo.md` Versión 3.0).

#### Mecánica del Error
En `Codigo.gs` (líneas 333–359 en inserción inicial, y 489–518 en actualización in-situ):
```javascript
// Codigo.gs v2.7 (Fila de 24 elementos):
const filaRegistro = [
  idVisita,            // Col 01 (A)
  fechaHoraTexto,      // Col 02 (B)
  payload.tecnico,     // Col 03 (C)
  codigoTienda,        // Col 04 (D)
  gabineteLimpieza,    // Col 05 (E)
  gabineteVentiladores,// Col 06 (F)
  gabinetePDU,         // Col 07 (G)
  urlFotoAntes,        // Col 08 (H)
  urlFotoDespues,      // Col 09 (I)
  observacionesGab,    // Col 10 (J)
  computoEstado,       // Col 11 (K)
  observacionesComp,   // Col 12 (L)
  urlFotoPos1,         // Col 13 (M) -> Coincide con URL_FOTO_REGISTRO_1
  urlFotoPos2,         // Col 14 (N) -> Coincide con URL_FOTO_REGISTRO_2
  urlFotoBackup,       // Col 15 (O) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_3!
  urlFotoPdu,          // Col 16 (P) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_4!
  urlFotoPanoramica,   // Col 17 (Q) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_5!
  urlFotoActa,         // Col 18 (R) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_6!
  urlFirmaTecnico,     // Col 19 (S) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_7!
  urlFirmaCliente,     // Col 20 (T) -> ¡ESCRIBE EN URL_FOTO_REGISTRO_8!
  nombreEncargado,     // Col 21 (U) -> ¡ESCRIBE EN FIRMA_TECNICO_URL!
  dniEncargado,        // Col 22 (V) -> ¡ESCRIBE EN FIRMA_CLIENTE_URL!
  tecnicoApoyo1,       // Col 23 (W) -> ¡ESCRIBE EN NOMBRE_ENCARGADO!
  tecnicoApoyo2        // Col 24 (X) -> ¡ESCRIBE EN DNI_ENCARGADO!
  // Cols Y (25: TECNICO_APOYO_1) y Z (26: TECNICO_APOYO_2) QUEDAN VACÍAS
];
```

#### Impacto en Campo
1. **Corrupción de Datos en Cascada:** Al registrar o editar una atención, las firmas digitales de Drive se escriben en las columnas de Registro Fotográfico 7 y 8.
2. **Pérdida de Identidad de Firmantes:** El nombre del encargado y su DNI se inyectan en las columnas de URLs de firma, y los nombres de los técnicos de apoyo se inyectan en los campos de datos del encargado.
3. **Fotos Desaparecidas en Edición:** Al leer `doGet` desde la base de datos real, `Codigo.gs` v2.7 lee la columna 15 (`filaM[14]`) creyendo que es Backup cuando en realidad es el Registro Fotográfico 3 (POS 3). Por ende, los registros 3 y 4 de sedes como B11 o B25 siempre quedaban vacíos o "Sin foto registrada".

---

### 🚨 Hallazgo Crítico 2: Asimetría en la Captura y Despacho de Fotos en la PWA Móvil

#### Causa Raíz
En `index.html` (PWA móvil):
1. La sección `vistaFotos` despliega 8 tarjetas visuales numeradas del 1 al 8 (`Foto 1: Registro Fotográfico 1` a `Foto 8: Registro Fotográfico 8`).
2. Al despachar el formulario (`guardarAtencionLocalmente`, líneas 6872–6923), la PWA asigna de forma cableada (*hardcoded*):
   - `fotosReporteArray[0]` $\rightarrow$ `urlFotoPanoramica` (Slot 1 en UI es tratado como Panorámica).
   - `fotosReporteArray[1]` $\rightarrow$ `urlFotoPos1` (Slot 2 en UI es tratado como POS 1).
   - `fotosReporteArray[2]` $\rightarrow$ `urlFotoPos2` (Slot 3 en UI es tratado como POS 2).
   - `fotosReporteArray[3]` $\rightarrow$ **OMITIDO** (Slot 4 no se mapea a ninguna variable de primer nivel).
   - `fotosReporteArray[4]` $\rightarrow$ `urlFotoBackup` (Slot 5 en UI es tratado como Backup).
   - `fotosReporteArray[5]` $\rightarrow$ `urlFotoPdu` (Slot 6 en UI es tratado como PDU).
   - `fotosReporteArray[6]` $\rightarrow$ **OMITIDO** (Slot 7 no se mapea a ninguna variable de primer nivel).
   - `fotosReporteArray[7]` $\rightarrow$ `urlFotoActa` (Slot 8 en UI es tratado como Acta).
3. **Ninguna propiedad canónica `urlFotoRegistro1` a `urlFotoRegistro8` es generada en el payload de la PWA**.

#### Impacto en Campo
- Los técnicos capturan la foto del POS 3 en la ranura 3, pero la PWA la omite en las propiedades con nombre y solo viaja en el array crudo `fotosReporte`.
- Si el backend v2.7 procesa la solicitud, solo guarda en Drive 6 archivos nombrados (`Foto_POS1`, `Foto_POS2`, `Foto_Backup`, `Foto_PDU`, `Foto_Panoramica`, `Foto_Acta`), perdiendo irreversiblemente las evidencias 4 y 7 tomadas por el técnico.

---

### 🚨 Hallazgo Crítico 3: Nombres de Técnicos de Apoyo con Guión Bajo (`TECNICO_APOYO_1` vs `TECNICO_APOYO1`)

#### Causa Raíz
- En la base de datos Google Sheets (`REGISTRO_MANTENIMIENTO.csv`), las columnas 25 y 26 se llaman exactamente:
  - Col Y: `TECNICO_APOYO_1`
  - Col Z: `TECNICO_APOYO_2`
- En `Codigo.gs` v2.7 (líneas 144–145):
  ```javascript
  at.tecnicoApoyo1 = at.TECNICO_APOYO1 || filaM[22] || "";
  at.tecnicoApoyo2 = at.TECNICO_APOYO2 || filaM[23] || "";
  ```
  Busca la propiedad `TECNICO_APOYO1` (sin guión bajo). Como en la cabecera existe con guión bajo (`TECNICO_APOYO_1`), la evaluación booleana falla y toma el fallback por índice `filaM[22]` (que en la hoja de 26 columnas es `NOMBRE_ENCARGADO`).

#### Impacto en Campo
El técnico de apoyo aparece en el panel de supervisión con el nombre del cliente o encargado de tienda ("Carlos Eduardo Mendoza Paredes") en lugar del técnico real de JSERVICE ("Cesar Enrique García Mendoza").

---

### ⚠️ Hallazgo 4: Inconsistencias de MAYÚSCULAS / minúsculas y Sanitización

#### Análisis Comparativo
1. **Técnicos de Campo:**
   - En la base de datos real coexisten registros históricos:
     - Sede B11: `"Diego Alejandro Rodríguez Martínez"` (Formato Título con tilde).
     - Sede B25: `"DIEGO ALEJANDRO RODRÍGUEZ MARTÍNEZ"` (Mayúsculas sostenidas con tilde).
   - En la PWA (`index.html`), la función `inicializarMayusculasUniversales()` fuerza a mayúsculas cualquier entrada de texto.
   - En el Panel Admin, los filtros de búsqueda por técnico realizan comparación estricta de cadenas. Si un técnico busca "DIEGO", no coincidía con "Diego Alejandro" salvo que se normalice con `.toUpperCase().trim()`.
2. **Encargados de Tienda:**
   - En `REGISTRO_MANTENIMIENTO.csv`:
     - Fila 2: `"Carlos Eduardo Mendoza Paredes"` (Título).
     - Fila 3: `"jose quispe"` (Minúsculas completas sin tildes ni mayúsculas).
     - Fila 4: `"CARLOS QUISPE"` (Mayúsculas sostenidas).
   - El backend no aplica ninguna normalización al escribir `payload.nombreEncargado`.
3. **Números de Serie y Códigos Patrimoniales:**
   - PWA y Admin aplican `.toUpperCase()` de forma uniforme (`5CD14209LK`, `CBX-AIO-1011`).
   - Sin embargo, en la columna `TIPO_EQUIPO` del inventario existen mezclas: `"CPU POS / All in One"` junto con `"CPU POS / ALL IN ONE"` y `"LECTOR DE CÓDIGO DE BARRAS"`.

---

### ⚠️ Hallazgo 5: Discrepancias en Catálogos de Hardware, Ubicaciones y Condiciones

1. **Ubicaciones:**
   - PWA genera `"Rack de Comunicaciones"` para equipos de infraestructura.
   - Admin y Sheets usan `"Gabinete Rack"`.
   - PWA añade dinámicamente `" (Adicional)"` para cajas 2, 3 y 4 cuando superan la cuota nominal (`Caja 02 (Adicional)`). El selector estándar de Admin solo contiene `"Caja 01"` y `"Caja 02"`, obligando a inyectar opciones dinámicas en el `<select>`.
2. **Condición Operativa:**
   - En `INVENTARIO_EQUIPOS.csv`, se registran activos con condición `"RENOVACION"`.
   - En Admin, el `<select>` ofrece: `"OPERATIVO"`, `"INOPERATIVO"`, `"POR RENOVAR"`, `"RETIRADO"`.
   - En PWA, el `<select>` ofrece: `"OPERATIVO"`, `"OBSERVADO"`, `"DE BAJA / RETIRADO"`, `"INOPERATIVO"`.
   - No existe homologación unívoca: `"OBSERVADO"` (PWA) vs `"POR RENOVAR"` (Admin) vs `"RENOVACION"` (Sheets).

---

### ⚠️ Hallazgo 6: Categoría "Diamante" y Estados Corruptos en `DB_TIENDAS`

1. **Categoría Diamante:**
   - En `Control_Coolbox_Dev_2026 - DB_TIENDAS.csv`, sedes estratégicas de alto volumen (como K71 Plaza Lima Norte) poseen clasificación `"Diamante"`.
   - En `Control Coolbox Admin/index.html` (línea 13287):
     ```javascript
     const clasifNormal = clasifRaw.includes("ORO") ? "ORO" : (clasifRaw.includes("PLATINO") ? "PLATINO" : "BRONCE");
     ```
     Degrada automáticamente "Diamante" a `"BRONCE"`, distorsionando los reportes gerenciales de supervisión.
2. **Estados Corruptos en Columna G (`ESTADO_ATENCION`):**
   - Tiendas como B35 (Tarapoto), B42 (Ventanilla) y B50 (Chimbote) tienen valores enteros (`"2"`, `"1"`, `"1"`) en la columna `ESTADO_ATENCION` en lugar de `"PENDIENTE"` o `"REALIZADO"`, originados por importaciones antiguas desfasadas en una columna.

---

## 4. ANÁLISIS DE IMPACTO OPERATIVO EN CAMPO (140 TIENDAS)

| Escenario Operativo | Componente Afectado | Fallo Potencial en Campo | Severidad |
| :--- | :--- | :--- | :--- |
| **Envío de reporte desde sótano o tienda con baja señal** | PWA $\rightarrow$ `Codigo.gs` | Si `Codigo.gs` v2.7 recibe el payload de una tienda con 3 o 4 cajas, corrompe las columnas de firmas y cuadrilla en Google Sheets por desfase de 24 vs 26 cols. | 🔴 **CRÍTICA** (Pérdida de validez legal del acta). |
| **Edición de reporte desde el Dashboard Admin** | Admin $\rightarrow$ `Codigo.gs` | Al guardar correcciones (`actualizarReporteAdmin`), `Codigo.gs` v2.7 sobreescribe 24 columnas con setValues, destruyendo las columnas Y y Z (`TECNICO_APOYO_1` y `TECNICO_APOYO_2`). | 🔴 **CRÍTICA** (Destrucción de datos de cuadrilla). |
| **Auditoría visual de fotos en modal del Dashboard** | Admin $\leftarrow$ `doGet` | El supervisor no puede verificar los registros fotográficos 3 y 4 de las tiendas atendidas porque el script lee posiciones desfasadas. | 🔴 **CRÍTICA** (Rechazo indebido de informes por supervisión remota). |
| **Búsqueda y filtrado por técnico en Panel Admin** | Admin | Un reporte generado por "DIEGO RODRÍGUEZ" no aparece al filtrar por "Diego Rodríguez" debido a disparidad de casing sin normalización universal. | 🟡 **MODERADA** (Retraso en control de cuadrillas). |
| **Generación de Ficha Técnica Impresa A4** | Admin (Ficha A4) | Si la condición del activo es `"RENOVACION"`, no coincide con las clases de badge y se muestra con estilo neutro en vez de advertencia preventiva. | 🟡 **MODERADA** (Inconsistencia visual en entregable al cliente). |

---

## 5. RUTA RECOMENDADA DE NORMALIZACIÓN (PARA FASE SIGUIENTE)

Una vez aprobada esta auditoría, la solución definitiva debe ejecutarse respetando la siguiente secuencia técnica:

1. **Promoción de Backend a Versión 3.0 (`Codigo.gs`):**
   - Migrar el código de `Codigo.gs` al estándar oficial de 26 columnas (A–Z) ya redactado en `Codigo.md` v3.0.
   - Corregir los nombres de columnas a `URL_FOTO_GABINETE_ANTES`, `URL_FOTO_GABINETE_DESPUES`, `URL_FOTO_REGISTRO_1`..`URL_FOTO_REGISTRO_8`, `TECNICO_APOYO_1`, `TECNICO_APOYO_2`.
   - Mantener tolerancia universal recibiendo tanto claves canónicas (`urlFotoRegistroX`) como nombres legacy (`pos1`, `backup`, `pdu`, `acta`).
2. **Alineación del Payload de la PWA Móvil (`./index.html`):**
   - Enviar en el objeto `payload` de `guardarAtencionLocalmente` las claves canónicas explícitas:
     `urlFotoGabineteAntes`, `urlFotoGabineteDespues`, `urlFotoRegistro1` a `urlFotoRegistro8`.
   - Garantizar que los slots 4 y 7 de la UI de fotos se transmitan con su clave canónica correspondiente (`urlFotoRegistro4` y `urlFotoRegistro7`).
3. **Normalización del Catálogo en Admin (`Control Coolbox Admin/index.html`):**
   - Incorporar la categoría `"DIAMANTE"` en el parser de clasificación de sedes.
   - Saneamiento de las condiciones de inventario aceptando `"RENOVACION"` como sinónimo oficial de `"POR RENOVAR"` / `"OBSERVADO"`.
   - Homologar `"Gabinete Rack"` y `"Rack de Comunicaciones"`.
4. **Sanitización de Datos Históricos en Google Sheets:**
   - Limpiar los enteros espurios (`"2"`, `"1"`) en la columna `ESTADO_ATENCION` de `DB_TIENDAS`.
   - Corregir los nombres en minúsculas en `NOMBRE_ENCARGADO` a Formato Nombre Propio / Mayúsculas.

---

**Certificación de Auditoría:**  
*Informe técnico elaborado en estricto modo de solo lectura. Ningún archivo de producción ha sido alterado durante este proceso. Hashes criptográficos MD5 de `./index.html` y `Codigo.gs` 100% verificados e intactos.*
