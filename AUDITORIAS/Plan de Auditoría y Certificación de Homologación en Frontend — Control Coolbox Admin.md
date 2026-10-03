# Plan de Auditoría y Certificación de Homologación en Frontend — Control Coolbox Admin

## 1. Goal Description (Objetivo General)
Auditar en profundidad el archivo [index.html](file:///C:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html) ubicado exclusivamente en `Control Coolbox Admin/` conforme a la **Directiva T-C-R-V**, `SPEC.md` y `SKILL.md`.  
El objetivo es garantizar la homologación absoluta del protocolo de las **7 tareas de mantenimiento preventivo de estaciones de cómputo** con el contrato canónico de datos de la **Columna K** (`COMPUTO_ESTADO`), regulado por `Codigo.gs` v3.7.

### Contrato Canónico de Datos — Columna K:
```json
[
  {
    "estacion": "Estación 1",
    "numeroEstacion": 1,
    "ubicacion": "Caja 01",
    "esAdicionalEnCampo": false,
    "estado": "Operativo 100%",
    "limpiezaAIO": true,
    "cambioPastaTermica": true,
    "limpiezaTicketera": true,
    "limpiezaImpresora": true,
    "limpiezaLector": true,
    "limpiezaGaveta": true,
    "ordenCables": true,
    "observaciones": ""
  }
]
```

---

## 2. Diagnóstico Técnico de Auditoría

A continuación se certifica el estado actual del código en cada uno de los tres componentes auditados:

```
+---------------------------------------------------------------------------------------------------------+
|                                    ESTADO DE AUDITORÍA EN FRONTEND                                      |
+---------------------------------------------------------------------------------------------------------+
| Componente                          | Estado Actual | Hallazgos Críticos                                |
+-------------------------------------+---------------+---------------------------------------------------+
| 1. Modal Mantenimiento              | PARCIAL       | - Usa .pill-pending (#FFFBEB) en lugar del token  |
|    (#modalMantenimiento)            |               |   neutro canónico .badge-status-pendiente         |
|                                     |               | - Texto con prefijo "⏳ PENDIENTE" / "✓ CONFORME"|
|                                     |               | - Dependencia residual de análisis semántico      |
+-------------------------------------+---------------+---------------------------------------------------+
| 2. Modal Inspección                 | DISCREPANTE   | - En estado PENDIENTE: renderiza solo 3 tareas    |
|    (#modalInspeccion)               |               |   hardcodeadas estáticas (faltan 4 tareas)        |
|                                     |               | - En estado EJECUTADO: lista fija hardcodeada sin |
|                                     |               |   iterador dinámico sobre las 7 claves            |
|                                     |               | - Badges con TitleCase ("✓ Conforme")             |
|                                     |               | - Uso de motor semántico ("falla", "inop", etc.)  |
+-------------------------------------+---------------+---------------------------------------------------+
| 3. Módulo de Edición de Reporte     | HOMOLOGADO    | - Checkboxes mapeados a Boolean(...)              |
|    (#view-edicion-reporte)          | CON MEJORA    | - Sincronización DOM y payload POST listos        |
|                                     | QUIRÚRGICA    | - Oportunidad: blindar listaCajas para tipado     |
|                                     |               |   estricto de booleans antes de dispatch          |
+---------------------------------------------------------------------------------------------------------+
```

### Detalle de Hallazgos:

#### a) Modal de Mantenimiento (`#modalMantenimiento` — líneas 9760 a 9915)
1. **Badges no estandarizados:** Las 7 tareas consumen `pillOk` (`<span class="check-status-pill pill-ok">✓ CONFORME</span>`) y `pillPend` (`<span class="check-status-pill pill-pending">⏳ PENDIENTE</span>`). La clase `.pill-pending` (CSS línea 1737) aplica fondo ámbar `#FFFBEB` y texto `#B45309`, en lugar del token canónico gris neutro `#F1F5F9` / `#475569` con borde `#CBD5E1` (`.badge-status-pendiente`).
2. **Motor semántico residual:** En la línea 9859 se evalúa:
   `rawEst.includes("OBSERV") || rawEst.includes("INOP") || rawEst.includes("FALLA") || rawEst.includes("CRITIC")`
   La Directiva T-C-R-V prohíbe el motor semántico de texto libre: el estado de la estación debe basarse puramente en si todas las 7 tareas booleanas son `true`.

#### b) Modal del Dashboard (`#modalInspeccion` — líneas 11908 a 12165)
1. **Tareas incompletas y hardcodeadas en estado PENDIENTE:** Cuando una tienda está pendiente (líneas 11983-11995), el modal inyecta solo 3 ítems fijos:
   - Monitor / Pantalla POS
   - Mantenimiento integral de Ticketera
   - Lector de Código de Barras
   Omitiendo por completo las tareas de *Cambio de Pasta Térmica*, *Impresora de Reportes*, *Gaveta de Dinero* y *Orden de Cables*.
2. **Ausencia de iterador dinámico:** En estado ejecutado (líneas 12069-12096), las tareas están insertadas como bloques HTML estáticos en vez de iterar dinámicamente sobre la lista de las 7 claves canónicas de la estación.
3. **Violación de Mayúsculas Forzadas:** En las líneas 12012, 12015 y 12057 se generan etiquetas en TitleCase (`✓ Conforme`, `⚠️ Observado`), contraviniendo la regla de mayúsculas estrictas de `SKILL.md`.
4. **Presencia de motor semántico:** En las líneas 11934 y 12049 se verifica:
   `tieneFallaReal = estCaja.includes("inoperativo") || estCaja.includes("falla") || estCaja.includes("dañad")`
   violando la Regla 4 de cero análisis semántico.

#### c) Módulo de Edición de Reporte (`#view-edicion-reporte` — líneas 15535, 16387, 16425, 16478, 17585, 18070)
1. **Checkboxes correctamente implementados:** La matriz `PROTOCOLO_7_CHECKBOXES` contempla las 7 claves exactas (`limpiezaAIO`, `cambioPastaTermica`, `limpiezaTicketera`, `limpiezaImpresora`, `limpiezaLector`, `limpiezaGaveta`, `ordenCables`).
2. **Enlace bidireccional verificado:** `cargarDatosEdicion` vincula explícitamente `.checked = Boolean(est[campo])` (líneas 15555-15561), y `sincronizarEstacionesEdicionDesdeDom` lee de vuelta los 7 booleanos.
3. **Despacho POST hacia `actualizarReporteAdmin`:** `guardarCorreccionesEdicion` envía `payloadBackend` vía `POST` (líneas 18075 y 18190) incluyendo `estacionesMantenimiento: listaCajas` y `computoEstado: JSON.stringify(listaCajas)`.
4. **Ajuste quirúrgico recomendado:** En las líneas 17696-17699, una sobreescritura residual con `togglePos` puede pisar el estado seleccionado de la caja. Adicionalmente, se blindará `listaCajas` para forzar `Boolean(...)` en cada una de las 7 propiedades antes de emitir el payload.

---

## 3. User Review Required (Decisiones y Reglas Inmutables)

> [!IMPORTANT]
> **REGLAS INMUTABLES APLICADAS:**
> 1. **Aislamiento de directorio:** Todas las intervenciones ocurren EXCLUSIVAMENTE en `Control Coolbox Admin/index.html`. El `index.html` de la raíz permanece 100% intacto.
> 2. **Preservación multimedia:** Las cadenas `LOGO_JSERVICE_BASE64` y `LOGO_COOLBOX_BASE64` (líneas 6581-7935) **NO SERÁN TOCADAS**, manteniendo su contenido íntegro.
> 3. **Tokens de color canónicos (SKILL.md):**
>    - Conforme: `#D1FAE5` fondo, `#065F46` texto, `#A7F3D0` borde (`.badge-status-conforme`).
>    - Pendiente: `#F1F5F9` fondo, `#475569` texto, `#CBD5E1` borde (`.badge-status-pendiente`).
>    - Observado: `#FEF3C7` fondo, `#92400E` texto, `#FDE68A` borde (`.badge-status-observado`).
> 4. **Cero motor semántico:** La evaluación de conformidad se efectúa única y exclusivamente con operadores booleanos (`Boolean(est[campo])`).

---

## 4. Proposed Changes (Propuesta Quirúrgica)

Se intervendrán únicamente 3 funciones JavaScript específicas dentro de [index.html](file:///C:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html), sin alterar estilos CSS, maquetación HTML ni variables de imágenes.

### Componente 1: Definición Canónica Unificada de las 7 Tareas
Declaración global compartida para garantizar que tanto `#modalMantenimiento` como `#modalInspeccion` utilicen la misma estructura y claves:

```javascript
const CONFIG_7_TAREAS_COMPUTO = [
  { key: 'limpiezaAIO', label: 'Monitor / Pantalla POS (All in One / PC)', icon: '🖥️' },
  { key: 'cambioPastaTermica', label: 'Cambio de Pasta Térmica (CPU / All in One)', icon: '🧴' },
  { key: 'limpiezaTicketera', label: 'Mantenimiento integral de Ticketera (soplado, rodillo, cabezal térmico y corte)', icon: '🧾' },
  { key: 'limpiezaImpresora', label: 'Impresora de Reportes / Facturas (Láser / Tinta)', icon: '🖨️' },
  { key: 'limpiezaLector', label: 'Lector de Código de Barras', icon: '📶' },
  { key: 'limpiezaGaveta', label: 'Gaveta de Dinero (Apertura y limpieza)', icon: '💵' },
  { key: 'ordenCables', label: 'Estabilizador / Conectividad y Orden de Cables', icon: '⚡' }
];
```

---

### Componente 2: Homologación en `abrirModalMantenimiento(codigo)` (Líneas ~9775 a ~9915)
* Sustituir las pastillas inline por las clases oficiales del sistema:
  - `true`: `<span class="badge-status badge-status-conforme">CONFORME</span>`
  - `false`: `<span class="badge-status badge-status-pendiente">PENDIENTE</span>`
* Evaluar las 7 tareas exclusivamente con valores booleanos:
  `const isOk = Boolean(est && est[tarea.key]);`
* Eliminar el motor semántico de detección de texto en `isCajaConforme`.

```javascript
// Reemplazo en abrirModalMantenimiento:
const badgeTareaConforme = '<span class="badge-status badge-status-conforme">CONFORME</span>';
const badgeTareaPendiente = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';

const tareasEstacionHtml = CONFIG_7_TAREAS_COMPUTO.map(t => {
  const isOk = esEjecutado && (est ? Boolean(est[t.key]) : evaluarEstadoPuntosDeVenta(tienda));
  return `
    <div class="check-item">
      <span class="check-item-name"><span>${t.icon}</span> ${t.label}</span>
      ${isOk ? badgeTareaConforme : badgeTareaPendiente}
    </div>
  `;
}).join('');

// Evaluación 100% booleana sin motor semántico:
const todasOk = CONFIG_7_TAREAS_COMPUTO.every(t => est ? Boolean(est[t.key]) : evaluarEstadoPuntosDeVenta(tienda));
const isCajaConforme = esEjecutado && todasOk;
```

---

### Componente 3: Homologación Dinámica en `renderizarResumenMantenimientoModal(tienda)` (Líneas ~11908 a ~12165)
* Eliminar el bloque estático de 3 tareas en locales pendientes.
* Iterar dinámicamente sobre `CONFIG_7_TAREAS_COMPUTO` para cada caja encontrada o nominal, tanto en estado ejecutado como pendiente.
* Forzar MAYÚSCULAS en los badges de cabecera (`✓ CONFORME`, `⚠️ OBSERVADO`, `⏳ PENDIENTE`).
* Desactivar cualquier análisis semántico de strings en `posOk` y `isThisCajaConforme`.

```javascript
// Iteración dinámica homologada para cajas en modalInspeccion:
const itemsTareasHtml = CONFIG_7_TAREAS_COMPUTO.map(t => {
  const isOk = !isPending && est && Boolean(est[t.key]);
  const badgeHtml = isOk
    ? '<span class="badge-status badge-status-conforme">CONFORME</span>'
    : '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
  return `
    <div class="check-item">
      <span class="check-item-name"><span>${t.icon}</span> ${t.label}:</span>
      ${badgeHtml}
    </div>
  `;
}).join('');

let badgeThisCaja;
if (isPending) {
  badgeThisCaja = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
} else {
  const todasOk = est && CONFIG_7_TAREAS_COMPUTO.every(t => Boolean(est[t.key]));
  badgeThisCaja = todasOk
    ? '<span class="badge-status badge-status-conforme">✓ CONFORME</span>'
    : '<span class="badge-status badge-status-observado">⚠️ OBSERVADO</span>';
}
```

---

### Componente 4: Blindaje de Tipado en `guardarCorreccionesEdicion(e)` (Líneas ~17690 y ~18070)
* En `guardarCorreccionesEdicion`:
  1. Ejecutar `sincronizarEstacionesEdicionDesdeDom()` inmediatamente antes de armar `listaCajas`.
  2. Mapear cada elemento de `listaCajas` para forzar que los 7 campos sean rigurosamente booleanos (`Boolean(...)`), preservando `estacion`, `numeroEstacion`, `ubicacion`, `esAdicionalEnCampo`, `estado` y `observaciones`:
  ```javascript
  var listaCajasMapeada = listaCajas.map(function(est, idx) {
    var num = est.numeroEstacion || (idx + 1);
    return {
      estacion: est.estacion || ("Estación " + num),
      numeroEstacion: num,
      ubicacion: est.ubicacion || ("Caja 0" + num),
      esAdicionalEnCampo: Boolean(est.esAdicionalEnCampo),
      estado: est.estado || "Operativo 100%",
      limpiezaAIO: Boolean(est.limpiezaAIO),
      cambioPastaTermica: Boolean(est.cambioPastaTermica),
      limpiezaTicketera: Boolean(est.limpiezaTicketera),
      limpiezaImpresora: Boolean(est.limpiezaImpresora),
      limpiezaLector: Boolean(est.limpiezaLector),
      limpiezaGaveta: Boolean(est.limpiezaGaveta),
      ordenCables: Boolean(est.ordenCables),
      observaciones: String(est.observaciones || "").trim()
    };
  });
  ```
  3. Despachar `listaCajasMapeada` en `estacionesMantenimiento` y serializado en `computoEstado` dentro de `payloadBackend` hacia `actualizarReporteAdmin`.

---

## 5. Verification Plan (Plan de Verificación y Certificación)

### Pruebas Automatizadas (Node.js Script):
Se ejecutará un script en el scratchpad de Node.js sobre [index.html](file:///C:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html) para certificar:
1. **Preservación Base64:** Verificar que las líneas de `LOGO_JSERVICE_BASE64` y `LOGO_COOLBOX_BASE64` mantengan la misma longitud y hash SHA-256 exacto.
2. **Cero Motores Semánticos en Protocolo de Estaciones:** Verificar que no existan llamadas a `.includes("falla")`, `.includes("inoperativo")` o `.includes("dañad")` dentro de las funciones de evaluación de las 7 tareas.
3. **Existencia y Coherencia de las 7 Claves:** Validar que `CONFIG_7_TAREAS_COMPUTO` y `PROTOCOLO_7_CHECKBOXES` contengan exactamente las 7 claves del contrato de Columna K.
4. **Verificación Sintáctica:** Validar que el archivo parsea sin errores de sintaxis JavaScript.

### Verificación Manual:
1. Abrir `Control Coolbox Admin/index.html` en el navegador.
2. Inspeccionar una tienda ejecutada en `#modalMantenimiento`: verificar que cada una de las 7 tareas tenga su badge verde `CONFORME` o gris `PENDIENTE`.
3. Inspeccionar la misma tienda en `#modalInspeccion`: verificar que se listen las 7 tareas dinámicas sin texto recortado ni omitido.
4. Inspeccionar una tienda pendiente en `#modalInspeccion`: verificar que liste las 7 tareas en gris `PENDIENTE`.
5. Ir a `Edición de Reportes`, seleccionar una tienda: verificar que los 7 checkboxes reflejen el estado de Columna K. Al modificar checks y guardar, verificar en la consola de red (o log de depuración) que el payload despachado contenga los 7 booleanos.
