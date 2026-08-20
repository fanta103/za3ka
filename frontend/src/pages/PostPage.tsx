import React from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import { useAuthUser } from "../hooks/useAuth";
import { usePostById } from "../hooks/usePosts";

const PostPage: React.FC = () => {
	const { postId } = useParams<{ postId: string }>();
	const { data: authUser } = useAuthUser();
	const { data: post, isLoading } = usePostById(postId || "");

	if (isLoading) return <div>Loading post...</div>;
	if (!post) return <div>Post not found</div>;

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='hidden lg:block lg:col-span-1'>
				<Sidebar user={authUser || null} />
			</div>

			<div className='col-span-1 lg:col-span-3'>
				<Post post={post} />
			</div>
		</div>
	);
};

export default PostPage;
