import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { 
    createGoalAction, updateGoalAction, deleteGoalAction,
    createGoalItemAction, updateGoalItemAction, deleteGoalItemAction,
    updateGroupStyleAction
} from '@/actions/goal'; // Import item actions
// For payment, it's usually via transaction creation but linked to goal item.
// Wait, PayGoalItemDialog likely uses transaction action or specific goal payment action?
// I see `deleteGoalPaymentAction` in action file, but paying?
// Let's assume standard transaction creation or special action. 
// Ah, `PayGoalItemDialog` likely uses `createTransactionAction` but with goalItem field.
// I'll check `PayGoalItemDialog` later. For now, add item management hooks.

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiClient.get('/goals');
      return response.data;
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (formData: any) => {
             const res = await createGoalAction(null, formData);
             if (!res.success) throw new Error(res.message);
             return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
            const res = await updateGoalAction(id, null, formData);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['goal', variables.id] });
        }
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteGoalAction(id);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

// Item Hooks

export function useCreateGoalItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await createGoalItemAction(null, formData);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: (data, variables) => {
             // Invalidate specific goal
             const goalId = variables.get("goalId") as string;
             if (goalId) queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
             queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
    });
}

export function useUpdateGoalItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, goalId, formData }: { id: string; goalId: string; formData: FormData }) => {
            const res = await updateGoalItemAction(id, goalId, null, formData);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: (data, variables) => {
             queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
        }
    });
}

export function useDeleteGoalItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, goalId }: { id: string; goalId: string }) => {
            const res = await deleteGoalItemAction(id, goalId);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: (data, variables) => {
             queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
        }
    });
}

export function useUpdateGroupStyle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await updateGroupStyleAction(formData);
            if (!res.success) throw new Error(res.message);
            return res;
        },
        onSuccess: (data, variables) => {
            const goalId = variables.get("goalId") as string;
            if (goalId) queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
        }
    });
}
