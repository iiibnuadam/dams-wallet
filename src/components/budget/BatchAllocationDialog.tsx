import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, AlertCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  group?: string;
  bucket?: string;
}

interface BudgetGroup {
  _id?: string;
  name: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  limit?: number;
  icon: string;
  color: string;
  targetGroup?: string;
  categories?: string[];
  items: any[];
  trackingType?: "DAILY" | "WEEKLY" | "MONTHLY";
}

interface BatchAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  existingGroups: BudgetGroup[];
  onSave: (groups: BudgetGroup[]) => void;
  income: number;
}

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"
];

// Helper to get random color/icon deterministically
const getGroupMeta = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length];
    
    // Simple icon mapping or default
    const icons: Record<string, string> = {
        "Food": "🍔", "Transport": "🚗", "Housing": "🏠", "Shopping": "🛍️",
        "Utility": "💡", "Entertainment": "🎬", "Health": "🏥", "Education": "🎓"
    };
    return { color, icon: icons[name] || "📁" };
};

export function BatchAllocationDialog({ open, onOpenChange, categories, existingGroups, onSave, income }: BatchAllocationDialogProps) {
  const [needsRatio, setNeedsRatio] = useState<number>(70);

  const [globalTotal, setGlobalTotal] = useState<number>(0);
  const [globalOverrides, setGlobalOverrides] = useState<Record<string, number>>({}); 
  const [overrideTypes, setOverrideTypes] = useState<Record<string, "AUTO" | "NEEDS" | "WANTS">>({});

  // Derived calculations
  const availableGroups = useMemo(() => {
      return Array.from(new Set(categories.map(c => c.group).filter(Boolean))) as string[];
  }, [categories]);

  // Pre-fill from existing if available?
  // Only if they are Smart Groups (targetGroup exists)
  useEffect(() => {
      if (open) {
          setGlobalTotal(0);
          setGlobalOverrides({});
          setOverrideTypes({});

          // Attempt to pre-fill Global Mode (heuristic)
          // If we find "General Living" or similar default groups? 
          // For now, start fresh or use total income as hint
          if (income > 0) setGlobalTotal(income);
      }
  }, [open, availableGroups, existingGroups, income]);



  const handleOverrideChange = (group: string, val: number) => {
      setGlobalOverrides(prev => ({ ...prev, [group]: val }));
  };

  const handleTypeChange = (group: string, type: "AUTO" | "NEEDS" | "WANTS") => {
      setOverrideTypes(prev => ({ ...prev, [group]: type }));
  };

  // Calculations
  const needsPercent = needsRatio / 100;
  const wantsPercent = 1 - needsPercent;



  // -- Global Mode Stats
  const globalNeedsTotal = globalTotal * needsPercent;
  const globalWantsTotal = globalTotal * wantsPercent;
  
  // Calculate deductions from pools based on override type
  let deductionNeeds = 0;
  let deductionWants = 0;
  let totalOverrideAmount = 0;

  Object.entries(globalOverrides).forEach(([group, amount]) => {
      totalOverrideAmount += amount;
      const type = overrideTypes[group] || "AUTO";
      if (type === "AUTO") {
          deductionNeeds += amount * needsPercent;
          deductionWants += amount * wantsPercent;
      } else if (type === "NEEDS") {
          deductionNeeds += amount;
      } else if (type === "WANTS") {
          deductionWants += amount;
      }
  });

  // Calculate Initial Residuals
  let rNeeds = globalNeedsTotal - deductionNeeds;
  let rWants = globalWantsTotal - deductionWants;

  // Handle Overflow (Spillover)
  // If Needs are overspent, take from Wants
  if (rNeeds < 0) {
      rWants += rNeeds; // Reduce Wants by the deficit
      rNeeds = 0;
  }
  // If Wants are overspent, take from Needs
  if (rWants < 0) {
      rNeeds += rWants; // Reduce Needs by the deficit
      rWants = 0;
  }
  
  const residualNeeds = Math.max(0, rNeeds);
  const residualWants = Math.max(0, rWants);
  
  // Final Totals
  const actualTotalAllocated = totalOverrideAmount + residualNeeds + residualWants;
  const isTotalOver = actualTotalAllocated > globalTotal;

  const handleSave = () => {
      const newGroups: BudgetGroup[] = [];

        // GLOBAL MODE
        
        // 1. Create Overrides
        Object.entries(globalOverrides).forEach(([groupName, total]) => {
            if (total <= 0) return;
            const { icon, color } = getGroupMeta(groupName);
            const type = overrideTypes[groupName] || "AUTO";

            if (type === "AUTO" || type === "NEEDS") {
                const limit = type === "AUTO" ? total * needsPercent : total;
                newGroups.push({
                    name: groupName + (type === "NEEDS" ? "" : ""), // Keep simple name? Or append suffix? Design choice: Keep simple name, type distinguished by bucket
                    type: "NEEDS", icon, color, limit,
                    targetGroup: groupName, trackingType: "MONTHLY", items: [], categories: []
                });
            }

            if (type === "AUTO" || type === "WANTS") {
                const limit = type === "AUTO" ? total * wantsPercent : total;
                newGroups.push({
                    name: groupName, // Duplicate name allowed for different types? Yes, effectively creates pairs
                    type: "WANTS", icon, color, limit,
                    targetGroup: groupName, trackingType: "MONTHLY", items: [], categories: []
                });
            }
        });

        // 2. Create Residuals (General Pools)
        // Find all categories NOT in overrides
        const overrideKeys = Object.keys(globalOverrides).filter(k => globalOverrides[k] > 0);
        
        // We can't easily rely on targetGroup for "Everything except X".
        // Strategy: Explicitly find all categories that do NOT belong to an overridden group.
        // Then assign them to these new groups manually.
        const residualCategories = categories.filter(c => !c.group || !overrideKeys.includes(c.group));
        
        // Needs Residual
        const needsCats = residualCategories.filter(c => c.bucket === 'NEEDS' || !c.bucket).map(c => c._id);
        if (residualNeeds > 0 || needsCats.length > 0) {
            newGroups.push({
                name: "General Living", type: "NEEDS", icon: "🛡️", color: "#3b82f6", limit: residualNeeds,
                trackingType: "MONTHLY", items: [], categories: needsCats,
                // No targetGroup, specific cats
            });
        }
        
        // Wants Residual
        const wantsCats = residualCategories.filter(c => c.bucket === 'WANTS').map(c => c._id);
        if (residualWants > 0 || wantsCats.length > 0) {
            newGroups.push({
                name: "Lifestyle & Fun", type: "WANTS", icon: "🎉", color: "#8b5cf6", limit: residualWants,
                trackingType: "MONTHLY", items: [], categories: wantsCats,
            });
        }

      onSave(newGroups);
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" /> Batch Budget Wizard
            </DialogTitle>
            <DialogDescription>
                Choose how you want to plan your monthly budget.
            </DialogDescription>
            </DialogHeader>
        </div>

             <div className="flex-1 p-6 space-y-6 flex flex-col min-h-0 overflow-y-auto">
                 {/* Shared Global Ratio */}
                 <div className="bg-muted/30 p-4 rounded-xl space-y-4 border shrink-0">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <Label className="text-xs uppercase text-muted-foreground font-bold">Needs / Wants Ratio</Label>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-primary text-xs"><span className="w-2 h-2 rounded-full bg-primary" /> Needs {needsRatio}%</span>
                            <span className="flex items-center gap-1 text-purple-500 text-xs"><span className="w-2 h-2 rounded-full bg-purple-500" /> Wants {100 - needsRatio}%</span>
                        </div>
                    </div>
                    <Slider 
                        value={[needsRatio]} 
                        onValueChange={(vals: number[]) => setNeedsRatio(vals[0])} 
                        max={100} 
                        step={5} 
                    />
                </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label>Global Monthly Budget</Label>
                             <div className="flex gap-4 items-center">
                                 <MoneyInput value={globalTotal} onValueChange={(v) => setGlobalTotal(Number(v))} className="text-2xl h-14 font-bold" />
                             </div>
                             <p className="text-xs text-muted-foreground">This amount will be split {needsRatio}/{100-needsRatio} for ALL categories.</p>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t">
                             <div className="flex items-center justify-between">
                                  <Label className="uppercase text-xs font-bold text-muted-foreground">Specific Group Overrides (Optional)</Label>
                                  <span className="text-xs text-muted-foreground">Only set if you need a specific limit for a group.</span>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                {availableGroups.map(group => {
                                    const meta = getGroupMeta(group);
                                    const type = overrideTypes[group] || "AUTO";
                                    const groupCats = categories.filter(c => c.group === group);
                                    
                                    return (
                                        <div key={group} className="border rounded-lg p-3 flex flex-col gap-3 bg-card shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-xl shrink-0 border">{meta.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate flex items-center gap-2">
                                                        {group}
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background text-muted-foreground font-normal">{groupCats.length} cats</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {groupCats.slice(0, 5).map(c => (
                                                            <span key={c._id} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground border truncate max-w-[100px]">{c.name}</span>
                                                        ))}
                                                        {groupCats.length > 5 && <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{groupCats.length - 5} more</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-dashed">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Override:</span>
                                                <Select value={type} onValueChange={(v: any) => handleTypeChange(group, v)}>
                                                    <SelectTrigger className="h-7 w-[90px] text-[10px] px-2 bg-background border shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AUTO">Auto Split</SelectItem>
                                                        <SelectItem value="NEEDS">Needs Only</SelectItem>
                                                        <SelectItem value="WANTS">Wants Only</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex-1">
                                                    <MoneyInput 
                                                        value={globalOverrides[group] || 0} 
                                                        onValueChange={(v) => handleOverrideChange(group, Number(v))} 
                                                        className="w-full h-7 text-right text-sm bg-background border shadow-sm"
                                                        placeholder="Auto"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    </div>
            </div>

        {/* Global Footer Summary */}
        <div className="p-6 border-t bg-muted/10 space-y-4">
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Residual Pool (Everything Else)</p>
                          <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                  <span>General Needs</span>
                                  <span className="font-bold text-primary">{new Intl.NumberFormat("id-ID", { notation: "compact" }).format(residualNeeds)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span>General Wants</span>
                                  <span className="font-bold text-purple-600">{new Intl.NumberFormat("id-ID", { notation: "compact" }).format(residualWants)}</span>
                              </div>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Total {isTotalOver ? 'Allocated' : 'Budget'}</p>
                          <p className={cn("text-2xl font-black", isTotalOver ? "text-red-500" : "text-foreground")}>
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(actualTotalAllocated)}
                          </p>
                          {isTotalOver && <p className="text-[10px] text-red-500 font-medium">Exceeds Target by {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(actualTotalAllocated - globalTotal)}</p>}
                      </div>
                  </div>

             <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-purple-600 text-white min-w-[150px]">
                    <Wand2 className="w-4 h-4 mr-2" /> 
                    Generate Global Budget
                </Button>
             </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
