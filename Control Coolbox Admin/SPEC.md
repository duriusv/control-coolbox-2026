# ESPECIFICACIÓN TÉCNICA FUNCIONAL (SDD)
## Dashboard de Supervisión Operativa, Auditoría de Calidad e Inventario Coolbox 2026
### Sistema de Gestión y Control Gerencial para JSERVICE RV & RASH PERÚ S.R.L.

**Documento de Especificación de Software y Diseño de Arquitectura**  
**Versión:** 1.0.0  
**Fecha de Emisión:** Septiembre 2026  
**Estado:** Especificación Base Aprobada para Desarrollo  
**Metodología:** Specification-Driven Development (SDD)  
**Módulo:** `Control Coolbox Admin/` (Panel de Supervisión)

---

## 1. OBJETIVO DEL SISTEMA Y USUARIOS AUTORIZADOS

### 1.1 Objetivo General
Proveer a la jefatura de operaciones y supervisión técnica de **JSERVICE RV** un centro de control operativo integral, analítico y en tiempo real para auditar, fiscalizar, validar y certificar los mantenimientos preventivos y el censo individual de hardware tecnológico en las **140 tiendas de Coolbox** (RASH PERÚ S.R.L.) distribuidas en Lima Metropolitana, Callao y Provincias durante la campaña 2026.

### 1.2 Misión y Valor Operativo
1. **Visibilidad Centralizada:** Monitorear el progreso porcentual global y el cumplimiento de la ventana de ejecución (15 de septiembre al 20 de noviembre de 2026).
2. **Control de Calidad Fotográfica y Operativa:** Auditar minuciosamente las tareas ejecutadas en cuartos de comunicaciones (racks) y estaciones de punto de venta (POS), verificando el cumplimiento de las políticas de servicio y la prohibición estricta de alteración de cableado.
3. **Auditoría de Activos y Seriales:** Cotejar equipo por equipo los números de serie y códigos patrimoniales capturados en campo frente a los estándares de equipamiento por tipo de tienda.
4. **Emisión Inmediata de Actas:** Generar actas ejecutivas estandarizadas listas para ser despachadas por correo electrónico a la gerencia de Coolbox / RASH Perú con un solo clic.

### 1.3 Perfiles de Usuario Autorizados
* **Jesús Silva (Supervisión Operativa en Perú - JSERVICE RV):**
  * *Ubicación:* Lima / Despliegue en rutas nacionales de Perú.
  * *Dispositivos:* Laptop corporativa y Tablet de supervisión en terreno ($\ge 1024\text{px}$).
  * *Funciones:* Monitoreo de cuadrillas en campo, fiscalización presencial, resolución de incidencias en locales críticos y validación de aperturas/cierres de turno técnico.
* **Andrews Berbesia (Jefatura de Operaciones en Venezuela - JSERVICE RV):**
  * *Ubicación:* Remoto (Venezuela).
  * *Dispositivos:* Estación de trabajo Desktop multimonitor ($\ge 1280\text{px}$).
  * *Funciones:* Auditoría de telemetría y datos en tiempo real, revisión de evidencias fotográficas Antes/Después, validación de seriales de hardware, emisión de veredictos técnicos (Conforme / Observado) y despacho de actas formales de entrega a Coolbox.
* **Stakeholders Gerenciales (Coolbox / RASH Perú):**
  * Destinatarios de las actas ejecutivas generadas por el sistema y visualizadores de reportes consolidados.

### 1.4 Regla Inviolable de Convivencia y Aislamiento
> [!IMPORTANT]
> **REGLA ESTRICTA DE DIRECTORIO:**
> Todos los archivos ejecutables, de estilo, librerías y componentes del panel de supervisión deben crearse y mantenerse **EXCLUSIVAMENTE** dentro de la carpeta `Control Coolbox Admin/`.
> 
> * El archivo `index.html` ubicado en la raíz del repositorio corresponde a la aplicación web móvil de las cuadrillas de campo y **NO DEBE SER TOCADO NI MODIFICADO BAJO NINGUNA CIRCUNSTANCIA**.
> * El archivo de especificación de campo `spec.md` en la raíz permanece intacto.

---

## 2. ARQUITECTURA DE DATOS Y CONECTIVIDAD

El Dashboard de Supervisión opera en modo de **lectura analítica e ingestión reactiva**, conectándose a la base de datos distribuida en Google Sheets y Google Drive.

