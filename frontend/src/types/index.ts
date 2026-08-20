export interface PaginatedResult<T> {
	data: T[];
	nextCursor: string | null;
	hasMore: boolean;
}

export type UserRole = "jobseeker" | "recruiter" | "admin";

export interface IExperience {
	_id?: string;
	title?: string;
	company?: string;
	startDate?: string;
	endDate?: string | null;
	description?: string;
}

export interface IEducation {
	_id?: string;
	school?: string;
	fieldOfStudy?: string;
	startYear?: number | null;
	endYear?: number | null;
}

export interface IUser {
	_id: string;
	name: string;
	username: string;
	email?: string;
	role?: UserRole;
	profilePicture?: string;
	bannerImg?: string;
	headline?: string;
	location?: string;
	about?: string;
	skills?: string[];
	experience?: IExperience[];
	education?: IEducation[];
	connections?: string[] | IUser[];
	createdAt?: string;
	updatedAt?: string;
	isVerified?: boolean;
}

export interface IComment {
	_id: string;
	content: string;
	user: IUser;
	createdAt: string;
}

export interface ILike {
	_id: string;
	userId: string;
	postId: string;
	createdAt: string;
}

export interface IPost {
	_id: string;
	author: IUser;
	content?: string;
	image?: string;
	likes?: string[];
	likesCount?: number;
	isLiked?: boolean;
	comments?: IComment[];
	commentsCount?: number;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt?: string;
}

export interface INotification {
	_id: string;
	recipient: string | IUser;
	type:
		| "like"
		| "comment"
		| "connectionAccepted"
		| "jobApplication"
		| "applicationStatus"
		| "interviewScheduled"
		| "interviewStatusChanged"
		| "interviewFeedback";
	relatedInterview?: IInterviewSession | any;
	relatedUser?: IUser;
	relatedPost?: IPost | any;
	relatedJob?: IJob | any;
	read: boolean;
	createdAt: string;
	updatedAt?: string;
}

export interface IConnectionRequest {
	_id: string;
	sender: IUser;
	recipient: IUser;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
	updatedAt?: string;
}

export interface IConnectionStatus {
	status: "connected" | "pending" | "received" | "not_connected";
	requestId?: string;
}

// SaaS Job Platform Types
export type JobType = "full-time" | "part-time" | "contract" | "internship" | "remote";
export type JobStatus = "open" | "closed" | "paused";

export interface IJob {
	_id: string;
	title: string;
	company: string;
	location: string;
	type: JobType;
	salaryMin?: number;
	salaryMax?: number;
	description: string;
	requirements: string[];
	authorId: IUser | any;
	status: JobStatus;
	applicantsCount: number;
	viewsCount?: number;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt?: string;
}

export type ApplicationStatus = "applied" | "screening" | "interview" | "offered" | "rejected" | "withdrawn";

export interface IApplication {
	_id: string;
	jobId: IJob | string;
	applicantId: IUser | string;
	recruiterId: IUser | string;
	status: ApplicationStatus;
	coverLetter?: string;
	resumeUrl?: string;
	notes?: string;
	createdAt: string;
	updatedAt?: string;
}

export interface IConversation {
	_id: string;
	participants: IUser[];
	lastMessage?: string;
	lastMessageAt?: string;
	unreadCounts: { userId: string; count: number }[];
	myUnreadCount?: number;
	otherParticipant?: IUser;
	createdAt: string;
	updatedAt?: string;
}

export interface IMessage {
	_id: string;
	conversationId: string;
	senderId: IUser | string;
	text?: string;
	image?: string;
	readBy: string[];
	createdAt: string;
	updatedAt?: string;
}

export type InterviewStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export interface IInterviewSession {
	_id: string;
	jobId: IJob | string;
	candidateId: IUser | string;
	recruiterId: IUser | string;
	status: InterviewStatus;
	scheduledAt: string;
	duration: number;
	liveKitRoomName?: string;
	recordingUrl?: string;
	recruiterFeedback?: { rating?: number; notes?: string };
	note?: string;
	createdAt: string;
	updatedAt?: string;
}
