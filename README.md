# Repositorio de Objetos Virtuales de Aprendizaje

Este repositorio organiza los Objetos Virtuales de Aprendizaje por período académico, programa, asignatura y unidad. Cada unidad conserva de forma separada sus fuentes, diseño instruccional, implementación y entregables publicables.

## Navegación

- [Semestre 2027-1](semestres/2027-1/README.md)
- [Convenciones del repositorio](docs/convenciones.md)
- [Control obligatorio de calidad de las OVA](docs/CONTROL_CALIDAD_OVAS.md)
- [Publicación local mediante llave SSH](docs/publicacion-local-ssh.md)

## Estructura

```text
semestres/
  2027-1/
    programas/
      nombre-del-programa/
        asignaturas/
          nombre-de-la-asignatura/
            unidad-00-nombre/
              fuentes/
              diseno/
              implementacion/
              publicables/
```

La carpeta `publicables` se reserva para artefactos listos para distribución, como paquetes SCORM, archivos H5P o versiones finales comprimidas. Los archivos de trabajo y las fuentes editables deben permanecer en sus carpetas correspondientes.

Las OVA pueden publicarse desde el equipo local mediante una llave SSH, conservando la estructura del repositorio, con el procedimiento documentado en `docs/publicacion-local-ssh.md`.

Antes de publicar, el repositorio valida que cada enlace de descarga del catálogo apunte a un ZIP existente y que todos esos archivos estén incluidos en el paquete de servidor. Esta comprobación también puede ejecutarse manualmente con `tools/validar-descargas-ova.ps1`.

Toda entrega nueva o corregida debe aplicar la lista de control institucional, mostrar el resultado **CUMPLE/NO CUMPLE** antes de la salida y entregar una sola insignia por unidad, condicionada al cumplimiento correcto de todas sus actividades.

