# 🎯 INFORME PERICIAL DE AUDITORÍA INTEGRAL DE CALIDAD Y HOMOLOGACIÓN COMERCIAL
## SISTEMA DE CONTROL DE MANTENIMIENTO PREVENTIVO E INVENTARIO ANUAL COOLBOX 2026
**Estándar de Evaluación:** Corporativo de Campo (Kizeo Forms / ProntoForms / Fulcrum)  
**Empresa Contratista:** JSERVICE RV E.I.R.L.  
**Supervisión Operativa:** Andrews Berbesia (Jefatura de Operaciones - Venezuela) & Jesús Silva (Supervisión de Campo - Perú)  
**Universo Operativo:** 140 tiendas de Coolbox Perú (86 Lima/Callao, 54 Provincias)  
**Fecha de Auditoría:** 18 de Septiembre de 2026  
**Modo Operativo:** Solo Lectura y Diagnóstico Pericial (Código en producción intacto)

---

## 1. RESUMEN EJECUTIVO DE MADUREZ DEL SISTEMA

### Calificación Global de Madurez Comercial: **4.5 / 10**
*(Clasificación: Nivel Prototipo Avanzado / Transición Crítica con Riesgo Transaccional en Calle)*

```
[====================--------------------] 4.5 / 10
Calidad Visual / UX:       8.5 / 10 (Diseño mobile-first, dashboards y fichas A4 de alto impacto visual)
Validación y Reglas:       4.0 / 10 (Uso de 'confirm' permisivo en vez de bloqueos duros empresariales)
Persistencia y Offline:    3.5 / 10 (Almacenamiento Base64 triplicado en localStorage, sin cola FIFO real)
Integridad de Contratos:   2.5 / 10 (Desfase físico de 24 vs 26 cols, descarte de fotos 4 y 7 en PWA)
Concurrencia Backend:      3.5 / 10 (Monopolio de LockService durante subidas a Drive de 25 segundos)
```

### Diagnóstico Gerencial y de Riesgo Operativo
El Sistema Coolbox 2026 exhibe una **excelente madurez visual y conceptual en su capa de presentación**, ofreciendo una interfaz móvil ágil y un panel de administración con emisión de fichas A4 muy completo. Sin embargo, al ser auditado bajo los estándares de ingeniería de software para operaciones críticas de campo (homologación **Kizeo Forms**), presenta **vulnerabilidades estructurales severas** que comprometen la fidelidad de los datos y amenazan con generar pérdidas irreversibles de información en tienda:

1. **Desfase Estructural de Esquemas (24 vs 26 Columnas):** Mientras que la base de datos física (`Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv`) y la especificación técnica canónica (`Codigo.md` v3.0) operan sobre **26 columnas (A–Z)**, el backend físico que reside en el workspace (`Codigo.gs`) continúa en su **Versión 2.7 configurada para 24 columnas**. Esto produce un desplazamiento destructivo de columnas a partir de la columna M (13): las firmas digitales de técnico y cliente se escriben en las columnas de las fotos de registro 7 y 8, el nombre del encargado sobreescribe la firma del técnico, el DNI sobreescribe la firma del cliente, y los técnicos de apoyo 1 y 2 sobreescriben al encargado y su DNI, dejando las columnas Y y Z truncadas o nulas.
2. **Pérdida Silenciosa de Evidencias en PWA Móvil (`./index.html`):** La PWA de campo no implementa el contrato de 10 fotos oficial. Sigue enviando variables legacy (`urlFotoPos1`, `urlFotoBackup`, `urlFotoPanoramica`, `urlFotoActa`) y, de manera crítica, **descarta por completo los slots 4 y 7** (`fotosReporteArray[3]` y `[6]`) en la compilación del payload, por lo que las fotos capturadas en esos casilleros jamás son enviadas al backend ni registradas en Sheets.
3. **Falsa Sensación de Éxito y Destrucción Ciega de Borradores:** Al despachar el formulario con `fetch(API_BACKEND_URL, { mode: "no-cors" })`, la promesa de JavaScript se resuelve con una respuesta opaca (status 0) tanto si el script tuvo éxito como si arrojó un error fatal de cuota o tiempo de ejecución en Apps Script. Acto seguido, el código ejecuta `localStorage.removeItem(...)` y borra el borrador local. Si la red falló a mitad de camino o Apps Script abortó, **el técnico cree que envió el reporte, el borrador del móvil es destruido y la atención se pierde irremediablemente**.
4. **Riesgo Inminente de `QuotaExceededError` en `localStorage`:** La función `guardarBorrador()` almacena el objeto completo de la atención (con hasta 10 imágenes codificadas en Base64) simultáneamente en **tres claves distintas** (`COOLBOX_BORRADOR_SERVICIO`, `borrador_coolbox` y `coolbox_mantenimiento_draft`). Esto triplica el uso de memoria, superando con facilidad el límite rígido de 5 MB de `localStorage` en navegadores móviles (Safari iOS y Chrome Android) y provocando que el autoguardado falle en silencio sin alertar al técnico.
5. **Embotellamiento Masivo de Cuadrillas con `LockService`:** Tanto en `Codigo.gs` como en `Codigo.md`, la adquisición del script lock (`lock.waitLock(30000)`) se realiza **antes** de procesar y subir las 10 imágenes a Google Drive. Dado que guardar 10 fotos Base64 en Drive toma entre 20 y 25 segundos, una sola cuadrilla monopoliza el candado global de la aplicación. En horas pico de cierre de tiendas (17:00 a 19:00 hrs), las demás cuadrillas sufren bloqueos inmediatos por timeout (`"Servidor ocupado..."`).

---

## 2. MATRIZ CRUZADA DE CONTRATOS DE DATOS (SCHEMAS 1:1)

A continuación se audita el flujo de datos completo a través de los cuatro componentes del ecosistema: la PWA de campo (`./index.html`), el backend canónico proyectado (`Codigo.md` v3.0 / `Codigo.gs` físico), la base de datos Google Sheets física (representada en los CSVs oficiales) y el Panel Administrativo (`./Control Coolbox Admin/index.html`).

### 2.1 Pestaña `REGISTRO_MANTENIMIENTO` (26 Columnas A–Z)

