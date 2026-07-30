"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, CheckCircle, MessageCircleQuestion, Sparkles, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { InsightsData, Signal } from "@/services/insights.service";
import { useAnalyzeInsights } from "@/hooks/useInsights";

function severityIcon(severity: Signal["severity"]) {
    switch (severity) {
        case "positive":
            return <CheckCircle className="w-4 h-4 text-emerald-600" />;
        case "warning":
            return <AlertTriangle className="w-4 h-4 text-rose-600" />;
        default:
            return <TrendingUp className="w-4 h-4 text-indigo-600" />;
    }
}

function severityBorderClass(severity: Signal["severity"]) {
    switch (severity) {
        case "positive":
            return "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10";
        case "warning":
            return "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10";
        default:
            return "border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10";
    }
}

interface InsightsPanelProps {
    data?: InsightsData;
    isLoading?: boolean;
    period?: string;
    owner?: string;
}

export function InsightsPanel({ data, isLoading, period, owner }: InsightsPanelProps) {
    const analyzeMutation = useAnalyzeInsights(period, owner);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!data || data.signals.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                    {data.analyzedAt ? (
                        <>Dianalisis AI {formatDistanceToNow(new Date(data.analyzedAt), { addSuffix: true, locale: idLocale })}</>
                    ) : (
                        <>Belum pernah dianalisis dengan AI -- masih insight rule-based.</>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={analyzeMutation.isPending}
                    onClick={() => analyzeMutation.mutate()}
                    className="gap-2 w-fit"
                >
                    {analyzeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4" />
                    )}
                    {analyzeMutation.isPending ? "Menganalisis..." : "Analisis dengan AI"}
                </Button>
            </div>

            {analyzeMutation.isError && (
                <p className="text-xs text-rose-600">
                    Gagal menganalisis: {(analyzeMutation.error as Error)?.message || "Terjadi kesalahan."}
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.signals.map((signal) => (
                    <Card key={signal.id} className={`border-l-4 ${severityBorderClass(signal.severity)}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                {signal.title}
                                {severityIcon(signal.severity)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-1">{signal.value}</div>
                            <p className="text-xs text-muted-foreground">{signal.narrative}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data.talkingPoints.length > 0 && (
                <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageCircleQuestion className="w-4 h-4 text-amber-600" />
                            Bahan Diskusi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {data.talkingPoints.map((tp, i) => (
                                <li key={i} className="text-muted-foreground">
                                    {tp.question}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
