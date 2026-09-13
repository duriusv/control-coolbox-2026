# ESPECIFICACIÓN TÉCNICA DE SOFTWARE (SDD)
## Sistema de Control de Mantenimiento Preventivo e Inventario Anual Coolbox 2026

**Documento de Definición de Sistema y Arquitectura de Software**  
**Versión:** 1.0.0  
**Fecha de Emisión:** Septiembre 2026  
**Estado:** Aprobado para Construcción  
**Metodología:** Specification-Driven Development (SDD)

---

### 1. ALCANCE, CONTEXTO Y OBJETIVOS OPERATIVOS

#### 1.1 Entorno Corporativo y Stakeholders
* **Cliente Principal:** RASH PERÚ S.R.L. (Cadena de tiendas **Coolbox**).
* **Empresa Ejecutora:** JSERVICE (Cuadrillas técnicas en campo).
* **Supervisión Operativa:** Andrews Berbesia (Jefe de Operaciones) monitoreando métricas, tiempos y cobertura en tiempo real desde Venezuela.
* **Usuarios Finales Operativos:** Técnicos de campo de JSERVICE asignados a rutas físicas de mantenimiento e inventario en Perú.

#### 1.2 Cobertura Geográfica y Cronograma
* **Total de Sedes:** 140 tiendas a nivel nacional en Perú.
  * **Lima Metropolitana y Callao:** 86 tiendas.
  * **Provincias:** 54 tiendas distribuidas en el territorio nacional peruano.
* **Ventana de Ejecución:** Del 15 de septiembre de 2026 al 20 de noviembre de 2026.
* **Régimen de Trabajo:** Jornadas diurnas y nocturnas según facilidades de acceso a centros comerciales (Mallplaza, Real Plaza, Jockey Plaza, Open Plaza, etc.) y locales puerta a la calle.

#### 1.3 Restricciones Tecnológicas y Financieras Inviolables
1. **Costo de Infraestructura:** **$0.00 USD**. Se opera íntegramente sobre las cuotas y servicios estándar de Google Workspace (Google Apps Script, Google Sheets, Google Drive).
2. **Cero Instalación de Aplicaciones Nativas:** Queda terminantemente prohibido exigir la instalación de binarios APK (Android) o IPA/TestFlight (iOS) en los teléfonos personales o corporativos de las cuadrillas. Todo el software corre vía navegador móvil estándar (Google Chrome Mobile en Android y Mobile Safari en iOS).
3. **Restricción Operativa Excluyente en Rack:** **PROHIBIDO** incluir, programar o permitir labores de ordenamiento o peinado de cables en el rack de comunicaciones. Las labores se limitan a inspección física, soplado de polvo y revisión de PDU/ventilación.
4. **Captura Individual de Hardware:** El escaneo y registro de números de serie y códigos patrimoniales debe ser estrictamente **uno a uno** (por cámara web o digitación directa con teclado). Queda expresamente rechazado el escaneo masivo/en lote para asegurar la verificación física individual de cada equipo.

---

### 2. ARQUITECTURA GENERAL DEL SISTEMA

El sistema adopta una arquitectura Serverless orientada a la web distribuida, apalancada en el ecosistema de Google Workspace y en patrones de diseño **Offline-First / Progressive Web Pattern**.

