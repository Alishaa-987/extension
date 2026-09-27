// dashboard.js — full opportunity list for the extension dashboard tab.
// Reads chrome.storage.local directly — no service worker round-trip needed.
// Relies on nextAction.js loaded via <script> tag for: urgency, nextAction, daysLeft, STATUSES, STATUS_LABEL.

(function () {
  var STORAGE_KEY = 'opportunity-rescue:v1';

  var URGENCY_LABEL = {
    critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
    unknown: 'No deadline', expired: 'Expired', done: 'Done',
  };

  var FILTER_TESTS = {
    all:       function() { return true; },
    attention: function(u) { return u === 'critical' || u === 'high'; },
    upcoming:  function(u) { return u === 'medium' || u === 'low' || u === 'unknown'; },
    done:      function(u) { return u === 'done'; },
    expired:   function(u) { return u === 'expired'; },
  };

  var allOpps = [];
  var currentFilter = 'all';

  // ── Boot: read storage directly ───────────────────────────────────────────
  function loadAndRender() {
    chrome.storage.local.get(STORAGE_KEY, function (data) {
      allOpps = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      render();
    });
  }

  loadAndRender();

  // Re-render whenever storage changes (e.g. popup saves a new opportunity)
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes[STORAGE_KEY]) {
      allOpps = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
      render();
    }
  });

  // ── Filter select ─────────────────────────────────────────────────────────
  document.getElementById('filter-select').addEventListener('change', function (e) {
    currentFilter = e.target.value;
    render();
  });

  // ── Add button — opens popup.html in a small window ───────────────────────
  function openAddWindow() {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
  document.getElementById('btn-add').addEventListener('click', openAddWindow);
  document.getElementById('btn-add-empty').addEventListener('click', openAddWindow);

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    renderStats();
    renderCards();
  }

  function renderStats() {
    var bar = document.getElementById('stats-bar');
    var applied = allOpps.filter(function(o) {
      return o.status === 'applied' || o.status === 'accepted' || o.status === 'rejected';
    }).length;
    var expiring = allOpps.filter(function(o) {
      var d = daysLeft(o.deadline);
      return d !== null && d >= 0 && d <= 7 &&
             o.status !== 'applied' && o.status !== 'accepted' && o.status !== 'rejected';
    }).length;
    var expired = allOpps.filter(function(o) {
      var d = daysLeft(o.deadline);
      return d !== null && d < 0 &&
             o.status !== 'applied' && o.status !== 'accepted' && o.status !== 'rejected';
    }).length;

    bar.innerHTML =
      stat(allOpps.length, 'Total') +
      stat(applied, 'Applied') +
      stat(expiring, 'Expiring this week', 'warn') +
      stat(expired, 'Expired', 'muted-stat');
  }

  function stat(num, label, cls) {
    return '<div class="stat' + (cls ? ' ' + cls : '') + '">' +
      '<span class="num">' + num + '</span>' +
      '<span class="lbl">' + escHtml(label) + '</span>' +
      '</div>';
  }

  function renderCards() {
    var grid = document.getElementById('cards-grid');
    var empty = document.getElementById('empty-state');
    var filterFn = FILTER_TESTS[currentFilter] || FILTER_TESTS.all;

    var visible = allOpps
      .filter(function(o) { return filterFn(urgency(o)); })
      .slice()
      .sort(function(a, b) { return calcScore(b) - calcScore(a); });

    // Remove existing cards (keep the empty-state div)
    grid.querySelectorAll('.card').forEach(function(c) { c.remove(); });

    if (visible.length === 0) {
      empty.style.display = '';
    } else {
      empty.style.display = 'none';
      visible.forEach(function(o) { grid.appendChild(buildCard(o)); });
    }
  }

  // ── Card builder ──────────────────────────────────────────────────────────
  function buildCard(opp) {
    var u = urgency(opp);
    var action = nextAction(opp);
    var dl = deadlineText(opp.deadline);

    var card = el('article', 'card u-' + u);

    // Head
    var head = el('div', 'card-head');
    head.appendChild(pill(URGENCY_LABEL[u], 'pill u-' + u));
    if (opp.type) head.appendChild(pill(opp.type, 'pill type-pill'));
    var delBtn = el('button', 'icon-btn');
    delBtn.setAttribute('aria-label', 'Delete opportunity');
    delBtn.title = 'Delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', function () { deleteOpp(opp.id); });
    head.appendChild(delBtn);
    card.appendChild(head);

    // Title + org
    var h3 = el('h3'); h3.textContent = opp.title; card.appendChild(h3);
    if (opp.organization) {
      var org = el('p', 'org'); org.textContent = opp.organization; card.appendChild(org);
    }

    // Deadline
    var dlLine = el('p', 'deadline-line');
    dlLine.innerHTML = '⏰ ' + escHtml(dl) +
      (opp.deadline ? ' <span class="date-raw">· ' + escHtml(opp.deadline) + '</span>' : '');
    card.appendChild(dlLine);

    // Summary
    if (opp.summary) {
      var s = el('p', 'summary-text'); s.textContent = opp.summary; card.appendChild(s);
    }

    // Skills
    if (opp.skills && opp.skills.length) {
      var chips = el('div', 'chips');
      opp.skills.slice(0, 5).forEach(function(sk) {
        var c = el('span', 'chip'); c.textContent = sk; chips.appendChild(c);
      });
      card.appendChild(chips);
    }

    // Next action box
    var nb = el('div', 'next-box');
    var nlbl = el('span', 'next-lbl'); nlbl.textContent = 'NEXT ACTION'; nb.appendChild(nlbl);
    var np = el('p', 'next-text'); np.textContent = '→ ' + action.label; nb.appendChild(np);
    if (action.advanceTo) {
      var advBtn = el('button', 'btn small primary');
      advBtn.textContent = 'Mark as ' + STATUS_LABEL[action.advanceTo] + ' →';
      advBtn.addEventListener('click', function () { updateStatus(opp.id, action.advanceTo); });
      nb.appendChild(advBtn);
    }
    card.appendChild(nb);

    // Footer
    var foot = el('div', 'card-foot');
    var sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Status');
    STATUSES.forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s; opt.textContent = STATUS_LABEL[s];
      if (s === opp.status) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function (e) { updateStatus(opp.id, e.target.value); });
    foot.appendChild(sel);

    if (opp.url) {
      var link = el('a', 'btn small ghost');
      link.href = opp.url; link.target = '_blank'; link.rel = 'noreferrer';
      link.textContent = 'Open page ↗';
      foot.appendChild(link);
    }

    card.appendChild(foot);
    return card;
  }

  // ── Storage mutations (direct, no service worker) ─────────────────────────
  function saveAll(opps) {
    var obj = {};
    obj[STORAGE_KEY] = opps;
    chrome.storage.local.set(obj);
  }

  function updateStatus(id, status) {
    allOpps = allOpps.map(function(o) { return o.id === id ? Object.assign({}, o, { status: status }) : o; });
    saveAll(allOpps);
    render();
  }

  function deleteOpp(id) {
    allOpps = allOpps.filter(function(o) { return o.id !== id; });
    saveAll(allOpps);
    render();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function calcScore(opp) {
    var W = { critical: 100, high: 70, medium: 40, unknown: 25, low: 10, expired: -1, done: -1 };
    var S = { saved: 30, reviewing: 20, started: 10 };
    var u = urgency(opp);
    if (W[u] < 0) return -1;
    return W[u] + (S[opp.status] || 0);
  }

  function deadlineText(deadline) {
    var d = daysLeft(deadline);
    if (d === null) return 'No deadline found';
    if (d < 0) return 'Closed ' + (-d) + ' day' + (-d === 1 ? '' : 's') + ' ago';
    if (d === 0) return 'Due today';
    return d + ' day' + (d === 1 ? '' : 's') + ' left';
  }

  function el(tag, cls) {
    var e = document.createElement(tag); if (cls) e.className = cls; return e;
  }

  function pill(text, cls) {
    var s = el('span', cls); s.textContent = text; return s;
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
