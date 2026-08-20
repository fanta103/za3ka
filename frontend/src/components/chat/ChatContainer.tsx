import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { IConversation, IMessage } from "../../types";
import { useAuthUser } from "../../hooks/useAuth";
import { useConversationMessages, useListenMessages } from "../../hooks/useChat";
import { useSocket } from "../../context/SocketContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface ChatContainerProps {
	conversation: IConversation | null;
	onBackToSidebar?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
	conversation,
	onBackToSidebar,
}) => {
	const { data: authUser } = useAuthUser();
	const { isOnline } = useSocket();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const conversationId = conversation?._id;

	// Listen to real-time incoming messages via Socket.IO
	useListenMessages(conversationId);

	const {
		data: messagesData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useConversationMessages(conversationId);

	// Flatten paginated messages (pages are newest first, so we reverse for chronological order)
	const rawMessages = messagesData?.pages.flatMap((p) => p.data) ?? [];
	const messages = [...rawMessages].reverse();

	// Auto-scroll to bottom on message updates
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length, conversationId]);

	if (!conversation) {
		return (
			<div className='flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-200/20'>
				<div className='w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-inner'>
					<MessageSquare size={30} />
				</div>
				<h3 className='text-lg font-bold text-base-content'>Your Conversations</h3>
				<p className='text-xs text-base-content/60 max-w-sm mt-1'>
					Select a conversation from the sidebar or click "Message" on any profile to start a real-time chat.
				</p>
			</div>
		);
	}

	const otherUser = conversation.otherParticipant;
	const userOnline = isOnline(otherUser?._id);

	return (
		<div className='flex-1 flex flex-col h-full bg-base-100 min-w-0'>
			{/* Chat Header */}
			<div className='p-3.5 border-b border-base-300 flex items-center justify-between gap-3 bg-base-100/90 backdrop-blur-sm z-10'>
				<div className='flex items-center gap-3 min-w-0'>
					{/* Mobile Back Button */}
					{onBackToSidebar && (
						<button
							onClick={onBackToSidebar}
							className='btn btn-ghost btn-sm btn-circle md:hidden text-base-content/70'
							title='Back to conversations'
						>
							<ArrowLeft size={18} />
						</button>
					)}

					{/* Avatar with Online Dot */}
					<div className='relative flex-shrink-0'>
						<img
							src={otherUser?.profilePicture || "/avatar.png"}
							alt={otherUser?.name || "User"}
							className='w-10 h-10 rounded-full object-cover border border-base-300'
						/>
						{userOnline && (
							<span
								className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-base-100'
								title='Active now'
							/>
						)}
					</div>

					{/* User Name & Status */}
					<div className='min-w-0'>
						<h3 className='font-bold text-sm text-base-content truncate'>
							{otherUser?.name || "LinkedIn Member"}
						</h3>
						<p className='text-[11px] text-base-content/50 truncate flex items-center gap-1.5'>
							{userOnline ? (
								<span className='text-success font-medium'>Active now</span>
							) : (
								<span>Offline</span>
							)}
							{otherUser?.headline && <span>· {otherUser.headline}</span>}
						</p>
					</div>
				</div>

				{/* View Profile Action */}
				{otherUser?.username && (
					<Link
						to={`/profile/${otherUser.username}`}
						className='btn btn-xs btn-outline gap-1 text-xs flex-shrink-0'
					>
						Profile <ExternalLink size={12} />
					</Link>
				)}
			</div>

			{/* Message Feed Area */}
			<div className='flex-1 overflow-y-auto p-4 space-y-1 bg-base-200/20'>
				{/* Load older messages button */}
				{hasNextPage && (
					<div className='text-center py-2'>
						<button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className='btn btn-xs btn-ghost text-xs text-base-content/60'
						>
							{isFetchingNextPage ? (
								<>
									<span className='loading loading-spinner loading-xs' /> Loading older...
								</>
							) : (
								"Load older messages"
							)}
						</button>
					</div>
				)}

				{isLoading ? (
					<div className='p-8 text-center text-xs text-base-content/50'>
						<span className='loading loading-spinner loading-sm text-primary mr-2' />
						Loading messages...
					</div>
				) : messages.length === 0 ? (
					<div className='h-full flex flex-col items-center justify-center text-center p-8 text-base-content/50'>
						<p className='text-sm font-semibold text-base-content'>Say hello!</p>
						<p className='text-xs mt-1'>
							This is the beginning of your conversation with {otherUser?.name || "this member"}.
						</p>
					</div>
				) : (
					messages.map((msg) => (
						<MessageBubble
							key={msg._id}
							message={msg}
							isOwnMessage={
								typeof msg.senderId === "object"
									? msg.senderId._id === authUser?._id
									: msg.senderId === authUser?._id
							}
						/>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Message Input Footer */}
			<MessageInput conversationId={conversation._id} />
		</div>
	);
};

export default ChatContainer;