| Col | Encabezado Oficial Sheets | PWA Móvil (`./index.html`) | Codigo.gs (Físico v2.7) | Codigo.md (Canónico v3.0) | Panel Admin (`Control Coolbox Admin`) | Diagnóstico Pericial de Integridad |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **A (01)** | `ID_VISITA` | No generado (delegado) | `idVisita` (Fila 1) | `idVisita` (Fila 1) | `at.idVisita` / Inmutable | 🟢 **HOMOLOGADO**. Formato canónico `VIS-[TIENDA]-[TIMESTAMP]`. |
| **B (02)** | `FECHA_HORA` | `actualizadoEn` (ISO) | `fechaHoraTexto` (Col 2) | `fechaHoraTexto` (Col 2) | `at.fechaHora` / Inmutable | 🟢 **HOMOLOGADO**. Formato `dd/MM/yyyy HH:mm:ss`. |
| **C (03)** | `TECNICO` | Payload: `tecnico`, `tecnicoTitular`, `tecnicoLider` | Escribe en Col 3 | Escribe en Col 3 | `atencion.tecnico` (Bloqueado) | 🟡 **LEVE**: En Sheets conviven nombres en Mayúsculas sostenidas y en Formato Título con tildes. |
| **D (04)** | `CODIGO_TIENDA` | Payload: `codigoTienda` | Escribe en Col 4 (`.toUpperCase()`) | Escribe en Col 4 (`.toUpperCase()`) | `tienda.codigo` | 🟢 **HOMOLOGADO**. Mayúsculas estrictas. |
| **E (05)** | `GABINETE_LIMPIEZA` | Select `#gabLimpieza` ("Conforme", "Observado") | Escribe en Col 5 | Escribe en Col 5 | Select `#edit-select-gabinete-limpieza` | 🟡 **MODERADO**: En Sheets existen valores descriptivos ("Conforme (Limpio y aspirado)") que no coinciden con los valores puros del select. |
| **F (06)** | `GABINETE_VENTILADORES` | Select `#gabVentiladores` ("Operativo", "Inoperativo", "No Tiene") | Escribe en Col 6 | Escribe en Col 6 | Select `#edit-select-gabinete-ventiladores` | 🟡 **MODERADO**: En Sheets conviven cadenas largas ("Operativo (Flujo de aire óptimo)"). |
| **G (07)** | `GABINETE_PDU` | Select `#gabPDU` | Escribe en Col 7 | Escribe en Col 7 | Select `#edit-select-gabinete-pdu` | 🟢 **HOMOLOGADO**. |
| **H (08)** | `URL_FOTO_GABINETE_ANTES` | Payload: `urlFotoAntes`, `fotoAntesBase64`. ❌ No envía `urlFotoGabineteAntes` | Escribe en Col 8 pero en `doGet` busca `URL_FOTO_ANTES` (falla header, rescata por `filaM[7]`) | Escribe en Col 8 y en `doGet` lee `URL_FOTO_GABINETE_ANTES` | Mapeo defensivo con 8 alias (`urlFotoGabineteAntes`, `urlFotoAntes`, `fotoAntes`, etc.) | 🔴 **DESFASE SEMÁNTICO**: PWA no usa el nombre canónico `urlFotoGabineteAntes`. El backend v2.7 busca un header inexistente en Sheets. |
| **I (09)** | `URL_FOTO_GABINETE_DESPUES` | Payload: `urlFotoDespues`, `fotoDespuesBase64`. ❌ No envía `urlFotoGabineteDespues` | Escribe en Col 9 pero en `doGet` busca `URL_FOTO_DESPUES` (falla header) | Escribe en Col 9 y en `doGet` lee `URL_FOTO_GABINETE_DESPUES` | Mapeo defensivo múltiple | 🔴 **DESFASE SEMÁNTICO**: Misma discrepancia de nomenclatura que en Foto Antes. |
| **J (10)** | `OBSERVACIONES_GABINETE` | Textarea `#gabObs` (en mayúsculas) | Escribe en Col 10 | Escribe en Col 10 | `atencion.observacionesGabinete` | 🟢 **HOMOLOGADO**. |
| **K (11)** | `COMPUTO_ESTADO` | Payload: `estacionesMantenimiento` (Array JSON) | Escribe en Col 11 (`JSON.stringify`) | Escribe en Col 11 (`JSON.stringify`) | `JSON.parse(at.computoEstado)` | 🟢 **HOMOLOGADO**. Estructura JSON de estaciones de venta. |
| **L (12)** | `OBSERVACIONES_COMPUTO` | Textarea `#compObs` (en mayúsculas) | Escribe en Col 12 | Escribe en Col 12 | `atencion.observacionesComputo` | 🟢 **HOMOLOGADO**. |
| **M (13)** | `URL_FOTO_REGISTRO_1` | Slot 2 (`fotosReporteArray[1]`) enviado como `urlFotoPos1` | Escribe en Col 13 (`urlFotoPos1`) | Escribe en Col 13 (`urlFotoReg1`) | `urlFotoRegistro1`, fallback `urlFotoPos1` | 🔴 **DESFASE CRÍTICO**: PWA envía `urlFotoPos1` con desfase de índice (asigna slot 2 a POS1 mientras slot 1 lo manda a panorámica). |
| **N (14)** | `URL_FOTO_REGISTRO_2` | Slot 3 (`fotosReporteArray[2]`) enviado como `urlFotoPos2` | Escribe en Col 14 (`urlFotoPos2`) | Escribe en Col 14 (`urlFotoReg2`) | `urlFotoRegistro2`, fallback `urlFotoPos2` | 🔴 **DESFASE SEMÁNTICO**: PWA envía `urlFotoPos2` en vez de `urlFotoRegistro2`. |
| **O (15)** | `URL_FOTO_REGISTRO_3` | ❌ **OMITIDO**: Slot 4 no tiene variable. Se envía `urlFotoBackup` (Slot 5) | 🔴 Escribe `urlFotoBackup` en Col 15 | Escribe en Col 15 (`urlFotoReg3`) | Mapea `urlFotoRegistro3`, con fallback forzado a `backup` por error de v2.7 | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, Col 15 guarda Backup. En Sheets 26 cols, Col 15 es Registro 3. En tiendas con >2 cajas, Backup destruye la foto de Caja 3. |
| **P (16)** | `URL_FOTO_REGISTRO_4` | ❌ **OMITIDO**: Slot 4 no tiene variable. Se envía `urlFotoPdu` (Slot 6) | 🔴 Escribe `urlFotoPdu` en Col 16 | Escribe en Col 16 (`urlFotoReg4`) | Mapea `urlFotoRegistro4`, con fallback a `pdu` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, Col 16 guarda PDU. En Sheets es Registro 4. La foto de Registro 4 se pierde siempre. |
| **Q (17)** | `URL_FOTO_REGISTRO_5` | Slot 5 (`fotosReporteArray[4]`) enviado como `urlFotoBackup` | 🔴 Escribe `urlFotoPanoramica` en Col 17 | Escribe en Col 17 (`urlFotoReg5`) | Mapea `urlFotoRegistro5` | 🔴 **DESFASE DE COLUMNA**: Backup se escribe en Col 15 en v2.7, mientras que Col 17 recibe Panorámica. En Sheets oficial es Col 17. |
| **R (18)** | `URL_FOTO_REGISTRO_6` | Slot 6 (`fotosReporteArray[5]`) enviado como `urlFotoPdu` | 🔴 Escribe `urlFotoActa` en Col 18 | Escribe en Col 18 (`urlFotoReg6`) | Mapea `urlFotoRegistro6` | 🔴 **DESFASE DE COLUMNA**: PDU se escribe en Col 16 en v2.7, mientras que Col 18 recibe Acta. En Sheets oficial es Col 18. |
| **S (19)** | `URL_FOTO_REGISTRO_7` | Slot 1 (`fotosReporteArray[0]`) enviado como `urlFotoPanoramica`. Slot 7 omitido | 🔴 Escribe `urlFirmaTecnico` en Col 19 | Escribe en Col 19 (`urlFotoReg7`) | Mapea `urlFotoRegistro7` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, la firma del técnico sobreescribe la foto de Registro 7. |
| **T (20)** | `URL_FOTO_REGISTRO_8` | Slot 8 (`fotosReporteArray[7]`) enviado como `urlFotoActa` | 🔴 Escribe `urlFirmaCliente` en Col 20 | Escribe en Col 20 (`urlFotoReg8`) | Mapea `urlFotoRegistro8` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, la firma del cliente sobreescribe la foto de Registro 8. |
| **U (21)** | `FIRMA_TECNICO_URL` | Canvas `#canvasFirmaTecnico` -> `firmaTecnicoBase64` | 🔴 Escribe `payload.nombreEncargado` en Col 21 | Escribe en Col 21 (`urlFirmaTecnico`) | Muestra `atencion.firmaTecnicoUrl` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, el nombre del encargado sobreescribe la URL de la firma del técnico. |
| **V (22)** | `FIRMA_CLIENTE_URL` | Canvas `#canvasFirmaCliente` -> `firmaClienteBase64` | 🔴 Escribe `payload.dniEncargado` en Col 22 | Escribe en Col 22 (`urlFirmaCliente`) | Muestra `atencion.firmaClienteUrl` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, el DNI del encargado sobreescribe la URL de la firma del cliente. |
| **W (23)** | `NOMBRE_ENCARGADO` | Input `#nombreEncargado` -> `nombreEncargado` | 🔴 Escribe `payload.tecnicoApoyo1` en Col 23 | Escribe en Col 23 (`payload.nombreEncargado`) | Muestra `atencion.nombreEncargado` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, el Técnico de Apoyo 1 sobreescribe el Nombre del Encargado. |
| **X (24)** | `DNI_ENCARGADO` | Input `#dniEncargado` -> `dniEncargado` | 🔴 Escribe `payload.tecnicoApoyo2` en Col 24 | Escribe en Col 24 (`payload.dniEncargado`) | Muestra `atencion.dniEncargado` | 🔴 **DESFASE CATASTRÓFICO**: En `Codigo.gs` v2.7, el Técnico de Apoyo 2 sobreescribe el DNI del Encargado. |
| **Y (25)** | `TECNICO_APOYO_1` | Select `#tecnico2` -> `tecnicoApoyo1` | ❌ **TRUNCADO**: v2.7 solo escribe hasta Col 24 | Escribe en Col 25 (`TECNICO_APOYO_1`) | `atencion.tecnicoApoyo1` | 🔴 **COLUMNA INEXISTENTE EN V2.7**: `Codigo.gs` físico omite Col 25. En Sheets queda en blanco o no se registra. |
| **Z (26)** | `TECNICO_APOYO_2` | Select `#tecnico3` -> `tecnicoApoyo2` | ❌ **TRUNCADO**: v2.7 solo escribe hasta Col 24 | Escribe en Col 26 (`TECNICO_APOYO_2`) | `atencion.tecnicoApoyo2` | 🔴 **COLUMNA INEXISTENTE EN V2.7**: `Codigo.gs` físico omite Col 26. |

