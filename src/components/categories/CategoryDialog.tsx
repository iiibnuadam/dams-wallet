"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategoryAction, updateCategoryAction } from "@/actions/category-actions";
import { CategoryType, ICategory } from "@/types/category";
import { Loader2, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Extensive list of Tailwind colors (shades 300, 500, 700 for variety)
// "Kotak kecil2 nggabung" -> Dense grid of small squares
const PRESET_COLORS = [
    // Grays / Neutrals
    { label: "Slate 500", value: "bg-slate-500", ring: "ring-slate-500" },
    { label: "Zinc 500", value: "bg-zinc-500", ring: "ring-zinc-500" },
    { label: "Stone 500", value: "bg-stone-500", ring: "ring-stone-500" },
    { label: "Neutral 800", value: "bg-neutral-800", ring: "ring-neutral-800" },
    
    // Reds
    { label: "Red 300", value: "bg-red-300", ring: "ring-red-300" },
    { label: "Red 500", value: "bg-red-500", ring: "ring-red-500" },
    { label: "Red 700", value: "bg-red-700", ring: "ring-red-700" },
    
    // Oranges
    { label: "Orange 300", value: "bg-orange-300", ring: "ring-orange-300" },
    { label: "Orange 500", value: "bg-orange-500", ring: "ring-orange-500" },
    { label: "Orange 700", value: "bg-orange-700", ring: "ring-orange-700" },
    
    // Ambers
    { label: "Amber 300", value: "bg-amber-300", ring: "ring-amber-300" },
    { label: "Amber 500", value: "bg-amber-500", ring: "ring-amber-500" },
    { label: "Amber 700", value: "bg-amber-700", ring: "ring-amber-700" },
    
    // Yellows
    { label: "Yellow 300", value: "bg-yellow-300", ring: "ring-yellow-300" },
    { label: "Yellow 500", value: "bg-yellow-500", ring: "ring-yellow-500" },
    { label: "Yellow 700", value: "bg-yellow-700", ring: "ring-yellow-700" },
    
    // Limes
    { label: "Lime 300", value: "bg-lime-300", ring: "ring-lime-300" },
    { label: "Lime 500", value: "bg-lime-500", ring: "ring-lime-500" },
    { label: "Lime 700", value: "bg-lime-700", ring: "ring-lime-700" },
    
    // Greens
    { label: "Green 300", value: "bg-green-300", ring: "ring-green-300" },
    { label: "Green 500", value: "bg-green-500", ring: "ring-green-500" },
    { label: "Green 700", value: "bg-green-700", ring: "ring-green-700" },
    
    // Emeralds
    { label: "Emerald 300", value: "bg-emerald-300", ring: "ring-emerald-300" },
    { label: "Emerald 500", value: "bg-emerald-500", ring: "ring-emerald-500" },
    { label: "Emerald 700", value: "bg-emerald-700", ring: "ring-emerald-700" },
    
    // Teals
    { label: "Teal 300", value: "bg-teal-300", ring: "ring-teal-300" },
    { label: "Teal 500", value: "bg-teal-500", ring: "ring-teal-500" },
    { label: "Teal 700", value: "bg-teal-700", ring: "ring-teal-700" },
    
    // Cyans
    { label: "Cyan 300", value: "bg-cyan-300", ring: "ring-cyan-300" },
    { label: "Cyan 500", value: "bg-cyan-500", ring: "ring-cyan-500" },
    { label: "Cyan 700", value: "bg-cyan-700", ring: "ring-cyan-700" },
    
    // Skys
    { label: "Sky 300", value: "bg-sky-300", ring: "ring-sky-300" },
    { label: "Sky 500", value: "bg-sky-500", ring: "ring-sky-500" },
    { label: "Sky 700", value: "bg-sky-700", ring: "ring-sky-700" },
    
    // Blues
    { label: "Blue 300", value: "bg-blue-300", ring: "ring-blue-300" },
    { label: "Blue 500", value: "bg-blue-500", ring: "ring-blue-500" },
    { label: "Blue 700", value: "bg-blue-700", ring: "ring-blue-700" },
    
    // Indigos
    { label: "Indigo 300", value: "bg-indigo-300", ring: "ring-indigo-300" },
    { label: "Indigo 500", value: "bg-indigo-500", ring: "ring-indigo-500" },
    { label: "Indigo 700", value: "bg-indigo-700", ring: "ring-indigo-700" },
    
    // Violets
    { label: "Violet 300", value: "bg-violet-300", ring: "ring-violet-300" },
    { label: "Violet 500", value: "bg-violet-500", ring: "ring-violet-500" },
    { label: "Violet 700", value: "bg-violet-700", ring: "ring-violet-700" },
    
    // Purples
    { label: "Purple 300", value: "bg-purple-300", ring: "ring-purple-300" },
    { label: "Purple 500", value: "bg-purple-500", ring: "ring-purple-500" },
    { label: "Purple 700", value: "bg-purple-700", ring: "ring-purple-700" },
    
    // Fuchsias
    { label: "Fuchsia 300", value: "bg-fuchsia-300", ring: "ring-fuchsia-300" },
    { label: "Fuchsia 500", value: "bg-fuchsia-500", ring: "ring-fuchsia-500" },
    { label: "Fuchsia 700", value: "bg-fuchsia-700", ring: "ring-fuchsia-700" },
    
    // Pinks
    { label: "Pink 300", value: "bg-pink-300", ring: "ring-pink-300" },
    { label: "Pink 500", value: "bg-pink-500", ring: "ring-pink-500" },
    { label: "Pink 700", value: "bg-pink-700", ring: "ring-pink-700" },
    
    // Roses
    { label: "Rose 300", value: "bg-rose-300", ring: "ring-rose-300" },
    { label: "Rose 500", value: "bg-rose-500", ring: "ring-rose-500" },
    { label: "Rose 700", value: "bg-rose-700", ring: "ring-rose-700" },
];

const PRESET_ICONS = [
    "🍔", "🍕", "☕", "🛒", "🛍️", "🎁", "💊", "🏥", 
    "🎬", "🎮", "⚽", "🏖️", "✈️", "🚗", "⛽", "🏠", 
    "💡", "💧", "📱", "💻", "💼", "💰", "💳", "🏦",
    "🎓", "📚", "👶", "🐶", "🔧", "🌱", "🏋️", "🧘",
    "🏃", "🛌", "🚿", "🧹", "🧺", "🍽️", "🥤", "🦷",
    "💇", "💅", "👓", "🕶️", "🎩", "🧥", "👔", "👗"
];

interface CategoryDialogProps {
    category?: ICategory | null; 
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CategoryDialog({ category, trigger, open, onOpenChange }: CategoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
    const [flexibility, setFlexibility] = useState<"FIXED" | "VARIABLE">("VARIABLE");
    const [icon, setIcon] = useState("🏷️");
    const [color, setColor] = useState("bg-slate-500");
    const [group, setGroup] = useState("");
    const [bucket, setBucket] = useState<"NEEDS" | "WANTS" | "SAVINGS">("NEEDS");

    // Sync when category prop changes or dialog opens
    useEffect(() => {
        if (open || isOpen) {
            if (category) {
                setName(category.name);
                setType(category.type);
                setFlexibility(category.flexibility);
                setIcon(category.icon || "🏷️");
                setColor(category.color || "bg-slate-500");
                setGroup(category.group || "");
                setBucket(category.bucket || "NEEDS");
            } else {
                setName("");
                setType(CategoryType.EXPENSE);
                setFlexibility("VARIABLE");
                setIcon("🏷️");
                setColor("bg-slate-500");
                setGroup("");
                setBucket("NEEDS");
            }
        }
    }, [category, open, isOpen]);

    const handleOpenChange = (val: boolean) => {
        setIsOpen(val);
        onOpenChange?.(val);
        if (!val) {
             setTimeout(() => {
                 if (!category) {
                    setName("");
                    setIcon("🏷️");
                    setColor("bg-slate-500");
                 }
             }, 200);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = { name, type, flexibility, icon, color, group, bucket };
            
            if (category && category._id) {
                await updateCategoryAction(category._id, payload);
            } else {
                await createCategoryAction(payload);
            }
            
            handleOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save category. Name might be duplicate.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] overflow-hidden p-0 gap-0">
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-b">
                     <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            {category ? "Edit Category" : "New Category"}
                        </DialogTitle>
                        <DialogDescription>
                            Customize the appearance and details of your category.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Preview Section */}
                    <div className="mt-6 flex justify-center">
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in-50 duration-300">
                             <div className={cn(
                                 "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-colors ring-4 ring-white dark:ring-zinc-800",
                                 color || "bg-slate-500"
                             )}>
                                 {icon}
                             </div>
                             <div className="text-center">
                                 <p className="font-semibold text-lg leading-none">{name || "Category Name"}</p>
                                 <div className="flex items-center justify-center gap-1.5 mt-2">
                                     <span className="text-[10px] uppercase font-bold tracking-wider bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border shadow-sm">
                                        {type}
                                     </span>
                                     <span className="text-[10px] uppercase font-bold tracking-wider bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border shadow-sm">
                                        {flexibility}
                                     </span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label>Name</Label>
                                <Input 
                                    placeholder="e.g. Shopping" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required
                                    className="bg-background"
                                />
                             </div>
                         </div>

                         {type === CategoryType.EXPENSE && (
                             <div className="space-y-4 border-t pt-4 border-dashed">
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Budgeting Bucket (50/30/20 Rule)</Label>
                                    </div>
                                    <Select value={bucket} onValueChange={(v) => setBucket(v as "NEEDS" | "WANTS" | "SAVINGS")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select bucket..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEEDS">
                                                <span className="font-medium">Needs (50%)</span>
                                                <span className="text-muted-foreground ml-2 text-xs">- Essential survival costs</span>
                                            </SelectItem>
                                            <SelectItem value="WANTS">
                                                <span className="font-medium">Wants (30%)</span>
                                                <span className="text-muted-foreground ml-2 text-xs">- Lifestyle & Fun</span>
                                            </SelectItem>
                                            <SelectItem value="SAVINGS">
                                                <span className="font-medium">Savings (20%)</span>
                                                <span className="text-muted-foreground ml-2 text-xs">- Future & Debt Repayment</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>

                                 <div className="space-y-2">
                                    <Label>Group Name</Label>
                                    <Input 
                                        placeholder="e.g. Housing, Transport, Food" 
                                        value={group} 
                                        onChange={(e) => setGroup(e.target.value)} 
                                        className="bg-background"
                                        list="group-suggestions"
                                    />
                                    <datalist id="group-suggestions">
                                        <option value="Housing" />
                                        <option value="Transport" />
                                        <option value="Food" />
                                        <option value="Lifestyle" />
                                        <option value="Health" />
                                        <option value="Education" />
                                        <option value="Debt" />
                                        <option value="Social" />
                                        <option value="Family" />
                                    </datalist>
                                    <p className="text-[10px] text-muted-foreground">Used for grouping in lists.</p>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Flexibility</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p><strong>Fixed:</strong> Predictable costs like Rent, Internet, Insurance.</p>
                                                    <p className="mt-1"><strong>Variable:</strong> Fluctuating costs like Groceries, Dining out, Entertainment.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Select value={flexibility} onValueChange={(v) => setFlexibility(v as "FIXED" | "VARIABLE")}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIXED">
                                                <span className="font-medium">Fixed</span>
                                                <span className="text-muted-foreground ml-2 text-xs">- Same amount every month</span>
                                            </SelectItem>
                                            <SelectItem value="VARIABLE">
                                                <span className="font-medium">Variable</span>
                                                <span className="text-muted-foreground ml-2 text-xs">- Changes every month</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                             </div>
                         )}
                         
                         <Tabs defaultValue="icon" className="w-full">
                             <TabsList className="grid w-full grid-cols-2 mb-4">
                                 <TabsTrigger value="icon">Icon</TabsTrigger>
                                 <TabsTrigger value="color">Color</TabsTrigger>
                             </TabsList>
                             
                             <TabsContent value="icon" className="space-y-3 mt-0">
                                 <div className="flex gap-2">
                                     <Input 
                                         placeholder="Paste or type custom emoji..." 
                                         value={icon} 
                                         onChange={(e) => setIcon(e.target.value)} 
                                         maxLength={2}
                                         className="text-center font-emoji text-lg"
                                     />
                                     <div className="text-xs text-muted-foreground self-center shrink-0">
                                         Max 2 chars
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-8 gap-2 max-h-[160px] overflow-y-auto p-1">
                                     {PRESET_ICONS.map(ic => (
                                          <button
                                            key={ic}
                                            type="button"
                                            onClick={() => setIcon(ic)}
                                            className={cn(
                                                "aspect-square flex items-center justify-center text-xl rounded-md transition-all",
                                                icon === ic 
                                                    ? "bg-primary text-primary-foreground shadow-sm scale-110" 
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            )}
                                         >
                                             {ic}
                                         </button>
                                     ))}
                                 </div>
                             </TabsContent>
                             
                             <TabsContent value="color" className="space-y-3 mt-0">
                                 <div className="grid grid-cols-10 gap-1.5 max-h-[160px] overflow-y-auto p-1">
                                     {PRESET_COLORS.map(c => (
                                         <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setColor(c.value)}
                                            title={c.label}
                                            className={cn(
                                                "w-full aspect-square rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 border border-black/5 dark:border-white/5",
                                                c.value,
                                                c.ring,
                                                color === c.value ? "ring-2 ring-offset-2 ring-zinc-500 scale-110 z-10" : "hover:scale-110 hover:z-10"
                                            )}
                                         >
                                             {color === c.value && <Check className="w-3 h-3 text-white/90 mx-auto drop-shadow-md" />}
                                         </button>
                                     ))}
                                 </div>
                             </TabsContent>
                         </Tabs>

                    </div>

                    <DialogFooter className="p-6 pt-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
