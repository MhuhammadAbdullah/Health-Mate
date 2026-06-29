/**
 * AI Service — HealthMate v3
 *
 * Supported providers (set AI_PROVIDER in .env):
 *   gemini   → Google Gemini 1.5 Flash (FREE - RECOMMENDED)
 *   groq     → Groq Llama 3.1 70B     (FREE - very fast)
 *   anthropic→ Claude claude-sonnet-4-6          (Paid)
 *   openai   → GPT-4o                 (Paid)
 *
 * FREE API Keys:
 *   Gemini : https://aistudio.google.com/app/apikey  (free, no card needed)
 *   Groq   : https://console.groq.com                (free, no card needed)
 */

const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();

// ── Startup log ──────────────────────────────────────────────────────────────
console.log(`🤖 AI Provider: ${PROVIDER.toUpperCase()}`);

// ════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ════════════════════════════════════════════════════════════════════════════
function reportPrompt(title, reportType, description) {
  return `You are a medical AI assistant helping Pakistani patients understand their reports.

Analyze this medical report and respond ONLY as valid JSON with NO markdown, NO code fences, NO extra text.

Required JSON keys:
{
  "summary": "3-5 sentence plain English summary of findings",
  "abnormalValues": "list any abnormal values with significance, or write None detected",
  "normalValues": "key values within normal range",
  "healthInsights": "what these results mean for the patient health",
  "dietAdvice": "specific foods to eat or avoid",
  "homeRemedies": "safe evidence-based home care tips",
  "doctorQuestions": "1. question one 2. question two 3. question three (3-5 questions)",
  "urgency": "LOW or MEDIUM or HIGH",
  "romanUrduSummary": "2-3 sentence summary in Roman Urdu e.g. Aapka hemoglobin normal se kam hai"
}

Report type: ${reportType}
Report title: ${title}
${description ? `Context: ${description}` : "No extra context provided."}`;
}

function vitalsPrompt(vitals) {
  return `You are a medical AI assistant. Analyze these patient vitals.

Vitals: ${JSON.stringify(vitals)}

Respond ONLY as valid JSON with NO markdown, NO code fences, NO extra text.

Required JSON keys:
{
  "overallStatus": "good or concerning or critical",
  "summary": "2-3 sentence plain English summary",
  "romanUrduSummary": "same in Roman Urdu e.g. Aapka blood pressure thoda zyada hai",
  "abnormalFindings": ["concerning value 1", "concerning value 2"],
  "dietAdvice": ["diet tip 1", "diet tip 2", "diet tip 3"],
  "lifestyleAdvice": ["lifestyle tip 1", "lifestyle tip 2"],
  "urgency": "LOW or MEDIUM or HIGH",
  "specialistRecommended": "Cardiologist or Endocrinologist or None etc",
  "doctorQuestions": ["question 1", "question 2", "question 3"]
}`;
}

// ── Safe JSON parse (strips markdown fences if present) ───────────────────────
// function safeParseJSON(text) {
//   if (!text) return null;
//   const clean = text.trim()
//     .replace(/^```json\s*/i, "")
//     .replace(/^```\s*/i, "")
//     .replace(/```\s*$/i, "")
//     .trim();
//   return JSON.parse(clean);
// }



// function safeParseJSON(text) {
//   if (!text) return null;

//   try {
//     const clean = text
//       .trim()
//       .replace(/^```json\s*/i, "")
//       .replace(/^```\s*/i, "")
//       .replace(/```\s*$/i, "")
//       .trim();

//     return JSON.parse(clean);
//   } catch (err) {
//     console.error("❌ JSON Parse Failed");
//     console.error("Raw Gemini Response:");
//     console.error(text);

//     return {
//       error: true,
//       rawResponse: text,
//     };
//   }
// }





function safeParseJSON(text) {
  if (!text) return null;

  try {
    const clean = text
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ JSON BROKEN - returning raw");
    return {
      error: true,
      raw: text
    };
  }
}



// ════════════════════════════════════════════════════════════════════════════
// GEMINI  (Google — FREE)
// Get key: https://aistudio.google.com/app/apikey
// ════════════════════════════════════════════════════════════════════════════
async function callGemini(prompt, imageUrl, fileType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing in .env — get free key at https://aistudio.google.com/app/apikey");
  }

  const axios = require("axios");
  const MODEL = "gemini-2.5-flash";   // stable + fast; gemini-2.5-flash is a thinking model that exceeds 30s
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const parts = [];

  // Attach image inline if available
  if (imageUrl && fileType === "image") {
    try {
      const imgResp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 12000 });
      const b64 = Buffer.from(imgResp.data).toString("base64");
      const mime = imgResp.headers["content-type"] || "image/jpeg";
      parts.push({ inline_data: { mime_type: mime, data: b64 } });
    } catch (e) {
      console.warn("Gemini: could not fetch image, text-only mode:", e.message);
    }
  }

  parts.push({ text: prompt });

  // const body = {
  //   contents: [{ parts }],
  //   generationConfig: {
  //     temperature: 0.3,
  //     maxOutputTokens: 1500,
  //   },
  // };
  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
    },
  };

  const resp = await axios.post(URL, body, {
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  });

  const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("RAW GEMINI RESPONSE:", text?.slice(0, 200));

  if (!text) throw new Error("Gemini returned empty response");
  return safeParseJSON(text);
}

