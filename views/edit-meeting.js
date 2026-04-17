'use strict';
const { shell } = require('./shell');

// Convert "13th April 2026" → "2026-04-13" for <input type="date">
function parseDateToISO(str) {
  if (!str) return '';
  const months = {
    january:'01', february:'02', march:'03', april:'04',
    may:'05', june:'06', july:'07', august:'08',
    september:'09', october:'10', november:'11', december:'12'
  };
  const m = str.match(/(\d+)\w*\s+(\w+)\s+(\d{4})/);
  if (!m) return '';
  const day   = m[1].padStart(2, '0');
  const month = months[m[2].toLowerCase()];
  if (!month) return '';
  return `${m[3]}-${month}-${day}`;
}

function buildTemplatesJSON(templates) {
  return JSON.stringify(templates)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function editMeetingHTML(meeting, annual, templates) {
  const isNew = !meeting;
  const m = meeting || {
    id: '', meeting_date: '', meeting_day: 'Monday',
    meeting_type: 'Regular Meeting', letter_date: '',
    coach_date: '',
    business_items: [{ heading: '', body: '' }]
  };
  const title  = isNew ? 'New Meeting' : `Edit — ${m.meeting_date || m.id}`;
  const action = isNew ? '/meeting' : `/meeting/${e(m.id)}`;
  const types  = ['Regular Meeting','Installation Meeting','Friends & Family Meeting','Emergency Meeting'];

  const itemsHTML = (m.business_items.length ? m.business_items : [{ heading: '', body: '' }])
    .map((item, i) => itemRow(i, item.heading, item.body))
    .join('');

  const meetingDateISO = parseDateToISO(m.meeting_date);
  const letterDateISO  = parseDateToISO(m.letter_date);
  const coachDateISO   = parseDateToISO(m.coach_date);

  return shell(title, `
    <style>
      input[type=date] {
        padding: 7px 10px;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius);
        font-size: 13px; font-family: inherit;
        color: var(--text); background: white;
        transition: border-color .12s, box-shadow .12s;
        width: 100%;
      }
      input[type=date]:focus {
        outline: none; border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(37,99,235,.1);
      }
      .date-display {
        font-size: 12px; color: var(--gray-600);
        margin-top: 3px; min-height: 16px; font-style: italic;
      }

      /* ── Two-column edit layout ── */
      .edit-layout {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 20px;
        align-items: start;
      }
      .edit-preview-col {
        position: sticky;
        top: 64px;
      }
      .preview-card {
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .preview-card-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
      }
      .preview-card-header h2 { margin: 0; font-size: 13px; }
      .preview-card-badge {
        font-size: 10px; font-weight: 600; letter-spacing: .05em;
        text-transform: uppercase; color: var(--gray-600);
      }
      .preview-body {
        padding: 14px;
        font-family: 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        max-height: calc(100vh - 140px);
        overflow-y: auto;
      }
      .prev-meeting-info {
        text-align: center; font-size: 7pt;
        color: #555; margin-bottom: 8px; line-height: 1.5;
        border-bottom: .5pt solid #ccc; padding-bottom: 6px;
      }
      .prev-business-title {
        text-align: center; font-size: 10pt; font-weight: bold;
        text-decoration: underline; margin-bottom: 6px;
      }
      .prev-biz-item {
        font-size: 8pt; line-height: 1.42; text-align: center;
        margin-bottom: 4px;
      }
      .prev-biz-item strong { font-size: 9pt; }
      .prev-biz-sep {
        text-align: center; color: #999;
        font-size: 6.5pt; margin-bottom: 4px;
      }
      .prev-empty {
        text-align: center; color: #aaa;
        font-style: italic; font-size: 7.5pt;
        padding: 20px 0;
      }

      /* ── Drag handles ── */
      .biz-row { cursor: default; }
      .biz-row.drag-over {
        border-color: var(--blue);
        background: #eff6ff;
      }
      .biz-row.dragging { opacity: .4; }
      .drag-handle {
        cursor: grab;
        color: var(--gray-400);
        font-size: 16px;
        padding: 0 6px;
        user-select: none;
        line-height: 1;
        flex-shrink: 0;
      }
      .drag-handle:hover { color: var(--gray-600); }
      .drag-handle:active { cursor: grabbing; }

      /* ── Template picker modal ── */
      #tpl-overlay {
        display: none; position: fixed; inset: 0; z-index: 500;
        background: rgba(0,0,0,.45);
        align-items: center; justify-content: center;
      }
      #tpl-overlay.open { display: flex; }
      #tpl-modal {
        background: white; border-radius: 8px;
        width: 520px; max-width: 95vw; max-height: 80vh;
        display: flex; flex-direction: column;
        box-shadow: 0 16px 48px rgba(0,0,0,.2);
      }
      #tpl-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px; border-bottom: 1px solid var(--gray-200);
      }
      #tpl-modal-header h3 { margin: 0; font-size: 15px; }
      #tpl-modal-body { overflow-y: auto; padding: 12px 20px; flex: 1; }
      .tpl-category { margin-bottom: 16px; }
      .tpl-category-name {
        font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .07em;
        color: var(--gray-600); margin-bottom: 6px;
      }
      .tpl-item {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--gray-200); border-radius: var(--radius);
        margin-bottom: 4px; cursor: pointer;
        transition: background .1s, border-color .1s;
      }
      .tpl-item:hover { background: var(--gray-50); border-color: var(--blue); }
      .tpl-item-text { flex: 1; font-size: 13px; }
      .tpl-item-heading { font-weight: 600; }
      .tpl-item-body { color: var(--gray-600); font-size: 12px; }
      .tpl-item-add { font-size: 18px; color: var(--blue); flex-shrink: 0; line-height: 1; }
      #tpl-close {
        background: none; border: none; font-size: 20px;
        cursor: pointer; color: var(--gray-600); padding: 2px 6px; border-radius: 4px;
      }
      #tpl-close:hover { background: var(--gray-100); }
    </style>

    <div class="page-header">
      <div>
        <h1>${isNew ? 'New Meeting' : 'Edit Meeting'}</h1>
        ${!isNew ? `<p class="subtitle">${e(m.meeting_date || m.id)}</p>` : ''}
      </div>
      ${!isNew ? `
      <div class="header-actions">
        <a class="btn btn-ghost" href="/meeting/${e(m.id)}/preview/outer" target="_blank">Preview Outer</a>
        <a class="btn btn-ghost" href="/meeting/${e(m.id)}/preview/inner" target="_blank">Preview Inner</a>
        <a class="btn btn-primary" href="/meeting/${e(m.id)}/pdf">⬇ Download PDF</a>
      </div>` : ''}
    </div>

    <div class="edit-layout">

      <!-- LEFT: Form -->
      <div class="edit-form-col">
        <form method="POST" action="${action}" id="meeting-form">

          <div class="card">
            <div class="card-header"><h2>Meeting Details</h2></div>
            <div class="form-grid">

              <div class="form-group">
                <label>Meeting Date</label>
                <input type="date" id="meeting_date_picker"
                  value="${e(meetingDateISO)}"
                  onchange="onMeetingDateChange(this.value)">
                <input type="hidden" name="meeting_date" id="meeting_date_val" value="${e(m.meeting_date)}">
                <div class="date-display" id="meeting_date_display">${e(m.meeting_date)}</div>
              </div>

              <div class="form-group">
                <label>Day of Week</label>
                <input type="text" name="meeting_day" id="meeting_day"
                  value="${e(m.meeting_day)}" placeholder="Monday" oninput="updatePreview()">
              </div>

              <div class="form-group">
                <label>Meeting Type</label>
                <select name="meeting_type" id="meeting_type" onchange="updatePreview()">
                  ${types.map(t => `<option value="${e(t)}"${m.meeting_type === t ? ' selected' : ''}>${e(t)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Letter Date <small>(when the summons is issued)</small></label>
                <input type="date" id="letter_date_picker"
                  value="${e(letterDateISO)}"
                  onchange="onLetterDateChange(this.value)">
                <input type="hidden" name="letter_date" id="letter_date_val" value="${e(m.letter_date)}">
                <div class="date-display" id="letter_date_display">${e(m.letter_date)}</div>
              </div>

              <div class="form-group">
                <label>Coach (Practice) Date <small>(optional)</small></label>
                <input type="date" id="coach_date_picker"
                  value="${e(coachDateISO)}"
                  onchange="onCoachDateChange(this.value)">
                <input type="hidden" name="coach_date" id="coach_date_val" value="${e(m.coach_date)}">
                <div class="date-display" id="coach_date_display">${e(m.coach_date)}</div>
              </div>

            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Business Items</h2>
              <div style="display:flex;gap:8px;">
                <button type="button" class="btn btn-outline" onclick="openTemplates()">+ From Template</button>
                <button type="button" class="btn btn-outline" onclick="addItem('','')">+ Add Item</button>
              </div>
            </div>
            <div class="card-body">
              <p class="hint">Drag ⠿ to reorder. Leave "Heading" blank for a plain paragraph.</p>
              <div id="biz-items">${itemsHTML}</div>
            </div>
          </div>

          <div class="form-actions">
            <a class="btn btn-ghost" href="/">Cancel</a>
            <button type="submit" class="btn btn-primary">Save Meeting</button>
          </div>
        </form>
      </div>

      <!-- RIGHT: Live preview -->
      <div class="edit-preview-col">
        <div class="preview-card">
          <div class="preview-card-header">
            <h2>Live Preview</h2>
            <span class="preview-card-badge">Inner — Business</span>
          </div>
          <div class="preview-body">
            <div class="prev-meeting-info" id="prev-info"></div>
            <div class="prev-business-title">BUSINESS</div>
            <div id="prev-items"><div class="prev-empty">Add business items to see preview</div></div>
          </div>
        </div>
      </div>

    </div><!-- /.edit-layout -->

    <!-- Template picker modal -->
    <div id="tpl-overlay" onclick="overlayClick(event)">
      <div id="tpl-modal">
        <div id="tpl-modal-header">
          <h3>Add from Template</h3>
          <button id="tpl-close" onclick="closeTemplates()" title="Close">&times;</button>
        </div>
        <div id="tpl-modal-body"></div>
      </div>
    </div>

    <script>
    let idx = ${m.business_items.length || 1};

    // ── Date helpers ──────────────────────────────────────────────────────────
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    function ordinal(n) {
      const s = ['th','st','nd','rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    function formatDate(iso) {
      if (!iso) return '';
      const [y, mo, d] = iso.split('-').map(Number);
      return ordinal(d) + ' ' + MONTHS[mo - 1] + ' ' + y;
    }
    function getDayOfWeek(iso) {
      if (!iso) return '';
      const [y, mo, d] = iso.split('-').map(Number);
      return DAYS[new Date(y, mo - 1, d).getDay()];
    }
    function onMeetingDateChange(val) {
      const fmt = formatDate(val);
      document.getElementById('meeting_date_val').value     = fmt;
      document.getElementById('meeting_date_display').textContent = fmt;
      if (val) document.getElementById('meeting_day').value = getDayOfWeek(val);
      updatePreview();
    }
    function onLetterDateChange(val) {
      const fmt = formatDate(val);
      document.getElementById('letter_date_val').value     = fmt;
      document.getElementById('letter_date_display').textContent = fmt;
    }
    function onCoachDateChange(val) {
      const fmt = formatDate(val);
      document.getElementById('coach_date_val').value     = fmt;
      document.getElementById('coach_date_display').textContent = fmt;
    }

    // ── Live preview ──────────────────────────────────────────────────────────
    function updatePreview() {
      // Header info
      const date = document.getElementById('meeting_date_display').textContent;
      const day  = document.getElementById('meeting_day').value;
      const type = document.getElementById('meeting_type').value;
      document.getElementById('prev-info').innerHTML =
        '<strong>' + escHtml(day ? day + ' ' + date : date) + '</strong>' +
        (type ? '<br><em>' + escHtml(type) + '</em>' : '');

      // Business items (read in current DOM order)
      const rows = document.querySelectorAll('#biz-items .biz-row');
      let html = '';
      rows.forEach(row => {
        const h = (row.querySelector('input[name="business_heading[]"]') || {}).value || '';
        const b = (row.querySelector('textarea[name="business_body[]"]') || {}).value || '';
        if (!h && !b) return;
        const heading = h ? '<strong>' + escHtml(h) + '</strong><br>' : '';
        const body    = escHtml(b).replace(/\\n/g, '<br>');
        html += '<div class="prev-biz-item">' + heading + body + '</div>';
        html += '<div class="prev-biz-sep">--------------------</div>';
      });
      document.getElementById('prev-items').innerHTML =
        html || '<div class="prev-empty">Add business items to see preview</div>';
    }

    // Listen for any text change in the form
    document.getElementById('meeting-form').addEventListener('input', updatePreview);

    // Initial render
    updatePreview();

    // ── Business item rows ────────────────────────────────────────────────────
    function addItem(heading, body) {
      const el = document.createElement('div');
      el.innerHTML = buildRow(idx, heading, body);
      document.getElementById('biz-items').appendChild(el.firstElementChild);
      attachDrag(document.getElementById('biz-' + idx));
      idx++;
      renumber();
      updatePreview();
    }

    function removeItem(i) {
      const el = document.getElementById('biz-' + i);
      if (el) el.remove();
      renumber();
      updatePreview();
    }

    function renumber() {
      document.querySelectorAll('#biz-items .biz-row').forEach((row, i) => {
        const lbl = row.querySelector('.biz-label');
        if (lbl) lbl.textContent = 'Item ' + (i + 1);
      });
    }

    function buildRow(i, heading, body) {
      return \`<div class="biz-row" id="biz-\${i}">
        <div class="biz-row-header">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="drag-handle" title="Drag to reorder">⠿</span>
            <span class="biz-label">Item \${i + 1}</span>
          </div>
          <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(\${i})">Remove</button>
        </div>
        <div class="form-grid two-col">
          <div class="form-group">
            <label>Heading <small>(optional)</small></label>
            <input type="text" name="business_heading[]" value="\${esc(heading)}"
              placeholder="Leave blank for plain text">
          </div>
          <div class="form-group">
            <label>Body</label>
            <textarea name="business_body[]" rows="3" placeholder="Item details...">\${esc(body)}</textarea>
          </div>
        </div>
      </div>\`;
    }

    function esc(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function escHtml(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── Drag-and-drop reordering ──────────────────────────────────────────────
    let dragSrc = null;

    function attachDrag(row) {
      const handle = row.querySelector('.drag-handle');
      if (!handle) return;

      handle.addEventListener('mousedown', () => { row.draggable = true; });
      row.addEventListener('dragstart', e => {
        dragSrc = row;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => row.classList.add('dragging'), 0);
      });
      row.addEventListener('dragend', () => {
        row.draggable = false;
        row.classList.remove('dragging');
        document.querySelectorAll('#biz-items .biz-row').forEach(r => r.classList.remove('drag-over'));
        dragSrc = null;
        renumber();
        updatePreview();
      });
      row.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragSrc && dragSrc !== row) row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', e => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (!dragSrc || dragSrc === row) return;
        const container = document.getElementById('biz-items');
        const rows = [...container.querySelectorAll('.biz-row')];
        const srcIdx = rows.indexOf(dragSrc);
        const tgtIdx = rows.indexOf(row);
        if (srcIdx < tgtIdx) {
          container.insertBefore(dragSrc, row.nextSibling);
        } else {
          container.insertBefore(dragSrc, row);
        }
      });
    }

    // Attach drag to all existing rows on load
    document.querySelectorAll('#biz-items .biz-row').forEach(attachDrag);

    // ── Template picker ───────────────────────────────────────────────────────
    const TEMPLATES = ${buildTemplatesJSON(templates)};

    function openTemplates() {
      const body = document.getElementById('tpl-modal-body');
      body.innerHTML = TEMPLATES.map((cat, ci) =>
        '<div class="tpl-category">' +
        '<div class="tpl-category-name">' + escHtml(cat.category) + '</div>' +
        cat.items.map((item, ii) =>
          '<div class="tpl-item" onclick="applyTemplate(' + ci + ',' + ii + ')">' +
          '<div class="tpl-item-text">' +
          '<div class="tpl-item-heading">' + (item.heading ? escHtml(item.heading) : '<em style="color:var(--gray-400)">Plain paragraph</em>') + '</div>' +
          (item.body ? '<div class="tpl-item-body">' + escHtml(item.body) + '</div>' : '') +
          '</div><div class="tpl-item-add">+</div></div>'
        ).join('') +
        '</div>'
      ).join('');
      document.getElementById('tpl-overlay').classList.add('open');
    }

    function closeTemplates() {
      document.getElementById('tpl-overlay').classList.remove('open');
    }

    function overlayClick(e) {
      if (e.target === document.getElementById('tpl-overlay')) closeTemplates();
    }

    function applyTemplate(ci, ii) {
      const item = TEMPLATES[ci].items[ii];
      addItem(item.heading, item.body);
      closeTemplates();
    }
    </script>
  `);
}

function itemRow(i, heading, body) {
  return `<div class="biz-row" id="biz-${i}">
    <div class="biz-row-header">
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="biz-label">Item ${i + 1}</span>
      </div>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(${i})">Remove</button>
    </div>
    <div class="form-grid two-col">
      <div class="form-group">
        <label>Heading <small>(optional)</small></label>
        <input type="text" name="business_heading[]" value="${e(heading)}"
          placeholder="Leave blank for plain text">
      </div>
      <div class="form-group">
        <label>Body</label>
        <textarea name="business_body[]" rows="3" placeholder="Item details...">${e(body)}</textarea>
      </div>
    </div>
  </div>`;
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { editMeetingHTML };
