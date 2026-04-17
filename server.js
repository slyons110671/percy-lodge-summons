'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MEETINGS_DIR  = path.join(DATA_DIR, 'meetings');
const TEMPLATES_FILE = path.join(DATA_DIR, 'business_templates.json');

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Data helpers ────────────────────────────────────────────────────────────
function loadStatic() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lodge_static.json'), 'utf8'));
}
function saveStatic(data) {
  fs.writeFileSync(path.join(DATA_DIR, 'lodge_static.json'), JSON.stringify(data, null, 2));
}
function loadAnnual() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lodge_annual.json'), 'utf8'));
}
function saveAnnual(data) {
  fs.writeFileSync(path.join(DATA_DIR, 'lodge_annual.json'), JSON.stringify(data, null, 2));
}
function loadMeeting(id) {
  return JSON.parse(fs.readFileSync(path.join(MEETINGS_DIR, `${id}.json`), 'utf8'));
}
function saveMeeting(id, data) {
  fs.writeFileSync(path.join(MEETINGS_DIR, `${id}.json`), JSON.stringify(data, null, 2));
}
function loadTemplates() {
  try { return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8')); } catch { return []; }
}
function saveTemplates(data) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
}
function deleteMeeting(id) {
  fs.unlinkSync(path.join(MEETINGS_DIR, `${id}.json`));
}
function listMeetings() {
  if (!fs.existsSync(MEETINGS_DIR)) return [];
  return fs.readdirSync(MEETINGS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(MEETINGS_DIR, f), 'utf8')))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ── Views ───────────────────────────────────────────────────────────────────
const { dashboardHTML } = require('./views/dashboard');
const { editMeetingHTML } = require('./views/edit-meeting');
const { editAnnualHTML }     = require('./views/edit-annual');
const { editStaticHTML }     = require('./views/edit-static');
const { editTemplatesHTML }  = require('./views/edit-templates');
const { outerHTML } = require('./views/summons-outer');
const { innerHTMLPage } = require('./views/summons-inner');

// ── Dashboard ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(dashboardHTML(listMeetings(), loadAnnual()));
});

// ── New meeting ──────────────────────────────────────────────────────────────
app.get('/meeting/new', (req, res) => {
  res.send(editMeetingHTML(null, loadAnnual(), loadTemplates()));
});

app.post('/meeting', (req, res) => {
  const meeting = parseMeetingForm(req.body);
  meeting.id = generateMeetingId(meeting.meeting_date);
  saveMeeting(meeting.id, meeting);
  res.redirect('/');
});

// ── Edit meeting ─────────────────────────────────────────────────────────────
app.get('/meeting/:id/edit', (req, res) => {
  try {
    res.send(editMeetingHTML(loadMeeting(req.params.id), loadAnnual(), loadTemplates()));
  } catch {
    res.status(404).send('Meeting not found');
  }
});

app.post('/meeting/:id', (req, res) => {
  const meeting = parseMeetingForm(req.body);
  meeting.id = req.params.id;
  saveMeeting(req.params.id, meeting);
  res.redirect('/');
});

// ── Delete meeting ────────────────────────────────────────────────────────────
app.post('/meeting/:id/delete', (req, res) => {
  try { deleteMeeting(req.params.id); } catch { /* already gone */ }
  res.redirect('/');
});

// ── Summons preview pages (also used by Puppeteer for PDF) ───────────────────
app.get('/meeting/:id/preview/outer', (req, res) => {
  try {
    const meeting = loadMeeting(req.params.id);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.send(outerHTML(meeting, loadAnnual(), loadStatic(), baseUrl));
  } catch (e) {
    res.status(404).send('Meeting not found: ' + e.message);
  }
});

app.get('/meeting/:id/preview/inner', (req, res) => {
  try {
    const meeting = loadMeeting(req.params.id);
    res.send(innerHTMLPage(meeting, loadAnnual(), loadStatic()));
  } catch (e) {
    res.status(404).send('Meeting not found: ' + e.message);
  }
});

