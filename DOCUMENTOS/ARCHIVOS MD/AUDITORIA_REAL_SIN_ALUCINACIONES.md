# 🛡️ INFORME DE AUDITORÍA TÉCNICA REAL Y DIRECTA (DISCOVERY EN DISCO)
## Sistema Integrado de Control de Mantenimiento Preventivo y Censo de Activos Coolbox 2026

**Empresa Ejecutora:** JSERVICE RV E.I.R.L.  
**Cliente Mandante:** RASH PERÚ S.R.L. (Cadena de Tiendas Coolbox)  
**Supervisión General:** Andrews Berbesia (Jefatura de Operaciones) y Jesús Silva (Gerencia General)  
**Metodología:** Discovery Técnico Estricto en Modo Solo Lectura sobre Archivos Reales en Disco  
**Fecha de Emisión:** 9 de Septiembre de 2026  

---

## 1. LECTURA Y CONFIRMACIÓN DE LAS CABECERAS REALES EN DISCO

La inspección física de los archivos CSV ubicados en el directorio local `basedatos/` confirma de manera irrefutable los nombres verdaderos de las hojas y la estructura exacta de columnas que conforman la base de datos maestra de Google Sheets (`Control_Coolbox_Dev_2026`).

### 1.1 Confirmación de Nombres Oficiales de las Hojas

1. **Tabla de Mantenimiento y Atenciones:**  
   * **Nombre Real en Disco:** `REGISTRO_MANTENIMIENTO` (Archivo: `basedatos/Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv`).  
   * **Diagnóstico:** Se confirma que la tabla **JAMÁS SE LLAMÓ "HISTORIAL_ATENCIONES"**. Dicha denominación constituyó una alucinación y desalineación conceptual arrastrada en la documentación previa y en el archivo `Codigo.gs`.
2. **Tabla de Censo e Inventario de Hardware:**  
   * **Nombre Real en Disco:** `INVENTARIO_EQUIPOS` (Archivo: `basedatos/Control_Coolbox_Dev_2026 - INVENTARIO_EQUIPOS.csv`).  
   * **Diagnóstico:** La tabla oficial es **`INVENTARIO_EQUIPOS`**, no "INVENTARIO_GENERAL".
3. **Tabla Maestra de Tiendas:**  
   * **Nombre Real en Disco:** `DB_TIENDAS` (Archivo: `basedatos/Control_Coolbox_Dev_2026 - DB_TIENDAS.csv`).

---

### 1.2 Estructura Detallada de Columnas Reales en Disco

#### A. Tabla `REGISTRO_MANTENIMIENTO.csv` (12 Columnas Reales)
Contiene exactamente 187 bytes en su cabecera transaccional física:

```csv
ID_VISITA,FECHA_HORA,TECNICO,CODIGO_TIENDA,GABINETE_LIMPIEZA,GABINETE_VENTILADORES,GABINETE_PDU,URL_FOTO_ANTES,URL_FOTO_DESPUES,OBSERVACIONES_GABINETE,COMPUTO_ESTADO,OBSERVACIONES_COMPUTO
```

| Posición | Nombre de Columna Real | Propósito Funcional | Tipo de Dato Esperado |
|:---:|---|---|---|
| **Col 01** | `ID_VISITA` | Clave Primaria única de la atención técnica | String (ej. `VIS-B22-20260909-01`) |
| **Col 02** | `FECHA_HORA` | Marca de tiempo del registro | Datetime / Timestamp |
| **Col 03** | `TECNICO` | Nombre del técnico titular o cuadrilla | String (ej. `Juan Pérez / Carlos Gómez`) |
| **Col 04** | `CODIGO_TIENDA` | Identificador oficial de sede Coolbox | String (ej. `B22`, `B11`) |
| **Col 05** | `GABINETE_LIMPIEZA` | Evaluación de limpieza y soplado del rack | Enum (`Conforme`, `No Conforme`, `No Aplica`) |
| **Col 06** | `GABINETE_VENTILADORES` | Evaluación operativa de extractores | Enum (`Operativo`, `Inoperativo`, `No Tiene`) |
| **Col 07** | `GABINETE_PDU` | Evaluación eléctrica del PDU en rack | Enum (`Operativo`, `Observado`) |
| **Col 08** | `URL_FOTO_ANTES` | Enlace seguro en Drive a foto inicial rack | String URL (`https://drive.google.com/...`) |
| **Col 09** | `URL_FOTO_DESPUES` | Enlace seguro en Drive a foto final rack | String URL (`https://drive.google.com/...`) |
| **Col 10** | `OBSERVACIONES_GABINETE` | Novedades y hallazgos en rack | Texto libre |
| **Col 11** | `COMPUTO_ESTADO` | Estado general de las estaciones de venta | Enum (`Operativo`, `Observado`) o JSON |
| **Col 12** | `OBSERVACIONES_COMPUTO` | Novedades generales de los computadores | Texto libre |

