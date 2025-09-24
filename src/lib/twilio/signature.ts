import crypto from "crypto";

export function verifyTwilioSignature({ url, params, signature }: { url: string; params: FormData | Record<string, any>; signature: string; }): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  
  // Convert FormData to plain object if needed
  let paramsObj: Record<string, any>;
  if (params instanceof FormData) {
    paramsObj = Object.fromEntries(params.entries());
  } else {
    paramsObj = params;
  }
  
  const data = url + Object.keys(paramsObj).sort().reduce((acc, key) => acc + key + String(paramsObj[key]), "");
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}


