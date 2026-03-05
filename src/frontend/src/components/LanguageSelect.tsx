import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Language } from "../utils/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  languages: Array<Language | { name: string; code: string }>;
  placeholder?: string;
  className?: string;
  "data-ocid"?: string;
}

export function LanguageSelect({
  value,
  onChange,
  languages,
  placeholder = "Select language",
  className,
  "data-ocid": dataOcid,
}: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "lang-selector-trigger",
          "h-10 w-full font-sans font-semibold text-sm",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
          className,
        )}
        data-ocid={dataOcid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border shadow-xl">
        <ScrollArea className="h-64">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="text-sm font-sans cursor-pointer text-popover-foreground hover:bg-primary/10 focus:bg-primary/10"
            >
              <span>{lang.name}</span>
              {lang.code !== "auto" && (
                <span className="ml-2 text-xs font-mono text-muted-foreground uppercase opacity-60">
                  {lang.code}
                </span>
              )}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