// ── PDF download ──────────────────────────────────────────────────────────────
app.get('/meeting/:id/pdf', async (req, res) => {
  let browser;
  try {
    const puppeteer = require('puppeteer');
    const { PDFDocument } = require('pdf-lib');
    const baseUrl = `http://localhost:${PORT}`;

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });

    const pdfOpts = {
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    };

    const p1 = await browser.newPage();
    await p1.goto(`${baseUrl}/meeting/${req.params.id}/preview/outer`, { waitUntil: 'networkidle0' });
    const outerPdf = await p1.pdf(pdfOpts);

    const p2 = await browser.newPage();
    await p2.goto(`${baseUrl}/meeting/${req.params.id}/preview/inner`, { waitUntil: 'networkidle0' });
    const innerPdf = await p2.pdf(pdfOpts);

    await browser.close();
    browser = null;

    const merged = await PDFDocument.create();
    const [outerPage] = await merged.copyPages(await PDFDocument.load(outerPdf), [0]);
    const [innerPage] = await merged.copyPages(await PDFDocument.load(innerPdf), [0]);
    merged.addPage(outerPage);
    merged.addPage(innerPage);
    const bytes = await merged.save();

    const meeting = loadMeeting(req.params.id);
    const filename = `summons-${req.params.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(bytes));
  } catch (e) {
    if (browser) await browser.close();
    console.error('PDF error:', e);
    res.status(500).send('PDF generation failed: ' + e.message);
  }
});

// ── Business templates ────────────────────────────────────────────────────────
app.get('/settings/templates', (req, res) => {
  res.send(editTemplatesHTML(loadTemplates(), req.query.saved === '1'));
});

app.post('/settings/templates', (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).send('Invalid data');
  saveTemplates(req.body);
  res.json({ ok: true });
});

// ── Annual settings ───────────────────────────────────────────────────────────
app.get('/settings/annual', (req, res) => {
  res.send(editAnnualHTML(loadAnnual(), req.query.saved === '1', loadStatic()));
});

app.post('/settings/annual', (req, res) => {
  saveAnnual(parseAnnualForm(req.body));
  res.redirect('/settings/annual?saved=1');
});

// ── Static (lodge) settings ───────────────────────────────────────────────────
app.get('/settings/static', (req, res) => {
  res.send(editStaticHTML(loadStatic(), req.query.saved === '1'));
});

app.post('/settings/static', (req, res) => {
  saveStatic(parseStaticForm(req.body));
  res.redirect('/settings/static?saved=1');
});

// ── Form parsers ──────────────────────────────────────────────────────────────
function parseMeetingForm(body) {
  const headings = [].concat(body.business_heading || []);
  const bodies = [].concat(body.business_body || []);
  return {
    meeting_date: (body.meeting_date || '').trim(),
    meeting_day: (body.meeting_day || '').trim(),
    meeting_type: (body.meeting_type || 'Regular Meeting').trim(),
    letter_date: (body.letter_date || '').trim(),
    coach_date: (body.coach_date || '').trim(),
    business_items: headings
      .map((h, i) => ({ heading: h.trim(), body: (bodies[i] || '').trim() }))
      .filter(item => item.heading || item.body)
  };
}

function parseAnnualForm(body) {
  const zip = (keys, vals) => [].concat(keys || []).map((k, i) => [k, ([].concat(vals || []))[i] || '']);

  const officers = zip(body.officer_display, body.officer_role)
    .map(([display, role]) => ({ display: display.trim(), role: role.trim() }))
    .filter(o => o.display);

  const subscribing_past_masters = [].concat(body.pm_name || []).map((name, i) => ({
    name: name.trim(),
    honours: ([].concat(body.pm_honours || []))[i]?.trim() || '',
    years: ([].concat(body.pm_years || []))[i]?.trim() || ''
  })).filter(pm => pm.name);

  const honorary_members = [].concat(body.hm_name || []).map((name, i) => ({
    name: name.trim(),
    honours: ([].concat(body.hm_honours || []))[i]?.trim() || '',
    wm_years: ([].concat(body.hm_wm_years || []))[i]?.trim() || ''
  })).filter(hm => hm.name);

  const meeting_dates = [].concat(body.md_date || []).map((date, i) => ({
    date: date.trim(),
    type: ([].concat(body.md_type || []))[i]?.trim() || 'Regular'
  })).filter(md => md.date);

  return {
    season: (body.season || '').trim(),
    officers,
    stewards: [].concat(body.steward_name || []).map(n => n.trim()).filter(Boolean),
    committees: {
      finance_gp: (body.finance_gp || '').trim(),
      charities: (body.charities || '').trim()
    },
    charities_rep: {
      description: (body.charities_rep_desc || '').trim(),
      name: (body.charities_rep_name || '').trim()
    },
    responsible_go: {
      rank: (body.rgo_rank || '').trim(),
      name: (body.rgo_name || '').trim(),
      phone: (body.rgo_phone || '').trim(),
      email: (body.rgo_email || '').trim()
    },
    contacts: {
      wm: { label: body.wm_label || 'W.M.', name: body.wm_name || '', address: body.wm_address || '', phone: body.wm_phone || '', email: body.wm_email || '' },
      treasurer: { label: body.tr_label || 'Treasurer', name: body.tr_name || '', address: body.tr_address || '', phone: body.tr_phone || '', email: body.tr_email || '' },
      secretary: { label: body.sec_label || 'Secretary & Data Controller', name: body.sec_name || '', address: body.sec_address || '', phone: body.sec_phone || '', email: body.sec_email || '' }
    },
    subscribing_past_masters,
    honorary_members,
    meal_price: parseInt(body.meal_price) || 25,
    bank_sort_code: (body.bank_sort_code || '').trim(),
    bank_account: (body.bank_account || '').trim(),
    meal_contact_email: (body.meal_contact_email || '').trim(),
    meal_whatsapp_note: (body.meal_whatsapp_note || '').trim(),
    meeting_dates
  };
}

function parseStaticForm(body) {
  return {
    province: {
      name: (body.province_name || '').trim(),
      grand_master: { rank: body.gm_rank || '', name: body.gm_name || '', title: body.gm_title || '' },
      deputy_gm: { rank: body.dgm_rank || '', name: body.dgm_name || '', title: body.dgm_title || '' },
      assistant_gms: (body.agm_names || '').split('\n').map(l => l.trim()).filter(Boolean)
    },
    lodge: {
      name: (body.lodge_name || '').trim(),
      number: (body.lodge_number || '').trim(),
      warrant_date: (body.warrant_date || '').trim(),
      centenary_warrant_date: (body.centenary_warrant_date || '').trim(),
      venue: (body.venue || '').trim(),
      meets: (body.meets || '').trim(),
      dress: (body.dress || '').trim()
    },
    ancient_charge: (body.ancient_charge || '').trim(),
    rmbi_note: (body.rmbi_note || '').trim(),
    officer_roles: (body.officer_roles || '').split('\n').map(l => l.trim()).filter(Boolean)
  };
}

function generateMeetingId(dateStr) {
  const months = { january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
                   july:'07', august:'08', september:'09', october:'10', november:'11', december:'12' };
  const lower = dateStr.toLowerCase();
  let month = '00';
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) { month = num; break; }
  }
  const yearMatch = lower.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  return `${year}-${month}`;
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Percy Lodge Summons running on http://localhost:${PORT}`);
});
