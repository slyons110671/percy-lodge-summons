'use strict';
const { shell } = require('./shell');

function editStaticHTML(s, saved) {
  const prov  = s.province || {};
  const gm    = prov.grand_master || {};
  const dgm   = prov.deputy_gm   || {};
  const lodge = s.lodge || {};

  return shell('Lodge Settings', `
    ${saved ? `<div class="alert-success">Settings saved successfully.</div>` : ''}

    <div class="page-header">
      <div>
        <h1>Lodge Settings</h1>
        <p class="subtitle">These rarely change — Province, warrant dates, venue, Ancient Charge</p>
      </div>
    </div>

    <form method="POST" action="/settings/static">

      <!-- Province -->
      <div class="card">
        <div class="card-header"><h2>Province of Northumberland</h2></div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Province Name</label>
            <input type="text" name="province_name" value="${e(prov.name || '')}"
              placeholder="Province of Northumberland">
          </div>

          <div class="form-group"><label>Provincial Grand Master — Rank</label>
            <input type="text" name="gm_rank" value="${e(gm.rank || '')}" placeholder="R. W. Bro."></div>
          <div class="form-group"><label>Provincial Grand Master — Name</label>
            <input type="text" name="gm_name" value="${e(gm.name || '')}"></div>
          <div class="form-group form-full"><label>Provincial Grand Master — Title</label>
            <input type="text" name="gm_title" value="${e(gm.title || '')}"
              placeholder="Provincial Grand Master"></div>

          <div class="form-group"><label>Deputy Provincial Grand Master — Rank</label>
            <input type="text" name="dgm_rank" value="${e(dgm.rank || '')}" placeholder="V. W. Bro."></div>
          <div class="form-group"><label>Deputy Provincial Grand Master — Name &amp; Honours</label>
            <input type="text" name="dgm_name" value="${e(dgm.name || '')}"></div>
          <div class="form-group form-full"><label>Deputy Provincial Grand Master — Title</label>
            <input type="text" name="dgm_title" value="${e(dgm.title || '')}"
              placeholder="Deputy Provincial Grand Master"></div>

          <div class="form-group form-full">
            <label>Assistant Provincial Grand Masters <small>(one per line)</small></label>
            <textarea name="agm_names" rows="6">${e((prov.assistant_gms || []).join('\n'))}</textarea>
          </div>
        </div>
      </div>

      <!-- Lodge -->
      <div class="card">
        <div class="card-header"><h2>Lodge Details</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Lodge Name</label>
            <input type="text" name="lodge_name" value="${e(lodge.name || '')}" placeholder="Percy Lodge">
          </div>
          <div class="form-group">
            <label>Lodge Number</label>
            <input type="text" name="lodge_number" value="${e(lodge.number || '')}" placeholder="1427">
          </div>
          <div class="form-group">
            <label>Original Warrant Date</label>
            <input type="text" name="warrant_date" value="${e(lodge.warrant_date || '')}"
              placeholder="17th February 1873">
          </div>
          <div class="form-group">
            <label>Centenary Warrant Date</label>
            <input type="text" name="centenary_warrant_date" value="${e(lodge.centenary_warrant_date || '')}"
              placeholder="5th June 1973">
          </div>
          <div class="form-group form-full">
            <label>Venue</label>
            <input type="text" name="venue" value="${e(lodge.venue || '')}"
              placeholder="Fern Avenue Masonic Centre, Jesmond, Newcastle upon Tyne NE2 2RA">
          </div>
          <div class="form-group">
            <label>Meets</label>
            <input type="text" name="meets" value="${e(lodge.meets || '')}"
              placeholder="2nd Mondays at 6.45 P.M.">
          </div>
          <div class="form-group">
            <label>Dress</label>
            <input type="text" name="dress" value="${e(lodge.dress || '')}"
              placeholder="Dinner Jackets and White Gloves">
          </div>
        </div>
      </div>

      <!-- Ancient Charge -->
      <div class="card">
        <div class="card-header"><h2>Ancient Charge</h2></div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Text</label>
            <textarea name="ancient_charge" rows="4">${e(s.ancient_charge || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Front cover note -->
      <div class="card">
        <div class="card-header"><h2>Front Cover Note</h2></div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>RMBI / Festival Note <small>(appears in red below the cover image)</small></label>
            <input type="text" name="rmbi_note" value="${e(s.rmbi_note || '')}"
              placeholder="Patron of the 2020 RMBI Festival">
          </div>
        </div>
      </div>

      <div class="form-actions">
        <a class="btn btn-ghost" href="/">Cancel</a>
        <button type="submit" class="btn btn-primary">Save Lodge Settings</button>
      </div>

    </form>
  `);
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { editStaticHTML };
