"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useBudgetOverview } from "@/hooks/useBudget";
import type { EnvelopeOverview } from "@/services/budget.service";

const IDR = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function progressColor(percent: number) {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-amber-500";
    return "bg-emerald-500";
}

// Older envelopes were created with a hardcoded "Wallet" placeholder before
// icon picking existed -- fall back to the lucide icon only for those.
function isEmojiIcon(icon?: string) {
    return !!icon && icon !== "Wallet";
}

// Purely informational -- what the (always month-scoped) limit works out
// to in the envelope's own unit. Doesn't affect spent/limit/percent.
function pacingText(env: EnvelopeOverview) {
    // Weekly's /minggu reference isn't useful enough to show -- only Daily
    // and Annual get a pacing badge.
    if (env.pacingUnit === "week") return null;
    if (!env.pacingUnit || !env.pacingAmount) return null;
    // Match the existing "safe to spend / day" badge's English unit wording.
    const unitLabel = env.pacingUnit === "day" ? "day" : "year";
    return `≈ ${IDR(env.pacingAmount)}/${unitLabel}`;
}

function EnvelopeRow({ env, expanded, onToggle }: { env: EnvelopeOverview; expanded: boolean; onToggle: () => void }) {
    const hasCategories = env.categories && env.categories.length > 0;

    return (
        <div className="rounded-lg -mx-2 px-2 py-1.5 hover:bg-muted/50 transition-colors">
            <button
                type="button"
                onClick={hasCategories ? onToggle : undefined}
                className={`w-full flex items-center gap-3 text-left ${hasCategories ? "cursor-pointer" : "cursor-default"}`}
            >
                <div
                    className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: env.color || "#6366f1" }}
                >
                    {isEmojiIcon(env.icon) ? env.icon : <Wallet className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate flex items-center gap-1.5">
                            {env.name}
                            {pacingText(env) && (
                                <span className="text-[9px] font-normal text-muted-foreground border rounded px-1 shrink-0">
                                    {pacingText(env)}
                                </span>
                            )}
                            {hasCategories && (
                                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                            )}
                        </span>
                        <span className="text-muted-foreground shrink-0 ml-2">
                            {IDR(env.spent)} / {IDR(env.limit)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${progressColor(env.percent)}`}
                            style={{ width: `${Math.min(100, env.percent)}%` }}
                        />
                    </div>
                </div>
            </button>

            {expanded && hasCategories && (
                <div className="pl-11 mt-2 space-y-1.5">
                    {env.categories.map((cat) => (
                        <div key={`${cat.id}:${cat.owner || "ALL"}`} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#a1a1aa" }} />
                                {cat.name}
                                {cat.owner && (
                                    <span className="text-[9px] border rounded px-1 uppercase tracking-wider shrink-0">
                                        {cat.owner === "ADAM" ? "Adam" : "Sasti"}
                                    </span>
                                )}
                            </span>
                            <span className="shrink-0 ml-2">{IDR(cat.spent)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Read-only budget tracking widget for the Dashboard -- shows total spend,
// the envelopes closest to (or over) their limit, and (expandable) which
// categories drove each envelope's spending. Full editing stays on /budget.
export function BudgetTrackingCard() {
    const { data: overview, isLoading } = useBudgetOverview();
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    if (isLoading) {
        return <div className="h-64 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />;
    }

    if (!overview || overview.envelopes.length === 0) return null;

    const totalPercent = overview.totalBudget > 0
        ? Math.min(100, (overview.totalSpent / overview.totalBudget) * 100)
        : 0;

    const topEnvelopes = [...overview.envelopes]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5);

    const toggleExpanded = (name: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Budget Tracking</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
                    <Link href="/budget" className="flex items-center gap-1 text-xs">
                        Kelola Budget <ChevronRight className="w-3 h-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total terpakai</span>
                        <span className="font-medium">
                            {IDR(overview.totalSpent)} / {IDR(overview.totalBudget)}
                        </span>
                    </div>
                    <Progress value={totalPercent} className="h-2" />
                </div>

                <div className="space-y-1">
                    {topEnvelopes.map((env) => (
                        <EnvelopeRow
                            key={env.name}
                            env={env}
                            expanded={expanded.has(env.name)}
                            onToggle={() => toggleExpanded(env.name)}
                        />
                    ))}
                </div>

                {overview.envelopes.length > topEnvelopes.length && (
                    <p className="text-xs text-muted-foreground text-center">
                        +{overview.envelopes.length - topEnvelopes.length} kategori lainnya
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
