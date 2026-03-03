const MYMEMORY_API = "https://api.mymemory.translated.net/get";

export interface TranslationResult {
  translatedText: string;
  detectedLang?: string;
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult> {
  const isAutoDetect = sourceLang === "auto";

  let detectedLang: string | undefined;
  let effectiveSourceLang = sourceLang;

  if (isAutoDetect) {
    // Step 1: detect language via auto-detect to English
    const detectUrl = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=autodetect|en`;
    const detectRes = await fetch(detectUrl);
    if (!detectRes.ok) throw new Error("Language detection failed");
    const detectData = await detectRes.json();
    detectedLang =
      detectData.responseData?.detectedLanguage ||
      detectData.matches?.[0]?.properties?.["detected-language"] ||
      "en";
    effectiveSourceLang = detectedLang ?? "en";
  }

  // If source and target are the same after detection, return original
  if (effectiveSourceLang === targetLang) {
    return { translatedText: text, detectedLang };
  }

  const langpair = `${effectiveSourceLang}|${targetLang}`;
  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langpair}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation request failed");
  const data = await res.json();

  const translated: string = data.responseData?.translatedText;
  if (!translated) throw new Error("No translation returned");

  // MyMemory sometimes returns "QUERY LENGTH LIMIT EXCEEDED"
  if (translated.toUpperCase().includes("QUERY LENGTH LIMIT")) {
    throw new Error("Text is too long. Please shorten the input.");
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
