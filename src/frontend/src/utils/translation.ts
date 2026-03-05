const MYMEMORY_API = "https://api.mymemory.translated.net/get";

export interface TranslationResult {
  translatedText: string;
  detectedLang?: string;
}

// MyMemory uses simple 2-letter codes; normalize complex codes
function normalizeForMyMemory(code: string): string {
  if (!code || code === "auto") return "en";
  // zh-CN -> zh, zh-TW -> zh-TW (MyMemory accepts zh-CN and zh-TW)
  return code;
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult> {
  const isAutoDetect = sourceLang === "auto";

  let detectedLang: string | undefined;
  let effectiveSourceLang = normalizeForMyMemory(sourceLang);
  const normalizedTarget = normalizeForMyMemory(targetLang);

  if (isAutoDetect) {
    // Use MyMemory with en as a dummy target to detect the language
    const detectUrl = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|fr`;
    try {
      const detectRes = await fetch(detectUrl);
      if (detectRes.ok) {
        const detectData = await detectRes.json();
        // Try multiple fields where MyMemory might put detected language
        const detected =
          detectData.responseData?.detectedLanguage ||
          detectData.matches?.[0]?.de ||
          null;
        if (detected && detected !== "null" && detected.length > 0) {
          detectedLang = detected;
          effectiveSourceLang = detected;
        } else {
          // Fallback: assume English if detection fails
          effectiveSourceLang = "en";
        }
      }
    } catch {
      effectiveSourceLang = "en";
    }
  }

  // If source and target are the same after detection, return original
  if (effectiveSourceLang === normalizedTarget) {
    return { translatedText: text, detectedLang };
  }

  const langpair = `${effectiveSourceLang}|${normalizedTarget}`;
  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  if (!res.ok)
    throw new Error(`Translation request failed (HTTP ${res.status})`);

  const data = await res.json();

  // MyMemory returns responseStatus 200 on success, 429 on quota exceeded
  if (data.responseStatus && data.responseStatus === 429) {
    throw new Error(
      "Translation quota exceeded. Please wait a moment and try again.",
    );
  }

  const translated: string = data.responseData?.translatedText;
  if (!translated)
    throw new Error("No translation returned. Please try again.");

  // MyMemory sometimes returns error strings in the translated field
  const upperTranslated = translated.toUpperCase();
  if (upperTranslated.includes("QUERY LENGTH LIMIT")) {
    throw new Error("Text is too long. Please shorten the input.");
  }
  if (upperTranslated.includes("INVALID LANGUAGE PAIR")) {
    throw new Error(
      "This language pair is not supported. Please try a different combination.",
    );
  }
  if (upperTranslated.includes("MYMEMORY WARNING")) {
    throw new Error(
      "Translation service limit reached. Please try again later.",
    );
  }

  return {
    translatedText: translated,
    detectedLang: detectedLang ?? effectiveSourceLang,
  };
}

export function formatTimestamp(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  const date = new Date(ms);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
