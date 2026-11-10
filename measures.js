(function () {
  const TARGET = { weight: 87, waist: 87, neck: 43, shoulders: 130, chest: 112, biceps: 40,
                   bellyR: 95, bellyT: 92, shW: 1.49, chW: 1.29, wH: 0.48, navy: 20 };
  // [ключ, назва, одиниця, знаків після коми, напрямок: min = менше краще, max = більше краще]
  const ROWS = [
    ['weight', 'Вага', 'кг', 1, 'min'],
    ['waist', 'Талія', 'см', 1, 'min'],
    ['neck', 'Шия', 'см', 1, 'max'],
    ['shoulders', 'Плечі', 'см', 1, 'max'],
    ['chest', 'Груди', 'см', 1, 'max'],
    ['biceps', 'Біцепс', 'см', 1, 'max'],
    ['bellyR', 'Живіт розслаблений', 'см', 1, 'min'],
    ['bellyT', 'Живіт напружений', 'см', 1, 'min'],
    ['shW', 'Плечі / талія', '', 2, 'max'],
    ['chW', 'Груди / талія', '', 2, 'max'],
    ['wH', 'Талія / зріст', '', 2, 'min'],
    ['navy', 'Жир за Navy', '%', 1, 'min']
  ];
  const INPUTS = ROWS.slice(0, 8);

  let list = [];
  try { list = JSON.parse(localStorage.getItem('measures')) || []; } catch (e) {}
  let height = Number(localStorage.getItem('height')) || 181;

  const css = document.createElement('style');
  css.textContent =
    '#tabs{display:flex;width:100%;max-width:900px;gap:8px;padding:8px 12px;box-sizing:border-box}' +
    '#tabs button{flex:1;padding:10px;border-radius:10px;border:1px solid #444;background:#1c1c1c;color:#ddd;font-size:15px}' +
    '#tabs button.on{background:#e8e8e8;color:#111;font-weight:bold}' +
    '#mpanel{width:100%;max-width:900px;padding:0 12px 40px;box-sizing:border-box}' +
    '#mpanel h3{font-size:15px;margin:20px 0 8px;color:#aaa;font-weight:normal}' +
    '.mrow{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:6px 0 4px;font-size:14px}' +
    '.mrow small{color:#777}' +
    '.bar{height:6px;background:#222;border-radius:3px;margin-bottom:6px;overflow:hidden}' +
    '.bar i{display:block;height:100%}' +
    '.fld{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px}' +
    '.fld input{width:110px;padding:8px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#ddd;font-size:16px}' +
    '#msave{margin-top:12px;width:100%;padding:12px;border-radius:10px;border:none;background:#e8e8e8;color:#111;font-size:16px}' +
    '.hist{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#999;padding:4px 0}' +
    '.hist button{background:none;border:none;color:#777;font-size:18px}';
  document.head.appendChild(css);

  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function derive(m, h) {
    const d = Object.assign({}, m);
    d.shW = m.shoulders / m.waist;
    d.chW = m.chest / m.waist;
    d.wH = m.waist / h;
    d.navy = m.waist > m.neck
      ? 86.010 * Math.log10(m.waist - m.neck) - 70.041 * Math.log10(h) + 36.76
      : NaN;
    return d;
  }

  // 0 = червоний (на старті), 1 = зелений (мета досягнута)
  function progress(key, dir, cur, start) {
    const t = TARGET[key];
    if (!isFinite(cur)) return 0;
    if (dir === 'min') {
      if (cur <= t) return 1;
      return Math.max(0, Math.min(1, 1 - (cur - t) / Math.max(start - t, 0.05 * t)));
    }
    if (cur >= t) return 1;
    return Math.max(0, Math.min(1, 1 - (t - cur) / Math.max(t - start, 0.05 * t)));
  }

  const mp = document.createElement('div');
  mp.id = 'mpanel';
  mp.style.display = 'none';
  document.body.appendChild(mp);

  function render() {
    const sorted = list.slice().sort((a, b) => a.date.localeCompare(b.date));
    let html = '';
    if (sorted.length) {
      const first = sorted[0], last = sorted[sorted.length - 1];
      const start = derive(first, height), cur = derive(last, height);
      html += '<h3>Стан на ' + last.date + ' (початок: ' + first.date + ')</h3>';
      ROWS.forEach(r => {
        const key = r[0], v = cur[key];
        const p = progress(key, r[4], v, start[key]);
        const color = 'hsl(' + Math.round(p * 120) + ',70%,45%)';
        const shown = isFinite(v) ? v.toFixed(r[3]) + (r[2] ? ' ' + r[2] : '') : '—';
        html += '<div class="mrow"><span>' + r[1] + '</span><b>' + shown + '</b><small>мета ' +
          TARGET[key].toFixed(r[3]) + (r[2] ? ' ' + r[2] : '') + '</small></div>' +
          '<div class="bar"><i style="width:' + Math.max(p * 100, 4) + '%;background:' + color + '"></i></div>';
      });
    } else {
      html += '<h3>Заміри ще не вводились. Введи перші нижче.</h3>';
    }

    html += '<h3>Новий замір</h3>';
    html += '<div class="fld"><span>Дата</span><input type="date" id="mdate" value="' + today() + '"></div>';
    INPUTS.forEach(r => {
      html += '<div class="fld"><span>' + r[1] + ', ' + r[2] + '</span>' +
        '<input type="number" step="0.1" inputmode="decimal" id="m_' + r[0] + '"></div>';
    });
    html += '<div class="fld"><span>Зріст, см (для Navy)</span><input type="number" step="1" inputmode="numeric" id="mheight" value="' + height + '"></div>';
    html += '<button id="msave">Зберегти заміри</button>';

    html += '<h3>Історія</h3>';
    sorted.slice().reverse().forEach(m => {
      const d = derive(m, height);
      html += '<div class="hist"><span>' + m.date + ' · вага ' + m.weight + ' · талія ' + m.waist +
        ' · жир ' + (isFinite(d.navy) ? d.navy.toFixed(1) + '%' : '—') +
        '</span><button data-d="' + m.date + '">×</button></div>';
    });
    mp.innerHTML = html;

    document.getElementById('mheight').onchange = e => {
      const v = Number(e.target.value);
      if (v > 100 && v < 250) { height = v; localStorage.setItem('height', String(v)); }
      render();
    };
    document.getElementById('msave').onclick = () => {
      const m = { date: document.getElementById('mdate').value };
      if (!m.date) { alert('Вкажи дату'); return; }
      for (const r of INPUTS) {
        const v = parseFloat(String(document.getElementById('m_' + r[0]).value).replace(',', '.'));
        if (!(v > 0)) { alert('Заповни поле: ' + r[1]); return; }
        m[r[0]] = v;
      }
      if (!(m.waist > m.neck)) { alert('Талія має бути більшою за шию'); return; }
      list = list.filter(x => x.date !== m.date);
      list.push(m);
      localStorage.setItem('measures', JSON.stringify(list));
      render();
    };
    mp.querySelectorAll('.hist button').forEach(b => {
      b.onclick = () => {
        if (confirm('Видалити заміри за ' + b.dataset.d + '?')) {
          list = list.filter(x => x.date !== b.dataset.d);
          localStorage.setItem('measures', JSON.stringify(list));
          render();
        }
      };
    });
  }

  // Вкладки
  const tabs = document.createElement('div');
  tabs.id = 'tabs';
  tabs.innerHTML = '<button id="tabH" class="on">Звички</button><button id="tabM">Заміри</button>';
  document.body.insertBefore(tabs, document.body.firstChild);

  function showTab(name) {
    const habits = name === 'habits';
    ['pic', 'label', 'panel'].forEach(id => {
      document.getElementById(id).style.display = habits ? '' : 'none';
    });
    mp.style.display = habits ? 'none' : '';
    document.getElementById('tabH').className = habits ? 'on' : '';
    document.getElementById('tabM').className = habits ? '' : 'on';
    if (!habits) render();
  }
  document.getElementById('tabH').onclick = () => showTab('habits');
  document.getElementById('tabM').onclick = () => showTab('measures');
})();
