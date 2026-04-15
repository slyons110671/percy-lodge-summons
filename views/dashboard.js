'use strict';
const { shell } = require('./shell');

function dashboardHTML(meetings, annual) {
  const rows = meetings.length === 0
    ? `<tr><td colspan="4" class="empty-state">No meetings yet — click "+ New Meeting" to create one.</td></tr>`
    : meetings.map(m => `
      <tr>
        <td><strong>${e(m.meeting_date || m.id)}</strong></td>
        <td>${e(m.meeting_type || '')}</td>
        <td>${(m.business_items || []).length}</td>
        <td class="actions">
          <a class="btn btn-sm btn-ghost" href="/meeting/${e(m.id)}/preview/outer" target="_blank">Outer</a>
          <a class="btn btn-sm btn-ghost" href="/meeting/${e(m.id)}/preview/inner" target="_blank">Inner</a>
          <a class="btn btn-sm btn-primary" href="/meeting/${e(m.id)}/pdf">⬇ PDF</a>
          <a class="btn btn-sm btn-outline" href="/meeting/${e(m.id)}/edit">Edit</a>
          <form method="POST" action="/meeting/${e(m.id)}/delete" style="display:inline"
                onsubmit="return confirm('Delete the ${e(m.meeting_date || m.id)} summons?')">
            <button class="btn btn-sm btn-danger" type="submit">Delete</button>
          </form>
        </td>
      </tr>`).join('');

  return shell('Dashboard', `
    <div class="page-header">
      <div>
        <h1>Summons Generator</h1>
        <p class="subtitle">Season ${e(annual.season || '')} &mdash; Secretary: ${e(((annual.contacts || {}).secretary || {}).name || '')}</p>
      </div>
      <a class="btn btn-primary" href="/meeting/new">+ New Meeting</a>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Meeting Date</th>
            <th>Type</th>
            <th>Business Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="settings-grid">
      <a class="settings-card" href="/settings/annual">
        <div class="settings-card-icon">📋</div>
        <div>
          <h3>Annual Settings</h3>
          <p>Officers, Past Masters, Meeting Dates, Committees, Contacts</p>
        </div>
      </a>
      <a class="settings-card" href="/settings/static">
        <div class="settings-card-icon">🏛</div>
        <div>
          <h3>Lodge Settings</h3>
          <p>Province, Ancient Charge, Warrant Dates, Venue, Dress</p>
        </div>
      </a>
    </div>
  `);
}

function e(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { dashboardHTML };
