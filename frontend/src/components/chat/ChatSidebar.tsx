import React, { useState } from "react";
import { Search, MessageSquare, Users, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IConversation } from "../../types";
import { useSocket } from "../../context/SocketContext";

interface ChatSidebarProps {
	conversations: IConversation[];
	selectedConversationId?: string;
	onSelectConversation: (conv: IConversation) => void;
	isLoading: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
	conversations,
	selectedConversationId,
	onSelectConversation,
	isLoading,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const { isOnline } = useSocket();

	const filteredConversations = conversations.filter((conv) => {
		const other = conv.otherParticipant;
		if (!other) return false;
		const nameMatch = other.name?.toLowerCase().includes(searchQuery.toLowerCase());
		const headlineMatch = other.headline?.toLowerCase().includes(searchQuery.toLowerCase());
		return nameMatch || headlineMatch;
	});

	return (
		<div className='flex flex-col h-full bg-base-100 border-r border-base-300 w-full md:w-80 lg:w-96 flex-shrink-0'>
			{/* Header & Search */}
			<div className='p-4 border-b border-base-300 space-y-3'>
				<div className='flex items-center justify-between'>
					<h2 className='text-lg font-black text-base-content tracking-tight flex items-center gap-2'>
						Messaging <MessageSquare size={18} className='text-primary' />
					</h2>
					<span className='badge badge-primary badge-sm font-semibold'>
						{conversations.length} {conversations.length === 1 ? "Chat" : "Chats"}
					</span>
				</div>

				<div className='relative'>
					<Search
						size={15}
						className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40'
					/>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search conversations...'
						className='input input-sm input-bordered w-full pl-9 text-xs focus:input-primary'
					/>
				</div>
			</div>

			{/* Conversations List */}
			<div className='flex-1 overflow-y-auto divide-y divide-base-200'>
				{isLoading ? (
					<div className='p-4 space-y-3'>
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className='flex items-center gap-3 animate-pulse'>
								<div className='w-11 h-11 bg-base-300 rounded-full flex-shrink-0' />
								<div className='flex-1 space-y-2'>
									<div className='h-3.5 bg-base-300 rounded w-1/2' />
									<div className='h-2.5 bg-base-200 rounded w-4/5' />
								</div>
							</div>
						))}
					</div>
				) : conversations.length === 0 ? (
					<div className='p-8 text-center text-base-content/50 space-y-2'>
						<div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2'>
							<Users size={22} />
						</div>
						<p className='font-bold text-sm text-base-content'>No messages yet</p>
						<p className='text-xs'>
							Start a conversation from candidate profiles or job applicant cards.
						</p>
					</div>
				) : filteredConversations.length === 0 ? (
					<div className='p-6 text-center text-xs text-base-content/50'>
						No conversations matching "{searchQuery}"
					</div>
				) : (
					filteredConversations.map((conv) => {
						const other = conv.otherParticipant;
						const isSelected = selectedConversationId === conv._id;
						const userOnline = isOnline(other?._id);
						const unread = conv.myUnreadCount || 0;

						const timeAgo = conv.lastMessageAt || conv.updatedAt
							? formatDistanceToNow(new Date(conv.lastMessageAt || conv.updatedAt), {
									addSuffix: false,
							  })
							: "";

						return (
							<button
								key={conv._id}
								onClick={() => onSelectConversation(conv)}
								className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-base-200/60 ${
									isSelected ? "bg-primary/10 border-l-4 border-primary" : ""
								}`}
							>
								{/* Avatar with Online Badge */}
								<div className='relative flex-shrink-0'>
									<img
										src={other?.profilePicture || "/avatar.png"}
										alt={other?.name || "User"}
										className='w-11 h-11 rounded-full object-cover border border-base-300'
									/>
									{userOnline && (
										<span
											className='absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full ring-2 ring-base-100'
											title='Online'
										/>
									)}
								</div>

								{/* Name + Last Message */}
								<div className='flex-1 min-w-0'>
									<div className='flex items-center justify-between gap-1'>
										<h4 className='font-bold text-xs text-base-content truncate'>
											{other?.name || "LinkedIn Member"}
										</h4>
										{timeAgo && (
											<span className='text-[10px] text-base-content/40 flex-shrink-0'>
												{timeAgo}
											</span>
										)}
									</div>

									{other?.headline && (
										<p className='text-[11px] text-base-content/50 truncate mt-0.5'>
											{other.headline}
										</p>
									)}

									<div className='flex items-center justify-between gap-2 mt-1'>
										<p
											className={`text-xs truncate ${
												unread > 0
													? "font-bold text-base-content"
													: "text-base-content/60"
											}`}
										>
											{conv.lastMessage || "No messages yet"}
										</p>

										{unread > 0 && (
											<span className='badge badge-primary badge-xs font-bold flex-shrink-0'>
												{unread}
											</span>
										)}
									</div>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

export default ChatSidebar;
