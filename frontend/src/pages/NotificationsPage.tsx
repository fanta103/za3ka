import React from "react";
import {
	ExternalLink,
	Eye,
	MessageSquare,
	ThumbsUp,
	Trash2,
	UserPlus,
	Briefcase,
	CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { formatDistanceToNow } from "date-fns";
import { INotification, IPost } from "../types";
import { useAuthUser } from "../hooks/useAuth";
import { useNotifications, useMarkNotificationAsRead, useDeleteNotification } from "../hooks/useNotifications";

const NotificationsPage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const {
		data: notificationsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useNotifications();
	const { mutate: markAsReadMutation } = useMarkNotificationAsRead();
	const { mutate: deleteNotificationMutation } = useDeleteNotification();

	// Flatten paginated result pages
	const notifications = notificationsData?.pages.flatMap((page) => page.data) ?? [];

	const renderNotificationIcon = (type: string) => {
		switch (type) {
			case "like":
				return <ThumbsUp className='text-blue-500' size={16} />;
			case "comment":
				return <MessageSquare className='text-green-500' size={16} />;
			case "connectionAccepted":
				return <UserPlus className='text-purple-500' size={16} />;
			case "jobApplication":
				return <Briefcase className='text-primary' size={16} />;
			case "applicationStatus":
				return <CheckCircle className='text-emerald-500' size={16} />;
			default:
				return null;
		}
	};

	const renderNotificationContent = (notification: INotification) => {
		const relatedUser = notification.relatedUser;
		switch (notification.type) {
			case "like":
				return (
					<span>
						<strong>{relatedUser?.name || "Someone"}</strong> liked your post
					</span>
				);
			case "comment":
				return (
					<span>
						<Link to={`/profile/${relatedUser?.username}`} className='font-bold'>
							{relatedUser?.name || "Someone"}
						</Link>{" "}
						commented on your post
					</span>
				);
			case "connectionAccepted":
				return (
					<span>
						<Link to={`/profile/${relatedUser?.username}`} className='font-bold'>
							{relatedUser?.name || "Someone"}
						</Link>{" "}
						accepted your connection request
					</span>
				);
			case "jobApplication":
				return (
					<span>
						<Link to={`/profile/${relatedUser?.username}`} className='font-bold'>
							{relatedUser?.name || "A candidate"}
						</Link>{" "}
						submitted an application for your job listing
					</span>
				);
			case "applicationStatus":
				return (
					<span>
						Your job application status was updated by{" "}
						<strong className='font-bold'>{relatedUser?.name || "the recruiter"}</strong>
					</span>
				);
			default:
				return null;
		}
	};

	const renderRelatedPost = (notification: INotification) => {
		if (notification.type === "jobApplication") {
			return (
				<Link
					to='/my-jobs'
					className='mt-2 p-2 bg-base-200 rounded-md flex items-center space-x-2 hover:bg-base-300 transition-colors text-xs font-semibold text-primary'
				>
					<Briefcase size={14} />
					<span>Review Applicant in Dashboard</span>
					<ExternalLink size={12} className='ml-auto' />
				</Link>
			);
		}

		if (notification.type === "applicationStatus") {
			return (
				<Link
					to='/my-applications'
					className='mt-2 p-2 bg-base-200 rounded-md flex items-center space-x-2 hover:bg-base-300 transition-colors text-xs font-semibold text-primary'
				>
					<CheckCircle size={14} className='text-success' />
					<span>View Application Status</span>
					<ExternalLink size={12} className='ml-auto' />
				</Link>
			);
		}

		const relatedPost = notification.relatedPost;
		if (!relatedPost) return null;

		return (
			<Link
				to={`/post/${relatedPost._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				{relatedPost.image && (
					<img src={relatedPost.image} alt='Post preview' className='w-10 h-10 object-cover rounded' />
				)}
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm text-gray-600 truncate'>{relatedPost.content}</p>
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};


	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='col-span-1 lg:col-span-1'>
				<Sidebar user={authUser || null} />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-white rounded-lg shadow p-6'>
					<h1 className='text-2xl font-bold mb-6'>Notifications</h1>

					{isLoading ? (
						<p>Loading notifications...</p>
					) : notifications && notifications.length > 0 ? (
						<>
							<ul>
								{notifications.map((notification) => (
									<li
										key={notification._id}
										className={`bg-white border rounded-lg p-4 my-4 transition-all hover:shadow-md ${
											!notification.read ? "border-blue-500" : "border-gray-200"
										}`}
									>
										<div className='flex items-start justify-between'>
											<div className='flex items-center space-x-4'>
												<Link to={`/profile/${notification.relatedUser?.username}`}>
													<img
														src={notification.relatedUser?.profilePicture || "/avatar.png"}
														alt={notification.relatedUser?.name || "User"}
														className='w-12 h-12 rounded-full object-cover'
													/>
												</Link>

												<div>
													<div className='flex items-center gap-2'>
														<div className='p-1 bg-gray-100 rounded-full'>
															{renderNotificationIcon(notification.type)}
														</div>
														<p className='text-sm'>{renderNotificationContent(notification)}</p>
													</div>
													<p className='text-xs text-gray-500 mt-1'>
														{formatDistanceToNow(new Date(notification.createdAt), {
															addSuffix: true,
														})}
													</p>
													{renderRelatedPost(notification)}
												</div>
											</div>

											<div className='flex gap-2'>
												{!notification.read && (
													<button
														onClick={() => markAsReadMutation(notification._id)}
														className='p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors'
														aria-label='Mark as read'
													>
														<Eye size={16} />
													</button>
												)}

												<button
													onClick={() => deleteNotificationMutation(notification._id)}
													className='p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors'
													aria-label='Delete notification'
												>
													<Trash2 size={16} />
												</button>
											</div>
										</div>
									</li>
								))}
							</ul>

							{hasNextPage && (
								<div className='text-center mt-6'>
									<button
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										className='btn btn-outline btn-sm'
									>
										{isFetchingNextPage ? "Loading more..." : "Load older notifications"}
									</button>
								</div>
							)}
						</>
					) : (
						<p>No notification at the moment.</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default NotificationsPage;
