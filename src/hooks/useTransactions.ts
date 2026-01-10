import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { createTransaction, deleteTransaction } from '@/actions/transaction';

// Interface matching the API response
interface TransactionResponse {
    transactions: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        limit: number;
    }
}

export function useTransactions(params: Record<string, any>, options?: { enabled?: boolean }) {
  // Exclude page from queryKey to prevents cache fragmentation (e.g. ?page=1 vs no param)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, ...filterParams } = params;

  return useInfiniteQuery({
    queryKey: ['transactions', filterParams],
    queryFn: async ({ pageParam = 1 }) => {
      // Clean up params (remove undefined/null/empty strings)
      const queryParams = new URLSearchParams();
      // Merge filterParams with pageParam
      Object.entries({ ...filterParams, page: pageParam }).forEach(([key, value]) => {
          if (value !== undefined && value !== null && String(value) !== "") {
              queryParams.append(key, String(value));
          }
      });
      
      const response = await apiClient.get<TransactionResponse>(`/transactions?${queryParams.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage: TransactionResponse) => {
        if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
            return lastPage.pagination.currentPage + 1;
        }
        return undefined;
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
             const result = await createTransaction(null, formData);
             return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); 
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            // Invalidate goals if meaningful (e.g. paying goal item)
            // Ideally we check if variables.get('goalItem') exists but FormData inspection is fine
            if (variables.get('goalItem')) {
                 queryClient.invalidateQueries({ queryKey: ['goals'] });
                 // If we could extract goalId, we would invalidate specific goal, but invalidating all goals list/details is safer
                 // But wait, useGoal(id) uses ['goal', id]. useGoals uses ['goals'].
                 // We should invalidate both or specific.
                 // We can't easily get goalId from goalItem ID unless we pass it.
                 // Let's invalidate ['goal'] query key prefix to cover all individual goals.
                 queryClient.invalidateQueries({ queryKey: ['goal'] });
            }
        }
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
             const result = await deleteTransaction(id);
             return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); 
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            // Also invalidate goals on delete just in case
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['goal'] });
        }
    });
}
