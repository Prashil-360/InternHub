/**
 * FIX #3 — File Upload via Cloudinary
 * Server-side upload helper + signed URL generator for client-side uploads.
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/** Generate a signed upload preset for direct browser → Cloudinary uploads */
export function getSignedUploadParams(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder, allowed_formats: "jpg,jpeg,png,gif,pdf,doc,docx" };
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    folder,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
