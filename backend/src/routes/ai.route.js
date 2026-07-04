import { Router } from "express";
import axios from "axios";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

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

const userLastCall = new Map();

const isRateLimited = (userId, action, limitMs) => {
  const key = `${userId}-${action}`;
  const last = userLastCall.get(key) || 0;
  const now = Date.now();
  if (now - last < limitMs) return true;
  userLastCall.set(key, now);
  return false;
};

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

const isGoodSummary = (s = "") => {
  if (!s || typeof s !== "string") return false;
  if (s.trim().length < 40) return false;
  if (!/[.!?]/.test(s)) return false;
  if (s.trim().startsWith("{")) return false;
  if (/\bundefined\b/i.test(s)) return false;
  return true;
};

const isWeakGreeting = (text = "") =>
  ["hi", "hii", "hiii", "hello", "hey", "heyy", "sup", "wassup"].includes(
    text.trim().toLowerCase()
  );

const containsHallucinatedTopic = (summary = "", messages = []) => {
  const summaryText = summary.toLowerCase();
  const chatText = messages
    .map((m) => (m.text || "").toLowerCase())
    .join(" ");

  const riskyTopics = [
    "dinner",
    "lunch",
    "breakfast",
    "food",
    "trip",
    "movie",
    "coffee",
    "date",
    "restaurant",
  ];

  return riskyTopics.some(
    (word) => summaryText.includes(word) && !chatText.includes(word)
  );
};

const buildFallbackSummary = (messages = []) => {
  const otherName =
    messages.find((m) => m.senderName && m.senderName !== "You")?.senderName ||
    "them";

  const textMessages = messages.filter(
    (m) => m.text && m.text.trim() && !isWeakGreeting(m.text)
  );

  if (textMessages.length === 0) {
    return `You and ${otherName} just said hey to each other and the chat is only just getting started.`;
  }

  const joinedText = textMessages.map((m) => m.text.toLowerCase()).join(" ");

  const mentionsVacation = /\b(summer|vacation)\b/.test(joinedText);
  const mentionsSemester = /\b(semester|study|studies|attendance|books?)\b/.test(
    joinedText
  );
  const mentionsAttendance = /\battendance\b/.test(joinedText);
  const mentionsBooks = /\bbooks?\b/.test(joinedText);
  const upbeatEnding = /\b(ready|hyped|excited|yaaas|yay|pumped)\b/.test(
    joinedText
  );

  const topicParts = [];

  if (mentionsVacation && mentionsSemester) {
    topicParts.push(
      `You and ${otherName} talked about summer vacation ending and the new semester starting.`
    );
  } else if (mentionsSemester) {
    topicParts.push(
      `You and ${otherName} talked about the new semester and what is coming with it.`
    );
  } else if (mentionsVacation) {
    topicParts.push(
      `You and ${otherName} talked about summer vacation ending and what comes next.`
    );
  }

  if (mentionsAttendance && mentionsBooks) {
    topicParts.push(
      `You both also mentioned studies, attendance, and new books as part of what is ahead.`
    );
  } else if (mentionsAttendance) {
    topicParts.push(
      `You both also mentioned studies and attendance as part of what is ahead.`
    );
  } else if (mentionsBooks) {
    topicParts.push(
      `You both also mentioned new books as part of what is ahead.`
    );
  }

  if (upbeatEnding) {
    topicParts.push(
      `By the end, the mood turned positive and you both sounded ready for it.`
    );
  }

  if (topicParts.length >= 2) {
    return topicParts.slice(0, 3).join(" ");
  }

  const first = textMessages[0];
  const second = textMessages.find((m) => m.senderName !== first.senderName);
  const last = textMessages[textMessages.length - 1];
  const firstWho = first.senderName === "You" ? "You" : otherName;

  if (!second) {
    const other = first.senderName === "You" ? otherName : "you";
    return `${firstWho} opened up with "${first.text}" but ${other} has not responded yet. The chat is waiting on the next message.`;
  }

  const secondWho = second.senderName === "You" ? "you" : otherName;
  return `${firstWho} started things with "${first.text}" and ${secondWho} replied with "${second.text}". Right now the chat has landed on "${last.text}".`;
};

const fallbackSuggestions = (msg = "") => {
  const text = msg.toLowerCase();

  if (/^(hi|hello|hey|sup)\b/.test(text)) {
    return ["hey, what's up?", "omg finally lol", "ayy what's good!"];
  }

  if (
    text.includes("dinner") ||
    text.includes("lunch") ||
    text.includes("food")
  ) {
    return ["yes omg when?", "what are we eating?", "let's gooo!"];
  }

  if (text.includes("trip") || text.includes("plan")) {
    return ["sounds so fun!", "okay I'm in!", "when are we going?"];
  }

  if (text.includes("?")) {
    return [
      "honestly yeah lol",
      "wait fr? tell me more",
      "I was thinking the same",
    ];
  }

  return ["no way really?", "okay that's wild", "go on..."];
};

