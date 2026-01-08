"use client";

import { useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ReportData {
    period: { start: Date; end: Date };
    summary: { income: number; expense: number; net: number };
    expenseByCategory: { name: string; value: number }[];
    incomeByCategory: { name: string; value: number }[];
    monthlyTrend: any[]; // Adjust type if needed
    dailyTrend: any[];
}

export function AnalyticsExportListener({ data }: { data: ReportData }) {
    
    useEffect(() => {
        const handleExportPDF = () => {
             const doc = new jsPDF();
             
             // Header
             doc.setFontSize(20);
             doc.text("Financial Report", 14, 20);
             
             doc.setFontSize(10);
             doc.text(`Period: ${format(new Date(data.period.start), "MMM dd, yyyy")} - ${format(new Date(data.period.end), "MMM dd, yyyy")}`, 14, 30);
             doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 35);
             
             // Summary
             doc.setFontSize(14);
             doc.text("Summary", 14, 45);
             
             autoTable(doc, {
                 startY: 50,
                 head: [['Type', 'Amount']],
                 body: [
                     ['Total Income', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.summary.income)],
                     ['Total Expense', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.summary.expense)],
                     ['Net Result', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.summary.net)],
                 ],
             });
             
             // Expense Breakdown
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const finalY = (doc as any).lastAutoTable.finalY + 10;
             doc.text("Expense Breakdown", 14, finalY);
             
             autoTable(doc, {
                 startY: finalY + 5,
                 head: [['Category', 'Amount']],
                 body: data.expenseByCategory.map(item => [
                     item.name,
                     new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.value)
                 ]),
             });

             doc.save("financial-report.pdf");
        };
        
        const handleExportExcel = () => {
             const wb = XLSX.utils.book_new();
             
             // Sheet 1: Summary
             const summaryData = [
                 ["Period Start", data.period.start],
                 ["Period End", data.period.end],
                 ["Total Income", data.summary.income],
                 ["Total Expense", data.summary.expense],
                 ["Net Result", data.summary.net],
             ];
             const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
             XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
             
             // Sheet 2: Expenses
             const wsExpenses = XLSX.utils.json_to_sheet(data.expenseByCategory);
             XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses Breakdown");

             // Sheet 3: Income
             const wsIncome = XLSX.utils.json_to_sheet(data.incomeByCategory);
             XLSX.utils.book_append_sheet(wb, wsIncome, "Income Breakdown");
             
             // Sheet 4: Daily Trend
             const wsDaily = XLSX.utils.json_to_sheet(data.dailyTrend);
             XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Trend");

             XLSX.writeFile(wb, "financial-report.xlsx");
        };
        
        window.addEventListener("export-report-pdf", handleExportPDF);
        window.addEventListener("export-report-excel", handleExportExcel);
        
        return () => {
            window.removeEventListener("export-report-pdf", handleExportPDF);
            window.removeEventListener("export-report-excel", handleExportExcel);
        }
    }, [data]);
    
    return null; // Invisible component, logic only
}
