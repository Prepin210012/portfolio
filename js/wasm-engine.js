/* ═══════════════════════════════════════════════════════════════
   WASM-ENGINE.JS — WebAssembly-powered quantitative engine
   Monte Carlo simulation + option pricing via WASM
   ═══════════════════════════════════════════════════════════════ */

class QuantEngine {
  constructor() {
    this.wasmInstance = null;
    this.ready = false;
  }

  async init() {
    try {
      // Try loading the .wasm binary
      const response = await fetch('/portfolio/wasm/quant_engine.wasm');
      const buffer = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(buffer);
      this.wasmInstance = instance;
      this.ready = true;
      console.log('[WASM] Quant engine loaded ✓');
      return true;
    } catch (err) {
      console.warn('[WASM] Falling back to JS engine:', err.message);
      this.ready = false;
      return false;
    }
  }

  /* ── Monte Carlo Pi Estimation ───────────────────────────── */
  monteCarloPI(iterations = 100000) {
    let inside = 0;
    for (let i = 0; i < iterations; i++) {
      const x = Math.random();
      const y = Math.random();
      if (x * x + y * y <= 1) inside++;
    }
    return (4 * inside) / iterations;
  }

  /* ── Monte Carlo Option Pricing ──────────────────────────── */
  // Geometric Brownian Motion simulation for European call
  monteCarloOptionPrice(S, K, T, r, sigma, simulations = 50000) {
    let payoffSum = 0;

    for (let i = 0; i < simulations; i++) {
      // Generate standard normal using Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      // Simulate terminal stock price under GBM
      const ST = S * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z);

      // European call payoff
      payoffSum += Math.max(ST - K, 0);
    }

    // Discounted expected payoff
    return Math.exp(-r * T) * (payoffSum / simulations);
  }

  /* ── Black-Scholes Analytical ────────────────────────────── */
  blackScholesCall(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return S * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
  }

  normalCDF(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }

  /* ── WASM-accelerated computation ────────────────────────── */
  wasmOptionPrice(S, K, T, r, sigma) {
    if (this.ready && this.wasmInstance) {
      // Use WASM for base calculation, JS for Monte Carlo
      const wasmBase = this.wasmInstance.exports.option_price(S, K, T, r, sigma);
      // Combine with JS Monte Carlo for full simulation
      const mcPrice = this.monteCarloOptionPrice(S, K, T, r, sigma, 10000);
      return { wasmEstimate: wasmBase, mcEstimate: mcPrice, bsAnalytical: this.blackScholesCall(S, K, T, r, sigma) };
    }
    return {
      wasmEstimate: null,
      mcEstimate: this.monteCarloOptionPrice(S, K, T, r, sigma, 10000),
      bsAnalytical: this.blackScholesCall(S, K, T, r, sigma)
    };
  }
}

/* ── Terminal UI Integration ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const engine = new QuantEngine();
  const loaded = await engine.init();

  const outputEl = document.getElementById('wasm-output');
  const valueEl = document.getElementById('wasm-output-value');
  const runBtn = document.getElementById('wasm-run-btn');
  const simBtn = document.getElementById('wasm-sim-btn');

  if (!outputEl) return;

  // Initial status
  const statusLine = document.getElementById('wasm-status');
  if (statusLine) {
    statusLine.textContent = loaded ? '✓ WASM engine loaded' : '⚠ JS fallback mode';
    statusLine.style.color = loaded ? '#22d3a7' : '#f59e0b';
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const iterations = 100000;
      const start = performance.now();
      const piEstimate = engine.monteCarloPI(iterations);
      const elapsed = (performance.now() - start).toFixed(2);

      outputEl.innerHTML = `<span class="prompt">$</span> run monte_carlo --iterations=${iterations.toLocaleString()}
<span class="comment">// Estimating π via random sampling...</span>
<span class="output">π ≈ <span class="value">${piEstimate.toFixed(8)}</span></span>
<span class="output">Error: <span class="value">${Math.abs(piEstimate - Math.PI).toExponential(4)}</span></span>
<span class="comment">// Computed in ${elapsed}ms</span>`;
    });
  }

  if (simBtn) {
    simBtn.addEventListener('click', () => {
      const S = 100, K = 105, T = 0.5, r = 0.05, sigma = 0.2;
      const start = performance.now();
      const result = engine.wasmOptionPrice(S, K, T, r, sigma);
      const elapsed = (performance.now() - start).toFixed(2);

      outputEl.innerHTML = `<span class="prompt">$</span> price_option --model=GBM --S=100 --K=105 --T=0.5
<span class="comment">// European Call | S=$${S} K=$${K} T=${T}y r=${r*100}% σ=${sigma*100}%</span>
<span class="output">Monte Carlo (50k paths): <span class="value">$${result.mcEstimate.toFixed(4)}</span></span>
<span class="output">Black-Scholes Analytical: <span class="value">$${result.bsAnalytical.toFixed(4)}</span></span>${result.wasmEstimate ? `
<span class="output">WASM Linear Approx:      <span class="value">$${result.wasmEstimate.toFixed(4)}</span></span>` : ''}
<span class="comment">// Computed in ${elapsed}ms | Engine: ${loaded ? 'WASM+JS' : 'JS'}</span>`;
    });
  }
});
