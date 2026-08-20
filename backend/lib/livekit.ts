import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
export const LIVEKIT_URL = process.env.LIVEKIT_URL || "";

// Server-side room service client for managing rooms
export const roomService = LIVEKIT_API_KEY && LIVEKIT_API_SECRET
	? new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
	: null;

interface TokenOptions {
	roomName: string;
	participantIdentity: string;
	participantName: string;
}

/**
 * Generate a LiveKit access token for a participant.
 * Token grants publish + subscribe permissions.
 */
export const generateRoomToken = async ({
	roomName,
	participantIdentity,
	participantName,
}: TokenOptions): Promise<string> => {
	if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
		throw new Error("LiveKit credentials are not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env");
	}

	const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
		identity: participantIdentity,
		name: participantName,
		// Token valid for 4 hours
		ttl: "4h",
	});

	token.addGrant({
		roomJoin: true,
		room: roomName,
		canPublish: true,
		canSubscribe: true,
		canPublishData: true,
	});

	return await token.toJwt();
};

/**
 * Ensure a LiveKit room exists (creates it if not).
 * Safe to call even if room already exists.
 */
export const ensureRoom = async (roomName: string): Promise<void> => {
	if (!roomService) return;
	try {
		await roomService.createRoom({
			name: roomName,
			emptyTimeout: 300, // Close room after 5 min of inactivity
			maxParticipants: 2,
		});
	} catch (err: any) {
		// Room may already exist — that's fine
		if (!err?.message?.includes("already exists")) {
			console.warn("[LiveKit] createRoom error:", err.message);
		}
	}
};
