import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Briefcase, FileText, Loader } from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import { formatDistanceToNow } from "date-fns";

type TabType = "all" | "users" | "jobs" | "posts";

const SearchPage: React.FC = () => {
	const [query, setQuery] = useState("");
	const [activeTab, setActiveTab] = useState<TabType>("all");

	const { data, isLoading, isFetching } = useSearch(query, activeTab);

	const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
		{ key: "all", label: "All", icon: <Search size={16} /> },
		{ key: "users", label: "People", icon: <User size={16} /> },
		{ key: "jobs", label: "Jobs", icon: <Briefcase size={16} /> },
		{ key: "posts", label: "Posts", icon: <FileText size={16} /> },
	];

	const hasResults = data && (
		(data.users?.length || 0) + (data.jobs?.length || 0) + (data.posts?.length || 0) > 0
	);

	return (
		<div className='max-w-3xl mx-auto px-4 py-6'>
			{/* Search Header */}
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-base-content mb-4'>Search</h1>
				<div className='relative'>
					<Search size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40' />
					<input
						id='search-input'
						type='text'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder='Search people, jobs, posts...'
						className='input input-bordered w-full pl-12 text-base'
						autoFocus
					/>
					{isFetching && (
						<Loader
							size={18}
							className='absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary'
						/>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className='flex gap-2 mb-6 border-b border-base-300'>
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
							activeTab === tab.key
								? "border-primary text-primary"
								: "border-transparent text-base-content/60 hover:text-base-content"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Loading skeleton */}
			{isLoading && query.trim().length >= 2 && (
				<div className='space-y-3'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='bg-base-100 rounded-xl p-4 animate-pulse'>
							<div className='flex gap-3'>
								<div className='w-12 h-12 rounded-full bg-base-300' />
								<div className='flex-1 space-y-2'>
									<div className='h-4 bg-base-300 rounded w-1/3' />
									<div className='h-3 bg-base-300 rounded w-1/2' />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Empty state */}
			{query.trim().length < 2 && (
				<div className='text-center py-16 text-base-content/40'>
					<Search size={48} className='mx-auto mb-4 opacity-30' />
					<p className='text-lg'>Type at least 2 characters to search</p>
				</div>
			)}

			{/* No results */}
			{!isLoading && query.trim().length >= 2 && !hasResults && (
				<div className='text-center py-16 text-base-content/40'>
					<p className='text-lg'>No results found for "{query}"</p>
					<p className='text-sm mt-2'>Try a different search term.</p>
				</div>
			)}

			{/* Results */}
			{!isLoading && data && (
				<div className='space-y-6'>
					{/* People */}
					{(activeTab === "all" || activeTab === "users") && (data.users?.length || 0) > 0 && (
						<section>
							{activeTab === "all" && (
								<h2 className='text-lg font-semibold text-base-content mb-3 flex items-center gap-2'>
									<User size={18} /> People
								</h2>
							)}
							<div className='space-y-2'>
								{data.users!.map((user) => (
									<Link
										key={user._id}
										to={`/profile/${user.username}`}
										className='bg-base-100 hover:bg-base-200 transition-colors rounded-xl p-4 flex items-center gap-4 block'
									>
										<img
											src={user.profilePicture || "/avatar.png"}
											alt={user.name}
											className='w-12 h-12 rounded-full object-cover flex-shrink-0'
										/>
										<div className='flex-1 min-w-0'>
											<p className='font-semibold text-base-content truncate'>{user.name}</p>
											<p className='text-sm text-base-content/60 truncate'>
												{user.headline || `@${user.username}`}
											</p>
											{user.location && (
												<p className='text-xs text-base-content/40 truncate'>{user.location}</p>
											)}
										</div>
										{user.role && user.role !== "jobseeker" && (
											<span className='badge badge-primary badge-sm capitalize flex-shrink-0'>
												{user.role}
											</span>
										)}
									</Link>
								))}
							</div>
						</section>
					)}

					{/* Jobs */}
					{(activeTab === "all" || activeTab === "jobs") && (data.jobs?.length || 0) > 0 && (
						<section>
							{activeTab === "all" && (
								<h2 className='text-lg font-semibold text-base-content mb-3 flex items-center gap-2'>
									<Briefcase size={18} /> Jobs
								</h2>
							)}
							<div className='space-y-2'>
								{data.jobs!.map((job) => (
									<div key={job._id} className='bg-base-100 rounded-xl p-4'>
										<div className='flex items-start justify-between gap-3'>
											<div className='flex-1 min-w-0'>
												<p className='font-semibold text-base-content truncate'>{job.title}</p>
												<p className='text-sm text-base-content/60'>{job.company}</p>
												<div className='flex items-center gap-2 mt-1 flex-wrap'>
													<span className='badge badge-outline badge-sm'>{job.type}</span>
													<span className='text-xs text-base-content/40'>{job.location}</span>
													{job.salaryMin && (
														<span className='text-xs text-success'>
															${job.salaryMin.toLocaleString()}
															{job.salaryMax ? ` – $${job.salaryMax.toLocaleString()}` : "+"}
														</span>
													)}
												</div>
											</div>
											<span className={`badge flex-shrink-0 ${job.status === "open" ? "badge-success" : "badge-warning"}`}>
												{job.status}
											</span>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Posts */}
					{(activeTab === "all" || activeTab === "posts") && (data.posts?.length || 0) > 0 && (
						<section>
							{activeTab === "all" && (
								<h2 className='text-lg font-semibold text-base-content mb-3 flex items-center gap-2'>
									<FileText size={18} /> Posts
								</h2>
							)}
							<div className='space-y-2'>
								{data.posts!.map((post) => (
									<Link
										key={post._id}
										to={`/post/${post._id}`}
										className='bg-base-100 hover:bg-base-200 transition-colors rounded-xl p-4 block'
									>
										<div className='flex items-center gap-3 mb-2'>
											<img
												src={post.author.profilePicture || "/avatar.png"}
												alt={post.author.name}
												className='w-8 h-8 rounded-full object-cover flex-shrink-0'
											/>
											<div>
												<p className='text-sm font-medium text-base-content'>{post.author.name}</p>
												<p className='text-xs text-base-content/40'>
													{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
												</p>
											</div>
										</div>
										<p className='text-sm text-base-content/80 line-clamp-2'>{post.content}</p>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			)}
		</div>
	);
};

export default SearchPage;
