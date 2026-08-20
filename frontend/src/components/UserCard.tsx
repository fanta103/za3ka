import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { IUser } from "../types";

interface UserCardProps {
	user: IUser;
	isConnection?: boolean;
}

function UserCard({ user, isConnection }: UserCardProps) {
	const connectionsCount = Array.isArray(user.connections) ? user.connections.length : 0;

	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center justify-between transition-all hover:shadow-md h-full'>
			<div className='flex flex-col items-center text-center w-full'>
				<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
					<img
						src={user.profilePicture || "/avatar.png"}
						alt={user.name}
						className='w-20 h-20 rounded-full object-cover mb-3'
					/>
					<h3 className='font-semibold text-base text-center'>{user.name}</h3>
				</Link>
				<p className='text-xs text-gray-600 text-center line-clamp-2 mt-1'>{user.headline}</p>
				<p className='text-xs text-gray-400 mt-1'>{connectionsCount} connections</p>
			</div>

			<div className='w-full mt-4 flex gap-2'>
				<Link
					to={`/chat?with=${user._id}`}
					className='flex-1 btn btn-sm btn-outline gap-1 text-xs'
				>
					<MessageSquare size={14} className='text-primary' /> Message
				</Link>
				<button className='flex-1 btn btn-sm btn-primary text-xs'>
					{isConnection ? "Connected" : "Connect"}
				</button>
			</div>
		</div>
	);
}

export default UserCard;

