'use strict';
const { shell } = require('./shell');

function editAnnualHTML(a, saved) {
  const officers = a.officers || [];
  const pms      = a.subscribing_past_masters || [];
  const hms      = a.honorary_members || [];
  const dates    = a.meeting_dates || [];
  const contacts = a.contacts || {};
  const wm  = contacts.wm  || {};
  const tr  = contacts.treasurer || {};
  const sec = contacts.secretary || {};
  const rgo = a.responsible_go || {};
  const crep = a.charities_rep || {};
  const comm = a.committees || {};

  const officerRows = (officers.length ? officers : [{ display: '', role: '' }])
    .map((o, i) => `
    <div class="dyn-row" id="off-${i}">
      <div class="form-grid three-col">
        <div class="form-group span2">
          <label>Name &amp; Honours</label>
          <input type="text" name="officer_display[]" value="${e(o.display)}"
            placeholder="e.g. W. Bro. P.L. STALLARD* PProvJGW">
        </div>
        <div class="form-group">
          <label>Role</label>
          <input type="text" name="officer_role[]" value="${e(o.role)}"
            placeholder="e.g. Master">
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-danger dyn-remove"
        onclick="removeRow('off-${i}')">Remove</button>
    </div>`).join('');

  const pmRows = (pms.length ? pms : [{ name: '', honours: '', years: '' }])
    .map((pm, i) => `
    <div class="dyn-row" id="pm-${i}">
      <div class="form-grid three-col">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="pm_name[]" value="${e(pm.name)}" placeholder="e.g. K. ATKINSON">
        </div>
        <div class="form-group">
          <label>Honours</label>
          <input type="text" name="pm_honours[]" value="${e(pm.honours)}" placeholder="e.g. PProvJGW">
        </div>
        <div class="form-group">
          <label>Year(s) as WM</label>
          <input type="text" name="pm_years[]" value="${e(pm.years)}" placeholder="e.g. 2001/02">
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-danger dyn-remove"
        onclick="removeRow('pm-${i}')">Remove</button>
    </div>`).join('');

  const hmRows = (hms.length ? hms : [{ name: '', honours: '', wm_years: '' }])
    .map((hm, i) => `
    <div class="dyn-row" id="hm-${i}">
      <div class="form-grid three-col">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="hm_name[]" value="${e(hm.name)}" placeholder="e.g. B.W. DENTON">
        </div>
        <div class="form-group">
          <label>Honours</label>
          <input type="text" name="hm_honours[]" value="${e(hm.honours)}" placeholder="e.g. PSGD">
        </div>
        <div class="form-group">
          <label>WM Year(s)</label>
          <input type="text" name="hm_wm_years[]" value="${e(hm.wm_years || '')}" placeholder="e.g. WM2009/10">
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-danger dyn-remove"
        onclick="removeRow('hm-${i}')">Remove</button>
    </div>`).join('');

  const dateRows = (dates.length ? dates : [{ date: '', type: 'Regular' }])
    .map((md, i) => `
    <div class="dyn-row" id="md-${i}">
      <div class="form-grid two-col">
        <div class="form-group">
          <label>Date</label>
          <input type="text" name="md_date[]" value="${e(md.date)}" placeholder="e.g. 9th February">
        </div>
        <div class="form-group">
          <label>Type</label>
          <select name="md_type[]">
            ${['Regular','Installation','Friends & Family','Emergency'].map(t =>
              `<option value="${e(t)}"${md.type === t ? ' selected' : ''}>${e(t)}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-danger dyn-remove"
        onclick="removeRow('md-${i}')">Remove</button>
    </div>`).join('');

  return shell('Annual Settings', `
    ${saved ? `<div class="alert-success">Settings saved successfully.</div>` : ''}

    <div class="page-header">
      <h1>Annual Settings</h1>
      <p class="subtitle">Updated each season — officers, past masters, meeting dates</p>
    </div>

    <form method="POST" action="/settings/annual">

      <!-- Season -->
      <div class="card">
        <div class="card-header"><h2>Season</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Season</label>
            <input type="text" name="season" value="${e(a.season || '')}" placeholder="e.g. 2025-2026">
          </div>
        </div>
      </div>

      <!-- Officers -->
      <div class="card">
        <div class="card-header">
          <h2>Officers</h2>
          <button type="button" class="btn btn-outline"
            onclick="addOfficer()">+ Add Officer</button>
        </div>
        <div class="card-body">
          <p class="hint">Enter the full formatted name including rank, suffix (*) and honours.</p>
          <div id="officers-list">${officerRows}</div>
        </div>
      </div>

      <!-- Stewards -->
      <div class="card">
        <div class="card-header"><h2>Stewards</h2></div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Stewards text (appears below officers list)</label>
            <textarea name="stewards_text" rows="2">${e(a.stewards_text || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Committees -->
      <div class="card">
        <div class="card-header"><h2>Committees &amp; Representatives</h2></div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Finance &amp; General Purposes Committee</label>
            <input type="text" name="finance_gp" value="${e(comm.finance_gp || '')}">
          </div>
          <div class="form-group form-full">
            <label>Charities Committee</label>
            <input type="text" name="charities" value="${e(comm.charities || '')}">
          </div>
          <div class="form-group form-full">
            <label>Charities Representative — Description</label>
            <textarea name="charities_rep_desc" rows="2">${e(crep.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Charities Representative — Name</label>
            <input type="text" name="charities_rep_name" value="${e(crep.name || '')}"
              placeholder="e.g. J. P. Rushbrook">
          </div>
        </div>
      </div>

      <!-- Responsible Grand Officer -->
      <div class="card">
        <div class="card-header"><h2>Responsible Grand Officer</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Rank</label>
            <input type="text" name="rgo_rank" value="${e(rgo.rank || '')}" placeholder="W.Bro.">
          </div>
          <div class="form-group">
            <label>Name &amp; Honours</label>
            <input type="text" name="rgo_name" value="${e(rgo.name || '')}"
              placeholder="e.g. Nicholas Deakin PAGStB">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="text" name="rgo_phone" value="${e(rgo.phone || '')}">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="rgo_email" value="${e(rgo.email || '')}">
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="card">
        <div class="card-header"><h2>Key Contacts</h2></div>
        <div class="form-grid">
          <div class="form-group"><label>WM Label</label>
            <input type="text" name="wm_label" value="${e(wm.label || 'W.M.')}"></div>
          <div class="form-group"><label>WM Name</label>
            <input type="text" name="wm_name" value="${e(wm.name || '')}"></div>
          <div class="form-group form-full"><label>WM Address</label>
            <input type="text" name="wm_address" value="${e(wm.address || '')}"></div>
          <div class="form-group"><label>WM Phone</label>
            <input type="text" name="wm_phone" value="${e(wm.phone || '')}"></div>
          <div class="form-group"><label>WM Email</label>
            <input type="email" name="wm_email" value="${e(wm.email || '')}"></div>
        </div>
        <div class="form-divider"></div>
        <div class="form-grid">
          <div class="form-group"><label>Treasurer Label</label>
            <input type="text" name="tr_label" value="${e(tr.label || 'Treasurer')}"></div>
          <div class="form-group"><label>Treasurer Name</label>
            <input type="text" name="tr_name" value="${e(tr.name || '')}"></div>
          <div class="form-group form-full"><label>Treasurer Address</label>
            <input type="text" name="tr_address" value="${e(tr.address || '')}"></div>
          <div class="form-group"><label>Treasurer Phone</label>
            <input type="text" name="tr_phone" value="${e(tr.phone || '')}"></div>
          <div class="form-group"><label>Treasurer Email</label>
            <input type="email" name="tr_email" value="${e(tr.email || '')}"></div>
        </div>
        <div class="form-divider"></div>
        <div class="form-grid">
          <div class="form-group"><label>Secretary Label</label>
            <input type="text" name="sec_label" value="${e(sec.label || 'Secretary & Data Controller')}"></div>
          <div class="form-group"><label>Secretary Name</label>
            <input type="text" name="sec_name" value="${e(sec.name || '')}"></div>
          <div class="form-group form-full"><label>Secretary Address</label>
            <input type="text" name="sec_address" value="${e(sec.address || '')}"></div>
          <div class="form-group"><label>Secretary Phone</label>
            <input type="text" name="sec_phone" value="${e(sec.phone || '')}"></div>
          <div class="form-group"><label>Secretary Email</label>
            <input type="email" name="sec_email" value="${e(sec.email || '')}"></div>
        </div>
      </div>

      <!-- Subscribing Past Masters -->
      <div class="card">
        <div class="card-header">
          <h2>Subscribing Past Masters</h2>
          <button type="button" class="btn btn-outline" onclick="addPM()">+ Add Past Master</button>
        </div>
        <div class="card-body">
          <p class="hint">These appear down the spine of the inner sheet. Years can include multiple entries separated by commas or newlines.</p>
          <div id="pm-list">${pmRows}</div>
        </div>
      </div>

      <!-- Honorary Members -->
      <div class="card">
        <div class="card-header">
          <h2>Honorary Members</h2>
          <button type="button" class="btn btn-outline" onclick="addHM()">+ Add Honorary Member</button>
        </div>
        <div class="card-body">
          <div id="hm-list">${hmRows}</div>
        </div>
      </div>

      <!-- Meal & Payment info -->
      <div class="card">
        <div class="card-header"><h2>Meals &amp; Payment</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Meal Price (£)</label>
            <input type="number" name="meal_price" value="${e(String(a.meal_price || 25))}" min="0">
          </div>
          <div class="form-group">
            <label>Bank Sort Code</label>
            <input type="text" name="bank_sort_code" value="${e(a.bank_sort_code || '')}"
              placeholder="e.g. 20-40-09">
          </div>
          <div class="form-group">
            <label>Bank Account Number</label>
            <input type="text" name="bank_account" value="${e(a.bank_account || '')}"
              placeholder="e.g. AC40579939">
          </div>
          <div class="form-group">
            <label>Payment Contact Email</label>
            <input type="email" name="meal_contact_email" value="${e(a.meal_contact_email || '')}">
          </div>
          <div class="form-group form-full">
            <label>WhatsApp / Apologies Note</label>
            <input type="text" name="meal_whatsapp_note" value="${e(a.meal_whatsapp_note || '')}"
              placeholder="e.g. Please book or record apologies via WhatsApp link">
          </div>
        </div>
      </div>

      <!-- Meeting dates for the season -->
      <div class="card">
        <div class="card-header">
          <h2>Meeting Dates — Season ${e(a.season || '')}</h2>
          <button type="button" class="btn btn-outline" onclick="addDate()">+ Add Date</button>
        </div>
        <div class="card-body">
          <p class="hint">These appear on the back of the inner sheet. Include the year in the last entry if it rolls over.</p>
          <div id="dates-list">${dateRows}</div>
        </div>
      </div>

      <div class="form-actions">
        <a class="btn btn-ghost" href="/">Cancel</a>
        <button type="submit" class="btn btn-primary">Save Annual Settings</button>
      </div>

    </form>

    <script>
    let offIdx = ${officers.length || 1};
    let pmIdx  = ${pms.length || 1};
    let hmIdx  = ${hms.length || 1};
    let mdIdx  = ${dates.length || 1};

    function removeRow(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }

    function addOfficer() {
      const el = document.createElement('div');
      el.innerHTML = \`<div class="dyn-row" id="off-\${offIdx}">
        <div class="form-grid three-col">
          <div class="form-group span2">
            <label>Name &amp; Honours</label>
            <input type="text" name="officer_display[]" placeholder="e.g. W. Bro. P.L. STALLARD*">
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" name="officer_role[]" placeholder="e.g. Master">
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-danger dyn-remove"
          onclick="removeRow('off-\${offIdx}')">Remove</button>
      </div>\`;
      document.getElementById('officers-list').appendChild(el.firstElementChild);
      offIdx++;
    }

    function addPM() {
      const el = document.createElement('div');
      el.innerHTML = \`<div class="dyn-row" id="pm-\${pmIdx}">
        <div class="form-grid three-col">
          <div class="form-group"><label>Name</label>
            <input type="text" name="pm_name[]" placeholder="e.g. K. ATKINSON"></div>
          <div class="form-group"><label>Honours</label>
            <input type="text" name="pm_honours[]" placeholder="e.g. PProvJGW"></div>
          <div class="form-group"><label>Year(s) as WM</label>
            <input type="text" name="pm_years[]" placeholder="e.g. 2001/02"></div>
        </div>
        <button type="button" class="btn btn-sm btn-danger dyn-remove"
          onclick="removeRow('pm-\${pmIdx}')">Remove</button>
      </div>\`;
      document.getElementById('pm-list').appendChild(el.firstElementChild);
      pmIdx++;
    }

    function addHM() {
      const el = document.createElement('div');
      el.innerHTML = \`<div class="dyn-row" id="hm-\${hmIdx}">
        <div class="form-grid three-col">
          <div class="form-group"><label>Name</label>
            <input type="text" name="hm_name[]" placeholder="e.g. B.W. DENTON"></div>
          <div class="form-group"><label>Honours</label>
            <input type="text" name="hm_honours[]" placeholder="e.g. PSGD"></div>
          <div class="form-group"><label>WM Year(s)</label>
            <input type="text" name="hm_wm_years[]" placeholder="e.g. WM2009/10"></div>
        </div>
        <button type="button" class="btn btn-sm btn-danger dyn-remove"
          onclick="removeRow('hm-\${hmIdx}')">Remove</button>
      </div>\`;
      document.getElementById('hm-list').appendChild(el.firstElementChild);
      hmIdx++;
    }

    function addDate() {
      const el = document.createElement('div');
      el.innerHTML = \`<div class="dyn-row" id="md-\${mdIdx}">
        <div class="form-grid two-col">
          <div class="form-group"><label>Date</label>
            <input type="text" name="md_date[]" placeholder="e.g. 9th February"></div>
          <div class="form-group"><label>Type</label>
            <select name="md_type[]">
              <option value="Regular">Regular</option>
              <option value="Installation">Installation</option>
              <option value="Friends &amp; Family">Friends &amp; Family</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-danger dyn-remove"
          onclick="removeRow('md-\${mdIdx}')">Remove</button>
      </div>\`;
      document.getElementById('dates-list').appendChild(el.firstElementChild);
      mdIdx++;
    }
    </script>
  `);
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { editAnnualHTML };
