import React from "react";
import Sidebar from "../components/Sidebar";
import PostCreation from "../components/PostCreation";
import Post from "../components/Post";
import { AlertCircle, Users } from "lucide-react";
import RecommendedUser from "../components/RecommendedUser";
import { useAuthUser, useResendVerification } from "../hooks/useAuth";
import { useFeedPosts } from "../hooks/usePosts";
import { useSuggestedUsers } from "../hooks/useUser";

const HomePage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const { data: recommendedUsers } = useSuggestedUsers();
	const { data: postsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedPosts();
	const { mutate: resendVerification, isPending: isResending } = useResendVerification();

	// Flatten paginated results
	const posts = postsData?.pages.flatMap((page) => page.data) ?? [];

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='hidden lg:block lg:col-span-1'>
				<Sidebar user={authUser || null} />
			</div>

			<div className='col-span-1 lg:col-span-2 order-first lg:order-none'>
				{/* Email verification banner */}
				{authUser && !authUser.isVerified && (
					<div className='bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4 flex items-start gap-3'>
						<AlertCircle className='text-warning mt-0.5 flex-shrink-0' size={20} />
						<div className='flex-1'>
							<p className='text-sm font-semibold text-base-content'>Please verify your email address</p>
							<p className='text-xs text-base-content/60 mt-1'>
								Check your inbox for a verification link, or{" "}
								<button
									onClick={() => resendVerification(authUser.email!)}
									disabled={isResending}
									className='text-primary underline hover:no-underline disabled:opacity-50'
								>
									{isResending ? "Sending..." : "resend the email"}
								</button>
								.
							</p>
						</div>
					</div>
				)}

				<PostCreation user={authUser || null} />

				{isLoading ? (
					<div className='space-y-4'>
						{[1, 2, 3].map((i) => (
							<div key={i} className='bg-secondary rounded-lg shadow p-6 animate-pulse'>
								<div className='flex gap-3 mb-4'>
									<div className='w-10 h-10 rounded-full bg-base-300' />
									<div className='flex-1 space-y-2'>
										<div className='h-4 bg-base-300 rounded w-1/4' />
										<div className='h-3 bg-base-300 rounded w-1/3' />
									</div>
								</div>
								<div className='h-20 bg-base-300 rounded' />
							</div>
						))}
					</div>
				) : (
					<>
						{posts.map((post) => (
							<Post key={post._id} post={post} />
						))}

						{/* Load More */}
						{hasNextPage && (
							<div className='text-center mt-4'>
								<button
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className='btn btn-outline btn-sm'
								>
									{isFetchingNextPage ? "Loading..." : "Load more posts"}
								</button>
							</div>
						)}

						{posts.length === 0 && (
							<div className='bg-white rounded-lg shadow p-8 text-center'>
								<div className='mb-6'>
									<Users size={64} className='mx-auto text-blue-500' />
								</div>
								<h2 className='text-2xl font-bold mb-4 text-gray-800'>No Posts Yet</h2>
								<p className='text-gray-600 mb-6'>Connect with others to start seeing posts in your feed!</p>
							</div>
						)}
					</>
				)}
			</div>

			{recommendedUsers && recommendedUsers.length > 0 && (
				<div className='col-span-1 lg:col-span-1 hidden lg:block'>
					<div className='bg-secondary rounded-lg shadow p-4'>
						<h2 className='font-semibold mb-4'>People you may know</h2>
						{recommendedUsers.map((user) => (
							<RecommendedUser key={user._id} user={user} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default HomePage;
