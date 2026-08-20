import React, { useState, useRef } from "react";
import { Send, Image, X, Loader2 } from "lucide-react";
import { useSendMessage } from "../../hooks/useChat";

interface MessageInputProps {
	conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
	const [text, setText] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { mutate: sendMessage, isPending } = useSendMessage();

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			alert("Please select an image file");
			return;
		}

		setImageFile(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSend = (e?: React.FormEvent) => {
		if (e) e.preventDefault();

		if (!text.trim() && !imageFile) return;

		const formData = new FormData();
		formData.append("conversationId", conversationId);
		if (text.trim()) {
			formData.append("text", text.trim());
		}
		if (imageFile) {
			formData.append("image", imageFile);
		}

		sendMessage(formData, {
			onSuccess: () => {
				setText("");
				handleRemoveImage();
				if (textareaRef.current) {
					textareaRef.current.style.height = "auto";
					textareaRef.current.focus();
				}
			},
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);
		// Auto-grow height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
		}
	};

	return (
		<div className='p-3 bg-base-100 border-t border-base-300'>
			{/* Image Preview if selected */}
			{imagePreview && (
				<div className='relative inline-block mb-2 p-1 bg-base-200 rounded-xl border border-base-300'>
					<img
						src={imagePreview}
						alt='Upload preview'
						className='w-16 h-16 object-cover rounded-lg'
					/>
					<button
						type='button'
						onClick={handleRemoveImage}
						disabled={isPending}
						className='btn btn-circle btn-xs btn-neutral absolute -top-2 -right-2'
					>
						<X size={12} />
					</button>
				</div>
			)}

			<form onSubmit={handleSend} className='flex items-end gap-2'>
				{/* Hidden file input */}
				<input
					type='file'
					ref={fileInputRef}
					onChange={handleImageChange}
					accept='image/*'
					className='hidden'
					disabled={isPending}
				/>

				{/* Attach image button */}
				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					disabled={isPending}
					className='btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-primary'
					title='Attach Image'
				>
					<Image size={18} />
				</button>

				{/* Text input */}
				<div className='flex-1 relative'>
					<textarea
						ref={textareaRef}
						rows={1}
						value={text}
						onChange={handleTextareaChange}
						onKeyDown={handleKeyDown}
						placeholder='Write a message... (Enter to send, Shift+Enter for new line)'
						className='textarea textarea-bordered textarea-sm w-full resize-none py-2 px-3 text-sm focus:textarea-primary max-h-32 leading-relaxed'
						disabled={isPending}
					/>
				</div>

				{/* Send button */}
				<button
					type='submit'
					disabled={isPending || (!text.trim() && !imageFile)}
					className='btn btn-sm btn-primary btn-circle'
					title='Send Message'
				>
					{isPending ? (
						<Loader2 size={16} className='animate-spin' />
					) : (
						<Send size={15} />
					)}
				</button>
			</form>
		</div>
	);
};

export default MessageInput;
