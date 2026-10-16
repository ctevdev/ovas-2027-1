# Carga manual al servidor

El paquete `Unidad-02-Informatica-I-estructura-servidor.zip` conserva la ruta del repositorio desde `semestres` e incluye los siete ZIP descargables del catálogo. No contiene una copia de sí mismo.

```powershell
scp.exe -i "$HOME\.ssh\ctev_admin_ed25519" -P 2222 "RUTA_LOCAL_DEL_PAQUETE" root@192.168.153.142:/home/ctev/public_html/ovas/ovas-2027-1/
```