```
+-----------------------------------------------------------------------------------+
|                            CLIENTE: DISPOSITIVO MÓVIL                             |
|                                                                                   |
|  [ Navegador Móvil: Chrome / Safari ]                                             |
|  +-----------------------------------------------------------------------------+  |
|  | Single Page Web App (HTML5 + CSS3 Mobile-First + Vanilla JS ES6+)           |  |
|  |                                                                             |  |
|  |  +-------------------+  +---------------------+  +-----------------------+  |  |
|  |  | MÓDULO 1: CÓMPUTO |  | MÓDULO 2: GABINETE  |  | MÓDULO 3: INVENTARIO  |  |  |
|  |  | Y PERIFÉRICOS     |  | (Antes/Después)     |  | (html5-qrcode / Input)|  |  |
|  |  +-------------------+  +---------------------+  +-----------------------+  |  |
|  |            |                       |                         |              |  |
|  |            +-----------------------+-------------------------+              |  |
|  |                                    |                                        |  |
|  |                     [ GESTOR DE PERSISTENCIA LOCAL ]                        |  |
|  |                     - HTML5 LocalStorage Engine                             |  |
|  |                     - Auto-guardado reactivo por evento                     |  |
|  |                     - Cola de Envíos Pendientes (Offline Queue)             |  |
|  |                     - Compresor de Fotos (HTML5 Canvas Base64)              |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------|-------------------------------------------+
                                        | (HTTPS / google.script.run / RPC)
                                        v
+-----------------------------------------------------------------------------------+
|                         BACKEND: GOOGLE APPS SCRIPT                               |
|                                                                                   |
|  [ Controlador Web App: HtmlService ]                                              |
|  - doGet() -> Inyección de templates y entrega del bundle cliente                  |
|  - API Controller Functions:                                                      |
|      * apiGetTiendasCatalog()                                                     |
|      * apiSubmitMantenimiento(payload)                                            |
|      * apiSubmitInventarioBatch(payload)                                          |
|                                                                                   |
|  [ Concurrency Manager: LockService ]                                             |
|  - LockService.getScriptLock() con espera máxima de 30,000 ms                     |
|  - Prevención de 'race conditions' en concurrencia entre cuadrillas de campo      |
+---------------------------------------|-------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+-------------------------------------+   +-----------------------------------------+
|     BASE DE DATOS: GOOGLE SHEETS    |   |     ALMACENAMIENTO: GOOGLE DRIVE        |
|                                     |   |                                         |
|  - DB_TIENDAS (Catálogo Maestro)    |   |  Directorio Raíz:                       |
|  - REGISTRO_MANTENIMIENTO           |   |  /Coolbox_Mantenimiento_2026/           |
|  - INVENTARIO_EQUIPOS               |   |     |                                   |
|                                     |   |     +-- [CODIGO_TIENDA]/                |
|                                     |   |            |-- Gabinete_Antes_[TS].jpg  |
|                                     |   |            |-- Gabinete_Despues_[TS].jpg|
+-------------------------------------+   +-----------------------------------------+
```

---

### 3. ESPECIFICACIÓN DETALLADA DE MÓDULOS OPERATIVOS

#### 3.1 MÓDULO 1: Mantenimiento de Cómputo y Periféricos
* **Objetivo:** Registro estandarizado y protocolizado del mantenimiento físico efectuado a las estaciones de trabajo de punto de venta (POS) y oficina de administración.
* **Componentes Auditados:**
  1. **CPU / All-in-One (AIO):**
     * Desarme básico / apertura de tapas.
     * Soplado de polvo en placas base, fuentes de poder, disipadores y ventiladores.
     * Inspección de cables internos y verificación de encendido post-limpieza.
  2. **Ticketeras Térmicas:**
     * Modelos homologados: **Epson TM-T20II, Epson TM-T20III, Epson TM-T20IV, Bixolon (SRP-330 / SRP-350)**.
     * Procedimiento: Limpieza con alcohol isopropílico del cabezal térmico y rodillo de tracción de papel; extracción de residuos de papel y polvo; prueba de impresión de test feed.
  3. **Periféricos de Punto de Venta:**
     * **Lectores de Código de Barras:** Limpieza de ventana óptica y prueba de lectura.
     * **Gavetas de Dinero:** Limpieza de rieles, lubricación de mecanismo de apertura por solenoide e inspección de cable RJ11/12 conectado a la ticketera.
     * **Huelleros (Lectores Biométricos):** Limpieza suave de prisma con paño de microfibra seco.
     * **Terminales Portátiles (PDAs):** Modelos operativos **Sunmi, Histone, Honeywell, Unitech**. Limpieza de pantalla táctil, lente de cámara/escáner y pines de carga en cuna o puerto USB.
* **Formato de Checklist en UI:**
  * Estación auditada (Caja 1, Caja 2, Caja N, Backoffice).
  * Checkbox booleano para cada ítem completado.
  * Selector de estado final: `OPERATIVO`, `OPERATIVO CON OBSERVACIÓN`, `INOPERATIVO`.
  * Campo de texto libre para observaciones técnicas específicas.

