# Puente para subir PoolDesk a GitHub

Este directorio (`outputs`) es la raíz del proyecto fuente PoolDesk BETA 1.10. El remoto solicitado es <https://github.com/ArnoldSSJ/pool_desk.git>.

## Primer envío

1. Instala Git para Windows si todavía no está instalado y abre PowerShell.
2. Entra al directorio del proyecto:

   ```powershell
   cd "C:\Users\herss\Documents\Codex\2026-10-14\hola\outputs"
   ```

3. Si Git nunca se configuró en ese equipo, configura tu identidad (usa el correo de tu cuenta GitHub):

   ```powershell
   git config --global user.name "Tu nombre"
   git config --global user.email "tu-correo@example.com"
   ```

4. Inicia sesión cuando Git Credential Manager lo solicite. No pegues un token dentro del script ni lo publiques en el repositorio.
5. Prepara el primer commit:

   ```powershell
   .\subir-a-github.ps1
   ```

6. Publica la rama `main`:

   ```powershell
   git push -u origin main
   ```

El script inicializa Git solo si hace falta, configura `origin` con la URL indicada y agrega únicamente código, recursos, documentación Markdown y archivos de dependencias. No usa `--force`; si GitHub ya tiene historial diferente, el envío será rechazado sin sobrescribirlo.

## Envíos posteriores

Después de modificar el programa:

```powershell
.\subir-a-github.ps1
git push
```

El script crea un commit de los cambios versionados. Revisa `git status` y el mensaje del commit antes de ejecutar `git push`.

## Publicación desde la web de GitHub

También puedes abrir el repositorio, elegir **Add file → Upload files** y arrastrar `app`, `main.cjs`, `preload.cjs`, `package.json`, `package-lock.json`, `README.md`, `LEEME.md`, `.gitignore`, este manual y el script. No subas `node_modules`, archivos `.exe`, `*.sqlite`, `base18-extract` ni `base18-source`.
