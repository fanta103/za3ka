import React, { useState } from "react";
import { Image, Loader, X } from "lucide-react";
import { IUser } from "../types";
import { useCreatePost } from "../hooks/usePosts";

interface PostCreationProps {
	user: IUser | null;
}

const PostCreation: React.FC<PostCreationProps> = ({ user }) => {
	const [content, setContent] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const { mutate: createPostMutation, isPending } = useCreatePost();

	if (!user) return null;

	const resetForm = () => {
		setContent("");
		setImage(null);
		setImagePreview(null);
	};

	const handlePostCreation = () => {
		if (!content.trim() && !image) return;

		const formData = new FormData();
		formData.append("content", content);
		if (image) {
			formData.append("image", image);
		}

		createPostMutation(formData, {
			onSuccess: () => {
				resetForm();
			},
		});
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const removeImage = () => {
		setImage(null);
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
			setImagePreview(null);
		}
	};

	return (
		<div className='bg-secondary rounded-lg shadow mb-4 p-4'>
			<div className='flex space-x-3'>
				<img src={user.profilePicture || "/avatar.png"} alt={user.name} className='size-12 rounded-full object-cover' />
				<textarea
					placeholder="What's on your mind?"
					className='w-full p-3 rounded-lg bg-base-100 hover:bg-base-200 focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 min-h-[100px]'
					value={content}
					onChange={(e) => setContent(e.target.value)}
				/>
			</div>

			{imagePreview && (
				<div className='mt-4 relative'>
					<img src={imagePreview} alt='Selected preview' className='w-full max-h-96 object-cover rounded-lg' />
					<button
						type='button'
						onClick={removeImage}
						className='absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors'
						aria-label='Remove image'
					>
						<X size={16} />
					</button>
				</div>
			)}

			<div className='flex justify-between items-center mt-4'>
				<div className='flex space-x-4'>
					<label className='flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer'>
						<Image size={20} className='mr-2' />
						<span>Photo</span>
						<input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
					</label>
				</div>

				<button
					className='bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50'
					onClick={handlePostCreation}
					disabled={isPending || (!content.trim() && !image)}
				>
					{isPending ? <Loader className='size-5 animate-spin' /> : "Share"}
				</button>
			</div>
		</div>
	);
};

export default PostCreation;
