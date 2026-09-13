# 📋 INFORME DE AUDITORÍA CRUZADA 360° — SISTEMA CONTROL COOLBOX 2026
**Metodología:** Software Design Document (SDD) / Auditoría Integral de Arquitectura  
**Modalidad Operativa:** MODO ESTRICTO DE SOLO LECTURA (READ-ONLY AUDIT)  
**Fecha de Ejecución:** 10 de Septiembre de 2026  
**Auditor:** Agente Especialista en Arquitectura Google Workspace & Operaciones de Campo (Antigravity)  
**Alcance de Fuentes de Datos:**
- 📱 App Móvil de Técnicos: `./index.html` (483 KB / 6,516 líneas)
- ⚙️ Backend Google Apps Script: `./DOCUMENTOS/Codigo.gs` (20.8 KB / 463 líneas)
- 🖥️ Panel Administrativo: `./Control Coolbox Admin/index.html` (329 KB / 8,551 líneas)
- 🗄️ Base de Datos Local (CSVs): `./basedatos/` (4 archivos `.csv` inspeccionados)

---

## 1. SEMÁFORO DE INTEGRIDAD GLOBAL

| Subsistema / Dimensión | Calificación | Veredicto Técnico Sintético |
|---|:---:|---|
| **Censo de Hardware e Inventario** | 🟢 **VERDE** | **Conforme.** Concordancia matemática de 11 columnas entre emisor, backend, CSV y receptor. Sanitización a mayúsculas (`.toUpperCase()`) e inmunidad contra `undefined` verificadas al 100%. |
| **Protocolo de Mantenimiento y Backup** | 🔴 **ROJO** | **Defecto Crítico.** El objeto `computoEstado` se guarda como JSON en el CSV, pero el Panel Admin omite mapearlo en `TIENDAS_DATA`. Como resultado, la verificación de *Backup en Almacén* siempre evalúa a `false` en los modales y en la Ficha Técnica. |
| **Cadena Fotográfica y Evidencias** | 🟡 **AMARILLO** | **Desfase Semántico.** Existen 10 fuentes de foto en la App (2 de rack + 8 de reporte), pero el CSV solo tiene 8 columnas. Los Slots 4 y 7 se descartan de las columnas individuales, y los Slots 5, 6 y 8 tienen etiquetas de captura que no coinciden con lo que imprime el Admin. |
| **Firmas Digitales y Datos Legales** | 🟢 **VERDE** | **Conforme.** Las 2 firmas en base64 (técnico y encargado), nombres y DNI fluyen con precisión milimétrica hacia Drive y hacia el Acta de Conformidad con respaldo de espacio físico de 70px. |
| **Rendimiento, Concurrencia y Red** | 🔴 **ROJO** | **Riesgo Operativo Alto.** `Codigo.gs` carece de `LockService` y procesa el inventario con `appendRow` dentro de un bucle O(N) (25 a 30 llamadas síncronas lentas). El frontend usa `mode: "no-cors"`, lo que borra el borrador local incluso si el servidor falla internamente. |
| **Guardarraíles Institucionales de Nomenclatura** | 🟡 **AMARILLO** | **Infracción Detectada.** Se detectaron 77 ocurrencias del operador comercial anglosajón (`&&`) en los scripts (46 en `index.html`, 8 en `Codigo.gs`, 23 en Admin). No hay caracteres comerciales simples sueltos en cadenas visuales. |

### 🎯 Calificación Global Ponderada: 🟡 AMARILLO (ADVERTENCIA OPERATIVA)
> **Diagnóstico General:** El sistema posee un diseño funcional sólido y las estructuras de datos de base están alineadas; sin embargo, **NO debe desplegarse a las 140 tiendas de forma masiva sin subsanar previamente las discrepancias críticas DISP-01 (pérdida de visualización de backup en Admin), DISP-02 (desfase en etiquetas fotográficas) y DISP-03 (latencia de escritura en Google Sheets por bucle appendRow).**

---

## 2. MATRIZ DE CORRESPONDENCIA Y CRUCE DE VARIABLES (360°)

### 2.1 Censo Modular de Hardware (Hoja: `INVENTARIO_EQUIPOS`)
*Estructura de la tabla CSV:* `ID_ITEM,ID_VISITA,FECHA_REGISTRO,CODIGO_TIENDA,TIPO_EQUIPO,MARCA,MODELO,NUMERO_SERIE,COD_INVENTARIO,UBICACION_CAJA,CONDICION` (11 columnas).

