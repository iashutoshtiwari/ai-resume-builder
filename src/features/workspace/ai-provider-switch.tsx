"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  IconSparkles,
  IconBolt,
  IconWorld,
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useWorkspaceStore, type ActiveAiProvider } from "@/store/workspace-store";

interface ProviderInfo {
  id: ActiveAiProvider;
  name: string;
  badge: string;
  configured: boolean;
  model: string;
  description: string;
}

const PROVIDER_ICONS: Record<ActiveAiProvider, TablerIcon> = {
  google: IconSparkles,
  groq: IconBolt,
  openrouter: IconWorld,
};

const subscribeToHydration = () => () => undefined;

export function AiProviderSwitch() {
  const activeProvider = useWorkspaceStore((state) => state.activeAiProvider);
  const setActiveProvider = useWorkspaceStore((state) => state.setActiveAiProvider);
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [providers, setProviders] = useState<ProviderInfo[]>([
    {
      id: "google",
      name: "Google Gemini",
      badge: "Gemini Flash",
      configured: true,
      model: "gemini-3.6-flash",
      description: "Google AI Studio Pro / Free",
    },
    {
      id: "groq",
      name: "Groq LPU",
      badge: "14.4k/day Free",
      configured: false,
      model: "openai/gpt-oss-120b",
      description: "Ultra-fast ~300 tok/s free tier",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      badge: "Multi-Model",
      configured: true,
      model: "gemini-2.5-flash",
      description: "OpenRouter multi-model gateway",
    },
  ]);

  useEffect(() => {
    fetch("/api/ai/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.providers && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        // Retain static fallback
      });
  }, []);

  // Handle outside click and Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Use the SSR-safe default until mounted to avoid hydration mismatch
  // (Zustand reads activeAiProvider from localStorage which may differ from the server default)
  const displayProvider = mounted ? activeProvider : "google";
  const current = providers.find((p) => p.id === displayProvider) || providers[0];
  const Icon = PROVIDER_ICONS[displayProvider] || IconSparkles;

  const handleSelect = (provider: ProviderInfo) => {
    setActiveProvider(provider.id);
    setIsOpen(false);

    if (!provider.configured) {
      toast.warning(
        `${provider.name} selected, but its API key is not configured in .env.local. Requests may fail until configured.`,
      );
    } else {
      toast.success(`Switched AI provider to ${provider.name} (${provider.model})`);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-7 items-center gap-1.5 border border-border bg-card/60 px-2 font-mono text-[11px] text-foreground transition-colors hover:bg-muted focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Icon className="size-3 shrink-0 text-primary" />
        <span className="truncate">{current.name}</span>
        <span
          className={`size-1.5 shrink-0 rounded-none ${
            current.configured ? "bg-emerald-500" : "bg-amber-500"
          }`}
          title={current.configured ? "Configured & ready" : "API key missing in .env.local"}
        />
        <IconChevronDown
          className={`size-3 text-muted-foreground transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-none border border-border bg-card p-1 shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="border-b border-border/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Active AI Provider
          </div>
          <div className="mt-1 space-y-0.5">
            {providers.map((p) => {
              const ItemIcon = PROVIDER_ICONS[p.id] || IconSparkles;
              const isSelected = p.id === activeProvider;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`flex w-full items-start justify-between gap-2 p-2 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <ItemIcon
                      className={`mt-0.5 size-3.5 shrink-0 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs ${isSelected ? "font-semibold text-foreground" : "font-medium"}`}>
                          {p.name}
                        </span>
                        <span className="rounded-none border border-border/80 bg-background/80 px-1 font-mono text-[9px] text-muted-foreground">
                          {p.badge}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                        {p.model}
                      </div>
                      {!p.configured && (
                        <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-amber-500">
                          <IconAlertCircle className="size-2.5 shrink-0" /> Key missing in .env
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && <IconCheck className="mt-1 size-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
