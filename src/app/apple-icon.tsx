import { ImageResponse } from "next/og";
import { OgMark } from "./og-mark";

// Home-screen icon for iPhones: the BillWise mark, full bleed (iOS rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0f1b2d" }}>
        <OgMark size={180} square />
      </div>
    ),
    size,
  );
}
