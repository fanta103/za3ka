import { IInterviewSession, InterviewStatus, IUser } from "../types";

export const interviewStatusConfig: Record<
	InterviewStatus,
	{ label: string; badgeClass: string }
> = {
	scheduled: { label: "Scheduled", badgeClass: "badge-info" },
	"in-progress": { label: "In Progress", badgeClass: "badge-warning" },
	completed: { label: "Completed", badgeClass: "badge-success" },
	cancelled: { label: "Cancelled", badgeClass: "badge-error" },
};

export const getInterviewParticipantId = (participant: IUser | string): string =>
	typeof participant === "object" ? participant._id : participant;

export const getInterviewJobId = (job: { _id: string } | string): string =>
	typeof job === "object" ? job._id : job;

export const canJoinInterview = (interview: IInterviewSession): boolean => {
	if (interview.status === "cancelled" || interview.status === "completed") {
		return false;
	}
	if (interview.status === "in-progress") {
		return true;
	}

	const scheduled = new Date(interview.scheduledAt);
	const now = new Date();
	const joinWindowStart = new Date(scheduled.getTime() - 5 * 60 * 1000);
	const joinWindowEnd = new Date(scheduled.getTime() + interview.duration * 60 * 1000);

	return now >= joinWindowStart && now <= joinWindowEnd;
};

export const getOtherParticipant = (
	interview: IInterviewSession,
	myId?: string
): IUser | null => {
	if (!myId) return null;

	const candidateId = getInterviewParticipantId(interview.candidateId);
	const recruiterId = getInterviewParticipantId(interview.recruiterId);

	if (candidateId === myId) {
		return typeof interview.recruiterId === "object" ? interview.recruiterId : null;
	}
	if (recruiterId === myId) {
		return typeof interview.candidateId === "object" ? interview.candidateId : null;
	}
	return null;
};
