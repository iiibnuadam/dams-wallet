import { apiFetch } from "../lib/api";

export async function getFinancialHealthData(owner?: string, searchParams?: any) {
    const period = searchParams?.month || new Date().toISOString().slice(0, 7);
    const params: any = { period };
    if (owner) params.owner = owner;
    if (searchParams?.startDate) params.startDate = searchParams.startDate;
    if (searchParams?.endDate) params.endDate = searchParams.endDate;
    
    try {
        const response = await apiFetch<any>("/dashboard/financial-health", { params });
        const trendData = response.trend || [];
        const granularity = response.granularity || 'month';
        const diffDays = trendData.length > 0 ? trendData.length * (granularity === 'day' ? 1 : 30) : 1;

        const insights: { title: string; value: string; message: string; status: 'positive' | 'warning' | 'neutral' }[] = [];
        
        const totalIncome = response.macroStats?.totalIncome || 0;
        const totalExpense = response.macroStats?.totalExpense || 0;
        const cashFlow = totalIncome - totalExpense;
        const savingsRate = response.macroStats?.savingsRate || 0;

        const monthsDiff = Math.max(diffDays / 30, 0.033);
        const avgMonthlyExpense = totalExpense / monthsDiff;
        const avgMonthlySaving = cashFlow / monthsDiff;

        if (diffDays >= 90) {
            insights.push({
                title: "Rata-rata Pengeluaran Bulanan",
                value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(avgMonthlyExpense),
                message: "Perkiraan rata-rata pengeluaran bulanan Anda berdasarkan aktivitas pada periode ini.",
                status: 'neutral'
            });

            insights.push({
                title: "Tabungan Bulanan",
                value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(avgMonthlySaving),
                message: avgMonthlySaving > 0 
                    ? "Arus kas Anda positif setiap bulannya (pendapatan lebih besar dari pengeluaran)." 
                    : "Anda mengalami defisit (pengeluaran lebih besar dari pendapatan) setiap bulannya.",
                status: avgMonthlySaving > 0 ? 'positive' : 'warning'
            });
        }

        if (granularity === 'day') {
            const avgDailyExpense = totalExpense / (trendData.length || 1);
            insights.push({
                title: "Rata-rata Pengeluaran Harian",
                value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(avgDailyExpense),
                message: `Anda menghabiskan sekitar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", compactDisplay: "short", notation: "compact" }).format(avgDailyExpense)} per hari.`,
                status: avgDailyExpense > 500000 ? 'warning' : 'neutral'
            });

            if (cashFlow < 0) {
                 insights.push({
                    title: "Defisit Jangka Pendek",
                    value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Math.abs(cashFlow)),
                    message: "Pengeluaran Anda melebihi pendapatan pada periode ini.",
                    status: 'warning'
                 });
            } else {
                 insights.push({
                    title: "Surplus Jangka Pendek",
                    value: "+ " + new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cashFlow),
                    message: "Keuangan Anda tetap positif di periode ini.",
                    status: 'positive'
                 });
            }
        } else {
            insights.push({
                title: "Tingkat Tabungan (Savings Rate)",
                value: savingsRate.toFixed(1) + "%",
                message: savingsRate > 20 
                    ? "Luar biasa! Tingkat tabungan Anda di atas 20%." 
                    : savingsRate > 0 
                    ? "Positif, tapi usahakan untuk mencapai target tabungan 20%." 
                    : "Peringatan: Pengeluaran Anda melebihi pendapatan.",
                status: savingsRate > 20 ? 'positive' : savingsRate > 0 ? 'neutral' : 'warning'
            });

            const fixedRatio = response.fixedVsVariable?.ratio || 0;
            insights.push({
                title: "Beban Biaya Tetap (Fixed Cost)",
                value: fixedRatio.toFixed(0) + "%",
                message: fixedRatio > 60 
                    ? "Biaya tetap sangat tinggi (>60%), hal ini membatasi fleksibilitas keuangan Anda." 
                    : "Biaya tetap Anda berada di tingkat yang sehat dan mudah dikelola.",
                status: fixedRatio > 60 ? 'warning' : 'positive'
            });

            if (diffDays >= 28 && totalIncome > 0) {
                const safeDebtRatio = 0.35; 
                const avgMonthlyIncome = totalIncome / monthsDiff;
                const maxSafeInstallment = avgMonthlyIncome * safeDebtRatio;
                const avgMonthlyFixed = (response.fixedVsVariable?.fixed || 0) / monthsDiff;
                const availableCapacity = maxSafeInstallment - avgMonthlyFixed;

                 insights.push({
                    title: "Kemampuan Meminjam (Borrowing Power)",
                    value: availableCapacity > 0 
                        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(availableCapacity) + " /bln"
                        : "Kapasitas Maksimal",
                    message: availableCapacity > 0 
                        ? "Batas angsuran bulanan yang aman (Maksimal 35% dari pendapatan)."
                        : "Anda telah melewati batas aman hutang. Hindari pinjaman baru.",
                    status: availableCapacity > 0 ? 'positive' : 'warning'
                 });
            }
        }

        if (granularity === 'year') {
            const startNW = trendData[0]?.netWorth || 0;
            const endNW = trendData[trendData.length - 1]?.netWorth || 0;
            const growth = endNW - startNW;
            const growthPercent = startNW !== 0 ? (growth / startNW) * 100 : 0;

            insights.push({
                title: "Pertumbuhan Kekayaan (Net Worth)",
                value: (growth >= 0 ? "+" : "") + growthPercent.toFixed(1) + "%",
                message: growth >= 0 
                    ? `Total kekayaan bersih Anda bertambah sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact" }).format(growth)}.`
                    : "Total kekayaan bersih Anda menurun. Periksa pengeluaran atau hutang besar.",
                status: growth >= 0 ? 'positive' : 'warning'
            });

            insights.push({
                title: "Total Sisa Uang Masuk",
                value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact" }).format(cashFlow),
                message: cashFlow > 0 
                    ? "Total uang sisa yang Anda simpan setelah semua pengeluaran."
                    : "Total modal atau uang tabungan yang terpakai.",
                status: cashFlow > 0 ? 'positive' : 'warning'
            });
        }

        return {
            ...response,
            insights
        };

    } catch (e: any) {
        console.error("Failed to fetch financial health:", e);
        return {
            trend: [], granularity: 'month', insights: [],
            macroStats: { currentNetWorth: 0, totalIncome: 0, totalExpense: 0, savingsRate: 0 },
            sankeyData: { nodes: [], links: [] }, radarData: [], liabilities: [],
            fixedVsVariable: { fixed: 0, variable: 0, ratio: 0 }
        };
    }
}