#### 3.2 MÓDULO 2: Mantenimiento de Gabinete de Comunicaciones (Rack)
* **Objetivo:** Asegurar la limpieza y continuidad energética y de ventilación del equipamiento central de comunicaciones de la tienda.
* **Labores Obligatorias:**
  1. Inspección visual y apertura del gabinete.
  2. Soplado de polvo acumulado en switch core, router del ISP, patch panels y bandejas de soporte.
  3. Verificación de energía: Inspección de PDU (Power Distribution Unit), estado de enchufes y tomacorrientes estabilizados.
  4. Verificación de ventilación: Estado operativo de los extractores de aire en la parte superior o lateral del rack (Giran correctamente / Ruido anómalo / Inoperativos).
* **Registro Fotográfico Obligatorio:**
  * **Foto 1:** `Gabinete Antes` (Estado inicial al abrir el rack, antes de iniciar el soplado).
  * **Foto 2:** `Gabinete Después` (Estado final tras soplado y limpieza de bandejas).
  * Ambos archivos son validados por el frontend: el botón de cierre de módulo permanece inhabilitado hasta capturar ambas imágenes.
* **CLÁUSULA DE EXCLUSIÓN EXPLÍCITA (REGLA DE ORO):**
  > **PROHIBIDO:** Queda terminantemente vetado cualquier intento de desenchufar patch cords, reordenar cables, peinar o precintar cableado estructurado dentro del gabinete de comunicaciones. Esta restricción previene la caída accidental de enlaces de red de la tienda y reclamos por desconexión de servicios transaccionales.

#### 3.3 MÓDULO 3: Inventario Técnico Individual (Equipos en Producción y Backup)
* **Objetivo:** Censo riguroso de cada activo de hardware presente en la tienda (tanto en uso en punto de venta como en reserva/backup en almacén).
* **Parámetros de Captura Obligatorios por Equipo:**
  * `Tipo de Equipo`: CPU, All-in-One, Monitor, Ticketera, Lector de Barras, Gaveta, Huellero, PDA, Switch, Router, PDU, Estabilizador / UPS.
  * `Marca`: HP, Lenovo, Epson, Bixolon, Sunmi, Histone, Honeywell, Unitech, Cisco, Mikrotik, D-Link, APC, etc.
  * `Modelo`: Texto alfanumérico especificado en placa del fabricante.
  * `Número de Serie (S/N)`: Serial único del fabricante.
  * `Código de Inventario`: Identificador de activo fijo interno de Coolbox / RASH Perú (si cuenta con etiqueta de código de barras / QR de activo).
  * `Ubicación Física`: Caja 1, Caja 2, Caja 3, Mostrador, Administración, Almacén (Backup), Cuarto de Rack.
  * `Condición Operativa`: `OPERATIVO`, `INOPERATIVO`, `OBSOLETO / PARA BAJA`.
* **Mecanismos de Captura de Seriales y Códigos:**
  1. **Cámara Web Móvil (1 a 1):** Utilizando la librería open source `html5-qrcode`, activando la cámara trasera con selector de foco. Tras detectar un código válido (Code128, QR, EAN13), dispara un beep acústico (`AudioContext`) y autocompleta el campo activo.
  2. **Digitación Manual:** Input de texto en mayúsculas forzadas con validación de longitud mínima (3 caracteres) para casos donde la etiqueta esté desgastada o ilegible.
  3. **Restricción de Escaneo:** **NO se permite escaneo masivo (en lote).** Cada equipo escaneado debe confirmar de inmediato sus metadatos (tipo, marca, ubicación, estado) y registrarse en la grilla visual de la tienda antes de proceder con el siguiente.

---

### 4. ESQUEMA DE DATOS Y PERSISTENCIA

#### 4.1 Base de Datos Google Sheets (Spreadsheet Central)
El sistema utiliza una hoja de cálculo centralizada de Google Sheets que actúa como base de datos relacional simplificada, estructurada en 3 hojas específicas:

