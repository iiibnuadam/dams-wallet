"use client";

import { useEffect, useState, useCallback } from "react";
import { format, endOfMonth, startOfMonth } from "date-fns";
import { getBudgetOverviewAction, upsertEnvelopesAction, getAvailableGroupsAction } from "@/actions/budget-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/money-input";
import {
  TrendingDown, Wallet, Calendar, Sparkles,
  AlertCircle, ArrowUpRight, Edit2, Check, X,
  Plus, PiggyBank, Settings2, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnvelopeOverview {
  groupName: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  safeToSpendToday: number;
  categoryIds: string[];
}

interface BudgetOverview {
  period: string;
  income: number;
  realizedIncome: number;
  envelopes: EnvelopeOverview[];
  unbudgetedSpent: number;
  totalBudget: number;
  totalSpent: number;
  daysRemaining: number;
}

interface AvailableGroup {
  groupName: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IDR = (n: number, compact = false) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetDashboard() {
  const [currentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableGroups, setAvailableGroups] = useState<AvailableGroup[]>([]);
  const [manageOpen, setManageOpen] = useState(false);

  // Inline editing state
  const [editingEnvelope, setEditingEnvelope] = useState<string | null>(null); // groupName
  const [editValue, setEditValue] = useState(0);

  // Income editing
  const [editingIncome, setEditingIncome] = useState(false);
  const [editIncomeValue, setEditIncomeValue] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, groups] = await Promise.all([
        getBudgetOverviewAction(currentMonth),
        getAvailableGroupsAction(),
      ]);
      setOverview(ov);
      setAvailableGroups(groups);
      setEditIncomeValue(ov.income || 0);
    } catch {
      toast.error("Failed to load budget");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Inline save for a single envelope limit ───────────────────────────────

  const handleSaveEnvelope = async (groupName: string, newLimit: number) => {
    if (!overview) return;
    const updatedEnvelopes = overview.envelopes.map((e) =>
      e.groupName === groupName ? { ...e, limit: newLimit } : e
    );
    try {
      await upsertEnvelopesAction(currentMonth, updatedEnvelopes, overview.income);
      setEditingEnvelope(null);
      fetchData();
      toast.success(`Limit updated`);
    } catch {
      toast.error("Failed to save");
    }
  };

  // ── Save income ───────────────────────────────────────────────────────────

  const handleSaveIncome = async () => {
    if (!overview) return;
    try {
      await upsertEnvelopesAction(currentMonth, overview.envelopes, editIncomeValue);
      setEditingIncome(false);
      fetchData();
      toast.success("Income target updated");
    } catch {
      toast.error("Failed to save income");
    }
  };

  if (loading) return <BudgetSkeleton />;
  if (!overview) return null;

  const { envelopes, totalBudget, totalSpent, realizedIncome, income, unbudgetedSpent, daysRemaining } = overview;

  const projectedSavings = Math.max(0, (income || realizedIncome) - totalBudget);
  const savingsPercent = (income || realizedIncome) > 0
    ? (projectedSavings / (income || realizedIncome)) * 100
    : 0;

  const startDate = format(startOfMonth(new Date(currentMonth)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date(currentMonth)), "yyyy-MM-dd");
  const allTxLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE`;

  const needsEnvelopes = envelopes.filter((e) => e.type === "NEEDS");
  const wantsEnvelopes = envelopes.filter((e) => e.type === "WANTS");

  return (
    <div className="min-h-screen pb-24 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(currentMonth), "MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={allTxLink}>
            <Button variant="outline" size="sm">
              <ArrowUpRight className="w-4 h-4 mr-1.5" /> All Expenses
            </Button>
          </Link>
          <ManageEnvelopesDialog
            open={manageOpen}
            onOpenChange={setManageOpen}
            envelopes={envelopes}
            availableGroups={availableGroups}
            income={overview.income}
            period={currentMonth}
            onSaved={fetchData}
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Savings Card */}
        <Card className="md:col-span-2 relative overflow-hidden text-white border-0 shadow-xl shadow-indigo-500/20 bg-gradient-to-br from-indigo-600 to-violet-700">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <PiggyBank className="w-40 h-40" />
          </div>
          <CardContent className="p-6 relative z-10 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
                  Projected Savings
                </p>
                <h2 className="text-3xl font-black tracking-tight">
                  {IDR(projectedSavings)}
                </h2>
                <p className="text-indigo-300 text-sm mt-0.5">{savingsPercent.toFixed(0)}% of income</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
                  Income Target
                </p>
                {editingIncome ? (
                  <div className="flex items-center gap-1 justify-end">
                    <MoneyInput
                      value={editIncomeValue}
                      onValueChange={(s) => setEditIncomeValue(parseInt(s) || 0)}
                      className="h-8 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/50 w-36"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={handleSaveIncome}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setEditingIncome(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="text-2xl font-bold hover:opacity-80 transition-opacity group flex items-center gap-1 justify-end w-full"
                    onClick={() => { setEditIncomeValue(income); setEditingIncome(true); }}
                  >
                    {IDR(income || realizedIncome)}
                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                )}
                {realizedIncome > 0 && income !== realizedIncome && (
                  <p className="text-indigo-300 text-[11px] mt-0.5">Actual: {IDR(realizedIncome, true)}</p>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm text-indigo-200">
              <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Budget: {IDR(totalBudget, true)}</span>
              <span className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Spent: {IDR(totalSpent, true)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Safe Spend Card */}
        <Card className="bg-card border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Safe/day</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                {IDR(envelopes.reduce((s, e) => s + e.safeToSpendToday, 0))}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Across all envelopes · <b>{daysRemaining}</b> days left
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Envelope Sections ── */}
      {envelopes.length === 0 ? (
        <EmptyState onManage={() => setManageOpen(true)} />
      ) : (
        <div className="space-y-8">
          {needsEnvelopes.length > 0 && (
            <EnvelopeSection
              title="Needs"
              type="NEEDS"
              envelopes={needsEnvelopes}
              editingEnvelope={editingEnvelope}
              editValue={editValue}
              onEditStart={(e) => { setEditingEnvelope(e.groupName); setEditValue(e.limit); }}
              onEditChange={setEditValue}
              onEditSave={handleSaveEnvelope}
              onEditCancel={() => setEditingEnvelope(null)}
              startDate={startDate}
              endDate={endDate}
            />
          )}
          {wantsEnvelopes.length > 0 && (
            <EnvelopeSection
              title="Wants"
              type="WANTS"
              envelopes={wantsEnvelopes}
              editingEnvelope={editingEnvelope}
              editValue={editValue}
              onEditStart={(e) => { setEditingEnvelope(e.groupName); setEditValue(e.limit); }}
              onEditChange={setEditValue}
              onEditSave={handleSaveEnvelope}
              onEditCancel={() => setEditingEnvelope(null)}
              startDate={startDate}
              endDate={endDate}
            />
          )}

          {/* Unbudgeted */}
          {unbudgetedSpent > 0 && (
            <div className="space-y-3">
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
                      <Button variant="ghost" size="sm" className="h-7 text-xs mt-1 text-muted-foreground">
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
    </div>
  );
}

// ─── Envelope Section ──────────────────────────────────────────────────────────

function EnvelopeSection({
  title, type, envelopes, editingEnvelope, editValue,
  onEditStart, onEditChange, onEditSave, onEditCancel,
  startDate, endDate,
}: {
  title: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  envelopes: EnvelopeOverview[];
  editingEnvelope: string | null;
  editValue: number;
  onEditStart: (e: EnvelopeOverview) => void;
  onEditChange: (v: number) => void;
  onEditSave: (groupName: string, limit: number) => void;
  onEditCancel: () => void;
  startDate: string;
  endDate: string;
}) {
  const totalLimit = envelopes.reduce((s, e) => s + e.limit, 0);
  const totalSpent = envelopes.reduce((s, e) => s + e.spent, 0);

  const typeColors = {
    NEEDS: "text-blue-600 dark:text-blue-400",
    WANTS: "text-purple-600 dark:text-purple-400",
    SAVINGS: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={cn("text-base font-bold flex items-center gap-2", typeColors[type])}>
          {title}
          <Badge variant="secondary" className="font-mono text-xs">
            {IDR(totalSpent, true)} / {IDR(totalLimit, true)}
          </Badge>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {envelopes.map((env) => (
          <EnvelopeCard
            key={env.groupName}
            env={env}
            isEditing={editingEnvelope === env.groupName}
            editValue={editValue}
            onEditStart={() => onEditStart(env)}
            onEditChange={onEditChange}
            onEditSave={() => onEditSave(env.groupName, editValue)}
            onEditCancel={onEditCancel}
            startDate={startDate}
            endDate={endDate}
          />
        ))}
      </div>
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
  const catFilter = env.categoryIds.length > 0 ? `&categoryId=${env.categoryIds.join(",")}` : "";
  const txLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE${catFilter}`;
  const isOver = env.spent > env.limit && env.limit > 0;
  const hasLimit = env.limit > 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all border-l-4 hover:shadow-md group",
        isOver ? "border-l-red-500" : ""
      )}
      style={{ borderLeftColor: isOver ? undefined : env.color }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top row: icon + name + edit button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
              style={{ backgroundColor: env.color + "20", borderColor: env.color + "40", border: "1px solid" }}
            >
              {env.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight text-foreground truncate">{env.groupName}</p>
              {hasLimit && env.safeToSpendToday > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{IDR(env.safeToSpendToday, true)}</span>/day left
                </p>
              )}
            </div>
          </div>

          {/* Spent / Limit */}
          <div className="text-right shrink-0">
            <p className={cn("font-bold text-base", isOver ? "text-red-500" : "text-foreground")}>
              {IDR(env.spent)}
            </p>
            {isEditing ? (
              <div className="flex items-center gap-1 mt-1">
                <MoneyInput
                  value={editValue}
                  onValueChange={(s) => onEditChange(parseInt(s) || 0)}
                  className="h-7 text-xs w-28 text-right"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onEditSave();
                    if (e.key === "Escape") onEditCancel();
                  }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={onEditSave}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={onEditCancel}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                className="text-xs text-muted-foreground mt-0.5 hover:text-foreground transition-colors flex items-center gap-1 justify-end w-full group/edit"
                onClick={onEditStart}
              >
                {hasLimit ? `of ${IDR(env.limit)}` : "Set limit"}
                <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/edit:opacity-60 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasLimit ? (
          <div className="space-y-1">
            <div className={cn("h-2 w-full rounded-full overflow-hidden", progressBg(env.percent))}>
              <div
                className={cn("h-full rounded-full transition-all duration-700", progressColor(env.percent))}
                style={{ width: `${env.percent}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className={cn("text-[11px] font-semibold", progressTextColor(env.percent))}>
                {env.percent.toFixed(0)}% used
              </span>
              <Link href={txLink}>
                <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-2 w-full bg-muted rounded-full" />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Manage Envelopes Dialog ───────────────────────────────────────────────────

function ManageEnvelopesDialog({
  open, onOpenChange, envelopes, availableGroups, income, period, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  envelopes: EnvelopeOverview[];
  availableGroups: AvailableGroup[];
  income: number;
  period: string;
  onSaved: () => void;
}) {
  const [localEnvelopes, setLocalEnvelopes] = useState<EnvelopeOverview[]>([]);
  const [localIncome, setLocalIncome] = useState(0);
  const [saving, setSaving] = useState(false);
  const [addGroupName, setAddGroupName] = useState("");

  useEffect(() => {
    if (open) {
      setLocalEnvelopes([...envelopes]);
      setLocalIncome(income);
      setAddGroupName("");
    }
  }, [open, envelopes, income]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertEnvelopesAction(period, localEnvelopes, localIncome);
      onSaved();
      onOpenChange(false);
      toast.success("Budget updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEnvelope = () => {
    if (!addGroupName) return;
    const group = availableGroups.find((g) => g.groupName === addGroupName);
    if (!group) return;
    if (localEnvelopes.find((e) => e.groupName === group.groupName)) {
      toast.error("Envelope already exists");
      return;
    }
    setLocalEnvelopes([...localEnvelopes, {
      groupName: group.groupName,
      type: group.type,
      icon: group.icon,
      color: group.color,
      limit: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      safeToSpendToday: 0,
      categoryIds: [],
    }]);
    setAddGroupName("");
  };

  const handleRemove = (groupName: string) => {
    setLocalEnvelopes(localEnvelopes.filter((e) => e.groupName !== groupName));
  };

  const handleLimitChange = (groupName: string, limit: number) => {
    setLocalEnvelopes(localEnvelopes.map((e) => e.groupName === groupName ? { ...e, limit } : e));
  };

  const handleTypeChange = (groupName: string, type: "NEEDS" | "WANTS" | "SAVINGS") => {
    setLocalEnvelopes(localEnvelopes.map((e) => e.groupName === groupName ? { ...e, type } : e));
  };

  const existingGroupNames = new Set(localEnvelopes.map((e) => e.groupName));
  const unaddedGroups = availableGroups.filter((g) => !existingGroupNames.has(g.groupName));

  const totalBudget = localEnvelopes.reduce((s, e) => s + e.limit, 0);
  const projectedSavings = Math.max(0, localIncome - totalBudget);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-1.5" /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Manage Envelopes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Income */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Income Target
              </Label>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Savings: {IDR(projectedSavings)}
              </span>
            </div>
            <MoneyInput value={localIncome} onValueChange={(s) => setLocalIncome(parseInt(s) || 0)} className="bg-white dark:bg-background" />
          </div>

          {/* Add Envelope */}
          {unaddedGroups.length > 0 && (
            <div className="flex gap-2">
              <Select value={addGroupName} onValueChange={setAddGroupName}>
                <SelectTrigger className="flex-1 text-sm">
                  <SelectValue placeholder="Add envelope..." />
                </SelectTrigger>
                <SelectContent>
                  {unaddedGroups.map((g) => (
                    <SelectItem key={g.groupName} value={g.groupName}>
                      {g.icon} {g.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAddEnvelope} disabled={!addGroupName}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Envelope List */}
          <div className="space-y-2">
            {localEnvelopes.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No envelopes yet. Add one above.</p>
            )}
            {localEnvelopes.map((env) => (
              <div
                key={env.groupName}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <span className="text-xl shrink-0">{env.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm truncate">{env.groupName}</span>
                    <Select
                      value={env.type}
                      onValueChange={(v) => handleTypeChange(env.groupName, v as "NEEDS" | "WANTS" | "SAVINGS")}
                    >
                      <SelectTrigger className="h-5 text-[10px] px-1.5 w-auto border-dashed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEEDS">Needs</SelectItem>
                        <SelectItem value="WANTS">Wants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <MoneyInput
                    value={env.limit}
                    onValueChange={(s) => handleLimitChange(env.groupName, parseInt(s) || 0)}
                    className="h-8 text-sm"
                    placeholder="Monthly limit..."
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(env.groupName)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-2 pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-bold text-foreground">{IDR(totalBudget)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onManage }: { onManage: () => void }) {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10 space-y-4">
      <div className="text-5xl">💸</div>
      <div>
        <p className="font-semibold text-lg text-foreground">No envelopes yet</p>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
          Set spending limits per category group to start tracking your budget.
        </p>
      </div>
      <Button onClick={onManage} className="gap-2">
        <Settings2 className="w-4 h-4" /> Set Up Budget
      </Button>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function BudgetSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="md:col-span-2 h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
