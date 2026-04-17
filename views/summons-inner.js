'use strict';

// Generates the INNER sheet HTML:
//   left  = inside front (Province header + formal letter)
//   centre = spine (Subscribing Past Masters + Hon. Members)
//   right  = inside back (Business + meals + dates)

function innerHTMLPage(meeting, annual, stat) {
  const province = stat.province || {};
  const lodge    = stat.lodge    || {};
  const charge   = stat.ancient_charge || '';

  const pms      = annual.subscribing_past_masters || [];
  const hms      = annual.honorary_members || [];
  const dates    = annual.meeting_dates || [];
  const price    = annual.meal_price || 25;
  const sortCode = annual.bank_sort_code || '';
  const account  = annual.bank_account || '';
  const mealEmail= annual.meal_contact_email || '';
  const whatsapp = annual.meal_whatsapp_note || '';

  const wm  = (annual.contacts || {}).wm  || {};
  const sec = (annual.contacts || {}).secretary || {};

  // Secretary name for signature — prefer the officers list so it stays in sync
  const secOfficer = (annual.officers || []).find(o => o.role === 'Secretary');
  const secSignName = secOfficer ? secOfficer.display : (sec.name ? `W. Bro. ${sec.name}` : '');

  const agms = (province.assistant_gms || []).map(a => `<div>${e(a)}</div>`).join('');

  // ── Spine: Past Masters list ──
  const pmList = pms.map(pm => `
    <div class="pm-entry">
      <strong>${e(pm.name)}</strong><br>
      ${pm.honours ? `${e(pm.honours)}<br>` : ''}
      ${pm.years ? e(pm.years).replace(/\n/g,'<br>') : ''}
    </div>
    <div class="spine-dash">-</div>`).join('');

  const hmList = hms.map(hm => `
    <div class="pm-entry">
      <strong>${e(hm.name)}</strong><br>
      ${hm.honours ? `${e(hm.honours)}<br>` : ''}
      ${hm.wm_years ? e(hm.wm_years) : ''}
    </div>`).join('');

  // ── Business items ──
  const businessHTML = (meeting.business_items || []).map(item => {
    const body = e(item.body).replace(/\n/g, '<br>');
    const heading = item.heading ? `<strong>${e(item.heading)}</strong><br>` : '';
    return `<div class="biz-item">${heading}${body}</div><div class="biz-sep">--------------------</div>`;
  }).join('');

  // ── Meeting dates ──
  const datesLine = dates.map((md, i) => {
    let label = md.date;
    if (md.type === 'Installation') label += ' Installation';
    if (md.type === 'Friends & Family') label += ' (friends & family)';
    return e(label) + (i < dates.length - 1 ? ',' : '');
  }).join('<br>');

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
    font-size: 7.5pt;
    overflow: hidden;
    background: white;
  }

  /* ── Inside front ── */
  .inside-front {
    width: 129mm; height: 210mm;
    padding: 5mm;
    flex-shrink: 0;
  }
  .if-box {
    width: 100%; height: 100%;
    border: 0.75pt solid #000;
    padding: 3mm 4mm;
    display: flex; flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .province-name {
    text-align: center; font-size: 12pt; font-weight: bold;
    text-transform: uppercase; line-height: 1.25;
  }
  .province-officers {
    text-align: center; font-size: 8pt; line-height: 1.5;
  }
  .province-officers .bold { font-weight: bold; }

  .rule { border-top: 0.5pt solid #aaa; }

  .ancient-charge {
    font-style: italic; font-size: 8.5pt; line-height: 1.4;
    color: #222; text-align: center;
  }

  .lodge-name {
    text-align: center; font-size: 12pt; font-weight: bold;
  }
  .lodge-warrant {
    text-align: center; font-size: 8.5pt; line-height: 1.45;
  }

  .master-name {
    font-weight: bold; font-style: italic; font-size: 10.5pt;
    text-align: center;
  }
  .master-venue {
    font-style: italic; font-size: 8.5pt; text-align: center; line-height: 1.4;
  }
  .letter-date {
    font-style: italic; font-size: 8.5pt;
  }
  .salutation { font-size: 9pt; }
  .letter-body { font-size: 9pt; line-height: 1.45; }
  .by-command {
    text-align: center; font-style: italic; font-size: 9pt;
  }
  .sig-name {
    text-align: center; font-weight: bold; font-size: 11pt;
  }
  .sig-title {
    text-align: center; font-style: italic; font-size: 9pt;
  }
  .dress { font-size: 9pt; }
  .footer-note { font-size: 7.5pt; font-style: italic; color: #444; line-height: 1.35; }

  /* ── Spine ── */
  .spine {
    width: 39mm; height: 210mm;
    padding: 5mm 2mm;
    flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
    font-size: 7pt; text-align: center;
    overflow: hidden;
  }
  .spine-title {
    font-size: 7pt; text-decoration: underline;
    margin-bottom: 2.5mm; line-height: 1.3;
  }
  .pm-entry {
    font-size: 6.8pt; line-height: 1.35; margin-bottom: 1mm;
  }
  .spine-dash { color: #999; font-size: 7pt; margin-bottom: 1mm; }
  .hm-title {
    font-size: 7pt; text-decoration: underline;
    margin: 3mm 0 2mm; line-height: 1.3;
  }

  /* ── Inside back ── */
  .inside-back {
    flex: 1; height: 210mm;
    padding: 5mm 5mm 5mm 0;
  }
  .ib-box {
    width: 100%; height: 100%;
    border: 0.75pt solid #000;
    padding: 3mm 4mm;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .business-title {
    text-align: center; font-size: 10pt; font-weight: bold; text-decoration: underline;
    margin-bottom: 2mm;
  }
  .biz-item {
    font-size: 8pt; line-height: 1.42; text-align: center;
    margin-bottom: 1.5mm;
  }
  .biz-item strong { font-size: 9pt; }
  .biz-sep { text-align: center; color: #888; font-size: 6.5pt; margin-bottom: 1.5mm; }

  .coach-block { text-align: center; }
  .coach-date { font-size: 8.5pt; margin-bottom: 1.5mm; }
  .meals-block { margin-top: auto; padding-top: 2mm; }
  .meals-big {
    text-align: center; font-size: 14pt; font-weight: bold; line-height: 1.2;
  }
  .meals-text { text-align: center; font-size: 7.5pt; line-height: 1.4; margin-bottom: 1mm; }
  .meals-bank { text-align: center; font-size: 7.5pt; line-height: 1.5; }
  .link { color: #1155cc; text-decoration: underline; }

  .dates-block {
    text-align: center; font-size: 7.5pt; line-height: 1.55;
    border-top: 0.5pt solid #ccc; margin-top: 2mm; padding-top: 1.5mm;
  }
  .visitors {
    text-align: center; font-size: 8pt; font-weight: bold;
    border-top: 0.5pt solid #ccc; margin-top: 2mm; padding-top: 1.5mm;
  }
</style>
</head>
<body>

<!-- LEFT: Inside front -->
<div class="inside-front">
  <div class="if-box">

    <div class="province-name">${e(province.name || '')}</div>

    <div class="province-officers">
      <div>${e((province.grand_master || {}).rank || '')} ${e((province.grand_master || {}).name || '')}</div>
      <div class="bold">${e((province.grand_master || {}).title || '')}</div>
      <div>${e((province.deputy_gm || {}).rank || '')} ${e((province.deputy_gm || {}).name || '')}</div>
      <div class="bold">${e((province.deputy_gm || {}).title || '')}</div>
      ${agms}
      <div class="bold">Assistant Provincial Grand Masters.</div>
    </div>

    <div class="rule"></div>

    <div class="ancient-charge">${e(charge)} - <em>Ancient Charge</em></div>

    <div class="rule"></div>

    <div class="lodge-name">${e(lodge.name || '')} No.${e(lodge.number || '')}</div>
    <div class="lodge-warrant">
      Acting under Warrant dated ${e(lodge.warrant_date || '')}.<br>
      and Centenary Warrant dated ${e(lodge.centenary_warrant_date || '')}.
    </div>

    <div class="rule"></div>

    <div class="master-name">${wm.name ? `W. Bro. ${e(wm.name)},` : ''} Master</div>
    <div class="master-venue">${e(lodge.venue || '')}</div>
    <div class="letter-date">${e(meeting.letter_date || '')}</div>

    <div class="salutation">Dear Sir &amp; Brother,</div>
    <div class="letter-body">
      You are requested to attend the duties of the Lodge on
      <strong>${e(meeting.meeting_day || '')} ${e(meeting.meeting_date || '')}</strong>
      at <strong>6.45 P.M.</strong> precisely, this being the ${e(meeting.meeting_type || '')}.
    </div>

    <div class="by-command">By command of the Worshipful Master.</div>
    <div class="sig-name">${e(secSignName)}</div>
    <div class="sig-title">Secretary.</div>

    <div class="dress">Dress: ${e(lodge.dress || '')}</div>
    <div class="footer-note">Any Brother changing his address should notify the Secretary at the earliest opportunity.</div>
  </div>
</div>

<!-- CENTRE: Spine -->
<div class="spine">
  <div class="spine-title">Subscribing<br>Past Masters</div>
  ${pmList}
  ${hms.length > 0 ? `<div class="hm-title">Hon. Members</div>${hmList}` : ''}
</div>

<!-- RIGHT: Inside back -->
<div class="inside-back">
  <div class="ib-box">
    <div class="business-title">BUSINESS</div>
    ${businessHTML}

    ${meeting.coach_date ? `
    <div class="coach-block">
      <div class="biz-sep">--------------------</div>
      <div class="coach-date"><strong>Coach:</strong> ${e(meeting.coach_date)}</div>
    </div>` : ''}

    <div class="meals-block">
      <div class="biz-sep">--------------------</div>
      <div class="meals-big">Meals ordered £${price}</div>
      <div class="meals-text">must be paid for even when absent.<br>${e(whatsapp)}</div>
      <div class="biz-sep">--------------------</div>
      <div class="meals-bank">
        £${price} to ${e(lodge.name || '')} SC${e(sortCode)}<br>
        ${e(account)}<br>
        Or contact <span class="link">${e(mealEmail)}</span>
      </div>

      <div class="dates-block">
        ${e(lodge.name || '')} meets at 6.45p.m. 2nd Mondays:<br>
        ${datesLine}
        <br>----------------
      </div>

      <div class="visitors">Visitors and Guests welcome.</div>
    </div>
  </div>
</div>

</body>
</html>`;
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { innerHTMLPage };