##### Hoja 1: `DB_TIENDAS` (Catálogo Maestro de Tiendas)
| Columna | Nombre de Campo | Tipo | Ejemplo / Descripción |
|---|---|---|---|
| A | `COD_TIENDA` | String (PK) | "T001", "T086", "T140" |
| B | `NOMBRE_TIENDA` | String | "Coolbox Jockey Plaza", "Coolbox Real Plaza Trujillo" |
| C | `REGION` | Enum | "LIMA", "PROVINCIA" |
| D | `CIUDAD` | String | "Lima", "Arequipa", "Cusco", "Chiclayo" |
| E | `DIRECCION` | String | "Av. Javier Prado Este 4200, Santiago de Surco" |
| F | `CANT_CAJAS` | Integer | Número nominal de cajas registradoras (e.g., 3) |
| G | `ESTADO_MANT` | Enum | "PENDIENTE", "EN_PROCESO", "COMPLETADO" |
| H | `FECHA_EJECUCION` | Date/String | "2026-09-18" (Fecha real de ejecución) |
| I | `TECNICO_LIDER` | String | "Juan Pérez - JSERVICE" |

##### Hoja 2: `REGISTRO_MANTENIMIENTO` (Auditorías de Gabinete y Cómputo)
| Columna | Nombre de Campo | Tipo | Ejemplo / Descripción |
|---|---|---|---|
| A | `ID_MANTENIMIENTO` | String (PK) | "MNT-T001-20260918-01" (UUID o Hash) |
| B | `TIMESTAMP` | ISO 8601 | "2026-09-18T14:32:10.123Z" |
| C | `COD_TIENDA` | String (FK) | "T001" |
| D | `TECNICO_RESPONSABLE`| String | Nombre del técnico en campo |
| E | `GABINETE_INSPECCION`| Boolean | TRUE / FALSE (Soplado y limpieza física) |
| F | `GABINETE_PDU` | Boolean | TRUE / FALSE (Revisión de energía) |
| G | `GABINETE_EXTRACTORES`| Boolean | TRUE / FALSE (Ventilación operativa) |
| H | `FOTO_ANTES_URL` | String (URL) | Enlace público/interno al archivo en Google Drive |
| I | `FOTO_DESPUES_URL` | String (URL) | Enlace público/interno al archivo en Google Drive |
| J | `COMPUTO_CHECKLIST` | JSON String | Array serializado con estado de cada caja y AIO |
| K | `TICKETERAS_CHECKLIST`| JSON String | Detalle de cabezales y rodillos de Epson/Bixolon |
| L | `PERIFERICOS_CHECKLIST`| JSON String | Huelleros, gavetas, lectores, PDAs |
| M | `OBSERVACIONES_GENERALES`| Text | Notas y hallazgos adicionales del técnico |
| N | `SINCRONIZACION_OFFLINE`| Boolean | TRUE si provino de la cola local post-desconexión |

##### Hoja 3: `INVENTARIO_EQUIPOS` (Activos Tecnológicos Individuales)
| Columna | Nombre de Campo | Tipo | Ejemplo / Descripción |
|---|---|---|---|
| A | `ID_INVENTARIO` | String (PK) | "INV-T001-0001" |
| B | `COD_TIENDA` | String (FK) | "T001" |
| C | `TIMESTAMP_REGISTRO`| ISO 8601 | "2026-09-18T15:10:05.450Z" |
| D | `TIPO_EQUIPO` | Enum | "CPU", "TICKETERA", "PDA", "LECTOR", etc. |
| E | `MARCA` | String | "Epson", "Sunmi", "HP", "Honeywell" |
| F | `MODELO` | String | "TM-T20III", "V2 Pro", "ProDesk 400" |
| G | `NUMERO_SERIE` | String | "X9ZZ123456" |
| H | `CODIGO_INVENTARIO` | String | "ACT-CBX-998822" |
| I | `UBICACION_CAJA` | String | "Caja 1", "Caja 2", "Backup / Almacén" |
| J | `CONDICION_OPERATIVA`| Enum | "OPERATIVO", "INOPERATIVO", "OBSOLETO" |
| K | `METODO_CAPTURA` | Enum | "SCAN_CAMARA", "MANUAL" |
| L | `TECNICO_REGISTRO` | String | "Carlos Gómez - JSERVICE" |