---

### 2.2 Pestaña `INVENTARIO_EQUIPOS` (11 Columnas)

| Col | Encabezado Oficial Sheets | PWA Móvil (`./index.html`) | Codigo.gs (Físico v2.7) | Codigo.md (Canónico v3.0) | Panel Admin (`Control Coolbox Admin`) | Diagnóstico Pericial |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **A (01)** | `ID_ITEM` | No generado (delegado) | `"ITEM-" + cod + "-" + idx` | `"ITEM-" + cod + "-" + idx` | `item.idItem` | 🟢 **HOMOLOGADO**. Correlativo por tienda. |
| **B (02)** | `ID_VISITA` | No generado (delegado) | Asigna `idVisita` | Asigna `idVisita` | `item.idVisita` | 🟢 **HOMOLOGADO**. |
| **C (03)** | `FECHA_REGISTRO` | No generado (delegado) | Asigna `fechaHoraTexto` | Asigna `fechaHoraTexto` | `item.fechaRegistro` | 🟢 **HOMOLOGADO**. |
| **D (04)** | `CODIGO_TIENDA` | Asignado desde tienda activa | Asigna `codigoTienda` | Asigna `codigoTienda` | `item.codigoTienda` | 🟢 **HOMOLOGADO**. |
| **E (05)** | `TIPO_EQUIPO` | Propiedad `tipo` / `tipoEquipo` | `eq.tipo \|\| eq.tipoEquipo \|\| ...` | `eq.tipo \|\| eq.tipoEquipo \|\| ...` | `eq.tipo \|\| eq.tipoEquipo` | 🟢 **HOMOLOGADO**. |
| **F (06)** | `MARCA` | Input con clase `input-uppercase` | `eq.marca \|\| "GENÉRICO"` | `eq.marca \|\| "GENÉRICO"` | `eq.marca` (`.toUpperCase()`) | 🟢 **HOMOLOGADO**. En PWA y Admin se fuerza mayúsculas. |
| **G (07)** | `MODELO` | Input con clase `input-uppercase` | `eq.modelo \|\| "ESTÁNDAR"` | `eq.modelo \|\| "ESTÁNDAR"` | `eq.modelo` (`.toUpperCase()`) | 🟢 **HOMOLOGADO**. |
| **H (08)** | `NUMERO_SERIE` | Input con scanner de cámara | `eq.serie \|\| "S/N"` | `eq.serie \|\| eq.numeroSerie` | `eq.serie \|\| eq.numeroSerie` | 🟢 **HOMOLOGADO**. Sanitizado a mayúsculas. |
| **I (09)** | `COD_INVENTARIO` | Input patrimonial con scanner | `eq.codInventario \|\| ""` | `eq.codInventario \|\| eq.cod_patrimonial` | `eq.codInventario` | 🟢 **HOMOLOGADO**. |
| **J (10)** | `UBICACION_CAJA` | Asignado por contexto (Caja 01, Rack, etc.) | `eq.ubicacion \|\| eq.ubicacionCaja` | `eq.ubicacion \|\| eq.ubicacionCaja` | `eq.ubicacion \|\| eq.ubicacionCaja` | 🟢 **HOMOLOGADO**. |
| **K (11)** | `CONDICION` | Select cond: "OPERATIVO", "INOPERATIVO", "RENOVACION" | `eq.condicion \|\| "OPERATIVO"` | `eq.condicion \|\| "OPERATIVO"` | `eq.condicion` | 🟡 **MODERADO**: No incluye la opción "DE BAJA / RETIRADO" exigida por el catálogo corporativo. |

