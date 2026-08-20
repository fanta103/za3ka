import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IJob, PaginatedResult } from "../types";

export interface JobFilters {
	type?: string;
	location?: string;
	status?: string;
	search?: string;
	authorId?: string;
}

export const useJobs = (filters?: JobFilters) => {
	return useInfiniteQuery<PaginatedResult<IJob>>({
		queryKey: ["jobs", filters],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (pageParam) params.set("cursor", pageParam as string);
			if (filters?.type) params.set("type", filters.type);
			if (filters?.location) params.set("location", filters.location);
			if (filters?.status) params.set("status", filters.status);
			if (filters?.search) params.set("search", filters.search);
			if (filters?.authorId) params.set("authorId", filters.authorId);
			const res = await axiosInstance.get(`/jobs?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const useJobById = (id?: string) => {
	return useQuery<IJob>({
		queryKey: ["job", id],
		queryFn: async () => {
			if (!id) throw new Error("Job ID required");
			const res = await axiosInstance.get(`/jobs/${id}`);
			return res.data;
		},
		enabled: Boolean(id),
	});
};

export const useCreateJob = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (jobData: Partial<IJob>) => {
			const res = await axiosInstance.post("/jobs", jobData);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Job posted successfully!");
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to create job");
		},
	});
};

export const useUpdateJob = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<IJob> }) => {
			const res = await axiosInstance.put(`/jobs/${id}`, data);
			return res.data;
		},
		onSuccess: (updatedJob) => {
			toast.success("Job updated successfully!");
			queryClient.setQueryData(["job", updatedJob._id], updatedJob);
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to update job");
		},
	});
};

export const useUpdateJobStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, status }: { id: string; status: "open" | "closed" | "paused" }) => {
			const res = await axiosInstance.patch(`/jobs/${id}/status`, { status });
			return res.data;
		},
		onSuccess: (updatedJob) => {
			toast.success(`Job status changed to ${updatedJob.status}`);
			queryClient.setQueryData(["job", updatedJob._id], updatedJob);
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to update job status");
		},
	});
};

export const useDeleteJob = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await axiosInstance.delete(`/jobs/${id}`);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Job deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to delete job");
		},
	});
};

