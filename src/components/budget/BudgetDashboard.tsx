"use client";
import { useState, useEffect, useCallback } from "react";
import { BudgetSkeleton } from "./BudgetSkeleton";
import {
  BudgetService,
  BudgetOverview,
  EnvelopeOverview,
  EnvelopeItem,
  EnvelopeOwner,
  EnvelopeFrequency,
  OWNER_ALL,
} from "@/services/budget.service";
import { CategoryService } from "@/services/category.service";
import { ICategory } from "@/types/category";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings2, Plus, AlertCircle, TrendingUp, TrendingDown, Target, HelpCircle, Check, ChevronRight, ChevronDown, CheckCircle2, MoreHorizontal, Pencil, X, Sparkles, Receipt, ListPlus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MoneyInput } from "@/components/ui/money-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ENVELOPE_ICONS = ["💰", "🏠", "🍔", "🚗", "🛒", "🎮", "✈️", "💊", "🎓", "👶", "🐶", "💡", "📱", "🎁", "⚡", "🏋️"];

// Same hue range as the category color picker (3 shades x ~17 hues) so
// envelopes have just as much variety to pick from.
const ENVELOPE_COLORS = [
  "#64748b", "#71717a", "#78716c", "#262626", // slate / zinc / stone / neutral
  "#fca5a5", "#ef4444", "#b91c1c", // red 300/500/700
  "#fdba74", "#f97316", "#c2410c", // orange
  "#fcd34d", "#f59e0b", "#b45309", // amber
  "#fde047", "#eab308", "#a16207", // yellow
  "#bef264", "#84cc16", "#4d7c0f", // lime
  "#86efac", "#22c55e", "#15803d", // green
  "#6ee7b7", "#10b981", "#047857", // emerald
  "#5eead4", "#14b8a6", "#0f766e", // teal
  "#67e8f9", "#06b6d4", "#0e7490", // cyan
  "#7dd3fc", "#0ea5e9", "#0369a1", // sky
  "#93c5fd", "#3b82f6", "#1d4ed8", // blue
  "#a5b4fc", "#6366f1", "#4338ca", // indigo
  "#c4b5fd", "#8b5cf6", "#6d28d9", // violet
  "#d8b4fe", "#a855f7", "#7e22ce", // purple
  "#f0abfc", "#d946ef", "#a21caf", // fuchsia
  "#f9a8d4", "#ec4899", "#be185d", // pink
  "#fda4af", "#f43f5e", "#be123c", // rose
];

// Older envelopes were created with a hardcoded "Wallet" placeholder before
// icon picking existed -- fall back to the lucide icon only for those.
function isEmojiIcon(icon?: string) {
  return !!icon && icon !== "Wallet";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IDR = (n: number, compact = false) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    // Compact mode (2,5jt) needs a decimal or it rounds to whole
    // jt/rb units (2,5jt -> 3jt) -- minimumFractionDigits:0 keeps round
    // numbers (900rb) clean without a trailing ",0".
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
    ...(compact ? { notation: "compact" } : {}),
  }).format(n);