---

### 2.3 Pestaña `DB_TIENDAS` (13 Columnas)

| Col | Encabezado Oficial Sheets | PWA Móvil (`./index.html`) | Codigo.gs (Físico v2.7) | Codigo.md (Canónico v3.0) | Panel Admin (`Control Coolbox Admin`) | Diagnóstico Pericial |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **A (01)** | `CODIGO_TIENDA` | `t.codigo` | `tienda.codigo = fila[0]` | `tienda.codigo = fila[0]` | `t.codigo` | 🟢 **HOMOLOGADO**. |
| **B (02)** | `NOMBRE_TIENDA` | `t.nombre` | `tienda.nombre = fila[1]` | `tienda.nombre = fila[1]` | `t.nombre` | 🟢 **HOMOLOGADO**. |
| **C (03)** | `CIUDAD` | `t.ciudad` | `tienda.ciudad = fila[2]` | `tienda.ciudad = fila[2]` | `t.ciudad` | 🟢 **HOMOLOGADO**. |
| **D (04)** | `DIRECCION` | `t.direccion` | `tienda.direccion = fila[3]` | `tienda.direccion = fila[3]` | `t.direccion` | 🟢 **HOMOLOGADO**. |
| **E (05)** | `CLASIFICACION` | Soporta Diamante, Oro, Platino, Bronce | `tienda.clasificacion = fila[4]` | `tienda.clasificacion = fila[4]` | 🔴 **Degrada Diamante a Bronce**. Select no tiene opción Diamante | 🔴 **DESFASE EN ADMIN**: Las tiendas "Diamante" (ej. K71 Plaza Lima Norte) son tratadas como "BRONCE" en filtros y badges del Admin. |
| **F (06)** | `SERVIDOR_IGC` | Badge indicador | `tienda.servidor = fila[5]` | `tienda.servidor = fila[5]` | Icono servidor en tabla | 🟡 **LEVE**: Valores heterogéneos en base de datos ("SÍ", "NO", "Servidor IGC", vacíos). |
| **G (07)** | `ESTADO_ATENCION` | Muestra estado | Escribe "REALIZADO" forzado en Col G | Escribe "REALIZADO" o "OBSERVADO" según criticidad | Muestra "REALIZADO", "OBSERVADO", "PENDIENTE" | 🔴 **DESFASE**: `Codigo.gs` v2.7 marca siempre "REALIZADO" incluso ante inoperatividades críticas. En `DB_TIENDAS.csv` existen enteros corruptos ("2", "1"). |
| **H (08)** | `EQUIPOS ASIGNADOS` | `t.equiposAsignados` | `parseInt(fila[7] \|\| 2)` | `parseInt(fila[7] \|\| 2)` | `t.equiposAsignados` | 🟢 **HOMOLOGADO**. |
| **I (09)** | `VTAMOVIL` | No utilizado | No mapeado explícito | No mapeado explícito | No visualizado | ⚪ Campo informativo interno de Coolbox. |
| **J (10)** | `CAJAS FIJAS` | `cajasNominalesTienda` | `parseInt(fila[9] \|\| 2)` | `parseInt(fila[9] \|\| 2)` | `t.cajasNominales` | 🟢 **HOMOLOGADO**. Fallback defensivo a 2 cajas. |
| **K–M** | `TICKETERA`, `LECTOR`, `GAVETA` | Checklists dinámicos | No mapeados a columnas propias | No mapeados a columnas propias | Resueltos en JSON de cómputo | ⚪ Columnas estáticas de dotación teórica de Coolbox. |

---

## 3. MATRIZ DE BRECHAS COMERCIALES FRENTE A KIZEO FORMS

Esta comparativa evalúa la plataforma frente a los requisitos de grado corporativo exigidos en operaciones de campo en retail:

