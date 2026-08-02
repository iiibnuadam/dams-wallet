import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import * as TransactionService from '@/services/transaction.service';

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
              // Map view to owner, but ignore if it's just a UI tab state like analytics or transactions
              if (key === 'view') {
                  if (String(value) !== 'analytics' && String(value) !== 'transactions') {
                      queryParams.append('owner', String(value));
                  }
              } else {
                  queryParams.append(key, String(value));
              }
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
        mutationFn: async (payload: any) => {
             const result = await TransactionService.createTransaction(payload);
             return { code: 200, status: "Success", message: "Transaction created successfully", data: result };
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); 
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            // Invalidate goals if meaningful (e.g. paying goal item)
            // Ideally we check if variables.get('goalItem') exists but FormData inspection is fine
            if (variables.goalItem) {
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

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string } & Record<string, any>) => {
             await TransactionService.updateTransaction(id, payload);
             return { code: 200, status: "Success", message: "Transaction updated successfully" };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            // Unconditional (unlike create) -- the update payload never
            // carries goalItem, so there's nothing to key a conditional
            // check on; just invalidate in case an edit ever does touch one.
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['goal'] });
        }
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
             await TransactionService.deleteTransaction(id);
             return { code: 200, status: "Success", message: "Transaction deleted successfully" };
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
