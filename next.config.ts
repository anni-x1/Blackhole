import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Provide dummy values for build-time if they are missing
    SESSION_PASSWORD: process.env.SESSION_PASSWORD || "dummy_session_password_at_least_32_chars_long",
    DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/dummy",
  },
};

export default nextConfig;
