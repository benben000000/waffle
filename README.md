# StallSense — Agentic Prep & Food-Waste Intelligence for JAPAC Hawkers

**Google Cloud AI Builder Cup 2026 · Theme: Sustainability & Social Impact**


A working prototype that helps street-food and market vendors across Asia-Pacific prepare the *right* amount of food each morning, using a visible **5-agent Gemini pipeline** with **live Google Search grounding** — cutting waste, recovering value, and increasing income.

▶ **Live demo:** _[Firebase Hosting URL — add after deploy]_
▶ **Demo video (3 min):** _[YouTube/Vimeo link — add before submit]_
▶ **Repo:** _[GitHub link — add before submit]_

---

## The problem

JAPAC's hawker and market vendors are a **$Bn-scale community** and a cultural backbone of the region — and they over-prep every day because they have no forecast.

- Vendors guess prep quantities by intuition. On a rainy or low-traffic day, cooked food is thrown away.
- Global food waste is ~**1.05Bn tonnes/yr** (UNEP); **households & food service are the largest share.**
- Every unsold plate is money lost twice: the ingredient cost **and** the labour.
- Most vendors have **no tooling at all** — a notebook and a guess.

Existing "AI for good" hacks target consumers. **Nobody is building forecasting agents for the micro-vendor** — the person with the highest waste-to-revenue ratio and the least technology. That gap is the opportunity.

---

## What StallSense does

A vendor pastes their menu (or snaps a photo of their handwritten board), adds location + date, and gets a **personalized morning brief in ~40 seconds**:

1. Expected revenue for the day
2. Exact per-item prep quantities
3. Predicted surplus, and what to *do* with it (donate / discount / repurpose)
4. A plain-language "do this morning" checklist

---

## Why it wins (mapped to the official rubric)

| Rubric (weight) | How StallSense scores |
|---|---|
| **Technical Merit & Gen AI (40%)** | **5 specialized agents** in a sequential pipeline, each a distinct Gemini call with its own structured-output schema. Agent 2 uses **live Google Search grounding** (real weather + local events). Agent 1 is **multimodal** (photo → structured menu). Structured JSON output throughout. |
| **Problem Alignment & Impact (25%)** | Directly attacks food waste + vendor income in a real, underserved JAPAC community. Quantified impact (surplus value recovered, % diverted). |
| **Innovation & Creativity (25%)** | Not a chatbot. A **multi-agent orchestration with a visible trace** and a novel "surplus → value" agent that turns waste into donations/discounts/repurposed dishes. |
| **User Experience (10%)** | Single-screen, 3-click flow. Live agent trace. Polished dashboard. Plain-language output for a non-technical user. |

**Side prizes targeted:** *Best use of Google Cloud AI tools*, *Most Impactful Solution*, *Best UI/UX*.

---

## Google Cloud / AI stack

- **Gemini API (free tier)** — `gemini-3.8-flash` for all 5 agents. No credit card, no billing required.
- **Google Search grounding tool** — Agent 2 grounds its forecast in live weather + events.
- **Structured Outputs** (`responseSchema`) — every agent returns validated JSON.
- **Multimodal input** — Agent 1 accepts a photo of a menu board.
- **Firebase Hosting (Spark plan)** — deployed free, no billing account required.

This is exactly the "agentic systems, not prototype demos" direction judges rewarded at the 2025 Gen AI Exchange finale.

---

## Agent pipeline

```
       ┌──────────────────┐
       │  Vendor input     │  menu text or PHOTO + location + date
       └────────┬─────────┘
                ▼
   ┌────────────────────────┐
   │ 01 Menu Normalizer      │  multimodal → structured menu (items, price, cost, shelf-life)
   └────────┬───────────────┘
            ▼
   ┌────────────────────────┐
   │ 02 Demand Forecaster    │  ★ Google Search grounding: live weather + local events
   └────────┬───────────────┘  → per-item expected units + confidence
            ▼
   ┌────────────────────────┐
   │ 03 Prep Planner         │  → per-item prep qty, expected sold, surplus, revenue
   └────────┬───────────────┘
            ▼
   ┌────────────────────────┐
   │ 04 Waste-to-Value       │  → donate / discount / repurpose / compost per surplus item
   └────────┬───────────────┘
            ▼
   ┌────────────────────────┐
   │ 05 Owner Briefing       │  → plain-language morning brief + checklist
   └────────────────────────┘
```

---

## Run locally

No build step — it's a static site.

```bash
# 1. Get a FREE Gemini API key (no credit card):
#    https://aistudio.google.com/apikey

# 2. Serve the folder
npx serve .        # or: python -m http.server 8080

# 3. Open http://localhost:8080 → click "⚙︎ API key" → paste → Run pipeline
```

---

## Project structure

```
StallSense/
├── index.html          # Single-screen UI
├── css/styles.css      # Dashboard styling
├── js/
│   ├── gemini.js       # Gemini client (structured output + grounding)
│   ├── agents.js       # The 5 agents + schemas
│   └── app.js          # UI orchestration & rendering
├── firebase.json       # Firebase Hosting config
└── README.md
```

---

## Notes on honesty & safety

- Forecasts are **estimates**, clearly labelled, with per-item confidence levels.
- The Waste agent includes a **food-safety / compliance note** (hot-holding, donation rules).
- Live grounding sources are **surfaced in the UI** so nothing is a black box.
- The app is a decision-support tool; the vendor always makes the final call.

---

_Built for the JAPAC community. Sustainability & Social Impact — Google Cloud AI Builder Cup 2026._
