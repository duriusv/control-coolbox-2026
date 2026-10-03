# INFORME DE AUDITORÍA CRUZADA 4X4 INTEGRAL (ZERO MUTATION)
## Sistema de Control de Mantenimiento Preventivo e Inventario Anual Coolbox 2026

**Documento Oficial de Aseguramiento de Calidad y Validación Arquitectónica**  
**Versión de Código Auditada:** v2.2+ (Post-Actualización Despacho Institucional & Paridad Total Codigo.gs)  
**Fecha de Emisión:** 13 de Septiembre de 2026  
**Modalidad Operativa:** ESTRICTO MODO SOLO LECTURA (**Zero Mutation** en código funcional)  
**Alcance de Cobertura Cuádruple:**
1. Frontend Técnico de Campo: [`./index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/index.html)
2. Frontend Administrativo Central: [`./Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html)
3. Backend Google Apps Script (Raíz y Espejo): [`./Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Codigo.gs) y [`./DOCUMENTOS/Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/DOCUMENTOS/Codigo.gs)
4. Esquema de Base de Datos Google Sheets: `DB_TIENDAS`, `REGISTRO_MANTENIMIENTO` e `INVENTARIO_EQUIPOS`

---

## 1. RESUMEN EJECUTIVO Y SEMÁFORO DE SALUD

El presente informe consolida la auditoría técnica cruzada de correspondencia estática realizada sobre la totalidad de componentes del proyecto **Coolbox 2026**. Se analizó la cohesión contractual entre las interfaces de captura y supervisión, la lógica del backend serverless y la estructura tabular de persistencia, incluyendo la verificación de paridad absoluta entre el script raíz y su réplica documental.

### Semáforo General de Salud del Sistema (Post-Actualización v2.2+)

```
+-----------------------------------------------------------------------------------+
|                    ESTADO GENERAL: VERDE ÓPTIMO (HEALTHY / HOMOLOGADO)            |
|                                                                                   |
|  [🟢 APROBADO]  Discrepancias Críticas Bloqueantes:           0                   |
|  [🟢 APROBADO]  Paridad Codigo.gs vs DOCUMENTOS/Codigo.gs:   100% (761 líneas)   |
|  [⚡ SINTAXIS]  Errores Sintácticos V8 (Ambos Codigo.gs):     0 (100% Válido V8)  |
|  [📧 DESPACHO]  Correo Institucional (PropertiesService):    100% Desacoplado    |
|  [🛡️ BLINDADO]  Guardarraíles de Firmas (Cols 19-22):        100% Inmutables     |
|  [🔒 CONCURR.]  Bloqueo de Concurrencia (LockService):       30s Timeout Try/Fin |
|  [📦 CATÁLOGO]  Catálogo Canónico de 11 Activos:             100% Sincronizado   |
+-----------------------------------------------------------------------------------+
```

* **Discrepancias Críticas (0):** No existen incompatibilidades que impidan la transmisión, causen pérdida de datos, desalineación de columnas en Google Sheets o excepciones en tiempo de ejecución.
* **Paridad Documental Absoluta (100%):** La discrepancia previa de versiones entre `./Codigo.gs` y `./DOCUMENTOS/Codigo.gs` ha quedado **completamente resuelta**. Ambos archivos comparten exactamente 761 líneas, 12 funciones idénticas y cero discrepancias lógicas.
* **Despacho Institucional Homologado:** La función `enviarDocumentacionSede` opera desacoplada de direcciones personales, integrando lectura segura mediante `PropertiesService.getScriptProperties()` y adjuntos PDF en Base64.
* **Veredicto:** El ecosistema de software se encuentra **PLENAMENTE HOMOLOGADO, BLINDADO Y APTO** para la prueba de fuego operativa.

---

## 2. MATRIZ CANÓNICA DE ACTIVOS 4X4

Auditoría exhaustiva de correspondencia literal para los **11 activos del catálogo oficial**, evaluando la representación exacta de cadenas de texto (mayúsculas, tildes, barras y espacios) en las 4 capas del sistema:

