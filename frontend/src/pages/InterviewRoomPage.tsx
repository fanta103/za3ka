import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useConnectionState,
  useParticipants,
  ParticipantTile,
  ControlBar,
} from "@livekit/components-react";
import {
  AudioPresets,
  ConnectionState,
  Track,
  VideoPresets,
  type MediaDeviceFailure,
} from "livekit-client";
import { PhoneOff, Signal, UserCircle, VideoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthUser } from "../hooks/useAuth";
import {
  useGenerateInterviewToken,
  useInterviewById,
  useUpdateInterviewStatus,
} from "../hooks/useInterviews";

// An interview has only two participants. Publishing a single 360p layer is
// substantially cheaper than the SDK's default 720p simulcast (up to 3 encodes)
// and keeps latency low on ordinary laptops and mobile connections.
const interviewRoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    simulcast: false,
    videoEncoding: VideoPresets.h360.encoding,
    audioPreset: AudioPresets.speech,
  },
};

const interviewVideoOptions = {
  resolution: VideoPresets.h360.resolution,
  frameRate: 20,
};

function useTimer(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  return seconds;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  const hr = Math.floor(s / 3600);
  return hr > 0 ? `${hr}:${m}:${sec}` : `${m}:${sec}`;
}

function ConnectionDot() {
  const state = useConnectionState();
  const color =
    state === ConnectionState.Connected
      ? "bg-emerald-400 shadow-emerald-400/50"
      : state === ConnectionState.Connecting
        ? "bg-amber-400 shadow-amber-400/50"
        : "bg-red-400 shadow-red-400/50";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${color}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function VideoConference({ interviewTitle }: { interviewTitle?: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const isLive = connectionState === ConnectionState.Connected;
  const elapsed = useTimer(isLive);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-950">
      <div className="relative z-20 flex items-center justify-between border-b border-white/5 bg-black/30 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <VideoIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">{interviewTitle || "Video Interview"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <ConnectionDot />
              <span className="text-[11px] text-white/50">
                {connectionState === ConnectionState.Connected ? "Connected" : connectionState === ConnectionState.Connecting ? "Connecting..." : "Disconnected"}
              </span>
              <span className="text-[11px] text-white/30">·</span>
              <span className="flex items-center gap-1 text-[11px] text-white/50">
                <UserCircle className="h-3 w-3" />
                {participants.length} participant{participants.length !== 1 && "s"}
              </span>
            </div>
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5">
            <div className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs font-medium text-white/80 tabular-nums">{formatTime(elapsed)}</span>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5">
          <Signal className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] text-white/50">HD</span>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {tracks.length > 0 ? (
          <div className={`mx-auto grid gap-3 h-full ${tracks.length === 1 ? "max-w-4xl grid-cols-1" : tracks.length === 2 ? "max-w-5xl grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
            {tracks.map((trackRef) => (
              <div key={trackRef.participant.identity} className="relative overflow-hidden rounded-2xl bg-neutral-800/80 ring-1 ring-white/10">
                <ParticipantTile trackRef={trackRef} className="h-full w-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 py-3 pt-8 pointer-events-none">
                  <p className="text-sm font-medium text-white/90 truncate">{trackRef.participant.name || "Participant"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-white/40">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-indigo-500/10 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 ring-1 ring-white/10">
                <VideoIcon className="h-8 w-8 text-neutral-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/60">Waiting for participants...</p>
              <p className="mt-1 text-xs text-white/30">Video will appear here once the other participant joins</p>
            </div>
          </div>
        )}
      </div>
      <div className="pb-4">
        <ControlBar
          controls={{ microphone: true, camera: true, screenShare: true, leave: false }}
          className="mx-auto flex w-fit gap-2 rounded-xl bg-black/40 p-2"
        />
      </div>
      <RoomAudioRenderer />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950">
      <div className="relative mb-8">
        <div className="absolute -inset-6 rounded-full border border-indigo-500/20 animate-ping" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl shadow-indigo-500/30">
          <VideoIcon className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
      <h2 className="text-base font-semibold text-white/90">Joining Interview Room</h2>
      <p className="mt-1.5 text-sm text-white/40">Setting up your secure connection...</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-600/20 to-red-900/20 ring-1 ring-red-500/20 mb-6">
        <span className="text-3xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-white/90">Connection Failed</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-white/50">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
          Try Again
        </button>
      )}
    </div>
  );
}

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: authUser, isLoading: isAuthLoading } = useAuthUser();
  const isEndingCallRef = useRef(false);

  const userId = authUser?._id;

  const { data: interview, isLoading: interviewLoading, error: interviewError, refetch } = useInterviewById(id || "");
  const generateToken = useGenerateInterviewToken();
  const updateStatus = useUpdateInterviewStatus();

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [attempt, setAttempt] = useState(0);


  const handleEndCall = useCallback(async () => {
    if (isEndingCallRef.current) return;
    isEndingCallRef.current = true;
    try {
      await updateStatus.mutateAsync({ id: id!, status: "completed" });
      toast.success("Interview ended successfully");
    } catch {
      toast.error("Failed to update interview status");
    } finally {
      navigate("/interviews");
    }
  }, [id, navigate, updateStatus]);

  // Fetch token — only depends on id and userId, uses refs for everything else
  useEffect(() => {
    if (!id || !userId) return;
    let cancelled = false;
    setFetching(true);
    setTokenError(null);

    const fetchToken = async () => {
      try {
        // The API gets identity from the authenticated cookie; it must not depend
        // on interview data which can still be loading.
        const res = await generateToken.mutateAsync(id);
        if (cancelled) return;
        setToken(res.token);
        setServerUrl(res.url);
      } catch (err: unknown) {
        if (cancelled) return;
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        setTokenError(error?.response?.data?.message || error?.message || "Failed to generate token");
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchToken();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, attempt]);

  if (isAuthLoading || interviewLoading || (fetching && !token)) return <LoadingScreen />;
  if (interviewError || !interview) return <ErrorScreen message="Interview not found or access denied." onRetry={() => refetch()} />;
  if (tokenError) return <ErrorScreen message={tokenError} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!token || !serverUrl) return <LoadingScreen />;

  const jobTitle = typeof interview.jobId === "object" ? interview.jobId.title : "Video Interview";
  const handleMediaDeviceFailure = (failure?: MediaDeviceFailure) => {
    const message = failure === "PermissionDenied"
      ? "Camera or microphone access was denied. Allow it in your browser settings and try again."
      : "Your camera or microphone could not be started. Check that it is connected and not being used by another app.";
    toast.error(message, { id: "media-device-error" });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950/30" />
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        audio
        video={interviewVideoOptions}
        options={interviewRoomOptions}
        connectOptions={{ autoSubscribe: true }}
        onError={(error) => setTokenError(error.message || "Unable to connect to the video server")}
        onMediaDeviceFailure={handleMediaDeviceFailure}
        onConnected={() => updateStatus.mutate({ id: id!, status: "in-progress" })}
        className="relative z-10 h-full w-full"
        data-lk-theme="default"
      >
        <VideoConference interviewTitle={jobTitle} />
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-30 group flex items-center gap-2 rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-medium text-white shadow-xl shadow-red-600/20 hover:bg-red-500 border border-red-500/30 transition-all"
        >
          <PhoneOff className="h-4 w-4" />
          <span>End Call</span>
        </button>
      </LiveKitRoom>
    </div>
  );
}