```
+-----------------------------------------------------------------------------------------+
|                                GOOGLE WORKSPACE MASTER DB                               |
|                                                                                         |
|  +---------------------+    +---------------------------+    +-----------------------+  |
|  |     DB_TIENDAS      |    |   HISTORIAL_ATENCIONES    |    |   INVENTARIO_GENERAL  |  |
|  | (140 Sedes Coolbox) |    |  (Checklists y Fotos URL) |    |  (Seriales Censados)  |  |
|  +---------------------+    +---------------------------+    +-----------------------+  |
+--------------------------------------------|--------------------------------------------+
                                             | (Google Apps Script API / JSON Mock Cache)
                                             v
+-----------------------------------------------------------------------------------------+
|                               CONTROL COOLBOX ADMIN DASHBOARD                           |
|                                                                                         |
|  [ Gestor de Estado y Cache en Memoria: Window.AppState ]                               |
|  - Carga única inicial (Hydration)                                                      |
|  - Relación relacional client-side por COD_TIENDA                                       |
|  - Motor de filtrado y búsqueda instantáneo (< 50ms)                                    |
|                                                                                         |
|  +----------------------+ +-------------------------+ +------------------------------+  |
|  | 1. PANEL DE KPIS     | | 2. BARRA DE FILTROS     | | 3. TABLA DE SEGUIMIENTO      |  |
|  +----------------------+ +-------------------------+ +------------------------------+  |
|                                             | (Evento 'Inspeccionar')                   |
|                                             v                                           |
|  +-----------------------------------------------------------------------------------+  |
|  | 4. MODAL DE AUDITORÍA PROFUNDA (Detalle, Seriales, Fotos Duales, Generador Acta)  |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### 2.1 Esquema de las Tablas de Origen (Google Sheets)

#### Hoja 1: `DB_TIENDAS` (Catálogo Maestro y Estado de Tienda)
Actúa como la dimensión maestra de sedes:
* `COD_TIENDA` (String, PK): Identificador oficial (ej. `T001`, `T042`, `T140`).
* `NOMBRE_TIENDA` (String): Denominación de la sede (ej. `Coolbox Jockey Plaza`, `Coolbox Real Plaza Trujillo`).
* `REGION` (Enum): `LIMA`, `CALLAO`, `PROVINCIA`.
* `CIUDAD` (String): Ciudad geográfica (ej. `Lima`, `Arequipa`, `Cusco`, `Chiclayo`, `Piura`).
* `DIRECCION` (String): Dirección fiscal / física del centro comercial o local.
* `CANT_CAJAS` (Integer): Cantidad nominal de puntos de venta (POS) registrados en tienda (ej. 2, 3, 5).
* `CLASIFICACION` (Enum): Categorización comercial de Coolbox:
  * `ORO`: Tiendas flagship y de mayor volumen transaccional (15% del total).
  * `PLATINO`: Tiendas medianas en centros comerciales consolidados (50% del total).
  * `BRONCE`: Tiendas modulares, express o puerta a la calle (35% del total).
* `ESTADO_MANT` (Enum): `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`.
* `FECHA_EJECUCION` (String/Date): Fecha de la intervención técnica (`YYYY-MM-DD`).
* `TECNICO_LIDER` (String): Técnico titular asignado por JSERVICE RV.

#### Hoja 2: `HISTORIAL_ATENCIONES` (Mantenimiento de Gabinete y Cómputo)
Almacena el registro técnico de la intervención:
* `ID_MANTENIMIENTO` (String, PK): Código transaccional (ej. `MNT-T001-20260918-01`).
* `TIMESTAMP` (ISO 8601): Marca temporal del reporte.
* `COD_TIENDA` (String, FK -> `DB_TIENDAS.COD_TIENDA`).
* `TECNICO_RESPONSABLE` (String): Técnico que ejecutó y cerró el módulo.
* `GABINETE_INSPECCION` (Boolean): Verificación de inspección visual y soplado físico.
* `GABINETE_PDU` (Boolean): Verificación de energía y tomacorrientes estabilizados.
* `GABINETE_EXTRACTORES` (Boolean): Estado operativo de los extractores de aire.
* `FOTO_ANTES_URL` (String, URL): Enlace seguro al archivo en Google Drive (`Gabinete_Antes`).
* `FOTO_DESPUES_URL` (String, URL): Enlace seguro al archivo en Google Drive (`Gabinete_Despues`).
* `COMPUTO_CHECKLIST` (JSON String): Detalle por cada CPU/AIO (desarme, soplado, encendido).
* `TICKETERAS_CHECKLIST` (JSON String): Detalle de ticketeras Epson/Bixolon (cabezal, rodillo, prueba).
* `PERIFERICOS_CHECKLIST` (JSON String): Detalle de gavetas, huelleros, lectores y terminales PDA.
* `OBSERVACIONES_TECNICO` (Text): Hallazgos reportados por la cuadrilla en campo.
* `ESTADO_AUDITORIA` (Enum): `CONFORME`, `OBSERVADO`, `PENDIENTE_AUDITORIA`.
* `OBSERVACIONES_SUPERVISOR` (Text): Notas registradas por Andrews Berbesia o Jesús Silva.

#### Hoja 3: `INVENTARIO_GENERAL` (Censo Individual de Activos de Hardware)
Almacena cada pieza tecnológica registrada de forma individual (1 a 1):
* `ID_INVENTARIO` (String, PK): Identificador único de registro (ej. `INV-T001-0001`).
* `COD_TIENDA` (String, FK -> `DB_TIENDAS.COD_TIENDA`).
* `TIMESTAMP_REGISTRO` (ISO 8601): Fecha y hora del escaneo individual.
* `TIPO_EQUIPO` (Enum): `CPU`, `ALL-IN-ONE`, `MONITOR`, `TICKETERA`, `PDA`, `LECTOR_BARRAS`, `GAVETA`, `HUELLERO`, `SWITCH`, `ROUTER`, `ESTABILIZADOR`.
* `MARCA` (String): Fabricante (ej. `Epson`, `Sunmi`, `HP`, `Lenovo`, `Bixolon`, `Honeywell`, `Cisco`).
* `MODELO` (String): Modelo homologado (ej. `TM-T20III`, `V2 Pro`, `ProDesk 400`, `SRP-330`).
* `NUMERO_SERIE` (String): Serial de fábrica único del hardware.
* `CODIGO_INVENTARIO` (String): Código patrimonial interno de Coolbox (etiqueta de barra/QR).
* `UBICACION_CAJA` (String): Ubicación física (ej. `Caja 1`, `Caja 2`, `Backoffice`, `Almacén/Backup`, `Rack`).
* `CONDICION_OPERATIVA` (Enum): `OPERATIVO`, `INOPERATIVO`, `OBSOLETO / PARA BAJA`.
* `METODO_CAPTURA` (Enum): `SCAN_CAMARA`, `MANUAL`.
* `TECNICO_REGISTRO` (String): Técnico que realizó la lectura.

### 2.2 Estrategia Dual de Conexión (Modo GAS vs Modo Mock Standalone)
Para garantizar desarrollo ágil, pruebas unitarias locales y despliegue autónomo sin dependencias externas bloqueantes:
1. **Modo GAS Integrado (`google.script.run`):** Cuando la aplicación corre bajo el contenedor de Google Apps Script, invoca la función RPC del servidor `apiGetDashboardSupervisorData()` que retorna las tres hojas en un solo payload comprimido.
2. **Modo Standalone / Demo de Alta Fidelidad:** Cuando se ejecuta localmente en navegador web o sin conexión activa a Apps Script, el dashboard carga un dataset sintético exhaustivo de las 140 tiendas de Coolbox con estadísticas reales, asegurando que Jesús Silva y Andrews Berbesia puedan auditar la interfaz y validar flujos en cualquier circunstancia.

---

## 3. DETALLE DE LOS 4 BLOQUES FUNCIONALES DEL DASHBOARD

El diseño del panel se estructura en 4 bloques claramente delimitados y sincronizados mediante un gestor de eventos reactivo en cliente.

```
+----------------------------------------------------------------------------------------------------+
|  [NAVBAR SUPERIOR]  CONTROL COOLBOX ADMIN | JSERVICE RV         [Última Sync: 14:35] [Actualizar]   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [BLOQUE 1: PANEL SUPERIOR DE KPIS]                                                                |
|  +--------------------+ +--------------------+ +--------------------+ +-------------------------+  |
|  | PROGRESO GENERAL   | | TIENDAS ATENDIDAS  | | HARDWARE CENSADO   | | CALIDAD OPERATIVA       |  |
|  | 64.3% (90 / 140)   | | 90 Comp | 12 Proc  | | 1,420 Equipos      | | 94.4% Conformes         |  |
|  | [===========-----] | | 38 Pendientes      | | 410 POS | 280 Tick | | 85 Conforme | 5 Observ  |  |
|  +--------------------+ +--------------------+ +--------------------+ +-------------------------+  |
|                                                                                                    |
|  [BLOQUE 2: BARRA DE CONTROL DE BÚSQUEDA Y FILTROS COMBINADOS]                                     |
|  +----------------------------------------------------------------------------------------------+  |
|  | [🔍 Buscar tienda, código, técnico...] [Técnico: Todos v] [Ciudad: Todas v] [Clasif: Todas v] |  |
|  | [Estado: Todos v]                              [Limpiar Filtros]  Mostrando: 90 de 140 tiendas  |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  [BLOQUE 3: TABLA INTERACTIVA DE SEGUIMIENTO OPERATIVO]                                            |
|  +-------+----------------------------+-----------+---------+----------------+------------+-----+  |
|  | CÓD.  | TIENDA                     | CIUDAD    | CLASIF. | TÉCNICO        | FECHA      | AUD |  |
|  +-------+----------------------------+-----------+---------+----------------+------------+-----+  |
|  | T001  | Coolbox Jockey Plaza       | Lima      | [ORO]   | Juan Pérez     | 2026-09-18 | [✓] |  |
|  | T002  | Coolbox Real Plaza Truj... | Trujillo  | [PLAT]  | Carlos Gómez   | 2026-09-19 | [✓] |  |
|  | T014  | Coolbox Mall Aventura S... | Arequipa  | [ORO]   | Roberto Díaz   | 2026-09-20 | [!] |  |
|  +-------+----------------------------+-----------+---------+----------------+------------+-----+  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 3.1 BLOQUE 1: Panel Superior de KPIs Ejecutivos

