import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { webauthnConfig, storeChallenge, consumeChallenge } from "../../config/webauthn.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

export async function authenticationOptions(user) {
  if (!user.webauthnCredentials?.length) {
    throw new ApiError(
      400,
      "No WebAuthn credentials are registered for this account. Use labelled demo verification or register a passkey first.",
      "WEBAUTHN_UNAVAILABLE"
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: webauthnConfig.rpID,
    allowCredentials: user.webauthnCredentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports,
    })),
    userVerification: "preferred",
  });
  storeChallenge(user._id, options.challenge);
  return options;
}

export async function verifyAuthentication(user, response) {
  const expectedChallenge = consumeChallenge(user._id);
  if (!expectedChallenge) {
    throw new ApiError(400, "WebAuthn challenge expired. Request a new challenge.", "WEBAUTHN_EXPIRED");
  }
  const credential = user.webauthnCredentials.find((item) => item.credentialID === response.id);
  if (!credential) {
    throw new ApiError(400, "Unknown authenticator credential", "WEBAUTHN_UNKNOWN");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: webauthnConfig.origin,
    expectedRPID: webauthnConfig.rpID,
    credential: {
      id: credential.credentialID,
      publicKey: Buffer.from(credential.credentialPublicKey, "base64url"),
      counter: credential.counter,
    },
  });

  if (!verification.verified) {
    throw new ApiError(401, "WebAuthn verification failed", "WEBAUTHN_FAILED");
  }

  credential.counter = verification.authenticationInfo.newCounter;
  await User.updateOne(
    { _id: user._id, "webauthnCredentials.credentialID": credential.credentialID },
    { $set: { "webauthnCredentials.$.counter": credential.counter } }
  );

  return { verified: true, method: "webauthn" };
}
