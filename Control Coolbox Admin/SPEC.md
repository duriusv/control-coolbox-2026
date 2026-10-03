# ESPECIFICACIÓN TÉCNICA FUNCIONAL (SDD)
## Dashboard de Supervisión Operativa, Auditoría de Calidad e Inventario Coolbox 2026
### Sistema de Gestión y Control Gerencial para JSERVICE RV & RASH PERÚ S.R.L.

**Documento de Especificación de Software y Diseño de Arquitectura**  
**Versión:** 1.2.1  
**Fecha de Emisión:** Septiembre 2026  
**Estado:** Aprobado para Construcción y Mantenimiento  
**Metodología:** Specification-Driven Development (SDD)  
**Módulo:** `Control Coolbox Admin/` (Panel de Supervisión)

---

## 1. OBJETIVO DEL SISTEMA Y USUARIOS AUTORIZADOS

### 1.1 Objetivo General
Proveer a la jefatura de operaciones y supervisión técnica de **JSERVICE RV** un centro de control operativo integral, analítico y en tiempo real para auditar, fiscalizar, validar y certificar los mantenimientos preventivos y el censo individual de hardware tecnológico en las **147 tiendas de Coolbox** (RASH PERÚ S.R.L.) distribuidas en Lima Metropolitana, Callao y Provincias (88 Lima / 59 Provincias) durante la campaña 2026.

### 1.2 Misión y Valor Operativo
1. **Visibilidad Centralizada:** Monitorear el progreso porcentual global sobre 147 sedes y el cumplimiento de la ventana de ejecución (15 de septiembre al 20 de noviembre de 2026).
2. **Control de Calidad Fotográfica y Operativa:** Auditar minuciosamente las tareas ejecutadas en cuartos de comunicaciones (racks) y estaciones de punto de venta (POS), verificando el cumplimiento de las políticas de servicio y la prohibición estricta de alteración de cableado.
3. **Auditoría de Activos y Seriales Homologada con Coolbox:** Cotejar equipo por equipo los números de serie y códigos patrimoniales capturados en campo frente al formato oficial de Coolbox (`Inventario_Equipos_Tiendas.xlsx`), discriminando entre **Equipos POS** y **PDAs de Venta Móvil**.
4. **Emisión Inmediata de Actas y Edición de Reportes:** Generar actas ejecutivas estandarizadas y permitir la corrección administrativa de estados en campo mediante el módulo de edición integrada.

### 1.3 Perfiles de Usuario Autorizados
* **Jesús Silva (Supervisión Operativa en Perú - JSERVICE RV):** Monitoreo en terreno, control de rutas y validación presencial en Lima y Provincias.
* **Andrews Berbesia (Jefatura de Operaciones en Venezuela - JSERVICE RV):** Supervisión remota en tiempo real, auditoría de métricas, validación de seriales, control de calidad y emisión de actas de conformidad.

### 1.4 Regla Inviolable de Convivencia y Aislamiento
> [!IMPORTANT]
> **REGLA ESTRICTA DE DIRECTORIO:**
> Todos los archivos ejecutables, de estilo, librerías y componentes del panel de supervisión deben crearse y mantenerse **EXCLUSIVAMENTE** dentro de la carpeta `Control Coolbox Admin/`.
> 
> * El archivo `index.html` de la raíz corresponde a la Web App móvil de los técnicos de campo y debe coordinarse rigurosamente con este estándar.

---

## 2. ARQUITECTURA DE DATOS Y CONECTIVIDAD

