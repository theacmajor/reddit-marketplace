import { ImageResponse } from "next/og";

export const alt = "bangalore.market — Community listings from r/BangaloreMarketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF5F0 0%, #F5F5F4 40%, #FAFAFA 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "hsl(16, 100%, 55%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: -2,
            }}
          >
            b
          </span>
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#0a0a0a",
            lineHeight: 1.2,
            letterSpacing: "-0.03em",
            maxWidth: 800,
          }}
        >
          The Bangalore marketplace, rebuilt from Reddit.
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#737373",
            marginTop: 20,
            maxWidth: 600,
          }}
        >
          Flats, furniture, gadgets, and gigs from r/BangaloreMarketplace
        </div>
      </div>
    ),
    { ...size },
  );
}
