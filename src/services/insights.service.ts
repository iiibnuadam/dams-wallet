import { apiFetch } from "../lib/api";

export type SignalSeverity = "positive" | "warning" | "neutral";

export interface Signal {
    id: string;
    category: string;
    severity: SignalSeverity;
    title: string;
    message: string;
    narrative: string;
    value: string;
    facts: Record<string, unknown>;
}

export interface TalkingPoint {
    question: string;
    relatedSignalIds: string[];
}

export interface InsightsData {
    period: string;
    generatedAt: string;
    signals: Signal[];
    talkingPoints: TalkingPoint[];
    source: "llm" | "rules_only";
    provider?: string | null;
    analyzedAt?: string | null;
}

export async function getInsights(period?: string, owner?: string): Promise<InsightsData> {
    const params: Record<string, string> = {};
    if (period) params.period = period;
    if (owner) params.owner = owner;
    return apiFetch<InsightsData>("/insights", { params });
}

// Explicit, user-triggered AI analysis -- calls the LLM and overwrites the
// saved analysis for this (period, owner). Unlike getInsights, this always
// costs tokens, so it's only called from a button press, never on mount.
export async function analyzeInsights(period?: string, owner?: string): Promise<InsightsData> {
    const params: Record<string, string> = {};
    if (period) params.period = period;
    if (owner) params.owner = owner;
    return apiFetch<InsightsData>("/insights/analyze", { method: "POST", params });
}
