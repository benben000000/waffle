// Waffle — 5-agent pipeline
// Each agent is a distinct Gemini call with its own role, schema and (where
// useful) live Google Search grounding. The pipeline is deliberately visible
// in the UI so a judge can *see* agentic orchestration, not just an output.

import {
  MODELS,
  generateStructured,
  generateGrounded,
} from "./gemini.js";

export const AGENTS = [
  { id: "normalizer", label: "Menu Normalizer", desc: "Turns messy input into a clean structured menu", glyph: "01" },
  { id: "forecaster", label: "Demand Forecaster", desc: "Grounds on live weather + local events to forecast footfall", glyph: "02" },
  { id: "planner", label: "Prep Planner", desc: "Converts forecast into per-item prep quantities", glyph: "03" },
  { id: "waste", label: "Waste-to-Value Advisor", desc: "Turns predicted surplus into donations, discounts, repurposing", glyph: "04" },
  { id: "brief", label: "Owner Briefing", desc: "Plain-language morning brief with numbers and next steps", glyph: "05" },
];

// ---------------------------------------------------------------------------
// Agent 1 — Menu Normalizer (multimodal: accepts pasted text or a photo)
// ---------------------------------------------------------------------------
const MENU_SCHEMA = {
  type: "OBJECT",
  properties: {
    stall_name: { type: "STRING" },
    cuisine: { type: "STRING" },
    currency: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          category: { type: "STRING", enum: ["mains", "sides", "drinks", "desserts", "other"] },
          price: { type: "NUMBER" },
          unit_cost: { type: "NUMBER" },
          shelf_life_hours: { type: "NUMBER" },
          prep_minutes: { type: "NUMBER" },
        },
        required: ["name", "category", "price"],
      },
    },
  },
  required: ["stall_name", "items"],
};

export async function runNormalizer(rawText, imageData) {
  const parts = [];
  const instr = `You are the Menu Normalizer agent in an agentic system for JAPAC street-food and market vendors.
Extract a clean menu from the vendor's messy input (pasted text, a photo of a handwritten board, or a receipt).
Rules:
- If unit_cost is not stated, estimate it at 35-45% of price for street food.
- shelf_life_hours: cooked food 4-6, fried 3-4, beverages 12, packaged 720. Estimate sensibly.
- prep_minutes: realistic single-batch prep time.
- currency: infer from the location/cuisine (SGD, MYR, IDR, PHP, THB, JPY, VND, INR, KRW...).
- Be conservative and realistic. Do not invent items that are not implied.`;

  parts.push({ text: `${instr}\n\nVENDOR INPUT:\n${rawText || "(no text provided — derive from the image)"}` });
  if (imageData) {
    parts.push({ inline_data: { mime_type: imageData.mime, data: imageData.base64 } });
  }

  return generateStructured(MODELS.main, systemFor("Menu Normalizer"), parts, MENU_SCHEMA, { temperature: 0.2 });
}

// ---------------------------------------------------------------------------
// Agent 2 — Demand Forecaster (live Google Search grounding)
// ---------------------------------------------------------------------------
const FORECAST_SCHEMA = {
  type: "OBJECT",
  properties: {
    location_used: { type: "STRING" },
    day_type: { type: "STRING", enum: ["weekday", "weekend", "public_holiday", "event_day"] },
    weather_summary: { type: "STRING" },
    event_summary: { type: "STRING" },
    footfall_index: { type: "NUMBER", description: "1.0 = a normal day for this stall" },
    per_item_demand: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          expected_units: { type: "NUMBER" },
          confidence: { type: "STRING", enum: ["low", "medium", "high"] },
          reason: { type: "STRING" },
        },
        required: ["name", "expected_units", "confidence", "reason"],
      },
    },
    grounding_notes: { type: "STRING" },
  },
  required: ["location_used", "day_type", "footfall_index", "per_item_demand"],
};

export async function runForecaster(menu, location, dateStr, pastNotes) {
  const menuList = menu.items
    .map((i) => `- ${i.name} (${i.category}, ${menu.currency} ${i.price})`)
    .join("\n");

  const grounded = await generateGrounded(
    MODELS.main,
    systemFor("Demand Forecaster"),
    `Ground your reasoning in LIVE information via Google Search where possible.
Vendor location: ${location}
Selling date: ${dateStr}
Recent past notes from the vendor (use these as the base rate): ${pastNotes || "none"}

Menu:
${menuList}

Task: Estimate today's realistic per-item demand (units) for a single-day street/market stall.
1) Use Search to check: today's weather for the location, any nearby event, festival, holiday or market day, and the weekday pattern.
2) Set footfall_index (1.0 = normal). Weather (rain/heat/cold) and events move it.
3) For each menu item give expected_units, a confidence level, and a one-line reason tied to weather/event/category.
Return ONLY the structured JSON described. Keep grounding_notes a short plain-language summary of what live sources said.`,
    { grounding: true, temperature: 0.3 }
  );

  // Grounded mode can't force JSON schema, so parse defensively.
  let parsed;
  try {
    parsed = JSON.parse(grounded.text.trim());
  } catch {
    const s = grounded.text.indexOf("{");
    const e = grounded.text.lastIndexOf("}");
    parsed = JSON.parse(grounded.text.slice(s, e + 1));
  }
  parsed.sources = grounded.sources || [];
  return parsed;
}

