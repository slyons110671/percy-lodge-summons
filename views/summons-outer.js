'use strict';

// Generates the OUTER sheet HTML: left = back cover (officers), right = front cover (logo)
function outerHTML(meeting, annual, stat, baseUrl) {
  const season    = annual.season || '';
  const officers  = annual.officers || [];
  const stewards  = annual.stewards_text || '';
  const comm      = annual.committees || {};
  const crep      = annual.charities_rep || {};
  const rgo       = annual.responsible_go || {};
  const contacts  = annual.contacts || {};
  const rmbi      = stat.rmbi_note || '';

  const officerRows = officers.map(o => `
    <div class="officer-row">
      <span class="officer-name">${e(o.display)}</span>
      <span class="officer-leader"></span>
      <span class="officer-role">${e(o.role)}</span>
    </div>`).join('');

  const wm  = contacts.wm  || {};
  const tr  = contacts.treasurer || {};
  const sec = contacts.secretary || {};

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 297mm; height: 210mm;
    display: flex;
    font-family: 'Times New Roman', Times, serif;
    overflow: hidden;
    background: white;
  }

  /* ── Back cover ── */
  .back-cover {
    width: 148.5mm; height: 210mm;
    padding: 5mm;
    display: flex; align-items: center; justify-content: center;
  }
  .officers-box {
    width: 100%; height: 100%;
    border: 0.75pt solid #000;
    padding: 3.5mm 4.5mm;
    display: flex; flex-direction: column;
    font-size: 7.5pt;
  }
  .officers-title {
    text-align: center;
    font-size: 9pt; font-weight: bold; text-decoration: underline;
    margin-bottom: 2.5mm;
  }
  .officer-row {
    display: flex; align-items: baseline;
    line-height: 1.42;
  }
  .officer-name {
    font-weight: bold; white-space: nowrap; font-size: 7.5pt;
  }
  .officer-leader {
    flex: 1;
    border-bottom: 0.5pt dotted #555;
    margin: 0 2px 2.5px;
    min-width: 4px;
  }
  .officer-role {
    font-weight: bold; white-space: nowrap; font-size: 7.5pt; margin-left: 2px;
  }
  .stewards-row {
    font-weight: bold; font-size: 7.5pt; line-height: 1.4; margin-top: 1.5mm;
  }

  .divider { border-top: 0.5pt solid #ccc; margin: 2mm 0; }

  .committee-section { font-size: 6.8pt; }
  .committee-label { text-decoration: underline; display: block; }
  .committee-text { display: block; margin-bottom: 1.5mm; }
  .charities-rep { font-size: 6.8pt; margin-bottom: 1.5mm; line-height: 1.35; }
  .responsible-go { font-size: 6.8pt; margin-bottom: 1.5mm; line-height: 1.35; }

  .contact-block { font-size: 6.8pt; line-height: 1.4; margin-bottom: 1.5mm; }
  .contact-block a, .link { color: #1155cc; text-decoration: underline; }

  /* ── Front cover ── */
  .front-cover {
    width: 148.5mm; height: 210mm;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 4mm;
  }
  .cover-image {
    width: 128mm; height: auto; max-height: 185mm;
    object-fit: contain;
  }
  .rmbi-note {
    color: #cc0000; font-size: 13pt; font-weight: bold;
    text-align: center; margin-top: 3mm;
  }
</style>
</head>
<body>

<!-- LEFT: Back cover (Officers) -->
<div class="back-cover">
  <div class="officers-box">
    <div class="officers-title">OFFICERS for ${e(season)}</div>

    ${officerRows}

    ${stewards ? `<div class="stewards-row">${e(stewards).replace(/\n/g,'<br>')}</div>` : ''}

    <div class="divider"></div>

    <div class="committee-section">
      <span class="committee-label">Finance and General Purposes Committee</span>
      <span class="committee-text">${e(comm.finance_gp || '')}</span>
      <span class="committee-label">Charities Committee</span>
      <span class="committee-text">${e(comm.charities || '')}</span>
    </div>

    ${crep.description ? `<div class="charities-rep">${e(crep.description)} – ${e(crep.name || '')}.</div>` : ''}

    ${rgo.name ? `<div class="responsible-go">Responsible Grand Officer – ${e(rgo.rank)} ${e(rgo.name)}, m${e(rgo.phone)}<br>email – <span class="link">${e(rgo.email)}</span></div>` : ''}

    <div class="divider"></div>

    ${wm.name ? `<div class="contact-block"><strong>${e(wm.label)}</strong> – ${e(wm.address)}<br>Tel: ${e(wm.phone)} or email – <span class="link">${e(wm.email)}</span></div>` : ''}
    ${tr.name ? `<div class="contact-block"><strong>${e(tr.label)}</strong>. - ${e(tr.name)}, ${e(tr.address)}.<br>Tel: ${e(tr.phone)} or email – <span class="link">${e(tr.email)}</span></div>` : ''}
    ${sec.name ? `<div class="contact-block"><strong>${e(sec.label)}</strong> - ${e(sec.name)}, ${e(sec.address)}<br>Tel: ${e(sec.phone)} or email – <span class="link">${e(sec.email)}</span></div>` : ''}
  </div>
</div>

<!-- RIGHT: Front cover (Logo) -->
<div class="front-cover">
  <img class="cover-image" src="${baseUrl}/images/cover.png" alt="Percy Lodge No. 1427">
  ${rmbi ? `<div class="rmbi-note">${e(rmbi)}</div>` : ''}
</div>

</body>
</html>`;
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { outerHTML };