Este bloque sintetiza la salud global del proyecto y provee métricas directas para la toma de decisiones gerenciales.

#### KPI 1.1: Progreso General de Cobertura
* **Cálculo:** $\frac{\text{Tiendas Completadas}}{140} \times 100$.
* **Componentes:**
  * Porcentaje numérico en tipografía destacada ($32\text{px}$, `#0A2540`).
  * Indicador de razón: `X / 140 Tiendas`.
  * Barra de progreso con gradiente corporativo (del Azul `#0A2540` al Rojo `#E31B23`).
  * Badge de proyección temporal indicando días restantes en el cronograma oficial (Septiembre 15 - Noviembre 20, 2026).

#### KPI 1.2: Tiendas Atendidas vs Pendientes
* **Cálculo:** Desglose del total según `ESTADO_MANT`.
* **Componentes:**
  * **Completadas:** Conteo en verde (`#10B981`) con icono de verificación.
  * **En Proceso:** Conteo en azul (`#2563EB`) con indicador pulsante.
  * **Pendientes:** Conteo en gris neutro (`#64748B`).
  * Micrográfico de barras apiladas proporcional al total.

#### KPI 1.3: Conteo Total de Hardware Censado
* **Cálculo:** $\sum \text{Registros en INVENTARIO\_GENERAL}$.
* **Componentes:**
  * Número total absoluto de equipos inventariados (ej. `1,420`).
  * Sub-métricas por categorías clave:
    * CPUs / All-in-One: `X unidades`.
    * Ticketeras Epson / Bixolon: `Y unidades`.
    * Terminales PDAs (Sunmi/Histone/Honeywell/Unitech): `Z unidades`.
    * Periféricos (Gavetas, Lectores, Huelleros): `W unidades`.

