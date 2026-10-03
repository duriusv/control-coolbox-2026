# Implementation Plan — Corrección de Discrepancia en Estado Pendiente de `#modalMantenimiento`

## 1. Goal Description (Objetivo General)
Corregir la discrepancia lógica en la función `abrirModalMantenimiento(codigo)` de [index.html](file:///C:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html) (ubicado en `Control Coolbox Admin/`), de modo que en tiendas pendientes de intervención (como **B13 CHINCHA**):
1. El badge superior `#modalMntEstadoBadge` se muestre como `⏳ PENDIENTE` con la clase `.badge-status-pendiente`.
2. El bloque "Gabinete de Comunicaciones" se rotule como `POR INTERVENIR` (o `PENDIENTE`) y sus 3 tareas figuren en gris neutro `PENDIENTE` (erradicando la falsa alarma de "Extractores Inoperativo/Observado").
3. El encabezado de cada Caja POS se rotule estrictamente como `PENDIENTE` (`.badge-status-pendiente`), eliminando cualquier rotulación errónea como `⚠️ OBSERVADO`.
4. Las 7 tareas individuales de la caja se mantengan en `PENDIENTE` (`.badge-status-pendiente`).
5. En tiendas ejecutadas (como **B11 LIMA**), se mantenga intacto el comportamiento 100% verde `CONFORME`.

---

## 2. Causa Raíz Identificada

En la línea 9731 de `index.html`:
```javascript
const esEjecutado = Boolean(
  (tienda.fechaEjecucion && tienda.fechaEjecucion !== "Por Ejecutar" && tienda.fechaEjecucion !== "-") ||
  tienda.urlFotoAntes || tienda.urlFotoGabineteAntes || tienda.tecnico ||
  (atencion && (atencion.fechaHora || atencion.tecnico || atencion.urlFotoRegistro1)) ||
  tienda.estado === "CONFORME" || tienda.estado === "REALIZADO" || tienda.estado === "OBSERVADO"
);
```
* **El fallo:** Toda tienda del catálogo inicial (`construirTiendasDesdeCatalogoBase`) posee la propiedad `tecnico: "Por Asignar"`. Al evaluar `tienda.tecnico`, una cadena no vacía resulta siempre **TRUTHY**. Por tanto, para una tienda como B13 CHINCHA, `esEjecutado` se evaluaba erróneamente como `true`.
* **La cascada de errores:**
  1. Al ser `esEjecutado = true` pero no tener atenciones registradas, `evalGab.conforme` resultaba `false`, marcando `esObservado = true` y tiñendo el badge superior en amarillo `⚠️ MANTENIMIENTO OBSERVADO`.
  2. La función `renderizarFilaVentilacionModal("pendiente")` retornaba `INOPERATIVO / OBSERVADO`.
  3. Para la Caja 1, al no haber tareas registradas, `isCajaConforme` resultaba `false` y, al ser `esEjecutado = true`, caía en la rama `else` asignando `badgeBox = badgeRoundedObs` (`⚠️ OBSERVADO`).

---

## 3. User Review Required (Decisiones y Reglas Inmutables)

> [!IMPORTANT]
> **REGLAS INMUTABLES Y CONTRATOS:**
> 1. **Preservación Multimedia Absoluta:** Las cadenas Base64 `LOGO_JSERVICE_BASE64` y `LOGO_COOLBOX_BASE64` (líneas 6581-7935) no serán modificadas, truncadas ni reemplazadas.
> 2. **Aislamiento Estricto:** No se toca ningún archivo fuera de `Control Coolbox Admin/`. El `index.html` de la raíz se mantiene intacto.
> 3. **Lógica de Estados Ternaria Rigurosa:**
>    - Si `!esEjecutado`:
>      - Modal Badge: `⏳ PENDIENTE` (`.badge-status-pendiente`)
>      - Gabinete Badge: `POR INTERVENIR` (`.badge-status-pendiente`)
>      - Tareas Gabinete (3): `PENDIENTE` (`.badge-status-pendiente`)
>      - Caja POS Badge: `PENDIENTE` (`.badge-status-pendiente`)
>      - Tareas Caja POS (7): `PENDIENTE` (`.badge-status-pendiente`)
>      - Backup: `NO INTERVENIDO` (`.badge-status-neutro`)
>    - Si `esEjecutado`:
>      - Si todas las tareas son conformes: `CONFORME` (`.badge-status-conforme`)
>      - Si alguna tarea no es conforme: `OBSERVADO` (`.badge-status-observado`)

---

## 4. Proposed Changes (Líneas Exactas a Modificar)

En [index.html](file:///C:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html), dentro de la función `abrirModalMantenimiento(codigo)` (líneas ~9725 a ~9950):

### Modificación 1: Blindaje Canónico de `esEjecutado` y `esPendiente`
Líneas ~9731-9742:
```javascript
      const rawEst = String(tienda.estado || "").toUpperCase().trim();
      const rawSede = String(tienda.estadoSede || tienda.estadoAtencion || "").toUpperCase().trim();
      const tieneFotos = Boolean(tienda.urlFotoAntes || tienda.urlFotoGabineteAntes || tienda.fotoAntes || (atencion && (atencion.urlFotoRegistro1 || atencion.urlFotoAntes || atencion.fotoAntes)));
      const tieneAtencionValida = Boolean(atencion && (atencion.fechaHora || atencion.urlFotoRegistro1 || (atencion.tecnico && atencion.tecnico !== "Por Asignar")));
      const tieneFechaValida = Boolean(tienda.fechaEjecucion && tienda.fechaEjecucion !== "Por Ejecutar" && tienda.fechaEjecucion !== "-" && tienda.fechaEjecucion !== "—");

      const esPendiente = (rawEst === "PENDIENTE" || rawSede === "PENDIENTE" || (!rawEst && !rawSede)) && !tieneFotos && !tieneAtencionValida;

      const esEjecutado = !esPendiente && Boolean(
        tieneFechaValida ||
        tieneFotos ||
        tieneAtencionValida ||
        rawEst === "CONFORME" || rawEst === "REALIZADO" || rawEst === "OBSERVADO" ||
        rawSede.includes("CONFORME") || rawSede.includes("REALIZADO") || rawSede.includes("OBSERV")
      );

      const evalGab = evaluarEstadoGabinete(atencion, tienda);
      const esObservado = esEjecutado && (rawEst.includes("OBSERV") || rawSede.includes("OBSERV") || !evalGab.conforme);
```

### Modificación 2: Estandarización de `#modalMntEstadoBadge`
Líneas ~9743-9770:
```javascript
      const mntBadge = document.getElementById("modalMntEstadoBadge");
      if (mntBadge) {
        if (!esEjecutado) {
          mntBadge.textContent = "⏳ PENDIENTE";
          mntBadge.className = "status-badge status-pendiente badge-status-pendiente";
          mntBadge.style.borderRadius = "4px";
          mntBadge.style.background = "#F1F5F9";
          mntBadge.style.color = "#475569";
          mntBadge.style.border = "1px solid #CBD5E1";
        } else if (esObservado) {
          mntBadge.textContent = "⚠️ MANTENIMIENTO OBSERVADO";
          mntBadge.className = "status-badge status-observado badge-status-observado";
          mntBadge.style.borderRadius = "4px";
          mntBadge.style.background = "#FEF3C7";
          mntBadge.style.color = "#92400E";
          mntBadge.style.border = "1px solid #FDE68A";
        } else {
          mntBadge.textContent = "✓ MANTENIMIENTO CONFORME";
          mntBadge.className = "status-badge status-conforme badge-status-conforme";
          mntBadge.style.borderRadius = "4px";
          mntBadge.style.background = "#D1FAE5";
          mntBadge.style.color = "#065F46";
          mntBadge.style.border = "1px solid #A7F3D0";
        }
      }
```

### Modificación 3: Gabinete de Comunicaciones en Estado Pendiente
Líneas ~9802-9832:
```javascript
      // 1. Gabinete de Comunicaciones
      let badgeGab;
      let pillLimpGab;
      let pillPatch;
      let pillExtractor;

      if (!esEjecutado) {
        badgeGab = '<span class="badge-status badge-status-pendiente">POR INTERVENIR</span>';
        pillLimpGab = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
        pillPatch = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
        pillExtractor = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
      } else {
        const rawVent = String((atencion && (atencion.gabineteVentiladores || atencion.GABINETE_VENTILADORES)) || tienda.gabineteVentiladores || "").toLowerCase();
        badgeGab = evalGab.conforme
          ? '<span class="badge-status badge-status-conforme">✓ CONFORME</span>'
          : '<span class="badge-status badge-status-observado">⚠️ OBSERVADO</span>';
        pillLimpGab = '<span class="badge-status badge-status-conforme">CONFORME</span>';
        pillPatch = '<span class="badge-status badge-status-conforme">CONFORME</span>';
        pillExtractor = renderizarFilaVentilacionModal(rawVent || (evalGab.esPasivo ? 'NO TIENE' : 'OPERATIVO'));
      }
```

### Modificación 4: Cajas POS y Tareas (Prohibición estricta de `OBSERVADO` en pendientes)
Líneas ~9860-9885:
```javascript
        let badgeBox;
        if (!esEjecutado) {
          badgeBox = '<span class="badge-status badge-status-pendiente">PENDIENTE</span>';
        } else {
          const algunaTareaFalse = est ? CONFIG_7_TAREAS_COMPUTO.some(t => est[t.key] === false) : false;
          const todasTareasOk = CONFIG_7_TAREAS_COMPUTO.every(t => checkMap[t.key]);
          const isCajaConforme = !algunaTareaFalse && todasTareasOk;
          badgeBox = isCajaConforme
            ? '<span class="badge-status badge-status-conforme">✓ CONFORME</span>'
            : '<span class="badge-status badge-status-observado">⚠️ OBSERVADO</span>';
        }
```

### Modificación 5: Backup en Almacén en Estado Pendiente
Línea ~9933:
```javascript
      if (tieneMantenimientoBackup && esEjecutado) {
        bloquesHtml.push(`
          <div class="checklist-box" style="border-left: 3px solid #10B981; border-radius: 8px;">
            <div class="checklist-box-title">
              <span>📦 Equipos de Backup (Almacén)</span>
              <span class="badge-status badge-status-conforme">✓ CONFORME</span>
            </div>
            <div class="check-list-items">
              <div class="check-item">
                <span class="check-item-name"><span>💨</span> Soplado y Limpieza de Reserva</span>
                ${bkpSoplado ? badgeTareaConforme : badgeTareaPendiente}
              </div>
              <div class="check-item">
                <span class="check-item-name"><span>✨</span> Limpieza Superficial de Chasis</span>
                ${bkpLimpieza ? badgeTareaConforme : badgeTareaPendiente}
              </div>
              <div class="check-item">
                <span class="check-item-name"><span>⚡</span> Verificación de Encendido</span>
                ${bkpEncendido ? badgeTareaConforme : badgeTareaPendiente}
              </div>
            </div>
          </div>
        `);
      } else {
        bloquesHtml.push(`
          <div class="checklist-box" style="border-left: 3px solid #94A3B8; background: #F8FAFC; border-radius: 8px;">
            <div class="checklist-box-title">
              <span>📦 Equipos de Backup (Almacén)</span>
              ${badgeRoundedNoInt}
            </div>
            <div style="padding: 10px 12px; font-size: 0.78rem; color: #64748B; line-height: 1.4;">
              Equipos de Backup: No intervenido / Sin contingencia en local
            </div>
          </div>
        `);
      }
```

---

## 5. Verification Plan (Plan de Verificación)

### Pruebas Automatizadas:
Se ejecutará un script en Node.js que simule la carga de dos tiendas reales del sistema:
1. **Tienda B11 (LIMA — Ejecutada y Conforme):**
   - Validar que `esEjecutado === true`.
   - Validar que `#modalMntEstadoBadge` sea `✓ MANTENIMIENTO CONFORME` (`.badge-status-conforme`).
   - Validar que Gabinete de Comunicaciones sea `✓ CONFORME`.
   - Validar que Caja 1 sea `✓ CONFORME`.
   - Validar que las 7 tareas sean `CONFORME`.
2. **Tienda B13 (CHINCHA — Pendiente sin atención):**
   - Validar que `esEjecutado === false`.
   - Validar que `#modalMntEstadoBadge` sea `⏳ PENDIENTE` con clase canónica `.badge-status-pendiente`.
   - Validar que Gabinete sea `POR INTERVENIR` (`.badge-status-pendiente`).
   - Validar que las 3 tareas de gabinete sean `PENDIENTE` (cero mención a "INOPERATIVO / OBSERVADO").
   - Validar que Caja 1 sea estrictamente `PENDIENTE` (`.badge-status-pendiente`) y no contenga `OBSERVADO`.
   - Validar que las 7 tareas individuales de Caja 1 sean `PENDIENTE` (`.badge-status-pendiente`).
3. **Preservación de Logos:**
   - Validar que los hashes SHA-256 de `LOGO_JSERVICE_BASE64` y `LOGO_COOLBOX_BASE64` permanezcan idénticos.
4. **Verificación de Sintaxis:**
   - Validar que todos los bloques `<script>` de `index.html` compilen sin errores mediante `vm.Script`.
