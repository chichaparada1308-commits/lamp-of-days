(function () {
  const KEYS = ['entries', 'order', 'measures', 'height'];

  const css = document.createElement('style');
  css.textContent =
    '#backup{margin-top:24px;display:flex;flex-direction:column;gap:8px}' +
    '#backup button{padding:12px;border-radius:10px;border:1px solid #444;background:#1c1c1c;color:#ddd;font-size:14px}' +
    '#bkMsg{font-size:12px;color:#888;min-height:16px}';
  document.head.appendChild(css);

  const box = document.createElement('div');
  box.id = 'backup';
  box.innerHTML =
    '<button id="bkSave">Зберегти резервну копію</button>' +
    '<button id="bkLoad">Відновити з копії</button>' +
    '<input type="file" id="bkFile" accept="application/json,.json" style="display:none">' +
    '<div id="bkMsg"></div>';
  document.getElementById('panel').appendChild(box);
  const msg = document.getElementById('bkMsg');

  function pad(n) { return String(n).padStart(2, '0'); }

  document.getElementById('bkSave').onclick = () => {
    const data = { app: 'lamp-of-days', version: 1, saved: new Date().toISOString() };
    KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = v; });
    const d = new Date();
    const name = 'lamp-backup-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    msg.textContent = 'Збережено файл ' + name;
  };

  document.getElementById('bkLoad').onclick = () => document.getElementById('bkFile').click();

  document.getElementById('bkFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let data;
      try { data = JSON.parse(r.result); } catch (err) { msg.textContent = 'Це не схоже на файл копії.'; return; }
      if (!data || data.app !== 'lamp-of-days') { msg.textContent = 'Це не файл копії Лампи днів.'; return; }
      if (!confirm('Замінити поточні записи даними з копії від ' + (data.saved || '?') + '?')) return;
      KEYS.forEach(k => { if (typeof data[k] === 'string') localStorage.setItem(k, data[k]); });
      location.reload();
    };
    r.readAsText(f);
    e.target.value = '';
  };
})();
