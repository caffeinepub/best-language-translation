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
          "h-10 bg-white border-border text-foreground font-sans font-medium text-sm",
          "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "hover:border-primary/40 transition-colors",
          className,
        )}
        data-ocid={dataOcid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border-border shadow-lg">
        <ScrollArea className="h-64">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="text-sm font-sans cursor-pointer hover:bg-brand-light/30 focus:bg-brand-light/30"
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
