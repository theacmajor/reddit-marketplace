import { ImageResponse } from "next/og";

export const alt = "bangalore.market — Community listings from r/BangaloreMarketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF5F0 0%, #F5F5F4 40%, #FAFAFA 100%)",
          padding: "80px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "hsl(16, 100%, 55%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1,
                marginTop: -2,
              }}
            >
              b
            </span>
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
            }}
          >
            bangalore.market
          </span>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#0a0a0a",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            maxWidth: 900,
          }}
        >
          The Bangalore marketplace, rebuilt from Reddit.
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#737373",
            marginTop: 24,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Discover flats, furniture, gadgets, and gigs posted by real redditors in your neighborhood.
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 48,
            padding: "12px 24px",
            borderRadius: 999,
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "hsl(16, 100%, 55%)",
            }}
          />
          <span
            style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a" }}
          >
            Live from r/BangaloreMarketplace
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