// ---------------------------------------------------------------------------
// Agent 3 — Prep Planner
// ---------------------------------------------------------------------------
const PLAN_SCHEMA = {
  type: "OBJECT",
  properties: {
    prep_plan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          prep_units: { type: "NUMBER" },
          expected_sold: { type: "NUMBER" },
          expected_surplus: { type: "NUMBER" },
          revenue_localized: { type: "NUMBER" },
          cost_localized: { type: "NUMBER" },
          note: { type: "STRING" },
        },
        required: ["name", "prep_units", "expected_sold", "expected_surplus"],
      },
    },
    totals: {
      type: "OBJECT",
      properties: {
        total_prep_units: { type: "NUMBER" },
        total_expected_revenue: { type: "NUMBER" },
        total_expected_surplus_units: { type: "NUMBER" },
        surplus_value: { type: "NUMBER" },
      },
      required: ["total_prep_units", "total_expected_revenue", "total_expected_surplus_units"],
    },
    safety_note: { type: "STRING" },
  },
  required: ["prep_plan", "totals"],
};

export async function runPlanner(menu, forecast) {
  const fcList = (forecast.per_item_demand || [])
    .map((d) => `- ${d.name}: ${d.expected_units} units (${d.confidence}) — ${d.reason}`)
    .join("\n");

  const menuCosts = menu.items
    .map((i) => `- ${i.name}: price ${i.price}, est unit_cost ${i.unit_cost ?? Math.round(i.price * 0.4)}`)
    .join("\n");

  const sys = `${systemFor("Prep Planner")}
Rules:
- prep_units = ceil(expected_units * small_buffer) where buffer is 1.05-1.15 for high-confidence items and 1.02-1.08 for low-confidence. Never massively over-prep — the whole point is minimizing waste.
- expected_surplus = max(0, prep_units - expected_sold).
- revenue = expected_sold * price. cost = prep_units * unit_cost.
- safety_note: one line on food-safety buffer vs. waste tradeoff.`;

  return generateStructured(
    MODELS.main,
    sys,
    [{ text: `Menu costs:\n${menuCosts}\n\nForecaster output (per-item demand):\n${fcList}\n\nCurrency: ${menu.currency}` }],
    PLAN_SCHEMA,
    { temperature: 0.3 }
  );
}

// ---------------------------------------------------------------------------
// Agent 4 — Waste-to-Value Advisor
// ---------------------------------------------------------------------------
const WASTE_SCHEMA = {
  type: "OBJECT",
  properties: {
    surplus_items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          surplus_units: { type: "NUMBER" },
          action: { type: "STRING", enum: ["donate", "discount", "repurpose", "compost", "discard"] },
          detail: { type: "STRING" },
          value_recovered: { type: "NUMBER" },
        },
        required: ["name", "surplus_units", "action", "detail"],
      },
    },
    total_value_recovered: { type: "NUMBER" },
    diversion_rate_pct: { type: "NUMBER", description: "%% of surplus kept out of trash" },
    compliance_note: { type: "STRING" },
  },
  required: ["surplus_items", "diversion_rate_pct"],
};

export async function runWasteAdvisor(menu, plan) {
  const surplus = (plan.prep_plan || [])
    .filter((p) => (p.expected_surplus || 0) > 0)
    .map((p) => `- ${p.name}: ${p.expected_surplus} units leftover`)
    .join("\n");

  const sys = `${systemFor("Waste-to-Value Advisor")}
For each surplus item, choose the single best action and give a concrete, locally realistic detail:
- donate: name a real type of channel (food bank, shelter, religious org, community fridge) appropriate to JAPAC.
- discount: e.g. "20% off after 7pm" with an estimated recovered value.
- repurpose: turn it into a different dish/drink tomorrow.
- compost / discard: last resort.
compliance_note: one line on JAPAC food-donation safety (e.g. Singapore Food Bank / "consumed-on-the-day" norms) and hot-holding rules.`;

  return generateStructured(
    MODELS.main,
    sys,
    [{ text: `Currency: ${menu.currency}\nMenu (for repurposing ideas): ${menu.items.map((i) => i.name).join(", ")}\n\nPredicted surplus:\n${surplus || "none — great, demand matched prep"}` }],
    WASTE_SCHEMA,
    { temperature: 0.4 }
  );
}

// ---------------------------------------------------------------------------
// Agent 5 — Owner Briefing (plain language, no jargon)
// ---------------------------------------------------------------------------
const BRIEF_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    do_this_morning: { type: "ARRAY", items: { type: "STRING" } },
    watch_out_for: { type: "ARRAY", items: { type: "STRING" } },
    one_line_summary: { type: "STRING" },
  },
  required: ["headline", "do_this_morning", "watch_out_for", "one_line_summary"],
};

export async function runBrief(menu, forecast, plan, waste, currency) {
  const sys = `${systemFor("Owner Briefing")}
Write for a busy hawker/market vendor at 6am — plain language, no data-science jargon, short sentences.
- headline: one punchy sentence about today.
- do_this_morning: 3-5 concrete actions (prep X, bring Y, discount Z at 7pm).
- watch_out_for: 2-4 risks (rain at 1pm, surplus of X, event ending early).
- one_line_summary: the single most important thing to remember.
Keep every number in ${currency}.`;

  return generateStructured(
    MODELS.main,
    sys,
    [{ text: JSON.stringify({ forecast, plan, waste }, null, 1) }],
    BRIEF_SCHEMA,
    { temperature: 0.6 }
  );
}

function systemFor(role) {
  return `You are the ${role} agent inside "Waffle", an agentic AI system that helps JAPAC street-food and market vendors prepare the right amount of food, cut waste, and earn more. You are one specialist step in a multi-agent pipeline. Be concrete, realistic and conservative. Never fabricate live facts you were not given or that grounding did not surface — say "unknown" instead.`;
}
