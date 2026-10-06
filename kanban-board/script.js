'use strict';

/* =========================================================
   NOWII·BOARD — Kanban
   ========================================================= */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const STORAGE_KEY = 'nowii_kanban_data';
const SETTINGS_KEY = 'nowii_kanban_settings';

/* ============ STATO ============ */
let state = {
  boardName: 'Il mio progetto',
  lists: [],
  search: '',
  filter: null,
  editingCard: null,
  dragCardId: null,
  dragSourceListId: null
};

let settings = { dark: true, animations: true, ...loadJSON(SETTINGS_KEY) };

/* ============ STORAGE ============ */
function loadJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ============ UTILITÀ ============ */
function uid() { return Math.random().toString(36).slice(2, 10); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}
function daysUntil(d) {
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(d); due.setHours(0,0,0,0);
  return Math.round((due - today) / 86400000);
}

/* ============ SPLASH / APP ============ */
function revealApp() {
  setTimeout(() => {
    const splash = $('#splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 800);
    }
    $('#app').classList.add('ready');
  }, 1800);
}

/* ============ TOAST ============ */
function showToast(text, type = 'info') {
  const container = $('#toastContainer');
  const iconSvg = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  }[type] || '';

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${iconSvg}</span><span>${escapeHtml(text)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* ============ CONFIRM MODAL ============ */
function customConfirm(title, message, okLabel = 'Conferma') {
  return new Promise((resolve) => {
    $('#confirmTitle').textContent = title;
    $('#confirmMessage').textContent = message;
    $('#confirmOk').textContent = okLabel;

    const backdrop = $('#confirmBackdrop');
    backdrop.classList.add('open');
    setTimeout(() => $('#confirmOk').focus(), 100);

    function cleanup(result) {
      backdrop.classList.remove('open');
      $('#confirmOk').removeEventListener('click', onOk);
      $('#confirmCancel').removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onBackdrop(e) { if (e.target === backdrop) cleanup(false); }
    function onKey(e) {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter') cleanup(true);
    }

    $('#confirmOk').addEventListener('click', onOk);
    $('#confirmCancel').addEventListener('click', onCancel);
    backdrop.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}

/* ============ SETTINGS ============ */
function applySettings() {
  document.documentElement.setAttribute('data-theme', settings.dark ? 'dark' : 'light');
  document.documentElement.classList.toggle('no-anim', !settings.animations);
  saveJSON(SETTINGS_KEY, settings);
}

/* ============ DATI INIZIALI ============ */
function createInitialData() {
  return {
    boardName: 'Il mio progetto',
    lists: [
      {
        id: uid(),
        title: 'Da fare',
        cards: [
          {
            id: uid(),
            title: 'Impara TypeScript',
            desc: 'Fondamenti: tipi, interfacce, generics e utility types.',
            priority: 'medium',
            due: '',
            tags: ['studio', 'js'],
            checklist: [
              { id: uid(), text: 'Tipi base', done: true },
              { id: uid(), text: 'Interfacce', done: true },
              { id: uid(), text: 'Generics', done: false },
              { id: uid(), text: 'Utility types', done: false }
            ]
          },
          {
            id: uid(),
            title: 'Costruire una REST API',
            desc: 'Con Node.js, Express e PostgreSQL. Autenticazione JWT inclusa.',
            priority: 'high',
            due: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            tags: ['backend', 'node'],
            checklist: []
          }
        ]
      },
      {
        id: uid(),
        title: 'In corso',
        cards: [
          {
            id: uid(),
            title: 'Portfolio personale',
            desc: 'Sito vetrina con HTML/CSS/JS puro. Tema scuro e animazioni.',
            priority: 'medium',
            due: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            tags: ['frontend'],
            checklist: [
              { id: uid(), text: 'Layout', done: true },
              { id: uid(), text: 'Animazioni', done: true },
              { id: uid(), text: 'Deploy', done: false }
            ]
          }
        ]
      },
      {
        id: uid(),
        title: 'Completato',
        cards: [
          {
            id: uid(),
            title: 'Setup ambiente sviluppo',
            desc: 'VS Code, Git, Node.js, estensioni e temi.',
            priority: 'low',
            due: '',
            tags: ['setup'],
            checklist: [
              { id: uid(), text: 'Installare Node', done: true },
              { id: uid(), text: 'Configurare Git', done: true },
              { id: uid(), text: 'Estensioni VS Code', done: true }
            ]
          }
        ]
      }
    ]
  };
}

/* ============ PERSISTENZA ============ */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    const data = JSON.parse(raw);
    if (!data.lists) return createInitialData();
    return data;
  } catch {
    return createInitialData();
  }
}

function saveData() {
  saveJSON(STORAGE_KEY, {
    boardName: state.boardName,
    lists: state.lists
  });
}

/* ============ FILTRI / RICERCA ============ */
function cardMatches(card) {
  if (state.filter && card.priority !== state.filter) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const inTitle = card.title.toLowerCase().includes(q);
    const inDesc = (card.desc || '').toLowerCase().includes(q);
    const inTags = (card.tags || []).some(t => t.toLowerCase().includes(q));
    if (!inTitle && !inDesc && !inTags) return false;
  }
  return true;
}

/* ============ RENDER CARD ============ */
function renderCard(card) {
  const tagHtml = (card.tags || []).map(t =>
    `<span class="card-tag">${escapeHtml(t)}</span>`
  ).join('');

  const doneChecks = (card.checklist || []).filter(c => c.done).length;
  const totalChecks = (card.checklist || []).length;
  const progressPct = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 0;

  let dueHtml = '';
  if (card.due) {
    const days = daysUntil(card.due);
    let cls = '';
    if (days < 0) cls = 'danger';
    else if (days <= 3) cls = 'warning';
    const label = days === 0 ? 'Oggi' : days === 1 ? 'Domani' : days < 0 ? `${Math.abs(days)}g fa` : fmtDate(card.due);
    dueHtml = `<span class="card-meta-item ${cls}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      ${label}
    </span>`;
  }

  const checklistHtml = totalChecks > 0
    ? `<span class="card-meta-item ${doneChecks === totalChecks ? 'done' : ''}">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
         ${doneChecks}/${totalChecks}
       </span>`
    : '';

  const progressHtml = totalChecks > 0
    ? `<div class="card-progress"><span style="width:${progressPct}%"></span></div>`
    : '';

  return `
    <article class="card priority-${card.priority || 'medium'}"
             data-card-id="${card.id}"
             draggable="true">
      <span class="card-priority-bar" aria-hidden="true"></span>
      ${tagHtml ? `<div class="card-tags">${tagHtml}</div>` : ''}
      <h3 class="card-title">${escapeHtml(card.title)}</h3>
      ${card.desc ? `<p class="card-desc">${escapeHtml(card.desc)}</p>` : ''}
      ${progressHtml}
      ${(dueHtml || checklistHtml) ? `<div class="card-footer">
        <div class="card-meta">${dueHtml}${checklistHtml}</div>
      </div>` : ''}
    </article>
  `;
}

/* ============ RENDER LISTA ============ */
function renderList(list) {
  const visibleCards = list.cards.filter(cardMatches);
  const totalCards = list.cards.length;

  const emptyHtml = visibleCards.length === 0
    ? `<div class="empty-list">${state.search || state.filter ? 'Nessun risultato' : 'Nessuna card. Aggiungine una! 👇'}</div>`
    : '';

  return `
    <div class="list" data-list-id="${list.id}">
      <header class="list-head">
        <h2 class="list-title" data-list-title title="Doppio click per rinominare">${escapeHtml(list.title)}</h2>
        <span class="list-count">${visibleCards.length}${state.search || state.filter ? '/' + totalCards : ''}</span>
        <button class="list-menu-btn" data-list-menu aria-label="Menu lista">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
      </header>

      <div class="list-cards" data-cards>
        ${visibleCards.map(renderCard).join('')}
        ${emptyHtml}
      </div>

      <div class="list-foot">
        <button class="add-card-btn" data-add-card>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Aggiungi card
        </button>
      </div>
    </div>
  `;
}

/* ============ RENDER BOARD ============ */
function renderBoard() {
  const board = $('#board');
  board.innerHTML = state.lists.map(renderList).join('');
  bindBoardEvents();
}

/* ============ BIND EVENTI BOARD ============ */
function bindBoardEvents() {
  // Aggiungi card (apre il creator inline)
  $$('[data-add-card]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const listEl = e.target.closest('.list');
      openCardCreator(listEl.dataset.listId);
    });
  });

  // Menu lista
  $$('[data-list-menu]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const listEl = e.target.closest('.list');
      openContextMenu(e, listEl.dataset.listId);
    });
  });

  // Titolo lista editabile (doppio click)
  $$('[data-list-title]').forEach(title => {
    title.addEventListener('dblclick', () => {
      title.setAttribute('contenteditable', 'true');
      title.focus();
      const range = document.createRange();
      range.selectNodeContents(title);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    title.addEventListener('blur', (e) => {
      e.target.setAttribute('contenteditable', 'false');
      const listEl = e.target.closest('.list');
      const list = state.lists.find(l => l.id === listEl.dataset.listId);
      if (!list) return;
      const newTitle = e.target.textContent.trim() || 'Senza nome';
      if (newTitle !== list.title) {
        list.title = newTitle;
        e.target.textContent = newTitle;
        saveData();
        showToast('Lista rinominata', 'success');
      }
    });

    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') { e.target.textContent = ''; e.target.blur(); }
    });
  });

  // Click card → apri modal
  $$('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (state.dragCardId) return;
      openCardModal(card.dataset.cardId);
    });
  });

  // Drag & Drop
  bindDragAndDrop();
}

