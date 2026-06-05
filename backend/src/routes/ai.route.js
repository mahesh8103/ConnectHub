import { Router } from "express";
import axios from "axios";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// ── Cache ─────────────────────────────────────────────────────────────────────
const cache = new Map();

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  if (cache.size > 100) cache.clear();
  cache.set(key, { data, time: Date.now() });
};

// ── Rate limiter ──────────────────────────────────────────────────────────────
const userLastCall = new Map();

const isRateLimited = (userId, action, limitMs) => {
  const key = `${userId}-${action}`;
  const last = userLastCall.get(key) || 0;
  const now = Date.now();
  if (now - last < limitMs) return true;
  userLastCall.set(key, now);
  return false;
};

// ── JSON helpers ──────────────────────────────────────────────────────────────
const extractJsonBlock = (raw = "") => {
  const cleaned = String(raw)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const obj = cleaned.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
  const arr = cleaned.match(/\[[\s\S]*\]/);
  if (arr) return arr[0];
  return cleaned;
};

const safeParseJson = (raw = "") => {
  try {
    return JSON.parse(extractJsonBlock(raw));
  } catch {
    return null;
  }
};

// ── Quality checks ────────────────────────────────────────────────────────────
const isGoodSummary = (s = "") => {
  if (!s || typeof s !== "string") return false;
  if (s.trim().length < 40) return false;
  if (!/[.!?]/.test(s)) return false;
  if (s.trim().startsWith("{")) return false;
  return true;
};

const isWeakGreeting = (text = "") =>
  ["hi", "hii", "hiii", "hello", "hey", "heyy", "sup", "wassup"].includes(
    text.trim().toLowerCase()
  );

// ── Fallbacks ─────────────────────────────────────────────────────────────────
const buildFallbackSummary = (messages = []) => {
  const otherName =
    messages.find((m) => m.senderName && m.senderName !== "You")?.senderName ||
    "them";

  const textMessages = messages.filter(
    (m) => m.text && m.text.trim() && !isWeakGreeting(m.text)
  );

  if (textMessages.length === 0) {
    return `You and ${otherName} just said hey to each other — the convo is just getting started!`;
  }

  const first = textMessages[0];
  const second = textMessages.find((m) => m.senderName !== first.senderName);
  const last = textMessages[textMessages.length - 1];
  const firstWho = first.senderName === "You" ? "You" : otherName;

  if (!second) {
    const other = first.senderName === "You" ? otherName : "you";
    return `${firstWho} opened up with "${first.text}" but ${other} hasn't responded yet. The ball is in ${other}'s court!`;
  }

  const secondWho = second.senderName === "You" ? "you" : otherName;
  return `${firstWho} started things with "${first.text}" and ${secondWho} jumped in with "${second.text}". Right now the chat has landed on "${last.text}".`;
};

const fallbackSuggestions = (msg = "") => {
  const text = msg.toLowerCase();
  if (/^(hi|hello|hey|sup)\b/.test(text))
    return ["hey, what's up?", "omg finally lol", "ayy what's good!"];
  if (text.includes("dinner") || text.includes("lunch") || text.includes("food"))
    return ["yes omg when?", "what are we eating?", "let's gooo!"];
  if (text.includes("trip") || text.includes("plan"))
    return ["sounds so fun!", "okay I'm in!", "when are we going?"];
  if (text.includes("?"))
    return ["honestly yeah lol", "wait fr? tell me more", "I was thinking the same"];
  return ["no way really?", "okay that's wild", "go on..."];
};

