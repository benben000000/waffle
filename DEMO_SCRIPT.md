# StallSense — 3-Minute Demo Script

**Goal:** show a judge, in under 3 minutes, a *working agentic system* solving a real JAPAC problem. No fluff.

---

## 0:00–0:25 — Hook + problem (voiceover, screen shows the landing page)

> "This is a hawker stall in Singapore. Across Asia-Pacific, millions of street-food vendors prep food every morning on a guess. When it rains, or footfall is slow, that food gets thrown away — money lost twice, once in ingredients and once in labour. Existing AI-for-good projects target consumers. Almost nobody builds forecasting for the micro-vendor. So we built StallSense."

**On screen:** the StallSense landing page, cursor hovering over the empty state.

---

## 0:25–0:50 — The input (one click)

> "The vendor pastes their menu — or just snaps a photo of their handwritten board — picks a location and a date, and adds a note from yesterday."

**On screen:** click **"use example"** (menu fills: Chicken Rice, Char Kway Teow, Laksa, Kopi, Milo). Location = Maxwell Food Centre, Singapore. Note = "rained around 1pm, laksa sold out by 2pm, 8 leftover chicken rice."

> "One button."

---

## 0:50–1:50 — The agents run (this is the money shot)

> "Watch the agent trace. Five specialized Gemini agents, in sequence."

**On screen:** the 5 trace cards light up one by one —

> "First, the **Menu Normalizer** reads the messy input — including a photo — into a clean structured menu with prices, costs and shelf-life.
> Second, the **Demand Forecaster** — and this one is *grounded in live Google Search* — it checks today's actual weather and any local event to set a footfall index. (point at the footfall × value)
> Third, the **Prep Planner** turns that forecast into exact per-item prep quantities, with a small confidence-based buffer so we don't over-prep.
> Fourth, the **Waste-to-Value Advisor** takes any predicted surplus and decides: donate, discount, repurpose, or compost.
> Fifth, the **Owner Briefing** writes it all in plain language a vendor can read at 6am."

---

## 1:50–2:35 — The output (the payoff)

> "Here's the morning brief."

**On screen:** scroll through the output —

> "A headline for today. A 'do this morning' checklist — prep these quantities, discount laksa at 7pm. A 'watch out for' list — rain at 1pm, chicken rice surplus. Then the exact prep plan per item — how many to prep, how many we expect to sell, and the surplus. And the best part: surplus *value* — every leftover gets an action, so it's donated or repurposed instead of binned. Point at the diversion rate."

**Highlight the 4 summary stats:** expected revenue, surplus units, % diverted, value recovered.

---

## 2:35–3:00 — Why it matters + close

> "This is a real, underserved JAPAC community with the highest waste-to-revenue ratio and almost no technology. StallSense turns one photo into less waste, more income, and more food donated instead of dumped. It runs on Gemini's free tier with live grounding, deployed free on Firebase. Built for Sustainability & Social Impact, Google Cloud AI Builder Cup 2026."

**On screen:** the live-grounding sources line, then the footer badge.

---

## Recording tips

- **Record the browser window**, not the whole desktop. Zoom to 110–125% so text is legible.
- **Pre-warm the pipeline once** before recording so the first run isn't slow.
- If a run is slow, **record the trace animating** — the sequential agent light-up is the most convincing part.
- Narrate calmly; **point at numbers** with the cursor.
- Upload to YouTube (unlisted is fine) or Vimeo; put the link in the deck + repo.
