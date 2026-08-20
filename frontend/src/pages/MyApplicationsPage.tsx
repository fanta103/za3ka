import React from "react";
import { Link } from "react-router-dom";
import {
	Briefcase,
	Building2,
	MapPin,
	Calendar,
	Clock,
	FileText,
	ExternalLink,
	Download,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Sidebar from "../components/Sidebar";
import { useAuthUser } from "../hooks/useAuth";
import { useMyApplications } from "../hooks/useApplications";
import { ApplicationStatus, IJob, IUser } from "../types";

const statusConfig: Record<
	ApplicationStatus,
	{ label: string; badgeClass: string; desc: string }
> = {
	applied: {
		label: "Applied",
		badgeClass: "badge-info",
		desc: "Your application is submitted and awaiting review.",
	},
	screening: {
		label: "Under Review",
		badgeClass: "badge-warning",
		desc: "The recruiter is currently reviewing your profile and resume.",
	},
	interview: {
		label: "Interview Scheduled",
		badgeClass: "badge-secondary",
		desc: "Congratulations! You have been selected for an interview.",
	},
	offered: {
		label: "Offer Extended",
		badgeClass: "badge-success",
		desc: "An offer has been made. Check your messages or email.",
	},
	rejected: {
		label: "Not Selected",
		badgeClass: "badge-error",
		desc: "The company has moved forward with other applicants.",
	},
	withdrawn: {
		label: "Withdrawn",
		badgeClass: "badge-ghost",
		desc: "You withdrew this application.",
	},
};

const MyApplicationsPage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const {
		data: applicationsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useMyApplications();

	const applications = applicationsData?.pages.flatMap((page) => page.data) ?? [];

	return (
		<div className='max-w-7xl mx-auto px-4 py-6'>
			<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
				{/* Left Sidebar */}
				<div className='hidden lg:block lg:col-span-1'>
					<Sidebar user={authUser || null} />
				</div>

				{/* Main Content Area (3 cols) */}
				<div className='col-span-1 lg:col-span-3 space-y-6'>
					{/* Header */}
					<div className='bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
						<div>
							<div className='flex items-center gap-2'>
								<span className='badge badge-primary badge-sm font-semibold'>Career Hub</span>
								<Sparkles size={16} className='text-primary' />
							</div>
							<h1 className='text-2xl sm:text-3xl font-black text-base-content tracking-tight mt-1'>
								My Applications
							</h1>
							<p className='text-xs text-base-content/60 mt-0.5'>
								Track all your active job applications and hiring status updates in one place
							</p>
						</div>

						<Link to='/jobs' className='btn btn-sm btn-primary gap-1.5 shadow-sm self-start sm:self-auto'>
							<Briefcase size={15} /> Find More Jobs
						</Link>
					</div>

					{/* Application List */}
					{isLoading ? (
						<div className='p-12 text-center'>
							<span className='loading loading-spinner loading-lg text-primary' />
							<p className='text-xs text-base-content/60 mt-2'>Loading your applications...</p>
						</div>
					) : applications.length === 0 ? (
						<div className='bg-base-100 border border-base-300 rounded-2xl p-12 text-center max-w-md mx-auto'>
							<div className='w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4'>
								<Briefcase size={32} />
							</div>
							<h3 className='text-lg font-bold text-base-content'>No job applications yet</h3>
							<p className='text-xs text-base-content/60 mt-1 mb-5'>
								Browse open positions, submit your resume, and track your progress here.
							</p>
							<Link to='/jobs' className='btn btn-sm btn-primary'>
								Browse Jobs
							</Link>
						</div>
					) : (
						<div className='space-y-4'>
							{applications.map((application) => {
								const job = typeof application.jobId === "object" ? (application.jobId as IJob) : null;
								const recruiter =
									typeof application.recruiterId === "object"
										? (application.recruiterId as IUser)
										: null;

								const currentStatus = application.status || "applied";
								const config = statusConfig[currentStatus] || statusConfig.applied;
								const timeAgo = application.createdAt
									? formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })
									: "recently";

								return (
									<div
										key={application._id}
										className='bg-base-100 border border-base-300 rounded-2xl p-5 shadow-sm hover:shadow transition-all'
									>
										<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
											<div className='space-y-1 flex-1'>
												<div className='flex items-center gap-2'>
													<span className={`badge ${config.badgeClass} badge-sm font-bold capitalize`}>
														{config.label}
													</span>
													{job?.type && (
														<span className='badge badge-ghost badge-xs capitalize'>
															{job.type}
														</span>
													)}
												</div>

												<h3 className='text-lg font-bold text-base-content mt-1'>
													{job?.title || "Job Listing"}
												</h3>

												<div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60'>
													{job?.company && (
														<span className='flex items-center gap-1 font-semibold text-base-content/80'>
															<Building2 size={13} /> {job.company}
														</span>
													)}
													{job?.location && (
														<span className='flex items-center gap-1'>
															<MapPin size={13} /> {job.location}
														</span>
													)}
													<span className='flex items-center gap-1 text-base-content/40'>
														<Clock size={13} /> Applied {timeAgo}
													</span>
												</div>
											</div>

											{/* Action link */}
											<div className='flex items-center gap-2 self-end sm:self-center'>
												{job?._id && (
													<Link
														to={`/jobs/${job._id}`}
														className='btn btn-xs btn-outline btn-primary gap-1 text-xs'
													>
														View Job <ExternalLink size={12} />
													</Link>
												)}
											</div>
										</div>

										{/* Status explanation alert */}
										<div className='mt-3.5 pt-3 border-t border-base-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs'>
											<p className='text-base-content/70 flex items-center gap-1.5'>
												<CheckCircle2 size={14} className='text-primary flex-shrink-0' />
												<span>{config.desc}</span>
											</p>

											{application.resumeUrl && (
												<a
													href={application.resumeUrl}
													target='_blank'
													rel='noopener noreferrer'
													className='text-primary hover:underline flex items-center gap-1 text-xs self-start sm:self-auto'
												>
													<FileText size={12} /> Attached Resume
												</a>
											)}
										</div>
									</div>
								);
							})}

							{/* Load more button */}
							{hasNextPage && (
								<div className='text-center pt-2'>
									<button
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										className='btn btn-outline btn-sm min-w-36'
									>
										{isFetchingNextPage ? "Loading more..." : "Load Older Applications"}
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MyApplicationsPage;