| N° Col | Campo Emisor (`index.html`) | Parámetro Backend (`Codigo.gs`) | Columna CSV / Sheet | Campo Receptor Admin (`Admin/index.html`) | Estado de Coherencia |
|:---:|---|---|---|---|:---:|
| **01** | *(Generado en backend)* | `"ITEM-" + codigoTienda + "-" + (idx + 1)` | `ID_ITEM` | `inv.idItem` | 🟢 EXACTO |
| **02** | *(Generado en backend)* | `idVisita` (`"VIS-" + cod + "-" + date`) | `ID_VISITA` | `inv.idVisita` | 🟢 EXACTO |
| **03** | *(Generado en backend)* | `fechaHoraTexto` (`dd/MM/yyyy HH:mm:ss`) | `FECHA_REGISTRO` | `inv.fechaRegistro` | 🟢 EXACTO |
| **04** | `tienda` (selectTienda) | `codigoTienda` (payload raíz) | `CODIGO_TIENDA` | `inv.codigoTienda` / `eq.codigoTienda` | 🟢 EXACTO |
| **05** | `eq.tipo` / `eq.tipoEquipo` | `eq.tipo \|\| eq.tipoEquipo \|\| "EQUIPO"` | `TIPO_EQUIPO` | `e.tipo \|\| e.tipoEquipo \|\| e.TIPO_EQUIPO` | 🟢 EXACTO |
| **06** | `eq.marca` (.toUpperCase()) | `eq.marca \|\| "GENÉRICO"` | `MARCA` | `e.marca \|\| e.MARCA` | 🟢 EXACTO |
| **07** | `eq.modelo` (.toUpperCase()) | `eq.modelo \|\| "ESTÁNDAR"` | `MODELO` | `e.modelo \|\| e.MODELO` | 🟢 EXACTO |
| **08** | `eq.serie` (fallback "S/N") | `eq.serie \|\| "S/N"` | `NUMERO_SERIE` | `e.serie \|\| e.NUMERO_SERIE` | 🟢 EXACTO |
| **09** | `eq.codInventario` (fallback "S/C") | `eq.codInventario \|\| ""` | `COD_INVENTARIO` | `e.codInventario \|\| e.COD_INVENTARIO` | 🟢 EXACTO |
| **10** | `eq.ubicacion` / `eq.ubicacionCaja` | `eq.ubicacion \|\| eq.ubicacionCaja` | `UBICACION_CAJA` | `e.ubicacion \|\| e.UBICACION_CAJA` | 🟢 EXACTO |
| **11** | `eq.condicion` (OPERATIVO/etc.) | `eq.condicion \|\| "OPERATIVO"` | `CONDICION` | `e.condicion \|\| e.CONDICION` | 🟢 EXACTO |

---

### 2.2 Protocolo de Mantenimiento Preventivo (Hoja: `REGISTRO_MANTENIMIENTO`)
*Estructura de la tabla CSV:* 22 Columnas Exactas.

