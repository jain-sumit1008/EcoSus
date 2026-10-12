import { env } from "./env.js";

export const webauthnConfig = {
  rpName: env.webauthn.rpName,
  rpID: env.webauthn.rpId,
  origin: env.webauthn.origin,
};

const challenges = new Map();

export function storeChallenge(userId, challenge) {
  challenges.set(String(userId), { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function consumeChallenge(userId) {
  const record = challenges.get(String(userId));
  challenges.delete(String(userId));
  if (!record || record.expiresAt < Date.now()) return null;
  return record.challenge;
}
