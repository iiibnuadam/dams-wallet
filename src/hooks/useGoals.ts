import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import * as GoalService from '@/services/goal.service';
// For payment, it's usually via transaction creation but linked to goal item.
// Wait, PayGoalItemDialog likely uses transaction action or specific goal payment action?
// I see `deleteGoalPaymentAction` in action file, but paying?
// Let's assume standard transaction creation or special action. 
// Ah, `PayGoalItemDialog` likely uses `createTransactionAction` but with goalItem field.
// I'll check `PayGoalItemDialog` later. For now, add item management hooks.

export function useGoals(view: string = "ALL") {
  return useQuery({
    queryKey: ['goals', view],
    queryFn: async () => {
      // apiClient baseURL is '/api', so 'goals' -> '/api/goals?view=...'
      const response = await apiClient.get(`goals?view=${view}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      if (!id) return null;
      // apiClient baseURL is '/api', so 'goals/${id}' -> '/api/goals/${id}'
      const response = await apiClient.get(`goals/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: 1, // Don't retry infinitely on failure
  });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
             const res = await GoalService.createGoal(payload);
             return { code: 200, status: "Success", message: "Goal created successfully", data: res };
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
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await GoalService.updateGoal(id, data);
            return { code: 200, status: "Success", message: "Goal updated successfully", data: res };
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
            await GoalService.deleteGoal(id);
            return { code: 200, status: "Success", message: "Goal deleted successfully" };
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
        mutationFn: async (payload: any) => {
            const res = await GoalService.createGoalItem(payload);
            return { code: 200, status: "Success", message: "Goal item created successfully", data: res, variables: payload };
        },
        onSuccess: (data, variables) => {
             // Invalidate specific goal
             const goalId = variables.goal; // wait, depends on payload structure
             if (goalId) queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
             queryClient.invalidateQueries({ queryKey: ['goals'] });
        }
    });
}

export function useUpdateGoalItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, goalId, data }: { id: string; goalId: string; data: any }) => {
            const res = await GoalService.updateGoalItem(id, data);
            return { code: 200, status: "Success", message: "Goal item updated successfully", data: res };
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
            await GoalService.deleteGoalItem(id);
            return { code: 200, status: "Success", message: "Goal item deleted successfully" };
        },
        onSuccess: (data, variables) => {
             queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
        }
    });
}

export function useUpdateGroupStyle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const res = await GoalService.updateGroup(payload.goalId, payload.groupId, payload);
            return { code: 200, status: "Success", message: "Group style updated successfully", data: res };
        },
        onSuccess: (data, variables) => {
            const goalId = variables.goalId;
            if (goalId) queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
        }
    });
}