#### 4.2 Repositorio Jerárquico en Google Drive
Las fotografías se transfieren desde el cliente como cadenas Base64 (comprimidas en cliente a JPEG con calidad 0.7 y resolución máxima de 1280x960 px para garantizar pesos inferiores a 800 KB por imagen).

* **Carpeta Raíz del Proyecto:** `Coolbox_Mantenimiento_2026`
* **Subcarpetas Dinámicas por Tienda:** Se crea automáticamente la subcarpeta correspondiente al código de tienda si no existe:
  ```
  /Coolbox_Mantenimiento_2026/
     ├── [T001] Coolbox Jockey Plaza/
     │      ├── Gabinete_Antes_T001_20260918_143000.jpg
     │      └── Gabinete_Despues_T001_20260918_161500.jpg
     ├── [T002] Coolbox Real Plaza Salaverry/
     └── [T087] Coolbox Real Plaza Trujillo/
  ```

---

### 5. MECANISMO DE PERSISTENCIA Y SINCRONIZACIÓN ANTI-DESCONEXIÓN

Dadas las condiciones de campo en Perú, donde los cuartos de rack y trastiendas de los centros comerciales son recintos blindados o sótanos sin señal 4G/5G, el sistema implementa una **Máquina de Estados de Persistencia Local**:

```
 [ Entrada de Datos ] 
        |
        v
 [ HTML5 LocalStorage: 'coolbox_active_session' ] <--- Guardado inmediato en cada 'input' / 'change'
        |
        +---> ¿Hay conexión a Internet (navigator.onLine)?
                 |
                 |-- (SÍ) --> Enviar datos a Backend vía google.script.run
                 |            |
                 |            +--> Éxito: Marcar como sincronizado y purgar sesión local.
                 |            +--> Fallo de red: Encolar en 'coolbox_pending_sync'.
                 |
                 |-- (NO) --> Encolar en 'coolbox_pending_sync' (LocalStorage)
                              Mostrar Banner Flotante: "Modo Offline Activo (Guardado Local)".
                              Listener: window.addEventListener('online', autoSyncHandler).
```

#### 5.1 Estructura del Almacenamiento en `localStorage`
1. `coolbox_active_store`: Identificador y nombre de la tienda en curso de atención.
2. `coolbox_mantenimiento_draft`: Objeto JSON con el estado en tiempo real de todos los checklists de cómputo y gabinete, incluyendo las fotos en Base64 temporal.
3. `coolbox_inventario_draft`: Lista de objetos JSON con cada equipo registrado localmente.
4. `coolbox_offline_queue`: Cola FIFO de peticiones listas para envío una vez restablecido el enlace a internet.

---

### 6. CONTROL DE CONCURRENCIA EN GOOGLE APPS SCRIPT

Para atender a las múltiples cuadrillas concurrentes de JSERVICE que suben reportes e inventarios simultáneamente sin corromper las filas de Google Sheets:

* **Mecanismo:** `LockService.getScriptLock()`
* **Tiempo de Espera (Timeout):** **30 segundos (30,000 milisegundos)**.
* **Patrón de Ejecución Backend:**
  ```javascript
  function safeAppendRows(sheetName, rowsData) {
    const lock = LockService.getScriptLock();
    try {
      // Bloqueo con espera de hasta 30 segundos
      lock.waitLock(30000);
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
      
      // Escritura atómica por bloque
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
      SpreadsheetApp.flush();
      return { success: true };
    } catch (err) {
      Logger.log("Error de concurrencia en " + sheetName + ": " + err.toString());
      return { success: false, error: "Servidor ocupado. Reintentando sincronización: " + err.message };
    } finally {
      lock.releaseLock();
    }
  }
  ```

---

### 7. INTERFAZ DE USUARIO (MOBILE-FIRST UI/UX)

