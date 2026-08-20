import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useConversations, useGetOrCreateConversation } from "../hooks/useChat";
import { IConversation } from "../types";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatContainer from "../components/chat/ChatContainer";

const ChatPage: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const targetUserId = searchParams.get("with");

	const { data: conversations = [], isLoading } = useConversations();
	const { mutate: getOrCreateConversation, isPending: isStartingChat } =
		useGetOrCreateConversation();

	const [selectedConversation, setSelectedConversation] =
		useState<IConversation | null>(null);

	// Handle `?with=userId` param from profile/usercard clicks
	useEffect(() => {
		if (targetUserId) {
			getOrCreateConversation(targetUserId, {
				onSuccess: (createdConv) => {
					setSelectedConversation(createdConv);
					// Clear the query parameter once opened
					setSearchParams({}, { replace: true });
				},
			});
		}
	}, [targetUserId, getOrCreateConversation, setSearchParams]);

	// Auto-select first conversation on desktop if none selected yet and no targetUserId
	useEffect(() => {
		if (!selectedConversation && conversations.length > 0 && !targetUserId) {
			setSelectedConversation(conversations[0]);
		}
	}, [conversations, selectedConversation, targetUserId]);

	// Keep selectedConversation updated when conversations list refetches
	useEffect(() => {
		if (selectedConversation) {
			const updated = conversations.find((c) => c._id === selectedConversation._id);
			if (updated) {
				setSelectedConversation(updated);
			}
		}
	}, [conversations]);

	return (
		<div className='max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)]'>
			<div className='bg-base-100 border border-base-300 rounded-2xl shadow-sm h-full flex overflow-hidden'>
				{/* Sidebar (Conversations List) */}
				<div
					className={`${
						selectedConversation ? "hidden md:flex" : "flex"
					} w-full md:w-auto h-full flex-shrink-0`}
				>
					<ChatSidebar
						conversations={conversations}
						selectedConversationId={selectedConversation?._id}
						onSelectConversation={(conv) => setSelectedConversation(conv)}
						isLoading={isLoading || isStartingChat}
					/>
				</div>

				{/* Chat Container (Active Messages & Input) */}
				<div
					className={`${
						!selectedConversation ? "hidden md:flex" : "flex"
					} flex-1 h-full min-w-0`}
				>
					<ChatContainer
						conversation={selectedConversation}
						onBackToSidebar={() => setSelectedConversation(null)}
					/>
				</div>
			</div>
		</div>
	);
};

export default ChatPage;
