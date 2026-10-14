# StallSense
### Agentic Prep & Food-Waste Intelligence for JAPAC Street-Food Vendors

**Google Cloud AI Builder Cup 2026**
Theme: Sustainability & Social Impact
_Google Cloud · Gemini · Firebase_

---

# The Problem

Street-food hawkers and market vendors are the cultural and economic backbone of Asia-Pacific — and they throw away food every single day.

- Vendors prep by **intuition, not data.** A rainy or slow day means cooked food is binned.
- **~1.05 billion tonnes** of food is wasted globally each year (UNEP). Food service is a top contributor.
- Every unsold plate loses money **twice**: ingredient cost *and* labour.
- This community has **almost no technology** — a notebook and a guess.

**The gap:** existing "AI for good" hacks target consumers. Almost nobody builds forecasting agents for the *micro-vendor*, who has the highest waste-to-revenue ratio and the least tooling.

---

# The Opportunity (why JAPAC, why now)

- **Massive, underserved community** across SG, MY, ID, PH, TH, JP, VN, IN.
- **Regional specificity** — hawker/market culture is uniquely JAPAC; a global template won't fit.
- **Directly measurable impact** — less waste, more income, more food donated instead of dumped.

---

# Our Solution

A vendor pastes their menu (or **snaps a photo of their handwritten board**), adds location + date, and gets a **personalized morning brief in ~40 seconds**:

1. **Expected revenue** for the day
2. **Exact per-item prep quantities** (not a vague "prepare some")
3. **Predicted surplus** — and exactly what to *do* with it (donate / discount / repurpose)
4. A **plain-language checklist** a busy hawker can act on at 6am

---

# How It Works — A 5-Agent Pipeline

```
Menu (text or PHOTO) + location + date
        ↓
01 · Menu Normalizer      → structured menu (multimodal)
02 · Demand Forecaster    → ★ live Google Search: weather + events
03 · Prep Planner         → per-item prep, sold, surplus, revenue
04 · Waste-to-Value       → donate / discount / repurpose per item
05 · Owner Briefing       → plain-language morning brief
```

Each step is a **distinct Gemini agent** with its own role and **structured-output schema**. The agent trace is visible in the UI.

---

# Technical Architecture

```
Browser (static web app)
   │
   ├─ Gemini gemini-3.8-flash  × 5 agents (structured JSON output)
   ├─ Google Search grounding   → Agent 2 (live weather + local events)
   ├─ Multimodal input          → Agent 1 (photo of menu board)
   │
   └─ Deployed on Firebase Hosting (free Spark plan)
```

**Google Cloud AI tools used:** Gemini API (free tier), Google Search grounding tool, Structured Outputs, Multimodal understanding, Firebase Hosting.

---

# Why This Wins

✅ **Real, specific, underserved problem** — not a generic AI assistant
✅ **Genuine agentic system** — 5 specialized agents, visible trace, not a single prompt
✅ **Live grounding** — forecast reflects *today's actual* weather + events
✅ **Quantified impact** — surplus value recovered, % waste diverted
✅ **Demoable in 3 minutes** — one screen, one button, instant result
✅ **Plain-language output** — usable by a non-technical vendor at 6am

---

# Impact & Scalability

**Immediate value**
- Cuts over-prep → less waste, lower cost
- Recovers value from surplus (discounts, donations, repurposed dishes)
- Raises vendor income on thin margins

**Scalability**
- Location-agnostic — works for any JAPAC city
- Extends to: multi-day planning, supplier ordering, shared kitchen co-ops
- Donations channel turns waste into community meals
- Same agent pattern ports to any perishable micro-business

---

# Alignment with Rubric

| Criterion | Weight | Our edge |
|---|---|---|
| Technical Merit & Gen AI | **40%** | 5-agent pipeline + live grounding + multimodal + structured output |
| Problem Alignment & Impact | 25% | Real JAPAC vendor community, quantified waste & income impact |
| Innovation & Creativity | 25% | Novel "surplus → value" agent; visible orchestration |
| User Experience | 10% | Single-screen, 3-click, plain-language briefing |

---

# Team & Links

**Team:** _[Team name]_
**Live demo:** _[Firebase URL]_
**Repo:** _[GitHub URL]_
**Video:** _[YouTube/Vimeo, 3 min]_

_Built on Google Gemini & Firebase — Sustainability & Social Impact, Google Cloud AI Builder Cup 2026._