| N° Col | Campo Emisor (`index.html`) | Parámetro Backend (`Codigo.gs`) | Columna CSV / Sheet | Campo Receptor Admin (`Admin/index.html`) | Estado de Coherencia |
|:---:|---|---|---|---|:---:|
| **01** | *(Generado en backend)* | `idVisita` | `ID_VISITA` | `atencion.idVisita` | 🟢 EXACTO |
| **02** | *(Generado en backend)* | `fechaHoraTexto` | `FECHA_HORA` | `atencion.fechaHora` / `fechaEjecucion` | 🟢 EXACTO |
| **03** | `tecnico` (cuadrilla consol.) | `payload.tecnico` | `TECNICO` | `atencion.tecnico` (`extraerCuadrillaDesglosada`) | 🟢 EXACTO |
| **04** | `codigoTienda` | `codigoTienda` | `CODIGO_TIENDA` | `atencion.codigoTienda` | 🟢 EXACTO |
| **05** | `gabineteLimpieza` | `payload.gabineteLimpieza` | `GABINETE_LIMPIEZA` | `tienda.gabineteLimpieza` | 🟢 EXACTO |
| **06** | `gabineteVentiladores` | `payload.gabineteVentiladores` | `GABINETE_VENTILADORES`| `tienda.gabineteVentiladores` | 🟢 EXACTO |
| **07** | `gabinetePDU` | `payload.gabinetePDU` | `GABINETE_PDU` | `tienda.gabinetePDU` | 🟢 EXACTO |
| **08** | `urlFotoAntes` / `fotoAntesBase64`| `guardarImagenBase64EnDrive(...)` | `URL_FOTO_ANTES` | `tienda.urlFotoAntes` | 🟢 EXACTO |
| **09** | `urlFotoDespues` / `fotoDespBase64`| `guardarImagenBase64EnDrive(...)` | `URL_FOTO_DESPUES` | `tienda.urlFotoDespues` | 🟢 EXACTO |
| **10** | `observacionesGabinete` | `payload.observacionesGabinete` | `OBSERVACIONES_GABINETE`| `tienda.observacionesGabinete` | 🟢 EXACTO |
| **11** | `estacionesMantenimiento` (Array) | `JSON.stringify(payload.estacionesMantenimiento)` | `COMPUTO_ESTADO` | ⚠️ Omitido en `TIENDAS_DATA` (evalúa `undefined`) | 🔴 DISCREPANCIA (DISP-01) |
| **12** | `observacionesComputo` | `payload.observacionesComputo` | `OBSERVACIONES_COMPUTO` | `tienda.observacionesComputo` | 🟢 EXACTO |
| **13** | Slot 2 de fotos (`urlFotoPos1`) | `guardarImagenBase64EnDrive(...)` | `URL_FOTO_POS1` | `tienda.urlFotoPos1` (POS 1) | 🟡 DESFASE (DISP-02) |
| **14** | Slot 3 de fotos (`urlFotoPos2`) | `guardarImagenBase64EnDrive(...)` | `URL_FOTO_POS2` | `tienda.urlFotoPos2` (POS 2) | 🟡 DESFASE (DISP-02) |
| **15** | Slot 5 de fotos (`urlFotoBackup`)| `guardarImagenBase64EnDrive(...)` | `URL_FOTO_BACKUP` | `tienda.urlFotoBackup` (Backup Almacén) | 🟡 DESFASE (DISP-02) |
| **16** | Slot 6 de fotos (`urlFotoPdu`) | `guardarImagenBase64EnDrive(...)` | `URL_FOTO_PDU` | `tienda.urlFotoPdu` (PDU/Estabilizador) | 🟡 DESFASE (DISP-02) |
| **17** | Slot 1 de fotos (`urlFotoPanor`)| `guardarImagenBase64EnDrive(...)` | `URL_FOTO_PANORAMICA` | `tienda.urlFotoPanoramica` (Panorámica) | 🟡 DESFASE (DISP-02) |
| **18** | Slot 8 de fotos (`urlFotoActa`) | `guardarImagenBase64EnDrive(...)` | `URL_FOTO_ACTA` | `tienda.urlFotoActa` (Hardware Adicional) | 🟡 DESFASE (DISP-02) |
| **19** | `firmaTecnicoBase64` (Canvas) | `guardarImagenBase64EnDrive(...)` | `FIRMA_TECNICO_URL` | `tienda.firmaTecnico` | 🟢 EXACTO |
| **20** | `firmaClienteBase64` (Canvas) | `guardarImagenBase64EnDrive(...)` | `FIRMA_CLIENTE_URL` | `tienda.firmaCliente` | 🟢 EXACTO |
| **21** | `nombreEncargado` | `payload.nombreEncargado` | `NOMBRE_ENCARGADO` | `tienda.nombreEncargado` | 🟢 EXACTO |
| **22** | `dniEncargado` | `payload.dniEncargado` | `DNI_ENCARGADO` | `tienda.dniEncargado` | 🟢 EXACTO |

---

## 3. TABLA DE DISCREPANCIAS Y DEFECTOS (FORMATO JIRA)

### 🔴 [DISP-01] Omisión de `computoEstado` en el mapeo `TIENDAS_DATA` del Panel Admin
- **Clasificación Jira:** `Bug` / `Severidad: High (P1)` / `Componente: Control Coolbox Admin`
- **Archivos y Líneas Involucradas:**
  - `Control Coolbox Admin/index.html`: Líneas 8283–8324 (mapeo `TIENDAS_DATA`)
  - `Control Coolbox Admin/index.html`: Línea 5584 (`abrirModalMantenimiento`)
  - `Control Coolbox Admin/index.html`: Línea 7757 (`construirHtmlFichaTecnica`)
