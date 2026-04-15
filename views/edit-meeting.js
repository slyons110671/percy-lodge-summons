'use strict';
const { shell } = require('./shell');

function editMeetingHTML(meeting, annual) {
  const isNew = !meeting;
  const m = meeting || {
    id: '', meeting_date: '', meeting_day: 'Monday',
    meeting_type: 'Regular Meeting', letter_date: '',
    business_items: [{ heading: '', body: '' }]
  };
  const title = isNew ? 'New Meeting' : `Edit — ${m.meeting_date || m.id}`;
  const action = isNew ? '/meeting' : `/meeting/${e(m.id)}`;
  const types = ['Regular Meeting','Installation Meeting','Friends & Family Meeting','Emergency Meeting'];

  const itemsHTML = (m.business_items.length ? m.business_items : [{ heading: '', body: '' }])
    .map((item, i) => itemRow(i, item.heading, item.body))
    .join('');

  return shell(title, `
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

    <form method="POST" action="${action}">

      <div class="card">
        <div class="card-header"><h2>Meeting Details</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Meeting Date</label>
            <input type="text" name="meeting_date" value="${e(m.meeting_date)}"
              placeholder="e.g. 13th April 2026" required>
          </div>
          <div class="form-group">
            <label>Day of Week</label>
            <input type="text" name="meeting_day" value="${e(m.meeting_day)}" placeholder="Monday">
          </div>
          <div class="form-group">
            <label>Meeting Type</label>
            <select name="meeting_type">
              ${types.map(t => `<option value="${e(t)}"${m.meeting_type === t ? ' selected' : ''}>${e(t)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Letter Date <small>(when the summons is issued)</small></label>
            <input type="text" name="letter_date" value="${e(m.letter_date)}"
              placeholder="e.g. 13th October 2025">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Business Items</h2>
          <button type="button" class="btn btn-outline" onclick="addItem()">+ Add Item</button>
        </div>
        <div class="card-body">
          <p class="hint">Items appear in order on the summons. Leave "Heading" blank for a plain paragraph.</p>
          <div id="biz-items">${itemsHTML}</div>
        </div>
      </div>

      <div class="form-actions">
        <a class="btn btn-ghost" href="/">Cancel</a>
        <button type="submit" class="btn btn-primary">Save Meeting</button>
      </div>
    </form>

    <script>
    let idx = ${m.business_items.length || 1};

    function addItem() {
      const el = document.createElement('div');
      el.innerHTML = buildRow(idx, '', '');
      document.getElementById('biz-items').appendChild(el.firstElementChild);
      idx++;
    }

    function removeItem(i) {
      const el = document.getElementById('biz-' + i);
      if (el) el.remove();
    }

    function buildRow(i, heading, body) {
      return \`<div class="biz-row" id="biz-\${i}">
        <div class="biz-row-header">
          <span class="biz-label">Item \${i + 1}</span>
          <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(\${i})">Remove</button>
        </div>
        <div class="form-grid two-col">
          <div class="form-group">
            <label>Heading <small>(optional — e.g. To Raise, To Ballot, Coach)</small></label>
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
    </script>
  `);
}

function itemRow(i, heading, body) {
  return `<div class="biz-row" id="biz-${i}">
    <div class="biz-row-header">
      <span class="biz-label">Item ${i + 1}</span>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(${i})">Remove</button>
    </div>
    <div class="form-grid two-col">
      <div class="form-group">
        <label>Heading <small>(optional — e.g. To Raise, To Ballot, Coach)</small></label>
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
