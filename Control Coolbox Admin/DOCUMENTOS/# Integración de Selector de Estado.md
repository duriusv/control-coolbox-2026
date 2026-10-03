# Integración de Selector de Estado de Sede (#editEstadoSede) en Admin Panel

Implementación de la Directiva T-C-R-V para incorporar de forma limpia, robusta y reactiva el selector de estado operativo de la sede (`#editEstadoSede`) dentro del módulo de edición de reportes en `Control Coolbox Admin/index.html`. Asegura el envío de `estadoSede` en el payload hacia `actualizarReporteAdmin` (para impacto en Columna G de `DB_TIENDAS` en `Codigo.gs`) y el refresco inmediato en memoria de los KPIs y badges del Dashboard sin recargar la página (`F5`).

## User Review Required

> [!IMPORTANT]
> - **Valores canónicos permitidos**: `#editEstadoSede` contará exclusivamente con tres opciones: `REALIZADO`, `OBSERVADO / PARCIAL` y `PENDIENTE`.
> - **Mapeo interno y compatibilidad**: Se implementa mapeo bidireccional armónico entre `estadoSede` (`REALIZADO` / `OBSERVADO / PARCIAL` / `PENDIENTE`) y el campo interno `estado` (`CONFORME` / `OBSERVADO` / `PENDIENTE`) para mantener 100% de compatibilidad operativa con los KPIs y filtros del Dashboard.
> - **Blindajes respetados**:
>   1. Se preservan estrictamente intactas las constantes base64 de logotipos (`LOGO_JSERVICE_BASE64` y `LOGO_COOLBOX_BASE64`).
>   2. Se mantiene inmutable el bloqueo del Técnico Titular (`selectTecnicoTitular` con `disabled` y distintivo `🔒 Firmante Original (Inmutable)`).
>   3. No se modifican archivos fuera del alcance (`Codigo.gs` e `index.html` de raíz quedan intactos).

## Proposed Changes

### Panel de Control Administrativo (`Control Coolbox Admin/index.html`)

#### [MODIFY] [index.html](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html)

1. **Generación del Selector en el Formulario (`_edicionGenerarFormulario`)**:
   - Incorporar `#editEstadoSede` como 4to campo destacado dentro de la tarjeta de cuadrilla y estado (`cardCuadrilla`), con borde azul institucional (`#2563EB`) y fondo distintivo.
   - Definir exactamente las 3 opciones requeridas:
     ```html
     <select id="editEstadoSede" class="informe-select" data-campo="estadoSede" ...>
       <option value="REALIZADO">REALIZADO</option>
       <option value="OBSERVADO / PARCIAL">OBSERVADO / PARCIAL</option>
       <option value="PENDIENTE">PENDIENTE</option>
     </select>
     ```
   - Precargar el atributo `selected` de acuerdo al estado actual de la tienda (`tienda.estadoSede || tienda.estadoAtencion || tienda.estado`).
   - Sincronizar reactivamente mediante eventos `onchange` entre `#editEstadoSede` y `#edit-select-estado` (`cardGeneral`).

2. **Carga Programática de Datos (`cargarDatosEdicion` y `resetearFormularioEdicion`)**:
   - En `cargarDatosEdicion`: poblar dinámicamente `#editEstadoSede` normalizando cualquier variante histórica (`CONFORME` -> `REALIZADO`, `OBSERVADO`/`PARCIAL` -> `OBSERVADO / PARCIAL`, `PENDIENTE` -> `PENDIENTE`).
   - En `resetearFormularioEdicion`: reiniciar `#editEstadoSede.value = "PENDIENTE"`.

3. **Captura y Payload de Envío (`guardarCorreccionesEdicion`)**:
   - Capturar el valor seleccionado en `#editEstadoSede`.
   - Calcular el valor canónico interno (`CONFORME`, `OBSERVADO`, `PENDIENTE`).
   - Asignar a la tienda en memoria:
     ```javascript
     tienda.estadoSede = valEstadoSede;
     tienda.estadoAtencion = valEstadoSede;
     tienda.ESTADO_ATENCION = valEstadoSede;
     tienda.estado = valEstadoInterno;
     ```
   - Incluir explícitamente en el objeto `payloadBackend` tanto en raíz como en `datos`:
     ```javascript
     estadoSede: valEstadoSede,
     estadoAtencion: valEstadoSede,
     estado: valEstadoInterno
     ```

4. **Propagación en Memoria y Refresco en Caliente (`aplicarActualizacionEnMemoria`)**:
   - Propagar `estadoSede`, `estadoAtencion`, `ESTADO_ATENCION` y `estado` a `TIENDAS_DATA`, `window.tiendas`, `window.atenciones`, y `tiendasFiltradas`.
   - Llamar inmediatamente a `actualizarMetricasDashboard()` y `renderizarTabla()`.

5. **Adaptación Tolerante de Métricas y Filtros (`actualizarMetricasDashboard`, `renderizarTabla`, `filtrarTiendas`, `abrirModalInspeccion`)**:
   - En `actualizarMetricasDashboard`: considerar `t.estado === "CONFORME" || t.estado === "REALIZADO" || t.estadoSede === "REALIZADO"` para Realizados; y `t.estado === "OBSERVADO" || t.estado === "PARCIAL" || t.estado === "OBSERVADO / PARCIAL" || t.estadoSede === "OBSERVADO / PARCIAL"` para Parciales.
   - En `renderizarTabla`: renderizar el badge de estado conforme/observado/pendiente reconociendo las opciones de `estadoSede`.
   - En `filtrarTiendas`: tolerar los valores en el filtro combinado.
   - En `abrirModalInspeccion`: reflejar el estado en `#modalEstadoBadge`.

---

## Verification Plan

### Automated Tests
Ejecutar scripts Node.js desde el workspace para validar:
1. **Sintaxis JavaScript**: Verificar que todos los bloques `<script>` en `Control Coolbox Admin/index.html` compilen sin errores de sintaxis (`new vm.Script(...)`).
2. **Estructura del Selector**: Validar que `#editEstadoSede` contenga exactamente las 3 opciones requeridas (`REALIZADO`, `OBSERVADO / PARCIAL`, `PENDIENTE`).
3. **Payload Contract**: Validar que `payloadBackend` y `payloadBackend.datos` envíen `estadoSede`, `estadoAtencion`, y `estado`.
4. **Reactividad de KPIs**: Simular el cambio de estado de una tienda de `PENDIENTE` a `REALIZADO` y a `OBSERVADO / PARCIAL` en `TIENDAS_DATA` y verificar que las métricas de `actualizarMetricasDashboard()` calculen y actualicen los valores correctos en el DOM.
5. **Preservación de Inmutables**: Comprobar que `LOGO_JSERVICE_BASE64`, `LOGO_COOLBOX_BASE64` y el candado `selectTecnicoTitular` con `disabled` permanezcan 100% intactos.

### Manual Verification
- Cargar tiendas en la vista de edición (ej. B11 u otra tienda).
- Verificar visualmente la presencia de `#editEstadoSede` precargado con su estado actual.
- Cambiar el estado a `OBSERVADO / PARCIAL` y guardar, confirmando que la tabla y los KPIs del Dashboard cambien inmediatamente sin refrescar con F5.
