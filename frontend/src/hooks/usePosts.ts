import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IPost, PaginatedResult } from "../types";

export const useFeedPosts = () => {
	return useInfiniteQuery<PaginatedResult<IPost>>({
		queryKey: ["posts"],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/posts?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
};

export const usePostById = (postId: string) => {
	const queryClient = useQueryClient();
	return {
		data: queryClient.getQueryData<IPost>(["post", postId]),
		...useInfiniteQuery<PaginatedResult<IPost>>({
			queryKey: ["post", postId],
			queryFn: async () => {
				const res = await axiosInstance.get(`/posts/${postId}`);
				// getPostById returns a single post, not paginated
				return { data: [res.data], nextCursor: null, hasMore: false };
			},
			initialPageParam: undefined,
			getNextPageParam: () => undefined,
			enabled: !!postId,
		}),
	};
};

// Simple non-paginated single post fetch
export const usePost = (postId: string) => {
	const { useQuery } = require("@tanstack/react-query");
	return useQuery<IPost>({
		queryKey: ["post", postId],
		queryFn: async () => {
			const res = await axiosInstance.get(`/posts/${postId}`);
			return res.data;
		},
		enabled: !!postId,
	});
};

export const useCreatePost = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (postData: FormData | { content: string; image?: string | null }) => {
			const isFormData = postData instanceof FormData;
			const res = await axiosInstance.post("/posts/create", postData, {
				headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Post created successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || err.response?.data?.error?.message || "Failed to create post");
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (postId: string) => {
			const res = await axiosInstance.delete(`/posts/delete/${postId}`);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to delete post");
		},
	});
};

export const useLikePost = (postId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const res = await axiosInstance.post(`/posts/${postId}/like`);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to like post");
		},
	});
};

export const useCreateComment = (postId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (content: string) => {
			const res = await axiosInstance.post(`/posts/${postId}/comment`, { content });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Comment added successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to add comment");
		},
	});
};