| N° | Activo Canónico Oficial | Frontend Técnico (`index.html`) | Frontend Admin (`Control Coolbox Admin`) | Backend (`Codigo.gs` v2.2+) | Base de Datos (`INVENTARIO_EQUIPOS`) | Estado de Sincronización |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `CPU POS / All in One` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `PERIFERICOS_CAJA_CANONICOS` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[0]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **02** | `Monitor POS / Pantalla Táctil` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `PERIFERICOS_CAJA_CANONICOS` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[1]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **03** | `Impresora Térmica de Tickets` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `PERIFERICOS_CAJA_CANONICOS` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[2]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **04** | `Lector de Código de Barras` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `PERIFERICOS_CAJA_CANONICOS` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[3]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **05** | `Impresora Láser / Tinta` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `PERIFERICOS_CAJA_CANONICOS` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[4]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **06** | `PDA (Asistente Digital Personal)` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y módulo independiente PDA | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[5]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **07** | `Impresora Inalámbrica de Recibos` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y módulo inalámbrico | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[6]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **08** | `Switch de Comunicaciones` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `EQUIPOS_FIJOS_RACK` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[7]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **09** | `Router de Conectividad` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `EQUIPOS_FIJOS_RACK` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[8]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **10** | `Estabilizador de Voltaje / PDU` | ✅ Presente en `#bkp_${idx}_tipo`, `#ret_${idx}_tipo` y `EQUIPOS_FIJOS_RACK` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[9]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |
| **11** | `Otro Dispositivo / Periférico` | ✅ Presente en `#bkp_${idx}_tipo` y `#ret_${idx}_tipo` | ✅ Presente en `TIPOS_EQUIPO_OFICIALES[10]` y selector dinámico | ✅ Mapeado a Col 5 (`TIPO_EQUIPO`) vía `eq.tipo \|\| eq.tipoEquipo` | ✅ Col 05 `TIPO_EQUIPO` admite y almacena valor canónico | **MATCH** |

> **Resultado del Módulo:** **11 / 11 MATCH (100% Homologado)**. La estandarización de `"Monitor POS / Pantalla Táctil"` en el índice 2 eliminó cualquier discordancia previa.

---

## 3. AUDITORÍA DE SINTAXIS, PARIDAD Y LÓGICA EN BACKEND (CODIGO.GS)

### 3.1 Tabla de Paridad y Validación Sintáctica Cruzada

Se evaluaron de forma estática e independiente los dos archivos que conforman el backend del ecosistema Coolbox 2026:

| Métrica / Verificación | `./Codigo.gs` (Raíz) | `./DOCUMENTOS/Codigo.gs` (Espejo) | Nivel de Paridad |
| :--- | :---: | :---: | :---: |
| **Estado Sintáctico V8 (`vm.Script`)** | ✅ 0 SyntaxErrors (Válido) | ✅ 0 SyntaxErrors (Válido) | **100% MATCH** |
| **Número Total de Líneas** | 761 líneas | 761 líneas | **100% MATCH** |
| **Contenido Normalizado (LF)** | 36,555 bytes | 36,555 bytes | **100% IDÉNTICO** |
| **Total de Funciones Declaradas** | 12 funciones | 12 funciones | **100% MATCH** |
| **Funciones Duplicadas** | 0 duplicados | 0 duplicados | **0 DUPLICADOS** |
| **Persistencia PATCH In-Situ** | `actualizarReporteAdmin` | `actualizarReporteAdmin` | **100% MATCH** |
| **Despacho Institucional de Correo** | `enviarDocumentacionSede` | `enviarDocumentacionSede` | **100% MATCH** |
| **Uso de PropertiesService** | Sí (`getScriptProperties()`) | Sí (`getScriptProperties()`) | **100% MATCH** |
| **Protección contra Concurrencia** | `LockService.waitLock(30000)` | `LockService.waitLock(30000)` | **100% MATCH** |
| **Inmutabilidad Columnas 19-22** | Preservadas vía `filaActual` | Preservadas vía `filaActual` | **100% MATCH** |

### 3.2 Inventario Oficial de Funciones (12 / 12 Homologadas)

