import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { IConversation, IMessage, PaginatedResult } from "../types";
import { useSocket } from "../context/SocketContext";

export const useConversations = () => {
	return useQuery<IConversation[]>({
		queryKey: ["conversations"],
		queryFn: async () => {
			const res = await axiosInstance.get("/chat/conversations");
			return res.data;
		},
		refetchInterval: 30000, // Background refresh every 30s as fallback
	});
};

export const useConversationMessages = (conversationId?: string) => {
	return useInfiniteQuery<PaginatedResult<IMessage>>({
		queryKey: ["messages", conversationId],
		queryFn: async ({ pageParam }) => {
			if (!conversationId) throw new Error("Conversation ID is required");
			const params = new URLSearchParams({ limit: "30" });
			if (pageParam) params.set("cursor", pageParam as string);
			const res = await axiosInstance.get(
				`/chat/conversations/${conversationId}/messages?${params.toString()}`
			);
			return res.data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: Boolean(conversationId),
	});
};

export const useGetOrCreateConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await axiosInstance.post("/chat/conversations", { userId });
            return res.data as IConversation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to start conversation");
        },
    });
};

export const useSendMessage = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: FormData | { conversationId: string; text?: string; image?: string }) => {
			const config =
				data instanceof FormData
					? { headers: { "Content-Type": "multipart/form-data" } }
					: undefined;
			const res = await axiosInstance.post("/chat/messages", data, config);
			return res.data as IMessage;
		},
		onSuccess: (newMessage) => {
			const conversationId = newMessage.conversationId;

			// Append new message to messages cache
			queryClient.setQueryData<any>(["messages", conversationId], (oldData: any) => {
				if (!oldData) return oldData;
				const newPages = oldData.pages.map((page: any, index: number) => {
					if (index === 0) {
						// Prepend message to newest page
						return {
							...page,
							data: [newMessage, ...page.data],
						};
					}
					return page;
				});
				return { ...oldData, pages: newPages };
			});

			// Update conversations list cache with last message
			queryClient.setQueryData<IConversation[]>(["conversations"], (old = []) => {
				return old
					.map((c) => {
						if (c._id === conversationId) {
							return {
								...c,
								lastMessage: newMessage.text || (newMessage.image ? "📷 [Image]" : ""),
								lastMessageAt: newMessage.createdAt,
								updatedAt: newMessage.createdAt,
							};
						}
						return c;
					})
					.sort(
						(a, b) =>
							new Date(b.lastMessageAt || b.updatedAt || 0).getTime() -
							new Date(a.lastMessageAt || a.updatedAt || 0).getTime()
					);
			});
		},
		onError: (err: any) => {
			toast.error(err.response?.data?.message || "Failed to send message");
		},
	});
};

/**
 * Socket listener hook for real-time incoming messages
 */
export const useListenMessages = (activeConversationId?: string) => {
	const { socket } = useSocket();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (newMessage: IMessage) => {
			const convId = newMessage.conversationId;

			// If user is currently viewing this conversation, update active messages
			if (activeConversationId === convId) {
				queryClient.setQueryData<any>(["messages", convId], (oldData: any) => {
					if (!oldData) return oldData;
					const newPages = oldData.pages.map((page: any, index: number) => {
						if (index === 0) {
							// Avoid duplicates
							const exists = page.data.some((m: IMessage) => m._id === newMessage._id);
							if (exists) return page;
							return {
								...page,
								data: [newMessage, ...page.data],
							};
						}
						return page;
					});
					return { ...oldData, pages: newPages };
				});
			}

			// Update conversations list cache
			queryClient.setQueryData<IConversation[]>(["conversations"], (old = []) => {
				const isCurrentlyActive = activeConversationId === convId;
				const updatedList = old.map((c) => {
					if (c._id === convId) {
						return {
							...c,
							lastMessage: newMessage.text || (newMessage.image ? "📷 [Image]" : ""),
							lastMessageAt: newMessage.createdAt,
							myUnreadCount: isCurrentlyActive ? 0 : (c.myUnreadCount || 0) + 1,
						};
					}
					return c;
				});

				return updatedList.sort(
					(a, b) =>
						new Date(b.lastMessageAt || b.updatedAt || 0).getTime() -
						new Date(a.lastMessageAt || a.updatedAt || 0).getTime()
				);
			});
		};

		socket.on("newMessage", handleNewMessage);

		return () => {
			socket.off("newMessage", handleNewMessage);
		};
	}, [socket, activeConversationId, queryClient]);
};
