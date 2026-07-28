"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallets } from "@/hooks/useWallets";
import { useGoals } from "@/hooks/useGoals";
import apiClient from "@/lib/axios";
import { CategoryService } from "@/services/category.service";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { createBatchTransactions } from "@/services/transaction.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ImportRow {
  Date: string;
  Amount: number;
  Type: "INCOME" | "EXPENSE" | "TRANSFER";
  Category?: string;
  Wallet: string;
  "Target Wallet"?: string;
  Description?: string;
  "Goal Name"?: string;
  "Goal Item Name"?: string;
  "Debt Item ID"?: string;
}

interface ParsedTransaction {
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  wallet: string;
  targetWallet?: string;
  category?: string;
  description?: string;
  goalItem?: string;
  paymentPhase?: string; // We can use Debt Item ID for this if needed, or omit
  isValid: boolean;
  errors: string[];
  raw: ImportRow;
}

export function TransactionImportModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoryService.getCategories(),
    enabled: open,
  });

  const { data: wallets = [] } = useWallets("ALL");
  const { data: goalsList = [], isLoading: isGoalsLoading } = useGoals("ALL");
  const queryClient = useQueryClient();

  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [goalItems, setGoalItems] = useState<{ goalName: string, itemName: string, itemId: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreparingGoals, setIsPreparingGoals] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && goalsList.length > 0) {
      setIsPreparingGoals(true);
      Promise.all(
        goalsList.map((g: any) => apiClient.get(`/goals/${g._id}`).then(res => res.data))
      ).then(details => {
         const items: any[] = [];
         details.forEach(goal => {
            goal.items?.forEach((item: any) => {
               items.push({
                  goalName: goal.name,
                  itemName: item.name,
                  itemId: item._id,
               });
            });
         });
         setGoalItems(items);
      }).catch(console.error).finally(() => setIsPreparingGoals(false));
    }
  }, [open, goalsList]);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Transactions Template
    const templateData = [
      { Date: "2026-07-28", Amount: 150000, Type: "EXPENSE", Category: "Food", Wallet: "Main Wallet", "Target Wallet": "", Description: "Lunch", "Goal Name": "", "Goal Item Name": "", "Debt Item ID": "" },
      { Date: "2026-07-28", Amount: 5000000, Type: "INCOME", Category: "Salary", Wallet: "Main Wallet", "Target Wallet": "", Description: "Monthly Salary", "Goal Name": "", "Goal Item Name": "", "Debt Item ID": "" },
      { Date: "2026-07-28", Amount: 500000, Type: "TRANSFER", Category: "", Wallet: "Main Wallet", "Target Wallet": "Savings", Description: "Transfer to Savings", "Goal Name": "", "Goal Item Name": "", "Debt Item ID": "" },
      { Date: "2026-07-28", Amount: 2000000, Type: "EXPENSE", Category: "Goals", Wallet: "Savings", "Target Wallet": "", Description: "Buy new laptop", "Goal Name": "New Gadget", "Goal Item Name": "Macbook", "Debt Item ID": "" },
    ];
    const wsTransactions = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transactions");

    // Sheet 2: Reference Data
    const expenseCats = categories.filter((c: any) => c.type === "EXPENSE");
    const incomeCats = categories.filter((c: any) => c.type === "INCOME");
    const transferCats = categories.filter((c: any) => c.type === "TRANSFER");
    
    const refData: any[] = [];
    const maxLen = Math.max(wallets.length, expenseCats.length, incomeCats.length, transferCats.length);
    
    for (let i = 0; i < maxLen; i++) {
      const row: any = {};
      
      row["Wallet Name"] = wallets[i]?.name || "";
      row["Wallet ID"] = wallets[i]?._id || "";
      
      row["Expense Category"] = expenseCats[i]?.name || "";
      row["Income Category"] = incomeCats[i]?.name || "";
      
      if (transferCats.length > 0) {
        row["Transfer Category"] = transferCats[i]?.name || "";
      }

      refData.push(row);
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    XLSX.utils.book_append_sheet(wb, wsRef, "Reference Data");

    // Sheet 3: Goals Reference
    const goalRefData: any[] = [];
    const goalsMap = new Map<string, string[]>();
    goalItems.forEach(item => {
      if (!goalsMap.has(item.goalName)) goalsMap.set(item.goalName, []);
      goalsMap.get(item.goalName)?.push(item.itemName);
    });

    const maxGoalItems = Math.max(...Array.from(goalsMap.values()).map(arr => arr.length), 0);
    const goalNames = Array.from(goalsMap.keys());
    
    for (let i = 0; i < maxGoalItems; i++) {
      const row: any = {};
      goalNames.forEach(gn => {
         const items = goalsMap.get(gn) || [];
         row[gn] = items[i] || "";
      });
      goalRefData.push(row);
    }
    
    if (goalRefData.length > 0) {
      const wsGoals = XLSX.utils.json_to_sheet(goalRefData);
      XLSX.utils.book_append_sheet(wb, wsGoals, "Goals Reference");
    }

    XLSX.writeFile(wb, "dams_wallet_import_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<ImportRow>(ws);

        const parsed: ParsedTransaction[] = data.map((row) => {
          const errors: string[] = [];
          
          // Match Wallet
          const matchedWallet = wallets.find((w: any) => w.name.toLowerCase() === (row.Wallet || "").toLowerCase().trim());
          if (!matchedWallet) errors.push(`Wallet "${row.Wallet}" not found`);

          // Match Category
          let matchedCategory = null;
          if (row.Category && row.Type !== "TRANSFER") {
            matchedCategory = categories.find((c: any) => c.name.toLowerCase() === row.Category?.toLowerCase().trim() && c.type === row.Type);
            if (!matchedCategory) errors.push(`Category "${row.Category}" (${row.Type}) not found`);
          }

          // Match Target Wallet
          let matchedTargetWallet = null;
          if (row.Type === "TRANSFER") {
            matchedTargetWallet = wallets.find((w: any) => w.name.toLowerCase() === (row["Target Wallet"] || "").toLowerCase().trim());
            if (!matchedTargetWallet) errors.push(`Target Wallet "${row["Target Wallet"]}" not found`);
          }

          // Match Goal Item
          let matchedGoalItem = null;
          if (row["Goal Name"] && row["Goal Item Name"]) {
            matchedGoalItem = goalItems.find(
               g => g.goalName.toLowerCase() === row["Goal Name"]?.toLowerCase().trim() &&
                    g.itemName.toLowerCase() === row["Goal Item Name"]?.toLowerCase().trim()
            );
            if (!matchedGoalItem) errors.push(`Goal Item "${row["Goal Item Name"]}" under Goal "${row["Goal Name"]}" not found`);
          }

          if (!row.Date) errors.push("Date is required");
          if (!row.Amount || isNaN(Number(row.Amount))) errors.push("Valid amount is required");
          if (!["INCOME", "EXPENSE", "TRANSFER"].includes(row.Type)) errors.push("Invalid Type");

          // Convert Excel date to ISO if it's a number (Excel serial date)
          let dateStr = row.Date;
          if (typeof dateStr === 'number') {
            const dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            dateStr = dateObj.toISOString();
          } else if (dateStr && !dateStr.includes('T')) {
            // Append time if missing to prevent timezone shift issues
            dateStr = new Date(dateStr).toISOString();
          }

          return {
            date: dateStr,
            amount: Number(row.Amount),
            type: row.Type as any,
            wallet: matchedWallet?._id || "",
            targetWallet: matchedTargetWallet?._id,
            category: matchedCategory?._id,
            description: row.Description || "",
            goalItem: matchedGoalItem?.itemId,
            isValid: errors.length === 0,
            errors,
            raw: row,
          };
        });

        setParsedData(parsed);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file. Make sure it's a valid Excel/CSV file.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = async () => {
    const validTransactions = parsedData.filter((t) => t.isValid);
    if (validTransactions.length === 0) {
      toast.error("No valid transactions to import.");
      return;
    }

    setIsImporting(true);
    try {
      const payload = validTransactions.map((t) => ({
        date: t.date,
        amount: t.amount,
        type: t.type,
        wallet: t.wallet,
        targetWallet: t.targetWallet,
        category: t.category,
        description: t.description,
        goalItem: t.goalItem,
      }));

      const res = await createBatchTransactions(payload);
      toast.success(`Successfully imported ${res.inserted} transactions!`);
      
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      
      setParsedData([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to import transactions");
    } finally {
      setIsImporting(false);
    }
  };

  const hasErrors = parsedData.some((t) => !t.isValid);

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) setParsedData([]);
        onOpenChange(val);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Import Transactions
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your transactions, and upload it back here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-4">
          {parsedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <Upload className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Excel or CSV</h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                Drag and drop your file here, or click the button below to browse your files.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={isGoalsLoading || isPreparingGoals}>
                  {(isGoalsLoading || isPreparingGoals) ? (
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                     <Download className="w-4 h-4 mr-2" />
                  )}
                  {isPreparingGoals ? "Preparing..." : "Download Template"}
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Select File
                </Button>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Preview ({parsedData.length} rows)</h3>
                <Button variant="outline" size="sm" onClick={() => setParsedData([])}>
                  Clear & Upload Another
                </Button>
              </div>

              {hasErrors && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-start gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Some rows have errors and will be skipped.</p>
                    <p>Please check the highlighted rows below. Ensure Wallet and Category names match exactly.</p>
                  </div>
                </div>
              )}

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Category/Target</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx} className={row.isValid ? "" : "bg-red-50/50 dark:bg-red-950/20"}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="group relative">
                              <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
                              <div className="absolute left-6 top-0 hidden group-hover:block z-10 bg-black text-white text-xs p-2 rounded shadow-lg w-48">
                                {row.errors.join(", ")}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.description}</TableCell>
                        <TableCell>{row.raw.Wallet}</TableCell>
                        <TableCell>
                          {row.type === "TRANSFER" ? (
                            <span className="text-blue-500">→ {row.raw["Target Wallet"]}</span>
                          ) : (
                            row.raw.Category
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            disabled={parsedData.length === 0 || !parsedData.some(r => r.isValid) || isImporting}
            onClick={handleConfirmImport}
          >
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import {parsedData.filter(r => r.isValid).length} Valid Rows
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
