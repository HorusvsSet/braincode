/**
 * Brainfuck Interpreter
 * Supports both full execution and step-by-step debugging.
 */
class BrainfuckInterpreter {
  constructor() {
    this.MEMORY_SIZE = 30000;
    this.MAX_STEPS = 100000;
    this.TIMEOUT_MS = 5000;
  }

  /**
   * Execute Brainfuck code with given input (full run)
   */
  execute(code, input = '') {
    const memory = new Uint8Array(this.MEMORY_SIZE);
    let ptr = 0;
    let pc = 0;
    let inputPtr = 0;
    let output = '';
    let steps = 0;

    const jumpTable = this._buildJumpTable(code);
    const startTime = Date.now();

    while (pc < code.length) {
      if (steps++ > this.MAX_STEPS) {
        throw new Error(`Execution limit exceeded: ${this.MAX_STEPS} steps`);
      }
      if (Date.now() - startTime > this.TIMEOUT_MS) {
        throw new Error(`Timeout: execution took longer than ${this.TIMEOUT_MS}ms`);
      }

      const instruction = code[pc];

      switch (instruction) {
        case '>': ptr++; if (ptr >= this.MEMORY_SIZE) throw new Error(`Memory overflow: pointer exceeded ${this.MEMORY_SIZE}`); break;
        case '<': ptr--; if (ptr < 0) throw new Error('Memory underflow: pointer went below 0'); break;
        case '+': memory[ptr] = (memory[ptr] + 1) & 0xFF; break;
        case '-': memory[ptr] = (memory[ptr] - 1) & 0xFF; break;
        case '.':
          const ch = String.fromCharCode(memory[ptr]);
          output += ch;
          // If char is printable or newline show as-is, else show hex
          break;
        case ',':
          if (inputPtr < input.length) { memory[ptr] = input.charCodeAt(inputPtr++) & 0xFF; }
          else { memory[ptr] = 0; }
          break;
        case '[': if (memory[ptr] === 0) { pc = jumpTable[pc]; } break;
        case ']': if (memory[ptr] !== 0) { pc = jumpTable[pc]; } break;
      }
      pc++;
    }

    return { output, steps, memory: Array.from(memory.slice(0, Math.max(ptr + 1, 20))) };
  }

  /**
   * Create a debugger session for step-by-step execution
   */
  createDebugger(code, input = '') {
    const memory = new Uint8Array(this.MEMORY_SIZE);
    const jumpTable = this._buildJumpTable(code);
    const breakpoints = new Set();

    return {
      memory,
      ptr: 0,
      pc: 0,
      inputPtr: 0,
      input,
      output: '',
      steps: 0,
      code,
      jumpTable,
      breakpoints,
      _finished: false,
      _error: null,

      /** Get current state for display */
      getState() {
        return {
          pc: this.pc,
          ptr: this.ptr,
          currentInstruction: this.code[this.pc] || '(end)',
          memory: Array.from(this.memory.slice(0, Math.max(this.ptr + 3, 30))),
          output: this.output,
          steps: this.steps,
          finished: this._finished,
          error: this._error,
          breakpoints: Array.from(this.breakpoints),
          inputRemaining: this.input.slice(this.inputPtr),
          source: this.code
        };
      },

      /** Toggle a breakpoint at the given code position */
      toggleBreakpoint(pos) {
        if (this.breakpoints.has(pos)) {
          this.breakpoints.delete(pos);
          return false;
        } else {
          this.breakpoints.add(pos);
          return true;
        }
      },

      /** Execute one step */
      step() {
        if (this._finished || this._error) return this.getState();

        if (this.pc >= this.code.length) {
          this._finished = true;
          return this.getState();
        }

        if (this.steps >= 100000) {
          this._error = 'Execution limit exceeded: 100000 steps';
          return this.getState();
        }

        const instruction = this.code[this.pc];

        switch (instruction) {
          case '>':
            this.ptr++;
            if (this.ptr >= this.MEMORY_SIZE) {
              this._error = `Memory overflow at position ${this.pc}`;
              return this.getState();
            }
            break;
          case '<':
            this.ptr--;
            if (this.ptr < 0) {
              this._error = `Memory underflow at position ${this.pc}`;
              return this.getState();
            }
            break;
          case '+':
            this.memory[this.ptr] = (this.memory[this.ptr] + 1) & 0xFF;
            break;
          case '-':
            this.memory[this.ptr] = (this.memory[this.ptr] - 1) & 0xFF;
            break;
          case '.':
            this.output += String.fromCharCode(this.memory[this.ptr]);
            break;
          case ',':
            if (this.inputPtr < this.input.length) {
              this.memory[this.ptr] = this.input.charCodeAt(this.inputPtr++) & 0xFF;
            } else {
              this.memory[this.ptr] = 0;
            }
            break;
          case '[':
            if (this.memory[this.ptr] === 0) {
              this.pc = this.jumpTable[this.pc];
            }
            break;
          case ']':
            if (this.memory[this.ptr] !== 0) {
              this.pc = this.jumpTable[this.pc];
            }
            break;
        }

        this.pc++;
        this.steps++;

        if (this.pc >= this.code.length) {
          this._finished = true;
        }

        return this.getState();
      },

      /** Run until a breakpoint is hit or execution finishes */
      runToBreakpoint() {
        let safety = 0;
        const maxIter = 100000;

        while (!this._finished && !this._error && safety < maxIter) {
          // Check if current position has a breakpoint (check before stepping)
          if (this.breakpoints.has(this.pc)) {
            break; // hit a breakpoint
          }

          const state = this.step();
          if (state.finished || state.error) break;
          safety++;
        }

        if (safety >= maxIter) {
          this._error = 'Run limit reached';
        }

        return this.getState();
      },

      /** Reset debugger to beginning */
      reset(newInput) {
        this.memory.fill(0);
        this.ptr = 0;
        this.pc = 0;
        this.inputPtr = 0;
        if (newInput !== undefined) this.input = newInput;
        this.output = '';
        this.steps = 0;
        this._finished = false;
        this._error = null;
        return this.getState();
      }
    };
  }

  /** Build jump table for [ and ] */
  _buildJumpTable(code) {
    const table = {};
    const stack = [];
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '[') { stack.push(i); }
      else if (code[i] === ']') {
        if (stack.length === 0) throw new Error(`Unmatched ']' at position ${i}`);
        const openPos = stack.pop();
        table[openPos] = i;
        table[i] = openPos;
      }
    }
    if (stack.length > 0) throw new Error(`Unmatched '[' at position ${stack[0]}`);
    return table;
  }

  static strip(code) {
    return code.replace(/[^><+\-.,\[\]]/g, '');
  }

  static validate(code) {
    const stripped = BrainfuckInterpreter.strip(code);
    try {
      const interp = new BrainfuckInterpreter();
      interp._buildJumpTable(stripped);
      return { valid: true, stripped };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrainfuckInterpreter;
}
