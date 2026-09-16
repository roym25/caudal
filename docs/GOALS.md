# Caudal - Metas y Roadmap

## 🎯 Estado Actual (v0.1.0)

Caudal es actualmente un **MVP funcional** de rastreo de finanzas personales con las siguientes capacidades:

### ✅ Completado
- [x] Dashboard con resumen financiero (ingresos, gastos, restante)
- [x] CRUD completo de nóminas (payroll) con agrupación por mes
- [x] CRUD de gastos fijos con matriz de pagos mensuales (12 meses)
- [x] CRUD de gastos variables
- [x] Inline editing en todas las tablas
- [x] Navegación entre secciones (Navbar)
- [x] Soporte dark mode (CSS variables)
- [x] Base de datos PostgreSQL con Prisma ORM
- [x] API REST completa con 13 endpoints

---

## 🚀 Metas a Corto Plazo (v0.2.0)

### Mejoras de UX/UI
- [ ] Formateo de moneda (`$1,234.56` en lugar de `$1234.56`)
- [ ] Mensajes de feedback al usuario (toast/notificaciones) al crear/editar/eliminar
- [ ] Confirmación visual de acciones exitosas
- [ ] Responsive design para móviles (actualmente solo desktop)
- [ ] Loading states / skeletons mientras se cargan los datos
- [ ] Empty states cuando no hay registros
- [ ] Paginación o scroll infinito para listas largas

### Mejoras de Dashboard
- [ ] Filtro por mes/año en el dashboard
- [ ] Gráficas de ingresos vs gastos (chart library)
- [ ] Desglose visual de categorías de gastos
- [ ] Indicador de gastos fijos pagados vs pendientes del mes

### Mejoras de Datos
- [ ] Validación de datos en el servidor (no solo parseo)
- [ ] Manejo de errores en API routes (try/catch + error responses)
- [ ] Validación de formularios en el frontend

---

## 🎯 Metas a Mediano Plazo (v0.3.0)

### Nuevas Funcionalidades
- [ ] **Categorías de gastos variables** — Poder categorizar cada gasto (comida, transporte, entretenimiento, etc.)
- [ ] **Metas de ahorro** — Definir metas y rastrear progreso
- [ ] **Presupuestos mensuales** — Definir presupuesto por categoría y alertar cuando se exceda
- [ ] **Exportar datos** — Exportar a CSV/Excel
- [ ] **Resumen anual** — Vista de todo el año con totales y promedios

### Mejoras Técnicas
- [ ] Error boundaries en componentes React
- [ ] API error handling robusto con status codes apropiados
- [ ] Optimistic updates en el frontend
- [ ] Debounce en búsquedas/filtros
- [ ] Caché de datos en el cliente

---

## 🏔️ Metas a Largo Plazo (v1.0.0)

### Funcionalidades Avanzadas
- [ ] **Autenticación** — Login con credenciales o OAuth
- [ ] **Multi-usuario** — Cada usuario ve solo sus datos
- [ ] **Compartir finanzas** — Cuentas compartidas (pareja, familia)
- [ ] **Importar estados de cuenta** — Parsear PDFs o CSVs de bancos
- [ ] **Notificaciones** — Recordar pagos próximos a vencer
- [ ] **Reportes PDF** — Generar reportes mensuales/anuales
- [ ] **PWA** — App instalable en móvil
- [ ] **Modo offline** — Service worker para uso sin conexión

### Infraestructura
- [ ] Deployment a producción (Vercel + PostgreSQL en la nube)
- [ ] CI/CD pipeline
- [ ] Tests unitarios y de integración
- [ ] Monitoreo y logging
- [ ] Backup automático de base de datos

---

## 📐 Principios de Diseño

1. **Simplicidad** — La app debe ser fácil de usar, sin features innecesarios
2. **Velocidad** — Todo debe cargar rápido y responder inmediatamente
3. **Claridad** — Los números y datos deben ser claros y sin ambigüedad
4. **Personal** — Esta es una app personal, no un SaaS (por ahora)
5. **Iterativo** — Agregar features de a poco, probando cada uno

## 🏛️ Decisiones Técnicas Clave

| Decisión | Razón |
|----------|-------|
| JavaScript en vez de TypeScript | Velocidad de desarrollo, proyecto personal |
| Next.js App Router | Arquitectura moderna, colocation de rutas y API |
| Prisma + pg adapter | Control fino sobre la conexión, pool management |
| Tailwind CSS v4 | Simplicidad, no necesita configuración extra |
| PostgreSQL local | Base de datos robusta, fácil de migrar a la nube |
| Client Components | Interactividad requerida en todas las páginas |
| Sin librerías de UI | Mantener el bundle pequeño, aprender CSS |
| REST API (no Server Actions) | Separación clara frontend/backend |
