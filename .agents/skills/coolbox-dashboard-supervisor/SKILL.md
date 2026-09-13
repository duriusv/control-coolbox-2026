---
name: coolbox-dashboard-supervisor
description: Especialista en arquitectura de paneles de control operativo, métricas de mantenimiento e inventario de hardware para JSERVICE RV y Coolbox.
---

# Coolbox Dashboard Supervisor — Especialista en Monitoreo y Auditoría Operativa

Esta habilidad define los estándares técnicos, directrices de arquitectura de información, lineamientos de diseño visual y reglas inviolables para el desarrollo y mantenimiento del **Panel de Supervisión y Control Operativo Coolbox 2026** de **JSERVICE RV**.

---

## 1. CONTEXTO OPERATIVO Y ROLES DE SUPERVISIÓN

* **Cliente Mandante:** Coolbox (RASH PERÚ S.R.L.).
* **Contratista Responsable:** JSERVICE RV.
* **Supervisores Clave del Sistema:**
  * **Jesús Silva (Supervisión Operativa en Perú - JSERVICE RV):** Coordinación en terreno, control de rutas, verificación física de cuadrillas en Lima y Provincias.
  * **Andrews Berbesia (Jefatura de Operaciones en Venezuela - JSERVICE RV):** Supervisión remota integral en tiempo real, auditoría de métricas, validación de seriales, control de calidad fotográfica y emisión de actas de conformidad.
* **Universo Operativo:** 140 tiendas a nivel nacional (86 en Lima Metropolitana y Callao, 54 en Provincias).
* **Alcance Técnico:** Panel de control gerencial y operativo para auditar el avance del mantenimiento preventivo anual y censo de inventario tecnológico.

---

## 2. REGLA DE ORO: AISLAMIENTO ABSOLUTO DEL DIRECTORIO

> [!CAUTION]
> **RESTRICCIÓN DE ALCANCE INVIOLABLE:**
> Queda terminantemente **PROHIBIDO** crear, modificar, mover o eliminar cualquier archivo ubicado fuera del directorio `Control Coolbox Admin/`.
> 
> * El archivo `index.html` de la raíz corresponde a la Web App móvil de los técnicos de campo y debe permanecer **100% intacto**.
> * El archivo `spec.md` de la raíz y los scripts de verificación de campo no deben ser alterados.
> * Todos los artefactos de la solución de supervisión (HTML, CSS, JS, módulos, especificaciones) deben alojarse exclusivamente dentro de `Control Coolbox Admin/`.

---

## 3. IDENTIDAD VISUAL Y DIRECTRICES DE DISEÑO

El dashboard de supervisión proyecta autoridad técnica, claridad analítica y alta legibilidad de datos para jornadas prolongadas de monitoreo en pantallas de escritorio y tablets.

### 3.1 Paleta Cromática Institucional
* **Azul Medianoche Principal (`#0A2540`):** Utilizado en cabeceras de jerarquía superior, barras de navegación lateral/superior, títulos de KPIs y acentos de contraste corporativo.
* **Acento Rojo Coolbox (`#E31B23`):** Utilizado estratégicamente en badges de atención urgente, tiendas con estatus "Observado", alertas críticas, barras de acento y acciones principales destacadas.
* **Fondo Neutro Analítico (`#F8FAFC`):** Superficie de lienzo limpia que reduce la fatiga visual.
* **Superficies y Tarjetas (`#FFFFFF`):** Fondos de tarjetas de KPI, tablas y modales con bordes sutiles en `#E2E8F0`.
* **Semáforo Operativo:**
  * **Conforme / Exitoso:** Verde Esmeralda (`#10B981` / `#059669`).
  * **Observado / Alerta:** Rojo Coolbox (`#E31B23`) / Ámbar Preventivo (`#F59E0B`).
  * **En Proceso:** Azul Cobalto (`#2563EB` / `#3B82F6`).
  * **Pendiente:** Gris Slate Neutro (`#64748B` / `#94A3B8`).

### 3.2 Clasificación de Tiendas (Categorías Coolbox)
* **Oro:** Acento dorado / amarillo cálido (`#D97706` / fondo `#FEF3C7`).
* **Platino:** Acento plata metálico / gris azulado (`#475569` / fondo `#F1F5F9`).
* **Bronce:** Acento bronce cobrizo (`#B45309` / fondo `#FFEDD5`).

---

## 4. ENFOQUE DE DISPOSITIVO: DESKTOP & TABLET

