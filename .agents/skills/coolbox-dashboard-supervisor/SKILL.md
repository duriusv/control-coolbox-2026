---
name: coolbox-dashboard-supervisor
description: Especialista en arquitectura de paneles de control operativo, métricas de mantenimiento, estandarización de interfaz y censo de hardware para JSERVICE RV y Coolbox.
---

# Coolbox Dashboard Supervisor — Especialista en Monitoreo y Auditoría Operativa

Esta habilidad define los estándares técnicos, directrices de arquitectura de información, lineamientos de diseño visual y reglas inviolables para el desarrollo y mantenimiento del **Panel de Supervisión y Control Operativo Coolbox 2026** de **JSERVICE RV**.

---

## 1. CONTEXTO OPERATIVO Y ROLES DE SUPERVISIÓN

* **Cliente Mandante:** Coolbox (RASH PERÚ S.R.L.).
* **Contratista Responsable:** JSERVICE RV.
* **Supervisores Clave del Sistema:** Jesús Silva (Operativa en Perú) y Andrews Berbesia (Jefatura de Operaciones en Venezuela).
* **Universo Operativo:** 147 tiendas a nivel nacional (88 en Lima, 59 en Provincias).

---

## 2. REGLA DE ORO: AISLAMIENTO ABSOLUTO DEL DIRECTORIO

> [!CAUTION]
> **RESTRICCIÓN DE ALCANCE INVIOLABLE:**
> Queda terminantemente **PROHIBIDO** crear, modificar, mover o eliminar cualquier archivo ubicado fuera del directorio `Control Coolbox Admin/`.
> 
> * El archivo `index.html` de la raíz corresponde a la Web App móvil de los técnicos de campo y debe permanecer **100% intacto**.

---

## 3. IDENTIDAD VISUAL, ESTÁNDARES DE BADGES Y TIPOGRAFÍA (INMUTABLE)

El dashboard de supervisión proyecta autoridad técnica, claridad analítica y alta legibilidad de datos para jornadas prolongadas de monitoreo en pantallas de escritorio y tablets.

### 3.1 Reglas Tipográficas Obligatorias
* **Mayúsculas Forzadas:** Todos los textos indicadores de estado (`CONFORME`, `OBSERVADO`, `REALIZADO`, `NO INTERVENIDO`, `DE BAJA`, `OPERATIVO`, `INOPERATIVO`, `RENOVACION`) DEBEN renderizarse estrictamente en **MAYÚSCULAS** (`text-transform: uppercase`).
* **Grosor:** Negrita/semi-negrita consistente (`font-weight: 600` o `700`).

### 3.2 Paleta Cromática Canónica (Cero Desviación)
Queda terminantemente prohibido utilizar colores en línea arbitrarios (ej. `style="color: #28a745"`). Toda etiqueta debe consumir estrictamente los tokens del sistema:
* **Éxito (`CONFORME` / `OPERATIVO` / `REALIZADO`):** Fondo `#D1FAE5 !important;`, Texto `#065F46 !important;`, Borde `1px solid #A7F3D0 !important;`.
* **Advertencia (`OBSERVADO` / `PARCIAL`):** Fondo `#FEF3C7 !important;`, Texto `#92400E !important;`, Borde `1px solid #FDE68A !important;`.
* **Neutro (`NO INTERVENIDO` / `PENDIENTE`):** Fondo `#F1F5F9 !important;`, Texto `#475569 !important;`, Borde `1px solid #CBD5E1 !important;`.
* **Crítico (`DE BAJA` / `RETIRADO` / `INOPERATIVO`):** Fondo `#FEE2E2 !important;`, Texto `#991B1B !important;`, Borde `1px solid #FCA5A5 !important;`.

### 3.3 Control de Anchos y Prevención de Desbordes
* **Clase Maestra `.badge-status`:** Debe incluir `box-sizing: border-box !important; max-width: 100% !important; white-space: nowrap !important; font-size: 0.65rem !important; padding: 2px 6px !important; border-radius: 4px !important;`.
* **Badge Compacto `.badge-no-intervenido`:** Configurado a `font-size: 0.60rem !important; padding: 1px 4px !important;`.
* **Celdas de Tablas en Informes (.acta-table, .ficha-table):** Columna de estado con ancho protegido de `min-width: 115px !important; width: 15% !important;` para contener `NO INTERVENIDO` sin invadir observaciones.

### 3.4 Limpieza del DOM
* Prohibido renderizar filas estáticas no auditadas en checklists (removida la fila fantasma de `"Switch / Router Inspeccionado"`).

---

## 4. ESTRUCTURA MODULAR DEL PANEL

Todo desarrollo dentro de `Control Coolbox Admin/` debe articularse en 5 bloques funcionales:
1. `[BLOQUE 1: PANEL SUPERIOR DE KPIS]` (Progreso global sobre 147 tiendas: Realizados, Parciales, Pendientes).
2. `[BLOQUE 2: BARRA DE BÚSQUEDA Y FILTROS COMBINADOS]`
3. `[BLOQUE 3: TABLA INTERACTIVA DE SEGUIMIENTO Y GESTIÓN DE ACTIVOS]` (Con selectores de vista rápida: `[Todos]`, `[POS / Cajas]`, `[PDAs / Handhelds]`).
4. `[BLOQUE 4: MODAL DE AUDITORÍA PROFUNDA Y VISTAS IMPRESAS A4]`
5. `[BLOQUE 5: MÓDULO INTEGRADO DE EDICIÓN Y EXPORTADOR OFICIAL EXCEL]`
   * Generación de libro `.xlsx` idéntico a `Inventario_Equipos_Tiendas.xlsx`:
     - Hoja 1: `Inventario POS` (17 columnas: Cols A-G en Azul Suave `#DDEBF7`, Cols H-Q en Crema Pastel `#FFFFF9E6`, evaluando `ESTADO`: Bueno/Regular/Malo/No existe y `OPERATIVO`: Sí/No).
     - Hoja 2: `Inventario PDA` (15 columnas: Cols A-F en Azul Suave `#DDEBF7`, Cols G-O en Crema Pastel `#FFFFF9E6`, marcas SUNMI/SHIJI/HONEYWELL/UNITECH, `ANYDESK`, `ANDROID IMEI`, `ESTADO`: OPERATIVO/INOPERATIVO).
     - Hoja 3: Catálogo `PDA` (17 columnas).
     - Fórmulas de fila 3 y 4 intactas y exportación exclusiva de tiendas ejecutadas (`REALIZADO` / `CONFORME`).
   * Módulo de Edición de Reporte:
     - Permite corregir o registrar censo de hardware incorporando columna 'Red / Soporte' para Hostname (POS) y AnyDesk / Android IMEI (PDA).
     - Preserva intactos todos los metadatos relacionales (16 columnas canónicas) al guardar cambios hacia Google Sheets.


---

## 5. CHECKLIST DE CONFORMIDAD DEL SUPERVISOR
- [ ] ¿El código se encuentra estrictamente dentro de `Control Coolbox Admin/`?
- [ ] ¿Todos los badges y estados están en MAYÚSCULAS y en negrita (`font-weight: 600`)?
- [ ] ¿El color verde de éxito es exactamente `#065F46` sobre fondo `#D1FAE5` sin estilos inline?
- [ ] ¿La pastilla `NO INTERVENIDO` se contiene dentro de su celda de 115px sin desbordarse?
- [ ] ¿Se eliminó completamente del Checklist la fila no auditada `Switch / Router Inspeccionado`?