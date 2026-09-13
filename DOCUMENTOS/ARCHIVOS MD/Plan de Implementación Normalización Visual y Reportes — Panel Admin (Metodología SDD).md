# Plan de Implementación: Normalización Visual y Reportes — Panel Admin (Metodología SDD)

Ajustes integrales de presentación, consistencia de datos y generación de reportes en el panel de supervisión ([`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html)), garantizando el cumplimiento de los 7 criterios técnicos de la directiva y respetando la regla estricta de cero rupturas y cero operadores comerciales.

---

## 1. Alcance Exclusivo y Guardarraíles

> [!IMPORTANT]
> **Prohibición Estricta de Modificación a Backend y App de Campo:**
> - El archivo [`Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Codigo.gs) queda **ESTRICTAMENTE CONGELADO**.
> - El archivo [`index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/index.html) (App móvil de campo) queda **ESTRICTAMENTE CONGELADO**.
> - El único archivo a intervenir es: [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html).

> [!WARNING]
> **Regla de Oro de Cero Carácter Comercial Anglosajón (`&` y `&&`):**
> - Queda terminantemente prohibido el uso del carácter comercial o el operador doble `&&` en cualquier fragmento de código agregado o modificado.
> - Toda evaluación condicional múltiple se estructurará mediante sentencias `if` anidadas o guardas independientes.

---

## 2. Diagnóstico y Plan de Cambios por Componente

### A) Tarjetas KPI de Cabecera (Líneas 4626 a 4660)
- **Problema:** Al aplicar filtros de estado, clasificación o búsqueda, `kpiTotal` mostraba el conteo del subconjunto filtrado (`data.length`), alterando el universo de locales programados.
- **Solución:** Fijar de manera inmutable `elTotal.textContent = totalGeneral;` (donde `totalGeneral = TIENDAS_DATA.length || 140`) y `elTotalBadge.textContent = "100%";`, manteniendo `PROGRAMADOS` en 140 independientemente de los filtros activos.

### B) Matriz de Seguimiento - Columna 'GABINETE' (Líneas 4580 y 5027)
- **Problema:** Se comparaba rígidamente `tienda.gabineteEstado === "CONFORME"`. Valores como `"Conforme"`, `"Operativo"` o atenciones completadas sin texto exacto en mayúsculas mostraban erróneamente `⏳ Por Intervenir` en sedes como B11 o B25.
- **Solución:** Normalizar la comprobación verificando si contiene `CONFORME`, `OPERATIVO` o si la tienda tiene `estado === "CONFORME"`, sin operadores `&&`:
  ```javascript
  const gabUpper = String(tienda.gabineteEstado || "").toUpperCase().trim();
  let esGabOk = false;
  if (gabUpper.includes("CONFORME")) esGabOk = true;
  if (gabUpper.includes("OPERATIVO")) esGabOk = true;
  if (tienda.estado === "CONFORME") esGabOk = true;
  ```

### C) Desglose de Cuadrilla Técnica (Líneas 7700-7734, Modales y Reportes)
- **Problema:** Cadenas de técnicos compuestas (ej. `"DIEGO ALEJANDRO / JIMMY JOSÉ / EDMAR PAUL"`) se asignaban completas a `tecnicoLider`, dejando `tecnicoApoyo` vacío.
- **Solución:** 
  1. En el mapeo de `sincronizarConAppsScript`, dividir la cadena por `/`:
     - Primer técnico -> `tecnicoLider`.
     - Técnicos restantes -> `tecnicoApoyo` unidos por ` / ` (si no hay, `"Sin técnicos de apoyo"`).
  2. Reflejar este desglose en:
     - Modal de Detalle (`#modalTecnicoLider` y `#modalTecnicoApoyo`).
     - Modal de Mantenimiento (`#modalMntTecnicoLider` y `#modalMntTecnicoApoyo`).
     - Acta de Conformidad (`construirHtmlBloqueFirmasHibrido`).
     - Ficha Técnica Impresa (Hoja 1 y pie de firmas).

### D) Normalización de Fechas y Horas (Función Helper y Puntos de Vista)
- **Problema:** Cadenas en formato ISO crudo (`'2026-09-09T21:43:14.000Z'`) impactaban la lectura institucional.
- **Solución:** Implementar la función `formatearFechaInstitucional(fechaRaw)`:
  - Convierte marcas temporales ISO o parseables al formato institucional `DD/MM/YYYY, HH:mm hrs` (hora local).
  - Aplicar en el mapeo de `fechaEjecucion`, modales de inspección/mantenimiento, Ficha Técnica y exportaciones.

### E) Estado de Gabinete en Modal de Detalle (Líneas 5095 y 5953)
- **Problema:** La evaluación del bloque de Gabinete de Comunicaciones dependía de una igualdad rígida `tienda.gabineteEstado === "CONFORME"`.
- **Solución:** Evaluar si `gabineteLimpieza` es conforme u operativo, ventiladores operativos, PDU normal o estado general conforme, descartando estados si existen observaciones críticas explícitas. Emitir veredicto verde `✓ Conforme` en el modal.

### F) Alineación Simétrica de Periféricos POS (Líneas 1248-1268)
- **Problema:** Las insignias de estado de periféricos (`.check-status-pill`) no estaban forzadas simétricamente a la derecha en todos los contenedores.
- **Solución:** Ajustar el CSS en `.check-item` con `width: 100%; display: flex; justify-content: space-between; align-items: center;`, `.check-item-name` con `flex: 1;` y `.check-status-pill` con `margin-left: auto; text-align: right; white-space: nowrap;`.

### G) Firmas Digitales y 8 Fotos en Acta y Ficha Técnica (Líneas 6091-6258, 7700-7734)
- **Problema:** En el mapeo de `TIENDAS_DATA`, no se transferían `nombreEncargado`, `dniEncargado`, `firmaTecnico`, `firmaCliente` ni los 8 enlaces de fotos (`urlFotoAntes`, `urlFotoDespues`, etc.). La Hoja 2 de la Ficha Técnica mostraba siempre "Pendiente de captura".
- **Solución:**
  1. En `sincronizarConAppsScript`, mapear exhaustivamente todos los campos fotográficos y de firma desde la atención al objeto de tienda.
  2. En `construirHtmlBloqueFirmasHibrido`, mostrar el `NOMBRE_ENCARGADO` y `DNI_ENCARGADO` en la tercera columna ("Recepción y Conformidad").
  3. Renderizar las imágenes de firma de técnico y cliente si están disponibles.
  4. En `resolverFoto(posIndex, key)`, mapear directamente las claves reales (`urlFotoAntes`, `urlFotoDespues`, `urlFotoPos1`, `urlFotoPos2`, `urlFotoBackup`, `urlFotoPdu`, `urlFotoPanoramica`, `urlFotoActa`) con conversión de enlaces de Google Drive, eliminando las cajas de "Pendiente de captura" cuando existan imágenes.

---

## 3. Plan de Verificación

### Pruebas Automatizadas (Node.js Sandbox)
1. **Validación de Cero Carácter Comercial:**
   - Escaneo estático en [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html) para asegurar 0 caracteres comerciales y 0 operadores `&&` en los bloques modificados.
2. **Prueba de Invarianza de Backend y App de Campo:**
   - Verificar que [`Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Codigo.gs) y [`index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/index.html) permanezcan idénticos.
3. **Prueba Unitaria de Formateo de Fecha:**
   - Verificar que `'2026-09-09T21:43:14.000Z'` se transforme exactamente a `DD/MM/YYYY, HH:mm hrs`.
4. **Prueba de Desglose de Cuadrilla:**
   - Verificar que `"DIEGO ALEJANDRO / JIMMY JOSÉ / EDMAR PAUL"` asigne `tecnicoLider = "DIEGO ALEJANDRO"` y `tecnicoApoyo = "JIMMY JOSÉ / EDMAR PAUL"`.
5. **Prueba de Persistencia de KPI Programados:**
   - Simular dataset filtrado de 5 elementos y verificar que `#kpiTotal` se mantenga en 140 y `#kpiTotalBadge` en "100%".
6. **Prueba de Renderizado de Gabinete en Tiendas Conformes:**
   - Validar que tiendas con estado Conforme o gabinete operativo rendericen el badge verde `✓ Conforme`.
7. **Prueba de Hoja 2 de Ficha Técnica:**
   - Validar que con un objeto de tienda que contenga fotos, `resolverFoto` retorne las URLs para las 8 posiciones y no renderice "Pendiente de captura".
