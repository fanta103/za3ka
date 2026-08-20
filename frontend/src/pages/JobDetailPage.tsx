import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
	Building2,
	MapPin,
	DollarSign,
	Users,
	Clock,
	Eye,
	CheckCircle2,
	ArrowLeft,
	Edit3,
	PauseCircle,
	PlayCircle,
	Trash2,
	Briefcase,
	ExternalLink,
	UserCheck,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useAuthUser } from "../hooks/useAuth";
import { useJobById, useUpdateJobStatus, useDeleteJob } from "../hooks/useJobs";
import { useMyApplications } from "../hooks/useApplications";
import ApplyModal from "../components/jobs/ApplyModal";
import PostJobModal from "../components/jobs/PostJobModal";
import Sidebar from "../components/Sidebar";

const JobDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: authUser } = useAuthUser();
	const { data: job, isLoading, isError } = useJobById(id);
	const { data: myAppsData } = useMyApplications();

	const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateJobStatus();
	const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();

	const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// Check if current user already applied to this job
	const myApplications = myAppsData?.pages.flatMap((page) => page.data) ?? [];
	const hasAlreadyApplied = myApplications.some((app) => {
		const appJobId = typeof app.jobId === "object" ? app.jobId._id : app.jobId;
		return appJobId === id;
	});

	if (isLoading) {
		return (
			<div className='max-w-4xl mx-auto px-4 py-12 text-center'>
				<span className='loading loading-spinner loading-lg text-primary' />
				<p className='text-xs text-base-content/60 mt-3'>Loading job details...</p>
			</div>
		);
	}

	if (isError || !job) {
		return (
			<div className='max-w-4xl mx-auto px-4 py-12 text-center space-y-4'>
				<div className='w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto'>
					<Briefcase size={28} />
				</div>
				<h2 className='text-xl font-bold text-base-content'>Job Listing Not Found</h2>
				<p className='text-xs text-base-content/60'>
					This job posting may have been removed or is no longer available.
				</p>
				<Link to='/jobs' className='btn btn-sm btn-primary'>
					Back to Jobs Feed
				</Link>
			</div>
		);
	}

	const author = typeof job.authorId === "object" ? job.authorId : null;
	const isAuthor =
		authUser?._id &&
		author?._id &&
		(authUser._id === author._id || authUser.role === "admin");

	const timeAgo = job.createdAt
		? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
		: "recently";

	const postedDate = job.createdAt
		? format(new Date(job.createdAt), "MMMM d, yyyy")
		: "";

	const formatSalary = (min?: number, max?: number) => {
		if (!min && !max) return null;
		const fmt = (n: number) => `$${n.toLocaleString()}`;
		if (min && max) return `${fmt(min)} - ${fmt(max)} / year`;
		if (min) return `From ${fmt(min)} / year`;
		return `Up to ${fmt(max!)} / year`;
	};

	const salaryText = formatSalary(job.salaryMin, job.salaryMax);

	const handleToggleJobStatus = () => {
		const nextStatus = job.status === "open" ? "paused" : "open";
		updateStatus({ id: job._id, status: nextStatus });
	};

	const handleDelete = () => {
		if (window.confirm("Are you sure you want to delete this job listing?")) {
			deleteJob(job._id, {
				onSuccess: () => {
					navigate("/jobs");
				},
			});
		}
	};

	return (
		<div className='max-w-6xl mx-auto px-4 py-6'>
			{/* Back Button */}
			<div className='mb-4'>
				<Link
					to='/jobs'
					className='inline-flex items-center gap-1.5 text-xs text-base-content/70 hover:text-primary transition-colors font-medium'
				>
					<ArrowLeft size={14} /> Back to all jobs
				</Link>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main Job Details (2 cols) */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Header Card */}
					<div className='bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm'>
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<div>
								<span className='badge badge-primary badge-sm font-semibold capitalize mb-2'>
									{job.type}
								</span>
								<h1 className='text-2xl sm:text-3xl font-black text-base-content tracking-tight'>
									{job.title}
								</h1>
								<div className='flex items-center gap-2 text-base-content/70 mt-1.5'>
									<Building2 size={18} className='text-base-content/50' />
									<span className='font-bold text-base text-base-content/90'>
										{job.company}
									</span>
								</div>
							</div>

							<div className='flex flex-col items-end gap-1'>
								<span
									className={`badge ${
										job.status === "open"
											? "badge-success"
											: job.status === "paused"
											? "badge-warning"
											: "badge-error"
									} font-bold capitalize`}
								>
									{job.status}
								</span>
							</div>
						</div>

						{/* Metadata Grid */}
						<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-base-200'>
							<div className='p-3 bg-base-200/50 rounded-xl'>
								<div className='flex items-center gap-1 text-xs text-base-content/50 mb-1'>
									<MapPin size={13} /> Location
								</div>
								<p className='text-xs font-bold text-base-content'>{job.location}</p>
							</div>

							<div className='p-3 bg-base-200/50 rounded-xl'>
								<div className='flex items-center gap-1 text-xs text-base-content/50 mb-1'>
									<DollarSign size={13} /> Compensation
								</div>
								<p className='text-xs font-bold text-success'>
									{salaryText || "Negotiable"}
								</p>
							</div>

							<div className='p-3 bg-base-200/50 rounded-xl'>
								<div className='flex items-center gap-1 text-xs text-base-content/50 mb-1'>
									<Users size={13} /> Applicants
								</div>
								<p className='text-xs font-bold text-base-content'>
									{job.applicantsCount || 0} applied
								</p>
							</div>

							<div className='p-3 bg-base-200/50 rounded-xl'>
								<div className='flex items-center gap-1 text-xs text-base-content/50 mb-1'>
									<Clock size={13} /> Posted
								</div>
								<p className='text-xs font-bold text-base-content' title={postedDate}>
									{timeAgo}
								</p>
							</div>
						</div>

						{/* Action Buttons Section */}
						<div className='mt-6 pt-4 border-t border-base-200 flex flex-wrap items-center justify-between gap-3'>
							{isAuthor ? (
								/* Author Actions */
								<div className='flex flex-wrap items-center gap-2 w-full justify-between'>
									<div className='flex items-center gap-2'>
										<button
											onClick={() => setIsEditModalOpen(true)}
											className='btn btn-sm btn-outline gap-1.5'
										>
											<Edit3 size={15} /> Edit Job
										</button>

										<button
											onClick={handleToggleJobStatus}
											disabled={isUpdatingStatus}
											className='btn btn-sm btn-outline gap-1.5'
										>
											{job.status === "open" ? (
												<>
													<PauseCircle size={15} className='text-warning' /> Pause Job
												</>
											) : (
												<>
													<PlayCircle size={15} className='text-success' /> Reopen Job
												</>
											)}
										</button>

										<button
											onClick={handleDelete}
											disabled={isDeleting}
											className='btn btn-sm btn-ghost text-error hover:bg-error/10 gap-1.5'
										>
											<Trash2 size={15} /> Delete
										</button>
									</div>

									<Link
										to='/my-jobs'
										className='btn btn-sm btn-primary gap-1.5'
									>
										<Users size={15} /> View All Applicants ({job.applicantsCount || 0})
									</Link>
								</div>
							) : (
								/* Candidate Apply Actions */
								<div className='flex items-center justify-between w-full'>
									<div className='text-xs text-base-content/60 flex items-center gap-2'>
										<Eye size={14} /> {job.viewsCount || 0} views
									</div>

									{hasAlreadyApplied ? (
										<div className='flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-xl font-bold text-sm border border-success/30'>
											<CheckCircle2 size={18} />
											<span>Application Submitted</span>
										</div>
									) : job.status !== "open" ? (
										<button disabled className='btn btn-sm btn-disabled'>
											Job Closed
										</button>
									) : (
										<button
											onClick={() => setIsApplyModalOpen(true)}
											className='btn btn-primary px-8 font-bold shadow-md'
										>
											Apply Now
										</button>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Job Description Card */}
					<div className='bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4'>
						<h3 className='text-lg font-bold text-base-content'>About the Role</h3>
						<div className='text-sm text-base-content/80 leading-relaxed space-y-3 whitespace-pre-line'>
							{job.description}
						</div>
					</div>

					{/* Requirements Card */}
					{job.requirements && job.requirements.length > 0 && (
						<div className='bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4'>
							<h3 className='text-lg font-bold text-base-content'>
								Requirements & Qualifications
							</h3>
							<ul className='space-y-2.5'>
								{job.requirements.map((req, idx) => (
									<li key={idx} className='flex items-start gap-2.5 text-sm text-base-content/80'>
										<CheckCircle2 size={16} className='text-primary mt-0.5 flex-shrink-0' />
										<span>{req}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* Right Sidebar: Recruiter Info */}
				<div className='space-y-6'>
					{author && (
						<div className='bg-base-100 border border-base-300 rounded-2xl p-5 shadow-sm space-y-4'>
							<h3 className='text-xs font-black uppercase tracking-wider text-base-content/50'>
								Posted by Recruiter
							</h3>

							<div className='flex items-center gap-3'>
								<Link to={`/profile/${author.username}`}>
									<img
										src={author.profilePicture || "/avatar.png"}
										alt={author.name}
										className='w-14 h-14 rounded-full object-cover border-2 border-primary/20 hover:border-primary transition-colors'
									/>
								</Link>
								<div className='min-w-0'>
									<Link
										to={`/profile/${author.username}`}
										className='font-bold text-base text-base-content hover:text-primary transition-colors line-clamp-1'
									>
										{author.name}
									</Link>
									<p className='text-xs text-base-content/60 line-clamp-2'>
										{author.headline || "Recruiter"}
									</p>
									{author.location && (
										<p className='text-[11px] text-base-content/40 flex items-center gap-1 mt-0.5'>
											<MapPin size={10} /> {author.location}
										</p>
									)}
								</div>
							</div>

							{author.about && (
								<p className='text-xs text-base-content/70 line-clamp-3 leading-relaxed border-t border-base-200 pt-3'>
									{author.about}
								</p>
							)}

							<div className='pt-2'>
								<Link
									to={`/profile/${author.username}`}
									className='btn btn-sm btn-outline w-full gap-1 text-xs'
								>
									View Full Profile <ExternalLink size={13} />
								</Link>
							</div>
						</div>
					)}

					{/* Job Summary Quick Card */}
					<div className='bg-base-100 border border-base-300 rounded-2xl p-5 shadow-sm space-y-3 text-xs'>
						<h4 className='font-bold text-sm text-base-content'>Job Overview</h4>
						<div className='space-y-2 text-base-content/70'>
							<div className='flex justify-between py-1 border-b border-base-200'>
								<span>Employment Type</span>
								<span className='font-semibold text-base-content capitalize'>{job.type}</span>
							</div>
							<div className='flex justify-between py-1 border-b border-base-200'>
								<span>Job Status</span>
								<span className='font-semibold text-base-content capitalize'>{job.status}</span>
							</div>
							<div className='flex justify-between py-1 border-b border-base-200'>
								<span>Total Views</span>
								<span className='font-semibold text-base-content'>{job.viewsCount || 0}</span>
							</div>
							<div className='flex justify-between py-1'>
								<span>Applicants</span>
								<span className='font-semibold text-base-content'>{job.applicantsCount || 0}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Apply Modal */}
			<ApplyModal
				job={job}
				isOpen={isApplyModalOpen}
				onClose={() => setIsApplyModalOpen(false)}
			/>

			{/* Edit Modal (Author only) */}
			{isAuthor && (
				<PostJobModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					existingJob={job}
				/>
			)}
		</div>
	);
};

export default JobDetailPage;
