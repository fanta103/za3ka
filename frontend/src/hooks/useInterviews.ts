import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IInterviewSession, InterviewStatus, PaginatedResult } from "../types";

export const useMyInterviews = (status?: InterviewStatus | "all") => {
	return useInfiniteQuery<PaginatedResult<IInterviewSession>>({
		queryKey: ["my-interviews", status],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "20" });
			if (status && status !== "all") params.set("status", status);
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/interviews/my-interviews?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const useInterviewById = (id?: string) => {
	return useQuery<IInterviewSession>({
		queryKey: ["interview", id],
		queryFn: async () => {
			const res = await axiosInstance.get(`/interviews/${id}`);
			return res.data;
		},
		enabled: Boolean(id),
	});
};

export const useScheduleInterview = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			jobId: string;
			candidateId: string;
			scheduledAt: string;
			duration?: number;
			note?: string;
		}) => {
			const res = await axiosInstance.post("/interviews", data);
			return res.data as IInterviewSession;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
			toast.success("Interview scheduled successfully!");
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to schedule interview");
		},
	});
};

export const useUpdateInterviewStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, status }: { id: string; status: InterviewStatus }) => {
			const res = await axiosInstance.patch(`/interviews/${id}/status`, { status });
			return res.data as IInterviewSession;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
			queryClient.setQueryData(["interview", data._id], data);
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to update interview status");
		},
	});
};

export const useSubmitFeedback = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, rating, notes }: { id: string; rating: number; notes?: string }) => {
			const res = await axiosInstance.post(`/interviews/${id}/feedback`, { rating, notes });
			return res.data as IInterviewSession;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
			queryClient.setQueryData(["interview", data._id], data);
			toast.success("Feedback submitted!");
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to submit feedback");
		},
	});
};

export const useGenerateInterviewToken = () => {
	return useMutation({
		mutationFn: async (
			payload: string | { interviewId: string; participantId?: string }
		): Promise<{ token: string; url: string }> => {
			const interviewId = typeof payload === "string" ? payload : payload.interviewId;
			if (!interviewId) throw new Error("Interview ID is required");

			const res = await axiosInstance.post(`/interviews/${interviewId}/token`);
			return res.data;
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to generate room token");
		},
	});
};
