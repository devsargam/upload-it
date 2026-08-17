import { factory } from '@/lib/factory';
import { AppEnv } from '@/types/app';
import { Context } from 'hono';

// Short enough to read out loud, long enough that rooms aren't guessable.
const ROOM_ID_LENGTH = 8;
const ROOM_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_ID_LENGTH));
  return Array.from(bytes)
    .map(byte => ROOM_ID_ALPHABET[byte % ROOM_ID_ALPHABET.length])
    .join('');
}

function isValidRoomId(roomId: string): boolean {
  return new RegExp(`^[${ROOM_ID_ALPHABET}]{${ROOM_ID_LENGTH}}$`).test(roomId);
}

// The sender calls this first, then shares the code with the receiver.
export const createRoomHandler = factory.createHandlers(async (c: Context) => {
  return c.json({ roomId: generateRoomId() });
});

// Both peers connect here and the room forwards their SDP and ICE messages.
export const joinRoomHandler = factory.createHandlers(async (c: Context<AppEnv>) => {
  const roomId = c.req.param('roomId');
  if (!isValidRoomId(roomId)) {
    return c.json({ success: false, message: 'Invalid room id' }, 400);
  }

  const id = c.env.SIGNALING_ROOM.idFromName(roomId);
  return c.env.SIGNALING_ROOM.get(id).fetch(c.req.raw);
});
