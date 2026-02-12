import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  username: string;
  permissions: string[];
  isAdmin: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      permissions: true,
      isAdmin: true,
      createdAt: true,
    }
  });
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 0,
  });
}