/* ============ DRAG & DROP ============ */
function bindDragAndDrop() {
  $$('.card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      state.dragCardId = card.dataset.cardId;
      state.dragSourceListId = card.closest('.list').dataset.listId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.cardId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      state.dragCardId = null;
      state.dragSourceListId = null;
      $$('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      $$('.list').forEach(l => l.classList.remove('drop-target'));
    });
  });

  $$('.list-cards').forEach(container => {
    const listEl = container.closest('.list');

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      listEl.classList.add('drop-target');

      const afterEl = getDragAfterElement(container, e.clientY);
      const dragging = $('.card.dragging');
      if (!dragging) return;

      $$('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      if (afterEl == null) {
        const last = container.querySelector('.card:not(.dragging)');
        if (last) last.classList.add('drag-over-bottom');
      } else {
        afterEl.classList.add('drag-over-top');
      }
    });

    container.addEventListener('dragleave', (e) => {
      if (!container.contains(e.relatedTarget)) {
        listEl.classList.remove('drop-target');
        $$('.drag-over-top, .drag-over-bottom').forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      listEl.classList.remove('drop-target');

      const dragging = $('.card.dragging');
      if (!dragging) return;

      const cardId = dragging.dataset.cardId;
      const sourceListId = state.dragSourceListId;
      const targetListId = listEl.dataset.listId;

      const sourceList = state.lists.find(l => l.id === sourceListId);
      const targetList = state.lists.find(l => l.id === targetListId);
      if (!sourceList || !targetList) return;

      const sourceIdx = sourceList.cards.findIndex(c => c.id === cardId);
      if (sourceIdx === -1) return;

      const [card] = sourceList.cards.splice(sourceIdx, 1);

      const afterEl = getDragAfterElement(container, e.clientY);
      let targetIdx;
      if (afterEl == null) {
        targetIdx = targetList.cards.length;
      } else {
        const afterId = afterEl.dataset.cardId;
        targetIdx = targetList.cards.findIndex(c => c.id === afterId);
        if (targetIdx === -1) targetIdx = targetList.cards.length;
      }

      targetList.cards.splice(targetIdx, 0, card);
      saveData();
      renderBoard();
    });
  });

  // Lista come drop-target se trascini nel vuoto
  $$('.list').forEach(listEl => {
    listEl.addEventListener('dragover', (e) => {
      if (!e.target.closest('.list-cards')) {
        e.preventDefault();
        listEl.classList.add('drop-target');
      }
    });
    listEl.addEventListener('dragleave', (e) => {
      if (!listEl.contains(e.relatedTarget)) {
        listEl.classList.remove('drop-target');
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  return cards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ============ LIST CREATOR INLINE ============ */
function openListCreator() {
  $('#addListBtn').hidden = true;
  $('#listCreatorForm').hidden = false;
  const input = $('#newListInput');
  input.value = '';
  input.focus();
}

function closeListCreator() {
  $('#addListBtn').hidden = false;
  $('#listCreatorForm').hidden = true;
}

function createList(title) {
  const trimmed = title.trim();
  if (!trimmed) { closeListCreator(); return; }

  const newListId = uid();
  state.lists.push({ id: newListId, title: trimmed, cards: [] });
  saveData();
  renderBoard();

  requestAnimationFrame(() => {
    const el = $(`[data-list-id="${newListId}"]`);
    if (el) {
      el.classList.add('newly-added');
      setTimeout(() => el.classList.remove('newly-added'), 600);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }
  });

  showToast('Lista aggiunta', 'success');
  closeListCreator();
}

/* ============ CARD CREATOR INLINE ============ */
function openCardCreator(listId) {
  closeAllCardCreators();
  const listEl = $(`[data-list-id="${listId}"]`);
  if (!listEl) return;

  const foot = listEl.querySelector('.list-foot');
  if (!foot) return;
  const addBtn = foot.querySelector('[data-add-card]');
  if (addBtn) addBtn.hidden = true;

  const creator = document.createElement('div');
  creator.className = 'inline-card-creator';
  creator.innerHTML = `
    <textarea placeholder="Titolo della card…" maxlength="120"></textarea>
    <div class="inline-actions">
      <button class="mini-btn primary" data-card-confirm>Aggiungi</button>
      <button class="mini-btn" data-card-cancel>Annulla</button>
    </div>
    <p class="inline-hint"><kbd>Enter</kbd> conferma · <kbd>Esc</kbd> annulla</p>
  `;
  foot.appendChild(creator);

  const textarea = creator.querySelector('textarea');
  textarea.focus();

  const confirm = () => {
    const title = textarea.value.trim();
    if (!title) { closeAllCardCreators(); return; }
    addCardToList(listId, title);
  };
  const cancel = () => closeAllCardCreators();

  creator.querySelector('[data-card-confirm]').addEventListener('click', confirm);
  creator.querySelector('[data-card-cancel]').addEventListener('click', cancel);

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      confirm();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });
}

function closeAllCardCreators() {
  $$('.inline-card-creator').forEach(el => el.remove());
  $$('[data-add-card]').forEach(btn => btn.hidden = false);
}

function addCardToList(listId, title) {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return;

  const newCard = {
    id: uid(),
    title,
    desc: '',
    priority: 'medium',
    due: '',
    tags: [],
    checklist: []
  };
  list.cards.push(newCard);
  saveData();

  const listEl = $(`[data-list-id="${listId}"]`);
  if (listEl) {
    const temp = document.createElement('div');
    temp.innerHTML = renderList(list);
    const newListEl = temp.firstElementChild;
    listEl.replaceWith(newListEl);
    bindBoardEvents();

    const newCardEl = newListEl.querySelector(`[data-card-id="${newCard.id}"]`);
    if (newCardEl) {
      newCardEl.classList.add('newly-added');
      setTimeout(() => newCardEl.classList.remove('newly-added'), 600);
      newCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } else {
    renderBoard();
  }

  showToast('Card aggiunta', 'success');
  closeAllCardCreators();
}

/* ============ AZIONI LISTA ============ */
async function deleteList(listId) {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return;
  const ok = await customConfirm(
    'Eliminare la lista?',
    `La lista "${list.title}" e le sue ${list.cards.length} card verranno eliminate definitivamente.`,
    'Elimina'
  );
  if (!ok) return;
  state.lists = state.lists.filter(l => l.id !== listId);
  saveData();
  renderBoard();
  showToast('Lista eliminata', 'warning');
}

async function clearList(listId) {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return;
  if (list.cards.length === 0) {
    showToast('La lista è già vuota', 'info');
    return;
  }
  const ok = await customConfirm(
    'Svuotare la lista?',
    `Verranno eliminate ${list.cards.length} card dalla lista "${list.title}".`,
    'Svuota'
  );
  if (!ok) return;
  list.cards = [];
  saveData();
  renderBoard();
  showToast('Lista svuotata', 'warning');
}

function duplicateList(listId) {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return;
  const idx = state.lists.indexOf(list);
  const newList = JSON.parse(JSON.stringify(list));
  newList.id = uid();
  newList.title = `${list.title} (copia)`;
  newList.cards.forEach(c => { c.id = uid(); });

  state.lists.splice(idx + 1, 0, newList);
  saveData();
  renderBoard();

  requestAnimationFrame(() => {
    const el = $(`[data-list-id="${newList.id}"]`);
    if (el) {
      el.classList.add('newly-added');
      setTimeout(() => el.classList.remove('newly-added'), 600);
    }
  });

  showToast('Lista duplicata', 'success');
}

/* ============ CONTEXT MENU ============ */
let ctxListId = null;

function openContextMenu(e, listId) {
  ctxListId = listId;
  const menu = $('#contextMenu');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.classList.add('open');

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
  });
}

function closeContextMenu() {
  $('#contextMenu').classList.remove('open');
}

function bindContextMenu() {
  $$('#contextMenu button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (!ctxListId) return;

      if (action === 'rename') {
        const listEl = $(`[data-list-id="${ctxListId}"]`);
        if (listEl) {
          const titleEl = listEl.querySelector('[data-list-title]');
          titleEl.setAttribute('contenteditable', 'true');
          titleEl.focus();
          const range = document.createRange();
          range.selectNodeContents(titleEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else if (action === 'duplicate') {
        duplicateList(ctxListId);
      } else if (action === 'clear') {
        clearList(ctxListId);
      } else if (action === 'delete') {
        deleteList(ctxListId);
      }
      closeContextMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#contextMenu')) closeContextMenu();
  });
  document.addEventListener('scroll', closeContextMenu, true);
}

/* ============ MODAL CARD ============ */
function openCardModal(cardId) {
  const card = findCard(cardId);
  if (!card) return;
  state.editingCard = card;

  const list = state.lists.find(l => l.cards.some(c => c.id === cardId));
  $('#cardModalList').textContent = list ? list.title : '';

  $('#cardModalTitle').textContent = card.title;
  $('#cardDesc').value = card.desc || '';
  $('#cardDue').value = card.due || '';

  $$('#priorityPicker button').forEach(b => {
    b.classList.toggle('active', b.dataset.priority === (card.priority || 'medium'));
  });

  renderCardTags();
  renderChecklist();

  $('#cardBackdrop').classList.add('open');
  setTimeout(() => $('#cardModalTitle').focus(), 100);
}

function closeCardModal() {
  $('#cardBackdrop').classList.remove('open');
  state.editingCard = null;
}

function findCard(cardId) {
  for (const list of state.lists) {
    const c = list.cards.find(c => c.id === cardId);
    if (c) return c;
  }
  return null;
}

function renderCardTags() {
  const card = state.editingCard;
  if (!card) return;
  const container = $('#cardTags');
  container.innerHTML = (card.tags || []).map(t => `
    <span class="tag-pill">
      ${escapeHtml(t)}
      <button data-remove-tag="${escapeHtml(t)}" aria-label="Rimuovi">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </span>
  `).join('');

  $$('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.removeTag;
      card.tags = card.tags.filter(t => t !== tag);
      renderCardTags();
    });
  });
}

function renderChecklist() {
  const card = state.editingCard;
  if (!card) return;
  if (!card.checklist) card.checklist = [];

  const container = $('#checklist');
  container.innerHTML = card.checklist.map(item => `
    <div class="check-item ${item.done ? 'done' : ''}" data-check-id="${item.id}">
      <input type="checkbox" ${item.done ? 'checked' : ''} />
      <label>${escapeHtml(item.text)}</label>
      <button class="remove-check" aria-label="Rimuovi">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');

  const total = card.checklist.length;
  const done = card.checklist.filter(c => c.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('#checklistBar').style.width = pct + '%';
  $('#checklistText').textContent = `${done}/${total}`;

  $$('.check-item').forEach(el => {
    const id = el.dataset.checkId;
    const item = card.checklist.find(c => c.id === id);
    if (!item) return;

    el.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      item.done = e.target.checked;
      el.classList.toggle('done', item.done);
      const d = card.checklist.filter(c => c.done).length;
      const p = total ? Math.round((d / total) * 100) : 0;
      $('#checklistBar').style.width = p + '%';
      $('#checklistText').textContent = `${d}/${total}`;
    });

    el.querySelector('.remove-check').addEventListener('click', () => {
      card.checklist = card.checklist.filter(c => c.id !== id);
      renderChecklist();
    });
  });
}

/* ============ MODAL CARD — SAVE / DELETE ============ */
function saveCard() {
  const card = state.editingCard;
  if (!card) return;

  const title = $('#cardModalTitle').textContent.trim();
  if (!title) { showToast('Il titolo non può essere vuoto', 'error'); return; }

  card.title = title;
  card.desc = $('#cardDesc').value.trim();
  card.due = $('#cardDue').value;

  const activePriority = $('#priorityPicker button.active');
  card.priority = activePriority ? activePriority.dataset.priority : 'medium';

  saveData();
  renderBoard();
  showToast('Card salvata', 'success');
  closeCardModal();
}

async function deleteCard() {
  const card = state.editingCard;
  if (!card) return;

  const ok = await customConfirm(
    'Eliminare la card?',
    `La card "${card.title}" verrà eliminata definitivamente.`,
    'Elimina'
  );
  if (!ok) return;

  for (const list of state.lists) {
    const idx = list.cards.findIndex(c => c.id === card.id);
    if (idx !== -1) { list.cards.splice(idx, 1); break; }
  }
  saveData();
  renderBoard();
  showToast('Card eliminata', 'warning');
  closeCardModal();
}

/* ============ STATS ============ */
function openStats() {
  const allCards = state.lists.flatMap(l => l.cards);
  const total = allCards.length;
  const completedList = state.lists.find(l => /completat|done|fatto/i.test(l.title));
  const completed = completedList ? completedList.cards.length : 0;
  const high = allCards.filter(c => c.priority === 'high').length;
  const overdue = allCards.filter(c => c.due && daysUntil(c.due) < 0).length;
  const withChecklist = allCards.filter(c => (c.checklist || []).length > 0);
  const totalChecks = withChecklist.reduce((s, c) => s + c.checklist.length, 0);
  const doneChecks = withChecklist.reduce((s, c) => s + c.checklist.filter(i => i.done).length, 0);

  $('#statsBody').innerHTML = `
    <div class="stat-tile">
      <span class="stat-tile-label">Card totali</span>
      <span class="stat-tile-value">${total}</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile-label">Liste</span>
      <span class="stat-tile-value">${state.lists.length}</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile-label">Completate</span>
      <span class="stat-tile-value">${completed}</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile-label">Priorità alta</span>
      <span class="stat-tile-value">${high}</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile-label">In scadenza</span>
      <span class="stat-tile-value">${overdue}</span>
    </div>
    <div class="stat-tile">
      <span class="stat-tile-label">Attività completate</span>
      <span class="stat-tile-value">${doneChecks}/${totalChecks}</span>
    </div>
  `;
  $('#statsBackdrop').classList.add('open');
}

/* ============ FILTRO PRIORITÀ ============ */
function toggleFilter() {
  const priorities = ['low', 'medium', 'high'];
  const idx = state.filter ? priorities.indexOf(state.filter) : -1;
  const nextIdx = idx + 1;
  state.filter = nextIdx >= priorities.length ? null : priorities[nextIdx];

  const dot = $('#filterDot');
  dot.hidden = !state.filter;
  const labels = { low: 'Priorità bassa', medium: 'Priorità media', high: 'Priorità alta' };
  if (state.filter) showToast(`Filtro: ${labels[state.filter]}`, 'info');
  else showToast('Filtro rimosso', 'info');

  renderBoard();
}

/* ============ EVENTI GLOBALI ============ */
function bindEvents() {
  // List creator
  $('#addListBtn').addEventListener('click', openListCreator);
  $('#newListCancel').addEventListener('click', closeListCreator);
  $('#newListAdd').addEventListener('click', () => createList($('#newListInput').value));
  $('#newListInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); createList(e.target.value); }
    if (e.key === 'Escape') { e.preventDefault(); closeListCreator(); }
  });

  // Board name
  const boardNameEl = $('#boardName');
  boardNameEl.addEventListener('blur', () => {
    const name = boardNameEl.textContent.trim() || 'Il mio progetto';
    boardNameEl.textContent = name;
    state.boardName = name;
    saveData();
  });
  boardNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); boardNameEl.blur(); }
  });

  // Search
  $('#searchInput').addEventListener('input', (e) => {
    state.search = e.target.value.trim();
    renderBoard();
  });

  // Filtro
  $('#filterBtn').addEventListener('click', toggleFilter);

  // Tema
  $('#themeBtn').addEventListener('click', () => {
    settings.dark = !settings.dark;
    applySettings();
  });

  // Stats
  $('#statsBtn').addEventListener('click', openStats);
  $('#statsClose').addEventListener('click', () => $('#statsBackdrop').classList.remove('open'));
  $('#statsBackdrop').addEventListener('click', (e) => {
    if (e.target === $('#statsBackdrop')) $('#statsBackdrop').classList.remove('open');
  });

  // Card modal
  $('#cardClose').addEventListener('click', closeCardModal);
  $('#cardBackdrop').addEventListener('click', (e) => {
    if (e.target === $('#cardBackdrop')) closeCardModal();
  });
  $('#cardSave').addEventListener('click', saveCard);
  $('#cardDelete').addEventListener('click', deleteCard);

  // Priorità
  $$('#priorityPicker button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#priorityPicker button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Tag
  $('#tagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().toLowerCase().replace(/^#/, '');
      if (!val || !state.editingCard) return;
      if (!state.editingCard.tags) state.editingCard.tags = [];
      if (!state.editingCard.tags.includes(val)) {
        state.editingCard.tags.push(val);
        renderCardTags();
      }
      e.target.value = '';
    }
  });

  // Checklist
  $('#checklistAdd').addEventListener('click', () => {
    const val = $('#checklistInput').value.trim();
    if (!val || !state.editingCard) return;
    if (!state.editingCard.checklist) state.editingCard.checklist = [];
    state.editingCard.checklist.push({ id: uid(), text: val, done: false });
    $('#checklistInput').value = '';
    renderChecklist();
  });
  $('#checklistInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#checklistAdd').click();
    }
  });

  // Context menu
  bindContextMenu();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      $('#searchInput').focus();
    }
    if (e.key === 'Escape') {
      closeCardModal();
      closeContextMenu();
      closeListCreator();
      closeAllCardCreators();
      $('#statsBackdrop').classList.remove('open');
      if (document.activeElement) document.activeElement.blur();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openListCreator();
    }
  });

  // Scroll lock quando un modal è aperto
  const modals = ['#cardBackdrop', '#statsBackdrop', '#confirmBackdrop'];
  const observer = new MutationObserver(() => {
    const anyOpen = modals.some(sel => $(sel).classList.contains('open'));
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  });
  modals.forEach(sel => {
    const el = $(sel);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
}

/* ============ INIT ============ */
function init() {
  applySettings();

  const data = loadData();
  state.boardName = data.boardName || 'Il mio progetto';
  state.lists = data.lists || [];

  $('#boardName').textContent = state.boardName;

  renderBoard();
  bindEvents();
  revealApp();
}

document.addEventListener('DOMContentLoaded', init);