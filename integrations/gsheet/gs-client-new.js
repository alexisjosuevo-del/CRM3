/**
 * INNVIDA CRM - Google Sheets Sync Client (v16)
 * Reemplaza GS_SCRIPT_URL con la URL de implementación del Web App de Apps Script (deploy "Nueva Implementación" > Tipo Web App)
 * Ejemplo: https://script.google.com/macros/s/AKfycbxk2iAkbA-4t30tKxkCj34WbxAnqfFEFsZjwGJOEOfs75NsDse2JJuR0gxlObKTuCkCfQ/exec
 */
const GS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxk2iAkbA-4t30tKxkCj34WbxAnqfFEFsZjwGJOEOfs75NsDse2JJuR0gxlObKTuCkCfQ/exec";

export async function gsGetAll() {
  const url = GS_SCRIPT_URL + "?type=all";
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error al leer datos");
  return data.data;
}

export async function gsPost(type, row) {
  const res = await fetch(GS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, row }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error al guardar");
  return data.result;
}

/** Utilidades de ayuda */
export function setGsUrl(url) {
  localStorage.setItem("GS_SCRIPT_URL", url);
}