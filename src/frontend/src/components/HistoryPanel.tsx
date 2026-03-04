import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Inbox,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useClearHistory,
  useDeleteRecord,
  useGetHistory,
} from "../hooks/useQueries";
import { getLanguageName } from "../utils/languages";
import { formatTimestamp } from "../utils/translation";

function speakText(text: string, lang: string, onEnd: () => void) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function HistoryPanel() {
  const { data: history, isLoading, isError } = useGetHistory();
  const deleteRecord = useDeleteRecord();
  const clearHistory = useClearHistory();
  const [speakingId, setSpeakingId] = useState<bigint | null>(null);

  const handleReplay = useCallback(
    (id: bigint, text: string, lang: string) => {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      setSpeakingId(id);
      speakText(text, lang, () => setSpeakingId(null));
    },
    [speakingId],
  );

  const handleDelete = useCallback(
    async (id: bigint) => {
      try {
        await deleteRecord.mutateAsync(id);
        toast.success("Translation deleted");
      } catch {
        toast.error("Failed to delete");
      }
    },
    [deleteRecord],
  );

  const handleClearAll = useCallback(async () => {
    try {
      await clearHistory.mutateAsync();
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  }, [clearHistory]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="panel-glass rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-full mt-3 rounded" />
            <Skeleton className="h-4 w-3/4 mt-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel-glass rounded-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive/60 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load history</p>
      </div>
    );
  }

  const items = history ?? [];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Translation History
            </span>
            {items.length > 0 && (
              <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8 h-8"
                  data-ocid="history.clear_button"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {items.length} translation
                    {items.length === 1 ? "" : "s"} from your history. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="history.clear.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-ocid="history.clear.confirm_button"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel-glass rounded-xl p-10 flex flex-col items-center gap-3"
            data-ocid="history.empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center">
              <Inbox className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                No translations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your translation history will appear here
              </p>
            </div>
          </motion.div>
        )}

        {/* History list */}
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.div
              key={item.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="history-item rounded-xl bg-card overflow-hidden"
              data-ocid={`history.item.${index + 1}`}
            >
              {/* Language bar */}
              <div className="px-4 py-2.5 bg-surface-1/70 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
                  <span className="lang-badge shrink-0">
                    {getLanguageName(item.sourceLang)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="lang-badge shrink-0">
                    {getLanguageName(item.targetLang)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTimestamp(item.timestampNanos)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          speakingId === item.id &&
                            "bg-primary/10 text-primary",
                        )}
                        onClick={() =>
                          handleReplay(
                            item.id,
                            item.translatedText,
                            item.targetLang,
                          )
                        }
                        data-ocid={`history.replay_button.${index + 1}`}
                      >
                        {speakingId === item.id ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {speakingId === item.id ? "Stop" : "Play translation"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/8 hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteRecord.isPending}
                        data-ocid={`history.delete_button.${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                    Original
                  </p>
                  <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                    {item.sourceText}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                    Translation
                  </p>
                  <p className="text-sm text-primary font-medium line-clamp-2 leading-relaxed">
                    {item.translatedText}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