#### KPI 1.4: Índice de Calidad Operativa y Auditoría
* **Cálculo:** $\frac{\text{Tiendas Conformes}}{\text{Tiendas Atendidas}} \times 100$.
* **Componentes:**
  * Porcentaje de conformidad técnica.
  * Contador de Tiendas Conformes (Badge Verde `#10B981`).
  * Contador de Tiendas Observadas (Badge Rojo Coolbox `#E31B23` o Ámbar `#F59E0B`).
  * Alerta de atención prioritaria para Andrews Berbesia sobre tiendas pendientes de subsanación.

---

### 3.2 BLOQUE 2: Barra de Control de Búsqueda y Filtros Combinados

Permite al supervisor filtrar y segmentar las 140 tiendas de forma instantánea mediante combinación booleana (`AND`) de filtros reactivos.

#### Controles Funcionales:
1. **Buscador Universal en Vivo:**
   * Campo de texto con icono de lupa y botón de borrado rápido.
   * Filtrado en tiempo real con debounce de 150 ms.
   * Coincidencia insensible a mayúsculas/minúsculas y tildes sobre: `COD_TIENDA`, `NOMBRE_TIENDA`, `DIRECCION` y `TECNICO_RESPONSABLE`.
2. **Selector de Técnico Responsable:**
   * Menú desplegable poblado dinámicamente con los nombres de todos los técnicos presentes en la base de datos + opción por defecto `"Todos los Técnicos"`.
3. **Selector de Ciudad / Región:**
   * Dropdown jerárquico o clasificado:
     * `"Todas las Ciudades"`
     * `"Lima Metropolitana y Callao"`
     * `"Provincias"` (con desglose individual: Arequipa, Trujillo, Chiclayo, Cusco, Piura, Huancayo, etc.).
4. **Selector de Clasificación de Tienda:**
   * Selector por categorías de Coolbox:
     * `"Todas las Clasificaciones"`
     * `"Oro (Flagship / Alto Tráfico)"`
     * `"Platino (Centros Comerciales)"`
     * `"Bronce (Express / Puerta a Calle)"`
