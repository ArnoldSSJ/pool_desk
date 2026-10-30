# PoolDesk BETA 1.10

## Inicio

Ejecuta `..\work\build\PoolDesk BETA 1.10 Instalador.exe` para instalar la aplicación. El asistente permite elegir la carpeta y crea accesos directos en Inicio y el escritorio. Los datos de la aplicación se guardan en SQLite local en `%APPDATA%\PoolDesk\pooldesk.sqlite`.

Las cuentas iniciales son `desarrollador` / `desa1235` y `admin` / `admin1235`. No se crean usuarios de empleado ni moderador automáticamente.

## Cambios de esta versión

- El inventario ahora muestra en una tabla el stock de referencia, las unidades y el importe vendido, el desglose por usuario, cuánto debe quedar y el stock actual del sistema. Los ingresos de stock actualizan la base del cálculo. La exportación incluye el mismo desglose y es compatible con Excel (CSV).
- Desde **Salón**, la venta de productos registra una compra de mostrador sin abrir mesa. Permite combinar efectivo con Yape/Plin, asigna la venta al usuario de sesión, descuenta el stock y genera un ticket.
- Administradores y desarrolladores pueden cancelar una sesión de mesa activa con motivo obligatorio. No se cobra el tiempo de mesa y los productos pendientes se devuelven al inventario; los ya pagados conservan su venta.
- La anulación de tickets solicita motivo, queda en la bitácora y revierte el inventario correspondiente. Las anulaciones de prepagos están disponibles mientras la mesa siga abierta.
- La venta directa usa un catálogo visual con búsqueda, categorías y un carrito lateral para revisar cantidades e importe antes del cobro.
- Cada usuario tiene su propia caja por sede. El sistema registra aperturas, cierres, ventas, mesas abiertas y turnos que siguen **abiertos / sin cierre**. Cada persona puede revisar el detalle y ticket de sus propios cierres.
- Cocina cuenta con **Órdenes**, **Inventario** y **Recetas**. Al confirmar una orden, valida existencias y descuenta automáticamente sus ingredientes; si falta stock, informa qué insumo no alcanza. Las órdenes pendientes se pueden marcar listas o cancelar y devolver sus insumos.
- Se corrigió el inicio de sesión con SQLite existente: los nuevos datos de caja y cocina se inicializan después de cargar la base de datos anterior.

## Operación

Poolmania y Poolzone se gestionan por separado. Las mesas se agregan manualmente y empiezan con una tarifa de S/ 10 por hora. La caja se abre y cierra desde **Salón**; cada venta se registra dentro del turno activo.

Para imprimir tickets, configura una vez la Epson TM-T20II en **Configuración → Impresora de tickets**. PoolDesk envía cada comprobante a la impresora elegida en rollo de 80 mm y calcula el largo con base en el contenido; la interfaz del salón se excluye del área impresa. La emisión electrónica todavía requiere completar la conexión y credenciales de SUNAT; hasta entonces los documentos quedan identificados como pendientes y no tienen validez tributaria. La versión continúa usando SQLite local y todavía no sincroniza entre computadoras ni por nube.

## Código

- `app/index.html`: interfaz y navegación.
- `app/assets/css/app.css`: estilos e impresión.
- `app/assets/js/app.js`: operación, inventario, ventas, caja y reportes.
- `main.cjs`: ventana Electron y persistencia SQLite.
- `preload.cjs`: puente seguro con la base de datos.

Para generar el instalador de Windows, ejecuta `npm run dist:installer` dentro de `outputs`.

## Comprobantes y emisión electrónica

- Poolmania inicia con RUC 20485180797; Poolzone deja el RUC en blanco. Admin y desarrollador pueden editar los datos fiscales por sede.
- La nota de pedido es interna. Boletas y facturas aparecen como pendientes hasta habilitar el emisor electrónico; no se presentan como aceptadas por SUNAT.
- La venta de mostrador y desde Inventario descuentan el stock, guardan el documento vinculado a la venta e imprimen con el mismo formato compacto.
- El historial muestra los documentos del empleado. Admin y desarrollador ven todos y pueden editar o retirar registros con anotación en bitácora. La imagen de PoolDesk se usa como icono de ventana, acceso directo y ejecutable.
- La conexión SUNAT y la sincronización web aún no están habilitadas. Se requiere escoger el mecanismo de emisión, habilitar el RUC como emisor y configurar el certificado digital o las credenciales del proveedor autorizado antes de emitir CPE válidos.
