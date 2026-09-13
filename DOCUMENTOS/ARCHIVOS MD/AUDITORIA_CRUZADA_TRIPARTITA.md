# 🛡️ INFORME DE AUDITORÍA TÉCNICA CRUZADA TRIPARTITA
## Sistema Integrado de Control de Mantenimiento Preventivo y Censo de Activos Coolbox 2026

**Empresa Ejecutora:** JSERVICE RV E.I.R.L.  
**Cliente Mandante:** RASH PERÚ S.R.L. (Cadena de Tiendas Coolbox)  
**Supervisión General:** Andrews Berbesia (Jefatura de Operaciones) y Jesús Silva (Gerencia General)  
**Modo de Ejecución:** Auditoría Técnica Exhaustiva en Modo Solo Lectura (Discovery)  
**Fecha de Emisión:** 9 de Septiembre de 2026  
**Alcance Analítico:**
1. **App Móvil de Cuadrillas de Campo:** `index.html` (Raíz del proyecto — 336,854 bytes / 2,819 líneas).
2. **Dashboard de Supervisión y Control Administrativo:** `Control Coolbox Admin/index.html` (300,154 bytes / 7,867 líneas).
3. **Backend y Arquitectura de Datos:** Google Apps Script (`Código.gs` / API REST) y Google Sheets (`DB_TIENDAS`, `HISTORIAL_ATENCIONES`, `INVENTARIO_GENERAL`).

---

## 1. MATRIZ DE MANTENIMIENTO PREVENTIVO (CHECKLIST OPERATIVO)

### 1.1 Comparativa Estructural de Tareas y Subcomponentes

| Subsistema / Tarea | App Móvil de Técnicos (`index.html`) | Panel Administrativo (`Control Coolbox Admin/index.html`) | Google Sheets (`HISTORIAL_ATENCIONES`) | Estado de Alineación / Veredicto |
|---|---|---|---|---|
| **Limpieza / Soplado de Rack** | Selector `#gabLimpieza`: `"Conforme"`, `"No Conforme"`, `"No Aplica"` (L1245). | Campo `gabineteEstado` / Columna `GABINETE_INSPECCION` evaluada en Modal y Ficha Técnica. | Columna E: `GABINETE_INSPECCION` (Tipo Boolean esperado: `TRUE`/`FALSE`). | ⚠️ **Desalineación de Tipo:** App envía texto (`"Conforme"`), base de datos espera booleano. |
| **Ventilación / Extractores de Rack** | Selector `#gabVentiladores`: `"Operativo"`, `"Inoperativo"`, `"No Tiene"` (L1251). | Ítem `Estado de Extractores y Switch` en checklist modal (L5973). | Columna G: `GABINETE_EXTRACTORES` (Tipo Boolean esperado). | ⚠️ **Desalineación de Nombre:** App envía `gabineteVentiladores`, hoja espera `GABINETE_EXTRACTORES`. |
| **Alimentación PDU / Rack** | Selector `#gabPDU`: `"Operativo"`, `"Observado"` (L1258). | Ítem `Revisión PDU y Voltaje` en checklist modal y Ficha Técnica. | Columna F: `GABINETE_PDU` (Tipo Boolean esperado). | ⚠️ **Desalineación de Tipo:** App envía texto, base de datos espera booleano. |
| **Inspección Switch y Router** | ❌ **Ausente:** No existe campo ni checkbox en Sección 2 de la app de campo. | Presente en Modal Inspección (L5119) y en Ficha Técnica (L7177). | Implícito en `GABINETE_INSPECCION`. | 🚨 **Tarea Huérfana en Campo:** El técnico no tiene dónde certificar la inspección de Switch/Router en la app móvil. |
| **Política de Cableado en Rack** | Respeta la Regla de Oro en UI (no incluye campos de peinado en Sección 2). | Ficha Técnica L7177 dice erróneamente: *"ordenamiento de patch cords"*. | No mapeado. | 🚨 **Violación Crítica en Admin:** Texto impreso contradice la Regla de Oro institucional. |
| **Limpieza CPU / All-in-One** | Checkbox dinámico `#check_aio_${i}` por cada estación nominal (L2123). | Protocolo de Ficha Técnica: *"Mantenimiento físico y conexionado de CPU POS"* (L7187). | Columna J: `COMPUTO_CHECKLIST` (String JSON estructurado). | ⚠️ **Desalineación de Empaquetado:** App agrupa todo en un solo array `estacionesMantenimiento`. |
| **Pasta Térmica en CPU/AIO** | Checkbox dinámico `#check_pasta_${i}` por estación (L2128). | Mantenimiento preventivo general de CPU. | Incluido en `COMPUTO_CHECKLIST`. | ⚠️ **Pérdida de Granularidad:** Si no se divide en backend, la métrica de pasta térmica se pierde. |
| **Limpieza de Ticketera POS** | Checkbox dinámico `#check_tick_${i}` por estación (L2132). | Ficha Técnica: *"Limpieza de cabezal y rodillo de tracción de papel"*. | Columna K: `TICKETERAS_CHECKLIST` (String JSON dedicado). | 🚨 **Ruptura de Esquema:** App no envía columna separada para ticketeras; viaja dentro de la estación. |
| **Limpieza Impresora Adicional** | Checkbox dinámico `#check_print_${i}` por estación (L2136). | No desglosado en plantilla estándar. | No cuenta con columna dedicada en Sheets. | ⚠️ **Dato No Mapeado:** Queda diluido en el JSON de estación. |
| **Lector de Código de Barras** | Checkbox dinámico `#check_lec_${i}` por estación (L2140). | Ficha Técnica: *"Conexionado de periféricos POS"*. | Columna L: `PERIFERICOS_CHECKLIST` (String JSON dedicado). | ⚠️ **Desalineación de Destino:** Sheets espera columna `PERIFERICOS_CHECKLIST`. |
| **Gaveta de Dinero RJ11/12** | Checkbox dinámico `#check_gav_${i}` por estación (L2144). | Incluido en periféricos de caja. | Columna L: `PERIFERICOS_CHECKLIST`. | ⚠️ **Desalineación de Destino.** |
| **Orden de Cables en Puesto** | Checkbox dinámico `#check_cables_${i}` por estación (L2148). | No especificado en tabla de protocolo individual. | No cuenta con columna en Sheets. | ⚠️ **Riesgo de Confusión:** Debe aclararse que es cableado bajo mostrador y NO en rack. |
| **Equipos Backup en Almacén** | ❌ **Ausente en Sección 3 de App:** No hay checklist para ticketeras/lectores de respaldo. | Exigido en Ficha Técnica L7195: *"Equipos de Backup y Contingencia en Tienda"*. | No cuenta con columna transaccional en `HISTORIAL_ATENCIONES`. | 🚨 **Brecha Operativa:** El técnico en campo no audita el estado preventivo de los equipos de contingencia. |

