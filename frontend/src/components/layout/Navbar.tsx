import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Bell,
	Home,
	LogOut,
	User,
	Users,
	Search,
	X,
	Briefcase,
	FileText,
	PlusCircle,
	CheckSquare,
} from "lucide-react";
import { useAuthUser, useLogout } from "../../hooks/useAuth";
import { useUnreadNotificationsCount } from "../../hooks/useNotifications";
import { useConnectionRequests } from "../../hooks/useConnections";
import { useSearch } from "../../hooks/useSearch";
import PostJobModal from "../jobs/PostJobModal";

const Navbar: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const { data: unreadData } = useUnreadNotificationsCount();
	const { data: connectionRequests } = useConnectionRequests();
	const { mutate: logout } = useLogout();

	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchDropdown, setShowSearchDropdown] = useState(false);
	const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const { data: searchResults, isFetching: isSearching } = useSearch(searchQuery);

	const unreadNotificationCount = unreadData?.count ?? 0;
	const unreadConnectionRequestsCount = connectionRequests ? connectionRequests.length : 0;

	const isRecruiter = authUser?.role === "recruiter" || authUser?.role === "admin";
	const isJobseeker = authUser?.role === "jobseeker" || !authUser?.role;

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowSearchDropdown(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim().length >= 2) {
			setShowSearchDropdown(false);
			navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	const hasDropdownResults =
		searchResults &&
		((searchResults.users?.length || 0) + (searchResults.jobs?.length || 0) + (searchResults.posts?.length || 0) > 0);

	return (
		<>
			<nav className='bg-secondary shadow-md sticky top-0 z-40'>
				<div className='max-w-7xl mx-auto px-4'>
					<div className='flex justify-between items-center py-2.5 gap-4'>
						{/* Logo + Search */}
						<div className='flex items-center gap-3 flex-1'>
							<Link to='/'>
								<img className='h-8 rounded flex-shrink-0' src='/small-logo.png' alt='LinkedIn' />
							</Link>

							{authUser && (
								<div ref={searchRef} className='relative flex-1 max-w-xs'>
									<form onSubmit={handleSearchSubmit}>
										<div className='relative'>
											<Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40' />
											<input
												type='text'
												id='navbar-search'
												value={searchQuery}
												onChange={(e) => {
													setSearchQuery(e.target.value);
													setShowSearchDropdown(e.target.value.trim().length >= 2);
												}}
												onFocus={() => {
													if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
												}}
												placeholder='Search jobs, people, posts...'
												className='input input-sm input-bordered w-full pl-9 pr-8'
											/>
											{searchQuery && (
												<button
													type='button'
													onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
													className='absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
												>
													<X size={14} />
												</button>
											)}
										</div>
									</form>

									{/* Quick-results dropdown */}
									{showSearchDropdown && searchQuery.trim().length >= 2 && (
										<div className='absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto'>
											{isSearching && (
												<div className='p-4 text-center text-sm text-base-content/50'>Searching...</div>
											)}

											{!isSearching && !hasDropdownResults && (
												<div className='p-4 text-center text-sm text-base-content/50'>No results for "{searchQuery}"</div>
											)}

											{!isSearching && hasDropdownResults && (
												<>
													{/* Users */}
													{searchResults.users?.slice(0, 3).map((user) => (
														<Link
															key={user._id}
															to={`/profile/${user.username}`}
															onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
															className='flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors'
														>
															<img src={user.profilePicture || "/avatar.png"} alt={user.name} className='w-8 h-8 rounded-full object-cover' />
															<div className='min-w-0'>
																<p className='text-sm font-medium truncate'>{user.name}</p>
																<p className='text-xs text-base-content/50 truncate'>{user.headline || `@${user.username}`}</p>
															</div>
															<span className='badge badge-ghost badge-xs ml-auto'>Person</span>
														</Link>
													))}

													{/* Jobs */}
													{searchResults.jobs?.slice(0, 2).map((job) => (
														<Link
															key={job._id}
															to={`/jobs/${job._id}`}
															onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
															className='flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors cursor-pointer'
														>
															<div className='w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0'>
																<Briefcase size={14} className='text-primary' />
															</div>
															<div className='min-w-0'>
																<p className='text-sm font-medium truncate'>{job.title}</p>
																<p className='text-xs text-base-content/50 truncate'>{job.company} · {job.location}</p>
															</div>
															<span className='badge badge-success badge-xs ml-auto'>Job</span>
														</Link>
													))}

													{/* View all link */}
													<button
														onClick={handleSearchSubmit}
														className='w-full text-center px-4 py-3 text-sm text-primary hover:bg-base-200 border-t border-base-300 transition-colors'
													>
														See all results for "{searchQuery}"
													</button>
												</>
											)}
										</div>
									)}
								</div>
							)}
						</div>

						{/* Nav links */}
						<div className='flex items-center gap-2 md:gap-5'>
							{authUser ? (
								<>
									{/* Home */}
									<Link to='/' className='text-neutral hover:text-primary transition-colors flex flex-col items-center'>
										<Home size={19} />
										<span className='text-[11px] hidden md:block'>Home</span>
									</Link>

									{/* Jobs Feed (Universal) */}
									<Link to='/jobs' className='text-neutral hover:text-primary transition-colors flex flex-col items-center'>
										<Briefcase size={19} />
										<span className='text-[11px] hidden md:block'>Jobs</span>
									</Link>

									{/* Jobseeker: My Applications */}
									{isJobseeker && (
										<Link
											to='/my-applications'
											className='text-neutral hover:text-primary transition-colors flex flex-col items-center'
										>
											<FileText size={19} />
											<span className='text-[11px] hidden md:block'>Applications</span>
										</Link>
									)}

									{/* Recruiter: My Jobs (Dashboard) */}
									{isRecruiter && (
										<Link
											to='/my-jobs'
											className='text-neutral hover:text-primary transition-colors flex flex-col items-center'
										>
											<CheckSquare size={19} />
											<span className='text-[11px] hidden md:block'>My Jobs</span>
										</Link>
									)}

									{/* Recruiter: Post a Job CTA */}
									{isRecruiter && (
										<button
											onClick={() => setIsPostJobModalOpen(true)}
											className='text-neutral hover:text-primary transition-colors flex flex-col items-center'
											title='Post a Job'
										>
											<PlusCircle size={19} className='text-primary' />
											<span className='text-[11px] hidden md:block font-medium text-primary'>
												Post a Job
											</span>
										</button>
									)}

									{/* Network */}
									<Link to='/network' className='text-neutral hover:text-primary transition-colors flex flex-col items-center relative'>
										<Users size={19} />
										<span className='text-[11px] hidden md:block'>Network</span>
										{unreadConnectionRequestsCount > 0 && (
											<span className='absolute -top-1 -right-1 md:right-3 bg-blue-500 text-white text-[10px] rounded-full size-3.5 flex items-center justify-center font-bold'>
												{unreadConnectionRequestsCount}
											</span>
										)}
									</Link>

									{/* Notifications */}
									<Link to='/notifications' className='text-neutral hover:text-primary transition-colors flex flex-col items-center relative'>
										<Bell size={19} />
										<span className='text-[11px] hidden md:block'>Notifications</span>
										{unreadNotificationCount > 0 && (
											<span className='absolute -top-1 -right-1 md:right-5 bg-blue-500 text-white text-[10px] rounded-full size-3.5 flex items-center justify-center font-bold'>
												{unreadNotificationCount}
											</span>
										)}
									</Link>

									{/* Profile */}
									<Link to={`/profile/${authUser.username}`} className='text-neutral hover:text-primary transition-colors flex flex-col items-center'>
										<User size={19} />
										<span className='text-[11px] hidden md:block'>Me</span>
									</Link>

									{/* Logout */}
									<button
										className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 ml-1'
										onClick={() => logout()}
										title='Logout'
									>
										<LogOut size={19} />
										<span className='hidden md:inline text-xs'>Logout</span>
									</button>
								</>
							) : (
								<>
									<Link to='/login' className='btn btn-ghost btn-sm'>
										Sign In
									</Link>
									<Link to='/signup' className='btn btn-primary btn-sm'>
										Join now
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* Post Job Modal */}
			{isRecruiter && (
				<PostJobModal
					isOpen={isPostJobModalOpen}
					onClose={() => setIsPostJobModalOpen(false)}
				/>
			)}
		</>
	);
};

export default Navbar;

