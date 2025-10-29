/**
 * INNVIDA CRM - Adapter de sincronización (v16)
 * Intercepta las funciones globales de guardado para enviar a Google Sheets
 * NOTA: Este archivo asume que hay funciones saveMedico, saveCotizacion, saveSeguimiento o similares.
 * Si no existen, expone funciones nuevas para usar directamente en tus botones.
 */

import { gsGetAll, gsPost } from "../integrations/gsheet/gs-client.js";

window.INNVIDA_SYNC = {
  /** Carga todos los datos desde Google Sheets y refresca UI. */
  async loadAllAndRender() {
    const all = await gsGetAll();
    // Expone globalmente para tu app.js actual
    window.__GS_DATA__ = all;
    // Llama a funciones de render si existen
    if (typeof window.initCharts === "function") try { window.initCharts(all); } catch(e) {}
    if (typeof window.renderTables === "function") try { window.renderTables(all); } catch(e) {}
    document.dispatchEvent(new CustomEvent("gs:data", { detail: all }));
  },

  /** Guardar un médico en Sheets */
  async saveMedico(row) {
    const result = await gsPost("medicos", row);
    await this.loadAllAndRender();
    return result;
  },

  /** Guardar cotización */
  async saveCotizacion(row) {
    const result = await gsPost("cotizaciones", row);
    await this.loadAllAndRender();
    return result;
  },

  /** Guardar seguimiento */
  async saveSeguimiento(row) {
    const result = await gsPost("seguimientos", row);
    await this.loadAllAndRender();
    return result;
  },
};

// Refresco automático cada 30 s
setInterval(() => {
  window.INNVIDA_SYNC.loadAllAndRender().catch(()=>{});
}, 30000);

// Carga inicial
window.addEventListener("load", () => {
  window.INNVIDA_SYNC.loadAllAndRender().catch(console.error);
});