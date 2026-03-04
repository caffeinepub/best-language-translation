import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { motion } from "motion/react";
import { HistoryPanel } from "./components/HistoryPanel";
import { TranslationPanel } from "./components/TranslationPanel";

function Header() {
  return (
    <header className="header-gradient border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center justify-between gap-3"
        >
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* App Logo */}
            <div
              data-ocid="header.app_logo"
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg shrink-0 overflow-hidden"
            >
              <img
                src="/assets/generated/best-language-translation-logo-transparent.dim_200x200.png"
                alt="Best Language Translation logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-none tracking-tight truncate">
                BEST LANGUAGE TRANSLATION
              </h1>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5 font-sans">
                Professional translation across 70 world languages
              </p>
            </div>
          </div>

          {/* Right: User Avatar */}
          <div className="shrink-0">
            <Avatar
              data-ocid="header.user_avatar"
              className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-white/25 ring-offset-2 ring-offset-transparent shadow-lg"
            >
              <AvatarImage
                src="/assets/generated/user-avatar-default-transparent.dim_80x80.png"
                alt="User avatar"
                className="object-cover"
              />
              <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  );
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm mt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center">
          © {year}. Built with <span className="text-destructive">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Translation Panel */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          aria-label="Translation tool"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Translate
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <TranslationPanel />
        </motion.section>

        <Separator className="my-8 bg-border/60" />

        {/* History Panel */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.25 }}
          aria-label="Translation history"
        >
          <HistoryPanel />
        </motion.section>
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