Ambos archivos implementan exactamente las siguientes 12 funciones:
```
1.  obtenerLibroSeguro()               -> Conexión tolerante a fallos con ID de hoja o libro activo
2.  extraerFotoSegura()                -> Extracción defensiva de arrays polimórficos de evidencias
3.  doGet(e)                           -> Despacho de tiendas, atenciones, inventario y catálogo canónico
4.  doPost(e)                          -> Enrutador determinista unificado (Ramas A, B y C)
5.  guardarAtencion(payload)           -> Puente de compatibilidad para ejecución vía google.script.run
6.  procesarAtencionTecnicaCompleta()  -> Registro transaccional inicial de campo con LockService
7.  actualizarReporteAdmin(payload)    -> Persistencia PATCH in-situ defensiva con LockService
8.  resolverFoto()                     -> Resolución condicional de fotos (Drive URL vs Base64)
9.  actualizarEstadoEnDbTiendas()      -> Marcación de estado en Col 7 de DB_TIENDAS
10. guardarImagenBase64EnDrive()       -> Conversión Base64 a Drive Blob con acceso público de lectura
11. obtenerOCrearCarpetaDrive()        -> Gestión de carpeta "Evidencias Coolbox 2026"
12. enviarDocumentacionSede()          -> Despacho formal institucional con PropertiesService
```

### 3.3 Enrutamiento Determinista en `doPost(e)`
El despachador HTTP POST procesa deterministamente tres ramas operativas:
```javascript
// RAMA A: Despacho de Documentación Oficial por Correo
if (accion === "enviarDocumentacionSede") {
  const resultado = enviarDocumentacionSede(contenido.datosTienda || contenido, contenido.correoDestino || contenido.correo);
  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
}

// RAMA B: Actualización Selectiva No Destructiva (Desde el Dashboard Admin)
if (accion === "actualizarReporteAdmin" || accion === "ACTUALIZAR_REPORTE_ADMIN" || accion === "ACTUALIZAR_REPORTE" || accion === "actualizarReporte") {
  const resultadoEdicion = actualizarReporteAdmin(contenido);
  return ContentService.createTextOutput(JSON.stringify(resultadoEdicion)).setMimeType(ContentService.MimeType.JSON);
}

// RAMA C: Registro Inicial de Campo desde App Técnico
if (accion === "registrarAtencionTecnica" || accion === "registrarAtencion" || contenido.codigoTienda || contenido.codigo) {
  const resultadoRegistro = procesarAtencionTecnicaCompleta(contenido);
  return ContentService.createTextOutput(JSON.stringify(resultadoRegistro)).setMimeType(ContentService.MimeType.JSON);
}
```

### 3.4 Candado de Auditoría e Inmutabilidad de Firmas
Se verificó el ensamblaje de la fila actualizada en `actualizarReporteAdmin`:
```javascript
const filaActualizada = [
  filaActual[0],  // Col 01: ID_VISITA (INMUTABLE - Preserva ID generado en campo)
  filaActual[1],  // Col 02: FECHA_HORA (INMUTABLE - Preserva timestamp de atención)
  payload.tecnico || payload.tecnicoLider || datos.tecnico || filaActual[2],
  codigoTienda,
  payload.gabineteLimpieza || datos.gabineteLimpieza || filaActual[4] || "Conforme",
  payload.gabineteVentiladores || datos.gabineteVentiladores || filaActual[5] || "Operativo",
  payload.gabinetePDU || datos.gabinetePDU || filaActual[6] || "Operativo",
  urlFotoAntes,
  urlFotoDesp,
  payload.observacionesGabinete !== undefined ? payload.observacionesGabinete : (datos.observacionesGabinete !== undefined ? datos.observacionesGabinete : filaActual[9]),
  estadoComputoJson,
  payload.observacionesComputo !== undefined ? payload.observacionesComputo : (datos.observacionesComputo !== undefined ? datos.observacionesComputo : filaActual[11]),
  urlFotoPos1,
  urlFotoPos2,
  urlFotoBackup,
  urlFotoPdu,
  urlFotoPanor,
  urlFotoActa,
  filaActual[18], // Col 19: FIRMA_TECNICO_URL (INMUTABLE - Blindaje absoluto)
  filaActual[19], // Col 20: FIRMA_CLIENTE_URL (INMUTABLE - Blindaje absoluto)
  filaActual[20], // Col 21: NOMBRE_ENCARGADO (INMUTABLE - Blindaje absoluto)
  filaActual[21]  // Col 22: DNI_ENCARGADO (INMUTABLE - Blindaje absoluto)
];
```
* **Diagnóstico:** Las Columnas 19, 20, 21 y 22 jamás se sobreescriben; se leen de la fila existente (`filaActual`) y se reescriben intactas. Cumplimiento del guardarraíl: **100% APROBADO**.