---

## 2. MATRIZ DEL CENSO DE HARDWARE (13 DISPOSITIVOS ESTÁNDAR)

### 2.1 Los 13 Dispositivos Estándar del Sistema Administrativo

En el panel administrativo (`Control Coolbox Admin/index.html`, líneas 7090 a 7140), cuando una tienda se encuentra en estado inicial o proyectado para 2 cajas registradoras nominales (estándar de la cadena), se estipula la siguiente matriz canónica de **13 activos tecnológicos obligatorios**:

```
+----+---------------------------------------+-----------------------------+-----------------------+
| N° | DISPOSITIVO HOMOLOGADO                | SUBSISTEMA / UBICACIÓN      | CONDICIÓN ESPERADA    |
+----+---------------------------------------+-----------------------------+-----------------------+
| 01 | CPU POS 1                             | Punto de Venta (Caja 1)     | OPERATIVO             |
| 02 | Monitor POS y Pantalla Táctil POS 1   | Punto de Venta (Caja 1)     | OPERATIVO             |
| 03 | Impresora Térmica de Tickets POS 1    | Punto de Venta (Caja 1)     | OPERATIVO             |
| 04 | Lector de Código de Barras POS 1      | Punto de Venta (Caja 1)     | OPERATIVO             |
| 05 | CPU POS 2                             | Punto de Venta (Caja 2)     | OPERATIVO             |
| 06 | Monitor POS y Pantalla Táctil POS 2   | Punto de Venta (Caja 2)     | OPERATIVO             |
| 07 | Impresora Térmica de Tickets POS 2    | Punto de Venta (Caja 2)     | OPERATIVO             |
| 08 | Lector de Código de Barras POS 2      | Punto de Venta (Caja 2)     | OPERATIVO             |
| 09 | Switch de Comunicaciones              | Gabinete de Datos (Rack)    | OPERATIVO             |
| 10 | Router de Conectividad                | Gabinete de Datos (Rack)    | OPERATIVO             |
| 11 | Impresora Térmica de Backup           | Almacén / Trastienda        | BACKUP / OPERATIVO    |
| 12 | Lector de Código de Barras de Backup  | Almacén / Trastienda        | BACKUP / OPERATIVO    |
| 13 | Estabilizador de Voltaje / PDU        | Gabinete / Cajas            | OPERATIVO             |
+----+---------------------------------------+-----------------------------+-----------------------+
```

