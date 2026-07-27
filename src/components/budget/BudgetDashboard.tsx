"use client";

import { useState, useEffect, useCallback } from "react";
import { BudgetService } from "@/services/budget.service";
import { CategoryService } from "@/services/category.service";
import { ICategory } from "@/types/category";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings2, Plus, AlertCircle, TrendingUp, TrendingDown, Target, HelpCircle, Check, ChevronRight, CheckCircle2, MoreHorizontal, Pencil, X, Sparkles, Receipt } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MoneyInput } from "@/components/ui/money-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EnvelopeOverview {
  name: string;
  categoryIds: string[];
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  safeToSpendToday: number;
}

interface BudgetOverview {
  period: string;
  income: number;
  realizedIncome: number;
  envelopes: EnvelopeOverview[];
  unbudgetedSpent: number;
  totalBudget: number;
  totalSpent: number;
  totalNeeds: number;
  totalWants: number;
  daysRemaining: number;
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
        BudgetService.getBudgetOverview("ME", currentMonth), 
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
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading budget...</div>;
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
                          await BudgetService.upsertEnvelopes("ME", currentMonth, envelopes, editIncomeValue);
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
                            await BudgetService.upsertEnvelopes("ME", currentMonth, newEnv, overview.income);
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
  const catFilter = env.categoryIds?.length > 0 ? `&categoryId=${env.categoryIds.join(",")}` : "";
  const txLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE${catFilter}`;
  const isOver = env.spent > env.limit && env.limit > 0;
  const hasLimit = env.limit > 0;

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
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner"
              style={{ backgroundColor: env.color || "#6366f1" }}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold leading-none">{env.name}</h4>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                 {(env.categoryIds?.length || 0)} categories
              </p>
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
      </CardContent>
    </Card>
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
  const [addName, setAddName] = useState("");
  const [addCategoryIds, setAddCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (open) {
      setLocalEnvelopes([...envelopes]);
      setLocalIncome(income);
      setAddName("");
      setAddCategoryIds([]);
      setCategorySearch("");
    }
  }, [open, envelopes, income]);

  const handleSave = async () => {
    if (localEnvelopes.length === 0) {
      toast.error("Add at least one envelope");
      return;
    }
    setSaving(true);
    try {
      await BudgetService.upsertEnvelopes("ME", period, localEnvelopes, localIncome);
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
    if (!addName.trim() || addCategoryIds.length === 0) return;
    
    // Prevent overlapping names
    if (localEnvelopes.some(e => e.name.toLowerCase() === addName.toLowerCase())) {
        toast.error("Envelope name already exists");
        return;
    }

    const newEnv: EnvelopeOverview = {
      name: addName.trim(),
      categoryIds: addCategoryIds,
      icon: "Wallet",
      color: "#6366f1", // Default color
      limit: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      safeToSpendToday: 0
    };
    setLocalEnvelopes([...localEnvelopes, newEnv]);
    setAddName("");
    setAddCategoryIds([]);
  };

  const handleRemove = (name: string) => {
    setLocalEnvelopes(localEnvelopes.filter((e) => e.name !== name));
  };

  const handleUpdateLimit = (name: string, limit: number) => {
    setLocalEnvelopes(localEnvelopes.map((e) => (e.name === name ? { ...e, limit } : e)));
  };
  
  const toggleCategory = (id: string) => {
      setAddCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const usedCategoryIds = new Set(localEnvelopes.flatMap(e => e.categoryIds || []));
  const unusedCategories = categories.filter(c => !usedCategoryIds.has(c._id as string) && c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            Manage Custom Envelopes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center justify-between">
              Your Envelopes
              <Badge variant="secondary">{localEnvelopes.length}</Badge>
            </h4>
            <div className="space-y-2">
              {localEnvelopes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No envelopes added. Create one below!
                </p>
              ) : (
                localEnvelopes.map((env, index) => (
                  <div key={env.name || `legacy-local-${index}`} className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: env.color }}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{env.name}</p>
                        <p className="text-xs text-muted-foreground">{(env.categoryIds?.length || 0)} categories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoneyInput
                        value={env.limit}
                        onValueChange={(val) => handleUpdateLimit(env.name, Number(val))}
                        className="w-28 h-8 text-right"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemove(env.name)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            <h4 className="text-sm font-semibold">Create New Envelope</h4>
            <div className="space-y-3">
                <input 
                    type="text" 
                    placeholder="Envelope Name (e.g. Daily Needs)" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={addName} 
                    onChange={e => setAddName(e.target.value)} 
                />
                
                <div className="p-3 border rounded-md space-y-2 max-h-48 flex flex-col bg-muted/30">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Select Categories</span>
                        <span className="text-xs font-medium text-muted-foreground">No overlap allowed</span>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-2"
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                    />
                    <div className="space-y-2 overflow-y-auto flex-1">
                    {unusedCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-2">All expense categories have been assigned to envelopes.</p>
                    ) : (
                        unusedCategories.map(cat => (
                            <div key={cat._id} className="flex items-center gap-2 hover:bg-muted p-1 rounded transition-colors">
                                <Checkbox 
                                    id={`cat-${cat._id}`} 
                                    checked={addCategoryIds.includes(cat._id as string)}
                                    onCheckedChange={() => toggleCategory(cat._id as string)}
                                />
                                <Label htmlFor={`cat-${cat._id}`} className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></span>
                                    {cat.name} 
                                    <span className="ml-auto text-[10px] text-muted-foreground border px-1 rounded uppercase tracking-wider">{cat.bucket}</span>
                                </Label>
                            </div>
                        ))
                    )}
                    </div>
                </div>

                <Button 
                    onClick={handleAdd} 
                    disabled={!addName.trim() || addCategoryIds.length === 0} 
                    className="w-full shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Envelope
                </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/50 sm:justify-end gap-2">
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
