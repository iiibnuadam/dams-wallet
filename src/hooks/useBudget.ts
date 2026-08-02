import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BudgetService } from "@/services/budget.service";

export function useBudgetOverview(period?: string) {
    const resolvedPeriod = period || format(new Date(), "yyyy-MM");
    return useQuery({
        queryKey: ["budget-overview", resolvedPeriod],
        queryFn: () => BudgetService.getBudgetOverview(resolvedPeriod),
        staleTime: 5 * 60 * 1000,
    });
}