// ════════════════════════════════════════════════════════════════════════════
// GROQ  (Llama 3.1 70B — FREE, very fast)
// Get key: https://console.groq.com
// ════════════════════════════════════════════════════════════════════════════
// async function callGroq(prompt) {
//   if (!process.env.GROQ_API_KEY) {
//     throw new Error("GROQ_API_KEY missing in .env — get free key at https://console.groq.com");
//   }

//   const axios = require("axios");

//   const resp = await axios.post(
//     "https://api.groq.com/openai/v1/chat/completions",
//     {
//       model:       "llama-3.1-70b-versatile",   // free & powerful
//       messages:    [{ role: "user", content: prompt }],
//       temperature: 0.3,
//       max_tokens:  1500,
//     },
//     {
//       headers: {
//         Authorization:  `Bearer ${process.env.GROQ_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       timeout: 30000,
//     }
//   );

//   const text = resp.data?.choices?.[0]?.message?.content;
//   if (!text) throw new Error("Groq returned empty response");
//   return safeParseJSON(text);
// }

// ════════════════════════════════════════════════════════════════════════════
// ANTHROPIC  (Claude — Paid)
// ════════════════════════════════════════════════════════════════════════════
// async function callAnthropic(prompt, imageUrl, fileType) {
//   if (!process.env.ANTHROPIC_API_KEY) {
//     throw new Error("ANTHROPIC_API_KEY missing in .env");
//   }
//   const Anthropic = require("@anthropic-ai/sdk");
//   const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//   const content   = [];

//   if (imageUrl && fileType === "image") {
//     try {
//       const axios   = require("axios");
//       const imgResp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 12000 });
//       const b64     = Buffer.from(imgResp.data).toString("base64");
//       const mime    = imgResp.headers["content-type"] || "image/jpeg";
//       const allowed = ["image/jpeg","image/png","image/gif","image/webp"];
//       content.push({ type: "image", source: { type: "base64", media_type: allowed.includes(mime) ? mime : "image/jpeg", data: b64 } });
//     } catch (e) {
//       console.warn("Anthropic: could not attach image:", e.message);
//     }
//   }

//   content.push({ type: "text", text: prompt });

//   const msg = await client.messages.create({
//     model:      "claude-sonnet-4-6",
//     max_tokens: 1500,
//     messages:   [{ role: "user", content }],
//   });

//   return safeParseJSON(msg.content[0].text);
// }

// ════════════════════════════════════════════════════════════════════════════
// OPENAI  (GPT-4o — Paid)
// ════════════════════════════════════════════════════════════════════════════
// async function callOpenAI(prompt, imageUrl, fileType) {
//   if (!process.env.OPENAI_API_KEY) {
//     throw new Error("OPENAI_API_KEY missing in .env");
//   }
//   const OpenAI = require("openai");
//   const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//   const msgContent = [];
//   if (imageUrl && fileType === "image") {
//     msgContent.push({ type: "image_url", image_url: { url: imageUrl } });
//   }
//   msgContent.push({ type: "text", text: prompt });

//   const resp = await client.chat.completions.create({
//     model:           "gpt-4o",
//     messages:        [{ role: "user", content: msgContent }],
//     response_format: { type: "json_object" },
//     max_tokens:      1500,
//   });

//   return JSON.parse(resp.choices[0].message.content);
// }

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════
async function analyzeReport({ imageUrl, fileType, title, reportType, description }) {
  const prompt = reportPrompt(title, reportType, description);
  try {
    switch (PROVIDER) {
      case "gemini": return await callGemini(prompt, imageUrl, fileType);
      // case "groq":      return await callGroq(prompt);   // Groq has no vision yet
      // case "anthropic": return await callAnthropic(prompt, imageUrl, fileType);
      // case "openai":    return await callOpenAI(prompt, imageUrl, fileType);
      default:
        throw new Error(`Unknown AI_PROVIDER: "${PROVIDER}". Use gemini, groq, anthropic, or openai`);
    }
  } catch (err) {
    // console.error(`❌ AI report analysis failed (${PROVIDER}):`, err.message);
    // console.log(JSON.stringify(err.response?.data, null, 2));
    console.error("Gemini Error:");
    console.error("Message:", err.message);
    console.error("Status:", err.response?.status);
    console.error("Response:", JSON.stringify(err.response?.data, null, 2));
    // return null;
    return null;
  }
}

async function analyzeVitals({ vitals }) {
  const prompt = vitalsPrompt(vitals);
  try {
    switch (PROVIDER) {
      case "gemini": return await callGemini(prompt, null, null);
      // case "groq":      return await callGroq(prompt);
      // case "anthropic": return await callAnthropic(prompt, null, null);
      // case "openai":    return await callOpenAI(prompt, null, null);
      default:
        throw new Error(`Unknown AI_PROVIDER: "${PROVIDER}". Use gemini, groq, anthropic, or openai`);
    }
  } catch (err) {
    console.error(`❌ AI vitals analysis failed (${PROVIDER}):`, err.message);
    return null;
  }
}

module.exports = { analyzeReport, analyzeVitals };
