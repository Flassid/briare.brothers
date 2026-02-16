import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { generateInviteCode } from '../lib/auth.js';

const router = Router();

/**
 * GET /api/campaigns
 * Get all campaigns for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { dmId: userId },
          { players: { some: { userId } } },
        ],
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        dm: {
          select: { id: true, username: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform response
    const transformed = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      inviteCode: campaign.inviteCode,
      status: campaign.status,
      dmId: campaign.dmId,
      createdAt: campaign.createdAt,
      players: campaign.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.user.username,
        characterName: p.characterName,
        characterClass: p.characterClass,
        characterLevel: p.characterLevel,
        isReady: p.isReady,
        isOnline: false,
      })),
    }));

    res.json({ campaigns: transformed });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.campaign.findUnique({
        where: { inviteCode },
      });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create campaign with DM as first player
    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        inviteCode,
        dmId: userId,
        players: {
          create: {
            userId,
            isReady: true, // DM is always ready
          },
        },
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        inviteCode: campaign.inviteCode,
        status: campaign.status,
        dmId: campaign.dmId,
        createdAt: campaign.createdAt,
        players: campaign.players.map((p) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          characterName: p.characterName,
          characterClass: p.characterClass,
          characterLevel: p.characterLevel,
          isReady: p.isReady,
          isOnline: false,
        })),
      },
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a specific campaign
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        dm: {
          select: { id: true, username: true },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if user is part of the campaign
    const isMember = campaign.dmId === userId || 
      campaign.players.some((p) => p.userId === userId);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        inviteCode: campaign.inviteCode,
        status: campaign.status,
        dmId: campaign.dmId,
        createdAt: campaign.createdAt,
        players: campaign.players.map((p) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          characterName: p.characterName,
          characterClass: p.characterClass,
          characterLevel: p.characterLevel,
          isReady: p.isReady,
          isOnline: false,
        })),
      },
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/campaigns/join
 * Join a campaign using invite code
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existingPlayer = campaign.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      return res.status(400).json({ error: 'You are already in this campaign' });
    }

    // Check if campaign is accepting new players
    if (campaign.status !== 'LOBBY') {
      return res.status(400).json({ error: 'This campaign is not accepting new players' });
    }

    // Add player
    const player = await prisma.player.create({
      data: {
        campaignId: campaign.id,
        userId,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    // Return updated campaign
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    res.json({
      campaign: {
        id: updatedCampaign!.id,
        name: updatedCampaign!.name,
        description: updatedCampaign!.description,
        inviteCode: updatedCampaign!.inviteCode,
        status: updatedCampaign!.status,
        dmId: updatedCampaign!.dmId,
        createdAt: updatedCampaign!.createdAt,
        players: updatedCampaign!.players.map((p) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          characterName: p.characterName,
          characterClass: p.characterClass,
          characterLevel: p.characterLevel,
          isReady: p.isReady,
          isOnline: false,
        })),
      },
    });
  } catch (error) {
    console.error('Join campaign error:', error);
    res.status(500).json({ error: 'Failed to join campaign' });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update campaign (DM only)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, status } = req.body;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.dmId !== userId) {
      return res.status(403).json({ error: 'Only the DM can update the campaign' });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    res.json({
      campaign: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        inviteCode: updated.inviteCode,
        status: updated.status,
        dmId: updated.dmId,
        createdAt: updated.createdAt,
        players: updated.players.map((p) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          characterName: p.characterName,
          characterClass: p.characterClass,
          characterLevel: p.characterLevel,
          isReady: p.isReady,
          isOnline: false,
        })),
      },
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign (DM only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.dmId !== userId) {
      return res.status(403).json({ error: 'Only the DM can delete the campaign' });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

/**
 * POST /api/campaigns/:id/leave
 * Leave a campaign (non-DM players only)
 */
router.post('/:id/leave', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        players: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.dmId === userId) {
      return res.status(400).json({ error: 'DM cannot leave the campaign. Delete it instead.' });
    }

    const player = campaign.players.find((p) => p.userId === userId);
    if (!player) {
      return res.status(400).json({ error: 'You are not in this campaign' });
    }

    await prisma.player.delete({
      where: { id: player.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Leave campaign error:', error);
    res.status(500).json({ error: 'Failed to leave campaign' });
  }
});

export default router;
