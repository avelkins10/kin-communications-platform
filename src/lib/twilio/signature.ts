import crypto from "crypto";

export function verifyTwilioSignature({ url, params, signature }: { url: string; params: Record<string, any>; signature: string; }): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const data = url + Object.keys(params).sort().reduce((acc, key) => acc + key + String(params[key]), "");
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}


