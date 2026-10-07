# Carga directa de la Unidad 2 en el servidor

El archivo `Unidad-02-estructura-servidor.zip` conserva la misma ruta utilizada en GitHub. Es un contenido HTML5 estático: no necesita base de datos, instalación de paquetes ni proceso de compilación.

## Procedimiento

1. Ingrese al administrador de archivos, FTP o SFTP del servidor.
2. Ubíquese en la raíz pública del sitio, por ejemplo `public_html`, `www` o la carpeta configurada como `document root`.
3. Cargue `Unidad-02-estructura-servidor.zip` en esa raíz.
4. Extraiga el ZIP en la misma ubicación. No cree una carpeta adicional con el nombre del archivo.
5. Confirme que exista esta ruta:

   `semestres/2027-1/programas/seguridad-y-salud-en-el-trabajo/asignaturas/biologia/unidad-02-organizacion-celular/implementacion/index.html`

6. Abra el catálogo con una URL equivalente a:

   `https://SU-DOMINIO/semestres/2027-1/programas/seguridad-y-salud-en-el-trabajo/asignaturas/biologia/unidad-02-organizacion-celular/implementacion/index.html`

## Verificación posterior

- El catálogo debe mostrar seis secciones.
- Cada botón `Abrir sección` debe cargar su experiencia correspondiente.
- Los botones `Volver al catálogo` deben regresar al índice de la unidad.
- Las fuentes, el logotipo y los iconos deben mostrarse sin errores.
- Las descargas ZIP deben responder desde la carpeta `publicables`.
- El avance se guarda en el navegador del estudiante mediante `localStorage`; no se envía información al servidor.

Si el servidor requiere permisos manuales, use normalmente `755` para carpetas y `644` para archivos. Mantenga los nombres de carpetas y archivos sin modificaciones para conservar los enlaces relativos.
