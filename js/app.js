/**
 * App Module - SPA Router & Main Logic
 */
const App = {
  _currentPage: null,
  _filterDifficulty: 'All',

  init() {
    this._initNavShortcuts();
    Auth.init();
    Auth.onStateChange((user) => {
      this._currentUser = user;
      if (this._currentPage === 'challenge') {
        const slug = this._getCurrentSlug();
        if (slug) this.loadChallengePage(slug);
      }
      this.renderCurrentPage();
    });
    window.addEventListener('challenge-completed', () => {
      if (this._currentPage === 'challenges') this.renderCurrentPage();
    });
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) this.navigate(e.state.page, e.state.params, true);
    });
    const path = window.location.hash.slice(1) || 'home';
    this.navigate(path, null, true);
  },

  navigate(page, params, replace = false) {
    this._currentPage = page;
    if (!replace) {
      const hash = params ? `${page}/${params}` : page;
      window.history.pushState({ page, params }, '', `#${hash}`);
    }
    this.renderPage(page, params);
  },

  renderPage(page, params) {
    const main = document.getElementById('main-content');
    if (!main) return;
    switch (page) {
      case 'home': this.renderHomePage(main); break;
      case 'challenges': this.renderChallengesPage(main); break;
      case 'challenge': this.loadChallengePage(params || this._getCurrentSlug()); break;
      case 'login': this.renderLoginPage(main); break;
      case 'register': this.renderLoginPage(main, true); break;
      case 'tutorial': this.renderTutorialPage(main); break;
      case 'profile': this.renderProfilePage(main); break;
      default: this.renderHomePage(main);
    }
    window.scrollTo(0, 0);
  },

  renderCurrentPage() {
    const main = document.getElementById('main-content');
    if (!main) return;
    this.renderPage(this._currentPage, null);
  },

  /* ─── Navbar Shortcuts ─── */
  _initNavShortcuts() {
    const defaultShortcuts = { 'KeyA':'', 'KeyB':'', 'KeyC':'', 'KeyD':'', 'KeyE':'', 'KeyF':'', 'KeyG':'', 'KeyH':'', 'KeyI':'', 'KeyJ':'', 'KeyK':'', 'KeyL':'', 'KeyM':'', 'KeyN':'', 'KeyO':'', 'KeyP':'', 'KeyQ':'', 'KeyR':'', 'KeyS':'', 'KeyT':'', 'KeyU':'', 'KeyV':'', 'KeyW':'', 'KeyX':'', 'KeyY':'', 'KeyZ':'', 'Digit0':'', 'Digit1':'', 'Digit2':'', 'Digit3':'', 'Digit4':'', 'Digit5':'', 'Digit6':'', 'Digit7':'', 'Digit8':'', 'Digit9':'', 'Slash':'/', 'Period':'.', 'Comma':',', 'BracketLeft':'[', 'BracketRight':']', 'Minus':'-', 'Equal':'+', 'Semicolon':',', 'Quote':'.', 'Backslash':'', 'Enter':'\\n', 'Space':' ', 'Backspace':'', 'Delete':'-', 'Tab':'', 'Escape':'' };
    this._shortcutsEnabled = !!localStorage.getItem('bf_shortcuts_enabled');
    try {
      const saved = JSON.parse(localStorage.getItem('bf_shortcuts') || '{}');
      this._shortcutMap = Object.assign({}, defaultShortcuts, saved);
    } catch(e) { this._shortcutMap = Object.assign({}, defaultShortcuts); }

    const toggleBtn = document.getElementById('nav-sc-toggle');
    const configBtn = document.getElementById('nav-sc-config');
    if (!toggleBtn || !configBtn) return;

    const updateToggleUI = () => {
      toggleBtn.classList.toggle('active', this._shortcutsEnabled);
      const status = toggleBtn.querySelector('.nav-sc-status');
      if (status) status.textContent = this._shortcutsEnabled ? 'ON' : 'OFF';
    };
    updateToggleUI();

    toggleBtn.addEventListener('click', () => {
      this._shortcutsEnabled = !this._shortcutsEnabled;
      if (this._shortcutsEnabled) localStorage.setItem('bf_shortcuts_enabled', '1');
      else localStorage.removeItem('bf_shortcuts_enabled');
      updateToggleUI();
    });

    configBtn.addEventListener('click', () => {
      if (typeof Editor !== 'undefined' && Editor._openShortcutModal) {
        Editor._shortcutsEnabled = this._shortcutsEnabled;
        Editor._shortcutMap = this._shortcutMap;
        Editor._openShortcutModal();
      }
    });

    // Sync back when modal closes
    const observer = new MutationObserver(() => {
      if (!document.getElementById('shortcut-modal')) {
        if (typeof Editor !== 'undefined') {
          this._shortcutsEnabled = Editor._shortcutsEnabled;
          this._shortcutMap = Editor._shortcutMap;
          updateToggleUI();
        }
      }
    });
    observer.observe(document.body, { childList: true });
  },

  /** Get current shortcuts state for other modules */
  getShortcuts() {
    return { enabled: this._shortcutsEnabled, map: this._shortcutMap };
  },

  /* ========== HOME ========== */
  renderHomePage(main) {
    main.innerHTML = `
      <div class="hero">
        <div class="hero-bg"></div>
        <div class="hero-bg2"></div>
        <div class="hero-content">
          <div class="hero-badge">🧠 Esoteric Programming</div>
          <h1 class="hero-title">Master <span class="gradient-text">Brainfuck</span></h1>
          <p class="hero-subtitle">The most minimalist programming language in the world. Only 8 commands. Infinite possibilities. Learn, practice, and solve challenges with an interactive debugger.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('tutorial')">🎓 Start Tutorial</button>
            <button class="btn btn-outline btn-lg" onclick="App.navigate('challenges')">⚡ View Challenges</button>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-number">${CHALLENGES.length}</span><span class="stat-label">Challenges</span></div>
            <div class="stat"><span class="stat-number">8</span><span class="stat-label">Commands</span></div>
            <div class="stat"><span class="stat-number">∞</span><span class="stat-label">Possibilities</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="code-preview">
            <div class="code-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="code-filename">hello.bf</span></div>
            <pre><code><span class="bf-comment">// Print "Hello World!"</span>
++++++++++[
  >+++++++>++++++++++
  >+++>+<<<<-
]
>++.>+.+++++++..+++.
>++.<<+++++++++++++++.
>.+++.------.--------.
>+.>.</code></pre>
          </div>
          <div class="hero-floating-badge" style="top:-10px;right:-20px;animation-delay:0s">🔒 No mobile</div>
          <div class="hero-floating-badge" style="bottom:20px;left:-30px;animation-delay:1.5s">⌨ Shortcuts</div>
        </div>
      </div>
      <div id="how-it-works" class="section">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-icon">📖</div>
            <h3>Interactive Tutorial</h3>
            <p>Learn Brainfuck by writing real code with step-by-step execution and visual feedback.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-icon">🎯</div>
            <h3>Pick a Challenge</h3>
            <p>From beginner to advanced. 12 challenges that each teach a new technique.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-icon">🔍</div>
            <h3>Visual Debugger</h3>
            <p>Step through your code, set breakpoints, and watch the memory tape live.</p>
          </div>
          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-icon">☁️</div>
            <h3>Save Progress</h3>
            <p>Sign in to save your solutions and track your progress across devices.</p>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-header-row">
          <h2 class="section-title" style="margin-bottom:0">The 8 Commands</h2>
          <button class="btn btn-sm btn-outline" onclick="App.navigate('tutorial')">Learn them →</button>
        </div>
        <div class="commands-grid">
          ${[
            {cmd:'&gt;',name:'Right',desc:'Move pointer right',icon:'→'},
            {cmd:'&lt;',name:'Left',desc:'Move pointer left',icon:'←'},
            {cmd:'+',name:'Increment',desc:'Add 1 to current cell',icon:'↑'},
            {cmd:'-',name:'Decrement',desc:'Subtract 1 from current cell',icon:'↓'},
            {cmd:'.',name:'Output',desc:'Print byte as ASCII character',icon:'🖨'},
            {cmd:',',name:'Input',desc:'Read one byte of input',icon:'⌨'},
            {cmd:'[',name:'Loop Start',desc:'Jump past ] if cell is 0',icon:'⟳'},
            {cmd:']',name:'Loop End',desc:'Jump back to [ if cell ≠ 0',icon:'⟲'}
          ].map(c=>`<div class="command-card"><span class="command-char">${c.cmd}</span><div><strong>${c.name}</strong><p>${c.desc}</p></div></div>`).join('')}
        </div>
      </div>`;
  },

  /* ========== TUTORIAL PAGE ========== */
  renderTutorialPage(main) {
    const interpreter = new BrainfuckInterpreter();
    let debugger_ = null;
    let stepIdx = 0;

    // Use global shortcuts from App
    const sc = this.getShortcuts();
    let shortcutsEnabled = sc.enabled;
    let shortcutMap = Object.assign({}, sc.map);

    function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

    let stepPassed = {};

    const steps = [
      { title: "🧠 How the Tape Works",
        content: `<div class="tut-step0-visual">
          <p>Brainfuck has a <strong>tape of 30,000 cells</strong>, each starting at <strong>0</strong>. A <strong>pointer ▼</strong> marks the current cell. Try the buttons!</p>
          <div class="tut-tape-playground" id="tut-tape-playground">
            <div class="ttp-tape" id="ttp-tape"></div>
            <div class="ttp-pointer-label" id="ttp-ptr-label">Pointer: cell <strong>0</strong></div>
          </div>
          <div class="ttp-buttons">
            <button class="ttp-btn ttp-right" data-action="right">▶ Move Right</button>
            <button class="ttp-btn ttp-left" data-action="left">◀ Move Left</button>
            <button class="ttp-btn ttp-inc" data-action="inc">＋ Increment</button>
            <button class="ttp-btn ttp-dec" data-action="dec">－ Decrement</button>
            <button class="ttp-btn ttp-reset" data-action="reset">↺ Reset</button>
          </div>
          <div class="ttp-info">
            <div class="ttp-info-cell">Cell <strong id="ttp-cell-idx">0</strong> = <strong id="ttp-cell-val">0</strong></div>
            <div class="ttp-info-ascii" id="ttp-ascii">ASCII: —</div>
          </div>
          <p class="ttp-hint">👆 These 4 buttons are the core: <code>&gt;</code> <code>&lt;</code> <code>+</code> <code>-</code>. In the next steps you'll write real code!</p>
        </div>`,
        task: null },
      { title: "⌨ Shortcuts & 💬 Comments",
        content: `<div class="tut-step0">
          <div class="tut-intro-card">
            <h3>⌨ Keyboard Shortcuts</h3>
            <p>Map <strong>any key</strong> to a Brainfuck command using <strong>⌨ ON/OFF</strong> and <strong>⚙</strong> in the navbar.</p>
            <div class="tut-sc-demo">
              <div class="tut-sc-row"><kbd>A</kbd><span>→</span><kbd class="bf-char">+</kbd></div>
              <div class="tut-sc-row"><kbd>D</kbd><span>→</span><kbd class="bf-char">&gt;</kbd></div>
              <div class="tut-sc-row"><kbd>S</kbd><span>→</span><kbd class="bf-char">&lt;</kbd></div>
              <div class="tut-sc-row"><kbd>W</kbd><span>→</span><kbd class="bf-char">-</kbd></div>
            </div>
          </div>
          <div class="tut-intro-card">
            <h3>💬 Comments with <code>//</code></h3>
            <p>Write <code>//</code> to add comments. Everything after <code>//</code> on a line is <strong>ignored</strong>.</p>
            <div class="tut-comment-demo"><code><span class="bf-comment">// This is a comment</span><br>+++<span class="bf-comment"> // Add 3</span><br>&gt;.<span class="bf-comment"> // Move and print</span></code></div>
            <p style="margin-top:8px;font-size:0.8rem;color:var(--text-tertiary)">Shortcuts are <strong>disabled inside comments</strong>, so you can type normally.</p>
          </div>
        </div>
        <p style="text-align:center;margin-top:16px;font-weight:600;color:var(--accent-primary)">Click <strong>Next →</strong> to start coding!</p>`,
        task: null },
      { title: "Move right: <code>&gt;</code>",
        content: `<p><code>&gt;</code> <strong>moves the pointer</strong> one cell to the <strong>right</strong>.</p>
        <div class="tut-visual"><div class="tut-mem-demo"><span class="mem-cell mem-active">[0]=0 ▼</span><span class="mem-arrow">→</span><span class="mem-cell">[1]=0</span></div><p style="font-size:0.8rem;margin-top:6px;color:var(--text-tertiary)">The pointer starts at cell 0. <code>&gt;</code> moves it to cell 1.</p></div>`,
        task: { code: '', goal: 'Write &gt; to move the pointer to cell 1. Then Run All.', check: (s) => s.ptr >= 1 } },
      { title: "Move left: <code>&lt;</code>",
        content: `<p><code>&lt;</code> <strong>moves the pointer</strong> one cell to the <strong>left</strong>.</p>
        <div class="tut-visual"><div class="tut-mem-demo"><span class="mem-cell">[0]=0</span><span class="mem-arrow">←</span><span class="mem-cell mem-active">[1]=0 ▼</span></div><p style="font-size:0.8rem;margin-top:6px;color:var(--text-tertiary)">First move right with <code>&gt;</code>, then write <code>&lt;</code> to come back. The pointer must end at cell 0.</p></div>`,
        task: { code: '', goal: 'Write &gt;&lt; to move right then left. Pointer must end at cell 0.', check: (s) => s.ptr === 0 && s.steps >= 2 } },
      { title: "Add values: <code>+</code>",
        content: `<p><code>+</code> <strong>adds 1</strong> to the current cell.</p>`,
        task: { code: '', goal: 'Set cell 0 to the value 5', check: (s) => s.memory[0] === 5 } },
      { title: "Subtract: <code>-</code>",
        content: `<p><code>-</code> <strong>subtracts 1</strong>. Values wrap: 0-1=255, 255+1=0.</p>`,
        task: { code: '', goal: 'Add 3, then subtract 2 (cell 0 = 1)', check: (s) => s.memory[0] === 1 } },
      { title: "Loops: <code>[</code> <code>]</code>",
        content: `<p>Loops are Brainfuck's <strong>only control structure</strong>. They work like a while loop:</p>
        <div class="tut-visual">
          <div style="text-align:left;background:var(--bg-card);padding:14px 18px;border-radius:8px;font-family:var(--font-mono);font-size:0.85rem;line-height:1.8">
            <div><code style="color:var(--accent-primary);font-weight:700">[</code>  Jump to matching <code style="color:var(--accent-primary);font-weight:700">]</code> if current cell = <strong>0</strong> <span style="color:var(--text-tertiary)">(exit loop)</span></div>
            <div><code style="color:var(--accent-primary);font-weight:700">]</code>  Jump back to matching <code style="color:var(--accent-primary);font-weight:700">[</code> if current cell ≠ <strong>0</strong> <span style="color:var(--text-tertiary)">(repeat loop)</span></div>
          </div>
        </div>
        <p><strong>Examples:</strong></p>
        <div class="tut-visual" style="text-align:left;background:var(--bg-card);padding:12px 16px;border-radius:8px;line-height:1.6;font-family:var(--font-mono);font-size:0.82rem">
          <div><code>+++[>+<-]</code> <span style="color:var(--text-tertiary)">→ moves 3 from cell 0 to cell 1</span></div>
          <div><code>[-]</code> <span style="color:var(--text-tertiary)">→ sets current cell to 0</span></div>
          <div><code>+++++[>+++++<-]>[.<]</code> <span style="color:var(--text-tertiary)">→ create 25 then move & print 5 times</span></div>
        </div>`,
        task: { code: '', goal: 'Use a loop to set cell 1 to 64, cell 0 must end at 0. Hint: ++++[>++++++++<-]', check: (s) => s.memory[1] === 64 && s.memory[0] === 0 } },
      { title: "Print: <code>.</code>",
        content: `<p><code>.</code> <strong>prints</strong> the current cell as an ASCII character. 'A'=65.</p>`,
        task: { code: '', goal: 'Print the letter A (ASCII 65)', check: (s) => s.output === 'A' } },
      { title: "Input: <code>,</code>",
        content: `<p><code>,</code> <strong>reads</strong> one character from input and stores its ASCII code in the current cell.</p>
        <div class="tut-info-box"><strong>Try it:</strong> type a letter in the input box below, then write <code>,.</code> to read and print it!</div>`,
        task: { code: '', goal: 'Write ,. to read a letter and print it back', check: (s) => s.output && s.output.length > 0, input: '' } },
      { title: "🎉 You're ready!",
        content: `<p><strong>You now know all 8 Brainfuck commands!</strong></p>
        <div class="tut-ref-grid">
          <div class="tut-ref"><code>&gt;</code> right</div><div class="tut-ref"><code>&lt;</code> left</div>
          <div class="tut-ref"><code>+</code> increment</div><div class="tut-ref"><code>-</code> decrement</div>
          <div class="tut-ref"><code>.</code> output</div><div class="tut-ref"><code>,</code> input</div>
          <div class="tut-ref"><code>[</code> loop start</div><div class="tut-ref"><code>]</code> loop end</div>
          <div class="tut-ref"><code>[-]</code> clear cell</div><div class="tut-ref"><code>[&gt;+&lt;-]</code> move value</div>
        </div>
        <p>Click <strong>Finish</strong> to start solving challenges. Good luck! 🚀</p>`,
        task: null }
    ];

    function renderStep() {
      const step = steps[stepIdx];
      document.getElementById('tut-content').innerHTML = `<h2>${step.title}</h2>${step.content}`;
      document.getElementById('tut-progress').textContent = `Step ${stepIdx + 1}/${steps.length}`;
      document.getElementById('tut-prev').style.visibility = stepIdx === 0 ? 'hidden' : 'visible';
      document.getElementById('tut-next').textContent = stepIdx === steps.length - 1 ? '🎉 Finish' : 'Next →';
      const nextBtn = document.getElementById('tut-next');
      // Step 0 (tape playground): always enabled
      if (stepIdx === 0) {
        nextBtn.disabled = false;
      } else if (step.task && typeof step.task.check === 'function') {
        nextBtn.disabled = !stepPassed[stepIdx];
      } else if (step.task) {
        nextBtn.disabled = !stepPassed[stepIdx];
      } else {
        nextBtn.disabled = false;
      }
      const area = document.getElementById('tut-task-area');
      // Step 0: no task area, just tape playground in content
      if (stepIdx === 0) {
        area.innerHTML = '';
        debugger_ = null;
        setupTapePlayground();
      } else if (step.task) {
        // Restore saved code from localStorage for this specific step
        const savedCode = localStorage.getItem('bf_tut_code_' + stepIdx);
        const taskCopy = Object.assign({}, step.task);
        if (savedCode !== null) {
          taskCopy.code = savedCode;
        }
        renderTask(taskCopy, stepIdx);
      } else {
        area.innerHTML = '';
        debugger_ = null;
      }
    }

    function isInComment(text, pos) {
      const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
      return text.substring(lineStart, pos).includes('//');
    }

    function renderTask(task, taskIdx) {
      const hasCheck = typeof task.check === 'function';
      const area = document.getElementById('tut-task-area');
      const hasInput = task.input !== undefined;
      area.innerHTML = `
        <div class="task-box">
          <div class="task-header">
            <span class="task-icon">${hasCheck ? '🎯' : '🧪'}</span>
            <span class="task-goal">${task.goal}</span>
          </div>
          ${hasInput ? `<div class="task-input-row"><label>📥 Input:</label><input type="text" id="tut-input-box" class="task-input-box" placeholder="Type a letter here..." maxlength="10" value="${esc(task.input || '')}"></div>` : ''}
          <div class="task-edit-row">
            <textarea class="task-code-input" id="tut-code-input" rows="3" spellcheck="false" placeholder="${hasCheck ? 'Write your solution here...' : 'Try any Brainfuck code...'}">${esc(task.code || '')}</textarea>
          </div>
          <div class="tut-active-shortcuts" id="tut-active-shortcuts"></div>
          <div id="tut-code-highlight" class="tut-code-highlight"></div>
          <div class="task-controls">
            <button class="btn btn-sm btn-run" id="tut-step-btn">⏭ Step</button>
            <button class="btn btn-sm btn-outline" id="tut-run-all">⏩ Run All</button>
            <button class="btn btn-sm btn-outline" id="tut-reset">↺ Reset</button>
            <span id="tut-steps-count" class="task-steps">Steps: 0</span>
          </div>
          <div class="task-tape" id="task-mini-tape"></div>
          <div class="task-output" id="task-mini-output"></div>
          <div id="task-result" class="task-result"></div>
        </div>`;

      const codeEl = document.getElementById('tut-code-input');
      const highlightEl = document.getElementById('tut-code-highlight');
      if (!codeEl) return;

      // Sync shortcuts from App on each render + modal close
      const syncShortcuts = () => {
        const sc = App.getShortcuts();
        shortcutsEnabled = sc.enabled;
        shortcutMap = Object.assign({}, sc.map);
      };
      const scObserver = new MutationObserver(() => {
        if (!document.getElementById('shortcut-modal')) { syncShortcuts(); updateActiveShortcuts(); }
      });
      scObserver.observe(document.body, { childList: true });

      codeEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); const s=codeEl.selectionStart, end=codeEl.selectionEnd; codeEl.value=codeEl.value.substring(0,s)+'  '+codeEl.value.substring(end); codeEl.selectionStart=codeEl.selectionEnd=s+2; initDbg(); updateUI(); return; }
        const sc = App.getShortcuts();
        if (sc.enabled && !isInComment(codeEl.value, codeEl.selectionStart)) {
          const rep = sc.map[e.code] !== undefined ? sc.map[e.code] : sc.map[e.key];
          if (rep !== undefined && rep !== '') {
            e.preventDefault();
            const s = codeEl.selectionStart, end = codeEl.selectionEnd;
            const text = rep === '\\n' ? '\n' : rep;
            codeEl.value = codeEl.value.substring(0, s) + text + codeEl.value.substring(end);
            codeEl.selectionStart = codeEl.selectionEnd = s + text.length;
            initDbg(); updateUI();
          }
        }
      });

      function initDbg() {
        const stripped = BrainfuckInterpreter.strip(codeEl.value);
        const inputVal = hasInput ? (document.getElementById('tut-input-box')?.value || '') : '';
        debugger_ = stripped ? interpreter.createDebugger(stripped, inputVal) : null;
      }

      function highlightPC() {
        if (!debugger_) { highlightEl.innerHTML = ''; return; }
        const s = debugger_.getState();
        if (s.finished || s.error) { highlightEl.innerHTML = ''; return; }
        const raw = codeEl.value;
        const stripped = BrainfuckInterpreter.strip(raw);
        const posMap = [];
        for (let i = 0, j = 0; i < raw.length; i++) {
          if ('><+-.,[]'.includes(raw[i])) posMap[j++] = i;
        }
        const pc = s.pc;
        if (pc >= stripped.length) { highlightEl.innerHTML = ''; return; }
        const rawPos = posMap[pc];
        const before = esc(raw.slice(0, rawPos));
        const ch = esc(raw[rawPos] || '');
        const after = esc(raw.slice(rawPos + 1));
        highlightEl.innerHTML = `<code>${before}<mark class="pc-marker">${ch}</mark>${after}</code>`;
      }

      function updateUI() {
        if (!debugger_) {
          document.getElementById('tut-steps-count').textContent = 'Steps: 0';
          let th = '<div class="mini-tape">';
          for (let i = 0; i < 10; i++) {
            th += `<div class="mini-cell ${i===0?'mini-active':'mini-empty'}" title="[${i}] = 0"><span class="mini-idx">${i}</span><span class="mini-val">0</span>${i===0?'<span class="mini-ptr">▲</span>':''}</div>`;
          }
          th += '</div>';
          document.getElementById('task-mini-tape').innerHTML = th;
          document.getElementById('task-mini-output').innerHTML = '';
          document.getElementById('task-result').innerHTML = '';
          highlightEl.innerHTML = '';
          return;
        }
        const s = debugger_.getState();
        document.getElementById('tut-steps-count').textContent = `Steps: ${s.steps}`;
        let th = '<div class="mini-tape">';
        for (let i = 0; i < 10; i++) {
          const v = s.memory[i], isPtr = i === s.ptr, filled = v !== 0;
          th += `<div class="mini-cell ${isPtr?'mini-active':filled?'mini-filled':'mini-empty'}" title="[${i}] = ${v}"><span class="mini-idx">${i}</span><span class="mini-val">${v}</span>${isPtr?'<span class="mini-ptr">▲</span>':''}</div>`;
        }
        th += '</div>';
        document.getElementById('task-mini-tape').innerHTML = th;
        const oe = document.getElementById('task-mini-output');
        if (oe) oe.innerHTML = s.output ? `<span class="mini-out-label">Output:</span> <code>${esc(s.output)}</code>` : '';
        const re = document.getElementById('task-result');
        if (re) {
          if (s.error) re.innerHTML = `<div class="task-fail">⚠️ ${esc(s.error)}</div>`;
          else if (s.finished) {
            if (hasCheck) {
              const passed = task.check(s);
              if (passed) { stepPassed[stepIdx] = true; document.getElementById('tut-next').disabled = false; }
              re.innerHTML = passed ? '<div class="task-success">✅ Correct!</div>' : '<div class="task-fail">❌ Not quite — try editing the code</div>';
            } else {
              stepPassed[stepIdx] = true;
              document.getElementById('tut-next').disabled = false;
              re.innerHTML = '<div class="task-success">✅ Done!</div>';
            }
          }
          else re.innerHTML = '';
        }
        highlightPC();
      }

      initDbg();
      updateUI();

      codeEl.addEventListener('input', () => {
        initDbg(); updateUI();
        localStorage.setItem('bf_tut_code_' + taskIdx, codeEl.value);
      });
      document.getElementById('tut-step-btn').addEventListener('click', () => {
        if (!debugger_) { initDbg(); if (!debugger_) return; }
        if (debugger_.getState().finished || debugger_.getState().error) initDbg();
        debugger_.step();
        updateUI();
      });
      document.getElementById('tut-run-all').addEventListener('click', () => {
        if (!debugger_) { initDbg(); if (!debugger_) return; }
        if (debugger_.getState().finished || debugger_.getState().error) initDbg();
        let limit = 50000;
        while (limit-- > 0 && !debugger_.getState().finished && !debugger_.getState().error) debugger_.step();
        updateUI();
      });
      document.getElementById('tut-reset').addEventListener('click', () => { initDbg(); updateUI(); });

      // Show active shortcuts bar
      updateActiveShortcuts();
    }

    function updateActiveShortcuts() {
      const el = document.getElementById('tut-active-shortcuts');
      if (!el) return;
      const sc = App.getShortcuts();
      if (!sc.enabled) { el.innerHTML = '<span class="tut-sc-off">⌨ Shortcuts OFF — use navbar ⌨ to enable</span>'; return; }
      const bfLabels = { '>':'▶','<':'◀','+':'＋','-':'－','.':'．',',':'，','[':'［',']':'］','/':'／','\\n':'↵' };
      const active = [];
      for (const [code, bf] of Object.entries(sc.map)) {
        if (bf && bf !== '') {
          // Skip default identity mappings
          if (['Slash','Period','Comma','BracketLeft','BracketRight','Minus','Equal','Semicolon','Quote','Backslash','Space','Enter','Backspace','Delete','Tab','Escape'].includes(code)) continue;
          const keyName = code.replace('Key','').replace('Digit','');
          const dispBf = bfLabels[bf] || bf.replace('\\n','↵');
          active.push('<span class="tut-sc-chip"><kbd>' + keyName + '</kbd> → <kbd class="bf-char">' + dispBf + '</kbd></span>');
        }
      }
      if (active.length === 0) { el.innerHTML = '<span class="tut-sc-off">⌨ Shortcuts ON — use navbar ⚙ to configure keys</span>'; return; }
      el.innerHTML = '<span class="tut-sc-on">Active:</span> ' + active.join(' ');
    }

    main.innerHTML = `
      <div class="tutorial-page">
        <div class="tutorial-container">
          <div class="tutorial-header">
            <h1>🧠 Learn Brainfuck</h1>
            <p>Interactive tutorial — write code and watch it run step by step</p>
          </div>
          <div id="tut-content" class="tutorial-content"></div>
          <div id="tut-task-area" class="tutorial-task-area"></div>
          <div class="tutorial-nav">
            <button id="tut-prev" class="btn btn-outline" style="visibility:hidden;">← Back</button>
            <span id="tut-progress" class="tut-progress">Step 1/7</span>
            <button id="tut-next" class="btn btn-primary" disabled>Next →</button>
          </div>
        </div>
      </div>`;

    renderStep();

    document.getElementById('tut-prev').addEventListener('click', () => {
      if (stepIdx > 0) { stepIdx--; renderStep(); }
    });
    document.getElementById('tut-next').addEventListener('click', () => {
      if (stepIdx < steps.length - 1) { stepIdx++; renderStep(); } else { localStorage.setItem('bf_tutorial_done', '1'); this.navigate('challenges'); }
    });

    function setupTapePlayground() {
      const CELLS = 10;
      const tape = new Array(CELLS).fill(0);
      let ptr = 0;
      const container = document.getElementById('tut-tape-playground');
      if (!container) return;

      function renderTape() {
        const tapeEl = document.getElementById('ttp-tape');
        let html = '';
        for (let i = 0; i < CELLS; i++) {
          const v = tape[i];
          const isPtr = i === ptr;
          const filled = v !== 0;
          html += `<div class="ttp-cell ${isPtr ? 'ttp-active' : filled ? 'ttp-filled' : ''}">
            <span class="ttp-idx">${i}</span>
            <span class="ttp-val">${v}</span>
            ${isPtr ? '<span class="ttp-ptr">▼</span>' : ''}
          </div>`;
        }
        tapeEl.innerHTML = html;
        document.getElementById('ttp-ptr-label').innerHTML = 'Pointer: cell <strong>' + ptr + '</strong>';
        document.getElementById('ttp-cell-idx').textContent = ptr;
        document.getElementById('ttp-cell-val').textContent = tape[ptr];
        const asciiEl = document.getElementById('ttp-ascii');
        const val = tape[ptr];
        if (val >= 32 && val <= 126) {
          asciiEl.innerHTML = 'ASCII: <strong style="font-size:1.2rem">' + String.fromCharCode(val) + '</strong> (code ' + val + ')';
        } else if (val === 0) {
          asciiEl.innerHTML = 'ASCII: <em>null character</em>';
        } else {
          asciiEl.innerHTML = 'ASCII: <em>non-printable</em> (code ' + val + ')';
        }
      }

      const allBtns = document.querySelectorAll('.ttp-btn');
      if (allBtns.length === 0) return;
      allBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
          const action = newBtn.dataset.action;
          if (action === 'right') { ptr = (ptr + 1) % CELLS; }
          else if (action === 'left') { ptr = (ptr - 1 + CELLS) % CELLS; }
          else if (action === 'inc') { tape[ptr] = (tape[ptr] + 1) % 256; }
          else if (action === 'dec') { tape[ptr] = (tape[ptr] - 1 + 256) % 256; }
          else if (action === 'reset') { for (let i = 0; i < CELLS; i++) tape[i] = 0; ptr = 0; }
          renderTape();
        });
      });

      renderTape();
    }
  },

  /* ========== CHALLENGES ========== */
  renderChallengesPage(main) {
    const user = Auth.getCurrentUser();
    let completedChallenges = {};
    try { completedChallenges = JSON.parse(localStorage.getItem('bf_progress') || '{}'); } catch(e) {}
    const inProgress = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('bf_code_')) inProgress[key.replace('bf_code_', '')] = true;
    }
    const completedCount = Object.keys(completedChallenges).length;
    const tutorialDone = localStorage.getItem('bf_tutorial_done');
    const unlocked = new Set();
    const sortedChallenges = [...CHALLENGES].sort((a, b) => a.order - b.order);
    if (tutorialDone) {
      // All challenges unlocked after tutorial
      for (const c of sortedChallenges) unlocked.add(c.id);
    }
    const filter = this._filterDifficulty;
    const filtered = sortedChallenges.filter(c => filter === 'All' || c.difficulty === filter);

    main.innerHTML = `
      <div class="challenges-page">
        <div class="challenges-header">
          <div><h1>⚡ Challenges</h1><p class="challenges-subtitle">${completedCount}/${CHALLENGES.length} solved${tutorialDone?'':' · Complete the tutorial to unlock'}</p></div>
          <div class="challenges-actions">
            <div class="filter-bar">
              ${['All','Easy','Medium','Hard'].map(d => {
                const fc = DIFFICULTY_COLORS[d] || '#6366f1';
                const isActive = filter===d;
                const count = d==='All' ? sortedChallenges.length : sortedChallenges.filter(c=>c.difficulty===d).length;
                return `<button class="filter-chip ${isActive?'active':''}" onclick="App.setFilter('${d}')" style="${isActive?`background:${fc};border-color:${fc};color:#fff;box-shadow:0 2px 12px ${fc}40`:`color:${fc};border-color:${fc}30`}">${d} <span class="filter-count">${count}</span></button>`;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="challenge-list">
          <div class="challenge-card tutorial-entry" onclick="App.navigate('tutorial')">
            <div class="challenge-card-left"><span class="challenge-status">📖</span>
              <div><h3 class="challenge-title">Interactive Tutorial <span class="badge-completed" style="background:var(--accent-primary);color:#fff;">Start here</span></h3><span class="challenge-category">Learn the 8 commands step by step</span></div>
            </div>
            <div class="challenge-card-right"><span class="difficulty-badge" style="background:#6366f120;color:#6366f1;border:1px solid #6366f140">📘 Tutorial</span></div>
          </div>
          ${filtered.map((c,i)=>{
            const isDone = completedChallenges[c.id];
            const hasCode = inProgress[c.id];
            const isUnlocked = unlocked.has(c.id);
            const color = DIFFICULTY_COLORS[c.difficulty];
            return isUnlocked
              ? `<div class="challenge-card ${isDone?'completed':''}" onclick="App.navigate('challenge','${c.id}')">
                  <div class="challenge-card-left"><span class="challenge-number">#${i+1}</span>
                    <div><h3 class="challenge-title">${c.title}${isDone?'<span class="badge-completed">Solved</span>':hasCode?'<span class="badge-in-progress">Draft</span>':''}</h3><span class="challenge-category">${c.category}</span></div>
                  </div>
                  <div class="challenge-card-right"><span class="difficulty-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${c.difficulty}</span></div>
                </div>`
              : `<div class="challenge-card locked">
                  <div class="challenge-card-left"><span class="challenge-status">🔒</span><div><h3 class="challenge-title">???</h3><span class="challenge-category">Locked</span></div></div>
                  <div class="challenge-card-right"><span class="difficulty-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${c.difficulty}</span></div>
                </div>`;
          }).join('')}
        </div>
        ${filtered.length===0?`<div class="empty-state"><p>No challenges for this difficulty.</p></div>`:''}
      </div>`;
  },

  setFilter(d) { this._filterDifficulty = d; this.renderCurrentPage(); },

  // Public auth helpers called from HTML
  async _googleLogin() {
    const result = await Auth.loginWithGoogle();
    if (result.success) App.navigate('home');
    else alert(result.error);
  },

  async _emailLogin(email, password) {
    const result = await Auth.loginWithEmail(email, password);
    if (result.success) App.navigate('home');
    else alert(result.error);
  },

  /* ========== CHALLENGE PAGE ========== */
  loadChallengePage(slug) {
    const main = document.getElementById('main-content');
    if (!main) return;
    const challenge = CHALLENGES.find(c => c.id === slug);
    if (!challenge) { this.navigate('challenges'); return; }

    // Block if tutorial not completed
    const tutorialDone = localStorage.getItem('bf_tutorial_done');
    if (!tutorialDone) { this.navigate('challenges'); return; }

    const color = DIFFICULTY_COLORS[challenge.difficulty];

    main.innerHTML = `
      <div class="challenge-page">
        <div class="challenge-pane description-pane">
          <div class="pane-header">
            <button class="btn btn-sm btn-outline" onclick="App.navigate('challenges')">← Back</button>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('tutorial')" title="Tutorial">📖</button>
          </div>
          <div class="challenge-description">
            <div class="challenge-title-row"><h1>${challenge.title}</h1><span class="difficulty-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${challenge.difficulty}</span></div>
            <span class="challenge-category-tag">${challenge.category}</span>
            <div class="description-section"><p>${challenge.description.replace(/\n/g,'<br>')}</p></div>
            ${challenge.examples.length?`<div class="description-section"><h3>Examples</h3>${challenge.examples.map((ex,i)=>`<div class="example-box"><strong>Example ${i+1}:</strong><div class="example-io"><div><span class="io-label">Input:</span> <code>${ex.input||'(none)'}</code></div><div><span class="io-label">Output:</span> <code>${ex.output}</code></div>${ex.explanation?`<div><span class="io-label">Explanation:</span> ${ex.explanation}</div>`:''}</div></div>`).join('')}</div>`:''}
            ${challenge.constraints.length?`<div class="description-section"><h3>Constraints</h3><ul>${challenge.constraints.map(c=>`<li>${c}</li>`).join('')}</ul></div>`:''}
            ${challenge.hints.length?`<div class="description-section"><h3>Hints</h3><div class="hints-container">${challenge.hints.map((h,i)=>`<details class="hint-detail"><summary>Hint ${i+1}</summary><p>${h}</p></details>`).join('')}</div></div>`:''}
          </div>
        </div>
        <div class="challenge-pane editor-pane">
          <div id="login-gate" class="login-gate">
            <div class="login-gate-content">
              <span class="login-gate-icon">🔐</span><h2>Sign in required</h2>
              <p>You need to sign in to write and run Brainfuck code.</p>
              <button class="btn btn-primary btn-lg" onclick="App.navigate('login')">Sign In to Continue</button>
              <p class="login-gate-hint">Don't have an account? <a href="#" onclick="App.navigate('register');return false;">Create one</a></p>
            </div>
          </div>
          <div id="challenge-content" style="display:none;">
            <div class="editor-toolbar">
              <div class="toolbar-left">
                <span class="lang-label">Brainfuck</span>
                <span id="char-count" class="char-count">0 chars</span>
                <button class="btn btn-sm btn-outline shortcut-toggle desktop-only" id="toggle-shortcuts" title="Configure keyboard shortcuts">⌨ Config</button>
              </div>
              <div class="toolbar-right">
                <button class="btn btn-sm btn-outline" id="btn-reset">↺ Reset</button>
                <button class="btn btn-sm btn-submit" id="btn-submit">✓ Submit</button>
              </div>
            </div>
            <textarea id="code-editor" class="code-editor" placeholder="Write your Brainfuck code here...
Use // for comments" spellcheck="false"></textarea>
            <div id="bf-keyboard" class="bf-keyboard"></div>
            <div class="mode-tabs">
              <button class="mode-tab active" data-mode="run">▶ Run</button>
              <button class="mode-tab" data-mode="debug">🐛 Debug</button>
              <button class="mode-tab mode-tab-ascii" data-mode="ascii">📋 ASCII</button>
            </div>
            <div id="mode-run" class="mode-panel">
              <div class="run-layout">
                <div class="run-input-col">
                  <label class="run-label">Input (stdin)</label>
                  <textarea id="input-field" class="run-input" placeholder="Program input..." rows="3"></textarea>
                  <button class="btn btn-sm btn-run btn-block" id="btn-run" style="margin-top:8px;">▶ Run Code</button>
                </div>
                <div class="run-output-col">
                  <label class="run-label">Output</label>
                  <div id="output-area" class="run-output">
                    <div class="output-placeholder">Output will appear here.</div>
                  </div>
                </div>
              </div>
            </div>
            <div id="mode-debug" class="mode-panel" style="display:none;">
              <div class="debug-toolbar">
                <button class="btn btn-sm btn-run" id="btn-step">⏭ Step</button>
                <button class="btn btn-sm btn-submit" id="btn-run-to-bp">⏩ Run to BP</button>
                <button class="btn btn-sm btn-outline" id="btn-stop-debug">⏹ Stop</button>
                <span class="debug-hint">Click ● in the gutter to toggle breakpoints</span>
              </div>
              <div class="debug-layout">
                <div class="debug-code-panel">
                  <div class="debug-section-title">Code</div>
                  <div id="debug-code-display" class="debug-code-display"></div>
                </div>
                <div class="debug-right-panel">
                  <div id="debug-info" class="debug-info"></div>
                  <div class="debug-section-title">Memory Tape</div>
                  <div id="debug-tape" class="debug-tape"></div>
                </div>
              </div>
            </div>
            <div id="mode-ascii" class="mode-panel" style="display:none;">
              <div class="ascii-container">
                <h3>Printable ASCII (32–126)</h3>
                <p class="ascii-subtitle">Hover for details</p>
                <div id="ascii-table-body" class="ascii-grid"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    Editor.init();
    Editor.loadChallenge(challenge);
  },

  /* ========== AUTH PAGES ========== */
  renderLoginPage(main, isRegister = false) {
    main.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-icon">🧠</span>
            <h1>${isRegister ? 'Create Account' : 'Welcome Back'}</h1>
            <p>${isRegister ? 'Start your Brainfuck journey' : 'Sign in to save your progress'}</p>
          </div>
          <div class="auth-providers">
            <button class="btn btn-provider btn-lg btn-block" id="btn-google">
              <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right:8px"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
          <div class="auth-divider"><span>or continue with email</span></div>
          <form class="auth-form" id="auth-form">
            ${isRegister ? '<div class="form-group"><label>Display Name</label><input type="text" name="displayName" class="input-field" placeholder="Your name"></div>' : ''}
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" class="input-field" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              ${isRegister ? '<div class="form-label-row"><label>Password</label></div>' : '<div class="form-label-row"><label>Password</label><a href="#" class="form-link" id="btn-forgot">Forgot?</a></div>'}
              <input type="password" name="password" class="input-field" placeholder="${isRegister ? 'At least 6 characters' : 'Your password'}" minlength="6" required>
            </div>
            <div id="auth-error" class="auth-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="btn-submit-auth">${isRegister ? 'Create Account' : 'Sign In'}</button>
          </form>
          <p class="auth-footer">
            ${isRegister ? 'Already have an account? <a href="#" onclick="App.navigate(\'login\');return false;">Sign in</a>' : "Don't have an account? <a href=\"#\" onclick=\"App.navigate('register');return false;\">Create one</a>"}
          </p>
        </div>
      </div>`;

    // Bind form submit
    const form = document.getElementById('auth-form');
    const errorEl = document.getElementById('auth-error');
    const btnGoogle = document.getElementById('btn-google');
    const submitBtn = document.getElementById('btn-submit-auth');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';
      const email = form.email.value.trim();
      const password = form.password.value;
      let result;
      if (isRegister) {
        const displayName = form.displayName?.value?.trim() || email.split('@')[0];
        result = await Auth.registerWithEmail(email, password, displayName);
      } else {
        result = await Auth.loginWithEmail(email, password);
      }
      if (!result.success) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Create Account' : 'Sign In';
      } else {
        App.navigate('home');
      }
    });

    btnGoogle.addEventListener('click', async () => {
      btnGoogle.disabled = true;
      btnGoogle.textContent = 'Redirecting...';
      const result = await Auth.loginWithGoogle();
      if (!result.success) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        btnGoogle.disabled = false;
        btnGoogle.textContent = 'Continue with Google';
      } else {
        App.navigate('home');
      }
    });

    // Forgot password
    const btnForgot = document.getElementById('btn-forgot');
    if (btnForgot) {
      btnForgot.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        if (!email) { errorEl.textContent = 'Enter your email first.'; errorEl.style.display = 'block'; return; }
        const result = await Auth.resetPassword(email);
        if (result.success) {
          errorEl.textContent = 'Password reset email sent! Check your inbox.';
          errorEl.style.display = 'block';
          errorEl.style.background = 'var(--accent-success-light)';
          errorEl.style.color = 'var(--accent-success)';
        } else {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
        }
      });
    }
  },

  /* ========== PROFILE PAGE ========== */
  renderProfilePage(main) {
    const user = Auth.getCurrentUser();
    let completedCount = 0;
    try { const p = JSON.parse(localStorage.getItem('bf_progress') || '{}'); completedCount = Object.keys(p).length; } catch(e) {}

    main.innerHTML = `
      <div class="profile-page">
        <div class="profile-container">
          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar">🧠</div>
              <h2>${user ? (user.displayName || user.email) : 'Not signed in'}</h2>
              ${user ? `<p class="profile-email">${user.email}</p>` : ''}
            </div>
            <div class="profile-stats">
              <div class="profile-stat"><span class="ps-num">${completedCount}</span><span class="ps-label">Challenges Solved</span></div>
              <div class="profile-stat"><span class="ps-num">${CHALLENGES.length}</span><span class="ps-label">Total</span></div>
            </div>
            <div class="profile-actions">
              <button class="btn btn-outline btn-block" onclick="App._resetProgress()">🗑 Reset All Progress</button>
              ${user ? '<button class="btn btn-outline btn-block" onclick="Auth.logout().then(()=>App.navigate(\'home\'))">🚪 Sign Out</button>' : '<button class="btn btn-primary btn-block" onclick="App.navigate(\'login\')">Sign In</button>'}
            </div>
          </div>
        </div>
      </div>`;
  },

  _resetProgress() {
    if (!confirm('This will delete all saved code and progress. Are you sure?')) return;
    localStorage.removeItem('bf_progress');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith('bf_code_') || key.startsWith('bf_shortcuts') || key === 'bf_shortcuts_enabled') localStorage.removeItem(key);
    }
    alert('Progress reset!');
    this.renderCurrentPage();
  },

  /* ========== UTILS ========== */
  _getCurrentSlug() {
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    return parts.length > 1 ? parts[1] : null;
  },

  _escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
};
