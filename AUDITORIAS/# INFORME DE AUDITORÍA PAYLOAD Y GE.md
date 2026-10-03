# INFORME DE AUDITORÍA: PAYLOAD Y GENERACIÓN PDF EN MODAL DE CORREO
**Ecosistema:** Sistema de Control de Mantenimiento Preventivo e Inventario Coolbox 2026  
**Módulo:** Dashboard Administrativo (`Control Coolbox Admin/index.html`)  
**Backend:** Google Apps Script (`Codigo.gs` v2.2+)  
**Modo:** Estricto SOLO LECTURA (Zero Mutation)  

---

## 1. Resumen del Diagnóstico

| Aspecto Auditado | Estado en Frontend (`Admin/index.html`) | Estado en Backend (`Codigo.gs`) | Diagnóstico / Impacto |
| :--- | :--- | :--- | :--- |
| **Botón de Acción** | `#btnConfirmarDespachoCorreo` (Línea 5343) | Enrutador `doPost` rama A | Vinculado a `confirmarDespachoCorreo()` |
| **Generación de PDFs** | **INEXISTENTE** (No hay librería ni proceso) | Espera strings en Base64 | La promesa de la UI *"Generando PDFs..."* no ejecuta código de compilación documental. |
| **Propiedad de Adjuntos** | **OMITIDA** (No se incluye en el payload) | Espera `payload.adjuntos` o `payload.archivos` | `adjuntos.length === 0`; el correo se despacha sin archivos adjuntos. |
| **Petición HTTP** | `fetch(API_BACKEND_URL, { method: "POST" })` | `doPost(e)` procesa `enviarDocumentacionSede` | Comunicación HTTP exitosa, pero payload incompleto de origen. |

---

## 2. Respuestas a los Puntos de Verificación de la Directiva

### 1. ¿Qué función JavaScript se ejecuta al hacer clic en "Confirmar y Despachar Correo"?
* **Elemento DOM:**
  ```html
  <!-- Línea 5343 de Control Coolbox Admin/index.html -->
  <button id="btnConfirmarDespachoCorreo" class="btn btn-primary" onclick="confirmarDespachoCorreo()" style="padding: 9px 20px; font-size: 0.84rem; background: var(--coolbox-red); border-color: var(--coolbox-red);">
    <span>📤</span> Confirmar y Despachar Correo
  </button>
  ```
* **Función Invocada:** `confirmarDespachoCorreo()`
* **Ubicación:** Definida en las líneas 8948 a 9026 de [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html#L8948-L9026).

---

### 2. ¿Cómo genera esa función los PDFs de la Ficha Técnica y del Acta (librería utilizada, Base64, Blob o URLs)?
* **DICTAMEN CRÍTICO: NO SE GENERA NINGÚN PDF.**
* **Análisis de Dependencias y Scripts:**
  - El archivo `Control Coolbox Admin/index.html` **no tiene importada ninguna librería de generación de PDF** en el cliente (como `html2pdf.js`, `jspdf`, `pdfmake`, etc.).
  - Los mecanismos de impresión existentes en el admin (`generarFichaTecnicaTienda` e `imprimirActaConformidad`) se basan exclusivamente en renderizar HTML plano dentro del contenedor `#printArea` y disparar el diálogo nativo del navegador mediante `window.print()`.
* **Comportamiento en `confirmarDespachoCorreo()`:**
  - En la línea 8978, la función actualiza el texto del botón a:
    ```javascript
    btnConfirmar.innerHTML = "<span>⏳</span> Generando PDFs y despachando...";
    ```
  - Sin embargo, **inmediatamente después salta al armado del objeto `payload` y a la llamada `fetch()`**, sin ejecutar ningún algoritmo de captura del DOM, sin convertir elementos a canvas, sin codificar Base64 ni crear objetos Blob.

---

### 3. ¿Cuál es el nombre exacto de la propiedad (key) donde el frontend coloca los archivos dentro del objeto JSON que envía al backend?
* **EL FRONTEND NO DEFINE NINGUNA PROPIEDAD PARA ARCHIVOS ADJUNTOS.**
* El objeto JSON enviado únicamente incluye 3 propiedades:
  ```json
  {
    "accion": "enviarDocumentacionSede",
    "datosTienda": {
      "codigo": "...",
      "nombre": "...",
      "ciudad": "...",
      "direccion": "...",
      "estado": "..."
    },
    "correoDestino": "..."
  }
  ```
* **Contraste con el Backend [`Codigo.gs`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Codigo.gs#L675-L691):**
  El backend espera obligatoriamente un array bajo las claves `adjuntos` o `archivos`, compuesto por objetos con la propiedad `base64`:
  ```javascript
  const adjuntos = [];
  const listaArchivos = payload.adjuntos || payload.archivos || [];

  if (Array.isArray(listaArchivos) && listaArchivos.length > 0) {
    listaArchivos.forEach(function(archivo, idx) {
      if (archivo && archivo.base64) {
        let base64Limpio = archivo.base64;
        if (base64Limpio.indexOf("base64,") !== -1) {
          base64Limpio = base64Limpio.split("base64,")[1];
        }
        const decodificado = Utilities.base64Decode(base64Limpio);
        const nombreDoc = archivo.nombre || ("Documento_" + (idx + 1) + ".pdf");
        const blobPdf = Utilities.newBlob(decodificado, "application/pdf", nombreDoc);
        adjuntos.push(blobPdf);
      }
    });
  }
  ```
  Al ser `listaArchivos` un array vacío, `adjuntos` queda vacío (`[]`), por lo que `GmailApp.sendEmail` despacha el correo solo con el `htmlBody` y sin archivos adjuntos.

---

### 4. Fragmento de Código Exacto (Construcción del Payload y Petición POST)

A continuación se muestra el fragmento íntegro de [`Control Coolbox Admin/index.html`](file:///c:/Users/HP/Desktop/Control%20Coolbox/Control%20Coolbox%20Admin/index.html#L8987-L9026):

```javascript
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
```

---

## 3. Conclusión Técnica
El síntoma reportado por supervisión (*"El correo llega con la plantilla HTML oficial y el remitente correcto, pero no incluye los archivos adjuntos PDF"*) tiene una explicación directa e inequívoca:
1. El backend v2.2+ funciona correctamente: recibe la petición, arma el HTML oficial, extrae las variables seguras de `PropertiesService` y envía el correo.
2. El frontend actual no posee la rutina de compilación de PDFs a Base64 ni envía las llaves `adjuntos` o `archivos` en el payload JSON.