| Dimensión Técnica / Operativa | Estándar de la Industria (Kizeo Forms) | Estado Actual del Sistema Coolbox 2026 | Nivel de Riesgo Operativo |
| :--- | :--- | :--- | :--- |
| **1. Motor de Persistencia Local (Offline Storage)** | **Base de Datos IndexedDB / SQLite** con cuota virtualmente ilimitada ($\ge 500\text{ MB}$) y soporte nativo para Blobs binarios de imágenes. | **`localStorage` síncrono (Límite estricto de 5 MB)**. El borrador guarda hasta 10 fotos Base64 **duplicado en 3 claves distintas** a la vez (`COOLBOX_BORRADOR_SERVICIO`, `borrador_coolbox`, `coolbox_mantenimiento_draft`), triplicando el consumo a $>12\text{ MB}$. | 🔴 **CRÍTICO:** `DOMException: QuotaExceededError` garantizado en dispositivos con múltiples fotos o fotos de alta resolución en sótanos sin señal. El fallo es silencioso. |
| **2. Protocolo de Transmisión y Cola de Despacho** | **Cola Transaccional FIFO Persistente**. El borrador local **JAMÁS** se elimina hasta recibir un código de estado HTTP `200/201 OK` verificado con hash de confirmación del servidor. | **Envío ciego mediante `fetch` con `mode: "no-cors"`**. La respuesta es opaca (status 0). El código ejecuta inmediatamente `localStorage.removeItem(...)` en `.then()`, asumiendo éxito. | 🔴 **CATASTRÓFICO:** Si el servidor Apps Script falla por timeout de candado (30s) o error de cuota, el navegador marca "éxito" falso, borra el borrador del técnico y la información se destruye sin posibilidad de recuperación. |
| **3. Reintentos Automáticos de Sincronización** | **Service Worker con Background Sync API** y listener `window.addEventListener('online')` con backoff exponencial que reintenta en segundo plano al salir del sótano. | **Inexistente**. La cola `coolbox_offline_queue` definida en la especificación técnica jamás fue implementada en el código de `./index.html`. El técnico debe volver a presionar manualmente el botón si hubo error visible. | 🔴 **ALTO:** Dependencia 100% manual del técnico para reintentar transmisiones. En caso de recargar la página, se pierde el contexto si el borrador falló en guardarse. |
| **4. Concurrencia y Cuotas de Servidor (LockService)** | **Arquitectura Serverless Desacoplada**. Las imágenes van directo a bucket S3/Cloud Storage con URLs prefirmadas. El bloqueo de base de datos dura $<50\text{ ms}$ (escritura relacional pura). | **Bloqueo Monolítico con `LockService` (30s)**. La función adquiere el candado y dentro de él ejecuta 10 llamadas secuenciales a la API de Drive para convertir Base64 a archivo. Cada subida tarda 2s (Total: 20–25s reteniendo el lock). | 🔴 **CRÍTICO:** Con 4 cuadrillas terminando a las 18:00 hrs, la segunda en cola espera 25s, y la tercera o cuarta botan inevitablemente `"Servidor ocupado. Intente nuevamente"`, abortando la sincronización de campo. |
| **5. Reglas de Validación y Gating de Negocio** | **Hard Validation Blocks**. Si un campo, foto obligatoria o firma está vacío, el botón de envío se desactiva físicamente con mensajes visuales de bloqueo. | **`confirm()` permisivo**. Si faltan las fotos de gabinete, faltan las firmas o falta el DNI/Nombre del encargado, el sistema muestra un cuadro de diálogo: *"¿Deseas enviar el reporte de todas formas?"*. Si el usuario da "Aceptar", envía campos vacíos. | 🔴 **ALTO:** Incumplimiento directo de la Regla de Oro contractual de Coolbox (las fotos de gabinete y firmas deben ser obligatorias e infranqueables). |
| **6. Sanitización y Validación de Formatos** | **Máscaras de Entrada y Validación Regex Estricta** a nivel de UI y a nivel de Endpoint (DNI de 8 dígitos numéricos exactos, mayúsculas automáticas en el modelo de datos). | PWA tiene un listener global a mayúsculas, pero el input de DNI tiene `maxlength="12"` sin validación regex (`^\d{8}$`). **El backend no sanitiza nada**: acepta lo que venga en el JSON. | 🟡 **MODERADO:** Evidenciado en datos reales de Sheets con DNI de 10 dígitos (`4323456799`), 9 dígitos (`456789009`) y nombres en minúsculas (`jose quispe`). |
| **7. Consistencia y Normalización de Catálogos** | **Esquema de Enumerados Cerrados (Enums)**. La base de datos, los formularios móviles y el backend comparten idénticos identificadores para clasificaciones y estados. | **Dispersión Semántica**. Categoría "DIAMANTE" existe en Sheets pero es degradada a "BRONCE" en el Admin. Condición "DE BAJA / RETIRADO" existe en cabecera de PWA pero no en el selector (`INOPERATIVO`, `OPERATIVO`, `RENOVACION`). | 🟡 **MODERADO:** Pérdida de visibilidad gerencial de tiendas estratégicas Diamante y falta de estandarización en auditorías de hardware obsoleto. |

---

## 4. CATÁLOGO DETALLADO DE INCONSISTENCIAS DETECTADAS

### 🔴 INCONSISTENCIAS CRÍTICAS (Severidad: ALTA / Bloqueante de Operación)

