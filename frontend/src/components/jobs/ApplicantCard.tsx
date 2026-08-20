import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import {
	User,
	FileText,
	Download,
	ChevronDown,
	ChevronUp,
	Clock,
	MessageSquare,
	Calendar,
	Video,
} from "lucide-react";
import { ApplicationStatus, IApplication, IInterviewSession, IUser } from "../../types";
import { useUpdateApplicationStatus } from "../../hooks/useApplications";
import ScheduleInterviewModal from "../interviews/ScheduleInterviewModal";
import {
	canJoinInterview,
	getInterviewJobId,
	getInterviewParticipantId,
	interviewStatusConfig,
} from "../../utils/interviewUtils";

interface ApplicantCardProps {
	application: IApplication;
	interviews?: IInterviewSession[];
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

const ApplicantCard: React.FC<ApplicantCardProps> = ({ application, interviews = [] }) => {
	const [showFullCoverLetter, setShowFullCoverLetter] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);

	const applicant = typeof application.applicantId === "object" ? (application.applicantId as IUser) : null;
	const jobId = getInterviewJobId(application.jobId);
	const candidateId = applicant?._id || getInterviewParticipantId(application.applicantId);

	const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();

	const currentStatus = application.status || "applied";
	const config = statusBadgeConfig[currentStatus] || statusBadgeConfig.applied;
	const appliedDate = application.createdAt
		? formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })
		: "recently";

	const scheduledInterview = useMemo(() => {
		if (!candidateId) return undefined;
		return interviews.find((interview) => {
			const interviewJobId = getInterviewJobId(interview.jobId);
			const interviewCandidateId = getInterviewParticipantId(interview.candidateId);
			return (
				interviewJobId === jobId &&
				interviewCandidateId === candidateId &&
				interview.status !== "cancelled"
			);
		});
	}, [interviews, jobId, candidateId]);

	const canScheduleInterview =
		(currentStatus === "screening" || currentStatus === "interview") && applicant;

	const handleStatusChange = (newStatus: ApplicationStatus) => {
		if (newStatus === currentStatus) return;
		updateStatus({ id: application._id, status: newStatus });
	};

	const handleScheduleSuccess = () => {
		setShowScheduleModal(false);
		if (currentStatus !== "interview") {
			updateStatus({ id: application._id, status: "interview" });
		}
	};

	return (
		<>
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
									aria-disabled={isPending}
								>
									Status: {config.label}
									<ChevronDown size={12} />
								</div>
								<ul
									tabIndex={0}
									className='dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-44 border border-base-300 text-xs'
								>
									{(["applied", "screening", "interview", "offered", "rejected"] as ApplicationStatus[]).map(
										(status) => (
											<li key={status}>
												<button
													onClick={() => handleStatusChange(status)}
													className={currentStatus === status ? "active" : ""}
												>
													{statusBadgeConfig[status].label}
												</button>
											</li>
										)
									)}
								</ul>
							</div>
						</div>
					</div>

					{/* Scheduled Interview Snippet */}
					{scheduledInterview && (
						<div className='mt-3 p-3 bg-secondary/5 border border-secondary/20 rounded-xl'>
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<div className='text-xs space-y-1'>
									<p className='font-bold text-secondary flex items-center gap-1'>
										<Calendar size={13} /> Scheduled Interview
									</p>
									<p className='text-base-content/70'>
										{format(new Date(scheduledInterview.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
										{" · "}
										{scheduledInterview.duration} min
									</p>
									<span
										className={`badge badge-xs ${interviewStatusConfig[scheduledInterview.status].badgeClass}`}
									>
										{interviewStatusConfig[scheduledInterview.status].label}
									</span>
								</div>
								{canJoinInterview(scheduledInterview) && (
									<Link
										to={`/interviews/${scheduledInterview._id}/room`}
										className='btn btn-xs btn-secondary gap-1'
									>
										<Video size={13} /> Join
									</Link>
								)}
							</div>
						</div>
					)}

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

					{/* Footer: Resume Download & Actions */}
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
								<span className='text-[11px] text-base-content/40 italic'>No resume uploaded</span>
							)}
						</div>

						<div className='flex items-center gap-2'>
							{canScheduleInterview && (
								<button
									onClick={() => setShowScheduleModal(true)}
									disabled={isPending}
									className='btn btn-xs btn-secondary gap-1'
								>
									<Calendar size={13} />
									{scheduledInterview ? "Reschedule" : "Schedule Interview"}
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

			{showScheduleModal && applicant && (
				<ScheduleInterviewModal
					jobId={jobId}
					candidateId={candidateId}
					candidateName={applicant.name}
					onClose={() => setShowScheduleModal(false)}
					onSuccess={handleScheduleSuccess}
				/>
			)}
		</>
	);
};

export default ApplicantCard;
