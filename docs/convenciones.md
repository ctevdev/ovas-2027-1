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

