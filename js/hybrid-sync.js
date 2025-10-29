
// === Hybrid Sync v15 (minimalista, no intrusivo) ===
(function(){
  const NS = 'cotizaciones';
  const LAST_SYNC_KEY = 'last_sync_datetime';

  function nowLabel(){
    const d = new Date();
    return d.toLocaleString(undefined, { hour12: true });
  }

  function getLocal(){
    try{
      const raw = localStorage.getItem(NS);
      if(!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }catch(e){ return []; }
  }

  function setLocal(data){
    try{
      localStorage.setItem(NS, JSON.stringify(data||[]));
    }catch(e){/*no-op*/}
  }

  async function downloadJSON(filename, jsonObj){
    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  async function writeLocalFile(jsonObj){
    // File System Access API (Chromium). Fallback to download if not available or user cancels.
    if (!('showSaveFilePicker' in window)) {
      throw new Error('FSAccessAPI no disponible');
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: 'cotizaciones.json',
      types: [{
        description: 'JSON',
        accept: { 'application/json': ['.json'] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(new Blob([JSON.stringify(jsonObj, null, 2)],{type:'application/json'}));
    await writable.close();
  }

  function showToast(ok, message){
    let t = document.querySelector('.toast.hybridsync');
    if(!t){
      t = document.createElement('div');
      t.className = 'toast hybridsync';
      t.innerHTML = '<div class="title"></div><div class="msg"></div>';
      document.body.appendChild(t);
    }
    t.classList.remove('error');
    const title = t.querySelector('.title');
    const msg = t.querySelector('.msg');
    if(ok){
      title.textContent = 'Éxito';
      msg.textContent = message || '✅ Cotización guardada y sincronizada correctamente';
    } else {
      title.textContent = 'Error';
      msg.textContent = message || '❌ Error al sincronizar, intente nuevamente';
      t.classList.add('error');
    }
    requestAnimationFrame(()=>{
      t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'), 2000);
    });
  }

  function refreshCharts(){
    try{
      if(typeof initCharts === 'function'){
        initCharts();
      }
    }catch(e){/*no-op*/}
  }

  // Periodic refresh every 30s
  setInterval(refreshCharts, 30000);

  // Inject UI (button + last sync label) near Cotizaciones section
  function ensureSyncUI(){
    if(document.querySelector('.btn-sync')) return;

    // Heuristic: search for a container that likely holds Cotizaciones controls
    const candidates = Array.from(document.querySelectorAll('[id*="cotiza"], [class*="cotiza"], section, .card, .panel'))
      .filter(el => /\bcotiza/i.test(el.id + ' ' + el.className + ' ' + (el.textContent||'')));

    const host = candidates[0] || document.body;

    const row = document.createElement('div');
    row.className = 'sync-row';
    row.style.margin = '8px 0';

    const btn = document.createElement('button');
    btn.className = 'btn-sync';
    btn.type = 'button';
    btn.innerHTML = '💾 Sincronizar JSON <span class="spin" style="display:none"></span>';

    const meta = document.createElement('div');
    meta.className = 'sync-meta';
    const last = localStorage.getItem(LAST_SYNC_KEY);
    meta.textContent = '🕒 Última sincronización: ' + (last || '—');

    row.appendChild(btn);
    row.appendChild(meta);

    // Insert at top of host
    host.insertBefore(row, host.firstChild);

    // Click handler
    btn.addEventListener('click', async ()=>{
      await doSync(btn, meta);
    });
  }

  async function doSync(btn, meta){
    try{
      btn.classList.add('syncing');
      const spin = btn.querySelector('.spin');
      if(spin) spin.style.display = 'inline-block';

      // Read local data and push to JSON
      const data = getLocal();

      // Choose strategy: local write if file:// or localhost; else download
      const isLocal = location.protocol === 'file:' || ['localhost','127.0.0.1','::1'].includes(location.hostname);

      if(isLocal){
        try{
          await writeLocalFile(data);
        }catch(err){
          // Fallback to download if user cancels or fails
          await downloadJSON('cotizaciones.json', data);
        }
      }else{
        await downloadJSON('cotizaciones.json', data);
      }

      const n = nowLabel();
      localStorage.setItem(LAST_SYNC_KEY, n);
      if(meta) meta.textContent = '🕒 Última sincronización: ' + n;

      // Success toast
      showToast(true, '✅ Cotización guardada y sincronizada correctamente');

      // Refresh charts and counters
      refreshCharts();

    }catch(e){
      console.error('Hybrid sync error:', e);
      showToast(false, '❌ Error al sincronizar, intente nuevamente');
    }finally{
      // stop spinner, animate check briefly by swapping label
      if(btn){
        const spin = btn.querySelector('.spin');
        if(spin) spin.style.display = 'none';
        btn.classList.remove('syncing');
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ Sincronizado';
        setTimeout(()=>{ btn.innerHTML = '💾 Sincronizar JSON <span class="spin" style="display:none"></span>'; }, 900);
      }
    }
  }

  // Wrap an existing save function if present to auto-sync
  (function hookSave(){
    const fn = window.saveCotizacion || window.saveCotizacion || window.saveCotizacionNueva;
    if(typeof fn === 'function'){
      const original = fn;
      window.saveCotizacion = async function(...args){
        const r = await original.apply(this, args);
        // small delay to ensure localStorage updated by original
        setTimeout(()=>{
          const btn = document.querySelector('.btn-sync');
          const meta = document.querySelector('.sync-meta');
          doSync(btn, meta);
        }, 30);
        return r;
      }
    }else{
      // If there's a "Guardar cotización" button, attach listener after click
      document.addEventListener('click', (ev)=>{
        const t = ev.target;
        if(t && t.matches('button, .btn, .button') && /guardar.*cotiz/i.test((t.textContent||'').toLowerCase())){
          setTimeout(()=>{
            const btn = document.querySelector('.btn-sync');
            const meta = document.querySelector('.sync-meta');
            doSync(btn, meta);
          }, 50);
        }
      }, true);
    }
  })();

  // Wait DOM and inject
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureSyncUI);
  }else{
    ensureSyncUI();
  }

})();
