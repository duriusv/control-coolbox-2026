---
name: coolbox-control-builder
description: Especialista técnico y arquitectónico en el desarrollo, mantenimiento y despliegue del Sistema de Control de Mantenimiento Preventivo e Inventario Anual Coolbox 2026 sobre Google Workspace (GAS, Sheets, Drive).
---

# Coolbox Control Builder — Especialista en Google Workspace & Operaciones de Campo

Esta habilidad define los estándares de arquitectura, directrices de codificación, flujos de datos y reglas operativas inviolables para el desarrollo y evolución del **Sistema de Control de Mantenimiento Preventivo e Inventario Anual Coolbox 2026**.

---

## 1. CONTEXTO OPERATIVO Y ALCANCE

* **Cliente:** Coolbox (RASH PERÚ S.R.L.).
* **Contratista de Campo:** JSERVICE (Cuadrillas de técnicos desplegados en Perú).
* **Supervisión Remota:** Andrews Berbesia (Jefe de Operaciones) monitoreando en tiempo real desde Venezuela.
* **Cobertura Nacional:** 140 tiendas (86 en Lima Metropolitana/Callao y 54 en Provincias).
* **Ventana de Ejecución:** Del 15 de septiembre de 2026 al 20 de noviembre de 2026.
* **Costo de Infraestructura:** **$0.00 USD**. Arquitectura 100% serverless sobre cuotas estándar de Google Workspace.
* **Plataforma de Usuario:** Web App Mobile-First para navegadores móviles (Chrome en Android, Safari en iOS). Sin apps nativas instaladas.

---

## 2. REGLAS DE ORO Y RESTRICCIONES INVIOLABLES

Cualquier código, interfaz o flujo generado bajo esta habilidad DEBE cumplir estrictamente:

1. 🚫 **PROHIBICIÓN ESTRICTA DE PEINADO DE CABLES:**
   * **JAMÁS** incluir, codificar, sugerir o permitir opciones, campos, checklists o tareas relacionadas con ordenamiento, peinado o desconexión de cables en el rack de comunicaciones.
   * El alcance en el rack se restringe exclusivamente a: inspección visual, soplado de polvo, verificación de energía en PDU, verificación de extractores y toma de fotos (Antes y Después).
2. 📷 **FOTOGRAFÍAS OBLIGATORIAS DE GABINETE:**
   * El módulo de gabinete exige dos fotos en Base64: `Gabinete Antes` y `Gabinete Después`.
   * El avance o cierre del módulo debe estar bloqueado hasta validar la existencia de ambas imágenes.
3. 🔍 **ESCANEO INDIVIDUAL OBLIGATORIO (1 A 1):**
   * El registro de hardware debe ser individual mediante cámara web (`html5-qrcode`) o digitación manual por teclado.
   * **PROHIBIDO** el escaneo masivo o por lotes sin confirmación previa del equipo. Cada serial capturado debe validar sus atributos (tipo, marca, ubicación, estado) antes de pasar al siguiente.
4. 🔒 **BLOQUEO DE CONCURRENCIA CON LOCKSERVICE (30 SEGUNDOS):**
   * Todas las operaciones de escritura en Google Sheets deben protegerse con `LockService.getScriptLock()` y un timeout estricto de **30,000 ms**.
5. 💾 **PERSISTENCIA ANTI-DESCONEXIÓN (OFFLINE-FIRST):**
   * Todo cambio en el frontend debe guardarse de inmediato en `localStorage` del navegador para evitar pérdida de información en cuartos de comunicaciones o sótanos sin señal móvil.

---

## 3. ARQUITECTURA DE DATOS Y GOOGLE WORKSPACE

### 3.1 Estructura del Spreadsheet Central
El backend debe interactuar con un Google Sheet maestro compuesto por tres pestañas obligatorias:

1. `DB_TIENDAS` (Catálogo Maestro):
   * Columnas: `COD_TIENDA`, `NOMBRE_TIENDA`, `REGION`, `CIUDAD`, `DIRECCION`, `CANT_CAJAS`, `ESTADO_MANT`, `FECHA_EJECUCION`, `TECNICO_LIDER`.
2. `REGISTRO_MANTENIMIENTO` (Auditorías de Gabinete y Cómputo):
   * Columnas: `ID_MANTENIMIENTO`, `TIMESTAMP`, `COD_TIENDA`, `TECNICO_RESPONSABLE`, `GABINETE_INSPECCION`, `GABINETE_PDU`, `GABINETE_EXTRACTORES`, `FOTO_ANTES_URL`, `FOTO_DESPUES_URL`, `COMPUTO_CHECKLIST`, `TICKETERAS_CHECKLIST`, `PERIFERICOS_CHECKLIST`, `OBSERVACIONES_GENERALES`, `SINCRONIZACION_OFFLINE`.
