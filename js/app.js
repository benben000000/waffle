// StallSense — UI orchestration
import { setApiKey, hasApiKey } from "./gemini.js";
import {
  AGENTS,
  runNormalizer,
  runForecaster,
  runPlanner,
  runWasteAdvisor,
  runBrief,
} from "./agents.js";

const $ = (id) => document.getElementById(id);
const store = {
  get key() { return localStorage.getItem("StallSense_key") || ""; },
  set key(v) { localStorage.setItem("StallSense_key", v); },
};

// --- init ---
$("selldate").value = new Date().toISOString().slice(0, 10);
if (store.key) setApiKey(store.key);
renderTrace();

// --- API key modal ---
$("keyBtn").onclick = () => {
  $("keyInput").value = store.key;
  $("keyModal").classList.remove("hidden");
};
$("keyClose").onclick = () => $("keyModal").classList.add("hidden");
$("keySave").onclick = () => {
  store.key = $("keyInput").value.trim();
  setApiKey(store.key);
  $("keyModal").classList.add("hidden");
};

// --- image upload ---
let imageData = null;
$("menuImage").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("imgName").textContent = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(",")[1];
    imageData = { base64, mime: file.type };
  };
  reader.readAsDataURL(file);
};

// --- example fill ---
$("demoFill").onclick = () => {
  $("menuInput").value = `Chicken Rice $4.50 (cost ~$1.80, sells out fast)
Char Kway Teow $5.00 (cost ~$2.00)
Laksa $5.50 (cost ~$2.20)
Iced Kopi $1.50 (cost ~$0.40)
Milo Dinosaur $2.50 (cost ~$0.70)`;
  $("location").value = "Maxwell Food Centre, Singapore";
  $("pastNotes").value = "Rained hard around 1pm yesterday, footfall dropped. Laksa sold out by 2pm, had 8 leftover chicken rice.";
};

// --- render agent trace skeleton ---
function renderTrace() {
  $("agentTrace").innerHTML = AGENTS.map(
    (a) => `
    <li id="ag-${a.id}">
      <span class="glyph">${a.glyph}</span>
      <div class="t-label">${a.label}</div>
      <div class="t-desc">${a.desc}</div>
      <span class="t-status"></span>
    </li>`
  ).join("");
}

function setStatus(id, state, extra = "") {
  const li = $(`ag-${id}`);
  li.classList.remove("active", "done", "err");
  const status = li.querySelector(".t-status");
  if (state === "active") {
    li.classList.add("active");
    status.innerHTML = `<span class="spin"></span>`;
  } else if (state === "done") {
    li.classList.add("done");
    status.textContent = "✓";
  } else if (state === "err") {
    li.classList.add("err");
    status.textContent = "✕";
    if (extra) li.querySelector(".t-desc").textContent = extra;
  } else {
    status.textContent = "";
    if (extra) li.querySelector(".t-desc").textContent = extra;
  }
}

// --- run pipeline ---
$("runBtn").onclick = runPipeline;

async function runPipeline() {
  const menuText = $("menuInput").value.trim();
  if (!menuText && !imageData) {
    alert("Paste your menu or upload a photo of your board first.");
    return;
  }
  if (!hasApiKey()) {
    $("keyBtn").click();
    return;
  }

  const btn = $("runBtn");
  btn.disabled = true;
  btn.textContent = "Running agents…";
  renderTrace();
  $("pipelineSummary").classList.add("hidden");
  $("output").innerHTML = `<div class="empty-state"><div class="es-icon">⏳</div><p>Agents are working…</p></div>`;

  const location = $("location").value.trim();
  const selldate = $("selldate").value;
  const pastNotes = $("pastNotes").value.trim();

  try {
    // Agent 1
    setStatus("normalizer", "active");
    const menu = await runNormalizer(menuText, imageData);
    if (!menu.items?.length) throw new Error("No menu items found — try clearer input.");
    setStatus("normalizer", "done", `${menu.items.length} items · ${menu.currency}`);

    // Agent 2
    setStatus("forecaster", "active");
    const forecast = await runForecaster(menu, location, selldate, pastNotes);
    setStatus("forecaster", "done", `footfall index ${forecast.footfall_index}`);

    // Agent 3
    setStatus("planner", "active");
    const plan = await runPlanner(menu, forecast);
    setStatus("planner", "done", `${plan.prep_plan.length} items planned`);

    // Agent 4
    setStatus("waste", "active");
    const waste = await runWasteAdvisor(menu, plan);
    setStatus("waste", "done", `${waste.diversion_rate_pct}% diverted`);

    // Agent 5
    setStatus("brief", "active");
    const brief = await runBrief(menu, forecast, plan, waste, menu.currency);
    setStatus("brief", "done", "ready");

    renderSummary(menu, plan, waste);
    renderOutput(brief, menu, forecast, plan, waste);
  } catch (err) {
    console.error(err);
    const msg = String(err.message || err);
    // Mark the first non-done agent as errored
    const pending = AGENTS.find((a) => !$(`ag-${a.id}`).classList.contains("done"));
    if (pending) setStatus(pending.id, "err", msg);
    $("output").innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><p>Something went wrong.</p><p class="es-sub">${escapeHtml(msg)}</p></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Run 5-agent pipeline ▸";
  }
}

