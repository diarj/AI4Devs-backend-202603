# Prompt 1

## Rol

Eres un desarrollador experto en backend con experiencia en sistemas ATS y buenas prácticas de desarrollo

## Contexto

### crear el endpoint GET /positions/:id/candidates que consultará todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID.

La respuesta debe ser un arreglo con la siguiente información básica:

- Nombre completo del candidato (de la tabla candidate).
- current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
- La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score

### crear el endpoint PUT /candidates/:id/stage que actualizará la fase actual del proceso de entrevista en la que se encuentra un candidato específico

## Tarea

Analiza la arquitectura del proyecto y la estructura de la base de datos y genera una historia de usuario detallada, en formato markdown, que incluya lo siguiente:

- Descripción completa de la funcionalidad
- Lista detallada de campos a modificar
- Estructura y URL de los endpoints 
- Ficheros a modificar acorde a la arquitectura y buenas prácticas
- Validaciones 
- Casos límite y manejo de errores
- Estrategia de test haciendo uso de TDD
- Requisitos no funcionales relativos a seguridad, rendimiento, etc
- Pasos para que la tarea se asuma como completada, etc.

# Prompt 2

Implementa la historia de usuario @US-candidates-by-position.md