#### [C-01] Desfase Físico de 24 vs 26 Columnas en `Codigo.gs`
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\Codigo.gs` (Líneas 1-8, 333-358, 489-517).
* **Descripción:** El script desplegado físicamente es la versión 2.7 (24 columnas), mientras que la hoja física de Sheets y el archivo `Codigo.md` fueron diseñados para 26 columnas canónicas (A–Z).
* **Impacto:**
  1. Las firmas de técnico y cliente se escriben en las columnas 19 (S) y 20 (T), sobreescribiendo las fotos de Registro 7 y 8.
  2. El nombre y DNI del encargado se escriben en las columnas 21 (U) y 22 (V), sobreescribiendo las URLs de las firmas.
  3. Los técnicos de apoyo 1 y 2 se escriben en las columnas 23 (W) y 24 (X), sobreescribiendo el nombre y DNI del encargado.
  4. Las columnas 25 (Y: `TECNICO_APOYO_1`) y 26 (Z: `TECNICO_APOYO_2`) nunca se escriben en la creación inicial y son truncadas al ejecutar `actualizarReporteAdmin` (que hace `setValues` sobre un rango de ancho 24).

#### [C-02] Mapeo Roto y Descarte de Fotografías 4 y 7 en la PWA Móvil
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 6872-6923).
* **Descripción:** Al compilar el objeto `payload` en `enviarAtencionFinal()`:
  - El Slot 1 (`fotosReporteArray[0]`) se mapea a `urlFotoPanoramica`.
  - El Slot 2 (`fotosReporteArray[1]`) se mapea a `urlFotoPos1`.
  - El Slot 3 (`fotosReporteArray[2]`) se mapea a `urlFotoPos2`.
  - **El Slot 4 (`fotosReporteArray[3]`) se descarta por completo** (no se asigna a ninguna propiedad).
  - El Slot 5 (`fotosReporteArray[4]`) se mapea a `urlFotoBackup`.
  - El Slot 6 (`fotosReporteArray[5]`) se mapea a `urlFotoPdu`.
  - **El Slot 7 (`fotosReporteArray[6]`) se descarta por completo** (no se asigna a ninguna propiedad).
  - El Slot 8 (`fotosReporteArray[7]`) se mapea a `urlFotoActa`.
* **Impacto:** Si un técnico documenta una tienda con 4 cajas o utiliza los slots 4 y 7 de la cuadrícula de fotos, **esas dos fotografías nunca se envían al servidor**. Además, se envían con nombres legacy en vez de `urlFotoRegistro1` a `urlFotoRegistro8`.

#### [C-03] Eliminación a Ciegas del Borrador Local por Respuesta Opaca (`no-cors`)
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 6928-6940).
* **Descripción:** Se ejecuta `fetch(API_BACKEND_URL, { mode: "no-cors" })`. Por especificación de W3C/Fetch, las peticiones `no-cors` resuelven la promesa siempre con un `Response` de tipo opaco (código de estado `0`), independientemente de si el backend procesó los datos o arrojó un error 500 / timeout. En el bloque `.then()`, la aplicación asume éxito y ejecuta de inmediato:
  ```javascript
  localStorage.removeItem("COOLBOX_BORRADOR_SERVICIO");
  localStorage.removeItem("borrador_coolbox");
  localStorage.removeItem("coolbox_mantenimiento_draft");
  ```
* **Impacto:** Pérdida permanente de evidencias en campo. Si Apps Script aborta por cualquier motivo (tiempo de ejecución, cuota de Drive excedida, bloqueo de candado), el borrador del móvil es destruido y el técnico recibe confirmación de éxito falsa.

#### [C-04] Triplicación Redundante de Memoria en `localStorage` y QuotaExceededError
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 5889-5892).
* **Descripción:** Cada vez que se ejecuta `guardarBorrador()`, la misma cadena JSON (que contiene hasta 10 fotos Base64 de ~400-800 KB cada una) se escribe tres veces:
  ```javascript
  localStorage.setItem('COOLBOX_BORRADOR_SERVICIO', jsonStr);
  localStorage.setItem('borrador_coolbox', jsonStr);
  localStorage.setItem('coolbox_mantenimiento_draft', jsonStr);
  ```
* **Impacto:** 10 fotos en Base64 equivalen a ~6 MB de texto. Al guardarse 3 veces, requiere 18 MB de almacenamiento. Dado que el límite de `localStorage` en Safari iOS y Chrome Android es de 5 MB, la llamada lanza `DOMException: QuotaExceededError`. Como está dentro de un bloque `try/catch` que solo hace `console.error`, la PWA deja de guardar borradores en silencio, dejando al técnico completamente desprotegido ante una pérdida de batería o recarga del navegador.

#### [C-05] Monopolio del Candado Transaccional durante Subidas a Google Drive
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\Codigo.gs` (Líneas 278-325) y `Codigo.md` (Líneas 275-326).
* **Descripción:** La llamada `lock.waitLock(30000)` se ejecuta en la línea 280, **antes** de procesar las firmas y las 10 fotografías en Google Drive.
* **Impacto:** Crear un archivo en Drive mediante `DriveApp.createFile` con decodificación Base64 toma entre 1.5 y 2.5 segundos por imagen. Procesar las 2 firmas y las 10 fotografías toma $\approx 24\text{ segundos}$ continuos reteniendo el candado global de la hoja. Si dos cuadrillas sincronizan al mismo tiempo, la segunda cuadrilla esperará 24 segundos antes de poder iniciar, y si una tercera cuadrilla intenta enviar en ese lapso, excederá indefectiblemente los 30 segundos de timeout de `LockService`, arrojando un fallo fatal.

---

### 🟡 INCONSISTENCIAS MODERADAS (Severidad: MEDIA / Riesgo de Integridad)

#### [M-01] Validaciones de Campo Inseguras mediante `confirm()` Permisivo
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 6842-6866).
* **Descripción:** En `enviarAtencionFinal()`, las validaciones de fotos de gabinete, firmas y datos del encargado están programadas con ventanas emergentes de confirmación:
  ```javascript
  if (!fotoAntesBase64 || !fotoDespuesBase64) {
    if (!confirm("⚠️ No has cargado ambas fotos del gabinete... ¿Deseas enviar el reporte de todas formas?")) {
      navegarSeccion("vistaMantenimiento");
      return;
    }
  }
  ```
* **Impacto:** Permite que cualquier técnico en campo presione "Aceptar" y burle el requerimiento mandatorio de fotos de gabinete y firmas, enviando atenciones incompletas que violan el contrato de servicio con Coolbox.

#### [M-02] Ausencia de Validación de Formato en DNI de Encargado
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Línea 2168).
* **Descripción:** El campo DNI está definido como:
  ```html
  <input type="text" id="dniEncargado" placeholder="8 dígitos" maxlength="12" ...>
  ```
  No cuenta con un atributo `pattern="[0-9]{8}"` ni validación por expresión regular en JavaScript antes del envío.
* **Impacto:** Se permite el ingreso de cadenas alfanuméricas o longitudes incorrectas. En la base de datos real (`Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv`) se evidencian registros históricos corruptos como `4323456799` (10 dígitos en la tienda B22) y `456789009` (9 dígitos en la tienda B25).

