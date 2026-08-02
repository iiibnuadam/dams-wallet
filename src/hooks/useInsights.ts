import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInsights, analyzeInsights } from "@/services/insights.service";

export function useInsights(period?: string, owner?: string) {
    return useQuery({
        queryKey: ["insights", period, owner],
        queryFn: () => getInsights(period, owner),
        staleTime: 5 * 60 * 1000,
    });
}

// Triggers the explicit "Analisis dengan AI" action for whichever owner
// filter is currently selected -- one owner at a time. On success, writes
// the result straight into the matching useInsights cache entry -- no
// extra refetch needed since the mutation response already has the fresh
// data.
export function useAnalyzeInsights(period?: string, owner?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => analyzeInsights(period, owner),
        onSuccess: (data) => {
            queryClient.setQueryData(["insights", period, owner], data);
        },
    });
}