### 2.2 Flujo de Captura en la App Móvil de Técnicos (`index.html`)
1. **Mecanismo de Ingreso Libre y No Guiado:**
   - La captura de activos en `index.html` (L1315-L1387) se basa en un modal de formulario libre con la función `agregarEquipo()`.
   - El técnico debe seleccionar manualmente un elemento de `<select id="invTipo">` y otro de `<select id="invUbicacion">`.
   - **No existe una lista de verificación previa o "casilleros guiados"** para los 13 dispositivos estándar.
2. **Discrepancia en las Opciones de Selección:**
   - En la app móvil, la opción para equipos de red es `"Switch / Router"` (L1329), agrupando ambos equipos en un solo ítem, mientras la Ficha Técnica administrativa y el censo oficial exigen registrar el Switch (Ítem 9) y el Router (Ítem 10) de forma independiente con sus respectivos números de serie.
   - En la app móvil, el equipo de cómputo se denomina `"PC"` (L1321), mientras el estándar administrativo lo define como `"CPU POS"` o `"All-in-One"`.
   - En la app móvil, los equipos de reserva en almacén dependen de que el técnico recuerde seleccionar la ubicación `"Backup (Almacén)"` en un desplegable general, lo que genera omisiones sistemáticas en campo.
3. **Impacto en la Ficha Técnica Oficial de Coolbox:**
   - En `Control Coolbox Admin/index.html` (L7063-L7088), cuando una tienda pasa a estado atendido, la tabla de censo se alimenta directamente de `equiposAtendidos` (los datos enviados por la cuadrilla).
   - Si la cuadrilla solo censó los periféricos visibles de Caja 1 y Caja 2 (ej. 6 o 7 equipos) y olvidó ingresar al cuarto de rack a censar el Switch y el Router, o no fue al almacén a registrar la ticketera de contingencia, **la Ficha Técnica oficial impresa se genera incompleta**.
   - Esto provoca que la auditoría de Coolbox (RASH PERÚ) rechace el acta de entrega por "Censo Incompleto de Activos".

---

## 3. AUDITORÍA DE EVIDENCIAS FOTOGRÁFICAS (8 FOTOS REGLAMENTARIAS)

### 3.1 Comparativa Cruzada de Slots Fotográficos

```
+-----+-------------------------------------------------------+-------------------------------------------------------+----------------------+
| POS | PANEL ADMINISTRATIVO / FICHA TÉCNICA (HOJA 2)         | APP MÓVIL DE TÉCNICOS (`index.html` - SECCIÓN 4)      | DISCREPANCIA / GAP   |
+-----+-------------------------------------------------------+-------------------------------------------------------+----------------------+
| 01  | Gabinete Comunicaciones (Estado Inicial / Antes)      | Foto 1: Panorámica del Local (Requerido)              | 🚨 RUPTURA CRÍTICA   |
| 02  | Gabinete Comunicaciones (Mantenimiento / Después)     | Foto 2: Área de Cajas / Mostrador (Requerido)         | 🚨 RUPTURA CRÍTICA   |
| 03  | Punto de Venta 1 — Caja 1 (Periféricos / Conectividad)| Foto 3: Equipos en Operación (Requerido)              | ⚠️ Desalineación     |
| 04  | Punto de Venta 2 — Caja 2 (Periféricos / Conectividad)| Foto 4: Estaciones de Venta (Requerido)               | ⚠️ Desalineación     |
| 05  | Equipos de Backup y Contingencia en Tienda            | Foto 5: Detalle Adicional (Opcional)                  | 🚨 Brecha Operativa  |
| 06  | Inspección Eléctrica PDU y Estabilizador              | Foto 6: Periférico / Cableado (Opcional)              | ⚠️ Desalineación     |
| 07  | Panorámica General de Área de Cajas                   | Foto 7: Hallazgo de Campo (Opcional)                  | ⚠️ Desalineación     |
| 08  | Acta Física Firmada / Validación en Tienda            | Foto 8: Vista Final (Opcional)                        | 🚨 Brecha Operativa  |
+-----+-------------------------------------------------------+-------------------------------------------------------+----------------------+
```

