import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

export function useWallets(view: string) {
  return useQuery({
    queryKey: ['wallets', view],
    queryFn: async () => {
      const response = await apiClient.get(`/wallets?view=${view}`);
      return response.data;
    },
  });
}
