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
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm hover:shadow-sm transition-shadow group"
        >
            {severityIcon(headline.severity)}
            <span className="flex-1 min-w-0 truncate text-muted-foreground">{headline.narrative}</span>
            <span className="flex items-center gap-1 text-xs text-primary shrink-0 whitespace-nowrap">
                Lihat di Analytics
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
        </Link>
    );
}
