import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import * as DebtService from '@/services/debt.service';

export function useDebts(view: string = "ALL") {
  return useQuery({
    queryKey: ['debts', view],
    queryFn: async () => {
      const response = await apiClient.get(`/debts?owner=${view}`);
      return response.data;
    },
  });
}

export function useCreateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            await DebtService.createDebt(data);
            return { code: 200, message: "Success" };
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
            await DebtService.updateDebt(id, data);
            return { code: 200, message: "Success" };
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
            await DebtService.deleteDebt(id);
            return { code: 200, message: "Success" };
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
            await DebtService.settleDebt(id, walletId);
            return { code: 200, message: "Success" };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}
