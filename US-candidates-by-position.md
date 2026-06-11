# Historia de Usuario: Gestión del Pipeline de Candidatos por Posición

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Contexto del dominio y modelo de datos](#2-contexto-del-dominio-y-modelo-de-datos)
3. [Endpoints](#3-endpoints)
4. [Ficheros a crear/modificar](#4-ficheros-a-crearmodificar)
5. [Validaciones](#5-validaciones)
6. [Casos límite y manejo de errores](#6-casos-límite-y-manejo-de-errores)
7. [Estrategia de tests (TDD)](#7-estrategia-de-tests-tdd)
8. [Requisitos no funcionales](#8-requisitos-no-funcionales)
9. [Criterios de aceptación (Definition of Done)](#9-criterios-de-aceptación-definition-of-done)

---

## 1. Descripción general

### Historia de usuario

> **Como** reclutador,  
> **quiero** consultar todos los candidatos en proceso para una posición concreta y poder actualizar la fase del proceso en la que se encuentra cada uno,  
> **para** tener visibilidad en tiempo real del pipeline de selección y gestionar eficientemente el avance de los candidatos entre etapas.

### Épica relacionada

Gestión del Kanban / Pipeline de candidatos por posición (tablero ATS).

### Criterio de valor

Permite al reclutador visualizar el estado de todos los candidatos en un proceso de selección y arrastrarlos entre columnas (fases) del tablero, actualizando el paso de entrevista en el que se encuentran.

---

## 2. Contexto del dominio y modelo de datos

### Relaciones clave en el esquema Prisma

```
Position ──< Application >── Candidate
                │
                ├── currentInterviewStep ──> InterviewStep ──> InterviewFlow
                └──< Interview (score por entrevista realizada)
```

### Tablas involucradas

| Tabla | Campos relevantes | Rol en la funcionalidad |
|---|---|---|
| `Position` | `id`, `title`, `status` | Identifica la posición solicitada |
| `Candidate` | `id`, `firstName`, `lastName` | Nombre completo del candidato |
| `Application` | `id`, `positionId`, `candidateId`, `currentInterviewStep` | Vínculo candidato↔posición y fase actual |
| `InterviewStep` | `id`, `name`, `orderIndex` | Nombre legible de la fase del proceso |
| `Interview` | `applicationId`, `score` | Puntuaciones individuales por entrevista |

### Campos que se leen (GET)

- `Candidate.firstName` + `Candidate.lastName` → nombre completo
- `Application.currentInterviewStep` → id de la fase actual
- `InterviewStep.name` → nombre de la fase (join)
- `AVG(Interview.score)` donde `Interview.applicationId = Application.id` → puntuación media

### Campos que se modifican (PUT)

- `Application.currentInterviewStep` → nuevo id de la fase de entrevista

---

## 3. Endpoints

### 3.1 GET `/positions/:id/candidates`

**Descripción:** Devuelve todos los candidatos en proceso para la posición indicada.

**URL:** `GET http://localhost:3010/positions/:id/candidates`

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | integer | ID de la posición |

**Respuesta exitosa — 200 OK:**

```json
[
  {
    "candidateId": 1,
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 7.5
  },
  {
    "candidateId": 2,
    "fullName": "Jane Smith",
    "currentInterviewStep": "HR Interview",
    "averageScore": null
  }
]
```

**Descripción de campos de respuesta:**

| Campo | Tipo | Descripción |
|---|---|---|
| `candidateId` | integer | ID del candidato |
| `fullName` | string | `firstName + ' ' + lastName` |
| `currentInterviewStep` | string | Nombre del paso actual (de `InterviewStep.name`) |
| `averageScore` | number \| null | Media de `Interview.score`; `null` si no hay entrevistas con puntuación |

---

### 3.2 PUT `/candidates/:id/stage`

**Descripción:** Actualiza la fase del proceso de entrevista en la que se encuentra un candidato para una posición concreta.

**URL:** `PUT http://localhost:3010/candidates/:id/stage`

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | integer | ID del candidato |

**Request body:**

```json
{
  "applicationId": 3,
  "newInterviewStep": 5
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `applicationId` | integer | Sí | ID de la aplicación a actualizar |
| `newInterviewStep` | integer | Sí | ID del nuevo `InterviewStep` |

**Respuesta exitosa — 200 OK:**

```json
{
  "message": "Stage updated successfully",
  "data": {
    "applicationId": 3,
    "candidateId": 1,
    "currentInterviewStep": 5
  }
}
```

> **Nota de diseño:** Se incluye `applicationId` en el body porque un candidato puede tener múltiples aplicaciones activas en posiciones distintas. El `:id` de la ruta identifica al candidato; `applicationId` identifica la aplicación concreta a modificar.

---

## 4. Ficheros a crear/modificar

Siguiendo estrictamente la arquitectura en capas del proyecto (Routes → Presentation → Application → Domain):

### 4.1 Ficheros nuevos creados ✅

```
backend/src/
├── routes/
│   └── positionRoutes.ts              ← CREADO
├── presentation/controllers/
│   └── positionController.ts          ← CREADO
└── application/services/
    └── positionService.ts             ← CREADO
```

### 4.2 Ficheros existentes modificados ✅

| Fichero | Cambio |
|---|---|
| `src/index.ts` | Importa y registra `positionRoutes` bajo `/positions` |
| `src/routes/candidateRoutes.ts` | Añadida ruta `PUT /:id/stage` |
| `src/presentation/controllers/candidateController.ts` | Añadido handler `updateCandidateStage` |
| `src/application/services/candidateService.ts` | Añadidas interfaces `UpdateStageInput`, `UpdateStageResult` y función `updateApplicationStage` |

### 4.3 Ficheros de test creados ✅

```
backend/
└── src/
    └── __tests__/
        ├── positionService.test.ts    ← CREADO (7 tests)
        └── candidateStage.test.ts     ← CREADO (7 tests)
```

> **Patrón de mocks:** Los servicios aceptan el cliente Prisma como parámetro opcional con inyección de dependencias (`client: Pick<PrismaClient, ...> = prisma`). Esto permite pasar un mock tipado directamente en los tests sin necesidad de interceptar el módulo con `jest.mock`.

### 4.4 Fichero de API spec actualizado ✅

| Fichero | Cambio |
|---|---|
| `backend/api-spec.yaml` | Añadidas definiciones OpenAPI para `GET /positions/{id}/candidates` y `PUT /candidates/{id}/stage`, incluyendo esquema `ErrorResponse` reutilizable en `components/schemas` |

---

## 5. Validaciones

### 5.1 Validaciones comunes

| Regla | Error |
|---|---|
| Los path params `id` deben ser enteros positivos | `400 Bad Request` — "Invalid ID format" |
| Los IDs no pueden ser cero ni negativos | `400 Bad Request` — "ID must be a positive integer" |

### 5.2 GET `/positions/:id/candidates`

| Validación | Error |
|---|---|
| `id` no es un entero válido | `400 Bad Request` |
| La posición con ese `id` no existe en la base de datos | `404 Not Found` — "Position not found" |
| La posición existe pero no tiene aplicaciones | Devuelve `200 OK` con array vacío `[]` |

### 5.3 PUT `/candidates/:id/stage`

| Campo | Validación | Error |
|---|---|---|
| `:id` (path) | Entero positivo | `400 Bad Request` — "Invalid candidate ID format" |
| `applicationId` (body) | Requerido, entero positivo | `400 Bad Request` — "applicationId is required and must be a positive integer" |
| `newInterviewStep` (body) | Requerido, entero positivo | `400 Bad Request` — "newInterviewStep is required and must be a positive integer" |
| Candidato `:id` | Debe existir | `404 Not Found` — "Candidate not found" |
| `applicationId` | Debe existir y pertenecer al candidato `:id` | `404 Not Found` — "Application not found for this candidate" |
| `newInterviewStep` | Debe ser un `InterviewStep` válido dentro del `InterviewFlow` de la posición de esa aplicación | `400 Bad Request` — "Invalid interview step for this position's flow" |

---

## 6. Casos límite y manejo de errores

### 6.1 Casos límite funcionales

| Caso | Comportamiento esperado |
|---|---|
| Posición sin candidatos aplicados | `GET /positions/:id/candidates` → `200 OK` con `[]` |
| Candidato sin entrevistas puntuadas | `averageScore: null` en la respuesta |
| Candidato con solo algunas entrevistas puntuadas (`score` puede ser `null` en `Interview`) | Solo se promedian los scores no nulos |
| Posición con estado `Draft` o inactiva | Se devuelven igualmente las aplicaciones (el filtro de visibilidad es responsabilidad del negocio, no de este endpoint) |
| `newInterviewStep` igual al paso actual | `200 OK` — la operación es idempotente, se actualiza igualmente |
| `applicationId` pertenece al candidato pero es de otra posición | Actualización válida siempre que el `InterviewStep` sea del `InterviewFlow` correcto |

### 6.2 Manejo de errores y códigos HTTP

| Situación | Código | Cuerpo |
|---|---|---|
| ID no numérico en path | `400` | `{ "error": "Invalid ID format" }` |
| Recurso no encontrado | `404` | `{ "error": "<Resource> not found" }` |
| Body inválido / campo faltante | `400` | `{ "error": "<campo> is required" }` |
| Paso no pertenece al flujo de la posición | `400` | `{ "error": "Invalid interview step for this position's flow" }` |
| Error no controlado de base de datos | `500` | `{ "error": "Internal Server Error" }` |

### 6.3 Patrón de manejo de errores

Seguir el patrón existente en `candidateRoutes.ts`: captura en el route handler, diferenciando `instanceof Error` (4xx) de errores inesperados (5xx). Los servicios lanzan errores descriptivos con `throw new Error(message)`.

---

## 7. Estrategia de tests (TDD)

### Filosofía

Aplicar el ciclo **Red → Green → Refactor** (TDD clásico):

1. Escribir el test que describe el comportamiento esperado (falla).
2. Implementar el mínimo código para que el test pase.
3. Refactorizar manteniendo todos los tests en verde.

### Herramientas

- **Jest** (ya configurado en `jest.config.js`)
- **ts-jest** (ya instalado)
- **Mocks manuales de `@prisma/client`** (patrón `jest.mock`)

### 7.1 Tests para `positionService` (GET /positions/:id/candidates)

**Archivo:** `src/__tests__/positionService.test.ts`

#### Test 1 — Posición válida con candidatos

```
DADO que existe una posición con id=1 y tiene 2 aplicaciones
CUANDO se llama a getCandidatesByPosition(1)
ENTONCES devuelve un array de 2 elementos con:
  - fullName correcto (firstName + ' ' + lastName)
  - currentInterviewStep con el nombre del paso
  - averageScore calculado correctamente (media de scores no nulos)
```

#### Test 2 — Posición sin candidatos

```
DADO que existe una posición con id=2 sin aplicaciones
CUANDO se llama a getCandidatesByPosition(2)
ENTONCES devuelve un array vacío []
```

#### Test 3 — Posición no encontrada

```
DADO que no existe ninguna posición con id=999
CUANDO se llama a getCandidatesByPosition(999)
ENTONCES lanza un Error con mensaje "Position not found"
```

#### Test 4 — Candidatos sin puntuación

```
DADO que una aplicación tiene interviews pero todos con score=null
CUANDO se llama a getCandidatesByPosition(1)
ENTONCES el campo averageScore del candidato es null
```

#### Test 5 — Puntuación parcial

```
DADO que una aplicación tiene 3 interviews con scores [8, null, 6]
CUANDO se llama a getCandidatesByPosition(1)
ENTONCES averageScore es 7 (media de los no nulos: (8+6)/2)
```

---

### 7.2 Tests para `candidateService` (PUT /candidates/:id/stage)

**Archivo:** `src/__tests__/candidateStage.test.ts`

#### Test 6 — Actualización exitosa de fase

```
DADO que existe el candidato id=1, la aplicación id=3 (pertenece al candidato)
  y el interviewStep id=5 es válido para el interviewFlow de esa posición
CUANDO se llama a updateApplicationStage(1, { applicationId: 3, newInterviewStep: 5 })
ENTONCES la aplicación se actualiza y devuelve { applicationId: 3, candidateId: 1, currentInterviewStep: 5 }
```

#### Test 7 — Candidato no encontrado

```
DADO que no existe el candidato id=999
CUANDO se llama a updateApplicationStage(999, { applicationId: 3, newInterviewStep: 5 })
ENTONCES lanza un Error con mensaje "Candidate not found"
```

#### Test 8 — Aplicación no pertenece al candidato

```
DADO que el candidato id=1 existe pero la aplicación id=99 no le pertenece
CUANDO se llama a updateApplicationStage(1, { applicationId: 99, newInterviewStep: 5 })
ENTONCES lanza un Error con mensaje "Application not found for this candidate"
```

#### Test 9 — InterviewStep inválido para el flujo

```
DADO que el interviewStep id=99 no pertenece al interviewFlow de la posición de la aplicación
CUANDO se llama a updateApplicationStage(1, { applicationId: 3, newInterviewStep: 99 })
ENTONCES lanza un Error con mensaje "Invalid interview step for this position's flow"
```

#### Test 10 — Idempotencia (mismo paso)

```
DADO que la aplicación id=3 ya está en el interviewStep id=5
CUANDO se llama a updateApplicationStage(1, { applicationId: 3, newInterviewStep: 5 })
ENTONCES retorna éxito sin error (operación idempotente)
```

---

### 7.3 Tests de controladores (integración superficial)

Usar `supertest` (o mocks de req/res) para verificar que los controllers:

- Llaman al servicio correcto con los parámetros parseados.
- Devuelven el código HTTP correcto para cada caso (200, 400, 404, 500).
- Serializan la respuesta en el formato JSON esperado.

---

### 7.4 Orden de implementación TDD

```
1. positionService.test.ts     → positionService.ts          ✅ COMPLETADO
2. candidateStage.test.ts      → candidateService.ts         ✅ COMPLETADO
3. Tests de controllers        → positionController.ts +
                                 candidateController.ts      (integrados en los tests de servicio)
4. Tests de rutas              → positionRoutes.ts +
                                 candidateRoutes.ts          ✅ COMPLETADO
5. Integración en index.ts     → smoke test manual           ✅ COMPLETADO
```

### 7.5 Tests adicionales implementados

Cada suite incluye tests de verificación de comportamiento interno más allá de los escenarios funcionales mínimos:

**`positionService.test.ts` (7 tests):**
- Los 5 tests especificados en §7.1
- Test adicional: verifica que `averageScore` es `null` cuando no hay entrevistas (array vacío, distinto al caso de scores nulos)
- Test adicional: verifica que `findUnique` se llama con el `positionId` y los `include` correctos

**`candidateStage.test.ts` (7 tests):**
- Los 5 tests especificados en §7.2
- Test adicional: verifica que `application.update` se llama con los argumentos exactos
- Test adicional: verifica que la consulta de la aplicación filtra simultáneamente por `id` y `candidateId`
- Test adicional: verifica que la consulta del `interviewStep` valida contra el `interviewFlowId` de la posición

---

## 8. Requisitos no funcionales

### 8.1 Rendimiento

| Requisito | Detalle |
|---|---|
| Tiempo de respuesta | < 200 ms en condiciones normales (< 1000 candidatos por posición) |
| Consulta optimizada | Usar una única query Prisma con `include` anidado en lugar de N+1 queries; calcular el `averageScore` en la capa de servicio iterando sobre el resultado en memoria (o con `_avg` de Prisma si el volumen lo requiere) |
| Índices de BD | Verificar que `Application.positionId` y `Application.candidateId` tienen índices (las FK de Prisma los crean automáticamente) |

### 8.2 Seguridad

| Requisito | Detalle |
|---|---|
| Inyección SQL | Prisma parametriza todas las queries automáticamente; no usar queries raw |
| Validación de entrada | Nunca confiar en el tipo del path param; parsear siempre con `parseInt` y validar `isNaN` |
| CORS | Los nuevos endpoints heredan la política CORS ya configurada en `index.ts` (`http://localhost:3000`) |
| Sin autenticación (por ahora) | El proyecto actual no implementa auth; documentar que en producción estos endpoints deben estar protegidos (JWT / sesión) |
| Exposición mínima de datos | La respuesta del GET no debe incluir campos sensibles del candidato (email, teléfono, dirección) |

### 8.3 Mantenibilidad

| Requisito | Detalle |
|---|---|
| Separación de capas | Toda la lógica de negocio (cálculo de media, validación de pertenencia del step al flow) reside en la capa `application/services`, no en controllers ni routes |
| Tipado TypeScript | Definir interfaces o types para los DTOs de request y response |
| Sin dependencias nuevas | La implementación reutiliza Prisma Client y Express ya instalados; no requiere nuevas dependencias |

### 8.4 Observabilidad

| Requisito | Detalle |
|---|---|
| Logging | Los errores se loguean con `console.error` (coherente con el patrón existente del proyecto) |
| Trazabilidad | El middleware de logging ya registra `METHOD /path` en `index.ts` para todos los endpoints |

---

## 9. Criterios de aceptación (Definition of Done)

### Funcional

- [x] `GET /positions/:id/candidates` devuelve `200` con el array correcto cuando la posición existe y tiene candidatos.
- [x] `GET /positions/:id/candidates` devuelve `200` con `[]` cuando la posición existe pero no tiene candidatos.
- [x] `GET /positions/:id/candidates` devuelve `404` cuando la posición no existe.
- [x] El `averageScore` es la media de los `score` no nulos de las entrevistas del candidato para esa aplicación.
- [x] `PUT /candidates/:id/stage` devuelve `200` y actualiza `currentInterviewStep` en BD.
- [x] `PUT /candidates/:id/stage` devuelve `404` si el candidato no existe.
- [x] `PUT /candidates/:id/stage` devuelve `404` si la aplicación no pertenece al candidato.
- [x] `PUT /candidates/:id/stage` devuelve `400` si el `newInterviewStep` no es válido para el flujo de la posición.
- [x] Ambos endpoints devuelven `400` si los IDs del path no son enteros válidos.

### Técnico

- [x] Todos los tests unitarios pasan (`npm test`).
- [x] No hay errores de compilación TypeScript (`npm run build`).
- [x] No hay errores de ESLint/Prettier.
- [x] Los nuevos ficheros siguen la estructura de carpetas del proyecto.
- [x] La lógica de negocio está en la capa `application/services`, no en controllers.
- [x] No hay queries N+1: se usa una única consulta Prisma con relaciones incluidas.
- [x] `api-spec.yaml` está actualizado con los nuevos endpoints.

### Proceso

- [ ] El código ha sido revisado (code review).
- [x] Los tests fueron escritos **antes** que la implementación (TDD).
- [ ] La PR incluye descripción de los cambios y capturas de los tests pasando.

---

## Apéndice — Referencias de ficheros existentes relevantes

| Fichero | Propósito de referencia |
|---|---|
| `src/routes/candidateRoutes.ts` | Patrón de definición de rutas a replicar |
| `src/presentation/controllers/candidateController.ts` | Patrón de controllers con manejo de errores |
| `src/application/services/candidateService.ts` | Patrón de servicios con Prisma |
| `src/application/validator.ts` | Patrón de validaciones |
| `backend/prisma/schema.prisma` | Fuente de verdad del modelo de datos |
| `backend/jest.config.js` | Configuración de Jest para los tests |
