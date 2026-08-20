import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
	Video,
	Calendar,
	Clock,
	Building2,
	Star,
	Loader2,
	Users,
} from "lucide-react";
import { useAuthUser } from "../hooks/useAuth";
import { useMyInterviews } from "../hooks/useInterviews";
import { IInterviewSession, InterviewStatus } from "../types";
import FeedbackModal from "../components/interviews/FeedbackModal";
import {
	canJoinInterview,
	getOtherParticipant,
	interviewStatusConfig,
} from "../utils/interviewUtils";

type TabFilter = Exclude<InterviewStatus, "scheduled"> | "upcoming";

const TAB_OPTIONS: { id: TabFilter; label: string }[] = [
	{ id: "upcoming", label: "Upcoming" },
	{ id: "in-progress", label: "In Progress" },
	{ id: "completed", label: "Completed" },
	{ id: "cancelled", label: "Cancelled" },
];

const matchesTab = (interview: IInterviewSession, tab: TabFilter): boolean => {
	if (tab === "upcoming") {
		return interview.status === "scheduled";
	}
	return interview.status === tab;
};

const InterviewsPage: React.FC = () => {
	const { data: authUser } = useAuthUser();
	const [searchParams, setSearchParams] = useSearchParams();
	const [activeTab, setActiveTab] = useState<TabFilter>("upcoming");
	const [feedbackInterview, setFeedbackInterview] = useState<IInterviewSession | null>(null);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyInterviews();
	const interviews = data?.pages.flatMap((page) => page.data) ?? [];

	const filteredInterviews = useMemo(
		() => interviews.filter((interview) => matchesTab(interview, activeTab)),
		[interviews, activeTab]
	);

	const isRecruiter = authUser?.role === "recruiter" || authUser?.role === "admin";

	// Open feedback modal when redirected from room page
	useEffect(() => {
		const feedbackId = searchParams.get("feedback");
		if (!feedbackId || interviews.length === 0) return;

		const interview = interviews.find((i) => i._id === feedbackId);
		if (interview && isRecruiter && !interview.recruiterFeedback) {
			setFeedbackInterview(interview);
			setSearchParams({}, { replace: true });
		}
	}, [searchParams, interviews, isRecruiter, setSearchParams]);

	const tabCounts = useMemo(() => {
		const counts: Record<TabFilter, number> = {
			upcoming: 0,
			"in-progress": 0,
			completed: 0,
			cancelled: 0,
		};
		interviews.forEach((interview) => {
			TAB_OPTIONS.forEach((tab) => {
				if (matchesTab(interview, tab.id)) {
					counts[tab.id] += 1;
				}
			});
		});
		return counts;
	}, [interviews]);

	return (
		<div className='max-w-5xl mx-auto px-4 py-6 space-y-6'>
			<div className='bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm'>
				<div className='flex items-center gap-3 mb-1'>
					<div className='w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
						<Video size={22} />
					</div>
					<div>
						<h1 className='text-2xl font-black text-base-content'>Video Interviews</h1>
						<p className='text-sm text-base-content/60'>
							Schedule, join, and review your interview sessions
						</p>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className='flex flex-wrap gap-2'>
				{TAB_OPTIONS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`btn btn-sm rounded-xl ${
							activeTab === tab.id ? "btn-primary" : "btn-ghost"
						}`}
					>
						{tab.label}
						<span className='badge badge-xs ml-1'>{tabCounts[tab.id]}</span>
					</button>
				))}
			</div>

			{/* List */}
			{isLoading ? (
				<div className='flex items-center justify-center py-16 text-base-content/50'>
					<Loader2 size={24} className='animate-spin mr-2' />
					Loading interviews...
				</div>
			) : filteredInterviews.length === 0 ? (
				<div className='bg-base-100 border border-base-300 rounded-2xl p-12 text-center'>
					<div className='w-16 h-16 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mx-auto mb-3'>
						<Users size={28} />
					</div>
					<h3 className='font-bold text-base-content'>No {activeTab === "upcoming" ? "upcoming" : activeTab} interviews</h3>
					<p className='text-sm text-base-content/60 mt-1 max-w-sm mx-auto'>
						{isRecruiter
							? "Schedule interviews from your job applicants dashboard."
							: "When a recruiter schedules an interview with you, it will appear here."}
					</p>
					{isRecruiter && (
						<Link to='/my-jobs' className='btn btn-primary btn-sm mt-4'>
							Go to My Jobs
						</Link>
					)}
				</div>
			) : (
				<div className='space-y-3'>
					{filteredInterviews.map((interview) => {
						const otherUser = getOtherParticipant(interview, authUser?._id);
						const job =
							typeof interview.jobId === "object" ? interview.jobId : null;
						const statusConfig = interviewStatusConfig[interview.status];
						const joinable = canJoinInterview(interview);
						const showFeedbackButton =
							isRecruiter &&
							interview.status === "completed" &&
							!interview.recruiterFeedback;

						return (
							<div
								key={interview._id}
								className='card bg-base-100 border border-base-300 shadow-sm rounded-xl'
							>
								<div className='card-body p-5'>
									<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
										<div className='flex items-start gap-3 min-w-0'>
											<img
												src={otherUser?.profilePicture || "/avatar.png"}
												alt={otherUser?.name || "Participant"}
												className='w-12 h-12 rounded-full object-cover border border-base-300 flex-shrink-0'
											/>
											<div className='min-w-0'>
												<div className='flex flex-wrap items-center gap-2'>
													<h3 className='font-bold text-base truncate'>
														{otherUser?.name || "Participant"}
													</h3>
													<span
														className={`badge badge-sm ${statusConfig.badgeClass} capitalize`}
													>
														{statusConfig.label}
													</span>
												</div>
												<p className='text-sm text-base-content/70 flex items-center gap-1 mt-0.5'>
													<Building2 size={14} />
													{job?.title || "Job Interview"}
													{job?.company && (
														<span className='text-base-content/50'>
															· {job.company}
														</span>
													)}
												</p>
												<div className='flex flex-wrap items-center gap-3 mt-2 text-xs text-base-content/60'>
													<span className='flex items-center gap-1'>
														<Calendar size={13} />
														{format(
															new Date(interview.scheduledAt),
															"MMM d, yyyy 'at' h:mm a"
														)}
													</span>
													<span className='flex items-center gap-1'>
														<Clock size={13} />
														{interview.duration} min
													</span>
												</div>
												{interview.note && (
													<p className='text-xs text-base-content/70 mt-2 p-2 bg-base-200/60 rounded-lg line-clamp-2'>
														{interview.note}
													</p>
												)}
											</div>
										</div>

										<div className='flex flex-wrap items-center gap-2 sm:flex-col sm:items-end'>
											{joinable && (
												<Link
													to={`/interviews/${interview._id}/room`}
													className='btn btn-sm btn-primary gap-1'
												>
													<Video size={15} />
													Join
												</Link>
											)}
											{interview.status === "scheduled" && !joinable && (
												<span className='text-[11px] text-base-content/50 text-right max-w-[160px]'>
													Join opens 5 minutes before start
												</span>
											)}
											{showFeedbackButton && (
												<button
													onClick={() => setFeedbackInterview(interview)}
													className='btn btn-sm btn-warning gap-1'
												>
													<Star size={15} />
													Provide Feedback
												</button>
											)}
											{interview.recruiterFeedback && (
												<span className='text-xs text-base-content/60 flex items-center gap-1'>
													<Star size={13} className='fill-warning text-warning' />
													Feedback submitted ({interview.recruiterFeedback.rating}/5)
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}

					{hasNextPage && (
						<div className='text-center pt-2'>
							<button
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								className='btn btn-sm btn-outline'
							>
								{isFetchingNextPage ? (
									<>
										<span className='loading loading-spinner loading-xs' /> Loading...
									</>
								) : (
									"Load more interviews"
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{feedbackInterview && (
				<FeedbackModal
					interviewId={feedbackInterview._id}
					candidateName={
						typeof feedbackInterview.candidateId === "object"
							? feedbackInterview.candidateId.name
							: "Candidate"
					}
					onClose={() => setFeedbackInterview(null)}
				/>
			)}
		</div>
	);
};

export default InterviewsPage;
