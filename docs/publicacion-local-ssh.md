# Publicación local mediante llave SSH

El script `tools/publicar-ovas-ssh.ps1` permite publicar las OVA directamente desde este repositorio local. No requiere descargar ZIP ni cargar archivos mediante el navegador: crea un paquete temporal, lo transfiere por SCP, lo extrae por SSH y conserva la ruta completa del repositorio.

La publicación se ejecuta únicamente cuando usted lanza el comando. No existe un despliegue automático desde GitHub.

## Requisitos

- Windows con `ssh.exe`, `scp.exe` y `tar.exe` disponibles.
- Una llave SSH autorizada en el servidor.
- Un usuario SSH con escritura sobre la raíz pública del sitio.
- El servidor debe disponer del comando `tar`.
- La huella del servidor debe estar registrada en `known_hosts`.

## Primera conexión

Antes de publicar, conéctese una vez para verificar y aceptar la huella del servidor:

```powershell
ssh -i "C:\ruta\a\llave_ed25519" usuario@servidor
```

Compare la huella mostrada con la entregada por el administrador del servidor. No acepte una huella desconocida sin verificarla.

## Guardar la configuración local

Copie el archivo de ejemplo y complete sus datos una sola vez:

```powershell
Copy-Item .deploy.local.psd1.example .deploy.local.psd1
```

Edite `.deploy.local.psd1` con el servidor, usuario, raíz pública, ubicación de la llave privada y puerto. Este archivo está excluido de Git para evitar publicar información de acceso.

## Publicar todas las OVA

Ejecute desde la raíz del repositorio:

```powershell
.\tools\publicar-ovas-ssh.ps1
```

El servidor recibirá:

```text
/home/usuario/public_html/semestres/2027-1/programas/...
```

## Publicar solo una unidad

Para transferir únicamente la Unidad 2 y reducir el tamaño de la carga:

```powershell
.\tools\publicar-ovas-ssh.ps1 `
  -SourcePath "semestres/2027-1/programas/seguridad-y-salud-en-el-trabajo/asignaturas/biologia/unidad-02-organizacion-celular"
```

Puede reemplazar `SourcePath` por la ruta de cualquier nueva unidad u OVA dentro del repositorio.

Si el servidor utiliza un puerto diferente, agregue `-Port 2222` con el número correspondiente.

## Simular antes de transferir

PowerShell permite revisar el destino sin realizar la carga:

```powershell
.\tools\publicar-ovas-ssh.ps1 `
  -WhatIf
```

## Comportamiento de seguridad

- La llave privada nunca se copia ni se guarda en el repositorio.
- El script rechaza `/` como destino remoto.
- `SourcePath` debe pertenecer al repositorio.
- Se exige verificación estricta de la huella SSH.
- No se eliminan archivos existentes en el servidor.
- El paquete temporal local se elimina al finalizar, incluso cuando ocurre un error.

Después de construir una nueva OVA, solo debe ejecutar nuevamente el comando indicando su `SourcePath`, o publicar `semestres` para actualizar el conjunto completo.