5. **Selector de Estado de Auditoría / Mantenimiento:**
   * `"Todos los Estados"`
   * `"Completadas - Conformes"`
   * `"Completadas - Observadas"`
   * `"En Proceso"`
   * `"Pendientes"`
6. **Controles de Utilidad y Resumen:**
   * Botón `"Limpiar Filtros"` (resetea todos los selectores a sus valores por defecto).
   * Contador de resultados visibles: `"Mostrando 42 de 140 tiendas"`.

---

### 3.3 BLOQUE 3: Tabla Interactiva de Seguimiento Operativo

Presenta la lista tabulada de las 140 tiendas con ordenamiento interactivo y feedback visual inmediato.

#### 3.3.1 Estructura de Columnas:
1. **Código:** Badge tipográfico monoespaciado (ej. `T001`, `T086`).
2. **Nombre de Tienda:** Nombre oficial con truncado inteligente y tooltip con dirección completa.
3. **Ciudad / Región:** Ciudad con badge sutil indicando si es Lima o Provincia.
4. **Clasificación:** Badge con diseño distintivo:
   * **Oro:** Fondo ámbar suave `#FEF3C7`, borde `#FDE68A`, texto `#B45309`.
   * **Platino:** Fondo slate suave `#F1F5F9`, borde `#E2E8F0`, texto `#475569`.
   * **Bronce:** Fondo naranja suave `#FFEDD5`, borde `#FED7AA`, texto `#C2410C`.
5. **Técnico Responsable:** Nombre del técnico de JSERVICE RV.
6. **Fecha de Atención:** Fecha con formato amigable (`DD/MM/AAAA`) o badge `"Sin Atender"`.
7. **Equipos Censados:** Contador numérico total de activos registrados en la tienda vs cantidad esperada según cajas nominales.
8. **Estado Mantenimiento:** Badge de estatus (`PENDIENTE` en gris, `EN PROCESO` en azul, `COMPLETADO` en verde).
9. **Estado Auditoría:**
   * **Conforme:** Badge verde con icono de check (`✓ Conforme`).
   * **Observado:** Badge rojo Coolbox con icono de advertencia (`⚠ Observado`).
   * **Por Auditar:** Badge gris neutro (`Pendiente`).
10. **Acción Principal:** Botón de acción con estilo corporativo `"Auditar"` / `"Inspeccionar"` con icono de ojo/lupa que dispara el Bloque 4 (Modal de Auditoría Profunda).

#### 3.3.2 Interactividad y Usabilidad de la Tabla:
* **Ordenamiento por Columnas:** Clic en cualquier encabezado (Código, Tienda, Ciudad, Clasificación, Fecha, Equipos, Estado) para alternar orden ascendente / descendente con indicador visual de flecha.
* **Hover State:** Fila iluminada sutilmente al pasar el cursor para facilitar lectura horizontal.
* **Paginación / Scroll Optimizada:** Capacidad de alternar entre vista paginada (25, 50, 100 tiendas) o vista continua optimizada con scroll vertical.

---

### 3.4 BLOQUE 4: Modal de Auditoría Profunda (Deep Inspection Drawer / Modal)

El modal de auditoría es la herramienta central para que **Andrews Berbesia** y **Jesús Silva** examinen cada detalle de una tienda antes de certificar su conformidad. Se despliega como un overlay modal amplio sobre la pantalla con soporte para cierre mediante tecla `Escape` o clic en fondo oscuro.

