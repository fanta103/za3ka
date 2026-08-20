import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	LiveKitRoom,
	GridLayout,
	ParticipantTile,
	RoomAudioRenderer,
	ControlBar,
	useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Loader2, PhoneOff, AlertCircle } from "lucide-react";
import { useAuthUser } from "../hooks/useAuth";
import {
	useGenerateInterviewToken,
	useInterviewById,
	useUpdateInterviewStatus,
} from "../hooks/useInterviews";
import { getInterviewParticipantId } from "../utils/interviewUtils";

const VideoConference: React.FC = () => {
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false }
	);

	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 min-h-0 bg-neutral-900'>
				<GridLayout tracks={tracks} className='h-full'>
					<ParticipantTile />
				</GridLayout>
			</div>
			<RoomAudioRenderer />
			<div className='bg-neutral-950 border-t border-neutral-800 p-3'>
				<ControlBar
					controls={{
						camera: true,
						microphone: true,
						screenShare: true,
						leave: false,
					}}
				/>
			</div>
		</div>
	);
};

const InterviewRoomPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: authUser } = useAuthUser();
	const { data: interview, isLoading: isLoadingInterview } = useInterviewById(id);

	const { mutateAsync: generateToken } = useGenerateInterviewToken();
	const { mutateAsync: updateStatus } = useUpdateInterviewStatus();

	const [token, setToken] = useState<string | null>(null);
	const [serverUrl, setServerUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isConnecting, setIsConnecting] = useState(true);
	const hasMarkedInProgressRef = useRef(false);

	const isRecruiter =
		authUser?.role === "recruiter" ||
		authUser?.role === "admin" ||
		(interview &&
			getInterviewParticipantId(interview.recruiterId) === authUser?._id);

	const handleEndCall = useCallback(async () => {
		if (!id) return;
		try {
			await updateStatus({ id, status: "completed" });
		} catch {
			// Still redirect even if status update fails
		}

		if (isRecruiter) {
			navigate(`/interviews?feedback=${id}`);
		} else {
			navigate("/interviews");
		}
	}, [id, updateStatus, isRecruiter, navigate]);

	useEffect(() => {
		if (!id || !authUser) return;

		let cancelled = false;

		const connect = async () => {
			setIsConnecting(true);
			setError(null);
			try {
				const { token: roomToken, url } = await generateToken(id);
				if (cancelled) return;
				setToken(roomToken);
				setServerUrl(url);

				if (!hasMarkedInProgressRef.current) {
					await updateStatus({ id, status: "in-progress" });
					hasMarkedInProgressRef.current = true;
				}
			} catch (err: any) {
				if (!cancelled) {
					setError(
						err.response?.data?.message ||
							err.message ||
							"Failed to connect to the interview room"
					);
				}
			} finally {
				if (!cancelled) setIsConnecting(false);
			}
		};

		connect();

		return () => {
			cancelled = true;
		};
	}, [id, authUser, generateToken, updateStatus]);

	if (isLoadingInterview || isConnecting) {
		return (
			<div className='fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center text-white'>
				<Loader2 size={40} className='animate-spin text-primary mb-4' />
				<p className='text-sm text-neutral-300'>Connecting to interview room...</p>
			</div>
		);
	}

	if (error || !token || !serverUrl) {
		return (
			<div className='fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center text-white p-6'>
				<AlertCircle size={48} className='text-error mb-4' />
				<h2 className='text-xl font-bold mb-2'>Unable to Join</h2>
				<p className='text-sm text-neutral-400 text-center max-w-md mb-6'>
					{error || "Could not obtain a room token. Check that LiveKit credentials are configured."}
				</p>
				<button onClick={() => navigate("/interviews")} className='btn btn-primary btn-sm'>
					Back to Interviews
				</button>
			</div>
		);
	}

	const jobTitle =
		interview && typeof interview.jobId === "object" ? interview.jobId.title : "Interview";

	return (
		<div className='fixed inset-0 z-50 bg-neutral-950 flex flex-col'>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800'>
				<div>
					<h1 className='text-sm font-bold text-white'>{jobTitle}</h1>
					<p className='text-xs text-neutral-400'>Live video interview</p>
				</div>
				<button
					onClick={handleEndCall}
					className='btn btn-sm btn-error gap-2'
				>
					<PhoneOff size={16} />
					End Call
				</button>
			</div>

			{/* LiveKit Room */}
			<div className='flex-1 min-h-0'>
				<LiveKitRoom
					video
					audio
					token={token}
					serverUrl={serverUrl}
					connect
					onDisconnected={handleEndCall}
					className='h-full'
					data-lk-theme='default'
				>
					<VideoConference />
				</LiveKitRoom>
			</div>
		</div>
	);
};

export default InterviewRoomPage;
