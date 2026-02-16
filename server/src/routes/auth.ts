import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
      },
      select: { id: true, username: true, email: true },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  // For session tokens stored client-side, logout is handled by the client
  // This endpoint exists for consistency and future session invalidation
  res.json({ success: true });
});

export default router;
