# PoolDesk BETA 1.10

Aplicación de escritorio para administrar las operaciones de Poolmania y Poolzone. La aplicación usa Electron y una base SQLite local guardada en `%APPDATA%\PoolDesk\pooldesk.sqlite`.

## Requisitos

- Windows 10/11 de 64 bits para ejecutar el instalador.
- Node.js LTS y npm para ejecutar desde el código o crear un instalador.

## Ejecutar desde el código

```powershell
npm ci
npm start
```

## Crear el instalador de Windows

```powershell
npm ci
npm run dist:installer
```

La salida se genera en `../work/build`, según la configuración actual de Electron Builder.

## Estructura

```text
app/
  index.html
  assets/
    css/app.css
    js/app.js
    icons/pooldesk.ico
    icons/pooldesk.png
main.cjs       # Ventana Electron, SQLite e IPC
preload.cjs    # API segura entre interfaz y proceso principal
package.json   # Scripts y configuración del instalador
```

## Estado de funcionalidades

La versión incluye salón, mesas, caja por usuario, inventario, ventas directas, cocina, comprobantes internos, reportes, usuarios y configuración. Las notas, boletas y facturas aún no tienen conexión efectiva de emisión con SUNAT: no deben tratarse como comprobantes electrónicos aceptados. La base es local y todavía no sincroniza entre equipos o sedes por la nube.

Las cuentas iniciales documentadas por esta versión son `desarrollador` / `desa1235` y `admin` / `admin1235`. Cambia las credenciales iniciales desde la gestión de usuarios antes del uso operativo.

## GitHub

El repositorio de publicación es <https://github.com/ArnoldSSJ/pool_desk>. Para subir la fuente, revisa [SUBIR_A_GITHUB.md](SUBIR_A_GITHUB.md) y ejecuta `./subir-a-github.ps1`. El instalador, los ejecutables, `node_modules` y las bases locales están excluidos del repositorio.
