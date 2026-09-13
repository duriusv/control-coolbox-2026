# 🛡️ CHECKPOINT MAESTRO — SISTEMA INTEGRADO CONTROL COOLBOX 2026
**Cliente / Operación:** Coolbox Perú — Mantenimiento Preventivo & Censo de Activos  
**Empresa Ejecutora:** JSERVICE RV E.I.R.L.  
**Supervisión General:** Andrews & Jesús Silva  
**Fecha de Corte:** Septiembre de 2026  
**Metodología:** SDD (Specification-Driven Development) & Arquitectura Monorepo  

---

## 1. ESTADO ACTUAL Y MISIÓN OPERATIVA
El proyecto consiste en una plataforma integral de control operativo en tiempo real para la campaña técnica de Coolbox, compuesta por dos interfaces frontend desacopladas y un backend centralizado sobre Google Workspace.

### Estado Operativo Vigente: "CERO OPERATIVO REAL"
* **Base de datos activa:** 140 tiendas registradas y programadas.
* **Atenciones ejecutadas:** 0 locales (0.0%).
* **Locales pendientes:** 140 locales (100.0%).
* **Hardware censado:** 0 equipos.
* **Consistencia:** Todas las hojas de transacciones y estados visuales arrancan limpias, sin datos simulados (mock data) residuales.

---

## 2. INFRAESTRUCTURA Y BACKEND (API REST)
### 2.1 Base de Datos (Google Sheets Nativo en Drive Propio)
* **Archivo:** Hoja de cálculo 100% nativa creada en la carpeta de trabajo del usuario en Google Drive (evita errores de archivos binarios `.xlsx` y colisiones de cuentas).
* **ID Canónico del Libro:** `18UFmzqE2qzwtf_-aR9tGPs18FWtFve9MckzdQ7jmHeU` (o archivo nativo de trabajo `Control_Coolbox_Dev_2026`).
* **Pestañas Normalizadas:**
  1. `DB_TIENDAS`: Catálogo maestro de sedes (`CODIGO`, `NOMBRE_TIENDA`, `CIUDAD`, `DIRECCION`, `CLASIFICACION`).
  2. `HISTORIAL_ATENCIONES`: Registro transaccional de visitas técnicas (Vacía de fila 2 en adelante; solo cabeceras).
  3. `INVENTARIO_GENERAL`: Censo individualizado de hardware y seriales (Vacía de fila 2 en adelante; solo cabeceras).

### 2.2 Backend API (Google Apps Script - `Codigo.gs`)
* **Conexión Directa:** Utiliza `SpreadsheetApp.openById(ID_HOJA_CALCULO)` con permisos OAuth autorizados en la cuenta propietaria.
* **Manejo de Concurrencia:** Emplea `LockService.getScriptLock()` en peticiones `doPost` para evitar condiciones de carrera durante envíos simultáneos de cuadrillas.
* **Endpoints Configurados:**
  * `GET ?action=getDashboardData`: Retorna JSON estructurado `{ status: "success", tiendas: [...], atenciones: [...], totalEquiposAuditados: N }`.
  * `GET ?action=getCatalogo`: Retorna la lista de tiendas para la app móvil.
  * `POST`: Recibe la carga útil técnica, inserta filas en `HISTORIAL_ATENCIONES` y distribuye el hardware en `INVENTARIO_GENERAL`.
* **Configuración Web App:** Ejecutada como el propietario con acceso público ("Cualquiera"), garantizando consumo sin barreras de autenticación.

---

## 3. ARQUITECTURA DE LAS APLICACIONES FRONTEND
El proyecto se organiza bajo un enfoque **Monorepo** para convivir en el mismo repositorio Git y desplegarse fuera del visor restrictivo (`iframe`) de Apps Script.

### 3.1 App de Campo para Técnicos (`/index.html` - Raíz)
* **Regla de Oro de Aislamiento:** Archivo base de 337,617 bytes. **ESTRICTAMENTE INALTERADO** durante las mejoras del panel administrativo.
* **Propósito:** Registro ágil en campo desde smartphones (PWA / Mobile First).
* **Diagnóstico de Campo Resuelto:** Abrir el enlace directo de Apps Script en móviles generaba bloqueos por colisión de cuentas de Gmail y congelamiento de botones por el contenedor `iframe`. La solución definitiva acordada es alojar la app en GitHub Pages / Vercel consumiendo la API de Apps Script vía `fetch()`.

### 3.2 Dashboard de Supervisión y Control (`Control Coolbox Admin/index.html`)
* **Experiencia de Usuario:** Single Page Application (SPA) en Viewport estricto (100vh) sin barras de desplazamiento globales.
* **Identidad Visual:** Tipografía corporativa **Montserrat** (Google Fonts, pesos 400 a 800) y paleta corporativa JSERVICE RV (Azul Marino / Rojo).
* **Router SPA (4 Vistas Especializadas):**
  1. `#view-dashboard`: Panel ejecutivo general (KPIs de avance, donuts SVG de progreso, resumen de ciudades y matriz de seguimiento).
  2. `#view-mantenimiento`: Tabla enfocada en infraestructura física (Gabinete/Rack y periféricos). Incluye `#modalMantenimiento` con checklist de soplado, rotulado, PDU estabilizado y la directriz innegociable: *"Peinado de cables: NO TOCADO"*.
  3. `#view-activos`: Tabla de censo de hardware. Incluye `#modalInventario` que reporta estado pendiente o lista detallada de activos (Tipo, Marca, Modelo, Serie) cuando la sede es atendida.
  4. `#view-galeria`: Panel de evidencias visuales. Muestra estado vacío elegante en Cero Operativo y habilita `#modalGaleriaFotos` (Lightbox) al existir registros en Drive.

---

## 4. HISTORIAL DE INCIDENCIAS RESUELTAS (LECCIONES APRENDIDAS)
1. **Diferencia de líneas en `Codigo.gs`:** Se aclaró que la reducción de 267 a ~130 líneas correspondía a una migración de llamadas lentas celda por celda hacia inserciones atómicas (`appendRow`) y endpoints JSON optimizados.
2. **Error `getSheetByName of null`:** Originado porque `getActiveSpreadsheet()` devuelve `null` al ejecutarse vía Web App externa. Resuelto enlazando directamente con `openById()`.
3. **Error `Illegal spreadsheet id or key` / `Invalid argument`:** Ocurrido al intentar conectar archivos en formato `.xlsx` de Excel o con permisos cruzados entre cuentas. Solucionado creando una hoja nativa en el Drive del usuario y validando la función `probarConexionDirecta()`.
4. **Local fantasma como "Realizado":** Causado por maniquíes de datos (*mock data*) en el HTML. Se aprobó la purga estricta para garantizar Estado Cero.

---

## 5. PLAN DE ACCIÓN INMEDIATO (ROADMAP)
1. **Fase Actual:** Ejecutar y validar en Google Antigravity el plan de implementación de las 4 vistas operativas y la fuente Montserrat en `Control Coolbox Admin/index.html` (Opción 1 aprobada).
2. **Auditoría Browser Agent:** Verificar con `/browser` que las 4 pestañas y los 3 modales operen sin desbordamientos y con 0 errores de consola.
3. **Monorepo & Despliegue Público:** Unificar la estructura de carpetas (App Técnico en raíz + Dashboard en `/admin/`), realizar commit en Git y desplegar en GitHub Pages para garantizar acceso directo y botones 100% reactivos desde WhatsApp en smartphones.