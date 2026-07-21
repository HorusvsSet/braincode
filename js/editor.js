/**
 * Editor Module — virtual keyboard, keyboard shortcuts, comment highlighting, breakpoints
 */
const Editor = {
  _currentChallenge: null,
  _interpreter: new BrainfuckInterpreter(),
  _debugger: null,
  _activeMode: 'run',
  _shortcutsEnabled: false,
  _shortcutMap: {},
  _defaultShortcuts: {
    'KeyA': '', 'KeyB': '', 'KeyC': '', 'KeyD': '', 'KeyE': '', 'KeyF': '', 'KeyG': '', 'KeyH': '',
    'KeyI': '', 'KeyJ': '', 'KeyK': '', 'KeyL': '', 'KeyM': '', 'KeyN': '', 'KeyO': '', 'KeyP': '',
    'KeyQ': '', 'KeyR': '', 'KeyS': '', 'KeyT': '', 'KeyU': '', 'KeyV': '', 'KeyW': '', 'KeyX': '',
    'KeyY': '', 'KeyZ': '',
    'Digit0': '', 'Digit1': '', 'Digit2': '', 'Digit3': '', 'Digit4': '',
    'Digit5': '', 'Digit6': '', 'Digit7': '', 'Digit8': '', 'Digit9': '',
    'Slash': '/', 'Period': '.', 'Comma': ',',
    'BracketLeft': '[', 'BracketRight': ']',
    'Minus': '-', 'Equal': '+',
    'Semicolon': ',', 'Quote': '.', 'Backslash': '',
    'Enter': '\n', 'Space': ' ',
    'Backspace': '', 'Delete': '-', 'Tab': '', 'Escape': ''
  },

  init() {
    this._editor = document.getElementById('code-editor');
    this._runBtn = document.getElementById('btn-run');
    this._submitBtn = document.getElementById('btn-submit');
    this._resetBtn = document.getElementById('btn-reset');
    this._outputArea = document.getElementById('output-area');
    this._inputField = document.getElementById('input-field');
    this._charCount = document.getElementById('char-count');
    this._loginGate = document.getElementById('login-gate');
    this._challengeContent = document.getElementById('challenge-content');
    this._modeTabs = document.querySelectorAll('.mode-tab');
    this._modeRun = document.getElementById('mode-run');
    this._modeDebug = document.getElementById('mode-debug');
    this._modeAscii = document.getElementById('mode-ascii');
    this._btnStep = document.getElementById('btn-step');
    this._btnRunToBp = document.getElementById('btn-run-to-bp');
    this._btnStopDebug = document.getElementById('btn-stop-debug');
    this._debugCodeDisplay = document.getElementById('debug-code-display');
    this._debugTape = document.getElementById('debug-tape');
    this._debugInfo = document.getElementById('debug-info');
    this._bfKeyboard = document.getElementById('bf-keyboard');
    this._toggleShortcuts = document.getElementById('toggle-shortcuts');

    this._checkLoginGate();
    Auth.onStateChange(() => this._checkLoginGate());

    // Load saved shortcut map
    this._loadShortcuts();

    if (this._editor) {
      this._editor.addEventListener('keydown', (e) => this._handleKeyDown(e));
      this._editor.addEventListener('input', () => { this._updateCharCount(); this._autoSave(); this._highlightComments(); });
    }

    if (this._runBtn) this._runBtn.addEventListener('click', () => this.runCode());
    if (this._submitBtn) this._submitBtn.addEventListener('click', () => this.submitCode());
    if (this._resetBtn) this._resetBtn.addEventListener('click', () => this.resetCode());

    if (this._modeTabs) {
      this._modeTabs.forEach(tab => tab.addEventListener('click', () => this._switchMode(tab.dataset.mode)));
    }

    if (this._btnStep) this._btnStep.addEventListener('click', () => this._debugStep());
    if (this._btnRunToBp) this._btnRunToBp.addEventListener('click', () => this._debugRunToBp());
    if (this._btnStopDebug) this._btnStopDebug.addEventListener('click', () => this._stopDebug());

    if (this._toggleShortcuts) {
      this._toggleShortcuts.addEventListener('click', () => this._openShortcutModal());
      this._updateShortcutToggle();
    }

    this._renderAsciiTable();
    this._syncTheme();
    this._initMobileKeyboard();
  },

  /* ─── Mobile Keyboard ─── */
  _initMobileKeyboard() {
    const kb = document.getElementById('mobile-keyboard-container');
    if (!kb) return;
    kb.addEventListener('click', (e) => {
      const key = e.target.closest('.mkb-key');
      if (!key) return;
      const bf = key.dataset.bf;
      const action = key.dataset.action;
      if (action === 'run') { this.runCode(); return; }
      if (action === 'submit') { this.submitCode(); return; }
      if (action === 'step') { this._debugStep(); this._switchMode('debug'); return; }
      if (action === 'debug') { this._switchMode('debug'); this.startDebug(); return; }
      if (action === 'bs') { this._insertAtCursor('\b'); return; }
      if (bf) {
        const ch = bf === '\\n' ? '\n' : bf;
        this._insertAtCursor(ch);
      }
    });
  },

  _insertAtCursor(text) {
    const el = document.activeElement;
    if (!el || !(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      // Try the code editor
      if (this._editor) {
        this._editor.focus();
        const start = this._editor.selectionStart;
        const end = this._editor.selectionEnd;
        if (text === '\b') {
          if (start === end && start > 0) {
            this._editor.value = this._editor.value.slice(0, start - 1) + this._editor.value.slice(end);
            this._editor.selectionStart = this._editor.selectionEnd = start - 1;
          } else if (start !== end) {
            this._editor.value = this._editor.value.slice(0, start) + this._editor.value.slice(end);
            this._editor.selectionStart = this._editor.selectionEnd = start;
          }
        } else {
          this._editor.value = this._editor.value.slice(0, start) + text + this._editor.value.slice(end);
          this._editor.selectionStart = this._editor.selectionEnd = start + text.length;
        }
        this._editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (text === '\b') {
      if (start === end && start > 0) {
        el.value = el.value.slice(0, start - 1) + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start - 1;
      } else if (start !== end) {
        el.value = el.value.slice(0, start) + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start;
      }
    } else {
      el.value = el.value.slice(0, start) + text + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  },

  /* ─── Shortcut Config ─── */
  _loadShortcuts() {
    try {
      const saved = JSON.parse(localStorage.getItem('bf_shortcuts') || '{}');
      this._shortcutMap = Object.assign({}, this._defaultShortcuts, saved);
      this._shortcutsEnabled = !!localStorage.getItem('bf_shortcuts_enabled');
    } catch(e) {
      this._shortcutMap = Object.assign({}, this._defaultShortcuts);
      this._shortcutsEnabled = false;
    }
  },

  _saveShortcuts() {
    // Only save non-default values
    const diff = {};
    for (const [k, v] of Object.entries(this._shortcutMap)) {
      if (v !== (this._defaultShortcuts[k] || '')) diff[k] = v;
    }
    localStorage.setItem('bf_shortcuts', JSON.stringify(diff));
    if (this._shortcutsEnabled) localStorage.setItem('bf_shortcuts_enabled', '1');
    else localStorage.removeItem('bf_shortcuts_enabled');
  },

  _updateShortcutToggle() {
    if (!this._toggleShortcuts) return;
    this._toggleShortcuts.classList.toggle('active', this._shortcutsEnabled);
    this._toggleShortcuts.textContent = this._shortcutsEnabled ? '⌨ ON' : '⌨ Config';
  },

  _openShortcutModal() {
    const existing = document.getElementById('shortcut-modal');
    if (existing) { existing.remove(); return; }

    const bfSymbols = [
      { value: '>', label: '＞ Move right' },
      { value: '<', label: '＜ Move left' },
      { value: '+', label: '＋ Increment' },
      { value: '-', label: '－ Decrement' },
      { value: '.', label: '． Output' },
      { value: ',', label: '， Input' },
      { value: '[', label: '［ Loop start' },
      { value: ']', label: '］ Loop end' },
      { value: '/', label: '／ Slash' },
      { value: '\n', label: '↵ Newline' },
      { value: '', label: '— None (passthrough)' },
    ];

    const keyLabels = {
      'KeyA':'A','KeyB':'B','KeyC':'C','KeyD':'D','KeyE':'E','KeyF':'F','KeyG':'G','KeyH':'H',
      'KeyI':'I','KeyJ':'J','KeyK':'K','KeyL':'L','KeyM':'M','KeyN':'N','KeyO':'O','KeyP':'P',
      'KeyQ':'Q','KeyR':'R','KeyS':'S','KeyT':'T','KeyU':'U','KeyV':'V','KeyW':'W','KeyX':'X',
      'KeyY':'Y','KeyZ':'Z',
      'Digit0':'0','Digit1':'1','Digit2':'2','Digit3':'3','Digit4':'4',
      'Digit5':'5','Digit6':'6','Digit7':'7','Digit8':'8','Digit9':'9',
      'Slash':'/','Period':'.','Comma':',',
      'BracketLeft':'[','BracketRight':']',
      'Minus':'-','Equal':'=',
      'Semicolon':';','Quote':"'",'Backslash':'\\',
      'Enter':'⏎ Enter','Space':'␣ Space',
      'Backspace':'⌫ Bksp','Delete':'⌦ Del','Tab':'↹ Tab','Escape':'Esc'
    };

    const bindings = Object.keys(this._defaultShortcuts).map(key => ({
      key,
      label: keyLabels[key] || key,
      bf: this._shortcutMap[key] !== undefined ? this._shortcutMap[key] : ''
    }));

    function escAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function bfOption(currentVal) {
      return bfSymbols.map(s => {
        const sel = (s.value === currentVal) || (s.value === '' && !currentVal) ? 'selected' : '';
        return '<option value="' + escAttr(s.value) + '" ' + sel + '>' + s.label + '</option>';
      }).join('');
    }

    const modal = document.createElement('div');
    modal.id = 'shortcut-modal';
    modal.className = 'shortcut-modal-overlay';
    modal.innerHTML = '' +
      '<div class="shortcut-modal" style="max-width:640px">' +
        '<div class="shortcut-modal-header">' +
          '<h3>⌨ Keyboard Shortcuts</h3>' +
          '<button class="shortcut-modal-close" id="sc-close">✕</button>' +
        '</div>' +
        '<div class="shortcut-modal-body">' +
          '<div class="sc-toggle-row">' +
            '<label class="sc-toggle-label">' +
              '<input type="checkbox" id="sc-enable" ' + (this._shortcutsEnabled ? 'checked' : '') + '>' +
              '<span>Enable shortcuts</span>' +
            '</label>' +
            '<span class="sc-hint">When ON, pressing a key inserts the BF command instead</span>' +
          '</div>' +
          '<div class="sc-bindings" style="max-height:55vh;overflow-y:auto">' +
            bindings.map(b => '' +
              '<div class="sc-row">' +
                '<kbd class="sc-key" style="min-width:60px;text-align:center">' + b.label + '</kbd>' +
                '<span class="sc-arrow">→</span>' +
                '<select class="sc-select" data-key="' + b.key + '">' + bfOption(b.bf) + '</select>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div class="shortcut-modal-footer">' +
          '<button class="btn btn-sm" id="sc-reset">↺ Reset defaults</button>' +
          '<button class="btn btn-sm btn-primary" id="sc-save">✓ Save & Close</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.getElementById('sc-close').addEventListener('click', () => modal.remove());
    document.getElementById('sc-enable').addEventListener('change', (e) => {
      this._shortcutsEnabled = e.target.checked;
    });
    modal.querySelectorAll('.sc-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const newVal = e.target.value;
        const thisKey = sel.dataset.key;
        // Remove this value from any other key that had it (one symbol = one key)
        if (newVal !== '') {
          for (const k of Object.keys(this._shortcutMap)) {
            if (k !== thisKey && this._shortcutMap[k] === newVal) {
              this._shortcutMap[k] = '';
              // Update the select in the modal
              const otherSel = modal.querySelector('.sc-select[data-key="' + k + '"]');
              if (otherSel) otherSel.value = '';
            }
          }
        }
        this._shortcutMap[thisKey] = newVal;
      });
    });
    document.getElementById('sc-save').addEventListener('click', () => {
      this._saveShortcuts();
      this._updateShortcutToggle();
      modal.remove();
    });
    document.getElementById('sc-reset').addEventListener('click', () => {
      this._shortcutMap = Object.assign({}, this._defaultShortcuts);
      modal.remove();
      this._openShortcutModal();
    });
  },

  _checkLoginGate() {
    if (!this._loginGate || !this._challengeContent) return;
    const user = Auth.getCurrentUser();
    if (user) { this._loginGate.style.display = 'none'; this._challengeContent.style.display = ''; }
    else { this._loginGate.style.display = ''; this._challengeContent.style.display = 'none'; }
  },

  _handleKeyDown(e) {
    // Tab always inserts spaces
    if (e.key === 'Tab') { e.preventDefault(); const s=this._editor.selectionStart, end=this._editor.selectionEnd; this._editor.value=this._editor.value.substring(0,s)+'  '+this._editor.value.substring(end); this._editor.selectionStart=this._editor.selectionEnd=s+2; }
    // Customizable shortcuts (only when enabled and NOT in a // comment)
    if (this._shortcutsEnabled && !this._isInComment()) {
      const replacement = this._shortcutMap[e.code] !== undefined ? this._shortcutMap[e.code] : this._shortcutMap[e.key];
      // replacement may be '' (passthrough) or undefined (not mapped)
      if (replacement !== undefined && replacement !== '') {
        e.preventDefault();
        const s = this._editor.selectionStart, end = this._editor.selectionEnd;
        const text = replacement === '\\n' ? '\n' : replacement;
        this._editor.value = this._editor.value.substring(0, s) + text + this._editor.value.substring(end);
        this._editor.selectionStart = this._editor.selectionEnd = s + text.length;
        this._updateCharCount();
        this._autoSave();
      }
    }
  },

  _isInComment() {
    const pos = this._editor.selectionStart;
    const text = this._editor.value;
    // Check if cursor is inside a // comment
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const line = text.substring(lineStart, pos);
    return line.includes('//');
  },

  _highlightComments() {
    // Simple comment highlighting by wrapping in a background overlay
    // Done via CSS class on the textarea — we use a sibling overlay approach
    // For now just update the editor data attribute
    if (this._editor) {
      this._editor.setAttribute('data-comments', 'true');
    }
  },

  /* ─── Virtual Keyboard (mobile) ─── */
  _setupVirtualKeyboard() {
    if (!this._bfKeyboard) return;
    this._bfKeyboard.innerHTML = `
      <div class="vk-row"><button class="vk-key" data-char=">">▶</button><button class="vk-key" data-char="<">◀</button><button class="vk-key" data-char="+">＋</button><button class="vk-key" data-char="-">－</button><button class="vk-key" data-char=".">．</button><button class="vk-key" data-char=",">，</button><button class="vk-key" data-char="[">［</button><button class="vk-key" data-char="]">］</button><button class="vk-key vk-del" data-char="del">⌫</button></div>
      <div class="vk-row"><button class="vk-key vk-wide" data-char="//">//</button><button class="vk-key vk-tiny" data-char=" ">␣</button><button class="vk-key vk-tiny" data-char="\n">↵</button><button class="vk-key vk-wide vk-run-key" id="vk-run">▶ Run</button></div>
    `;
    this._bfKeyboard.querySelectorAll('.vk-key[data-char]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.char;
        if (ch === 'del') {
          const s = this._editor.selectionStart, end = this._editor.selectionEnd;
          if (s === end && s > 0) {
            this._editor.value = this._editor.value.substring(0, s - 1) + this._editor.value.substring(s);
            this._editor.selectionStart = this._editor.selectionEnd = s - 1;
          } else if (s !== end) {
            this._editor.value = this._editor.value.substring(0, s) + this._editor.value.substring(end);
            this._editor.selectionStart = this._editor.selectionEnd = s;
          }
        } else {
          const s = this._editor.selectionStart, end = this._editor.selectionEnd;
          this._editor.value = this._editor.value.substring(0, s) + ch + this._editor.value.substring(end);
          this._editor.selectionStart = this._editor.selectionEnd = s + ch.length;
        }
        this._editor.focus();
        this._updateCharCount(); this._autoSave();
      });
    });
    const vkRun = document.getElementById('vk-run');
    if (vkRun) vkRun.addEventListener('click', () => this.runCode());
  },

  /* ─── Modes ─── */
  _switchMode(mode) {
    this._activeMode = mode;
    if (this._modeRun) this._modeRun.style.display = mode === 'run' ? '' : 'none';
    if (this._modeDebug) this._modeDebug.style.display = mode === 'debug' ? '' : 'none';
    if (this._modeAscii) this._modeAscii.style.display = mode === 'ascii' ? '' : 'none';
    if (this._modeTabs) this._modeTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    if (mode === 'debug' && !this._debugger) this.startDebug();
  },

  _renderAsciiTable() {
    const container = document.getElementById('ascii-table-body');
    if (!container) return;
    let html = '';
    for (let i = 32; i <= 126; i++) {
      const ch = i === 32 ? '␣' : String.fromCharCode(i);
      html += `<div class="ascii-cell" title="Dec: ${i} | Hex: 0x${i.toString(16).toUpperCase()} | Char: ${i===32?'SPACE':String.fromCharCode(i)}"><span class="ascii-char">${ch}</span><span class="ascii-dec">${i}</span></div>`;
    }
    container.innerHTML = html;
  },

  /* ─── Challenge loading ─── */
  loadChallenge(challenge) {
    this._currentChallenge = challenge;
    if (!this._editor) return;
    const saved = this._getSavedCode(challenge.id);
    this._editor.value = saved || challenge.defaultCode || '';
    this._updateCharCount(); this._highlightComments();
    if (this._inputField) this._inputField.value = challenge.examples[0]?.input || '';
    this._clearOutput(); this._stopDebug(); this._switchMode('run');
  },

  /* ─── Run / Submit ─── */
  runCode() {
    const code = this._editor.value;
    const input = this._inputField?.value || '';
    return this._execute(code, input);
  },

  submitCode() {
    if (!this._currentChallenge) return;
    const code = this._editor.value;
    const challenge = this._currentChallenge;
    const validation = BrainfuckInterpreter.validate(code);
    if (!validation.valid) { this._showOutput('error', `Syntax Error: ${validation.error}`); return; }
    let results = []; let allPassed = true;
    const testCases = challenge.testCases || [];
    if (testCases.length === 0 && challenge.id === 'brainfuck-quine') {
      try {
        const r = this._interpreter.execute(validation.stripped, '');
        const out = BrainfuckInterpreter.strip(r.output);
        const passed = out === validation.stripped;
        results.push({ input: '(none)', expected: validation.stripped.substring(0,30)+'...', actual: out.substring(0,30)+'...', passed });
        allPassed = passed;
      } catch(e) { results.push({ input:'(none)', expected:'Quine', actual:'Error: '+e.message, passed:false }); allPassed=false; }
    } else {
      for (const tc of testCases) {
        try {
          const r = this._interpreter.execute(validation.stripped, tc.input);
          const passed = r.output === tc.expectedOutput;
          results.push({ input: tc.input||'(none)', expected: tc.expectedOutput, actual: r.output, passed, steps: r.steps });
          if (!passed) allPassed = false;
        } catch(e) { results.push({ input: tc.input||'(none)', expected: tc.expectedOutput, actual:'Error: '+e.message, passed:false }); allPassed=false; }
      }
    }
    this._showTestResults(results, allPassed);
    if (allPassed) this._saveProgress(challenge.id, code);
  },

  _execute(code, input) {
    this._switchMode('run');
    this._showOutput('loading', 'Running...');
    const v = BrainfuckInterpreter.validate(code);
    if (!v.valid) { this._showOutput('error', `Syntax: ${v.error}`); return; }
    try {
      const t0 = performance.now();
      const r = this._interpreter.execute(v.stripped, input);
      const ms = (performance.now()-t0).toFixed(1);
      this._showOutput('success', r.output||'(no output)', { steps: r.steps, time: ms+'ms' });
      return r;
    } catch(e) { this._showOutput('error', e.message); }
  },

  /* ─── Debug ─── */
  startDebug() {
    const code = BrainfuckInterpreter.strip(this._editor.value);
    if (!code) return;
    const input = this._inputField?.value || '';
    try { this._debugger = this._interpreter.createDebugger(code, input); } catch(e) { return; }
    this._renderDebugState();
  },

  _debugStep() { if (!this._debugger) return; this._debugger.step(); this._renderDebugState(); },
  _debugRunToBp() { if (!this._debugger) return; this._debugger.runToBreakpoint(); this._renderDebugState(); },

  _stopDebug() {
    this._debugger = null;
    if (this._debugCodeDisplay) this._debugCodeDisplay.innerHTML = '';
    if (this._debugTape) this._debugTape.innerHTML = '';
    if (this._debugInfo) this._debugInfo.innerHTML = '';
  },

  toggleBreakpoint(pos) { if (!this._debugger) return; this._debugger.toggleBreakpoint(pos); this._renderDebugState(); },

  _renderDebugState() {
    if (!this._debugger) return;
    const s = this._debugger.getState();
    this._renderDebugCode(s); this._renderDebugTape(s); this._renderDebugInfo(s);
  },

  _renderDebugCode(state) {
    if (!this._debugCodeDisplay) return;
    const code = state.code; const pc = state.pc; const bps = new Set(state.breakpoints);
    let html = '<div class="debug-code-lines">';
    for (let i = 0; i < code.length; i++) {
      const bp = bps.has(i);
      const cur = i === pc;
      const cls = ['debug-code-line', cur?'debug-current':'', bp?'debug-breakpoint':''].filter(Boolean).join(' ');
      html += `<div class="${cls}">
        <span class="debug-gutter" onclick="Editor.toggleBreakpoint(${i})">${bp?'🔴':cur?'▶':''}</span>
        <span class="debug-line-pos">${String(i).padStart(3,'0')}</span>
        <span class="debug-line-char">${code[i]}</span>
      </div>`;
    }
    html += '</div>';
    this._debugCodeDisplay.innerHTML = html;
    const cur = this._debugCodeDisplay.querySelector('.debug-current');
    if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
  },

  _renderDebugTape(state) {
    if (!this._debugTape) return;
    const ptr = state.ptr; const mem = state.memory;
    const half = 18, vs = Math.max(0, ptr-half), ve = Math.min(vs+36, mem.length);
    let html = `<div class="tape-header-bar"><span class="tape-title">🧬 Memory Tape</span><span class="tape-meta">Cells ${vs}–${ve-1} / 30,000</span></div>`;
    html += `<div class="tape-scroll"><div class="tape-visual">`;
    for (let i = vs; i < ve; i++) {
      const v=mem[i], isPtr=i===ptr, hv=v!==0;
      const ascii = v>=32&&v<=126 ? `<span class="tc-ascii">'${this._escapeHtml(String.fromCharCode(v))}'</span>` : '';
      html += `<div class="tape-card ${isPtr?'tc-active':hv?'tc-filled':'tc-empty'}" title="[${i}] = ${v}">
        <span class="tc-idx">${i}</span><span class="tc-val">${v}</span>${ascii}${isPtr?'<span class="tc-ptr">◀</span>':''}</div>`;
    }
    html += `</div></div>`;
    this._debugTape.innerHTML = html;
    const ac = this._debugTape.querySelector('.tc-active');
    if (ac) ac.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  },

  _renderDebugInfo(state) {
    if (!this._debugInfo) return;
    const instr = state.currentInstruction;
    const val = state.memory[state.ptr];
    const ch = val>=32&&val<=126?`'${String.fromCharCode(val)}'`:'—';
    const bpList = state.breakpoints.length?state.breakpoints.join(', '):'none';
    this._debugInfo.innerHTML = `<div class="debug-info-strip">
      <div class="debug-chip"><span class="dci-label">PC</span><span class="dci-val">${state.pc>=state.code.length?'END':state.pc}</span></div>
      <div class="debug-chip debug-chip-instr"><span class="dci-label">Instr</span><span class="dci-val">${state.pc>=state.code.length?'—':instr}</span></div>
      <div class="debug-chip"><span class="dci-label">Ptr</span><span class="dci-val">#${state.ptr}</span></div>
      <div class="debug-chip"><span class="dci-label">Val</span><span class="dci-val">${val} ${ch}</span></div>
      <div class="debug-chip"><span class="dci-label">Steps</span><span class="dci-val">${state.steps}</span></div>
      <div class="debug-chip" style="flex:1"><span class="dci-label">Output</span><span class="dci-val" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._escapeHtml(state.output||'(none)')}</span></div>
      <div class="debug-chip debug-chip-status"><span class="dci-label">Status</span><span class="dci-val">${state.error?'⚠️':state.finished?'✅ Done':'⏸'}</span></div>
      <div class="debug-chip"><span class="dci-label">BP</span><span class="dci-val" style="font-size:0.6rem">${bpList}</span></div>
    </div>`;
  },

  /* ─── Output ─── */
  _showTestResults(results, allPassed) {
    if (!this._outputArea) return;
    this._switchMode('run');
    let html = allPassed ? '<div class="output-header output-success"><span class="output-icon">🎉</span><span>All tests passed!</span></div>'
      : '<div class="output-header output-error"><span class="output-icon">❌</span><span>Some tests failed.</span></div>';
    html += '<div class="test-results">';
    results.forEach((r,i) => {
      html += `<div class="test-case ${r.passed?'test-passed':'test-failed'}"><div class="test-header">${r.passed?'✅':'❌'} Test ${i+1}</div>
        <div class="test-detail"><span>Input:</span> <code>${this._escapeHtml(r.input)}</code></div>
        <div class="test-detail"><span>Expected:</span> <code>${this._escapeHtml(r.expected)}</code></div>
        <div class="test-detail"><span>Actual:</span> <code>${this._escapeHtml(r.actual)}</code></div>
        ${r.steps?`<div class="test-detail"><span>Steps:</span> ${r.steps}</div>`:''}</div>`;
    });
    html += '</div>';
    this._outputArea.innerHTML = html;
  },

  _showOutput(type, msg, meta={}) {
    if (!this._outputArea) return;
    this._switchMode('run');
    let html = `<div class="output-header output-${type}">${type==='loading'?'<span class="spinner"></span>':''}<span>${this._escapeHtml(msg)}</span></div>`;
    if (meta.steps) html += `<div class="output-meta">Steps: ${meta.steps} | Time: ${meta.time}</div>`;
    this._outputArea.innerHTML = html;
  },

  _clearOutput() { if (this._outputArea) this._outputArea.innerHTML = '<div class="output-placeholder">Output will appear here.</div>'; },

  resetCode() {
    if (!this._currentChallenge||!this._editor) return;
    this._editor.value = this._currentChallenge.defaultCode||'';
    this._updateCharCount(); this._clearOutput(); this._stopDebug(); this._switchMode('run');
  },

  _autoSave() {
    if (!this._currentChallenge) return;
    try { localStorage.setItem(`bf_code_${this._currentChallenge.id}`, this._editor.value); } catch(e){}
  },

  _updateCharCount() {
    if (!this._charCount||!this._editor) return;
    const stripped = BrainfuckInterpreter.strip(this._editor.value);
    this._charCount.textContent = `${this._editor.value.length} chars (${stripped.length} BF)`;
  },

  _getSavedCode(id) { try { return localStorage.getItem(`bf_code_${id}`); } catch(e){ return null; } },

  async _saveProgress(chId, code) {
    try { localStorage.setItem(`bf_code_${chId}`, code); } catch(e){}
    try { const p=JSON.parse(localStorage.getItem('bf_progress')||'{}'); p[chId]=true; localStorage.setItem('bf_progress',JSON.stringify(p)); } catch(e){}
    const user = Auth.getCurrentUser();
    if (user&&firebaseDb) {
      try { await firebaseDb.collection('users').doc(user.uid).collection('progress').doc(chId).set({completed:true,code,completedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); } catch(e){}
    }
    window.dispatchEvent(new CustomEvent('challenge-completed',{detail:{challengeId:chId}}));
  },

  _syncTheme() {
    const obs = new MutationObserver(() => {
      const dark = document.body.classList.contains('dark-theme');
      if (this._editor) { this._editor.style.backgroundColor = dark?'#12121f':'#fafbfc'; this._editor.style.color = dark?'#e0e0f0':'#1a1a2e'; }
    });
    obs.observe(document.body, {attributes:true, attributeFilter:['class']});
  },

  _escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
};