```
+----------------------------------------------------------------------------------------------------+
|  AUDITORÍA TÉCNICA: [T001] Coolbox Jockey Plaza                        [Clasif: ORO]  [CERRAR (X)] |
|  Técnico: Juan Pérez | Fecha: 18/09/2026 14:30 | Estado Auditoría: [✓ CONFORME]                    |
+----------------------------------------------------------------------------------------------------+
|  [SUB-BLOQUE A: INFO LOCAL]              [SUB-BLOQUE B: TAREAS GABINETE & CÓMPUTO]                 |
|  - Dirección: Av. Javier Prado Este 4200 - [✓] Soplado Rack      - [✓] CPU / AIO Limpieza          |
|  - Cajas registradoras: 3                - [✓] Revisión PDU      - [✓] Ticketeras TM-T20III        |
|  - Total Hardware Censado: 14 equipos    - [✓] Extractores OK    - [✓] Lectores y Gavetas          |
|                                          - [🚫] CABLEADO: Sin peinado (Cumple Regla de Oro)        |
+----------------------------------------------------------------------------------------------------+
|  [SUB-BLOQUE C: HARDWARE CENSADO (1 A 1)]                                                          |
|  [🔍 Filtrar serial...]                                                                            |
|  Tipo        Marca     Modelo       Serial (S/N)     Cód. Inventario   Ubicación    Condición      |
|  CPU         HP        ProDesk 400  X9ZZ123456       ACT-CBX-998822    Caja 1       OPERATIVO      |
|  Ticketera   Epson     TM-T20III    55A8812390       ACT-CBX-441102    Caja 1       OPERATIVO      |
|  PDA         Sunmi     V2 Pro       SM-992140        ACT-CBX-112233    Almacén      OPERATIVO      |
+----------------------------------------------------------------------------------------------------+
|  [SUB-BLOQUE D: VISOR DE FOTOS ANTES Y DESPUÉS]                                                    |
|  +---------------------------------------+  +---------------------------------------+              |
|  |           GABINETE ANTES              |  |           GABINETE DESPUÉS            |              |
|  |      [Imagen con zoom al clic]        |  |      [Imagen con zoom al clic]        |              |
|  |  [Abrir en Google Drive ↗]            |  |  [Abrir en Google Drive ↗]            |              |
|  +---------------------------------------+  +---------------------------------------+              |
+----------------------------------------------------------------------------------------------------+
|  [SUB-BLOQUE E: DICTAMEN DE SUPERVISIÓN]                                                           |
|  Veredicto: (•) Conforme   ( ) Observado                                                           |
|  Observaciones Supervisor: [Gabinete en perfecto estado. Todos los seriales coinciden con POS.   ] |
+----------------------------------------------------------------------------------------------------+
|  [SUB-BLOQUE F: GENERADOR DE ACTA EJECUTIVA]                                                       |
|  [📋 Vista Previa del Acta para Correo]         [✉️ COPIAR ACTA AL PORTAPAPELES PARA ENVÍO]         |
+----------------------------------------------------------------------------------------------------+
```

#### Sub-bloque A: Información del Local y Parámetros Operativos
* Código de tienda y denominación oficial.
* Ubicación física, centro comercial, región y ciudad.
* Cuadrilla técnica asignada y fecha/hora exacta del cierre de atención.
* Comparativa entre cajas POS declaradas en catálogo vs cantidad de puestos auditados.

#### Sub-bloque B: Auditoría de Tareas de Gabinete y Cómputo
* Checklists específicos de gabinete:
  * Inspección física y soplado del switch/router/bandejas.
  * Verificación de energía y tomacorrientes estabilizados en PDU.
  * Estado de ventiladores / extractores de aire.
  * **Verificación de Regla de Oro:** Confirmación de no-alteración ni peinado de cables de red.
* Checklists de cómputo y periféricos:
  * Desarme y soplado de estaciones de trabajo (CPU / All-in-One).
  * Mantenimiento de ticketeras térmicas homologadas (**Epson TM-T20II/III/IV, Bixolon SRP-330/350**), limpieza de cabezal y rodillo con alcohol isopropílico.
  * Mantenimiento de periféricos: gavetas RJ11/12, lectores ópticos, lectores biométricos (huelleros) y terminales móviles PDA (**Sunmi, Histone, Honeywell, Unitech**).
* Observaciones técnicas del personal de campo.

#### Sub-bloque C: Listado Detallado de Hardware Censado (1 a 1)
* Tabla interactiva interna con todos los equipos censados en la sede.
* Columnas: `Tipo de Equipo`, `Marca`, `Modelo`, `Número de Serie (S/N)`, `Código de Inventario`, `Ubicación Física` y `Condición Operativa`.
* Buscador local instantáneo dentro del modal para ubicar rápidamente cualquier serial o código de activo.
* Badges de condición: `OPERATIVO` (Verde), `INOPERATIVO` (Rojo), `OBSOLETO / BAJA` (Ámbar).

#### Sub-bloque D: Visor de Fotos de Evidencia (Antes y Después)
* Visualización comparativa lado a lado (Side-by-Side) de las dos fotografías obligatorias:
  1. `Gabinete Antes` (Estado inicial previo al soplado).
  2. `Gabinete Después` (Estado final de limpieza).
* Interacción con Lightbox: Al hacer clic en cualquiera de las miniaturas, se abre un visor ampliado a pantalla completa con zoom para examinar detalles de polvo, conectores y estado de equipos.
* Enlace directo seguro: Botón para abrir el archivo original alojado en Google Drive.

#### Sub-bloque E: Control de Dictamen de Supervisión
* Selector de Veredicto Operativo:
  * `Conforme`: Certifica que el mantenimiento y el inventario cumplen todos los estándares de JSERVICE RV y Coolbox.
  * `Observado`: Registra una disconformidad técnica (fotos deficientes, serial faltante, falta de limpieza, etc.) para que la cuadrilla en campo subsane.
* Campo de texto enriquecido para ingresar observaciones del supervisor (guardado local o sincronizado con Google Sheets).

