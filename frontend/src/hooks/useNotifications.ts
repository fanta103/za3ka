import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { INotification, PaginatedResult } from "../types";

export const useNotifications = () => {
	return useInfiniteQuery<PaginatedResult<INotification>>({
		queryKey: ["notifications"],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "20" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/notifications?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const useUnreadNotificationsCount = () => {
	return useQuery<{ count: number }>({
		queryKey: ["notifications", "unread-count"],
		queryFn: async () => {
			const res = await axiosInstance.get("/notifications/unread-count");
			return res.data;
		},
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 60 * 1000, // Refetch every 60 seconds
	});
};

export const useMarkNotificationAsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (notificationId: string) => {
			const res = await axiosInstance.put(`/notifications/${notificationId}/read`);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to mark notification as read");
		},
	});
};

export const useDeleteNotification = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (notificationId: string) => {
			const res = await axiosInstance.delete(`/notifications/${notificationId}`);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to delete notification");
		},
	});
};
