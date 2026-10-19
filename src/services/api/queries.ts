import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

export const summaryQuery = queryOptions({
  queryKey: ["career", "summary"],
  queryFn: ({ signal }) => api.summary(signal),
  staleTime: 30_000,
  retry: false,
});
export const profileQuery = queryOptions({
  queryKey: ["career", "profile"],
  queryFn: ({ signal }) => api.profile(signal),
  staleTime: 30_000,
  retry: false,
  refetchOnWindowFocus: false,
});
export const documentsQuery = queryOptions({
  queryKey: ["career", "documents"],
  queryFn: ({ signal }) => api.documents(signal),
  staleTime: 30_000,
  retry: false,
});
export const policyQuery = queryOptions({
  queryKey: ["career", "policy"],
  queryFn: ({ signal }) => api.policy(signal),
  staleTime: Infinity,
  retry: false,
});
export const healthQuery = queryOptions({
  queryKey: ["career", "health"],
  queryFn: ({ signal }) => api.health(signal),
  staleTime: 30_000,
  retry: false,
});