#### Sub-bloque F: Generador de Acta Ejecutiva para Correo
* Permite a Andrews Berbesia o Jesús Silva generar con un solo clic el acta de entrega formal en formato estructurado para enviar por correo electrónico a la jefatura de RASH Perú / Coolbox.
* **Estructura Estándar del Acta Generada:**
  ```text
  ASUNTO: [JSERVICE RV - COOLBOX 2026] Acta de Mantenimiento Preventivo e Inventario - {NOMBRE_TIENDA} ({COD_TIENDA})

  Estimado equipo de Operaciones Coolbox (RASH PERÚ S.R.L.),
  
  Por medio de la presente, JSERVICE RV certifica la culminación y auditoría de los trabajos de Mantenimiento Preventivo e Inventario Anual de Hardware en la sede indicada:
  
  1. DATOS DE LA SEDE Y ATENCIÓN:
     - Tienda: {NOMBRE_TIENDA} ({COD_TIENDA})
     - Clasificación: {CLASIFICACION}
     - Ciudad / Región: {CIUDAD} ({REGION})
     - Técnico Responsable: {TECNICO_RESPONSABLE} (JSERVICE RV)
     - Fecha y Hora de Ejecución: {FECHA_EJECUCION}
     - Veredicto de Supervisión: {ESTADO_AUDITORIA}
  
  2. AUDITORÍA DE GABINETE DE COMUNICACIONES (RACK):
     - Soplado e Inspección Física: {GABINETE_INSPECCION_TXT}
     - Verificación Eléctrica PDU: {GABINETE_PDU_TXT}
     - Estado de Extractores: {GABINETE_EXTRACTORES_TXT}
     - Política de Cableado: Conforme (Sin alteración de patch cords)
     - Registro Fotográfico: Antes y Después validados en Google Drive.
  
  3. AUDITORÍA DE EQUIPOS DE PUNTO DE VENTA Y ADMINISTRACIÓN:
     - Estaciones de Cómputo (CPU / AIO): Conforme
     - Ticketeras Térmicas (Epson / Bixolon): Conforme (Cabezal y tracción limpios)
     - Periféricos (Gavetas, Lectores, Huelleros, PDAs): Conforme
  
  4. RESUMEN DE CENSO TECNOLÓGICO INDIVIDUAL:
     - Total de Activos Inventariados: {TOTAL_EQUIPOS} equipos
     - Detalle por Categoría:
       * CPUs / All-in-One: {CANT_CPUS}
       * Ticketeras: {CANT_TICKETERAS}
       * PDAs: {CANT_PDAS}
       * Periféricos y Comunicaciones: {CANT_OTROS}
  
  5. OBSERVACIONES GENERALES DE SUPERVISIÓN:
     {OBSERVACIONES_SUPERVISOR}
  
  Atentamente,
  Supervisión Operativa JSERVICE RV
  Supervisores: Andrews Berbesia / Jesús Silva
  Sistema de Control Coolbox 2026
  ```
* **Botón de Copiado Rápido:** Copia el texto directamente al portapapeles del sistema operativo (`navigator.clipboard.writeText`) y muestra una notificación visual toast de éxito.

---

## 4. IDENTIDAD VISUAL Y DIRECTRICES DE DISEÑO

### 4.1 Especificación Exacta de Colores
* **Azul Medianoche Institucional:** `#0A2540` (Headers, títulos mayores, botones primarios).
* **Acento Rojo Coolbox:** `#E31B23` (Acciones de alerta, marcas de observado, badges urgentes).
* **Fondo Neutro Analítico:** `#F8FAFC` (Lienzo principal de la aplicación).
* **Superficies de Tarjetas:** `#FFFFFF` (Cards de KPIs, contenedor de tabla y modal).
* **Bordes y Delimitadores:** `#E2E8F0` / `#CBD5E1`.
* **Texto Primario:** `#0F172A` (Alta legibilidad y contraste).
* **Texto Secundario:** `#64748B` (Metadatos, etiquetas y subtítulos).
* **Semáforo Operativo:**
  * Verde Conforme: `#10B981` (Fondo `#ECFDF5`, Texto `#065F46`).
  * Rojo Observado: `#E31B23` (Fondo `#FEF2F2`, Texto `#991B1B`).
  * Ámbar Alerta: `#F59E0B` (Fondo `#FFFBEB`, Texto `#92400E`).
  * Azul En Proceso: `#2563EB` (Fondo `#EFF6FF`, Texto `#1E40AF`).