function progressColor(percent: number) {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function progressBg(percent: number) {
  if (percent >= 100) return "bg-red-100 dark:bg-red-900/20";
  if (percent >= 80) return "bg-amber-100 dark:bg-amber-900/20";
  return "bg-emerald-100 dark:bg-emerald-900/20";
}

function progressTextColor(percent: number) {
  if (percent >= 100) return "text-red-600 dark:text-red-400";
  if (percent >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function itemKey(categoryId: string, owner: EnvelopeOwner) {
  return `${categoryId}:${owner || "ALL"}`;
}

function ownerLabel(owner?: EnvelopeOwner) {
  return owner === "ADAM" ? "Adam" : owner === "SASTI" ? "Sasti" : null;
}

const FREQUENCIES: EnvelopeFrequency[] = ["DAILY", "WEEKLY", "MONTHLY", "ANNUAL"];

function frequencyLabel(type: EnvelopeFrequency) {
  switch (type) {
    case "DAILY": return "Daily";
    case "WEEKLY": return "Weekly";
    case "ANNUAL": return "Annual";
    default: return "Monthly";
  }
}

// Purely informational reference showing what a (always month-scoped)
// limit works out to in the envelope's own unit -- doesn't affect
// spent/remaining/percent, budgeting stays monthly regardless of Type.
function pacingText(env: EnvelopeOverview) {
  // Weekly's /minggu reference isn't useful enough to show -- only Daily
  // and Annual get a pacing badge.
  if (env.pacingUnit === "week") return null;
  if (!env.pacingUnit || !env.pacingAmount) return null;
  // Match the existing "safe to spend / day" badge's English unit wording.
  const unitLabel = env.pacingUnit === "day" ? "day" : "year";
  return `≈ ${IDR(env.pacingAmount, true)}/${unitLabel}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetDashboard() {
  const [currentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [manageOpen, setManageOpen] = useState(false);

  // Inline editing state
  const [editingEnvelope, setEditingEnvelope] = useState<string | null>(null); 
  const [editValue, setEditValue] = useState(0);

  // Income editing
  const [editingIncome, setEditingIncome] = useState(false);
  const [editIncomeValue, setEditIncomeValue] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, cats] = await Promise.all([
        BudgetService.getBudgetOverview(currentMonth),
        CategoryService.getCategories("EXPENSE"),
      ]);
      setOverview(ov);
      setCategories(cats);
    } catch {
      toast.error("Failed to load budget overview");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <BudgetSkeleton />;
  }
  if (!overview) return null;

  const { envelopes, unbudgetedSpent } = overview;
  
  // Parse month dates for links
  const t = new Date(currentMonth + "-01T00:00:00Z");
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const startDate = new Date(Date.UTC(y, m, 1)).toISOString();
  const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString();
  const allTxLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Plan</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {format(t, "MMMM yyyy")}
            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
              {overview.daysRemaining} days left
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setManageOpen(true)} className="gap-2 shadow-sm">
            <Settings2 className="w-4 h-4" /> Manage Envelopes
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24" /></div>
          <CardContent className="p-5 relative z-10 group">
            <div className="flex items-center justify-between">
                <p className="text-indigo-100 text-sm font-medium">Expected Income</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-200 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setEditingIncome(true); setEditIncomeValue(overview.income); }}>
                    <Pencil className="w-3 h-3" />
                </Button>
            </div>
            {editingIncome ? (
                <div className="mt-2 flex items-center gap-2">
                  <MoneyInput value={editIncomeValue} onValueChange={(val) => setEditIncomeValue(Number(val))} className="h-8 text-black" />
                  <Button size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white" onClick={async () => {
                      try {
                          await BudgetService.upsertEnvelopes(currentMonth, envelopes, editIncomeValue);
                          setEditingIncome(false);
                          fetchData();
                      } catch {
                          toast.error("Failed to update income");
                      }
                  }}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setEditingIncome(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
            ) : (
                <h3 className="text-3xl font-bold mt-1 tracking-tight">{IDR(overview.income, true)}</h3>
            )}
            
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 opacity-90">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Realized:</span>
                </div>
                <span className="font-semibold">{IDR(overview.realizedIncome, true)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50">
          <CardContent className="p-5">
            <p className="text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Needs Spent
            </p>
            <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1 tracking-tight">
              {IDR(overview.totalNeeds, true)}
            </h3>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-2 flex items-center gap-1"><Receipt className="w-3 h-3"/> Mandatory expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50">
          <CardContent className="p-5">
            <p className="text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Wants Spent
            </p>
            <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1 tracking-tight">
              {IDR(overview.totalWants, true)}
            </h3>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2 flex items-center gap-1"><Target className="w-3 h-3"/> Lifestyle & hobbies</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Custom Envelopes List ── */}
      {envelopes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-4 text-indigo-500">
              <Wallet className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold">No envelopes yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Create custom envelopes to group categories together and limit your spending for this month.
            </p>
            <Button onClick={() => setManageOpen(true)} className="mt-6 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Envelope
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-500" /> All Envelopes
                </h2>
                <Badge variant="secondary" className="font-mono text-xs shadow-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                    {IDR(overview.totalSpent, true)} / {IDR(overview.totalBudget, true)}
                </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {envelopes.map((env, index) => (
                    <EnvelopeCard
                        key={env.name || `legacy-${index}`}
                        env={env}
                        isEditing={editingEnvelope === env.name}
                        editValue={editValue}
                        onEditStart={() => {
                            setEditingEnvelope(env.name);
                            setEditValue(env.limit);
                        }}
                        onEditChange={setEditValue}
                        onEditSave={async () => {
                            if (editValue < 0) return;
                            const newEnv = envelopes.map(e => e.name === env.name ? { ...e, limit: editValue } : e);
                            await BudgetService.upsertEnvelopes(currentMonth, newEnv, overview.income);
                            setEditingEnvelope(null);
                            fetchData();
                        }}
                        onEditCancel={() => setEditingEnvelope(null)}
                        startDate={startDate}
                        endDate={endDate}
                    />
                ))}
            </div>

            {/* Unbudgeted */}
            {unbudgetedSpent > 0 && (
            <div className="space-y-3 mt-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Unbudgeted Spending
                </h3>
                <Card className="border-dashed border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                    <p className="font-semibold text-foreground">Other categories</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Spending not covered by any envelope</p>
                    </div>
                    <div className="text-right">
                    <p className="font-bold text-lg text-amber-600 dark:text-amber-400">{IDR(unbudgetedSpent)}</p>
                    <Link href={allTxLink}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs mt-1 text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-900/40">
                        View <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                    </Link>
                    </div>
                </CardContent>
                </Card>
            </div>
            )}
        </div>
      )}

      {/* Dialogs */}
      <ManageEnvelopesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        envelopes={envelopes}
        categories={categories}
        income={overview.income}
        period={currentMonth}
        onSaved={fetchData}
      />
    </div>
  );
}

// ─── Envelope Card ─────────────────────────────────────────────────────────────

function EnvelopeCard({
  env, isEditing, editValue,
  onEditStart, onEditChange, onEditSave, onEditCancel,
  startDate, endDate,
}: {
  env: EnvelopeOverview;
  isEditing: boolean;
  editValue: number;
  onEditStart: () => void;
  onEditChange: (v: number) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  startDate: string;
  endDate: string;
}) {
  const [showCategories, setShowCategories] = useState(false);
  // Spend is always tracked for the current month regardless of Type --
  // budgeting stays monthly -- so "View Tx" always shows this month's
  // transactions, same range for every envelope.
  const uniqueCategoryIds = Array.from(new Set((env.items || []).map((i) => i.categoryId)));
  const catFilter = uniqueCategoryIds.length > 0 ? `&categoryId=${uniqueCategoryIds.join(",")}` : "";
  const txLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE${catFilter}`;
  const isOver = env.spent > env.limit && env.limit > 0;
  const hasLimit = env.limit > 0;
  const hasCategories = env.categories && env.categories.length > 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all border-l-4 hover:shadow-md group",
        isOver ? "border-l-red-500" : hasLimit ? "border-l-indigo-500" : "border-l-slate-300"
      )}
    >
      <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner text-lg"
              style={{ backgroundColor: env.color || "#6366f1" }}
            >
              {isEmojiIcon(env.icon) ? env.icon : <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-semibold leading-none">{env.name}</h4>
              <button
                type="button"
                onClick={() => hasCategories && setShowCategories((v) => !v)}
                className={cn(
                  "text-[11px] text-muted-foreground mt-1 flex items-center gap-1",
                  hasCategories && "hover:text-foreground cursor-pointer"
                )}
              >
                {(env.items?.length || 0)} items
                {pacingText(env) && <> &middot; {pacingText(env)}</>}
                {hasCategories && (
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showCategories && "rotate-180")} />
                )}
              </button>
            </div>
          </div>
          {/* Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={onEditStart}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Limit
              </Button>
              <Link href={txLink} className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  <Receipt className="w-3.5 h-3.5 mr-2" /> View Tx
                </Button>
              </Link>
            </PopoverContent>
          </Popover>
        </div>

        {/* Middle: Spending Stats */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight flex items-baseline gap-1">
              {IDR(env.spent, true)}
              {hasLimit && (
                <span className="text-xs font-normal text-muted-foreground">
                  / {IDR(env.limit, true)}
                </span>
              )}
            </p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-2">
                <MoneyInput value={editValue} onValueChange={(val) => onEditChange(Number(val))} className="h-8 text-sm w-28" autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={onEditSave}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEditCancel}><X className="w-4 h-4" /></Button>
              </div>
            ) : hasLimit ? (
              <p className={cn("text-xs font-medium mt-1 flex items-center gap-1", progressTextColor(env.percent))}>
                {isOver ? (
                  <><TrendingUp className="w-3 h-3" /> Over {IDR(env.spent - env.limit, true)}</>
                ) : (
                  <><TrendingDown className="w-3 h-3" /> {IDR(env.remaining, true)} left</>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> No limit set
              </p>
            )}
          </div>
          {hasLimit && env.safeToSpendToday > 0 && !isOver && (
            <div className="text-right">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
                {IDR(env.safeToSpendToday, true)} / day
              </Badge>
            </div>
          )}
        </div>

        {/* Bottom: Progress Bar */}
        {hasLimit && (
          <div className={cn("h-2 rounded-full overflow-hidden mt-1", progressBg(env.percent))}>
            <div
              className={cn("h-full transition-all duration-500 rounded-full", progressColor(env.percent))}
              style={{ width: `${Math.min(100, env.percent)}%` }}
            />
          </div>
        )}

        {/* Category Breakdown -- each row links to that category's (and,
            if split, that person's) transaction history, since the whole
            point of splitting is being able to trace who spent what. */}
        {showCategories && hasCategories && (
          <div className="pt-3 border-t space-y-1.5">
            {env.categories.map((cat) => {
              const view = cat.owner || "ALL";
              const catTxLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE&categoryId=${cat.id}&view=${view}`;
              return (
                <Link
                  key={itemKey(cat.id, cat.owner || OWNER_ALL)}
                  href={catTxLink}
                  className="flex items-center justify-between text-xs group/cat hover:bg-muted/60 rounded px-1 -mx-1 py-0.5 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#a1a1aa" }} />
                    {cat.name}
                    {ownerLabel(cat.owner) && (
                      <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal">
                        {ownerLabel(cat.owner)}
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 ml-2 font-medium flex items-center gap-0.5">
                    {IDR(cat.spent, true)}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover/cat:opacity-100 transition-opacity" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Icon / Color Picker ───────────────────────────────────────────────────────

function IconColorPicker({
  icon, color, onIconChange, onColorChange,
}: {
  icon: string;
  color: string;
  onIconChange: (v: string) => void;
  onColorChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 w-64">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {ENVELOPE_ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => onIconChange(ic)}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all",
                icon === ic ? "bg-primary/10 ring-2 ring-primary scale-105" : "hover:bg-muted"
              )}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Color</p>
        <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
          {ENVELOPE_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              style={{ backgroundColor: c }}
              className={cn(
                "w-5 h-5 rounded-full shadow-sm transition-all",
                color === c ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-offset-zinc-900 scale-110" : "hover:scale-110"
              )}
            >
              {color === c && <Check className="w-3 h-3 text-white mx-auto drop-shadow" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Manage Envelopes Dialog ──────────────────────────────────────────────────

function ManageEnvelopesDialog({
  open, onOpenChange, envelopes, categories, income, period, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  envelopes: EnvelopeOverview[];
  categories: ICategory[];
  income: number;
  period: string;
  onSaved: () => void;
}) {
  const [localEnvelopes, setLocalEnvelopes] = useState<EnvelopeOverview[]>([]);
  const [localIncome, setLocalIncome] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("manage");
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<EnvelopeFrequency>("MONTHLY");
  const [addIcon, setAddIcon] = useState(ENVELOPE_ICONS[0]);
  const [addColor, setAddColor] = useState(ENVELOPE_COLORS[0]);
  const [addItems, setAddItems] = useState<EnvelopeItem[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [editingItemsForIndex, setEditingItemsForIndex] = useState<number | null>(null);
  const [itemsSearch, setItemsSearch] = useState("");

  useEffect(() => {
    if (open) {
      setLocalEnvelopes([...envelopes]);
      setLocalIncome(income);
      setActiveTab(envelopes.length === 0 ? "new" : "manage");
      setAddName("");
      setAddType("MONTHLY");
      setAddIcon(ENVELOPE_ICONS[0]);
      setAddColor(ENVELOPE_COLORS[0]);
      setAddItems([]);
      setCategorySearch("");
      setEditingItemsForIndex(null);
      setItemsSearch("");
    }
  }, [open, envelopes, income]);

  const handleSave = async () => {
    if (localEnvelopes.length === 0) {
      toast.error("Add at least one envelope");
      return;
    }
    const trimmed = localEnvelopes.map(e => e.name.trim());
    if (trimmed.some(n => !n)) {
      toast.error("Envelope name can't be empty");
      return;
    }
    const lower = trimmed.map(n => n.toLowerCase());
    if (new Set(lower).size !== lower.length) {
      toast.error("Two envelopes have the same name");
      return;
    }
    setSaving(true);
    try {
      await BudgetService.upsertEnvelopes(period, localEnvelopes, localIncome);
      onSaved();
      onOpenChange(false);
      toast.success("Envelopes updated");
    } catch {
      toast.error("Failed to update envelopes");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!addName.trim() || addItems.length === 0) return;

    // Prevent overlapping names
    if (localEnvelopes.some(e => e.name.toLowerCase() === addName.toLowerCase())) {
        toast.error("Envelope name already exists");
        return;
    }

    const newEnv: EnvelopeOverview = {
      name: addName.trim(),
      type: addType,
      items: addItems,
      icon: addIcon,
      color: addColor,
      limit: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      safeToSpendToday: 0,
      categories: []
    };
    setLocalEnvelopes([...localEnvelopes, newEnv]);
    setAddName("");
    setAddType("MONTHLY");
    setAddIcon(ENVELOPE_ICONS[0]);
    setAddColor(ENVELOPE_COLORS[0]);
    setAddItems([]);
    setActiveTab("manage");
  };

  // Keyed by index, not name -- name is editable now, so it can't double as
  // a stable identifier the way it used to.
  const updateEnvelopeAt = (index: number, patch: Partial<EnvelopeOverview>) => {
    setLocalEnvelopes(localEnvelopes.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const handleRemove = (index: number) => {
    setLocalEnvelopes(localEnvelopes.filter((_, i) => i !== index));
  };

  const handleUpdateLimit = (index: number, limit: number) => updateEnvelopeAt(index, { limit });
  const handleUpdateItems = (index: number, items: EnvelopeItem[]) => updateEnvelopeAt(index, { items });
  const handleUpdateType = (index: number, type: EnvelopeFrequency) => updateEnvelopeAt(index, { type });
  const handleUpdateName = (index: number, name: string) => updateEnvelopeAt(index, { name });
  const handleUpdateIcon = (index: number, icon: string) => updateEnvelopeAt(index, { icon });
  const handleUpdateColor = (index: number, color: string) => updateEnvelopeAt(index, { color });

  // Keys already claimed by any envelope, optionally excluding one (so an
  // envelope's own items don't block themselves while being edited). Keyed
  // by (categoryId, owner) only -- Type is just a pacing label now (spend
  // is always tracked for the current month regardless of Type), so the
  // same category can't be reused across envelopes just because they have
  // different Types; it would show the identical Spent figure twice.
  const buildUsedKeys = (excludeIndex?: number) => {
    const keys = new Set<string>();
    localEnvelopes.forEach((e, i) => {
      if (i === excludeIndex) return;
      (e.items || []).forEach((item) => keys.add(itemKey(item.categoryId, item.owner)));
    });
    return keys;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-5 shrink-0">
          <div className="absolute -right-3 -top-3 opacity-10">
            <Wallet className="w-24 h-24 text-white" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Settings2 className="w-4 h-4" />
              </div>
              Manage Envelopes
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-xs mt-1">
              Group categories together, split by person, and set monthly limits.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 grid grid-cols-2 shrink-0">
            <TabsTrigger value="manage" className="gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Envelopes
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{localEnvelopes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5">
              <ListPlus className="w-3.5 h-3.5" /> New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="flex-1 overflow-y-auto px-6 py-4 mt-0 space-y-2">
            {localEnvelopes.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <Wallet className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No envelopes yet.</p>
                <Button variant="link" size="sm" onClick={() => setActiveTab("new")}>Create your first one</Button>
              </div>
            ) : (
              localEnvelopes.map((env, index) => {
                const isEditingItems = editingItemsForIndex === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-xl border bg-card text-sm overflow-hidden transition-shadow",
                      isEditingItems ? "shadow-sm ring-1 ring-primary/20" : "hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner text-lg hover:ring-2 hover:ring-primary/40 transition-all"
                            style={{ backgroundColor: env.color || "#6366f1" }}
                          >
                            {isEmojiIcon(env.icon) ? env.icon : <Wallet className="w-4 h-4" />}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <IconColorPicker
                            icon={env.icon}
                            color={env.color}
                            onIconChange={(v) => handleUpdateIcon(index, v)}
                            onColorChange={(v) => handleUpdateColor(index, v)}
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={env.name}
                          onChange={(e) => handleUpdateName(index, e.target.value)}
                          className="font-semibold truncate bg-transparent outline-none w-full rounded px-0.5 -mx-0.5 focus:ring-1 focus:ring-primary/30"
                        />
                        <div className="flex items-center gap-1 -ml-1.5">
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pl-1.5"
                            onClick={() => {
                              if (isEditingItems) {
                                setEditingItemsForIndex(null);
                              } else {
                                setEditingItemsForIndex(index);
                                setItemsSearch("");
                              }
                            }}
                          >
                            {(env.items?.length || 0)} items
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isEditingItems && "rotate-180")} />
                          </button>
                          <span className="text-muted-foreground/40 text-xs">&middot;</span>
                          <Select value={env.type} onValueChange={(v) => handleUpdateType(index, v as EnvelopeFrequency)}>
                            <SelectTrigger className="h-5 w-auto border-none shadow-none px-1.5 text-xs gap-1 text-muted-foreground hover:text-foreground focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCIES.map(f => (
                                <SelectItem key={f} value={f} className="text-xs">{frequencyLabel(f)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <MoneyInput
                        value={env.limit}
                        onValueChange={(val) => handleUpdateLimit(index, Number(val))}
                        className="w-24 h-8 text-right shrink-0"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => handleRemove(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {isEditingItems && (
                      <div className="px-3 pb-3">
                        <CategoryItemPicker
                          categories={categories}
                          selectedItems={env.items || []}
                          usedKeys={buildUsedKeys(index)}
                          onChange={(items) => handleUpdateItems(index, items)}
                          search={itemsSearch}
                          onSearchChange={setItemsSearch}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="new" className="flex-1 overflow-y-auto px-6 py-4 mt-0 space-y-4">
            <div className="flex gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner ring-4 ring-white dark:ring-zinc-800"
                style={{ backgroundColor: addColor }}
              >
                {addIcon}
              </div>
              <input
                type="text"
                placeholder="Envelope Name (e.g. Daily Needs)"
                className="flex-1 h-9 self-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={addName}
                onChange={e => setAddName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {FREQUENCIES.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAddType(f)}
                  className={cn(
                    "h-8 rounded-lg text-xs font-medium transition-all",
                    addType === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted hover:bg-muted/70 text-muted-foreground"
                  )}
                >
                  {frequencyLabel(f)}
                </button>
              ))}
            </div>

            <IconColorPicker
              icon={addIcon}
              color={addColor}
              onIconChange={setAddIcon}
              onColorChange={setAddColor}
            />

            <CategoryItemPicker
              categories={categories}
              selectedItems={addItems}
              usedKeys={buildUsedKeys()}
              onChange={setAddItems}
              search={categorySearch}
              onSearchChange={setCategorySearch}
            />

            <Button
                onClick={handleAdd}
                disabled={!addName.trim() || addItems.length === 0}
                className="w-full shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
            >
                <Plus className="w-4 h-4 mr-2" /> Add Envelope
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-muted/30 sm:justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="shadow-sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Item Picker ─────────────────────────────────────────────────────
// Picks (category, owner) items for an envelope. Each category is exactly
// one of: Gabung (combined) / Adam / Sasti -- one flat choice per row, no
// expand step. Picking a different option swaps it; picking the active one
// again clears it.

function CategoryItemPicker({
  categories, selectedItems, usedKeys, onChange, search, onSearchChange,
}: {
  categories: ICategory[];
  selectedItems: EnvelopeItem[];
  usedKeys: Set<string>;
  onChange: (items: EnvelopeItem[]) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Same grouping as the Categories page: bucket by `group`, "Others" last.
  const groupedFiltered = (() => {
    const map: Record<string, ICategory[]> = {};
    filtered.forEach(cat => {
      const key = cat.group || "Others";
      (map[key] ||= []).push(cat);
    });
    const groupNames = Object.keys(map).sort((a, b) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return a.localeCompare(b);
    });
    return groupNames.map(group => ({ group, items: map[group] }));
  })();

  const activeOwnerFor = (categoryId: string): EnvelopeOwner | null => {
    const item = selectedItems.find(i => i.categoryId === categoryId);
    return item ? item.owner : null;
  };

  // A category already claimed elsewhere as "Gabung" blocks Adam AND Sasti
  // too (their spend is already counted in that combined total), and a
  // category already claimed for one specific person blocks "Gabung" (it
  // would double-count that person's spend). Applies regardless of Type --
  // Type is just a pacing label, spend is always the same month-scoped
  // figure either way. Doesn't block re-selecting whatever this exact
  // category is already set to in THIS picker.
  const isUsedElsewhere = (categoryId: string, owner: EnvelopeOwner) =>
    usedKeys.has(itemKey(categoryId, owner)) && activeOwnerFor(categoryId) !== owner;

  const isDisabled = (categoryId: string, owner: EnvelopeOwner) => {
    if (owner === OWNER_ALL) {
      return isUsedElsewhere(categoryId, OWNER_ALL) || isUsedElsewhere(categoryId, "ADAM") || isUsedElsewhere(categoryId, "SASTI");
    }
    return isUsedElsewhere(categoryId, OWNER_ALL) || isUsedElsewhere(categoryId, owner);
  };

  const selectOwner = (categoryId: string, owner: EnvelopeOwner) => {
    const rest = selectedItems.filter(i => i.categoryId !== categoryId);
    if (activeOwnerFor(categoryId) === owner) {
      onChange(rest); // clicking the active choice again clears it
    } else {
      onChange([...rest, { categoryId, owner }]);
    }
  };

  const selectableForAll = filtered.filter(c => !isDisabled(c._id as string, OWNER_ALL));
  const allSelected = filtered.length > 0 && filtered.every(c => activeOwnerFor(c._id as string) !== null);
  const toggleSelectAll = () => {
    if (allSelected) {
      const ids = new Set(filtered.map(c => c._id as string));
      onChange(selectedItems.filter(i => !ids.has(i.categoryId)));
    } else {
      const additions = selectableForAll
        .filter(c => activeOwnerFor(c._id as string) === null)
        .map(c => ({ categoryId: c._id as string, owner: OWNER_ALL as EnvelopeOwner }));
      onChange([...selectedItems, ...additions]);
    }
  };

  return (
    <div className="p-3 border rounded-md space-y-2 max-h-56 flex flex-col bg-muted/30">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">Select Categories</span>
        {filtered.length > 0 && (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={toggleSelectAll}>
            {allSelected ? "Clear All" : "Select All"}
          </Button>
        )}
      </div>
      <input
        type="text"
        placeholder="Search categories..."
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-2"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <div className="space-y-3 overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-2">No categories found.</p>
        ) : (
          groupedFiltered.map(({ group, items }) => (
            <div key={group} className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {group}
              </p>
              {items.map(cat => {
                const id = cat._id as string;
                const active = activeOwnerFor(id);
                return (
                  <div key={id} className="flex items-center gap-2 p-1 rounded transition-colors">
                    <span className="text-sm font-medium flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {(["", "ADAM", "SASTI"] as EnvelopeOwner[]).map(owner => {
                        const selected = active === owner;
                        const disabled = isDisabled(id, owner);
                        return (
                          <Button
                            key={owner || "ALL"}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            disabled={disabled}
                            title={disabled ? "Already used in another envelope" : undefined}
                            className="h-6 text-[11px] px-2"
                            onClick={() => selectOwner(id, owner)}
                          >
                            {owner === OWNER_ALL ? "Gabung" : ownerLabel(owner)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
