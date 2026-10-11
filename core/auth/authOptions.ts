/**
 * FIX #8 — Session Security & Token Hardening
 * - JWT maxAge: 8 hours (was unlimited)
 * - updateAge: refresh token every 1 hour
 * - Secure cookie in production
 * - Rate limiting on login attempts
 * - Constant-time comparison to prevent timing attacks
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge:    8 * 60 * 60,  // 8 hours — was infinite
    updateAge: 60 * 60,       // re-issue token every hour
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
        ip:       { label: "IP",       type: "text"     }, // passed by login page
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Per-email rate limit: 10 attempts per 15 min
        const rl = rateLimit(`login:${credentials.email}`, LIMITS.login);
        if (!rl.allowed) {
          throw new Error("Too many login attempts. Please wait 15 minutes.");
        }

        await dbConnect();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          isActive: true,
        }).select("+password");

        // Always run bcrypt to prevent timing attacks revealing valid emails
        const dummyHash = "$2a$12$dummyhashfordummycompare000000000000000000000000000000";
        const isValid = user?.password
          ? await bcrypt.compare(credentials.password, user.password)
          : await bcrypt.compare(credentials.password, dummyHash).then(() => false);

        if (!isValid || !user) return null;

        // Audit successful login
        await audit({
          companyId: user.companyId.toString(),
          actorId:   user._id.toString(),
          actorName: user.name,
          actorRole: user.role,
          action:    "USER_LOGIN",
          targetType: "Session",
          ip: credentials.ip || "unknown",
        });

        return {
          id:                     user._id.toString(),
          email:                  user.email,
          name:                   user.name,
          role:                   user.role,
          companyId:              user.companyId.toString(),
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          avatarUrl:              user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id                     = (user as any).id;
        token.role                   = (user as any).role;
        token.companyId              = (user as any).companyId;
        token.hasCompletedOnboarding = (user as any).hasCompletedOnboarding;
        token.avatarUrl              = (user as any).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id                     = token.id;
        (session.user as any).role                   = token.role;
        (session.user as any).companyId              = token.companyId;
        (session.user as any).hasCompletedOnboarding = token.hasCompletedOnboarding;
        (session.user as any).avatarUrl              = token.avatarUrl;
      }
      return session;
    },
  },
};