### 3.2 Análisis de la Desalineación en Evidencias Fotográficas
1. **Doble Captura Desacoplada de Gabinete:**
   - En la app móvil, las fotos del gabinete se solicitan en la **Sección 2** (`#previewAntes` y `#previewDespues`, L1265-L1279), almacenándose en variables independientes (`fotoAntesBase64` y `fotoDespuesBase64`).
   - Sin embargo, en la **Sección 4** de la misma app móvil se despliegan 8 slots adicionales (`slotInfoReporte`, L1926-L1935).
   - En el panel administrativo (`construirHtmlAnexoFotos`, L6156-L6165), la Hoja 2 de la Ficha Técnica reserva obligatoriamente la **Posición 01 para Gabinete Antes** y la **Posición 02 para Gabinete Después**.
   - **Consecuencia Directa:** Si el reporte viaja mapeando el array `fotosReporte` ordenado del 1 al 8, en la Ficha Técnica del supervisor la "Panorámica del Local" aparecerá en el recuadro de "Gabinete Antes", y el "Área de Cajas" en "Gabinete Después".
2. **Slots de Backup y Acta Firmada Inexistentes:**
   - La app técnica rotula los slots 5 al 8 como genéricos (`"Detalle Adicional"`, `"Periférico / Cableado"`, `"Hallazgo de Campo"`, `"Vista Final"`).
   - El supervisor y la Ficha Técnica oficial exigen que la foto 5 sea obligatoriamente los **Equipos de Backup en Almacén** y la foto 8 sea el **Acta Física Firmada por el Encargado de Tienda**.
3. **Mecanismo de Compresión Gráfica:**
   - Ambos sistemas implementan compresión mediante elemento `<canvas>` en cliente exportando a JPEG con calidad `0.7` y resolución ajustada, garantizando un peso de carga óptimo (< 800 KB por imagen).
4. **Almacenamiento en Base de Datos Google Sheets:**
   - La tabla `HISTORIAL_ATENCIONES` en Google Sheets únicamente contempla las columnas `FOTO_ANTES_URL` (Columna H) y `FOTO_DESPUES_URL` (Columna I).
   - **No existen columnas en la hoja de cálculo para las URLs de las 8 fotografías adicionales de la Hoja 2**. Si el script de backend no cuenta con una tabla complementaria (`EVIDENCIAS_FOTOGRAFICAS`) o un volcado masivo en Drive con metadatos, estas imágenes quedan huérfanas en el almacenamiento.

---

## 4. AUDITORÍA DE FIRMAS DIGITALES TÁCTILES (`<canvas>`)

### 4.1 Requerimientos de la Ficha Técnica y Acta de Conformidad (Admin)
En `Control Coolbox Admin/index.html` (L6091-L6150), el bloque de firmas está rigurosamente estandarizado:
- **Estructura:** 3 Columnas Simétricas distribuidas horizontalmente:
  * Columna 1: **Técnico Líder de Cuadrilla** (JSERVICE RV).
  * Columna 2: **Jesús Silva / Andrews Berbesia** (Supervisión y Gerencia JSERVICE RV).
  * Columna 3: **Encargado / Administrador de Tienda** (Coolbox / RASH PERÚ S.R.L.).
- **Clearance Vertical:** Se exige un espacio vertical innegociable de exactamente `70px` (`height: 70px !important; min-height: 70px !important;`) para garantizar que la rúbrica digitalizada o manual encaje perfectamente sin desbordar los márgenes de impresión A4.
- **Modo Híbrido:** Si existe la imagen de la firma (`firmaTecnico`, `firmaCliente`), se renderiza en pantalla; si no existe, se proyecta la línea continua con la leyenda institucional para firma con bolígrafo físico.

### 4.2 Diagnóstico en la App Móvil de Técnicos (`index.html`)
- 🚨 **CERO LIENZOS TÁCTILES IMPLEMENTADOS:**
  - En `index.html`, la etiqueta `<canvas>` se utiliza **exclusivamente como utilidad en memoria** para redimensionar fotos (L1954 y L2209).
  - **No existe ningún componente interactivo de firma digital táctil (`Signature Pad`)** en toda la aplicación móvil.
  - La app técnica no cuenta con campos para capturar el **Nombre Completo, DNI ni Rúbrica Táctil** del Encargado de Tienda de Coolbox.
  - El cierre de atención se limita a seleccionar nombres de técnicos en listas desplegables (`#tecnico1`, `#tecnico2`, `#tecnico3`).
- **Consecuencia Crítica:**
  - El payload enviado por la app de campo jamás transmite `firmaTecnico` ni `firmaCliente`.
  - Como consecuencia, todas las atenciones registradas en campo obligan a que el Acta de Conformidad deba imprimirse físicamente en una fotocopiadora externa para ser firmada a mano, invalidando la promesa de "Certificación y Despacho Digital Inmediato por Correo/WhatsApp".