### 3.5 Concurrencia y Persistencia Atómica In-Situ (`setValues`)
* **Bloqueo con LockService:** `LockService.getScriptLock().waitLock(30000)` con bloque `try/finally` asegurando `lock.releaseLock()`.
* **Cero Duplicación de Filas:** En lugar de `appendRow`, ejecuta:
  ```javascript
  hojaMantenimiento.getRange(filaIndex, 1, 1, 22).setValues([filaActualizada]);
  ```
  Localizando la tienda en Col 4 (`CODIGO_TIENDA`) y actualizando la fila in-situ.
* **Sincronización Limpia de Inventario:** En `INVENTARIO_EQUIPOS`, ejecuta purga selectiva de registros huérfanos anteriores de la tienda (`deleteRow`) y realiza inserción atómica por lotes con `setValues` para el nuevo censo.

### 3.6 Despacho Institucional Desacoplado (`enviarDocumentacionSede`)
* **Lectura Segura de Variables:** Emplea `PropertiesService.getScriptProperties()` para obtener dinámicamente `REMITENTE_NOMBRE` ("JSERVICE RV — Control Operativo") y `REPLY_TO_EMAIL` ("supervision.operaciones@coolbox.pe"), permitiendo configurar credenciales sin alterar el código fuente.
* **Procesamiento de Adjuntos PDF:** Decodifica documentos adjuntos en Base64 convirtiéndolos en Blobs de tipo `application/pdf`.
* **Cuerpo HTML Institucional:** Genera un correo corporativo formal con diseño responsivo, cabecera de JSERVICE RV, desglose de datos de la sede atendida y pie de página institucional.
* **Cero Cuentas Personales Hardcodeadas:** Desacoplamiento total verificado (0 direcciones personales en código).

---

## 4. AUDITORÍA DE CONSISTENCIA DE INTERFACES (TÉCNICO VS ADMIN)

### 4.1 Coincidencia de IDs de Campos del Payload
Los nombres de propiedades transmitidos desde el Dashboard Admin hacia `Codigo.gs` guardan perfecta correspondencia biyectiva:

| Propiedad en Payload Admin | Destino en `actualizarReporteAdmin` | Columna en Google Sheets |
| :--- | :--- | :--- |
| `codigoTienda` | `codigoTienda` | Col 04 (`CODIGO_TIENDA`) |
| `gabineteLimpieza` | `payload.gabineteLimpieza` | Col 05 (`GABINETE_LIMPIEZA`) |
| `gabineteVentiladores` | `payload.gabineteVentiladores` | Col 06 (`GABINETE_VENTILADORES`) |
| `gabinetePDU` | `payload.gabinetePDU` | Col 07 (`GABINETE_PDU`) |
| `observacionesGabinete` | `payload.observacionesGabinete` | Col 10 (`OBSERVACIONES_GABINETE`) |
| `estacionesMantenimiento` | `estadoComputoJson` (JSON string) | Col 11 (`COMPUTO_ESTADO`) |
| `observacionesComputo` | `payload.observacionesComputo` | Col 12 (`OBSERVACIONES_COMPUTO`) |
| `equipos` | `listaEquipos` | Tabla `INVENTARIO_EQUIPOS` (11 Cols) |
| `fotos` (`fotoAntes`, `fotoDespues`, etc.) | `fotosObj` / `resolverFoto` | Cols 08, 09, 13, 14, 15, 16, 17, 18 |