- **Descripción Técnica:**
  En `Codigo.gs`, el campo `COMPUTO_ESTADO` almacena el JSON de las estaciones de mantenimiento y el backup (`JSON.stringify(payload.estacionesMantenimiento)`). En `doGet`, se entrega como `at.computoEstado` y `at.COMPUTO_ESTADO`. Sin embargo, al procesar `TIENDAS_DATA = tiendasValidas.map(...)` en la función `sincronizarDatosReales()` del Admin, **las propiedades `computoEstado` y `COMPUTO_ESTADO` fueron omitidas del objeto resultante**.
- **Impacto Operativo:**
  Cuando el supervisor abre el Modal de Mantenimiento (`abrirModalMantenimiento`) o genera la Ficha Técnica (`construirHtmlFichaTecnica`), el código ejecuta:
  `const rawComp = String(tienda.computoEstado || tienda.COMPUTO_ESTADO || "");`
  Al ser ambas `undefined`, `rawComp` es siempre cadena vacía. Por lo tanto, **el bloque "📦 Equipos de Backup (Almacén)" NUNCA se muestra en el panel ni en los reportes impresos**, haciendo invisible el trabajo ejecutado por el técnico en almacén.
- **Propuesta de Corrección:**
  En `Control Coolbox Admin/index.html`, dentro del retorno de `TIENDAS_DATA` (aprox. línea 8298), agregar:
  ```javascript
  computoEstado: atencion.computoEstado || atencion.COMPUTO_ESTADO || "",
  COMPUTO_ESTADO: atencion.COMPUTO_ESTADO || atencion.computoEstado || "",
  estacionesMantenimiento: (function() {
    try {
      const raw = atencion.computoEstado || atencion.COMPUTO_ESTADO;
      return typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
    } catch(e) { return []; }
  })(),
  ```

---

### 🟡 [DISP-02] Desalineación Semántica en los 8 Slots Fotográficos de Campo
- **Clasificación Jira:** `Improvement` / `Severidad: Medium (P2)` / `Componentes: App Móvil, GAS, Admin`
- **Archivos y Líneas Involucradas:**
  - `index.html`: Líneas 1884–2044 (declaración de tarjetas de fotos 1 a 8 en el DOM)
  - `index.html`: Líneas 6384–6400 (desempaquetado en `enviarAtencionFinal`)
  - `DOCUMENTOS/Codigo.gs`: Líneas 236–241 (`procesarAtencionTecnicaCompleta`)
  - `Control Coolbox Admin/index.html`: Líneas 6691–6700 (`construirHtmlAnexoFotos`)
  - `Control Coolbox Admin/index.html`: Líneas 5912–5921 (`obtenerFotosTienda`)
- **Descripción Técnica:**
  Existe un desajuste entre la etiqueta que lee el técnico en su teléfono móvil y el destino documental donde se archiva la fotografía en Google Sheets y en el Anexo de Evidencias:
  1. En `index.html`, **Slot 5** se titula `"Foto 5: Detalle Adicional"`, pero `enviarAtencionFinal` lo mapea a `urlFotoBackup`, `Codigo.gs` lo nombra `Foto_Backup_<CODIGO>.jpg` y el Admin lo imprime como `"Equipos de Backup y Contingencia en Tienda"`. Si el técnico fotografió una pared o un extintor, saldrá caratulado como Backup.
  2. En `index.html`, **Slot 6** se titula `"Foto 6: Periférico / Cableado"`, pero se mapea a `urlFotoPdu`, se guarda como `Foto_PDU_<CODIGO>.jpg` y el Admin lo titula `"Inspección Eléctrica PDU y Estabilizador"`.
  3. En `index.html`, **Slot 8** se titula `"Foto 8: Vista Final"`, pero se mapea a `urlFotoActa`, se guarda como `Foto_Acta_<CODIGO>.jpg` y el Admin lo titula `"Inspección de Hardware / Censo Adicional"`.
  4. Los **Slots 4 ("Estaciones de Venta") y 7 ("Hallazgo de Campo")** de la app NO se mapean a ninguna de las columnas fijas de `REGISTRO_MANTENIMIENTO`; únicamente viajan dentro del arreglo genérico `fotosReporte`.
- **Impacto Operativo:**
  Riesgo de que el cliente Coolbox reciba informes con fotos descontextualizadas (ej. cables en el recuadro de PDU, o detalles varios en el recuadro de Backup).
