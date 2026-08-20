import React from "react";
import { Link } from "react-router-dom";
import { IConnectionRequest } from "../types";
import { useAcceptConnectionRequest, useRejectConnectionRequest } from "../hooks/useConnections";

interface FriendRequestProps {
	request: IConnectionRequest;
}

const FriendRequest: React.FC<FriendRequestProps> = ({ request }) => {
	const { mutate: acceptConnectionRequest } = useAcceptConnectionRequest();
	const { mutate: rejectConnectionRequest } = useRejectConnectionRequest();

	return (
		<div className='bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md'>
			<div className='flex items-center gap-4'>
				<Link to={`/profile/${request.sender.username}`}>
					<img
						src={request.sender.profilePicture || "/avatar.png"}
						alt={request.sender.name}
						className='w-16 h-16 rounded-full object-cover'
					/>
				</Link>

				<div>
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-lg'>
						{request.sender.name}
					</Link>
					<p className='text-gray-600'>{request.sender.headline}</p>
				</div>
			</div>

			<div className='space-x-2'>
				<button
					className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors'
					onClick={() => acceptConnectionRequest(request._id)}
				>
					Accept
				</button>
				<button
					className='bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
					onClick={() => rejectConnectionRequest(request._id)}
				>
					Reject
				</button>
			</div>
		</div>
	);
};

export default FriendRequest;
