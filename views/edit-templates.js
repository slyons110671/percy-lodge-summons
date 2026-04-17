'use strict';
const { shell } = require('./shell');

function editTemplatesHTML(templates, saved) {
  return shell('Business Templates', `
    <style>
      .tpl-editor-cat {
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius);
        margin-bottom: 16px;
        overflow: hidden;
      }
      .tpl-editor-cat-header {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 16px;
        background: var(--gray-50);
        border-bottom: 1px solid var(--gray-200);
      }
      .tpl-editor-items { padding: 12px 16px; }
      .tpl-editor-item {
        display: grid;
        grid-template-columns: auto 1fr 2fr auto;
        gap: 8px; align-items: start;
        padding: 8px 0;
        border-bottom: 1px solid var(--gray-100);
        transition: background .1s;
      }
      .tpl-editor-item:last-child { border-bottom: none; }
      .tpl-add-item-row {
        padding-top: 10px; display: flex; gap: 8px; align-items: center;
      }
      .drag-handle {
        cursor: grab; color: var(--gray-400); font-size: 16px;
        user-select: none; padding-top: 6px; flex-shrink: 0;
      }
      .drag-handle:hover { color: var(--gray-600); }
      .drag-handle:active { cursor: grabbing; }

      /* Drag-over indicators */
      .tpl-editor-cat.cat-drag-over { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(37,99,235,.2); }
      .tpl-editor-cat.cat-dragging  { opacity: .4; }
      .tpl-editor-item.item-drag-over-top    { border-top: 2px solid var(--blue); }
      .tpl-editor-item.item-drag-over-bottom { border-bottom: 2px solid var(--blue); }
      .tpl-editor-items.items-drag-over { background: #eff6ff; border-radius: 4px; }
    </style>

    <div class="page-header">
      <div>
        <h1>Business Templates</h1>
        <p class="subtitle">Pre-made agenda items available when editing a meeting</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-outline" onclick="addCategory()">+ Add Category</button>
        <button type="button" class="btn btn-primary" onclick="saveTemplates()">Save Templates</button>
      </div>
    </div>

    ${saved ? '<div class="alert-success">Templates saved successfully.</div>' : ''}

    <div id="tpl-cats"></div>

    <div style="text-align:right;padding-bottom:24px;display:flex;gap:8px;justify-content:flex-end;">
      <button type="button" class="btn btn-outline" onclick="addCategory()">+ Add Category</button>
      <button type="button" class="btn btn-primary" onclick="saveTemplates()">Save Templates</button>
    </div>

    <script>
    let state = ${JSON.stringify(templates)
      .replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026')};

    // ── Flush live DOM values into state before any render ─────────────────────
    function flushState() {
      document.querySelectorAll('.tpl-editor-cat').forEach(catEl => {
        const ci = +catEl.dataset.ci;
        if (!state[ci]) return;
        const nameInp = catEl.querySelector('.tpl-editor-cat-header input[type=text]');
        if (nameInp) state[ci].category = nameInp.value;
        catEl.querySelectorAll('.tpl-editor-item').forEach(itemEl => {
          const ii = +itemEl.dataset.ii;
          if (!state[ci] || !state[ci].items[ii]) return;
          const h = itemEl.querySelector('input[type=text]');
          const b = itemEl.querySelector('textarea');
          if (h) state[ci].items[ii].heading = h.value;
          if (b) state[ci].items[ii].body    = b.value;
        });
      });
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    function render() {
      const container = document.getElementById('tpl-cats');
      container.innerHTML = state.map((cat, ci) => buildCatHTML(cat, ci)).join('');
      container.querySelectorAll('.tpl-editor-cat').forEach(el => attachCatDrag(el));
      container.querySelectorAll('.tpl-editor-item').forEach(el => attachItemDrag(el));
      container.querySelectorAll('.tpl-editor-items').forEach(el => attachItemsContainerDrop(el));
    }

    function buildCatHTML(cat, ci) {
      const items = (cat.items || []).map((item, ii) => \`
        <div class="tpl-editor-item" data-ci="\${ci}" data-ii="\${ii}">
          <span class="drag-handle" title="Drag to reorder item">⠿</span>
          <div class="form-group" style="margin:0">
            <label style="font-size:11px">Heading</label>
            <input type="text" value="\${esc(item.heading)}" placeholder="e.g. To Raise"
              oninput="state[\${ci}].items[\${ii}].heading = this.value">
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:11px">Body</label>
            <textarea rows="2" style="resize:vertical;"
              oninput="state[\${ci}].items[\${ii}].body = this.value">\${esc(item.body)}</textarea>
          </div>
          <div style="padding-top:20px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(\${ci}, \${ii})">✕</button>
          </div>
        </div>
      \`).join('');

      return \`
        <div class="tpl-editor-cat" data-ci="\${ci}">
          <div class="tpl-editor-cat-header">
            <span class="drag-handle" title="Drag to reorder category">⠿</span>
            <input type="text" value="\${esc(cat.category)}" placeholder="Category name"
              oninput="state[\${ci}].category = this.value"
              style="flex:1;font-weight:600;font-size:14px;">
            <button type="button" class="btn btn-sm btn-danger"
              onclick="removeCategory(\${ci})">Remove Category</button>
          </div>
          <div class="tpl-editor-items" data-ci="\${ci}">\${items}
            <div class="tpl-add-item-row">
              <button type="button" class="btn btn-sm btn-outline" onclick="addItem(\${ci})">+ Add Item</button>
            </div>
          </div>
        </div>
      \`;
    }

    function esc(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── State mutations ────────────────────────────────────────────────────────
    function removeCategory(ci) {
      if (!confirm('Remove this category and all its items?')) return;
      flushState();
      state.splice(ci, 1);
      render();
    }
    function removeItem(ci, ii) {
      flushState();
      state[ci].items.splice(ii, 1);
      render();
    }
    function addCategory() {
      flushState();
      state.push({ category: 'New Category', items: [] });
      render();
      const cats = document.querySelectorAll('.tpl-editor-cat');
      const last = cats[cats.length - 1];
      if (last) { const inp = last.querySelector('input[type=text]'); if (inp) { inp.focus(); inp.select(); } }
    }
    function addItem(ci) {
      flushState();
      state[ci].items.push({ heading: '', body: '' });
      render();
      // Focus the new item's heading input
      const catEl = document.querySelector(\`.tpl-editor-cat[data-ci="\${ci}"]\`);
      if (catEl) {
        const items = catEl.querySelectorAll('.tpl-editor-item');
        const last = items[items.length - 1];
        if (last) { const inp = last.querySelector('input[type=text]'); if (inp) inp.focus(); }
      }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    function saveTemplates() {
      flushState();
      fetch('/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).then(r => {
        if (r.ok) window.location.href = '/settings/templates?saved=1';
        else alert('Save failed. Please try again.');
      });
    }

    // ── Category drag-and-drop ─────────────────────────────────────────────────
    let catDragSrc = null;

    function attachCatDrag(el) {
      const handle = el.querySelector(':scope > .tpl-editor-cat-header > .drag-handle');
      if (!handle) return;

      handle.addEventListener('mousedown', () => { el.draggable = true; });
      el.addEventListener('dragstart', e => {
        catDragSrc = +el.dataset.ci;
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
        setTimeout(() => el.classList.add('cat-dragging'), 0);
      });
      el.addEventListener('dragend', () => {
        el.draggable = false;
        el.classList.remove('cat-dragging');
        document.querySelectorAll('.tpl-editor-cat').forEach(r => r.classList.remove('cat-drag-over'));
        catDragSrc = null;
      });
      el.addEventListener('dragover', e => {
        if (catDragSrc === null || itemDragSrc !== null) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.tpl-editor-cat').forEach(r => r.classList.remove('cat-drag-over'));
        if (+el.dataset.ci !== catDragSrc) el.classList.add('cat-drag-over');
      });
      el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) el.classList.remove('cat-drag-over');
      });
      el.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('cat-drag-over');
        if (catDragSrc === null) return;
        const targetCi = +el.dataset.ci;
        if (targetCi === catDragSrc) return;
        flushState();
        const [moved] = state.splice(catDragSrc, 1);
        state.splice(targetCi, 0, moved);
        render();
        catDragSrc = null;
      });
    }

    // ── Item drag-and-drop (state-driven, supports cross-category) ─────────────
    let itemDragSrc = null; // { ci, ii }

    function attachItemDrag(el) {
      const handle = el.querySelector('.drag-handle');
      if (!handle) return;

      handle.addEventListener('mousedown', () => { el.draggable = true; });
      el.addEventListener('dragstart', e => {
        itemDragSrc = { ci: +el.dataset.ci, ii: +el.dataset.ii };
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
        setTimeout(() => el.style.opacity = '.4', 0);
      });
      el.addEventListener('dragend', () => {
        el.draggable = false;
        el.style.opacity = '';
        document.querySelectorAll('.tpl-editor-item').forEach(r => {
          r.classList.remove('item-drag-over-top','item-drag-over-bottom');
        });
        document.querySelectorAll('.tpl-editor-items').forEach(r => r.classList.remove('items-drag-over'));
        itemDragSrc = null;
      });
      el.addEventListener('dragover', e => {
        if (itemDragSrc === null) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.tpl-editor-item').forEach(r => {
          r.classList.remove('item-drag-over-top','item-drag-over-bottom');
        });
        const rect = el.getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        el.classList.add(e.clientY < mid ? 'item-drag-over-top' : 'item-drag-over-bottom');
      });
      el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) {
          el.classList.remove('item-drag-over-top','item-drag-over-bottom');
        }
      });
      el.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        if (itemDragSrc === null) return;
        const srcCi = itemDragSrc.ci, srcIi = itemDragSrc.ii;
        const tgtCi = +el.dataset.ci,  tgtIi = +el.dataset.ii;

        el.classList.remove('item-drag-over-top','item-drag-over-bottom');

        const rect = el.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;

        flushState();
        const [moved] = state[srcCi].items.splice(srcIi, 1);

        // Calculate insertion index in the target category
        let insertAt = tgtIi;
        if (!insertBefore) insertAt++;
        // If same category and we removed an earlier item, shift down
        if (srcCi === tgtCi && srcIi < insertAt) insertAt--;

        state[tgtCi].items.splice(insertAt, 0, moved);
        render();
        itemDragSrc = null;
      });
    }

    // Drop onto empty items container (to append to a category with no items yet,
    // or to the area below all items)
    function attachItemsContainerDrop(el) {
      el.addEventListener('dragover', e => {
        if (itemDragSrc === null) return;
        // Only act if not hovering over a child item
        if (e.target !== el && e.target.closest('.tpl-editor-item')) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('items-drag-over');
      });
      el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) el.classList.remove('items-drag-over');
      });
      el.addEventListener('drop', e => {
        if (itemDragSrc === null) return;
        // Only act if dropped on the container itself, not a child item
        if (e.target !== el && e.target.closest('.tpl-editor-item')) return;
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('items-drag-over');
        const tgtCi = +el.dataset.ci;
        const srcCi = itemDragSrc.ci, srcIi = itemDragSrc.ii;
        flushState();
        const [moved] = state[srcCi].items.splice(srcIi, 1);
        state[tgtCi].items.push(moved);
        render();
        itemDragSrc = null;
      });
    }

    // Initial render
    render();
    </script>
  `);
}

module.exports = { editTemplatesHTML };
