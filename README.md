# LOS INTOCABLES FC 27 — Élite Deportivo

## Despliegue manual en Render (proyecto independiente)

Este paquete es una **nueva web**, NO una sustitución segura del repositorio existente `los-intocables4`.
No incluye las rutas de administración, las cuentas ni la conexión Discord del repositorio original.
No sobrescribas el repositorio actual sin hacer una copia de seguridad.

1. Crea un repositorio NUEVO en GitHub y sube el contenido de esta carpeta a su raíz.
2. En Render selecciona New > Blueprint y el repositorio nuevo; Render leerá `render.yaml`.
3. Alternativamente crea Web Service (Python), Build Command:
   `npm install && npm run build && pip install -r requirements.txt`
   Start Command: `uvicorn server.main:app --host 0.0.0.0 --port $PORT`
4. Define `SYNC_ADMIN_TOKEN` con un valor aleatorio largo para proteger la sincronización manual.
5. Comprueba `/api/health` y `/api/competitions` en tu dominio.

## Datos de EAFCStats

El conector consulta las competiciones 259 (AFJ), 294 (VPG) y 301 (Bronze Zero)
cada 15 minutos. Solo interpreta tablas HTML reconocibles. No se ha verificado
que EAFCStats exponga esas tablas en producción: puede cargar con JavaScript,
bloquear solicitudes o cambiar su estructura. En esos casos se mostrará
«sin datos», no resultados inventados.

**Persistencia:** Render Free usa almacenamiento efímero. Los archivos JSON
generados pueden perderse tras reinicios o despliegues. Para producción real
se necesita almacenamiento persistente externo o una base de datos.

## Importante
No se ha desplegado en tu cuenta de Render ni se han cambiado los archivos
de tu repositorio original. La compilación de React requiere Node y acceso
a npm durante el despliegue.
