/**
 * API: /api/auth/[...nextauth]
 * Purpose: Handles all NextAuth.js authentication routes automatically.
 * Covers: GET/POST for sign-in, sign-out, session, CSRF token, and callbacks.
 * Used by: next-auth client (signIn, signOut, useSession, getServerSession)
 */
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