El Dashboard de Supervisión opera en modo de **lectura analítica e ingestión reactiva**, conectándose a la base de datos distribuida en Google Sheets y Google Drive.
+-----------------------------------------------------------------------------------------+
|                                GOOGLE WORKSPACE MASTER DB                               |
|                                                                                         |
|  +---------------------+    +---------------------------+    +-----------------------+  |
|  |     DB_TIENDAS      |    |   REGISTRO_MANTENIMIENTO  |    |   INVENTARIO_EQUIPOS  |  |
|  | (147 Sedes Coolbox) |    |  (26 Columnas Canónicas)  |    | (Columnas Extendidas) |  |
|  +---------------------+    +---------------------------+    +-----------------------+  |
+--------------------------------------------|--------------------------------------------+
| (Google Apps Script API / JSON Cache)
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
|  | 1. PANEL DE KPIS     | | 2. BARRA DE FILTROS     | | 3. TABLA CON VISTA POS / PDA |  |
|  +----------------------+ +-------------------------+ +------------------------------+  |
|                                             | (Evento 'Inspeccionar' / 'Editar')        |
|                                             v                                           |
|  +-----------------------------------------------------------------------------------+  |
|  | 4. MODAL DE AUDITORÍA PROFUNDA Y EXPORTADOR OFICIAL EXCEL (HOJAS POS Y PDA)       |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
### 2.1 Esquema de las Tablas de Origen y Homologación con Coolbox
* `DB_TIENDAS`: Catálogo maestro con 147 sedes (`COD_TIENDA`, `NOMBRE_TIENDA`, `CIUDAD`, `ESTADO_ATENCION`).
* `REGISTRO_MANTENIMIENTO`: 26 columnas canónicas de visitas, checklists y evidencias en Drive.
* `INVENTARIO_EQUIPOS`: Tabla ampliada que consolida los datos de campo y alimenta las 2 hojas oficiales de Coolbox:
  1. **Hoja `Inventario POS` (17 Columnas):** `N°`, `COD TIENDA`, `CIUDAD`, `ZONA`, `DIRECCION`, `INVENTARIO`, `EQUIPO`, `HOSTNAME` (opcional si lo solicita el cliente), `MARCA`, `MODELO`, `SERIE`, `COD INVENTARIO`, `ESTADO` (Bueno/Regular/Malo/No existe), `OPERATIVO` (Sí/No), `RESPONSABLE`, `FECHA`, `OBSERVACIONES`.
  2. **Hoja `Inventario PDA` (15 Columnas):** `N°`, `COD TIENDA`, `CIUDAD`, `ZONA`, `DIRECCION`, `EQUIPO` (pre-asignado: PDA01, PDA02...), `MARCA` (SUNMI, SHIJI, HONEYWELL, UNITECH), `MODELO`, `SERIE`, `COD INVENTARIO`, `ANYDESK`, `ANDROID IMEI`, `ESTADO` (OPERATIVO/INOPERATIVO), `RESPONSABLE`, `COMENTARIO`.

---

## 3. DETALLE DE LOS BLOQUES FUNCIONALES

### 3.1 BLOQUE 1: Panel Superior de KPIs
* Progreso general de atención sobre 147 locales, tiendas atendidas (Realizados, Parciales, Pendientes) y hardware auditado.

### 3.2 BLOQUE 2: Barra de Control y Filtros Combinados
* Búsqueda en vivo y filtros por Estado, Técnico y Clasificación de Tienda.

### 3.3 BLOQUE 3: Tabla Interactiva de Seguimiento
* Columnas de control con semáforo técnico y acceso a inspección y edición.

### 3.4 BLOQUE 4: Módulos de Auditoría, Edición y Salida Impresa
* **Modal de Inspección `[👁️ Ver]`:** Ancho máximo fijado en `1140px` sin desbordes, con filtros de categoría `[Todos]`, `[POS]`, `[PDA]`.
* **Módulo de Edición de Reporte:** Permite corregir gabinetes, notas libres y la condición de inventario (`OPERATIVO`, `INOPERATIVO`, `RENOVACION`, `DE BAJA / RETIRADO`), integrando la columna **Red / Soporte** para capturar o rectificar `Hostname` (en CPUs POS) y `AnyDesk` / `Android IMEI` (en PDAs), preservando las 16 columnas canónicas de la base de datos sin pérdida de datos.
* **Ficha Técnica A4 y Acta de Conformidad:** Homologadas para impresión limpia sin desbordes de celdas (`table-layout: fixed !important`), reflejando bajo el nombre de cada dispositivo su `Hostname` (si es POS) o su `AnyDesk` y `Android IMEI` (si es PDA).