#### 7.1 Principios de Diseño
* **Layout Adaptable:** Mobile-first optimizado para pantallas táctiles de 4.7" a 6.7" (resoluciones comunes de smartphones Android y iPhone).
* **Contraste y Ergonomía:** Tipografía de alta legibilidad, botones de acción táctil con altura mínima de 48px para facilitar el uso con dedos o guantes de protección antiestática en campo.
* **Flujo de Trabajo Guiado (Step Wizard):**
  * **Paso 0: Selección de Tienda y Técnico:** Selector con autocompletado del catálogo de 140 tiendas y datos de la cuadrilla JSERVICE.
  * **Paso 1: Módulo de Gabinete:** Checklists obligatorios de inspección, PDU, extractores y carga estricta de Foto Antes y Foto Después.
  * **Paso 2: Módulo de Cómputo y Periféricos:** Revisión por cajas (CPU/AIO, ticketeras Epson/Bixolon, PDAs Sunmi/Histone/Honeywell/Unitech, gavetas y lectores).
  * **Paso 3: Módulo de Inventario:** Escaneo 1 a 1 mediante cámara o digitación manual con visor de equipos censados en tiempo real.
  * **Paso 4: Resumen y Cierre de Tienda:** Firma digital o confirmación de fin de labores y sincronización final.

#### 7.2 Integración de Cámara y Escaneo de Código de Barras
* Librería CDN embebida: `html5-qrcode.min.js`.
* Soporte para formatos estándar en Coolbox: Code 128, Code 39, QR Code, EAN-13.
* Tratamiento de imágenes de cámara para fotos de gabinete: Redimensionamiento en `<canvas>` antes de convertir a Base64 para mitigar límites de carga y memoria en Google Apps Script.

---

### 8. MATRIZ DE REGLAS DE NEGOCIO Y VALIDACIONES

| Código | Regla de Negocio | Severidad | Acción del Sistema |
|---|---|---|---|
| **RN-01** | **Prohibición estricta de peinado/ordenamiento de cables en rack.** | CRÍTICA | Queda omitida cualquier opción de ordenamiento en checklists; no se acepta como actividad registrada. |
| **RN-02** | **Fotos obligatorias de gabinete (Antes y Después).** | CRÍTICA | El botón de envío o avance de módulo de gabinete permanece bloqueado hasta registrar 2 imágenes válidas en Base64. |
| **RN-03** | **Escaneo estrictamente individual de activos (1 a 1).** | CRÍTICA | Cada lectura de serie/código requiere confirmación explícita de ubicación y condición antes de habilitar el siguiente escaneo. |
| **RN-04** | **Unicidad de Número de Serie dentro de la tienda.** | ALTA | El frontend alerta visual y sonoramente si un técnico intenta escanear dos veces el mismo número de serie en una misma tienda. |
| **RN-05** | **Persistencia local automática en cada entrada.** | ALTA | Cualquier valor modificado se persiste en `localStorage` en el milisegundo en que ocurre el evento `input`/`change`. |
| **RN-06** | **Timeout de concurrencia en backend (30s).** | MEDIA | En caso de saturación momentánea en Google Sheets, el backend rechaza ordenadamente para que el frontend reintente en 5 segundos sin perder datos. |

---

### 9. REQUISITOS DE DESPLIEGUE Y OPERACIÓN ($0.00 USD)

1. **Creación del Proyecto en Google Apps Script:** Vinculado al Google Sheet maestro de control o Standalone con acceso a los IDs del Spreadsheet y Folder Raíz.
2. **Configuración de Permisos en Google Drive:** Carpeta compartida con permisos de edición para la cuenta de servicio o la cuenta ejecutora del Web App.
3. **Despliegue del Web App (Deploy as Web App):**
   * *Execute as:* **Me (Usuario propietario / Administrador del proyecto)**.
   * *Who has access:* **Anyone with Google Account** o **Anyone** (según política interna de seguridad de JSERVICE/Coolbox).
4. **Acceso Técnico en Campo:** Distribución de URL corta o código QR para que los técnicos abran la Web App en sus navegadores móviles sin autenticaciones engorrosas.
5. **Monitoreo Operativo:** Andrews Berbesia visualiza directamente la hoja de cálculo de Google Sheets sincronizada en tiempo real o un reporte conectado en Looker Studio (gratuito).