- **Propuesta de Corrección:**
  Sincronizar los textos de los encabezados de los slots en `index.html` (Líneas 1887, 1907, 1967, 1987, 2027) para que coincidan exactamente con la estructura documental del Anexo:
  - Slot 1: "Panorámica General de Tienda"
  - Slot 2: "Caja 01 — Periféricos y Conectividad"
  - Slot 3: "Caja 02 — Periféricos y Conectividad"
  - Slot 4: "Estaciones POS Adicionales"
  - Slot 5: "Equipos de Backup en Almacén"
  - Slot 6: "Inspección de PDU / Estabilizador"
  - Slot 7: "Detalle General / Hallazgo"
  - Slot 8: "Hardware Adicional / Acta Física"

---

### 🔴 [DISP-03] Ineficiencia de Inserción O(N) con `appendRow` sin `LockService` en Backend
- **Clasificación Jira:** `Performance Bug` / `Severidad: High (P1)` / `Componente: Backend Codigo.gs`
- **Archivos y Líneas Involucradas:**
  - `DOCUMENTOS/Codigo.gs`: Líneas 287–303 (`procesarAtencionTecnicaCompleta`)
  - `DOCUMENTOS/Codigo.gs`: Líneas 209–218 (ausencia de `LockService`)
- **Descripción Técnica:**
  En `Codigo.gs`:
  1. No se implementa `LockService.getScriptLock()` ni timeout de 30,000 ms, violando la Regla de Oro N° 4 de la habilidad técnica oficial (`coolbox-control-builder/SKILL.md: L37-38`).
  2. Para guardar el inventario, se ejecuta un bucle `listaEquipos.forEach` donde cada elemento invoca `hojaInventario.appendRow(...)`. Para una tienda con 30 activos censados, esto dispara 30 transacciones remotas síncronas independientes a Google Sheets, demorando entre 20 y 45 segundos y arriesgando un timeout de ejecución de Google Apps Script.
- **Impacto Operativo:**
  Si 2 cuadrillas envían su cierre simultáneamente a las 18:00 hrs, se producirán colisiones de concurrencia y sobreescritura de filas. Adicionalmente, el tiempo de respuesta generará errores de conexión en el teléfono del técnico.
- **Propuesta de Corrección:**
  Proteger la función con `LockService` y escribir todos los activos censados en un solo bloque atómico mediante `setValues()`:
  ```javascript
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // 30 segundos
  try {
    // ...
    if (hojaInventario && listaEquipos.length > 0) {
      const filas = listaEquipos.map(function(eq, idx) {
        return [
          "ITEM-" + codigoTienda + "-" + (idx + 1),
          idVisita,
          fechaHoraTexto,
          codigoTienda,
          eq.tipo || eq.tipoEquipo || eq.dispositivo || "EQUIPO",
          eq.marca || "GENÉRICO",
          eq.modelo || "ESTÁNDAR",
          eq.serie || "S/N",
          eq.codInventario || "",
          eq.ubicacion || eq.ubicacionCaja || "TIENDA",
          eq.condicion || "OPERATIVO"
        ];
      });
      hojaInventario.getRange(hojaInventario.getLastRow() + 1, 1, filas.length, 11).setValues(filas);
    }
  } finally {
    lock.releaseLock();
  }
  ```

---

### 🟡 [DISP-04] Pérdida de Detalle en Checklists de Estaciones POS en Admin
- **Clasificación Jira:** `Sub-task` / `Severidad: Low (P3)` / `Componente: Control Coolbox Admin`
- **Archivos y Líneas Involucradas:**
  - `Control Coolbox Admin/index.html`: Líneas 5520–5536 y Líneas 5561–5577 (`abrirModalMantenimiento`)
- **Descripción Técnica:**
  En la App Móvil (`index.html`), el técnico marca individualmente cada tarea por estación: cambio de pasta térmica, limpieza de ticketera, limpieza de gaveta, peinado de cables, estado operativo y observaciones por caja. Sin embargo, en el modal administrativo (`abrirModalMantenimiento`), el script ignora estos booleanos y evalúa únicamente una condición binaria global: `${isPosOk ? pillOk : pillPend}`, marcando todos los ítems como conformes si la tienda tiene estado CONFORME.
- **Impacto Operativo:**
  El supervisor administrativo no puede visualizar en el modal si en una estación específica hubo una observación particular (ej. ticketera atascada o cable dañado), a pesar de que el dato sí fue recolectado en campo y guardado en el JSON de `COMPUTO_ESTADO`.
