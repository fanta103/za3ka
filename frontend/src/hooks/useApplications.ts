import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { ApplicationStatus, IApplication, PaginatedResult } from "../types";

export const useMyApplications = () => {
	return useInfiniteQuery<PaginatedResult<IApplication>>({
		queryKey: ["applications", "mine"],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/applications/my-applications?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const useJobApplications = (jobId?: string) => {
	return useInfiniteQuery<PaginatedResult<IApplication>>({
		queryKey: ["applications", "job", jobId],
		queryFn: async ({ pageParam }) => {
			if (!jobId) throw new Error("Job ID required");
			const params = new URLSearchParams({ limit: "20" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/applications/job/${jobId}?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: Boolean(jobId),
	});
};

export const useApplyToJob = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: FormData | { jobId: string; coverLetter?: string; resumeUrl?: string }) => {
			const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
			const res = await axiosInstance.post("/applications", data, config);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Application submitted successfully!");
			queryClient.invalidateQueries({ queryKey: ["applications"] });
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.invalidateQueries({ queryKey: ["job"] });
		},
		onError: (err: any) => {
			const code = err.response?.data?.code;
			if (code === "ALREADY_APPLIED") {
				toast.error("You have already applied to this job listing");
			} else {
				toast.error(err.response?.data?.message || "Failed to submit application");
			}
		},
	});
};

export const useUpdateApplicationStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			status,
			notes,
		}: {
			id: string;
			status: ApplicationStatus;
			notes?: string;
		}) => {
			const res = await axiosInstance.patch(`/applications/${id}/status`, { status, notes });
			return res.data;
		},
		onSuccess: (updatedApp) => {
			toast.success(`Application marked as ${updatedApp.status}`);
			queryClient.invalidateQueries({ queryKey: ["applications"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to update status");
		},
	});
};