---

## 5. AUDITORÍA DE CONECTIVIDAD, PAYLOADS Y BACKEND

### 5.1 Anatomía del Payload Emitido por la App de Técnicos (`enviarAtencionFinal()`)
Al ejecutar el envío final en `index.html` (L2772-L2785), se construye el siguiente objeto JavaScript:

```javascript
const payload = {
  codigoTienda: tienda,                     // String: ej. "B22"
  tecnico: tecnicosConsolidados,           // String: ej. "Juan Pérez / Carlos Gómez"
  gabineteLimpieza: "Conforme",             // String: Conforme | No Conforme | No Aplica
  gabineteVentiladores: "Operativo",        // String: Operativo | Inoperativo | No Tiene
  gabinetePDU: "Operativo",                 // String: Operativo | Observado
  fotoAntesBase64: fotoAntesBase64,         // String: DataURL Base64 JPEG
  fotoDespuesBase64: fotoDespuesBase64,     // String: DataURL Base64 JPEG
  observacionesGabinete: string,            // String: Notas de rack
  estacionesMantenimiento: [...],           // Array de Objetos: Estaciones 1..N
  observacionesComputo: string,             // String: Notas de computadores
  equipos: listaEquiposMemoria,             // Array de Objetos: Activos inventariados
  fotosReporte: [...]                       // Array de Objetos: 8 fotos del reporte
};
```

### 5.2 Mapeo Cruzado: Payload vs Backend (`doPost(e)`) vs Google Sheets

