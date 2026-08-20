import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
	Briefcase,
	Plus,
	Users,
	Eye,
	Building2,
	MapPin,
	Calendar,
	Clock,
	PauseCircle,
	PlayCircle,
	Trash2,
	ChevronRight,
	Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthUser } from "../hooks/useAuth";
import { useJobs, useUpdateJobStatus, useDeleteJob } from "../hooks/useJobs";
import { useJobApplications } from "../hooks/useApplications";
import PostJobModal from "../components/jobs/PostJobModal";
import ApplicationPipeline from "../components/jobs/ApplicationPipeline";
import { IJob } from "../types";

const MyJobsPage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
	const [isPostModalOpen, setIsPostModalOpen] = useState(false);
	const [editingJob, setEditingJob] = useState<IJob | null>(null);

	// Protect route: recruiters / admin only
	if (authUser && authUser.role !== "recruiter" && authUser.role !== "admin") {
		return <Navigate to='/jobs' replace />;
	}

	const { data: jobsData, isLoading: isLoadingJobs } = useJobs({
		authorId: authUser?._id,
	});

	const { mutate: updateStatus } = useUpdateJobStatus();
	const { mutate: deleteJob } = useDeleteJob();

	const myJobs = jobsData?.pages.flatMap((page) => page.data) ?? [];

	// Automatically select the first job if none selected
	const activeJob = selectedJob || (myJobs.length > 0 ? myJobs[0] : null);

	const { data: applicationsData, isLoading: isLoadingApps } = useJobApplications(
		activeJob?._id
	);

	const applications = applicationsData?.pages.flatMap((page) => page.data) ?? [];

	const handleToggleStatus = (job: IJob, e: React.MouseEvent) => {
		e.stopPropagation();
		const nextStatus = job.status === "open" ? "paused" : "open";
		updateStatus({ id: job._id, status: nextStatus });
	};

	const handleDeleteJob = (jobId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (window.confirm("Are you sure you want to delete this job?")) {
			deleteJob(jobId, {
				onSuccess: () => {
					if (activeJob?._id === jobId) {
						setSelectedJob(null);
					}
				},
			});
		}
	};

	return (
		<div className='max-w-7xl mx-auto px-4 py-6 space-y-6'>
			{/* Dashboard Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm'>
				<div>
					<div className='flex items-center gap-2'>
						<span className='badge badge-primary badge-sm font-semibold'>Recruiter Hub</span>
						<Sparkles size={16} className='text-primary' />
					</div>
					<h1 className='text-2xl sm:text-3xl font-black text-base-content tracking-tight mt-1'>
						Applicant Tracking Dashboard
					</h1>
					<p className='text-xs text-base-content/60 mt-0.5'>
						Manage your posted jobs and review incoming candidate applications
					</p>
				</div>

				<button
					onClick={() => {
						setEditingJob(null);
						setIsPostModalOpen(true);
					}}
					className='btn btn-primary btn-sm gap-2 shadow-sm'
				>
					<Plus size={16} /> Post a New Job
				</button>
			</div>

			{isLoadingJobs ? (
				<div className='p-12 text-center'>
					<span className='loading loading-spinner loading-lg text-primary' />
					<p className='text-xs text-base-content/60 mt-2'>Loading your job listings...</p>
				</div>
			) : myJobs.length === 0 ? (
				<div className='bg-base-100 border border-base-300 rounded-2xl p-12 text-center max-w-md mx-auto'>
					<div className='w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4'>
						<Briefcase size={32} />
					</div>
					<h3 className='text-lg font-bold text-base-content'>You haven't posted any jobs yet</h3>
					<p className='text-xs text-base-content/60 mt-1 mb-5'>
						Create your first job listing to start receiving applications and tracking candidates.
					</p>
					<button
						onClick={() => setIsPostModalOpen(true)}
						className='btn btn-sm btn-primary'
					>
						<Plus size={15} /> Create First Job
					</button>
				</div>
			) : (
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
					{/* Left: Job Listings Selector (4 cols) */}
					<div className='lg:col-span-4 space-y-3'>
						<h2 className='text-xs font-black uppercase tracking-wider text-base-content/60 px-1'>
							Your Active Roles ({myJobs.length})
						</h2>

						<div className='space-y-2.5 max-h-[700px] overflow-y-auto pr-1'>
							{myJobs.map((job) => {
								const isSelected = activeJob?._id === job._id;
								const timeAgo = job.createdAt
									? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
									: "recently";

								return (
									<div
										key={job._id}
										onClick={() => setSelectedJob(job)}
										className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
											isSelected
												? "bg-primary/5 border-primary shadow-sm"
												: "bg-base-100 border-base-300 hover:border-primary/40 hover:bg-base-200/40"
										}`}
									>
										<div className='flex items-start justify-between gap-2'>
											<div className='min-w-0 flex-1'>
												<h3 className='font-bold text-sm text-base-content truncate'>
													{job.title}
												</h3>
												<p className='text-xs text-base-content/60 truncate'>
													{job.company} · {job.location}
												</p>
											</div>

											<span
												className={`badge badge-xs ${
													job.status === "open"
														? "badge-success"
														: job.status === "paused"
														? "badge-warning"
														: "badge-error"
												} capitalize`}
											>
												{job.status}
											</span>
										</div>

										<div className='flex items-center justify-between text-[11px] text-base-content/60 mt-3 pt-2.5 border-t border-base-200'>
											<div className='flex items-center gap-3'>
												<span className='flex items-center gap-1 font-semibold text-base-content/80'>
													<Users size={12} className='text-primary' />
													{job.applicantsCount || 0} applicants
												</span>
												<span className='flex items-center gap-1 text-base-content/40'>
													<Eye size={12} />
													{job.viewsCount || 0}
												</span>
											</div>

											<div className='flex items-center gap-1'>
												<button
													onClick={(e) => handleToggleStatus(job, e)}
													className='btn btn-ghost btn-xs btn-circle'
													title={job.status === "open" ? "Pause Job" : "Reopen Job"}
												>
													{job.status === "open" ? (
														<PauseCircle size={14} className='text-warning' />
													) : (
														<PlayCircle size={14} className='text-success' />
													)}
												</button>
												<button
													onClick={(e) => handleDeleteJob(job._id, e)}
													className='btn btn-ghost btn-xs btn-circle text-error'
													title='Delete Job'
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Right: Selected Job Details & Candidate Pipeline (8 cols) */}
					<div className='lg:col-span-8 space-y-4'>
						{activeJob && (
							<>
								{/* Active Job Summary Card */}
								<div className='bg-base-100 p-5 rounded-2xl border border-base-300 shadow-sm flex flex-wrap items-center justify-between gap-4'>
									<div>
										<div className='flex items-center gap-2'>
											<span className='badge badge-primary badge-sm capitalize'>
												{activeJob.type}
											</span>
											<span className='text-xs text-base-content/50'>
												Posted {formatDistanceToNow(new Date(activeJob.createdAt))} ago
											</span>
										</div>
										<h2 className='text-xl font-bold text-base-content mt-1'>
											{activeJob.title}
										</h2>
										<p className='text-xs text-base-content/60'>
											{activeJob.company} · {activeJob.location}
										</p>
									</div>

									<div className='flex items-center gap-2'>
										<Link
											to={`/jobs/${activeJob._id}`}
											className='btn btn-sm btn-outline text-xs gap-1'
										>
											Public View
										</Link>
										<button
											onClick={() => {
												setEditingJob(activeJob);
												setIsPostModalOpen(true);
											}}
											className='btn btn-sm btn-outline btn-primary text-xs'
										>
											Edit Details
										</button>
									</div>
								</div>

								{/* Application Pipeline Component */}
								<ApplicationPipeline
									applications={applications}
									isLoading={isLoadingApps}
								/>
							</>
						)}
					</div>
				</div>
			)}

			{/* Modal for Creating/Editing Jobs */}
			<PostJobModal
				isOpen={isPostModalOpen}
				onClose={() => {
					setIsPostModalOpen(false);
					setEditingJob(null);
				}}
				existingJob={editingJob}
			/>
		</div>
	);
};

export default MyJobsPage;
