import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IConnectionRequest, IConnectionStatus, IUser, PaginatedResult } from "../types";

export const useConnectionStatus = (userId?: string) => {
	return useQuery<IConnectionStatus>({
		queryKey: ["connectionStatus", userId],
		queryFn: async () => {
			const res = await axiosInstance.get(`/connections/status/${userId}`);
			return res.data;
		},
		enabled: !!userId,
	});
};

export const useConnectionStatusBatch = (userIds: string[]) => {
	return useQuery<{ results: Record<string, { status: string; requestId?: string }> }>({
		queryKey: ["connectionStatusBatch", userIds],
		queryFn: async () => {
			const res = await axiosInstance.post("/connections/status-batch", { userIds });
			return res.data;
		},
		enabled: userIds.length > 0,
	});
};

export const useConnectionRequests = () => {
	return useQuery<IConnectionRequest[]>({
		queryKey: ["connectionRequests"],
		queryFn: async () => {
			const res = await axiosInstance.get("/connections/requests");
			return res.data;
		},
	});
};

export const useUserConnections = () => {
	return useInfiniteQuery<PaginatedResult<IUser>>({
		queryKey: ["userConnections"],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "20" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/connections?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const useSendConnectionRequest = (targetUserId?: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (userId?: string) => {
			const id = userId || targetUserId;
			const res = await axiosInstance.post(`/connections/request/${id}`);
			return res.data;
		},
		onSuccess: (_data, variables) => {
			const id = variables || targetUserId;
			toast.success("Connection request sent");
			if (id) {
				queryClient.invalidateQueries({ queryKey: ["connectionStatus", id] });
			}
			queryClient.invalidateQueries({ queryKey: ["connectionStatusBatch"] });
			queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});
};

export const useAcceptConnectionRequest = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (requestId: string) => {
			const res = await axiosInstance.put(`/connections/accept/${requestId}`);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
			queryClient.invalidateQueries({ queryKey: ["userConnections"] });
			queryClient.invalidateQueries({ queryKey: ["connectionStatus"] });
			queryClient.invalidateQueries({ queryKey: ["connectionStatusBatch"] });
			queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});
};

export const useRejectConnectionRequest = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (requestId: string) => {
			const res = await axiosInstance.put(`/connections/reject/${requestId}`);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Connection request rejected");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
			queryClient.invalidateQueries({ queryKey: ["connectionStatus"] });
			queryClient.invalidateQueries({ queryKey: ["connectionStatusBatch"] });
			queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});
};

export const useRemoveConnection = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (userId: string) => {
			const res = await axiosInstance.delete(`/connections/${userId}`);
			return res.data;
		},
		onSuccess: (_data, userId) => {
			toast.success("Connection removed");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", userId] });
			queryClient.invalidateQueries({ queryKey: ["connectionStatusBatch"] });
			queryClient.invalidateQueries({ queryKey: ["userConnections"] });
		},
		onError: (error: any) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});
};
