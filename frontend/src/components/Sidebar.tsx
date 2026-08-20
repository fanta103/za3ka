import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, Briefcase, FileText, CheckSquare } from "lucide-react";
import { IUser } from "../types";

interface SidebarProps {
	user: IUser | null;
}

export default function Sidebar({ user }: SidebarProps) {
	if (!user) return null;

	const connectionsCount = Array.isArray(user.connections) ? user.connections.length : 0;

	return (
		<div className='bg-secondary rounded-lg shadow'>
			<div className='p-4 text-center'>
				<div
					className='h-16 rounded-t-lg bg-cover bg-center'
					style={{
						backgroundImage: `url("${user.bannerImg || "/banner.png"}")`,
					}}
				/>
				<Link to={`/profile/${user.username}`}>
					<img
						src={user.profilePicture || "/avatar.png"}
						alt={user.name}
						className='w-20 h-20 rounded-full mx-auto mt-[-40px]'
					/>
					<h2 className='text-xl font-semibold mt-2'>{user.name}</h2>
				</Link>
				<p className='text-info'>{user.headline}</p>
				<p className='text-info text-xs'>{connectionsCount} connections</p>
			</div>
			<div className='border-t border-base-100 p-4'>
				<nav>
					<ul className='space-y-1.5 text-sm'>
						<li>
							<Link
								to='/'
								className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
							>
								<Home className='mr-2.5' size={18} /> Home
							</Link>
						</li>
						<li>
							<Link
								to='/jobs'
								className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
							>
								<Briefcase className='mr-2.5' size={18} /> Jobs
							</Link>
						</li>
						{user.role === "recruiter" || user.role === "admin" ? (
							<li>
								<Link
									to='/my-jobs'
									className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
								>
									<CheckSquare className='mr-2.5' size={18} /> My Jobs (Dashboard)
								</Link>
							</li>
						) : (
							<li>
								<Link
									to='/my-applications'
									className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
								>
									<FileText className='mr-2.5' size={18} /> My Applications
								</Link>
							</li>
						)}
						<li>
							<Link
								to='/network'
								className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
							>
								<UserPlus className='mr-2.5' size={18} /> My Network
							</Link>
						</li>
						<li>
							<Link
								to='/notifications'
								className='flex items-center py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors'
							>
								<Bell className='mr-2.5' size={18} /> Notifications
							</Link>
						</li>
					</ul>
				</nav>
			</div>
			<div className='border-t border-base-100 p-4'>
				<Link to={`/profile/${user.username}`} className='text-sm font-semibold'>
					Visit your profile
				</Link>
			</div>
		</div>
	);
}
