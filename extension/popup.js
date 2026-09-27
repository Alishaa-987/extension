// popup.js — coordinates the UI flow.
// Relies on nextAction.js and extractor.js loaded via <script> tags.

(function () {
  // ── Element refs ──────────────────────────────────────────────────────────
  var viewInput  = document.getElementById('view-input');
  var viewResult = document.getElementById('view-result');
  var viewSaved  = document.getElementById('view-saved');

  var urlInput   = document.getElementById('url-input');
  var btnFetch   = document.getElementById('btn-fetch');
  var errorMsg   = document.getElementById('error-msg');
  var statusMsg  = document.getElementById('status-msg');

  var fTitle     = document.getElementById('f-title');
  var fOrg       = document.getElementById('f-org');
  var fType      = document.getElementById('f-type');
  var fDeadline  = document.getElementById('f-deadline');
  var fLocation  = document.getElementById('f-location');
  var fDeadlineNote   = document.getElementById('f-deadline-note');
  var fDeadlineSource = document.getElementById('f-deadline-source');
  var fEligBlock = document.getElementById('f-eligibility-block');
  var fEligList  = document.getElementById('f-eligibility');
  var fSkillsBlock = document.getElementById('f-skills-block');
  var fSummaryBlock = document.getElementById('f-summary-block');
  var fSummary   = document.getElementById('f-summary');
  var fMissing   = document.getElementById('f-missing-block');
  var nextActionText = document.getElementById('next-action-text');

  var btnBack    = document.getElementById('btn-back');
  var btnSave    = document.getElementById('btn-save');
  var btnAnother = document.getElementById('btn-another');

  // Current analysis result (mutated by inline edits)
  var currentResult = null;

  // ── Step 1: Fetch & Analyze ───────────────────────────────────────────────
  document.getElementById('btn-view-all').addEventListener('click', function () {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });

  btnFetch.addEventListener('click', function () {
    var url = urlInput.value.trim();
    if (!url) { showError('Please enter a URL.'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showError('URL must start with http:// or https://');
      return;
    }
    clearMessages();
    btnFetch.disabled = true;
    showStatus('⏳ Fetching page…');

    chrome.runtime.sendMessage({ type: 'FETCH_AND_ANALYZE', url: url }, function (resp) {
      btnFetch.disabled = false;
      clearMessages();
      if (chrome.runtime.lastError) {
        showError('Extension error: ' + chrome.runtime.lastError.message);
        return;
      }
      if (!resp || !resp.ok) {
        showError(resp ? resp.error : 'No response from background.');
        return;
      }
      currentResult = resp.result;
      renderResult(currentResult);
      show(viewResult);
      hide(viewInput);
    });
  });

  // Allow Enter key in URL field
  urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') btnFetch.click();
  });

  // ── Step 2: Render & Edit Result ──────────────────────────────────────────
  function renderResult(r) {
    fTitle.value    = r.title    || '';
    fOrg.value      = r.organization || '';
    fType.value     = r.type     || '';
    fDeadline.value = r.deadline || '';
    fLocation.value = r.location || '';

    setNote(fDeadlineNote, r.deadlineNote);
    setNote(fDeadlineSource, r.deadlineSource ? 'Source: "' + r.deadlineSource + '"' : null);

    // Eligibility
    if (r.eligibility && r.eligibility.length) {
      fEligList.innerHTML = r.eligibility.map(function(e) {
        return '<li>' + escapeHtml(e) + '</li>';
      }).join('');
      show(fEligBlock);
    } else {
      hide(fEligBlock);
    }

    // Skills chips
    if (r.skills && r.skills.length) {
      fSkillsBlock.innerHTML = r.skills.map(function(s) {
        return '<span class="chip">' + escapeHtml(s) + '</span>';
      }).join('');
      show(fSkillsBlock);
    } else {
      hide(fSkillsBlock);
    }

    // Summary
    if (r.summary) {
      fSummary.textContent = r.summary;
      show(fSummaryBlock);
    } else {
      hide(fSummaryBlock);
    }

    // Missing fields
    if (r.missing && r.missing.length) {
      fMissing.textContent = 'Not found in page: ' + r.missing.join(', ') + '.';
      show(fMissing);
    } else {
      hide(fMissing);
    }

    updateNextAction();
  }

  // Live-update Next Action when deadline changes
  fDeadline.addEventListener('change', function () {
    currentResult.deadline = fDeadline.value || null;
    updateNextAction();
  });

  function updateNextAction() {
    if (!currentResult) return;
    var opp = { deadline: currentResult.deadline, status: 'saved', skills: currentResult.skills || [] };
    var action = nextAction(opp);
    nextActionText.textContent = '→ ' + action.label;
  }

  // ── Back button ───────────────────────────────────────────────────────────
  btnBack.addEventListener('click', function () {
    hide(viewResult);
    show(viewInput);
    currentResult = null;
  });

  // ── Step 3: Save ──────────────────────────────────────────────────────────
  btnSave.addEventListener('click', function () {
    // Merge any edits from the form fields back into the result
    var toSave = Object.assign({}, currentResult, {
      title:        fTitle.value.trim()    || 'Untitled opportunity',
      organization: fOrg.value.trim()      || null,
      type:         fType.value.trim()     || null,
      deadline:     fDeadline.value        || null,
      location:     fLocation.value.trim() || null,
    });

    btnSave.disabled = true;
    chrome.runtime.sendMessage({ type: 'SAVE_OPPORTUNITY', opp: toSave }, function (resp) {
      btnSave.disabled = false;
      if (chrome.runtime.lastError || !resp || !resp.ok) {
        showError('Could not save. ' + (resp && resp.error ? resp.error : ''));
        return;
      }
      hide(viewResult);
      show(viewSaved);
    });
  });

  // ── Add another ───────────────────────────────────────────────────────────
  btnAnother.addEventListener('click', function () {
    urlInput.value = '';
    currentResult = null;
    clearMessages();
    hide(viewSaved);
    show(viewInput);
    urlInput.focus();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function showError(msg) {
    errorMsg.textContent = msg;
    show(errorMsg);
    hide(statusMsg);
  }
  function showStatus(msg) {
    statusMsg.textContent = msg;
    show(statusMsg);
    hide(errorMsg);
  }
  function clearMessages() {
    hide(errorMsg);
    hide(statusMsg);
  }
  function setNote(el, text) {
    if (text) { el.textContent = text; show(el); }
    else { hide(el); }
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