### 4.2 Tipografía y Espaciado
* **Familia Tipográfica:** Fuentes del sistema de alta resolución: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
* **Escala Modular:**
  * Títulos de Bloque: `20px` / `Font-weight: 700`.
  * KPIs Grandes: `32px` / `Font-weight: 800`.
  * Encabezados de Tabla: `12px` / `Font-weight: 600` / `Text-transform: uppercase`.
  * Celdas de Datos: `13px` / `14px` / `Font-weight: 400-500`.
  * Badges y Chips: `11px` / `Font-weight: 600`.

### 4.3 Adaptabilidad Desktop & Tablet
* **Desktop ($\ge 1280\text{px}$):** Contenedor centralizado con ancho máximo de $1440\text{px}$, disposición de 4 tarjetas de KPIs en una sola fila (`grid-template-columns: repeat(4, 1fr)`).
* **Tablet Horizontal ($\ge 1024\text{px}$):** Disposición de 4 tarjetas de KPIs en 2 filas de 2 columnas (`grid-template-columns: repeat(2, 1fr)`), tabla con scroll horizontal suave si es necesario y modal al 95% del viewport.

---

## 5. CRITERIOS DE ACEPTACIÓN (BDD / GHERKIN)

### CA-01: Aislamiento Estricto de Archivos
* **Dado** que se desarrolla la solución de administración y supervisión,
* **Cuando** se generen o modifiquen archivos,
* **Entonces** todos los cambios deben estar contenidos exclusivamente en el directorio `Control Coolbox Admin/`,
* **Y** el archivo `index.html` de la raíz del repositorio no debe sufrir ninguna modificación.

### CA-02: Consistencia de los KPIs Ejecutivos
* **Dado** un conjunto de datos cargado de 140 tiendas,
* **Cuando** el panel inicializa,
* **Entonces** la suma de tiendas completadas, en proceso y pendientes debe ser exactamente igual a 140,
* **Y** el porcentaje de progreso global debe calcularse con 1 decimal de precisión,
* **Y** el total de hardware censado debe corresponder a la suma exacta de los registros de inventario.

### CA-03: Búsqueda y Filtrado Instantáneo Combinado
* **Dado** que el usuario ingresa un término de búsqueda o selecciona un técnico, ciudad o clasificación,
* **Cuando** cambia el valor de cualquier filtro,
* **Entonces** la tabla de seguimiento debe actualizarse en menos de 100 milisegundos,
* **Y** el contador de resultados visibles debe reflejar con exactitud la cantidad de tiendas coincidentes.

### CA-04: Inspección en Modal de Auditoría
* **Dado** que el usuario hace clic en el botón "Inspeccionar" de una tienda,
* **Cuando** el modal se despliega,
* **Entonces** debe presentar la información general del local, los checklists de gabinete y cómputo, la tabla con cada serial censado y el visor comparativo de fotos Antes y Después,
* **Y** si se presiona la tecla `Escape` o el botón de cierre, el modal debe cerrarse limpiamente sin perder la posición de scroll de la tabla principal.

### CA-05: Generación y Copiado de Acta para Correo
* **Dado** que el supervisor inspecciona una tienda y hace clic en "Copiar Acta al Portapapeles",
* **Cuando** se ejecuta la acción,
* **Entonces** el sistema debe formatear el texto completo del acta con todos los datos dinámicos de la tienda seleccionada,
* **Y** copiarlo exitosamente en el portapapeles del sistema operativo,
* **Y** mostrar una notificación toast de confirmación en pantalla.

---

## 6. PLAN DE VALIDACIÓN Y PRUEBAS

| Fase de Prueba | Alcance | Criterio de Éxito |
|---|---|---|
| **Prueba 1: Integridad de Archivos** | Inspección del árbol de directorios de git. | Cero archivos modificados en la raíz; 100% de cambios en `Control Coolbox Admin/`. |
| **Prueba 2: Precisión Matemática de KPIs** | Validación de fórmulas sobre dataset de 140 tiendas. | $Completadas + En Proceso + Pendientes = 140$; Hardware total coincide con ítems de inventario. |
| **Prueba 3: Reactividad de Filtros** | Búsqueda por texto y selección cruzada de filtros. | Renderizado en $< 100\text{ms}$; ausencia de parpadeos o bloqueos de UI. |
| **Prueba 4: Despliegue del Modal** | Apertura y cierre en múltiples tiendas con diferentes estatus. | Presentación fidedigna de checklists, seriales y visor fotográfico. |
| **Prueba 5: Copiado de Acta** | Verificación del contenido en portapapeles. | Texto estructurado sin variables sin resolver (`undefined` o `NaN`). |
| **Prueba 6: Ergonomía Desktop/Tablet** | Verificación en resoluciones $1024\text{px}$, $1366\text{px}$ y $1920\text{px}$. | Diseño fluido, tipografía legible y controles táctiles confortables. |
