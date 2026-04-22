import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || 'An error occurred while fetching the data.');
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }
  return res.json().then(data => data.data);
};

export interface UseApiResult<T> {
  data: T | null;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | Promise<T> | ((currentData?: T) => T | Promise<T>), shouldRevalidate?: boolean) => Promise<T | undefined>;
}

/**
 * useApiDoc replaces useDoc for fetching a single document via API.
 */
export function useApiDoc<T = any>(url: string | null, config?: SWRConfiguration): UseApiResult<T> {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(url, fetcher, config);

  return {
    data: data ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * useApiCollection replaces useCollection for fetching a list of documents via API.
 */
export function useApiCollection<T = any>(url: string | null, config?: SWRConfiguration): UseApiResult<T[]> {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T[]>(url, fetcher, config);

  return {
    data: data ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