const normalizeSuggestions = (parsedOrRaw, lastMessage) => {
  let suggestions = [];

  if (Array.isArray(parsedOrRaw)) {
    suggestions = parsedOrRaw;
  } else if (
    parsedOrRaw?.suggestions &&
    Array.isArray(parsedOrRaw.suggestions)
  ) {
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

const callGroq = async ({
  prompt,
  temperature = 0.8,
  maxOutputTokens = 400,
}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing in .env");

  console.log("[AI] Trying Groq...");
  const startTime = Date.now();

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
  const timeTaken = Date.now() - startTime;

  if (!text.trim()) {
    console.log("[AI] Groq returned empty response");
    throw new Error("Empty response from Groq");
  }

  console.log(`[AI] Groq success (${timeTaken}ms)`);
  return text.trim();
};

const callGemini = async ({
  prompt,
  temperature = 0.8,
  maxOutputTokens = 400,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

  const GEMINI_MODELS = [
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent",
  ];

  let lastError = null;

  for (const url of GEMINI_MODELS) {
    const modelName = url.split("/models/")[1]?.split(":")[0] || "unknown";
    console.log(`[AI] Trying Gemini model: ${modelName}...`);
    const startTime = Date.now();

    try {
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

      const timeTaken = Date.now() - startTime;

      if (text.trim()) {
        console.log(`[AI] Gemini ${modelName} success (${timeTaken}ms)`);
        return text.trim();
      }

      console.log(`[AI] Gemini ${modelName} returned empty response`);
    } catch (err) {
      const timeTaken = Date.now() - startTime;
      console.log(`[AI] Gemini ${modelName} failed (${timeTaken}ms): ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
};

const callAI = async (options) => {
  try {
    return await callGroq(options);
  } catch (groqError) {
    console.log(`[AI] Groq failed: ${groqError.message}, falling back to Gemini`);
    try {
      return await callGemini(options);
    } catch (geminiError) {
      console.log(`[AI] Gemini also failed: ${geminiError.message}`);
      throw geminiError;
    }
  }
};

router.post(
  "/suggestions",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { lastMessage, senderName, contextMessages = [] } = req.body;

    if (!lastMessage || !lastMessage.trim()) {
      throw new ApiError(400, "No message provided");
    }

    console.log(`\n[Suggestions] Request for: "${lastMessage.substring(0, 50)}..."`);

    if (isRateLimited(req.user._id.toString(), "suggestions", 4000)) {
      const cached = getCached(`sug-${lastMessage.trim().toLowerCase()}`);

      if (cached) {
        console.log("[Suggestions] Rate limited, returning cached");
        return res
          .status(200)
          .json(new ApiResponse(200, { suggestions: cached }, "Cached"));
      }

      console.log("[Suggestions] Rate limited, returning fallback");
      return res.status(200).json(
        new ApiResponse(
          200,
          { suggestions: fallbackSuggestions(lastMessage) },
          "Rate limited"
        )
      );
    }

    const cacheKey = `sug-${lastMessage.trim().toLowerCase()}`;
    const cached = getCached(cacheKey);

    if (cached) {
      console.log("[Suggestions] Returning cached result");
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
- Must be specific to what is being discussed
- Casual natural texting style
- Under 12 words each
- Never use: "Sure" "Sounds good" "Okay" "Tell me more"

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

      console.log(`[Suggestions] Final result:`, suggestions);

      setCache(cacheKey, suggestions);

      return res
        .status(200)
        .json(new ApiResponse(200, { suggestions }, "Suggestions generated"));
    } catch (err) {
      console.log(`[Suggestions] All AI failed, using fallback: ${err.message}`);
      const fb = fallbackSuggestions(lastMessage);
      console.log(`[Suggestions] Fallback result:`, fb);
      return res.status(200).json(
        new ApiResponse(
          200,
          { suggestions: fb },
          "Fallback"
        )
      );
    }
  })
);

router.post(
  "/summarize",
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ApiError(400, "No messages provided");
    }

    console.log(`\n[Summary] Request with ${messages.length} messages`);

    if (isRateLimited(req.user._id.toString(), "summarize", 10000)) {
      console.log("[Summary] Rate limited, using fallback builder");
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
        if (m.messageType === "image") {
          return `${m.senderName}: [shared an image]`;
        }
        const text = (m.text || "").trim();
        if (!text) return null;
        return `${m.senderName}: ${text}`;
      })
      .filter(Boolean)
      .join("\n");

    if (!conversationText.trim()) {
      throw new ApiError(400, "No text content to summarize");
    }

    console.log(`[Summary] Chat with: ${otherName}, greeting only: ${isGreetingOnly}`);

    const prompt = isGreetingOnly
      ? `Write ONE casual warm sentence about "You" and "${otherName}" who just exchanged greetings.
Use only what is directly present in the chat.
Return ONLY: {"summary": "one sentence here"}`
      : `Summarize this chat between "You" and "${otherName}" using ONLY details that appear in the messages.

Chat:
${conversationText}

Rules:
- Write exactly 2 or 3 complete sentences
- Stay grounded in the actual messages
- Do not invent topics, plans, events, or emotions that are not clearly in the chat
- If summer vacation, semester, studies, attendance, or books are mentioned, include them naturally
- Keep it casual and natural, not dramatic
- End with where the chat currently stands
- Never use the word "undefined"
- Never say "the conversation"
- Never mention AI

Return ONLY this JSON:
{"summary": "your grounded summary here"}`;

    try {
      const raw = await callAI({
        prompt,
        temperature: isGreetingOnly ? 0.5 : 0.65,
        maxOutputTokens: isGreetingOnly ? 120 : 250,
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

      if (
        !isGoodSummary(summary) ||
        containsHallucinatedTopic(summary, messages)
      ) {
        console.log("[Summary] AI summary was bad or hallucinated, using fallback");
        summary = buildFallbackSummary(messages);
        console.log(`[Summary] Fallback result: "${summary.substring(0, 80)}..."`);
      } else {
        console.log(`[Summary] AI result: "${summary.substring(0, 80)}..."`);
      }

      return res
        .status(200)
        .json(new ApiResponse(200, { summary }, "Summary generated"));
    } catch (err) {
      console.log(`[Summary] All AI failed, using fallback: ${err.message}`);
      const fb = buildFallbackSummary(messages);
      console.log(`[Summary] Fallback result: "${fb.substring(0, 80)}..."`);
      return res.status(200).json(
        new ApiResponse(
          200,
          { summary: fb },
          "Fallback"
        )
      );
    }
  })
);

export default router;