---

#### B. Tabla `INVENTARIO_EQUIPOS.csv` (11 Columnas Reales)
Contiene exactamente 124 bytes en su cabecera de activos física:

```csv
ID_ITEM,ID_VISITA,FECHA_REGISTRO,CODIGO_TIENDA,TIPO_EQUIPO,MARCA,MODELO,NUMERO_SERIE,COD_INVENTARIO,UBICACION_CAJA,CONDICION
```

| Posición | Nombre de Columna Real | Propósito Funcional | Tipo de Dato Esperado |
|:---:|---|---|---|
| **Col 01** | `ID_ITEM` | Clave Primaria única del activo registrado | String (ej. `ITEM-B22-001`) |
| **Col 02** | `ID_VISITA` | Clave Foránea vinculada a la visita técnica | String (FK -> `REGISTRO_MANTENIMIENTO`) |
| **Col 03** | `FECHA_REGISTRO` | Marca de tiempo del registro individual | Datetime / Timestamp |
| **Col 04** | `CODIGO_TIENDA` | Identificador oficial de sede | String (ej. `B22`) |
| **Col 05** | `TIPO_EQUIPO` | Categoría homologada de hardware | Enum (`PC`, `Ticketera`, `Lector`, etc.) |
| **Col 06** | `MARCA` | Fabricante del equipo | String (ej. `Epson`, `HP`, `Bixolon`) |
| **Col 07** | `MODELO` | Modelo de fábrica | String (ej. `TM-T20III`, `ProDesk 400`) |
| **Col 08** | `NUMERO_SERIE` | Número de serie del fabricante | String único (S/N) |
| **Col 09** | `COD_INVENTARIO` | Código patrimonial de activo fijo Coolbox | String patrimonial |
| **Col 10** | `UBICACION_CAJA` | Puesto físico donde opera el activo | String (`Caja 01`, `Caja 02`, `Almacén`) |
| **Col 11** | `CONDICION` | Estado operativo del dispositivo | Enum (`Operativo`, `Inoperativo`, `Backup`) |

---

#### C. Tabla `DB_TIENDAS.csv` (13 Columnas Reales)
Contiene 142 filas físicas (1 cabecera, 140 locales oficiales de Coolbox y 1 fila de totales):

```csv
CODIGO_TIENDA,NOMBRE_TIENDA,CIUDAD,DIRECCION,CLASIFICACION,SERVIDOR_IGC,ESTADO_ATENCION,EQUIPOS ASIGNADOS,VTAMOVIL,CAJAS FIJAS,TICKETERA,LECTOR,GAVETA
```

---

## 2. ANÁLISIS DE DISCREPANCIAS Y LA GRAN DESCONEXIÓN DEL BACKEND

Al contrastar la aplicación móvil de campo (`index.html`), el archivo de backend (`Codigo.gs`) y la base de datos real en disco (`basedatos/`), se evidencia una desconexión crítica que impide cualquier guardado exitoso en producción.

