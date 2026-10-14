// StallSense — Google Gemini API client (free tier, browser-side)
// Uses the generateContent REST endpoint with structured JSON output and
// optional Google Search grounding. No backend required.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Free-tier models (no billing / no credit card). gemini-3.8-flash is the
// newest free Flash model; flash-lite is a fast fallback.
export const MODELS = {
  main: "gemini-3.8-flash",
  lite: "gemini-3.5-flash-lite",
};

let API_KEY = "";

export function setApiKey(key) {
  API_KEY = (key || "").trim();
}

export function hasApiKey() {
  return API_KEY.length > 0;
}

async function callGenerate(model, body, useGrounding = false) {
  if (!hasApiKey()) {
    throw new Error("NO_KEY");
  }

  const url = `${GEMINI_BASE}/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message || JSON.stringify(err);
    } catch {
      detail = await res.text();
    }
    if (res.status === 429) {
      throw new Error(
        "RATE_LIMIT:Hit the Gemini free-tier rate limit. Wait ~60s and retry."
      );
    }
    throw new Error(`Gemini API ${res.status}: ${detail}`);
  }

  return res.json();
}

function extractText(json) {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("");
}

// Parse JSON robustly — strips markdown fences and finds the outer object.
function parseJson(text) {
  if (!text) throw new Error("Empty model response");
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Could not parse model JSON");
  }
}

/**
 * Generate a structured object guided by a JSON schema.
 * @param {string} model - model id
 * @param {string} system - system instruction
 * @param {object} contents - { parts: [...] } or plain parts array
 * @param {object} schema - responseSchema
 * @param {object} opts - { temperature, thinking }
 */
export async function generateStructured(model, system, parts, schema, opts = {}) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };

  const json = await callGenerate(model, body);
  const text = extractText(json);
  return parseJson(text);
}

/**
 * Generate free-form text with optional Google Search grounding.
 * Grounding returns groundingMetadata we surface for transparency.
 */
export async function generateGrounded(model, system, userText, opts = {}) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: opts.temperature ?? 0.3 },
  };
  if (opts.grounding) {
    body.tools = [{ googleSearch: {} }];
  }

  const json = await callGenerate(model, body);
  const text = extractText(json);
  const chunks =
    json?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .map((c) => c?.web)
    .filter(Boolean)
    .map((w) => ({ title: w.title || "Source", uri: w.uri }));

  return { text, sources };
}