- **Propuesta de Corrección:**
  Al parsear `estacionesMantenimiento` (DISP-01), inyectar dinámicamente los estados reales de `limpiezaTicketera`, `cambioPastaTermica`, etc., para cada caja en lugar de renderizar plantillas fijas basadas en `isPosOk`.

---

### 🟡 [DISP-05] Riesgo de Pérdida de Datos en Despacho HTTP con `mode: "no-cors"`
- **Clasificación Jira:** `Resilience Bug` / `Severidad: Medium (P2)` / `Componente: App Móvil index.html`
- **Archivos y Líneas Involucradas:**
  - `index.html`: Líneas 6432–6444 (`enviarAtencionFinal`)
- **Descripción Técnica:**
  La llamada `fetch(API_BACKEND_URL, { method: "POST", mode: "no-cors", ... })` devuelve una respuesta opaca (*opaque response*). Como el navegador no puede inspeccionar el cuerpo ni el status HTTP (siempre es status 0), el bloque `.then()` se ejecuta **siempre que haya conectividad física**, incluso si Google Apps Script arroja una excepción fatal no controlada (`{ exito: false, error: "..." }`).
- **Impacto Operativo:**
  La app móvil muestra el mensaje de confirmación `"✅ ¡Atención registrada y sincronizada con éxito!"` y procede de inmediato a borrar el borrador de `localStorage`:
  `localStorage.removeItem("COOLBOX_BORRADOR_SERVICIO");`
  Si el backend falló por cuota de Drive excedida o error en Sheets, los datos del técnico se habrán eliminado del teléfono sin haber quedado registrados en el servidor.
- **Propuesta de Corrección:**
  Implementar un mecanismo de verificación diferida o mantener una copia de respaldo en una clave de histórico local (`COOLBOX_HISTORICO_ENVIOS`) que no se elimine hasta que se confirme la sincronización mediante una consulta GET ligera posterior.

---

### 🟡 [DISP-06] Inconsistencias Estructurales en los Archivos CSV de Base de Datos
- **Clasificación Jira:** `Data Quality` / `Severidad: Low (P3)` / `Componente: basedatos/*.csv`
- **Archivos Involucrados:**
  - `basedatos/Control_Coolbox_Dev_2026 - DB_TIENDAS.csv`
  - `basedatos/Control_Coolbox_Dev_2026 - Copy of RASH PERU SAC.csv`
  - `basedatos/Control_Coolbox_Dev_2026 - INVENTARIO_EQUIPOS.csv`
  - `basedatos/Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv`
- **Descripción Técnica:**
  1. `INVENTARIO_EQUIPOS.csv` y `REGISTRO_MANTENIMIENTO.csv` se encuentran en **estado cero (vacíos)**: contienen únicamente la fila 1 de encabezados y 0 registros de datos.
  2. En `DB_TIENDAS.csv`, la última columna `GAVETA` tiene una coma de cierre sin valor (*trailing comma*) en las 140 filas de tiendas.
  3. En `DB_TIENDAS.csv`, la columna `ESTADO_ATENCION` mezcla el estado string `PENDIENTE` con valores numéricos aislados (ej. `"2"`, `"4"`), indicando que en el catálogo fuente algunos campos de conteo se desplazaron de columna.
  4. En `Copy of RASH PERU SAC.csv`, la Columna 1 y la Columna 22 están completamente vacías y sin nombre en el encabezado, y las últimas 21 filas (142 a 163) corresponden a sumatorias de texto y totales que no deben ser consumidas como sedes.
- **Impacto Operativo:**
  Bajo, ya que el parser del Admin (`sincronizarDatosReales`, L8201-8205) filtra eficazmente los registros con código vacío o que incluyan `"TOTAL"`. Sin embargo, puede causar fallas si un script lee columnas por índice numérico fijo.

---

### 🟡 [DISP-07] Detección de Operadores Lógicos Comerciales (`&&`) en Código Fuente
- **Clasificación Jira:** `Compliance` / `Severidad: Low (P3)` / `Componentes: index.html, Codigo.gs, Admin`
- **Archivos y Conteo:**
  - `index.html`: **46 ocurrencias** (ej. líneas 2284, 3683, 3723, 3847, 5701, 6382, 6385–6390)
  - `DOCUMENTOS/Codigo.gs`: **8 ocurrencias** (líneas 165, 236, 237, 238, 239, 240, 241, 287)
  - `Control Coolbox Admin/index.html`: **23 ocurrencias** (ej. líneas 4688, 5022, 5028, 5282, 5700, 6214, 7424)
