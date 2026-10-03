# INFORME TÉCNICO FORENSE: INSPECCIÓN HISTÓRICA DE GIT (GENERACIÓN Y DESPACHO PDF)

**Workspace:** Proyecto Control Coolbox 2026  
**Objetivo de Inspección:** Archivo [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html) y [`Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Codigo.gs)  
**Metodología:** Solo Lectura Estricta (Zero Mutation) vía Git CLI  

---

## 1. Identificador de Commit, Tag y Estado del Historial

A través de la inspección forense del árbol de objetos de Git (`git log --all`, `git reflog`, `git fsck --lost-found` y `git bundle verify gits/v2.2-pre-auditoria.bundle`), se determinó la estructura genealógica del repositorio:

* **Commit Hash:** `7d28af6415d42773a845988c2888785c718baed1` (identificador abreviado: `7d28af6`)
* **Etiqueta Oficial (Tag):** `v2.2-pre-auditoria`
  - Objeto de Tag: `e45a9c0ec4f38d24ec80cbdcd60c64219dcaf7b6`
  - Tagger: `Coolbox Core Dev <dev@coolbox.pe>`
  - Mensaje de Anotación: *"Punto de restauracion previo a la auditoria 4x4 y prueba de fuego general"*
* **Mensaje del Commit Base:** `feat(core): version 2.2 homologada - catalogo de 11 activos, persistencia PATCH no destructiva y sincronizacion multi-cajas`
* **Árbol de Commits:** No existen ramas alternas, commits huérfanos ni stashes en el repositorio. Toda la trazabilidad histórica parte de este snapshot oficial.

---

## 2. Fragmento Íntegro de la Función de Despacho en la Versión Previa (`v2.2-pre-auditoria`)

En el snapshot `v2.2-pre-auditoria` (commit `7d28af6`), la función vinculada al botón `#btnConfirmarDespachoCorreo` en [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html#L8948-L9026) tenía el siguiente código íntegro:

```javascript
    async function confirmarDespachoCorreo() {
      const tienda = currentStoreSelected || (typeof obtenerTiendaSeleccionadaInforme === 'function' ? obtenerTiendaSeleccionadaInforme() : null);
      if (!tienda) {
        alert("❌ Por favor seleccione una sede para despachar su documentación.");
        return;
      }

      // 1. Captura fidedigna del correo destinatario y datos de sede
      const inputDestino = document.getElementById("inputCorreoDestinatario");
      let correoDestinatarioFinal = inputDestino ? inputDestino.value.trim() : "";
      if (!correoDestinatarioFinal) {
        correoDestinatarioFinal = "supervision.operaciones@coolbox.pe";
      }

      const nombreLimpio = extraerNombreLimpioTienda(tienda.nombre, tienda.codigo);
      const datosSedeActual = {
        codigo: tienda.codigo || "",
        nombre: nombreLimpio,
        ciudad: tienda.ciudad || "",
        direccion: tienda.direccion || "",
        estado: tienda.estado || "PENDIENTE"
      };

      // 2. Control de interfaz durante la petición
      const btnConfirmar = document.getElementById("btnConfirmarDespachoCorreo");
      const btnCancelar = document.getElementById("btnCancelarDespachoCorreo");
      const btnCerrar = document.getElementById("btnCerrarModalDespachoCorreo");

      if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = "<span>⏳</span> Generando PDFs y despachando...";
      }
      if (btnCancelar) {
        btnCancelar.disabled = true;
      }
      if (btnCerrar) {
        btnCerrar.disabled = true;
      }

      // 3. Estructura del cuerpo de la petición HTTP POST
      const payload = {
        accion: "enviarDocumentacionSede",
        datosTienda: datosSedeActual,
        correoDestino: correoDestinatarioFinal
      };

      try {
        const response = await fetch(API_BACKEND_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        let res = null;
        try {
          res = await response.json();
        } catch (parseErr) {
          res = { exito: false, mensaje: "Respuesta no estructurada del servidor" };
        }

        if (res) {
          if (res.exito === true || res.success === true) {
            restaurarBotonDespachoCorreo();
            cerrarModalDespachoCorreo();
            const msgExito = res.mensaje || res.message || "Documentación despachada exitosamente.";
            alert("✅ " + msgExito);
            return;
          }
        }

        restaurarBotonDespachoCorreo();
        const msgFallo = (res ? (res.mensaje || res.message) : null) || "Fallo en el procesamiento de despacho.";
        alert("❌ " + msgFallo);

      } catch (err) {
        restaurarBotonDespachoCorreo();
        const errDetalle = err ? (err.message || String(err)) : "Error de comunicación HTTP";
        alert("❌ " + errDetalle);
      }
    }
```

### Contraste con el Backend de la Versión Previa (`Codigo.gs` en `v2.2-pre-auditoria`)
En ese mismo snapshot histórico, la función receptora en Apps Script (`Codigo.gs`, línea 675) era:

```javascript
function enviarDocumentacionSede(datosTienda, correoDestino) {
  try {
    const codigo = datosTienda.codigo || "Sede";
    GmailApp.sendEmail(
      correoDestino, 
      "Documentación Técnica Oficial — Coolbox " + codigo,
      "Se adjunta la documentación técnica correspondiente a la sede " + codigo + " emitida por JSERVICE RV E.I.R.L."
    );
    return { exito: true, mensaje: "Documentación despachada exitosamente a: " + correoDestino };
  } catch (e) {
    return { exito: false, mensaje: "Error al enviar correo: " + e.toString() };
  }
}
```

---

## 3. Dictamen Forense y Análisis Comparativo 360°

### A. ¿Cómo se generaban los PDFs de alta fidelidad en `v2.2-pre-auditoria`?
En el snapshot `v2.2-pre-auditoria`, **no existía compilación de PDFs en segundo plano ni generación Base64 programática**. 

Los PDFs de muestra almacenados en el repositorio (`Control Coolbox Admin/DOCUMENTOS/Ficha_Tecnica_B11_LIMA_Coolbox_2026.pdf`) fueron generados a través de las funciones de **impresión nativa del navegador**:
1. **Funciones de Origen:** `generarFichaTecnicaTienda(tiendaParam)` e `imprimirActaConformidad()`.
2. **Inyección en DOM:** Inyectaban el HTML completo en el contenedor `<div id="printArea">`.
3. **Nombre Dinámico de Archivo:** Asignaban temporalmente el nombre del PDF a la pestaña:
   ```javascript
   const tituloOriginal = document.title;
   document.title = "Ficha_Tecnica_" + codigoSeguro + "_" + ciudadSegura + "_Coolbox_2026";
   ```
4. **Disparo Nativo:**
   ```javascript
   setTimeout(() => {
     window.print();
   }, 150);
   ```
5. **Generación Real del Archivo:** El usuario utilizaba el motor gráfico nativo de Chromium/Windows (Adobe PDF / Acrobat Distiller / Microsoft Print to PDF) para guardar el documento como PDF. Como la regla CSS aplicaba `@media print { #printArea { display: block !important; } }`, el motor de impresión nativo del navegador dibujaba el documento con gráficos vectoriales y texto real, **sin sufrir nunca el problema de lienzos en blanco**.

### B. Análisis Comparativo Estructurado

| Dimensión Técnica | Versión Previa (`v2.2-pre-auditoria` / Commit `7d28af6`) | Implementación Actual (Refactorizada con `html2pdf.js`) |
| :--- | :--- | :--- |
| **Librería Utilizada** | **Ninguna** (No incluía `html2pdf.js`, ni `jsPDF`). Se basaba en `window.print()`. | **`html2pdf.js`** (versión 0.10.1 con `html2canvas` 1.4.1 y `jspdf` 2.5.1). |
| **Flujo en Despacho de Correo** | Cambiaba el texto del botón a *"Generando PDFs..."*, pero **no generaba ningún archivo**; enviaba solo metadatos de texto a Apps Script. | Compila asíncronamente en memoria la Ficha Técnica y el Acta de Conformidad antes de disparar la petición HTTP POST. |
| **Elementos del DOM Seleccionados** | Para impresión: `document.getElementById("printArea")`.<br>Para correo: Solo leía `#inputCorreoDestinatario`. | Crea dinámicamente un contenedor temporal `container = document.createElement("div")` con `className = "temp-pdf-container"`. |
| **Contenedor Utilizado y Posicionamiento** | `#printArea` (oculto en pantalla vía CSS `#printArea { display: none; }`, visible en `@media print`). | Contenedor temporal insertado en `document.body` con:<br>`position: fixed; top: 0; left: 0; z-index: -10000; width: 800px; height: auto; background-color: #ffffff; display: block !important; visibility: visible !important;`. |
| **Extracción de Cadena Base64** | **Inexistente.** El payload enviado al backend no contenía la clave `adjuntos`. | Extraída mediante:<br>`await html2pdf().set(opt).from(container).outputPdf("datauristring")`. |
| **Validación de Integridad Documental** | Ninguna. | 1. Valida `container.innerHTML.length > 500`.<br>2. Valida `base64.length > 20000` (> 20 KB) antes de agregar a `adjuntos`. |
| **Despacho en Backend (`Codigo.gs`)** | `GmailApp.sendEmail(dest, subject, body)` sin adjuntos (correo de solo texto plano). | `GmailApp.sendEmail` con decodificación `Utilities.base64Decode` y adjuntos binarios Blob (`application/pdf`). |
| **Limpieza de Recursos (DOM)** | Restaura `document.title` en evento `afterprint`. | Destruye el contenedor temporal en bloque `finally`: `container.remove()`. |

---

## 4. Conclusiones y Diagnóstico de Ingeniería

1. **La versión histórica no tenía un compilador asíncrono Base64:** La percepción de que previamente el modal de correo generaba adjuntos PDF con contenido real responde a que los PDFs archivados en el workspace se obtuvieron mediante el botón de impresión manual (`window.print()`) que aprovechaba el motor del navegador. El botón de despacho por correo únicamente despachaba un mensaje de texto plano institucional sin adjuntos.
2. **Causa de los PDFs en blanco en intentos intermedios:** Cuando se implementó `html2pdf.js` para automatizar la captura, ubicar el contenedor en `left: -9999px` o bajo reglas CSS `#reporte-individual-print { display: none; }` dejó a `html2canvas` sin píxeles válidos que renderizar.
3. **Estabilidad de la solución actual:** La implementación actual une lo mejor de ambos mundos:
   - Reutiliza exactamente las mismas estructuras HTML de `construirHtmlFichaTecnica` y `construirHtmlActaConformidad` que alimentaban a `window.print()`.
   - Posiciona el contenedor en coordenadas reales del viewport (`top: 0, left: 0`) a 800px de ancho y fuerza la visibilidad de los nodos internos para `html2canvas`, logrando PDFs completos, vectoriales y con pesos superiores a 20 KB adjuntos directamente en el correo oficial.
