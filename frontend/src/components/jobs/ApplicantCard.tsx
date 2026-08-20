import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
	User,
	FileText,
	Download,
	ChevronDown,
	ChevronUp,
	CheckCircle,
	XCircle,
	Clock,
	MessageSquare,
	Sparkles,
} from "lucide-react";
import { ApplicationStatus, IApplication, IUser } from "../../types";
import { useUpdateApplicationStatus } from "../../hooks/useApplications";

interface ApplicantCardProps {
	application: IApplication;
}

const statusBadgeConfig: Record<
	ApplicationStatus,
	{ label: string; badgeClass: string; desc: string }
> = {
	applied: { label: "Applied", badgeClass: "badge-info", desc: "New application" },
	screening: { label: "Screening", badgeClass: "badge-warning", desc: "Under review" },
	interview: { label: "Interview", badgeClass: "badge-secondary", desc: "Interview scheduled" },
	offered: { label: "Offered", badgeClass: "badge-success", desc: "Offer extended" },
	rejected: { label: "Rejected", badgeClass: "badge-error", desc: "Not moving forward" },
	withdrawn: { label: "Withdrawn", badgeClass: "badge-ghost", desc: "Candidate withdrew" },
};

const ApplicantCard: React.FC<ApplicantCardProps> = ({ application }) => {
	const [showFullCoverLetter, setShowFullCoverLetter] = useState(false);
	const applicant = typeof application.applicantId === "object" ? (application.applicantId as IUser) : null;

	const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();

	const currentStatus = application.status || "applied";
	const config = statusBadgeConfig[currentStatus] || statusBadgeConfig.applied;
	const appliedDate = application.createdAt
		? formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })
		: "recently";

	const handleStatusChange = (newStatus: ApplicationStatus) => {
		if (newStatus === currentStatus) return;
		updateStatus({ id: application._id, status: newStatus });
	};

	return (
		<div className='card bg-base-100 border border-base-300 shadow-sm hover:shadow transition-all rounded-xl overflow-hidden'>
			<div className='card-body p-4 sm:p-5'>
				{/* Header: Candidate Info & Status Dropdown */}
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
					<div className='flex items-center gap-3'>
						<Link to={`/profile/${applicant?.username || ""}`}>
							<img
								src={applicant?.profilePicture || "/avatar.png"}
								alt={applicant?.name || "Candidate"}
								className='w-12 h-12 rounded-full object-cover border-2 border-base-300'
							/>
						</Link>

						<div>
							<div className='flex items-center gap-2'>
								<Link
									to={`/profile/${applicant?.username || ""}`}
									className='font-bold text-base text-base-content hover:text-primary transition-colors'
								>
									{applicant?.name || "Candidate"}
								</Link>
								<span className={`badge ${config.badgeClass} badge-sm font-semibold capitalize`}>
									{config.label}
								</span>
							</div>

							<p className='text-xs text-base-content/60 line-clamp-1'>
								{applicant?.headline || applicant?.location || "LinkedIn Member"}
							</p>
							<p className='text-[11px] text-base-content/40 flex items-center gap-1 mt-0.5'>
								<Clock size={11} /> Applied {appliedDate}
							</p>
						</div>
					</div>

					{/* Status Switcher */}
					<div className='flex items-center gap-2 self-end sm:self-center'>
						<div className='dropdown dropdown-end'>
							<div
								tabIndex={0}
								role='button'
								className='btn btn-xs btn-outline gap-1 font-medium capitalize'
								disabled={isPending}
							>
								Status: {config.label}
								<ChevronDown size={12} />
							</div>
							<ul
								tabIndex={0}
								className='dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-44 border border-base-300 text-xs'
							>
								<li>
									<button
										onClick={() => handleStatusChange("applied")}
										className={currentStatus === "applied" ? "active" : ""}
									>
										Applied
									</button>
								</li>
								<li>
									<button
										onClick={() => handleStatusChange("screening")}
										className={currentStatus === "screening" ? "active" : ""}
									>
										Screening
									</button>
								</li>
								<li>
									<button
										onClick={() => handleStatusChange("interview")}
										className={currentStatus === "interview" ? "active" : ""}
									>
										Interview
									</button>
								</li>
								<li>
									<button
										onClick={() => handleStatusChange("offered")}
										className={currentStatus === "offered" ? "active text-success" : ""}
									>
										Offered
									</button>
								</li>
								<li>
									<button
										onClick={() => handleStatusChange("rejected")}
										className={currentStatus === "rejected" ? "active text-error" : ""}
									>
										Rejected
									</button>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Candidate Skills preview */}
				{applicant?.skills && applicant.skills.length > 0 && (
					<div className='flex flex-wrap gap-1 mt-2'>
						{applicant.skills.slice(0, 5).map((skill, i) => (
							<span key={i} className='badge badge-ghost badge-xs text-[11px]'>
								{skill}
							</span>
						))}
						{applicant.skills.length > 5 && (
							<span className='badge badge-ghost badge-xs text-[10px] text-base-content/50'>
								+{applicant.skills.length - 5}
							</span>
						)}
					</div>
				)}

				{/* Cover Letter Section */}
				{application.coverLetter && (
					<div className='mt-3 p-3 bg-base-200/50 rounded-lg border border-base-300/60 text-xs'>
						<div className='flex items-center justify-between text-base-content/70 font-semibold mb-1'>
							<span className='flex items-center gap-1'>
								<MessageSquare size={13} /> Cover Letter Note
							</span>
							{application.coverLetter.length > 180 && (
								<button
									onClick={() => setShowFullCoverLetter(!showFullCoverLetter)}
									className='text-[11px] text-primary hover:underline flex items-center gap-0.5'
								>
									{showFullCoverLetter ? (
										<>
											Show less <ChevronUp size={11} />
										</>
									) : (
										<>
											Read all <ChevronDown size={11} />
										</>
									)}
								</button>
							)}
						</div>
						<p
							className={`text-base-content/80 whitespace-pre-line leading-relaxed ${
								!showFullCoverLetter ? "line-clamp-2" : ""
							}`}
						>
							{application.coverLetter}
						</p>
					</div>
				)}

				{/* Footer: Resume Download & Direct Links */}
				<div className='flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-base-200'>
					<div>
						{application.resumeUrl ? (
							<a
								href={application.resumeUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='btn btn-xs btn-outline btn-primary gap-1 text-xs'
							>
								<FileText size={13} />
								<Download size={11} />
								View Resume
							</a>
						) : (
							<span className='text-[11px] text-base-content/40 italic'>
								No resume uploaded
							</span>
						)}
					</div>

					<div className='flex items-center gap-2'>
						{currentStatus !== "interview" && (
							<button
								onClick={() => handleStatusChange("interview")}
								disabled={isPending}
								className='btn btn-xs btn-ghost text-secondary hover:bg-secondary/10'
							>
								Invite to Interview
							</button>
						)}
						{currentStatus !== "offered" && (
							<button
								onClick={() => handleStatusChange("offered")}
								disabled={isPending}
								className='btn btn-xs btn-ghost text-success hover:bg-success/10'
							>
								Extend Offer
							</button>
						)}
						{currentStatus !== "rejected" && (
							<button
								onClick={() => handleStatusChange("rejected")}
								disabled={isPending}
								className='btn btn-xs btn-ghost text-error hover:bg-error/10'
							>
								Reject
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ApplicantCard;
