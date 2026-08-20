import React, { useState } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, ExternalLink, X } from "lucide-react";
import { IMessage } from "../../types";

interface MessageBubbleProps {
	message: IMessage;
	isOwnMessage: boolean;
	showSenderName?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
	message,
	isOwnMessage,
	showSenderName = false,
}) => {
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);

	const sender = typeof message.senderId === "object" ? message.senderId : null;
	const isRead = message.readBy && message.readBy.length > 1;

	const timeStr = message.createdAt
		? format(new Date(message.createdAt), "h:mm a")
		: "";

	return (
		<>
			<div className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} my-1.5 group`}>
				{/* Avatar for receiver's messages */}
				{!isOwnMessage && (
					<div className='chat-image avatar'>
						<div className='w-8 h-8 rounded-full border border-base-300'>
							<img
								src={sender?.profilePicture || "/avatar.png"}
								alt={sender?.name || "User"}
								className='object-cover'
							/>
						</div>
					</div>
				)}

				{/* Sender name for received messages in group/header */}
				{!isOwnMessage && showSenderName && sender?.name && (
					<div className='chat-header text-[11px] text-base-content/50 mb-0.5 ml-1 font-medium'>
						{sender.name}
					</div>
				)}

				{/* Message Content Bubble */}
				<div
					className={`chat-bubble text-sm leading-relaxed max-w-sm sm:max-w-md break-words rounded-2xl shadow-sm ${
						isOwnMessage
							? "chat-bubble-primary text-primary-content"
							: "bg-base-200 text-base-content border border-base-300/80"
					}`}
				>
					{/* Attached Image */}
					{message.image && (
						<div className='mb-2 overflow-hidden rounded-xl cursor-pointer'>
							<img
								src={message.image}
								alt='Attachment'
								onClick={() => setIsImageModalOpen(true)}
								className='max-h-60 w-full object-cover rounded-xl hover:opacity-95 transition-opacity'
							/>
						</div>
					)}

					{/* Message Text */}
					{message.text && (
						<p className='whitespace-pre-line text-[13px]'>{message.text}</p>
					)}
				</div>

				{/* Footer: Timestamp & Read Status */}
				<div className='chat-footer opacity-60 text-[10px] flex items-center gap-1 mt-0.5 px-1'>
					<span>{timeStr}</span>
					{isOwnMessage && (
						<span
							className={`inline-flex items-center ${
								isRead ? "text-primary font-bold" : "text-base-content/50"
							}`}
							title={isRead ? "Read" : "Sent"}
						>
							{isRead ? <CheckCheck size={13} /> : <Check size={13} />}
						</span>
					)}
				</div>
			</div>

			{/* Fullscreen Image Preview Modal */}
			{isImageModalOpen && message.image && (
				<div
					onClick={() => setIsImageModalOpen(false)}
					className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm'
				>
					<div className='relative max-w-3xl max-h-[90vh]' onClick={(e) => e.stopPropagation()}>
						<button
							onClick={() => setIsImageModalOpen(false)}
							className='btn btn-circle btn-sm bg-black/60 text-white border-0 absolute -top-10 right-0 hover:bg-black'
						>
							<X size={18} />
						</button>
						<img
							src={message.image}
							alt='Full preview'
							className='max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl'
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default MessageBubble;
