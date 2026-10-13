# Carga manual al servidor

El paquete `Unidad-01-Software-estructura-servidor.zip` conserva la ruta del repositorio desde `semestres` e incluye los siete ZIP descargables que utiliza el catálogo: las seis secciones y la unidad completa. No contiene una copia de sí mismo.

```powershell
scp.exe -i "$HOME\.ssh\ctev_admin_ed25519" -P 2222 "RUTA_LOCAL_DEL_PAQUETE" root@192.168.153.142:/home/ctev/public_html/ovas/ovas-2027-1/
```

```powershell
ssh.exe -i "$HOME\.ssh\ctev_admin_ed25519" -p 2222 root@192.168.153.142 "cd /home/ctev/public_html/ovas/ovas-2027-1 && unzip -o Unidad-01-Software-estructura-servidor.zip && rm -f Unidad-01-Software-estructura-servidor.zip"
```
