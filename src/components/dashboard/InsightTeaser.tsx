"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import type { InsightsData, Signal } from "@/services/insights.service";

function severityIcon(severity: Signal["severity"]) {
    switch (severity) {
        case "positive":
            return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
        case "warning":
            return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
        default:
            return <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
}

// Picks the single most attention-worthy signal: warnings first (something
// needs action), then positives (worth celebrating), then whatever's left.
function pickHeadline(signals: Signal[]): Signal | undefined {
    return (
        signals.find((s) => s.severity === "warning") ||
        signals.find((s) => s.severity === "positive") ||
        signals[0]
    );
}

// One-line teaser for the Dashboard -- the full insight panel (with AI
// analysis) lives on the Analytics page; this just surfaces the single most
// notable insight and links there for the rest.
export function InsightTeaser({ data, isLoading }: { data?: InsightsData; isLoading?: boolean }) {
    if (isLoading) {
        return <div className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />;
    }

    if (!data || data.signals.length === 0) return null;

    const headline = pickHeadline(data.signals);
    if (!headline) return null;

    return (
        <Link
            href="/analytics"
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm hover:shadow-sm transition-shadow group overflow-hidden"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                {severityIcon(headline.severity)}
                <div className="truncate text-muted-foreground font-medium sm:font-normal flex-1 min-w-0 whitespace-normal">{headline.narrative}</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary shrink-0 whitespace-nowrap self-end sm:self-auto">
                Lihat di Analytics
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
        </Link>
    );
}
