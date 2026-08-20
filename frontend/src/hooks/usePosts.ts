import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IComment, IPost, PaginatedResult } from "../types";

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

export const usePost = (postId: string) => {
	return useQuery<IPost>({
		queryKey: ["post", postId],
		queryFn: async () => {
			const res = await axiosInstance.get(`/posts/${postId}`);
			return res.data;
		},
		enabled: !!postId,
	});
};

export const usePostComments = (postId: string, enabled: boolean) => {
	return useInfiniteQuery<PaginatedResult<IComment>>({
		queryKey: ["post-comments", postId],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "30" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(`/posts/${postId}/comments?${params.toString()}`);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: Boolean(postId) && enabled,
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

export const useDeleteComment = (postId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (commentId: string) => {
			const res = await axiosInstance.delete(`/posts/comments/${commentId}`);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Comment deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to delete comment");
		},
	});
};
