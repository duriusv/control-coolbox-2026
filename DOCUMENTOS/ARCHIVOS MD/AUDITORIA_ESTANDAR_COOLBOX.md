# NORMA TÉCNICA DE AUDITORÍA: CONTROL COOLBOX 2026
# Empresa: JSERVICE RV E.I.R.L. | Metodología: SDD

## DIMENSIÓN 1: FRONTEND APP DE CAMPO (`./index.html`)
- [ ] AUD-FE-01: Compresión de Imágenes en Cliente: Rutina JavaScript/Canvas que comprima las 8 fotografías antes de la codificación Base64 (peso max: 400KB por foto).
- [ ] AUD-FE-02: Resiliencia Desconectada (Offline): Persistencia temporal en localStorage para resguardar censo y firmas ante pérdida de señal en tienda.
- [ ] AUD-FE-03: Sincronización Reactiva de Cuadrilla: Selectores de técnicos (`tecnicoTitular`, `tecnicoApoyo1`, `tecnicoApoyo2`) con exclusión mutua mediante `disabled = true`.
- [ ] AUD-FE-04: Sanitización de Hardware: Conversión automática a mayúsculas (`.toUpperCase()`) en inputs de censo técnico.
- [ ] AUD-FE-05: Fidelidad Editorial y Lingüística: Cero presencia del carácter comercial '&' en textos visuales de interfaz, etiquetas (<label>), opciones de censo y reportes imprimibles A4 (utilizar siempre la conjunción 'y'). La sintaxis lógica de JavaScript (operador &&) en scripts queda exenta.

## DIMENSIÓN 2: BACKEND SERVERLESS (`./DOCUMENTOS/Codigo.gs`)
- [ ] AUD-BE-01: Control de Concurrencia: Uso estricto de LockService de 30 segundos protegiendo las transacciones críticas.
- [ ] AUD-BE-02: Escritura Masiva por Lotes: Inserción de filas mediante `setValues()` atómico en una sola operación.
- [ ] AUD-BE-03: Integridad de Estructuras: Recepción y desempaquetado consistente con los modelos de datos locales.

## DIMENSIÓN 3: BASE DE DATOS Y TABLAS (`./basedatos/*.csv`)
- [ ] AUD-DB-01: Paridad Dimensional de Equipos: Esquema `INVENTARIO_EQUIPOS` con exactamente 11 columnas.
- [ ] AUD-DB-02: Paridad Dimensional de Mantenimiento: Esquema `REGISTRO_MANTENIMIENTO` con exactamente 22 columnas.
- [ ] AUD-DB-03: Integridad Referencial: Cada registro vincula de forma unívoca el ID de tienda.

## DIMENSIÓN 4: PANEL ADMINISTRATIVO (`./Control Coolbox Admin/index.html`)
- [ ] AUD-AD-01: Micro-KPIs Operativos: Tarjetas ejecutivas con tiempo promedio de atención y porcentaje de avance preventivo.
- [ ] AUD-AD-02: Preservación de Modales: Acciones operativas preservadas (Ver Acta Completa, Ver Reporte Técnico, Enviar por Correo, Cerrar).
- [ ] AUD-AD-03: Fidelidad de Impresión A4: Formato estricto para hoja A4 membretada.