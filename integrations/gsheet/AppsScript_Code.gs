/**
 * INNVIDA CRM - Google Sheets Sync (v16)
 * Owner: bi.mx@innvida.es
 * Deploy as Web App: Anyone with the link (or anyone) - doGet/doPost
 *
 * SHEET NAMES (create three tabs in the same spreadsheet):
 *  - Base_Medicos
 *  - Base_Cotizaciones
 *  - Base_SeguimientoKAM
 */

const CONFIG = {
  spreadsheetId: "REEMPLAZA_CON_TU_SPREADSHEET_ID", // e.g. 1AbC... (from the sheet URL)
  sheets: {
    medicos: "Base_Medicos",
    cotizaciones: "Base_Cotizaciones",
    seguimientos: "Base_SeguimientoKAM",
  },
};

function _ss() {
  return SpreadsheetApp.openById(CONFIG.spreadsheetId);
}

function doGet(e) {
  // GET /?type=medicos|cotizaciones|seguimientos  -> devuelve JSON
  const type = (e && e.parameter && e.parameter.type) ? e.parameter.type : "all";
  const res = {
    medicos: [],
    cotizaciones: [],
    seguimientos: [],
  };

  const sh = _ss();
  if (type === "all" || type === "medicos")    res.medicos = _readSheet(sh, CONFIG.sheets.medicos);
  if (type === "all" || type === "cotizaciones") res.cotizaciones = _readSheet(sh, CONFIG.sheets.cotizaciones);
  if (type === "all" || type === "seguimientos") res.seguimientos = _readSheet(sh, CONFIG.sheets.seguimientos);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: res }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // POST JSON: { type: "medicos"|"cotizaciones"|"seguimientos", row: {...} }
  try {
    const payload = JSON.parse(e.postData.contents);
    const type = payload.type;
    const row  = payload.row;
    if (!type || !row) throw new Error("Payload inválido: se requiere type y row");

    const sh = _ss();
    const sheetName = (type === "medicos") ? CONFIG.sheets.medicos
                     : (type === "cotizaciones") ? CONFIG.sheets.cotizaciones
                     : (type === "seguimientos") ? CONFIG.sheets.seguimientos
                     : null;
    if (!sheetName) throw new Error("Tipo desconocido: " + type);

    const result = _appendRow(sh, sheetName, row);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function _readSheet(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (!values || values.length === 0) return [];
  const headers = values.shift().map(h => String(h).trim());
  return values
    .filter(r => r.some(cell => cell !== ""))
    .map(row => headers.reduce((obj, h, i) => (obj[h] = row[i], obj), {}));
}

function _appendRow(ss, sheetName, rowObj) {
  const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  let headers = sh.getDataRange().getValues()[0] || [];
  if (!headers || headers.length === 0) {
    // if sheet is empty, create headers from keys
    headers = Object.keys(rowObj);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    headers = headers.map(h => String(h).trim());
    // ensure all keys exist in headers; if new keys, append columns
    const keys = Object.keys(rowObj);
    const missing = keys.filter(k => !headers.includes(k));
    if (missing.length > 0) {
      const startCol = headers.length + 1;
      for (let i = 0; i < missing.length; i++) {
        sh.getRange(1, startCol + i).setValue(missing[i]);
      }
      headers = headers.concat(missing);
    }
  }

  // Build row in header order
  const row = headers.map(h => (h in rowObj ? rowObj[h] : ""));
  sh.appendRow(row);
  return { appended: true, columns: headers.length, lastRow: sh.getLastRow() };
}