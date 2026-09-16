# Caudal - Historial de Git y Workflow

## Resumen del Repositorio

| Propiedad | Valor |
|-----------|-------|
| **Repositorio** | [github.com/roym25/caudal](https://github.com/roym25/caudal) |
| **Autor** | Rodrigo Muñoz |
| **Rama principal** | `main` |
| **Total commits** | 31 |
| **Periodo activo** | 7 Abril 2026 → 25 Junio 2026 (~2.5 meses) |
| **Tags** | Ninguno |
| **Stash** | Vacío |

## Workflow de Git

El proyecto sigue un flujo de **feature branches con Pull Requests**:

1. Se crea una rama `feat/<nombre-feature>` desde `main`
2. Se hacen commits en la rama de feature
3. Se abre un Pull Request en GitHub
4. Se hace merge a `main` (merge commit, no squash ni rebase)
5. Las ramas de feature se mantienen (no se eliminan después del merge)

### Convención de Branches
```
feat/<área>-<funcionalidad>
```
Ejemplos: `feat/payroll-ui`, `feat/api-fixed-expenses`, `feat/dashboard-ui`

### Convención de Commits
```
feat: <descripción en inglés>
fix: <descripción>
```
Se usa el estilo **Conventional Commits** (solo `feat:` y `fix:` hasta ahora).

## Branches Existentes (11 locales + 11 remotes)

| Branch | PR | Estado |
|--------|-----|--------|
| `main` | — | ✅ Rama actual |
| `feat/api-payroll` | #8 | ✅ Mergeado |
| `feat/api-fixed-expenses` | #9 | ✅ Mergeado |
| `feat/api-post-endpoints` | #10 | ✅ Mergeado |
| `feat/payroll-ui` | #11 | ✅ Mergeado |
| `feat/fixed-expenses-ui` | #12 | ✅ Mergeado |
| `feat/variable-expenses-ui` | #13 | ✅ Mergeado |
| `feat/dashboard-ui` | #14 | ✅ Mergeado |
| `feat/fixed-expenses-payments` | #15 | ✅ Mergeado |
| `feat/payroll-edit-delete` | #21 | ✅ Mergeado |
| `feat/variable-expenses-edit-delete` | #22 | ✅ Mergeado |
| `feat/payroll-grouped-by-month` | #23 | ✅ Mergeado |

> ⚠️ **Nota:** Todas las ramas de feature ya fueron mergeadas pero siguen existiendo localmente y en remote. Se podrían limpiar con `git branch -d <branch>`.

## Cronología de Desarrollo

### Fase 1 — Scaffolding (7-8 Abril 2026)
Commits directos a `main` (sin PRs), setup inicial del proyecto.

| Commit | Descripción |
|--------|-------------|
| `84f1e85` | **Inicio del proyecto** — `create-next-app` |
| `38db734` | Reemplazar página default de Next.js con base de Caudal |
| `fb84a04` | Páginas iniciales: nóminas, gastos-fijos, gastos-variables |
| `c33bf1d` | Componente Navbar |
| `42d9101` | Fix menor |
| `0a9eec7` | **Setup de Prisma** + modelos de DB + corrección de idioma |

### Fase 2 — API Backend (14-15 Abril 2026)
Feature branches con PRs para cada grupo de endpoints.

| PR | Branch | Descripción |
|----|--------|-------------|
| #8 | `feat/api-payroll` | Prisma client singleton + GET de payroll |
| #9 | `feat/api-fixed-expenses` | GET de fixed-expenses y variable-expenses |
| #10 | `feat/api-post-endpoints` | POST endpoints para las 3 entidades |

### Fase 3 — Frontend UI (28 Abril 2026)
Un PR por cada página de UI, todas el mismo día.

| PR | Branch | Descripción |
|----|--------|-------------|
| #11 | `feat/payroll-ui` | Página de nóminas con form y tabla |
| #12 | `feat/fixed-expenses-ui` | Página de gastos fijos con form y tabla |
| #13 | `feat/variable-expenses-ui` | Página de gastos variables con form y tabla |

### Fase 4 — Dashboard y Pagos Fijos (13 Mayo 2026)
Funcionalidades clave del MVP.

| PR | Branch | Descripción |
|----|--------|-------------|
| #14 | `feat/dashboard-ui` | Dashboard con resumen de ingresos/gastos |
| #15 | `feat/fixed-expenses-payments` | Toggle de pagos mensuales + vista anual + edit/delete (3 commits) |

### Fase 5 — Edit & Delete (18 Junio 2026)
CRUD completo para todas las entidades.

| PR | Branch | Descripción |
|----|--------|-------------|
| #21 | `feat/payroll-edit-delete` | Editar y eliminar nóminas |
| #22 | `feat/variable-expenses-edit-delete` | Editar y eliminar gastos variables |

### Fase 6 — Refinamiento UX (24-25 Junio 2026)
Mejoras de experiencia de usuario.

| PR/Commit | Descripción |
|-----------|-------------|
| #23 (`feat/payroll-grouped-by-month`) | Agrupar nóminas por mes + navegación con Enter + validación de semana |
| `3216436` (directo a main) | Campo `savingsFund` en DB + UI + form |

## Estadísticas del Código

```
23 archivos modificados desde el inicio
2,345 líneas insertadas (+)
86 líneas eliminadas (-)
≈ 2,259 líneas netas de código
```

### Ritmo de desarrollo
- **Abril**: Setup + API + UI básica (17 commits)
- **Mayo**: Dashboard + pagos fijos (6 commits)
- **Junio**: Edit/Delete + refinamiento (8 commits)
- **Julio → Septiembre**: Sin actividad (2.5 meses de pausa)

## Estado Actual del Working Tree

```
?? docs/         ← Carpeta nueva (no tracked)
?? graphify-out/ ← Carpeta nueva (no tracked)
```

No hay cambios en archivos tracked. Las únicas carpetas sin trackear son las recién creadas por esta sesión de análisis.

## Notas para Contribuir

### Crear un nuevo feature
```bash
# 1. Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# 2. Crear branch de feature
git checkout -b feat/<nombre-descriptivo>

# 3. Hacer commits con conventional commits
git add .
git commit -m "feat: descripción del cambio"

# 4. Push y crear PR
git push -u origin feat/<nombre-descriptivo>
# Crear PR en GitHub
```

### Limpiar branches mergeadas
```bash
# Local
git branch --merged main | grep -v main | xargs git branch -d

# Remote
git remote prune origin
```

## Diagrama de Timeline

```
main ─────┬──────┬──────┬──────┬──────┬───────┬───────┬───────┬───────┬──── HEAD
          │      │      │      │      │       │       │       │       │
          │  #8  │  #9  │  #10 │ #11  │  #12  │  #13  │  #14  │  #15  │
          │Payroll│Fixed │POST  │Pay   │Fixed  │Var    │Dash   │Fixed  │
          │ API  │Exp   │Endpts│UI    │Exp UI │Exp UI │board  │Payment│
          │      │API   │      │      │       │       │       │       │
    Abr 7 │Abr14 │Abr14 │Abr15 │Abr28 │Abr28  │Abr28  │May13  │May13  │
          │      │      │      │      │       │       │       │       │
          ├──────┼──────┼──────┤      │       │       │       │       │
          │      │      │      │      │       │       │       │       │
          │      │      │  #21 │ #22  │  #23  │ HEAD  │       │       │
          │      │      │Pay   │Var   │Pay    │Savings│       │       │
          │      │      │Edit  │Edit  │Group  │Fund   │       │       │
          │      │      │Jun18 │Jun18 │Jun24  │Jun25  │       │       │
```

