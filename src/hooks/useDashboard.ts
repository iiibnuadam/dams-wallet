import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDashboardData(view: string, params?: any, initialData?: any) {
  return useQuery({
    queryKey: ['dashboard', view, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(params);
      if (view) queryParams.set("view", view);
      const response = await apiClient.get(`/dashboard?${queryParams.toString()}`);
      return response.data;
    },
    initialData,
    placeholderData: keepPreviousData
  });
}