- **Descripción Técnica:**
  El estándar innegociable de codificación del proyecto establece:
  *"Queda terminantemente prohibido utilizar el carácter comercial anglosajón en cualquier texto, variable, comentario o código (utilizar siempre 'y' o 'e'). Para evaluar condiciones lógicas múltiples en JavaScript, emplear sentencias if anidadas o métodos funcionales."*
- **Impacto Operativo:**
  No causa fallas de sintaxis en los navegadores actuales, pero constituye un incumplimiento estricto del guardarraíl institucional de desarrollo limpio SDD.
- **Propuesta de Corrección:**
  En una fase de refactorización posterior, convertir las expresiones con `&&` en sentencias `if` anidadas o en métodos funcionales (`Array.every`, `Boolean()`).

---

## 4. VERIFICACIÓN DE GUARDARRAÍLES ESPECÍFICOS

### A) Sanitización de Hardware a Mayúsculas (`.toUpperCase()`)
- **Evaluación:** ✅ **100% CONFORME / SIN REGRESIONES**
- **Evidencia Técnica:**
  - Todas las entradas de hardware generadas en `renderizarCajasCenso`, `renderizarEquiposFijos`, `renderizarPdaCenso`, `renderizarInalambricasCenso`, `renderizarAlmacenCenso` y `renderizarRetiradosCenso` poseen la clase CSS `input-uppercase`.
  - La función central de recolección `compilarInventarioCenso()` (líneas 5160–5347) aplica sistemáticamente:
    ```javascript
    valMarca = (inputMarca ? inputMarca.value : "").trim().toUpperCase();
    valModelo = (inputModelo ? inputModelo.value : "").trim().toUpperCase();
    valSerie = (inputSerie ? inputSerie.value : "").trim().toUpperCase() || "S/N";
    valPatr = (inputPatr ? inputPatr.value : "").trim().toUpperCase() || "S/C";
    ```
  - Los fallbacks obligatorios `"S/N"` (sin número de serie) y `"S/C"` (sin código patrimonial) se aplican de forma uniforme en todas las categorías de activos.

### B) Cadena de Custodia de Firmas y Datos de Tienda
- **Evaluación:** ✅ **100% CONFORME**
- **Evidencia Técnica:**
  - Los lienzos `canvasFirmaTecnico` y `canvasFirmaCliente` generan cadenas en Base64 (`image/png`).
  - `Codigo.gs` almacena los archivos en Drive bajo la nomenclatura oficial: `Firma_Tecnico_<CODIGO_TIENDA>.png` y `Firma_Cliente_<CODIGO_TIENDA>.png`.
  - El constructor híbrido del Admin (`construirHtmlBloqueFirmasHibrido`, L6616–6685) valida si la URL existe para renderizar la imagen o, en su defecto, reserva un despeje simétrico de **70px de alto** con línea de firma física para el Acta de Conformidad.

---

## 5. PLAN DE ACCIÓN Y HOJA DE RUTA SUGERIDA

Para asegurar el éxito operativo del despliegue del 15 de septiembre de 2026:

1. **FASE 1 — Desbloqueo del Panel Admin (Corrección de DISP-01):**
   Mapear `computoEstado` y `estacionesMantenimiento` en `TIENDAS_DATA` de `Control Coolbox Admin/index.html` para habilitar la visualización del mantenimiento a backup.
2. **FASE 2 — Robustecimiento del Backend (Corrección de DISP-03):**
   Incorporar `LockService` (30 s) y sustituir el bucle de `appendRow` por inserción por lotes con `setValues()` en `DOCUMENTOS/Codigo.gs`.
3. **FASE 3 — Armonización Fotográfica (Corrección de DISP-02):**
   Ajustar los títulos visibles de los Slots 4, 5, 6, 7 y 8 en `index.html` para que coincidan unívocamente con el Anexo Fotográfico de la Ficha Técnica.
4. **FASE 4 — Limpieza de Guardarraíles (Corrección de DISP-07):**
   Limpiar los 77 operadores `&&` residuales en los archivos del proyecto conforme a la regla de estilo institucional.

---
*Fin del Informe Oficial de Auditoría Cruzada 360° — Control Coolbox 2026.*
