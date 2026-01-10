import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { createDebtAction, updateDebtAction, deleteDebtAction, settleDebtAction } from '@/actions/debt';

export function useDebts() {
  return useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const response = await apiClient.get('/debts');
      return response.data;
    },
  });
}

export function useCreateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await createDebtAction(data);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useUpdateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateDebtAction(id, data);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        }
    });
}

export function useDeleteDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteDebtAction(id);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useSettleDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, walletId }: { id: string; walletId: string }) => {
            const res = await settleDebtAction(id, walletId);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}
