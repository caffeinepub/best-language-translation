import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  Copy,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSaveTranslation } from "../hooks/useQueries";
import {
  AUTO_DETECT_CODE,
  LANGUAGES,
  SOURCE_LANGUAGES,
  getLanguageName,
} from "../utils/languages";
import { translateText } from "../utils/translation";
import { LanguageSelect } from "./LanguageSelect";

const MAX_CHARS = 500;

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const getSpeechRecognition = ():
  | (new () => SpeechRecognitionInstance)
  | null => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export function TranslationPanel() {
  const [sourceLang, setSourceLang] = useState(AUTO_DETECT_CODE);
  const [targetLang, setTargetLang] = useState("es");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sessionBaseTextRef = useRef<string>(""); // text before current mic session
  const saveTranslation = useSaveTranslation();

  const speechSupported = !!getSpeechRecognition();

  const handleSwap = useCallback(() => {
    if (sourceLang === AUTO_DETECT_CODE) return;
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    const prevTranslated = translatedText;
    const prevSource2 = sourceText;

    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    setSourceText(prevTranslated);
    setTranslatedText(prevSource2);
    setDetectedLang(null);
  }, [sourceLang, targetLang, sourceText, translatedText]);

  const handleTranslate = useCallback(async () => {
    const trimmed = sourceText.trim();
    if (!trimmed) return;

    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedText("");

    try {
      const result = await translateText(trimmed, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      if (result.detectedLang) {
        setDetectedLang(result.detectedLang);
      }

      // Save to history
      const effectiveSrcLang =
        sourceLang === AUTO_DETECT_CODE
          ? (result.detectedLang ?? "auto")
          : sourceLang;

      await saveTranslation.mutateAsync({
        sourceText: trimmed,
        sourceLang: effectiveSrcLang,
        targetLang,
        translatedText: result.translatedText,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      setTranslationError(msg);
      toast.error(msg);
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, saveTranslation]);

  const handleMicToggle = useCallback(async () => {
    if (!speechSupported) {
      toast.error(
        "Speech recognition is not supported in your browser. Try Chrome or Edge.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Request microphone permission explicitly before starting recognition
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      const err = permErr as DOMException;
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        toast.error(
          "Microphone access was denied. Please allow microphone permission in your browser settings and try again.",
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        toast.error(
          "No microphone found. Please connect a microphone and try again.",
        );
      } else {
        toast.error(
          "Could not access the microphone. Please check your browser settings.",
        );
      }
      return;
    }

    const SpeechRecognition = getSpeechRecognition()!;
    const recognition = new SpeechRecognition();

    // Always set a valid lang -- browsers require a BCP-47 tag.
    // When auto-detect is selected, fall back to the browser UI locale or "en-US".
    recognition.lang =
      sourceLang !== AUTO_DETECT_CODE
        ? sourceLang
        : navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build the full transcript from this session (interim + final)
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      if (transcript) {
        const base = sessionBaseTextRef.current;
        setSourceText(base ? `${base} ${transcript}` : transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: Record<string, string> = {
        "not-allowed":
          "Microphone access was denied. Please allow microphone permission in your browser settings.",
        "no-speech": "No speech was detected. Please try speaking again.",
        "audio-capture":
          "No microphone found. Please connect a microphone and try again.",
        network:
          "A network error occurred. Please check your connection and try again.",
        "service-not-allowed":
          "Speech recognition service is not allowed. Try using Chrome or Edge.",
        aborted: "", // silent — user or code stopped it
      };
      const msg = errorMessages[event.error];
      if (msg) {
        toast.error(msg);
      } else if (event.error !== "aborted") {
        toast.error(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current = recognition;
      sessionBaseTextRef.current = sourceText.trimEnd();
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [isListening, speechSupported, sourceLang, sourceText]);

  const handleSpeak = useCallback(() => {
    if (!translatedText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [translatedText, targetLang, isSpeaking]);

  const handleCopy = useCallback(async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [translatedText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const canSwap = sourceLang !== AUTO_DETECT_CODE;
  const charCount = sourceText.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Language selector row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <LanguageSelect
              value={sourceLang}
              onChange={(v) => {
                setSourceLang(v);
                setDetectedLang(null);
              }}
              languages={SOURCE_LANGUAGES}
              placeholder="Source language"
              data-ocid="translation.source_lang_select"
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                disabled={!canSwap}
                data-ocid="translation.swap_button"
                className={cn(
                  "shrink-0 h-10 w-10 border-border bg-card",
                  "hover:bg-secondary hover:border-primary/40",
                  "transition-all duration-200",
                  !canSwap && "opacity-40",
                )}
              >
                <ArrowLeftRight className="h-4 w-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canSwap
                ? "Swap languages"
                : "Cannot swap when auto-detect is on"}
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 min-w-0">
            <LanguageSelect
              value={targetLang}
              onChange={setTargetLang}
              languages={LANGUAGES}
              placeholder="Target language"
              data-ocid="translation.target_lang_select"
            />
          </div>
        </div>

        {/* Translation area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source panel */}
          <div className="panel-glass rounded-xl overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-1/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Input
                </span>
                {detectedLang && sourceLang === AUTO_DETECT_CODE && (
                  <Badge
                    variant="secondary"
                    className="text-xs py-0 px-2 bg-brand-light text-primary font-mono"
                  >
                    Detected: {getLanguageName(detectedLang)}
                  </Badge>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isListening ? "destructive" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      isListening && "mic-pulse",
                      !speechSupported && "opacity-40 cursor-not-allowed",
                    )}
                    onClick={handleMicToggle}
                    data-ocid="translation.mic_button"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!speechSupported
                    ? "Speech recognition not supported in this browser"
                    : isListening
                      ? "Stop recording"
                      : "Start voice input"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Textarea */}
            <div className="relative">
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type or speak text to translate…"
                className={cn(
                  "translation-textarea min-h-[160px] resize-none border-0 rounded-none",
                  "text-sm font-sans leading-relaxed p-4 bg-transparent",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  isOverLimit && "text-destructive",
                )}
                maxLength={MAX_CHARS + 50}
                data-ocid="translation.source_input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleTranslate();
                  }
                }}
              />
              <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-mono",
                    isOverLimit ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {charCount}/{MAX_CHARS}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Ctrl+Enter to translate
                </span>
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div
            className="panel-glass rounded-xl overflow-hidden"
            data-ocid="translation.output_panel"
          >
            {/* Panel header */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-1/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Translation
              </span>
              <div className="flex items-center gap-1">
                {translatedText && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleCopy}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isCopied ? "Copied!" : "Copy translation"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSpeaking ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleSpeak}
                          data-ocid="translation.speak_button"
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isSpeaking ? "Stop speaking" : "Read aloud"}
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {/* Output content */}
            <div className="min-h-[160px] p-4 relative">
              <AnimatePresence mode="wait">
                {isTranslating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[140px] gap-3"
                    data-ocid="translation.loading_state"
                  >
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Translating…
                    </span>
                  </motion.div>
                ) : translationError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-destructive/8 border border-destructive/20"
                    data-ocid="translation.error_state"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">
                      {translationError}
                    </p>
                  </motion.div>
                ) : translatedText ? (
                  <motion.p
                    key="result"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-sans leading-relaxed text-foreground"
                  >
                    {translatedText}
                  </motion.p>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[140px] gap-2"
                  >
                    <Languages className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground/50">
                      Translation will appear here
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Translate button */}
        <div className="flex justify-center">
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim() || isOverLimit}
            data-ocid="translation.translate_button"
            className={cn(
              "btn-brand px-8 py-2.5 text-sm font-semibold font-display",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-w-[160px] h-11 rounded-lg",
            )}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating…
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
