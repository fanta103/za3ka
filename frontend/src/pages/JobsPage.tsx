import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Briefcase, Plus, Filter, X, Sparkles, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import JobCard from "../components/jobs/JobCard";
import PostJobModal from "../components/jobs/PostJobModal";
import { useAuthUser } from "../hooks/useAuth";
import { useJobs } from "../hooks/useJobs";
import { JobType } from "../types";

const jobTypes: { label: string; value: string }[] = [
	{ label: "All Types", value: "" },
	{ label: "Full-time", value: "full-time" },
	{ label: "Part-time", value: "part-time" },
	{ label: "Contract", value: "contract" },
	{ label: "Internship", value: "internship" },
	{ label: "Remote", value: "remote" },
];

const JobsPage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const [searchParams, setSearchParams] = useSearchParams();

	// Local filter states synced with URL
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [location, setLocation] = useState(searchParams.get("location") || "");
	const [type, setType] = useState(searchParams.get("type") || "");
	const [isPostModalOpen, setIsPostModalOpen] = useState(false);

	const isRecruiter = authUser?.role === "recruiter" || authUser?.role === "admin";

	// Debounced or direct query parameters
	const filters = {
		search: searchParams.get("search") || undefined,
		location: searchParams.get("location") || undefined,
		type: searchParams.get("type") || undefined,
		status: "open",
	};

	const {
		data: jobsData,
		isLoading,
		isFetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useJobs(filters);

	const jobs = jobsData?.pages.flatMap((page) => page.data) ?? [];

	// Update search params on filter apply
	const handleApplyFilters = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		const params = new URLSearchParams();
		if (search.trim()) params.set("search", search.trim());
		if (location.trim()) params.set("location", location.trim());
		if (type) params.set("type", type);
		setSearchParams(params);
	};

	const handleClearFilters = () => {
		setSearch("");
		setLocation("");
		setType("");
		setSearchParams(new URLSearchParams());
	};

	const hasActiveFilters = Boolean(
		searchParams.get("search") || searchParams.get("location") || searchParams.get("type")
	);

	return (
		<div className='max-w-7xl mx-auto px-4 py-6'>
			<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
				{/* Left Sidebar */}
				<div className='hidden lg:block lg:col-span-1'>
					<Sidebar user={authUser || null} />

					{/* Recruiter Banner Card */}
					{isRecruiter && (
						<div className='bg-primary/10 border border-primary/30 rounded-xl p-4 mt-4 text-center'>
							<Briefcase className='mx-auto text-primary mb-2' size={24} />
							<h4 className='font-bold text-sm text-base-content'>Hiring for your team?</h4>
							<p className='text-xs text-base-content/70 mt-1 mb-3'>
								Post open roles and discover qualified applicants.
							</p>
							<button
								onClick={() => setIsPostModalOpen(true)}
								className='btn btn-xs btn-primary w-full'
							>
								Post a Free Job
							</button>
						</div>
					)}
				</div>

				{/* Main Content Area */}
				<div className='col-span-1 lg:col-span-3 space-y-6'>
					{/* Search & Filter Header Card */}
					<div className='bg-base-100 border border-base-300 rounded-2xl p-5 shadow-sm space-y-4'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
							<div>
								<h1 className='text-2xl font-black text-base-content tracking-tight flex items-center gap-2'>
									Explore Jobs <Sparkles size={20} className='text-primary' />
								</h1>
								<p className='text-xs text-base-content/60'>
									Discover your next career opportunity across verified companies
								</p>
							</div>

							{isRecruiter && (
								<button
									onClick={() => setIsPostModalOpen(true)}
									className='btn btn-sm btn-primary gap-1.5 shadow-sm'
								>
									<Plus size={16} /> Post a Job
								</button>
							)}
						</div>

						{/* Filters Form */}
						<form onSubmit={handleApplyFilters} className='space-y-3 pt-2'>
							<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
								{/* Search Query */}
								<div className='relative'>
									<Search
										size={16}
										className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40'
									/>
									<input
										type='text'
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder='Job title, skill, company...'
										className='input input-sm input-bordered w-full pl-9 text-sm'
									/>
								</div>

								{/* Location */}
								<div className='relative'>
									<MapPin
										size={16}
										className='absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40'
									/>
									<input
										type='text'
										value={location}
										onChange={(e) => setLocation(e.target.value)}
										placeholder='City, state, or Remote'
										className='input input-sm input-bordered w-full pl-9 text-sm'
									/>
								</div>

								{/* Employment Type */}
								<div>
									<select
										value={type}
										onChange={(e) => setType(e.target.value)}
										className='select select-sm select-bordered w-full text-sm'
									>
										{jobTypes.map((t) => (
											<option key={t.value} value={t.value}>
												{t.label}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className='flex items-center justify-between pt-1'>
								<div className='flex items-center gap-2'>
									<button type='submit' className='btn btn-sm btn-primary text-xs px-5'>
										Search Jobs
									</button>
									{hasActiveFilters && (
										<button
											type='button'
											onClick={handleClearFilters}
											className='btn btn-sm btn-ghost text-xs text-base-content/60'
										>
											<X size={14} /> Clear
										</button>
									)}
								</div>

								{isFetching && (
									<span className='text-xs text-base-content/40 animate-pulse'>
										Refreshing jobs...
									</span>
								)}
							</div>
						</form>
					</div>

					{/* Job Listings Grid */}
					{isLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{[1, 2, 3, 4].map((n) => (
								<div
									key={n}
									className='h-48 bg-base-100 border border-base-300 rounded-2xl p-5 animate-pulse flex flex-col justify-between'
								>
									<div className='space-y-3'>
										<div className='h-5 bg-base-300 rounded w-2/3' />
										<div className='h-4 bg-base-200 rounded w-1/3' />
										<div className='h-3 bg-base-200 rounded w-full' />
									</div>
									<div className='h-4 bg-base-200 rounded w-1/2' />
								</div>
							))}
						</div>
					) : jobs.length > 0 ? (
						<>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{jobs.map((job) => (
									<JobCard key={job._id} job={job} />
								))}
							</div>

							{/* Load more button */}
							{hasNextPage && (
								<div className='text-center pt-4'>
									<button
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										className='btn btn-outline btn-sm min-w-36'
									>
										{isFetchingNextPage ? (
											<>
												<span className='loading loading-spinner loading-xs mr-2' />
												Loading more...
											</>
										) : (
											"Load More Jobs"
										)}
									</button>
								</div>
							)}
						</>
					) : (
						<div className='bg-base-100 border border-base-300 rounded-2xl p-12 text-center'>
							<Briefcase size={36} className='mx-auto text-base-content/30 mb-3' />
							<h3 className='text-lg font-bold text-base-content'>No matching jobs found</h3>
							<p className='text-xs text-base-content/60 max-w-sm mx-auto mt-1 mb-4'>
								Try adjusting your search criteria or clearing filters to see all available roles.
							</p>
							{hasActiveFilters && (
								<button
									onClick={handleClearFilters}
									className='btn btn-sm btn-outline btn-primary'
								>
									Reset Filters
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Post Job Modal for Recruiters */}
			{isRecruiter && (
				<PostJobModal
					isOpen={isPostModalOpen}
					onClose={() => setIsPostModalOpen(false)}
				/>
			)}
		</div>
	);
};

export default JobsPage;
