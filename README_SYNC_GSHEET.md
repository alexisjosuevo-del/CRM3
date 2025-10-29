# INNVIDA_CRM v16 — Sync con Google Sheets (Apps Script)

Propietario sugerido: **bi.mx@innvida.es**

## 1) Crear hoja de cálculo
Crea una hoja en Google Drive y copia su ID (el texto entre `/d/` y `/edit` en la URL). Dentro crea estos tres tabs:
- `Base_Medicos`
- `Base_Cotizaciones`
- `Base_SeguimientoKAM`

En la primera fila de cada hoja coloca encabezados (pueden ser creados automáticamente con el primer POST).

## 2) Apps Script
- Abre *script.google.com* > **Nuevo proyecto**.
- Crea un archivo `Code.gs` y pega el contenido de `integrations/gsheet/AppsScript_Code.gs`.
- Reemplaza `REEMPLAZA_CON_TU_SPREADSHEET_ID` por el ID de tu hoja.
- **Deploy** > **Nueva implementación** > Tipo: *Web App*.
  - Ejecutar como: **Tú (propietario)**.
  - Quién tiene acceso: **Cualquiera con el enlace** (o *Cualquiera*).
- Copia la URL del Web App (termina en `/exec`).

## 3) Configurar la URL en el CRM
- Abre `integrations/gsheet/gs-client.js` y reemplaza `REEMPLAZA_CON_TU_WEBAPP_URL` con la URL del Web App.
- (Opcional) También puedes establecerla en runtime desde la consola:
  ```js
  localStorage.setItem("GS_SCRIPT_URL", "https://script.google.com/macros/s/XXXXX/exec");
  ```

## 4) Conectar el CRM
Este paquete añade:
- `integrations/gsheet/AppsScript_Code.gs` (servidor)
- `integrations/gsheet/gs-client.js` (cliente)
- `js/gs-adapter.js` (orquesta lecturas/escrituras y refresca la UI)

### Cómo usar en tu UI
- En tu `index.html` añade, antes de tu `app.js`, algo como:
  ```html
  <script type="module" src="./js/gs-adapter.js"></script>
  ```
- Desde tus handlers de formularios, en vez de lógica local, llama:
  ```js
  INNVIDA_SYNC.saveMedico({ "Nombre": "...", "Telefono": "...", "Estado": "..." });
  INNVIDA_SYNC.saveCotizacion({ "Folio": "...", "KAM": "...", "Valor": 12345 });
  INNVIDA_SYNC.saveSeguimiento({ "Medico": "...", "Estatus": "Contactado", "Fecha": "2025-10-29" });
  ```
  Ajusta las claves para que coincidan con tus encabezados.

### Lectura y refresco
- `INNVIDA_SYNC.loadAllAndRender()` se llama al cargar y cada 30 s.
- También emite el evento `gs:data` si prefieres escuchar datos compartidos desde otros módulos.

## 5) Publicación
- Sube este v16 a GitHub Pages/Vercel como siempre.
- Asegúrate de que el Web App esté activo. Todos verán la misma información.

---

## Notas
- Puedes extender el esquema: si envías campos nuevos en `row`, el script agrega nuevas columnas automáticamente.
- Si requieres autenticación o reglas por rol, conviene migrar a **Firebase** más adelante.