3. `INVENTARIO_EQUIPOS` (Activos Tecnológicos Individuales):
   * Columnas: `ID_INVENTARIO`, `COD_TIENDA`, `TIMESTAMP_REGISTRO`, `TIPO_EQUIPO`, `MARCA`, `MODELO`, `NUMERO_SERIE`, `CODIGO_INVENTARIO`, `UBICACION_CAJA`, `CONDICION_OPERATIVA`, `METODO_CAPTURA`, `TECNICO_REGISTRO`.

### 3.2 Jerarquía de Carpetas en Google Drive
Las fotos recibidas en Base64 se almacenan en la siguiente estructura:
```
/Coolbox_Mantenimiento_2026/
    └── [COD_TIENDA]/
           ├── Gabinete_Antes_[COD_TIENDA]_[TIMESTAMP].jpg
           └── Gabinete_Despues_[COD_TIENDA]_[TIMESTAMP].jpg
```
* **Compresión en Cliente:** Redimensionar vía `<canvas>` a máximo 1280x960 px y calidad JPEG 0.7 para asegurar archivos menores a 800 KB antes de la transmisión.

---

## 4. PATRONES DE CÓDIGO Y BUENAS PRÁCTICAS

### 4.1 Backend (Google Apps Script - `.gs`)
* Usar `HtmlService.createTemplateFromFile()` para renderizar vistas modulares.
* Implementar funciones atómicas y envolver las escrituras con `LockService`:
  ```javascript
  function guardarDatosConBloqueo(sheetName, filas) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000); // 30 segundos
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);
      sheet.getRange(sheet.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
      SpreadsheetApp.flush();
      return { success: true };
    } catch (e) {
      Logger.log('Error en safeAppend: ' + e.message);
      return { success: false, error: e.message };
    } finally {
      lock.releaseLock();
    }
  }
  ```
* Utilizar `Utilities.base64Decode` y `DriveApp.createFile` para procesar y guardar imágenes en la subcarpeta correspondiente de la tienda.

### 4.2 Frontend (HTML5 / Vanilla JavaScript)
* **Mobile-First CSS:** Diseño táctil, inputs grandes, feedback visual inmediato, banners flotantes de estado de red.
* **Motor de Persistencia Local (`localStorage`):**
  * Claves estándar:
    - `coolbox_active_store`: Objeto de tienda seleccionada.
    - `coolbox_mantenimiento_draft`: Formulario de mantenimiento y fotos temporales.
    - `coolbox_inventario_draft`: Lista local de equipos inventariados.
    - `coolbox_offline_queue`: Cola FIFO de transacciones pendientes.
  * Reactividad: Escuchar eventos `input` y `change` para sincronizar `localStorage` instantáneamente.
  * Detección de conectividad:
    ```javascript
    window.addEventListener('online', () => sincronizarColaPendiente());
    window.addEventListener('offline', () => mostrarBannerOffline());
    ```
* **Integración del Escáner:**
  * Uso de `Html5QrcodeScanner` o `Html5Qrcode` para leer códigos de barras y QR en tiempo real con feedback de audio mediante la API de `AudioContext`.
  * Fallback transparente a input de texto manual en mayúsculas con validación inmediata.

---

## 5. HARDWARE Y MODELOS HOMOLOGADOS A AUDITAR

Al generar selectores y validaciones, incluir siempre los modelos homologados:
* **Ticketeras Térmicas:** Epson TM-T20II, Epson TM-T20III, Epson TM-T20IV, Bixolon (SRP-330 / SRP-350).
* **Terminales Móviles (PDAs):** Sunmi, Histone, Honeywell, Unitech.
* **Estaciones de Trabajo:** CPU estándar y All-in-One (AIO) HP / Lenovo.
* **Periféricos:** Gavetas de dinero RJ11/12, Lectores ópticos de barra, Lectores biométricos (huelleros).

---

## 6. CHECKLIST DE VERIFICACIÓN PARA NUEVOS DESARROLLOS

Antes de dar por completado cualquier cambio o componente, verificar:
- [ ] ¿El archivo respeta la prohibición absoluta de peinado de cables?
- [ ] ¿Las escrituras a Google Sheets tienen `LockService` con timeout de 30 segundos?
- [ ] ¿El formulario se recupera automáticamente tras cerrar y reabrir el navegador gracias a `localStorage`?
- [ ] ¿Se exige la captura de fotos 'Antes' y 'Después' en el gabinete de comunicaciones?
- [ ] ¿El escaneo de inventario se ejecuta equipo por equipo (1 a 1) y no en lote?
- [ ] ¿La interfaz móvil es completamente usable en pantallas táctiles sin zooms accidentales?