const normalizeSuggestions = (parsedOrRaw, lastMessage) => {
  let suggestions = [];

  if (Array.isArray(parsedOrRaw)) {
    suggestions = parsedOrRaw;
  } else if (parsedOrRaw?.suggestions && Array.isArray(parsedOrRaw.suggestions)) {
    suggestions = parsedOrRaw.suggestions;
  } else if (typeof parsedOrRaw === "string") {
    suggestions = parsedOrRaw
      .split("\n")
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  suggestions = suggestions
    .filter((s) => typeof s === "string")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  suggestions = [...new Set(suggestions)].slice(0, 3);

  const fb = fallbackSuggestions(lastMessage);
  let i = 0;
  while (suggestions.length < 3 && i < fb.length) {
    if (!suggestions.includes(fb[i])) suggestions.push(fb[i]);
    i++;
  }

  return suggestions.slice(0, 3);
};

// ── PRIMARY: Groq ─────────────────────────────────────────────────────────────
const callGroq = async ({ prompt, temperature = 0.8, maxOutputTokens = 400 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing in .env");

  console.log("🚀 Calling Groq (primary)...");

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful chat assistant.
You ONLY output valid JSON.
Never add explanation, markdown, or extra text.
Always follow the exact JSON format requested.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxOutputTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new Error("Empty response from Groq");

  console.log("✅ Groq response:", text.trim().slice(0, 200));
  return text.trim();
};

// ── FALLBACK: Gemini ──────────────────────────────────────────────────────────
const callGemini = async ({ prompt, temperature = 0.8, maxOutputTokens = 400 }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

  // Try multiple Gemini models
  const GEMINI_MODELS = [
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent",
  ];

  let lastError = null;

  for (const url of GEMINI_MODELS) {
    try {
      const modelName = url.split("/models/")[1].split(":")[0];
      console.log(`🔄 Trying Gemini: ${modelName}`);

      const response = await axios.post(
        `${url}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const text =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("") || "";

      if (text.trim()) {
        console.log(`✅ Gemini success: ${modelName}`);
        return text.trim();
      }
    } catch (err) {
      console.log(
        `❌ Gemini failed: ${url.split("/models/")[1]?.split(":")[0]} | ${err.response?.status}`
      );
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
};

// ── MASTER: Groq first → Gemini fallback ─────────────────────────────────────
const callAI = async (options) => {
  try {
    return await callGroq(options);
  } catch (groqErr) {
    const status = groqErr.response?.status;
    console.log(`⚠️ Groq failed (${status || groqErr.message}) → switching to Gemini`);

    try {
      return await callGemini(options);
    } catch (geminiErr) {
      console.error("❌ Both Groq and Gemini failed");
      throw geminiErr;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/suggestions
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/suggestions",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { lastMessage, senderName, contextMessages = [] } = req.body;

    console.log("\n📩 Suggestions hit | message:", lastMessage);

    if (!lastMessage || !lastMessage.trim()) {
      throw new ApiError(400, "No message provided");
    }

    // Rate limit
    if (isRateLimited(req.user._id.toString(), "suggestions", 4000)) {
      const cached = getCached(`sug-${lastMessage.trim().toLowerCase()}`);
      if (cached) {
        return res
          .status(200)
          .json(new ApiResponse(200, { suggestions: cached }, "Cached"));
      }
      return res.status(200).json(
        new ApiResponse(
          200,
          { suggestions: fallbackSuggestions(lastMessage) },
          "Rate limited"
        )
      );
    }

    // Cache check
    const cacheKey = `sug-${lastMessage.trim().toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log("💾 Returning cached suggestions");
      return res
        .status(200)
        .json(new ApiResponse(200, { suggestions: cached }, "Cached"));
    }

    const contextText = Array.isArray(contextMessages)
      ? contextMessages
          .map((m) => `${m.senderName}: ${m.text}`)
          .filter(Boolean)
          .join("\n")
      : "";

    const prompt = `You are helping someone reply to a chat message. Give exactly 3 short natural reply suggestions.

Conversation context:
${contextText || "(no prior context)"}

Latest message from ${senderName || "them"}:
"${lastMessage}"

Rules:
- Reply 1: warm and enthusiastic response
- Reply 2: curious follow-up question
- Reply 3: short and direct under 6 words
- Must be SPECIFIC to what is being discussed
- Casual natural texting style
- Under 12 words each
- NEVER use: "Sure" "Sounds good" "Okay" "Tell me more"

Return ONLY this JSON nothing else:
{"suggestions": ["reply 1", "reply 2", "reply 3"]}`;

    try {
      const raw = await callAI({
        prompt,
        temperature: 0.9,
        maxOutputTokens: 200,
      });

      const parsed = safeParseJson(raw);
      const suggestions = normalizeSuggestions(parsed || raw, lastMessage);

      setCache(cacheKey, suggestions);

      console.log("✅ Final suggestions:", suggestions);
      return res
        .status(200)
        .json(new ApiResponse(200, { suggestions }, "Suggestions generated"));
    } catch (err) {
      console.error("❌ All AI failed for suggestions:", err.message);
      return res.status(200).json(
        new ApiResponse(
          200,
          { suggestions: fallbackSuggestions(lastMessage) },
          "Fallback"
        )
      );
    }
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/summarize
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/summarize",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { messages } = req.body;

    console.log("\n📩 Summarize hit | count:", messages?.length);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ApiError(400, "No messages provided");
    }

    // Rate limit
    if (isRateLimited(req.user._id.toString(), "summarize", 10000)) {
      console.log("⏳ Summarize rate limited");
      return res.status(200).json(
        new ApiResponse(
          200,
          { summary: buildFallbackSummary(messages) },
          "Rate limited"
        )
      );
    }

    const otherName =
      messages.find((m) => m.senderName && m.senderName !== "You")
        ?.senderName || "them";

    const isGreetingOnly = messages.every(
      (m) =>
        !m.text?.trim() ||
        isWeakGreeting(m.text) ||
        m.messageType === "image"
    );

    const conversationText = messages
      .map((m) => {
        if (m.messageType === "image") return `${m.senderName}: [shared an image]`;
        const text = (m.text || "").trim();
        if (!text) return null;
        return `${m.senderName}: ${text}`;
      })
      .filter(Boolean)
      .join("\n");

    if (!conversationText.trim()) {
      throw new ApiError(400, "No text content to summarize");
    }

    const prompt = isGreetingOnly
      ? `Write ONE casual warm sentence about "You" and "${otherName}" who just exchanged greetings. Use both names naturally.
Return ONLY: {"summary": "one sentence here"}`
      : `Summarize this chat between "You" and "${otherName}" like a friend retelling what happened.

Chat:
${conversationText}

Rules:
- Write exactly 3 complete sentences
- Use "${otherName}" by name but vary it - sometimes say "you both" or "you two" instead of repeating
- Make it warm casual and story-like not formal
- Mention what was actually discussed - the real topic
- Capture the vibe of the conversation
- End with where the chat currently stands
- NEVER start with "You started the conversation"
- NEVER write "the conversation"
- NEVER repeat "${otherName} and you" in every sentence

Return ONLY this JSON:
{"summary": "your full story-style summary here"}`;

    try {
      const raw = await callAI({
        prompt,
        temperature: isGreetingOnly ? 0.6 : 0.8,
        maxOutputTokens: isGreetingOnly ? 120 : 400,
      });

      const parsed = safeParseJson(raw);
      let summary =
        typeof parsed?.summary === "string"
          ? parsed.summary.trim()
          : String(raw || "")
              .replace(/```json|```/g, "")
              .replace(/\{[\s\S]*?"summary"\s*:\s*"/, "")
              .replace(/"[\s\S]*\}/, "")
              .trim();

      if (!isGoodSummary(summary)) {
        console.log("⚠️ Bad quality summary, using fallback");
        summary = buildFallbackSummary(messages);
      }

      console.log("✅ Final summary:", summary);
      return res
        .status(200)
        .json(new ApiResponse(200, { summary }, "Summary generated"));
    } catch (err) {
      console.error("❌ All AI failed for summarize:", err.message);
      return res.status(200).json(
        new ApiResponse(
          200,
          { summary: buildFallbackSummary(messages) },
          "Fallback"
        )
      );
    }
  })
);

export default router;