// --- render summary stats ---
function renderSummary(menu, plan, waste) {
  const cur = menu.currency || "";
  $("statRevenue").textContent = `${cur} ${fmt(plan.totals.total_expected_revenue)}`;
  $("statSurplus").textContent = plan.totals.total_expected_surplus_units;
  $("statDivert").textContent = `${waste.diversion_rate_pct}%`;
  $("statValue").textContent = `${cur} ${fmt(waste.total_value_recovered)}`;
  $("pipelineSummary").classList.remove("hidden");
}

// --- render final briefing ---
function renderOutput(brief, menu, forecast, plan, waste) {
  const cur = menu.currency || "";
  const srcs = forecast.sources || [];

  const rows = plan.prep_plan
    .map((p) => {
      const surplusClass = p.expected_surplus > 2 ? "surplus-hi" : "";
      return `<tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${p.prep_units}</td>
        <td>${p.expected_sold}</td>
        <td class="${surplusClass}">${p.expected_surplus}</td>
      </tr>`;
    })
    .join("");

  const wasteRows = waste.surplus_items
    .map(
      (s) => `<li>
        <strong>${escapeHtml(s.name)}</strong> — ${s.surplus_units} left →
        <span class="action-pill pill-${s.action}">${s.action}</span><br/>
        <span style="font-size:12px;color:var(--muted)">${escapeHtml(s.detail)}</span>
      </li>`
    )
    .join("") || `<li>Nothing leftover — demand matched prep. 🎉</li>`;

  $("output").innerHTML = `
    <div class="brief-head">
      <h3>${escapeHtml(brief.headline)}</h3>
      <p>${escapeHtml(brief.one_line_summary)}</p>
    </div>

    <div class="sec">
      <h4>✅ Do this morning</h4>
      <ul class="checklist">${brief.do_this_morning.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
    </div>

    <div class="sec">
      <h4>⚠️ Watch out for</h4>
      <ul class="checklist warn">${brief.watch_out_for.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
    </div>

    <div class="sec">
      <h4>📦 Prep plan (${escapeHtml(forecast.day_type?.replace("_", " ") || "today")}, footfall ×${forecast.footfall_index})</h4>
      <table class="plan">
        <thead><tr><th>Item</th><th>Prep</th><th>Exp. sold</th><th>Surplus</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="sec">
      <h4>♻️ Surplus → value (${waste.diversion_rate_pct}% diverted from trash)</h4>
      <ul class="checklist">${wasteRows}</ul>
      ${waste.compliance_note ? `<p class="disclaimer">Compliance: ${escapeHtml(waste.compliance_note)}</p>` : ""}
    </div>

    ${srcs.length ? `<div class="sec"><h4>🔎 Live grounding (Google Search)</h4><p class="sources">${srcs
      .map((s) => `<a href="${escapeAttr(s.uri)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a>`)
      .join(" · ")}</p></div>` : ""}

    <p class="disclaimer">Estimates are AI-generated guidance, not guarantees. Always follow local food-safety and hot-holding rules. StallSense — Sustainability &amp; Social Impact, Google Cloud AI Builder Cup 2026.</p>
  `;
}

// --- helpers ---
function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/`/g, "");
}