```
+----------------------------------------------------------------------------------------------------+
|                                    MAPA DE LA RUPTURA TRIPARTITA                                   |
|                                                                                                    |
|  [ APP TÉCNICOS: index.html ]                                                                      |
|  - Genera payload con nombres fieles a REGISTRO_MANTENIMIENTO.csv:                                 |
|    { codigoTienda, tecnico, gabineteLimpieza, gabineteVentiladores, gabinetePDU... }               |
|  - PERO invoca: google.script.run.guardarAtencion(payload)                                         |
|                                       |                                                            |
|                                       x (ERROR: ¡guardarAtencion NO EXISTE EN Codigo.gs!)          |
|                                       v                                                            |
|  [ BACKEND APPS SCRIPT: Codigo.gs ]                                                                |
|  1. Busca hojas con nombres erróneos:                                                              |
|     - NOMBRE_HOJA_ATENCIONES = "HISTORIAL_ATENCIONES"  (¡La hoja real es REGISTRO_MANTENIMIENTO!)  |
|     - NOMBRE_HOJA_INVENTARIO = "INVENTARIO_GENERAL"    (¡La hoja real es INVENTARIO_EQUIPOS!)      |
|  2. Primer doPost(e) (L96): Espera variables ajenas:                                              |
|     - payload.tecnicoTitular, payload.estadoGabinete, payload.totalEquipos                         |
|  3. SEGUNDO doPost(e) (L191): Sobreescribe por hoisting al primero y solo procesa correos         |
|     - ¡Cualquier POST de técnicos recibe: "Acción no reconocida en el servidor"!                   |
|                                       |                                                            |
|                                       x (ERROR: ¡No lee ni escribe en las hojas verdaderas!)       |
|                                       v                                                            |
|  [ BASE DE DATOS REAL: basedatos/*.csv ]                                                           |
|  - REGISTRO_MANTENIMIENTO.csv (12 columnas)                                                        |
|  - INVENTARIO_EQUIPOS.csv (11 columnas)                                                            |
|  - DB_TIENDAS.csv (13 columnas)                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Hallazgos Críticos en `Codigo.gs`

1. **Alucinación de Nombres de Hojas (Líneas 9 a 11):**
   ```javascript
   const NOMBRE_HOJA_TIENDAS = "DB_TIENDAS";
   const NOMBRE_HOJA_ATENCIONES = "HISTORIAL_ATENCIONES"; // ERROR: En disco es REGISTRO_MANTENIMIENTO
   const NOMBRE_HOJA_INVENTARIO = "INVENTARIO_GENERAL";   // ERROR: En disco es INVENTARIO_EQUIPOS
   ```
   * **Efecto Inmediato:** Cuando el panel administrativo o cualquier cliente solicita `?action=getDashboardData`, la función `obtenerDatosCompletosDashboard()` ejecuta `ss.getSheetByName("HISTORIAL_ATENCIONES")` e `INVENTARIO_GENERAL`. Como en el libro real de Google Sheets esas hojas no existen, devuelven `null`, retornando siempre `atenciones: []` y `totalEquiposAuditados: 0`.

2. **Inexistencia de la Función `guardarAtencion()`:**
   * En `index.html` (L2807), la app móvil ejecuta:  
     `google.script.run.withSuccessHandler(...).guardarAtencion(payload);`
   * En `Codigo.gs`, **LA FUNCIÓN `guardarAtencion` NO EXISTE**.  
   * **Efecto Inmediato:** En cualquier teléfono móvil, al pulsar el botón de guardar se dispara un fallo fatal en JavaScript del tipo: *"google.script.run.guardarAtencion is not a function"*.

3. **Inexistencia de la Función `obtenerCatalogoTiendasJSON()`:**
   * En `Codigo.gs` (L43), `doGet` evalúa si el parámetro `action` es igual a `"getCatalogo"` e invoca `obtenerCatalogoTiendasJSON()`:
   * Dicha función **NO ESTÁ DEFINIDA** en ninguna línea de `Codigo.gs`. Al consultarla, el servidor se cae con un `ReferenceError`.

4. **Sobreescritura Destructiva de `doPost(e)` por Hoisting (L96 vs L191):**
   * En JavaScript y Google Apps Script, si se declaran dos funciones con el mismo nombre (`function doPost(e)`), la última declaración sobreescribe totalmente a la primera.
   * La primera `doPost(e)` (L96 a L140) intentaba registrar atenciones.
   * La segunda `doPost(e)` (L191 a L218) procesa exclusivamente la acción `enviarDocumentacionSede` para despachar correos con GmailApp.
   * **Efecto Inmediato:** Si la app de técnicos intentase enviar datos vía HTTP POST a la URL del Web App, la petición es capturada por el segundo `doPost`, el cual rechaza el payload con:  
     `{ exito: false, mensaje: "Acción no reconocida en el servidor." }`. El código de guardado de atenciones es código muerto.

5. **Paradoja Positiva:**  
   Curiosamente, el programador de `index.html` utilizó para el objeto `payload` nombres de atributos que concuerdan casi a la perfección con las columnas de `REGISTRO_MANTENIMIENTO.csv`:
   * `gabineteLimpieza` -> Columna `GABINETE_LIMPIEZA`
   * `gabineteVentiladores` -> Columna `GABINETE_VENTILADORES`
   * `gabinetePDU` -> Columna `GABINETE_PDU`
   * `observacionesGabinete` -> Columna `OBSERVACIONES_GABINETE`
   * `observacionesComputo` -> Columna `OBSERVACIONES_COMPUTO`  
   El fallo radicó exclusivamente en `Codigo.gs`, donde se intentó forzar una estructura artificial no coordinada.

---

## 3. COLUMNAS FALTANTES EN REGISTRO_MANTENIMIENTO PARA FOTOGRAFÍAS Y FIRMAS

La auditoría física de `basedatos/Control_Coolbox_Dev_2026 - REGISTRO_MANTENIMIENTO.csv` revela vacíos estructurales determinantes para el cumplimiento de los entregables contractuales de Coolbox:

```
+----------------------------------------------------------------------------------------------------+
|                       DIAGNÓSTICO DE COLUMNAS: LO QUE HAY VS LO QUE SE EXIGE                       |
|                                                                                                    |
|  COLUMNAS REALES EN DISCO (12):                                                                    |
|  [ID_VISITA] [FECHA_HORA] [TECNICO] [CODIGO_TIENDA] [GABINETE_LIMPIEZA] [GABINETE_VENTILADORES]    |
|  [GABINETE_PDU] [URL_FOTO_ANTES] [URL_FOTO_DESPUES] [OBS_GAB] [COMPUTO_ESTADO] [OBS_COMP]          |
|                                                                                                    |
|  COLUMNAS FALTANTES PARA EVIDENCIAS FOTOGRÁFICAS (HOJA 2 DE FICHA TÉCNICA):                        |
|  ❌ URL_FOTO_POS1        (Punto de Venta 1 - Periféricos y Conectividad)                           |
|  ❌ URL_FOTO_POS2        (Punto de Venta 2 - Periféricos y Conectividad)                           |
|  ❌ URL_FOTO_BACKUP      (Equipos de Backup y Contingencia en Almacén)                             |
|  ❌ URL_FOTO_PDU         (Inspección Eléctrica PDU y Estabilizador)                                |
|  ❌ URL_FOTO_PANORAMICA  (Panorámica General de Área de Cajas)                                     |
|  ❌ URL_FOTO_ACTA        (Acta Física Firmada / Validación en Tienda)                              |
|                                                                                                    |
|  COLUMNAS FALTANTES PARA CERTIFICACIÓN DIGITAL:                                                    |
|  ❌ FIRMA_TECNICO_URL    (Rúbrica digitalizada del Técnico Líder JSERVICE RV)                      |
|  ❌ FIRMA_CLIENTE_URL    (Rúbrica digitalizada del Encargado de Tienda Coolbox)                     |
|  ❌ NOMBRE_ENCARGADO     (Nombre y Apellido del Encargado que recepciona el servicio)               |
|  ❌ DNI_ENCARGADO        (Documento Nacional de Identidad del Encargado)                           |
+----------------------------------------------------------------------------------------------------+
```

### 3.1 Análisis de la Brecha Fotográfica
* En el archivo real en disco solo existen 2 columnas: `URL_FOTO_ANTES` (Col 8) y `URL_FOTO_DESPUES` (Col 9), correspondientes al cuarto de comunicaciones.
* La **Hoja 2 de la Ficha Técnica Oficial** generada en el panel administrativo (`Control Coolbox Admin/index.html`, L6156-L6165) y en el backend (`Codigo.gs`, L476-L493) exige estrictamente **8 evidencias fotográficas de campo**.
* Dado que las fotos 3 a 8 no tienen columna en la tabla `REGISTRO_MANTENIMIENTO`, si un técnico las envía desde la app móvil, no existe destino relacional en la base de datos para persistir sus URLs.

### 3.2 Análisis de la Brecha de Firmas Digitales
* Ni en la tabla `REGISTRO_MANTENIMIENTO` ni en la tabla `INVENTARIO_EQUIPOS` existen campos para registrar la firma digital táctil del técnico responsable ni la del cliente (Coolbox).
* Tampoco existen columnas para registrar la filiación del encargado de tienda (`NOMBRE_ENCARGADO`, `DNI_ENCARGADO`).
* Toda acta o ficha técnica generada por el sistema saldrá forzosamente con el mensaje *"POR ASIGNAR"* en el pie de firmas, perdiendo validez como certificado digital de entrega.

---

## 4. MATRIZ DEL CENSO DE HARDWARE: APP TÉCNICA VS 13 EQUIPOS ESTÁNDAR

### 4.1 La Plantilla Canónica de 13 Dispositivos Estándar
En el sistema administrativo (`Control Coolbox Admin/index.html`, L7091-L7140) y en el backend (`Codigo.gs`, L415-L429), para una tienda típica de 2 cajas registradoras nominales, se define la siguiente dotación canónica obligatoria:

| N° | Dispositivo Canónico | Subsistema | Ubicación Asignada |
|:---:|---|---|---|
| **01** | CPU POS 1 | Punto de Venta | Caja 1 |
| **02** | Monitor POS y Pantalla Táctil POS 1 | Punto de Venta | Caja 1 |
| **03** | Impresora Térmica de Tickets POS 1 | Punto de Venta | Caja 1 |
| **04** | Lector de Código de Barras POS 1 | Punto de Venta | Caja 1 |
| **05** | CPU POS 2 | Punto de Venta | Caja 2 |
| **06** | Monitor POS y Pantalla Táctil POS 2 | Punto de Venta | Caja 2 |
| **07** | Impresora Térmica de Tickets POS 2 | Punto de Venta | Caja 2 |
| **08** | Lector de Código de Barras POS 2 | Punto de Venta | Caja 2 |
| **09** | Switch de Comunicaciones | Infraestructura de Red | Gabinete (Rack) |
| **10** | Router de Conectividad | Infraestructura de Red | Gabinete (Rack) |
| **11** | Impresora Térmica de Backup | Contingencia Operativa | Backup / Almacén |
| **12** | Lector de Código de Barras de Backup | Contingencia Operativa | Backup / Almacén |
| **13** | Estabilizador de Voltaje / PDU | Suministro Energético | Gabinete / Cajas |

---

### 4.2 Comportamiento de la App Móvil de Técnicos (`index.html`)
1. **Captura Libre no Guiada:**
   * La app técnica opera con un botón de ingreso individual (`agregarEquipo()`).
   * No existe una lista de control que informe al técnico: *"Faltan registrar los equipos de Caja 2"* o *"Falta registrar el Switch en el Gabinete"*.
2. **Ambigüedad en Opciones de Selección:**
   * En `index.html` (L1329), la red se engloba bajo una sola opción: `"Switch / Router"`. Si el técnico la selecciona una sola vez, omite uno de los dos equipos físicos.
   * El censo de la app técnica no presenta la opción explícita para monitores secundarios Dell Vta360 o pantallas táctiles principales como equipos independientes si la tienda opera con CPU modular.
3. **Consecuencia en la Ficha Técnica Emitida:**
   * Cuando una tienda pasa a completada, el panel administrativo reemplaza la plantilla teórica por los datos reales ingresados por el técnico.
   * Si la cuadrilla únicamente censó los periféricos de mostrador (ej. 6 o 7 equipos en total), la Ficha Técnica oficial emitida a Coolbox saldrá con vacíos en los ítems de Gabinete y Backup, provocando que la gerencia de Coolbox observe y rechace el servicio.

---

## 5. CUADRO DE EQUIVALENCIAS Y PLAN DE NORMALIZACIÓN

Para resolver de manera definitiva las inconsistencias sin alterar la lógica de negocio, se establece la matriz unificada de mapeo entre el payload de `index.html`, `Codigo.gs` y las hojas reales en disco:

| Dato de Campo | Atributo en `index.html` | Variable en `Codigo.gs` | Columna Destino en Hoja Real |
|---|---|---|---|
| ID de Transacción | Generado por sistema | Generado en servidor | `REGISTRO_MANTENIMIENTO.ID_VISITA` |
| Marca Temporal | Generado por sistema | `new Date()` | `REGISTRO_MANTENIMIENTO.FECHA_HORA` |
| Técnico Responsable | `payload.tecnico` | `datos.tecnico` | `REGISTRO_MANTENIMIENTO.TECNICO` |
| Sede Coolbox | `payload.codigoTienda` | `datos.codigoTienda` | `REGISTRO_MANTENIMIENTO.CODIGO_TIENDA` |
| Limpieza Rack | `payload.gabineteLimpieza` | `datos.gabineteLimpieza` | `REGISTRO_MANTENIMIENTO.GABINETE_LIMPIEZA` |
| Extractores Rack | `payload.gabineteVentiladores` | `datos.gabineteVentiladores`| `REGISTRO_MANTENIMIENTO.GABINETE_VENTILADORES` |
| Suministro PDU | `payload.gabinetePDU` | `datos.gabinetePDU` | `REGISTRO_MANTENIMIENTO.GABINETE_PDU` |
| Foto Rack Antes | `payload.fotoAntesBase64` | Guardar en Drive -> URL | `REGISTRO_MANTENIMIENTO.URL_FOTO_ANTES` |
| Foto Rack Después | `payload.fotoDespuesBase64` | Guardar en Drive -> URL | `REGISTRO_MANTENIMIENTO.URL_FOTO_DESPUES` |
| Notas de Rack | `payload.observacionesGabinete`| `datos.observacionesGabinete`| `REGISTRO_MANTENIMIENTO.OBSERVACIONES_GABINETE`|
| Estado Cómputo | `payload.estacionesMantenimiento`| JSON String de estaciones | `REGISTRO_MANTENIMIENTO.COMPUTO_ESTADO` |
| Notas de Cómputo | `payload.observacionesComputo` | `datos.observacionesComputo` | `REGISTRO_MANTENIMIENTO.OBSERVACIONES_COMPUTO` |
| Activos Censados | `payload.equipos` (Array) | Iteración `appendRow()` | `INVENTARIO_EQUIPOS` (11 columnas exactas) |

---

## 6. CONCLUSIONES DEL DISCOVERY

1. **Las Tablas Reales Existen y Tienen Estructura Óptima:**  
   Los archivos físicos `REGISTRO_MANTENIMIENTO.csv`, `INVENTARIO_EQUIPOS.csv` y `DB_TIENDAS.csv` en el directorio `basedatos/` demuestran que la base de datos fue diseñada con pulcritud técnica y cuenta con las cabeceras exactas para soportar la operación de campo.
2. **El Problema Fundamental Radica en `Codigo.gs`:**  
   El backend alojado en `Codigo.gs` hace referencia a nombres inexistentes (`HISTORIAL_ATENCIONES` e `INVENTARIO_GENERAL`), carece de la función `guardarAtencion()` invocada por el frontend, y sufre una sobreescritura de `doPost(e)` que inhabilita por completo la recepción de datos técnicos.
3. **Oportunidad de Ampliación:**  
   Para que las 8 fotos y las 2 firmas no se pierdan, basta con añadir ordenadamente dichas columnas al final de la hoja `REGISTRO_MANTENIMIENTO`.
4. **Cero Rupturas Durante la Auditoría:**  
   Todos los archivos del proyecto (`index.html`, `Control Coolbox Admin/index.html`, `Codigo.gs` y los CSV) se preservaron intactos en cumplimiento estricto del modo de solo lectura.

---
*Informe técnico de descubrimiento físico elaborado por Antigravity para JSERVICE RV.*