```
+---------------------------+-----------------------------------+-----------------------------------+----------------------------------+
| PROPIEDAD EN PAYLOAD      | COLUMNA EN GOOGLE SHEETS          | TIPO / FORMATO ESPERADO           | DIAGNÓSTICO DE COMPATIBILIDAD    |
+---------------------------+-----------------------------------+-----------------------------------+----------------------------------+
| `codigoTienda`            | `HISTORIAL_ATENCIONES.COD_TIENDA` | String (ej. "B22", "T014")        | ✅ Totalmente Compatible         |
| `tecnico`                 | `TECNICO_RESPONSABLE`             | String                            | ✅ Totalmente Compatible         |
| `gabineteLimpieza`        | `GABINETE_INSPECCION`             | Boolean (TRUE / FALSE)            | ⚠️ Discrepancia: String vs Bool  |
| `gabineteVentiladores`    | `GABINETE_EXTRACTORES`            | Boolean (TRUE / FALSE)            | 🚨 Desalineación de Nombre y Tipo|
| `gabinetePDU`             | `GABINETE_PDU`                    | Boolean (TRUE / FALSE)            | ⚠️ Discrepancia: String vs Bool  |
| `fotoAntesBase64`         | `FOTO_ANTES_URL`                  | URL Drive (`https://drive...`)    | ⚙️ Requiere conversión en GAS    |
| `fotoDespuesBase64`       | `FOTO_DESPUES_URL`                | URL Drive (`https://drive...`)    | ⚙️ Requiere conversión en GAS    |
| `estacionesMantenimiento` | `COMPUTO_CHECKLIST`               | JSON String (Cómputo puro)        | 🚨 Array mixto no desglosado     |
| [No emitido por app]      | `TICKETERAS_CHECKLIST`            | JSON String (Ticketeras puras)    | 🚨 Columna queda vacía en Sheets |
| [No emitido por app]      | `PERIFERICOS_CHECKLIST`           | JSON String (Periféricos puros)   | 🚨 Columna queda vacía en Sheets |
| `observacionesGabinete` + | `OBSERVACIONES_GENERALES`         | Text unificado                    | ⚠️ Requiere concatenación en GAS |
| `observacionesComputo`    |                                   |                                   |                                  |
| `equipos[i].tipoEquipo`   | `INVENTARIO_GENERAL.TIPO_EQUIPO`  | Enum homologado                   | ⚠️ Valores no normalizados       |
| `equipos[i].serie`        | `NUMERO_SERIE`                    | String                            | ✅ Compatible                    |
| `equipos[i].codInventario`| `CODIGO_INVENTARIO`               | String                            | ✅ Compatible                    |
| `equipos[i].ubicacionCaja`| `UBICACION_CAJA`                  | String (ej. "Caja 1", "Rack")     | ✅ Compatible                    |
| `equipos[i].condicion`    | `CONDICION_OPERATIVA`             | Enum ("OPERATIVO", "INOPERATIVO") | ⚠️ Sensibilidad a mayúsculas     |
| [No capturado en app]     | `METODO_CAPTURA`                  | Enum ("SCAN_CAMARA", "MANUAL")    | 🚨 Campo perdido en la app       |
| `fotosReporte`            | [Sin columna en Sheets]           | URLs en Google Drive              | 🚨 Huérfano en base de datos     |
+---------------------------+-----------------------------------+-----------------------------------+----------------------------------+
```

### 5.3 El Gran Cuello de Botella de Conectividad HTTP / REST
- **En el Dashboard Administrativo (`Control Coolbox Admin/index.html`):**
  Existe una constante de conexión declarada explícitamente:
  `const API_BACKEND_URL = "https://script.google.com/macros/s/AKfycbyOGivG_VPrQDyh-8qXaIhFacwyrom2iG5cKxVu6JrBKIH1WWeQUx2NC6IzsMaeI6O93Q/exec";`
  Esta constante permite que el panel funcione de manera autónoma en cualquier servidor web (GitHub Pages, Vercel, Localhost) consumiendo datos vía `fetch()`.
- **En la App Móvil de Técnicos (`index.html`):**
  **NO EXISTE `API_BACKEND_URL`**. La app depende estrictamente de:
  `if (typeof google !== "undefined" && google.script && google.script.run)`
  * **Problema Demostrado:** Cuando la app móvil se aloja en un servidor web externo (para evitar que el `iframe` de Google Apps Script congele los botones y bloquee sesiones en Safari/Chrome móvil), el objeto `google.script.run` es `undefined`.
  * **Consecuencia:** La app técnica entra automáticamente en la rama falsa (`else`), mostrando el mensaje: `alert("✅ [MODO LOCAL] ¡Atención registrada y sincronizada con éxito en pruebas!");` (L2811), **sin enviar absolutamente nada a Google Sheets ni a Google Drive**.

---

## 6. RESUMEN EJECUTIVO DE BRECHAS (GAPS Y ROADMAP DE CORRECCIÓN)

### TABLA A: Brechas Identificadas en la App Móvil de Técnicos (`index.html`)

| ID | Dimensión | Descripción de la Brecha | Severidad | Acción Correctiva Recomendada |
|---|---|---|---|---|
| **GAP-TEC-01** | Conectividad | Dependencia exclusiva de `google.script.run` sin endpoint REST `fetch(API_BACKEND_URL)`. En despliegues web independientes no sincroniza. | 🔴 **CRÍTICA** | Implementar `API_BACKEND_URL` canónica y fallback bidireccional (`google.script.run` o `fetch(..., {method: 'POST'})`). |
| **GAP-TEC-02** | Firmas Digitales | Ausencia total de pads de firma táctil (`<canvas>`). No se captura la firma del técnico ni la del encargado de tienda. | 🔴 **CRÍTICA** | Integrar 2 lienzos táctiles `<canvas>` con botón de limpiar y exportación a Base64 (`firmaTecnico`, `firmaCliente`). |
| **GAP-TEC-03** | Evidencia Fotográfica | Desalineación de los 8 slots fotográficos vs Hoja 2 de Ficha Técnica (Slot 1 es Panorámica en vez de Rack Antes; fotos de rack separadas). | 🔴 **CRÍTICA** | Reordenar y renombrar los slots de la Sección 4 para que correspondan 1:1 con las 8 posiciones de la Ficha Técnica oficial. |
| **GAP-TEC-04** | Censo de Hardware | Formulario de inventario libre y no guiado. El técnico puede omitir Switch, Router y equipos de Backup en almacén. | 🟠 **ALTA** | Implementar un "Modo Censo Guiado" que muestre los 13 casilleros estándar con indicador de avance (X / 13 completados). |
| **GAP-TEC-05** | Nomenclatura / Regla de Oro | El resumen de WhatsApp (L2731) incluye el texto *"y peinado de cables"*, prestando a confusión sobre alteración de cables en rack. | 🟠 **ALTA** | Modificar la redacción a: *"inspección física sin alteración de cableado (Regla de Oro)"* y acotar el peinado a *"ordenamiento de cables bajo mostrador POS"*. |
| **GAP-TEC-06** | Checklist Mantenimiento | No existe verificación explícita para Switch/Router en Sección 2 ni para periféricos de contingencia en almacén. | 🟡 **MEDIA** | Agregar checkboxes en Sección 2 para operatividad de Switch/Router y en Sección 3 para periféricos de backup. |
| **GAP-TEC-07** | Metadatos Inventario | La función `agregarEquipo()` no registra el campo `METODO_CAPTURA` (`"SCAN_CAMARA"` o `"MANUAL"`). | 🟢 **BAJA** | Registrar la propiedad `metodoCaptura` al momento de capturar el serial para auditar fidelidad de lectura. |

---

### TABLA B: Brechas Identificadas en el Panel Administrativo (`Control Coolbox Admin/index.html`)

| ID | Dimensión | Descripción de la Brecha | Severidad | Acción Correctiva Recomendada |
|---|---|---|---|---|
| **GAP-ADM-01** | Regla de Oro en Ficha Técnica | La Ficha Técnica (L7177) imprime en papel: *"ordenamiento de patch cords"*, violando explícitamente la Regla de Oro contractual. | 🔴 **CRÍTICA** | Sustituir inmediatamente por: *"Inspección física y soplado sin alteración de patch cords (Regla de Oro)"*. |
| **GAP-ADM-02** | Respaldo de 8 Fotos | El visor de Ficha Técnica (L6167-L6222) busca fotos en propiedades dispares (`gabineteAntes`, `pos1`, `backup`) que la app no envía con esos nombres. | 🟠 **ALTA** | Homologar el lector de fotos para que resuelva tanto por claves semánticas como por índice de array (`fotos[i]`). |
| **GAP-ADM-03** | Censo de Tiendas Atendidas | Si el técnico sube 8 equipos en vez de 13, la Ficha Técnica imprime solo esos 8 sin alertar sobre los faltantes de la plantilla canónica. | 🟠 **ALTA** | Incorporar en la Ficha Técnica una validación visual: si faltan ítems del estándar de 13, marcar los faltantes como *"No Censado / Pendiente"*. |
| **GAP-ADM-04** | Nomenclatura & | Presencia del caracter `&` en especificaciones y títulos (ej. `Desktop & Tablet`, `JSERVICE RV & RASH PERÚ`). | 🟡 **MEDIA** | Reemplazar sistemáticamente por conjunciones idiomáticas `"y"` o `"e"` según la directriz del proyecto. |

---

### TABLA C: Brechas Identificadas en Backend y Google Sheets (`Código.gs` / Sheets)

| ID | Dimensión | Descripción de la Brecha | Severidad | Acción Correctiva Recomendada |
|---|---|---|---|---|
| **GAP-GAS-01** | Columnas de Fotografías | `HISTORIAL_ATENCIONES` solo tiene 2 columnas para fotos (`FOTO_ANTES_URL`, `FOTO_DESPUES_URL`). No hay dónde almacenar las otras 8 fotos. | 🔴 **CRÍTICA** | Crear una pestaña dedicada `EVIDENCIAS_FOTOGRAFICAS` (`ID_FOTO`, `COD_TIENDA`, `SLOT_NUM`, `DESCRIPCION`, `URL_DRIVE`) o ampliar columnas de la hoja. |
| **GAP-GAS-02** | Transformación de Payload en `doPost` | `doPost(e)` debe traducir los nombres de la app técnica (`gabineteVentiladores` -> `GABINETE_EXTRACTORES`, `"Conforme"` -> `TRUE`). | 🔴 **CRÍTICA** | Incorporar en `doPost(e)` una capa de adaptación y normalización defensiva antes de invocar `appendRow()`. |
| **GAP-GAS-03** | Desglose de Checklists | `HISTORIAL_ATENCIONES` espera 3 columnas JSON (`COMPUTO`, `TICKETERAS`, `PERIFERICOS`), pero el frontend envía un solo array. | 🟠 **ALTA** | Procesar en servidor el array de estaciones para filtrar y estructurar los tres sub-bloques JSON de forma segregada. |
| **GAP-GAS-04** | Almacenamiento de Firmas | No existen columnas en `HISTORIAL_ATENCIONES` para almacenar los enlaces a las firmas digitales en Drive (`FIRMA_TECNICO_URL`, `FIRMA_CLIENTE_URL`). | 🟠 **ALTA** | Añadir las columnas de firma en la hoja maestra y crear los archivos de imagen en la carpeta de la tienda en Google Drive. |

---

## 7. AUDITORÍA DE REGLAS DE NOMENCLATURA (USO DEL CARACTER "&")

En cumplimiento estricto de las directrices de calidad estilística y de interfaz del proyecto, se auditó exhaustivamente la utilización del caracter comercial anglosajón `&` en todos los archivos de interfaz, documentación y especificación técnica.

### 7.1 Inventario de Ocurrencias Detectadas para Sustitución Mandatoria

```
+------------------------------------------------------+---------+-------------------------------------------------------+-------------------------------------------------------+
| ARCHIVO / DOCUMENTO                                  | LÍNEA   | CONTENIDO ACTUAL CON "&"                              | SUSTITUCIÓN MANDATORIA RECOMENDADA                   |
+------------------------------------------------------+---------+-------------------------------------------------------+-------------------------------------------------------+
| `Control Coolbox Admin/SPEC.md`                      | L3      | `JSERVICE RV & RASH PERÚ S.R.L.`                      | `JSERVICE RV y RASH PERÚ S.R.L.`                      |
| `Control Coolbox Admin/SPEC.md`                      | L287    | `[SUB-BLOQUE B: TAREAS GABINETE & CÓMPUTO]`           | `[SUB-BLOQUE B: TAREAS GABINETE Y CÓMPUTO]`           |
| `Control Coolbox Admin/SPEC.md`                      | L428    | `### 4.3 Adaptabilidad Desktop & Tablet`              | `### 4.3 Adaptabilidad Desktop y Tablet`              |
| `DOCUMENTOS/CHECKPOINT_SISTEMA_COOLBOX_2026.md`      | L2      | `Mantenimiento Preventivo & Censo de Activos`         | `Mantenimiento Preventivo y Censo de Activos`         |
| `DOCUMENTOS/CHECKPOINT_SISTEMA_COOLBOX_2026.md`      | L4      | `Supervisión General: Andrews & Jesús Silva`          | `Supervisión General: Andrews y Jesús Silva`          |
| `DOCUMENTOS/CHECKPOINT_SISTEMA_COOLBOX_2026.md`      | L6      | `Metodología: SDD (...) & Arquitectura Monorepo`      | `Metodología: SDD (...) y Arquitectura Monorepo`      |
| `DOCUMENTOS/CHECKPOINT_SISTEMA_COOLBOX_2026.md`      | L72     | `3. Monorepo & Despliegue Público:`                   | `3. Monorepo y Despliegue Público:`                   |
| `.agents/skills/coolbox-control-builder/SKILL.md`    | L6      | `Especialista en Google Workspace & Operaciones...`   | `Especialista en Google Workspace y Operaciones...`   |
| `.agents/skills/coolbox-dashboard-supervisor/SKILL.md| L58     | `## 4. ENFOQUE DE DISPOSITIVO: DESKTOP & TABLET`      | `## 4. ENFOQUE DE DISPOSITIVO: DESKTOP Y TABLET`      |
| `Control Coolbox Admin/index.html` (Lógica JS)       | L6811   | Sanitizador activo: `.replace(/&/g, " y ")`           | ✅ Mantener (Protección reactiva contra inputs)       |
+------------------------------------------------------+---------+-------------------------------------------------------+-------------------------------------------------------+
```

> **Dictamen de Nomenclatura:** Tanto en `index.html` como en `Control Coolbox Admin/index.html`, los títulos visuales de la interfaz ya aplican mayoritariamente las conjunciones castellanas `"y"` o `"e"`. Los hallazgos residuales se concentran en las especificaciones de arquitectura y cabeceras de documentación técnica, donde se debe proceder con la sustitución sistemática según la tabla anterior.

---

## 8. CONCLUSIÓN Y DICTAMEN TÉCNICO GENERAL

1. **Integridad del Código Existente:**
   - La aplicación móvil de campo (`index.html` — 336,854 bytes) y el panel de administración (`Control Coolbox Admin/index.html` — 300,154 bytes) se mantuvieron **100% intactos e inalterados** durante esta auditoría de solo lectura.
2. **Diagnóstico del Ecosistema:**
   - Ambas interfaces presentan un acabado estético y de rendimiento visual de alto nivel.
   - Sin embargo, **existe una desconexión estructural en los contratos de datos (Data Contracts)** entre lo que la app móvil captura y despacha vs lo que el panel administrativo y las hojas de cálculo de Google Workspace esperan para emitir la Ficha Técnica oficial.
3. **Prioridad Inmediata de Implementación:**
   - Antes de iniciar el despliegue nacional el 15 de septiembre de 2026, es indispensable alinear la matriz de los 13 dispositivos de hardware, la correlación de los 8 slots fotográficos, los 2 lienzos táctiles de firma digital y el puente de conectividad HTTP REST en la aplicación de los técnicos.

---
*Informe técnico elaborado y certificado por Antigravity en Modo Discovery Estricto para JSERVICE RV.*