### 3.5 BLOQUE 5: Exportación de Censo Oficial de Hardware a Excel
* **Botón `[📥 Exportar Censo Excel]`:** Genera el archivo multi-hoja (`Inventario_Equipos_Tiendas_Coolbox_2026_YYYY-MM-DD.xlsx`) con 3 hojas: `Inventario POS`, `Inventario PDA` y catálogo `PDA`.
* **Filtro Estricto:** Exporta únicamente las tiendas intervenidas (`REALIZADO` o `CONFORME`), protegiendo el catálogo de registros vacíos.
* **Cromática Oficial Homologada (Fidelidad 100% al Cliente):**
  - **Encabezados y Títulos:** Fondo Azul Petróleo Corporativo Coolbox (`#1F4E78`) con tipografía Arial en Blanco Puro (`#FFFFFF`) y negrita.
  - **Fórmulas KPI (Filas 3 y 4):** Fondo Celeste Suave (`#DDEBF7`) con bordes finos.
  - **Columnas de Datos Fijos del Sistema / Tienda:**
    - Hoja `Inventario POS` (Fila 6 hacia abajo): Columnas **A a G** (N°, COD TIENDA, CIUDAD, ZONA, DIRECCIÓN, INVENTARIO, EQUIPO) con fondo **Azul / Celeste Suave (`#DDEBF7`)**.
    - Hoja `Inventario PDA` (Fila 7 hacia abajo): Columnas **A a F** (N°, COD TIENDA, CIUDAD, ZONA, DIRECCIÓN, EQUIPO) con fondo **Azul / Celeste Suave (`#DDEBF7`)**.
  - **Columnas de Captura Técnica / Levantamiento en Campo:**
    - Hoja `Inventario POS`: Columnas **H a Q** (HOSTNAME, MARCA, MODELO, SERIE, COD INVENTARIO, ESTADO, OPERATIVO, RESPONSABLE, FECHA, OBSERVACIONES) con fondo **Crema Pastel (`#FFFFF9E6`)**.
    - Hoja `Inventario PDA`: Columnas **G a O** (MARCA, MODELO, SERIE, COD INVENTARIO, ANYDESK, ANDROID IMEI, ESTADO, RESPONSABLE, COMENTARIO) con fondo **Crema Pastel (`#FFFFF9E6`)**.

---

## 4. SISTEMA DE DISEÑO VISUAL, BADGES Y TIPOGRAFÍA (INMUTABLE)

### 4.1 Reglas Tipográficas Obligatorias
* **Mayúsculas Forzadas:** Todos los textos indicadores de estado (`CONFORME`, `OBSERVADO`, `REALIZADO`, `NO INTERVENIDO`, `DE BAJA`, `OPERATIVO`, `INOPERATIVO`, `RENOVACION`) DEBEN renderizarse estrictamente en **MAYÚSCULAS** (`text-transform: uppercase`).
* **Grosor:** Negrita/semi-negrita consistente (`font-weight: 600` o `700`).

### 4.2 Paleta Cromática Canónica (Cero Desviación)
Queda terminantemente prohibido utilizar colores en línea arbitrarios (ej. `style="color: #28a745"`). Toda etiqueta debe consumir las clases maestras:
* **Éxito (`CONFORME`, `REALIZADO`, `OPERATIVO`):** Fondo `#D1FAE5 !important;`, Texto `#065F46 !important;`, Borde `1px solid #A7F3D0 !important;`.
* **Advertencia (`OBSERVADO`, `PARCIAL`):** Fondo `#FEF3C7 !important;`, Texto `#92400E !important;`, Borde `1px solid #FDE68A !important;`.
* **Neutro (`NO INTERVENIDO`, `PENDIENTE`):** Fondo `#F1F5F9 !important;`, Texto `#475569 !important;`, Borde `1px solid #CBD5E1 !important;`.
* **Crítico (`DE BAJA`, `RETIRADO`, `INOPERATIVO`):** Fondo `#FEE2E2 !important;`, Texto `#991B1B !important;`, Borde `1px solid #FCA5A5 !important;`.

### 4.3 Control de Anchos y Prevención de Desborde
* **Clase Maestra `.badge-status`:** Debe incluir `box-sizing: border-box !important; max-width: 100% !important; white-space: nowrap !important; font-size: 0.65rem !important; padding: 2px 6px !important; border-radius: 4px !important;`.
* **Badge Compacto `.badge-no-intervenido`:** Configurado a `font-size: 0.60rem !important; padding: 1px 4px !important;`.
* **Celdas de Tablas en Informes (.acta-table, .ficha-table):** Columna de estado con ancho protegido de `min-width: 115px !important; width: 15% !important;` para contener `NO INTERVENIDO` sin invadir observaciones.

### 4.4 Limpieza del DOM
* Prohibido renderizar filas estáticas no auditadas en checklists (removida la fila fantasma de `"Switch / Router Inspeccionado"`).