A diferencia de la aplicación móvil de los técnicos, el dashboard de supervisión está concebido como una estación de trabajo ejecutiva:

1. **Resoluciones Objetivo:**
   * **Desktop Estándar y Panorámico:** $\ge 1280\text{px}$ (1366x768, 1920x1080).
   * **Tablet en Modo Horizontal (Landscape):** $\ge 1024\text{px}$ (iPad Pro, Galaxy Tab).
2. **Densidad de Información Optimizada:**
   * Vista condensada de tablas con alto contraste para evaluar decenas de tiendas por pantalla sin scroll excesivo.
   * Paneles colapsables y modales flotantes amplios ($90\%$ de ancho en tablet, máx $1100\text{px}$ en desktop).
3. **Ergonomía de Control:**
   * Atajos rápidos por teclado (escape para cerrar modales, enter para filtrar).
   * Búsqueda en vivo con respuesta en menos de 100 milisegundos sobre memoria RAM local.
   * Exportación instantánea de actas al portapapeles con un clic.

---

## 5. ARQUITECTURA DE DATOS Y FLUJO DE LECTURA

### 5.1 Origen de Datos (Google Sheets)
El panel se alimenta en modo de sólo lectura (`read-only`) de las 3 entidades centrales del proyecto:
1. `DB_TIENDAS`: Catálogo de las 140 sedes, ubicación, clasificación y estatus general.
2. `HISTORIAL_ATENCIONES`: Registro temporal de visitas, checklists de gabinete/cómputo y enlaces de evidencia fotográfica en Google Drive.
3. `INVENTARIO_GENERAL`: Censo consolidado de activos de hardware censados por número de serie.

### 5.2 Estrategia de Rendimiento
* **Carga Inicial Única (Hydration):** Descarga del dataset comprimido al inicializar la sesión.
* **Filtrado Reactivo en Memoria:** Las consultas por técnico, ciudad, clasificación o estado operan sobre arrays en JavaScript (`Array.prototype.filter`), garantizando latencia cero sin saturar la cuota de Apps Script.
* **Caché en Sesión (`sessionStorage`):** Almacenamiento temporal para evitar solicitudes redundantes, con botón explícito de actualización forzada (`Actualizar Datos`).

---

## 6. ESTRUCTURA MODULAR DEL PANEL

Todo desarrollo dentro de `Control Coolbox Admin/` debe articularse en 4 bloques funcionales:

```
+-----------------------------------------------------------------------------------+
|                   CONTROL COOLBOX ADMIN — SISTEMA DE SUPERVISIÓN                  |
+-----------------------------------------------------------------------------------+
|  [BLOQUE 1: PANEL SUPERIOR DE KPIS]                                               |
|  - % Progreso Global | Tiendas Atendidas vs Pendientes | Total Hardware | % Calidad|
+-----------------------------------------------------------------------------------+
|  [BLOQUE 2: BARRA DE BÚSQUEDA Y FILTROS COMBINADOS]                               |
|  - Buscador General | Filtro Técnico | Filtro Ciudad | Filtro Categoría | Reset   |
+-----------------------------------------------------------------------------------+
|  [BLOQUE 3: TABLA INTERACTIVA DE SEGUIMIENTO]                                     |
|  - Código | Tienda | Ciudad | Clasif. | Técnico | Fecha | Equipos | Estado | Acción|
+-----------------------------------------------------------------------------------+
|  [BLOQUE 4: MODAL DE AUDITORÍA PROFUNDA (Overlay)]                                |
|  - Info Tienda | Checklists Gabinete | Tabla Seriales | Fotos Duales | Generador  |
+-----------------------------------------------------------------------------------+
```

---

## 7. CHECKLIST DE CONFORMIDAD DEL SUPERVISOR

Antes de certificar cualquier componente del panel de supervisión, validar:
- [ ] ¿El código se encuentra estrictamente dentro de `Control Coolbox Admin/`?
- [ ] ¿Se respetó al 100% la intangibilidad del `index.html` de los técnicos en la raíz?
- [ ] ¿Los colores respetan la tríada: `#0A2540` (Azul Medianoche), `#E31B23` (Rojo Coolbox) y `#F8FAFC` (Fondo)?
- [ ] ¿La interfaz responde fluidamente en resoluciones de Tablet y Desktop ($\ge 1024\text{px}$)?
- [ ] ¿El modal de auditoría permite inspeccionar las fotos 'Antes' y 'Después' sin romper la página?
- [ ] ¿El generador de actas genera un texto formateado listo para enviar por correo institucional?
