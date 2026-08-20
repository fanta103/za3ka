import React from "react";
import { Link } from "react-router-dom";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { IUser } from "../types";
import {
	useConnectionStatus,
	useSendConnectionRequest,
	useAcceptConnectionRequest,
	useRejectConnectionRequest,
} from "../hooks/useConnections";

interface RecommendedUserProps {
	user: IUser;
}

const RecommendedUser: React.FC<RecommendedUserProps> = ({ user }) => {
	const { data: connectionStatus, isLoading } = useConnectionStatus(user._id);
	const { mutate: sendConnectionRequest } = useSendConnectionRequest(user._id);
	const { mutate: acceptRequest } = useAcceptConnectionRequest();
	const { mutate: rejectRequest } = useRejectConnectionRequest();

	const renderButton = () => {
		if (isLoading) {
			return (
				<button className='px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-500' disabled>
					Loading...
				</button>
			);
		}

		switch (connectionStatus?.status) {
			case "pending":
				return (
					<button
						className='px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center'
						disabled
					>
						<Clock size={16} className='mr-1' />
						Pending
					</button>
				);
			case "received":
				return (
					<div className='flex gap-2 justify-center'>
						<button
							onClick={() => connectionStatus?.requestId && acceptRequest(connectionStatus.requestId)}
							className='rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white'
						>
							<Check size={16} />
						</button>
						<button
							onClick={() => connectionStatus?.requestId && rejectRequest(connectionStatus.requestId)}
							className='rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white'
						>
							<X size={16} />
						</button>
					</div>
				);
			case "connected":
				return (
					<button
						className='px-3 py-1 rounded-full text-sm bg-green-500 text-white flex items-center'
						disabled
					>
						<UserCheck size={16} className='mr-1' />
						Connected
					</button>
				);
			default:
				return (
					<button
						className='px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center'
						onClick={handleConnect}
					>
						<UserPlus size={16} className='mr-1' />
						Connect
					</button>
				);
		}
	};

	const handleConnect = () => {
		if (connectionStatus?.status === "not_connected" || !connectionStatus?.status) {
			sendConnectionRequest(user._id);
		}
	};

	return (
		<div className='flex items-center justify-between mb-4'>
			<Link to={`/profile/${user.username}`} className='flex items-center flex-grow'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-12 h-12 rounded-full mr-3'
				/>
				<div>
					<h3 className='font-semibold text-sm'>{user.name}</h3>
					<p className='text-xs text-info'>{user.headline}</p>
				</div>
			</Link>
			{renderButton()}
		</div>
	);
};

export default RecommendedUser;
