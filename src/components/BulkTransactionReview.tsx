import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { ParsedTransactionResult, createBatchTransactions } from "@/services/transaction.service";
import { toast } from "sonner";
import { CategoryCombobox } from "@/components/ui/category-combobox";

interface BulkTransactionReviewProps {
  items: ParsedTransactionResult[];
  categories: any[];
  wallets: any[];
  defaultWalletId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BulkTransactionReview({ items: initialItems, categories, wallets, defaultWalletId, onSuccess, onCancel }: BulkTransactionReviewProps) {
  const [items, setItems] = useState<any[]>(
    initialItems.map((item, index) => {
      // Find matching category
      let categoryId = "";
      if (item.categoryName) {
        const matchedCat = categories.find(c => 
          c.name.toLowerCase() === item.categoryName.toLowerCase() && 
          c.type.toUpperCase() === (item.type || "EXPENSE").toUpperCase()
        );
        if (matchedCat) categoryId = matchedCat.id;
      }
      
      return {
        id: index, // temporary id
        type: item.type || "EXPENSE",
        date: item.date || new Date().toISOString().split('T')[0],
        description: item.description || "",
        amount: item.amount || 0,
        category: categoryId,
      };
    })
  );
  
  const [globalWallet, setGlobalWallet] = useState(defaultWalletId || (wallets.length > 0 ? wallets[0]._id : ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!globalWallet) {
      toast.error("Please select a wallet for these transactions.");
      return;
    }

    // Validate
    for (let i = 0; i < items.length; i++) {
      if (!items[i].amount || items[i].amount <= 0) {
        toast.error(`Row ${i + 1}: Amount is required`);
        return;
      }
    }

    setIsSubmitting(true);
    const payload = items.map(item => ({
      amount: Number(item.amount),
      description: item.description,
      type: item.type,
      wallet: globalWallet,
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      category: item.category || undefined,
    }));

    try {
      await createBatchTransactions(payload);
      toast.success(`${payload.length} transactions added successfully!`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save batch transactions");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] overflow-hidden space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mt-2">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Found {items.length} Transactions
          </h3>
          <p className="text-sm text-muted-foreground">Review and edit before saving</p>
        </div>
        <div className="w-48">
          <label className="text-xs text-muted-foreground block mb-1">Target Wallet</label>
          <Select value={globalWallet} onValueChange={setGlobalWallet}>
            <SelectTrigger className="h-8 bg-background">
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map(w => (
                <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-1">
        {items.map((item, index) => {
          const filteredCategories = categories.filter(c => c.type === item.type);
          
          return (
            <div key={item.id} className="relative p-3 border rounded-lg shadow-sm bg-card flex flex-col gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-2 gap-3 pr-8">
                <Select value={item.type} onValueChange={(v) => { updateItem(index, "type", v); updateItem(index, "category", ""); }}>
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>

                <Input 
                  type="date" 
                  value={item.date} 
                  onChange={(e) => updateItem(index, "date", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <Input 
                  placeholder="Description" 
                  value={item.description} 
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="h-8 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MoneyInput
                  placeholder="0"
                  value={item.amount}
                  onValueChange={(val) => updateItem(index, "amount", val)}
                />
                
                <CategoryCombobox
                    categories={filteredCategories}
                    value={item.category}
                    onChange={(val) => updateItem(index, "category", val)}
                    modal
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No transactions left. You can cancel.
          </div>
        )}
      </div>

      <div className="pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSaveAll} disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save All ({items.length})
        </Button>
      </div>
    </div>
  );
}