#### [M-03] Ausencia de Sanitización a Mayúsculas en Backend para Nombres y DNI
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\Codigo.gs` (Líneas 354-355) y `Codigo.md` (Líneas 357-358).
* **Descripción:** El backend toma directamente `payload.nombreEncargado` y `payload.dniEncargado` sin aplicar `.toUpperCase().trim()`.
* **Impacto:** En `REGISTRO_MANTENIMIENTO.csv` (Fila 3) se evidencia el registro de `jose quispe` en minúsculas puras. Si un técnico desactiva JavaScript o usa autocompletado del teclado móvil, la base de datos queda permanentemente manchada con textos en minúsculas.

#### [M-04] Degradación de la Categoría "DIAMANTE" en el Panel de Control Admin
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\Control Coolbox Admin\index.html` (Líneas 4903-4908, 7757-7760).
* **Descripción:** En la función de clasificación de tiendas de la tabla:
  ```javascript
  let tierClass = "tier-bronce";
  if (clasifUpper.includes("ORO")) tierClass = "tier-oro";
  else if (clasifUpper.includes("PLATINO")) tierClass = "tier-platino";
  ```
  No existe evaluación para "DIAMANTE", asignándole automáticamente la clase y estilo de "BRONCE". Asimismo, el `<select id="filtroClasificacion">` solo contiene las opciones "ORO", "PLATINO" y "BRONCE".
* **Impacto:** Las tiendas de máxima jerarquía comercial de Coolbox (como K71 Plaza Lima Norte) no se pueden filtrar y se muestran erróneamente con la insignia de tienda Bronce en el panel de supervisión ejecutiva.

#### [M-05] Discrepancia Terminológica en Selector de Condición de Hardware
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 5238-5242).
* **Descripción:** En el módulo de activos retirados, el bloque visual se titula *"Activos Retirados / De Baja"*, pero el desplegable de opciones solo ofrece:
  `<option value="INOPERATIVO">`, `<option value="OPERATIVO">`, `<option value="RENOVACION">`.
* **Impacto:** Falta la opción canónica "DE BAJA / RETIRADO", forzando al técnico a marcar "INOPERATIVO" y perdiendo la distinción entre un equipo averiado en tienda y un equipo dado de baja patrimonial para retorno a almacén central.

#### [M-06] Inexistencia de la Cola de Sincronización Offline (`coolbox_offline_queue`)
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Todo el archivo).
* **Descripción:** A pesar de estar documentada como regla obligatoria en la especificación técnica de la PWA, la clave `coolbox_offline_queue` no existe en el código de `./index.html`, ni existe ningún listener `window.addEventListener('online')` que dispare reintentos automáticos tras recuperar conectividad.
* **Impacto:** Si la señal se corta en el cuarto de servidores, el técnico queda varado con un mensaje de alerta genérico y sin mecanismo de sincronización desatendida.

---

### 🟢 INCONSISTENCIAS LEVES (Severidad: BAJA / Calidad y Mantenibilidad)

#### [L-01] Valores Heterogéneos en Columna `SERVIDOR_IGC` de `DB_TIENDAS`
* **Ubicación:** `basedatos/Control_Coolbox_Dev_2026 - DB_TIENDAS.csv` (Columna F).
* **Descripción:** Coexisten valores booleanos textuales `"SÍ"`, `"NO"`, cadenas descriptivas redundantes `"Servidor IGC"` y celdas vacías.
* **Impacto:** Requiere que el backend y frontend implementen lógica de parseo tolerante (`.includes("SÍ") || .includes("IGC")`).

#### [L-02] Textos Descriptivos Largos en Checklists de Gabinete en Sheets
* **Ubicación:** `basedatos/Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv` (Columnas E y F).
* **Descripción:** Ciertas atenciones históricas registraron textos explicativos largos como `"Conforme (Limpio y aspirado)"` y `"Operativo (Flujo de aire óptimo)"`, mientras que la PWA y el panel de edición esperan valores normalizados simples (`"Conforme"`, `"Operativo"`).
* **Impacto:** En el modal de edición del Admin, estos registros históricos no hacen match exacto con el `value` de los `<select>`, reseteándose al valor por defecto al abrir el editor.

#### [L-03] Convivencia de Formato Título y Mayúsculas en Nombres de Técnicos
* **Ubicación:** `basedatos/Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv` (Columna C).
* **Descripción:** Se observan registros como `"Diego Alejandro Rodríguez Martínez"` junto a `"DIEGO ALEJANDRO RODRÍGUEZ MARTÍNEZ"` y `"Jimmy José Espinoza Medina"`.
* **Impacto:** Afecta la estética de reportes consolidados, aunque el filtrado insensible a mayúsculas/minúsculas en el Admin mitiga el impacto analítico.

#### [L-04] Dependencias Externas en Red (CDN) sin Caché en Service Worker
* **Ubicación:** `c:\Users\HP\Desktop\Control Coolbox\index.html` (Líneas 9-10).
* **Descripción:** La librería de escaneo QR/Barras (`html5-qrcode@2.3.8`) y las fuentes Poppins se cargan desde CDNs públicos (`unpkg.com` y `fonts.googleapis.com`) sin un Service Worker que las almacene en CacheStorage.
* **Impacto:** Si un técnico borra la caché de su navegador o intenta abrir la aplicación por primera vez en una zona sin cobertura celular, el escáner de cámara no cargará.

---

## 5. PLAN DE ACCIÓN RECOMENDADO (CHECKLIST PRIORIZADO DE NORMALIZACIÓN)

Para alcanzar el estándar de calidad comercial corporativo tipo Kizeo Forms, se propone la siguiente ruta de intervención estructurada en 5 fases:

```
FASE 1: Saneamiento de Backend (P0 - Bloqueante)
   └── Unificar Codigo.gs a 26 Columnas Canónicas A-Z y liberar LockService de Drive.

FASE 2: Homologación de Contratos 1:1 en PWA Móvil (P0 - Bloqueante)
   └── Mapear urlFotoGabineteAntes/Despues y urlFotoRegistro1..8 (Cero fotos omitidas).

FASE 3: Blindaje Transaccional Offline en PWA (P0 - Bloqueante)
   └── Eliminar borrado en no-cors, consolidar borrador en clave única y cola FIFO.

FASE 4: Endurecimiento de Reglas de Negocio y Sanitización (P1 - Calidad)
   └── Eliminar 'confirm' permisivos, validar DNI 8 dígitos y sanitizar en backend.

FASE 5: Estandarización de Catálogos y Panel Admin (P1 - Supervisión)
   └── Integrar soporte completo para "DIAMANTE" y condición "DE BAJA / RETIRADO".
```