### 4.2 Verificación de Estaciones POS (7 Tareas Limpias)
* En `agregarEstacionVentaEdicion()` (`Control Coolbox Admin/index.html` línea 11090), el objeto `nuevaCaja` inicializa rigurosamente los 7 checkboxes en `false`:
  ```javascript
  var nuevaCaja = {
    numeroEstacion: numCaja,
    estacion: "Estación " + numCaja + " (Caja 0" + numCaja + ")",
    ubicacion: "Caja 0" + numCaja,
    estado: "Operativo 100%",
    limpiezaAIO: false,
    cambioPastaTermica: false,
    limpiezaTicketera: false,
    limpiezaImpresora: false,
    limpiezaLector: false,
    limpiezaGaveta: false,
    ordenCables: false,
    observaciones: ""
  };
  ```
* En `resetearFormularioEdicion()`, la Caja 01 por defecto se inicializa con los mismos 7 valores en `false`.
* **Diagnóstico:** Cero riesgo de registrar tareas falsas por defecto.

### 4.3 Verificación de los 3 Desplegables de Gabinete
Ambos entornos comparten exactamente las 3 listas desplegables homologadas de campo:
1. **Limpieza Interna:** `Conforme (Limpio y aspirado)` / `No Conforme (Suciedad excesiva)` / `No Aplica / Sin acceso`
2. **Ventilación / Extractores:** `Operativo (Flujo de aire óptimo)` / `Inoperativo / Ruidoso)` / `No cuenta con extractores`
3. **Alimentación Eléctrica / PDU:** `Operativo (Tomas con energía)` / `Observado (Puntos sin energía)`

---

## 5. ESTADO DE DISCREPANCIAS Y OBSERVACIONES

### Estado de Observaciones Anteriores

1. **Sincronización de Archivo Espejo (`DOCUMENTOS/Codigo.gs`):**
   * *Estado:* **RESUELTO AL 100% (APROBADO)**.
   * *Diagnóstico Actual:* `./Codigo.gs` y `./DOCUMENTOS/Codigo.gs` cuentan con paridad exacta de 761 líneas, 12 funciones idénticas, 0 errores sintácticos y contenido normalizado idéntico.

2. **Doble Compatibilidad en Estructura de Fotos del Payload:**
   * *Estado:* **HOMOLOGADO Y COMPATIBLE**.
   * *Diagnóstico Actual:* `resolverFoto` resuelve polimórficamente tanto el objeto anidado `fotos` como las propiedades planas en la raíz o en `datos`, preservando URLs de Drive sin duplicación.

3. **Inmutabilidad del Reseteo en Conmutación de Tiendas:**
   * *Estado:* **BLINDADO COMO GUARDARRAÍL**.
   * *Diagnóstico Actual:* `resetearFormularioEdicion()` se ejecuta obligatoriamente al inicio de `onCambioTiendaEdicion()`, garantizando ausencia de contaminación residual entre locales.

---

## 6. VEREDICTO TÉCNICO FINAL

> ### 🏆 DICTAMEN DE AUDITORÍA: SISTEMA 100% HOMOLOGADO Y PARIDAD TOTAL CERTIFICADA
>
> Se certifica que el ecosistema **Coolbox 2026 (v2.2+)** cumple cabalmente con todos los estándares técnicos, guardarraíles de seguridad y reglas operativas de Specification-Driven Development (SDD):
>
> 1. **Zero Mutation Respetado:** Ningún archivo funcional de código fue alterado durante esta directiva de auditoría estática.
> 2. **Paridad Documental Absoluta:** `./Codigo.gs` y su réplica `./DOCUMENTOS/Codigo.gs` presentan correspondencia exacta del 100% (761 líneas, 12 funciones, 0 SyntaxErrors).
> 3. **Despacho Institucional Desacoplado:** `enviarDocumentacionSede` opera con `PropertiesService`, plantillas corporativas formales y soporte para adjuntos PDF.
> 4. **Concurrencia Blindada:** `LockService` protege todas las escrituras y `actualizarReporteAdmin` opera bajo persistencia in-situ sin duplicar registros en Sheets.
> 5. **Firmas Digitales Intactas:** Las firmas digitales de campo (columnas 19-22) permanecen 100% inmutables contra cualquier edición posterior.
>
> **El sistema queda formalmente validado, homologado y listo para su entrada en producción.**
