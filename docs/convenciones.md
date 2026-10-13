# Convenciones de organización y nombres

## Jerarquía

La ruta de cada unidad sigue esta secuencia:

`semestres/<periodo>/programas/<programa>/asignaturas/<asignatura>/<unidad>/`

## Nombres de carpetas

- Usar minúsculas.
- Separar palabras con guiones.
- Evitar tildes, eñes, espacios y caracteres especiales.
- Identificar unidades y OVA con dos dígitos: `unidad-01` y `ova-01`.
- Conservar nombres breves y reconocibles.

## Carpetas de cada unidad

- `fuentes`: módulos, guías y documentos académicos suministrados.
- `diseno`: análisis, matrices de alineación y guiones instruccionales.
- `implementacion`: código fuente y recursos propios de cada OVA.
- `publicables`: paquetes finales verificados y listos para el LMS.

## Organización de la implementación

Cuando se construya un OVA, se creará una carpeta independiente:

```text
implementacion/
  ova-01-nombre-breve/
    index.html
    assets/
      css/
      js/
      images/
```

Cada OVA debe poder probarse de forma independiente. Los recursos compartidos solo se ubicarán en una carpeta común cuando exista una necesidad real y documentada.

## Entregables

Los nombres de los paquetes finales deben incluir período, programa, asignatura, unidad, OVA y estándar cuando corresponda. Ejemplo:

`2027-1-sst-biologia-u01-ova01-scorm12.zip`

## Regla obligatoria para las descargas

Cuando el catálogo de una unidad enlace archivos ZIP desde `../publicables/`, deben cumplirse todas estas condiciones antes de dar la unidad por terminada:

- Cada enlace debe apuntar a un archivo real dentro de `publicables`.
- Cada ZIP debe poder abrirse y contener al menos una entrada.
- Cuando se genere un paquete `*estructura-servidor.zip`, debe incluir todos los ZIP enlazados por el catálogo, conservando la ruta completa desde `semestres`.
- Cuando exista, el paquete de servidor no debe contener una copia de sí mismo, para evitar anidamiento recursivo y crecimiento innecesario.
- La validación debe finalizar sin errores mediante `tools/validar-descargas-ova.ps1`.

Si se requiere un paquete de servidor, se genera al final, después de crear los paquetes de cada sección y el paquete completo de la unidad. Si se modifica cualquier descargable, también debe regenerarse el paquete de servidor.