### ✅ Checklist Fase 1: Despliegue Backend Canónico (26 Columnas A–Z)
- [ ] **1.1.** Sustituir el código físico de `Codigo.gs` por la especificación canónica 3.0 documentada en `Codigo.md`.
- [ ] **1.2.** **Optimización Crítica de Concurrencia:** Reestructurar `procesarAtencionTecnicaCompleta` para que la decodificación y subida de las 10 fotos a Drive se ejecute **antes** de adquirir `lock.waitLock(30000)`. De este modo, el lock sólo se retiene durante los $\approx 1.5\text{ segundos}$ que toma ejecutar `appendRow` y `setValues` en Sheets.
- [ ] **1.3.** Asegurar que `actualizarReporteAdmin` aplique `setValues` sobre un rango de **26 columnas exactas** (A–Z) y no 24, preservando la inmutabilidad de firmas y cuadrillas en las columnas U a Z.
- [ ] **1.4.** Agregar sanitización forzada en backend:
  ```javascript
  const nombreEncargadoLimpio = String(payload.nombreEncargado || "").trim().toUpperCase();
  const dniEncargadoLimpio = String(payload.dniEncargado || "").replace(/\D/g, "").slice(0, 8);
  ```

### ✅ Checklist Fase 2: Homologación Canónica 1:1 en PWA Móvil (`./index.html`)
- [ ] **2.1.** Renombrar las claves de fotos en el payload de `enviarAtencionFinal()` para cumplir el contrato 1:1 estricto:
  - `urlFotoGabineteAntes`: Foto rack antes.
  - `urlFotoGabineteDespues`: Foto rack después.
  - `urlFotoRegistro1`: Slot 1 (Caja 01 POS).
  - `urlFotoRegistro2`: Slot 2 (Caja 02 POS).
  - `urlFotoRegistro3`: Slot 3 (Caja 03 POS / Refuerzo) — *Actualmente ignorado*.
  - `urlFotoRegistro4`: Slot 4 (Caja 04 POS / Adicional) — *Actualmente ignorado*.
  - `urlFotoRegistro5`: Slot 5 (Backup / Almacén).
  - `urlFotoRegistro6`: Slot 6 (PDU / Rack comunicaciones).
  - `urlFotoRegistro7`: Slot 7 (Panorámica de tienda) — *Actualmente ignorado*.
  - `urlFotoRegistro8`: Slot 8 (Acta de conformidad física firmada).
- [ ] **2.2.** Eliminar el desfase de índices en `fotosReporteArray`. El Slot 1 de la UI debe corresponder limpiamente a `urlFotoRegistro1` y así sucesivamente hasta el Slot 8.
- [ ] **2.3.** Mantener los alias legacy en el payload por redundancia defensiva durante la transición.

### ✅ Checklist Fase 3: Blindaje de Persistencia y Transaccionalidad Offline
- [ ] **3.1.** **Eliminación de Claves Triplicadas:** En `guardarBorrador()`, almacenar el borrador exclusivamente bajo la clave oficial `COOLBOX_BORRADOR_SERVICIO`. Eliminar las escrituras redundantes en `borrador_coolbox` y `coolbox_mantenimiento_draft`.
- [ ] **3.2.** **Compresión Preventiva de Imágenes:** Validar que ninguna imagen en Base64 exceda 1000px de ancho y calidad JPEG 0.65 (garantizando $<350\text{ KB}$ por foto y un borrador global $<3.5\text{ MB}$, inmune a `QuotaExceededError`).
- [ ] **3.3.** **Fin de la Destrucción Ciega en `no-cors`:**
  - Cambiar la petición a `redirect: "follow"` y evaluar respuestas estructuradas siempre que sea posible.
  - Si se utiliza un transportador asíncrono, **no borrar el borrador de inmediato**. Marcarlo como `estado: "EN_COLA_DE_ENVIO"` y solicitar confirmación al usuario antes de limpiar la memoria local.
- [ ] **3.4.** **Cola de Sincronización FIFO:** Implementar la cola en memoria/localStorage `coolbox_offline_queue` y el evento `window.addEventListener('online')` para reanudar el envío en cuanto el móvil detecte señal 4G/WiFi fuera del sótano.

### ✅ Checklist Fase 4: Endurecimiento de Validaciones (Gating Empresarial)
- [ ] **4.1.** Reemplazar todas las funciones `confirm(...)` permisivas por bloqueos estrictos (`alert()` o modal de advertencia con detención de flujo mediante `return false`).
- [ ] **4.2.** Validar DNI en tiempo real con expresión regular estricta:
  ```javascript
  const regexDni = /^\d{8}$/;
  if (!regexDni.test(dniEncargado)) {
    alert("❌ Error: El DNI del encargado debe contener exactamente 8 dígitos numéricos.");
    navegarSeccion("vistaFirmas");
    return;
  }
  ```
- [ ] **4.3.** Bloquear el avance de sección si las fotos obligatorias de gabinete (`urlFotoGabineteAntes` y `urlFotoGabineteDespues`) o las firmas digitales no han sido capturadas.

### ✅ Checklist Fase 5: Normalización de Catálogos y Panel Administrativo
- [ ] **5.1.** En `Control Coolbox Admin/index.html`:
  - Agregar `<option value="DIAMANTE">Diamante</option>` al desplegable `#filtroClasificacion`.
  - Crear la clase CSS `.tier-diamante` con fondo `#E0F2FE`, borde `#7DD3FC` y texto `#0369A1` (azul cian brillante corporativo).
  - Actualizar la lógica de asignación de insignias para incluir `if (clasifUpper.includes("DIAMANTE")) tierClass = "tier-diamante"`.
- [ ] **5.2.** En `index.html`:
  - Agregar la opción `<option value="DE BAJA / RETIRADO">DE BAJA / RETIRADO</option>` en todos los selectores de condición de activos censados.
- [ ] **5.3.** Depurar la base de datos central Google Sheets para reemplazar celdas con valores corruptos (`"2"`, `"1"` en estado de atención) por `"REALIZADO"` o `"PENDIENTE"`.
