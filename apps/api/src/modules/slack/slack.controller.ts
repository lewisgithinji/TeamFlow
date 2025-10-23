import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@teamflow/database';
import SlackService from '../../services/slack.service';
import type {
  UpdateIntegrationSettingsDto,
  CreateChannelMappingDto,
  UpdateChannelMappingDto,
  UpdateUserPreferencesDto,
} from './slack.types';

const prisma = new PrismaClient();

/**
 * Initiate Slack OAuth flow
 * GET /api/slack/oauth/start?workspaceId=xxx
 */
export async function startOAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Workspace ID is required',
      });
    }

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to connect Slack to this workspace',
      });
    }

    const authUrl = await SlackService.getOAuthUrl(workspaceId);

    res.status(200).json({
      data: { authUrl },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Slack OAuth callback
 * GET /api/slack/oauth/callback?code=xxx&state=xxx
 */
export async function handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'OAuth code is required',
      });
    }

    if (!state || typeof state !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'OAuth state is required',
      });
    }

    // Extract workspaceId from state (Slack OAuth stores metadata in state)
    // For now, we'll need to pass it through the metadata in the OAuth URL
    // The InstallProvider handles this automatically

    // This is a simplified version - in production, you'd decode the state
    // to get the workspaceId and userId
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Redirect to frontend with code and state
    // The frontend will call the API to complete the OAuth flow
    res.redirect(`${FRONTEND_URL}/slack/callback?code=${code}&state=${state}`);
  } catch (error) {
    next(error);
  }
}

/**
 * Complete OAuth flow (called by frontend after callback)
 * POST /api/slack/oauth/complete
 */
export async function completeOAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { code, state, workspaceId } = req.body;

    if (!code || !workspaceId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Code and workspace ID are required',
      });
    }

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to connect Slack to this workspace',
      });
    }

    const result = await SlackService.exchangeCodeForToken(code, state || '', workspaceId, userId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: result.error || 'Failed to connect Slack',
      });
    }

    res.status(200).json({
      message: 'Slack workspace connected successfully',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Slack integration status
 * GET /api/slack/integration/:workspaceId
 */
export async function getIntegrationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { workspaceId } = req.params;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: { userId },
        },
      },
    });

    if (!workspace) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this workspace',
      });
    }

    const integration = await SlackService.getIntegrationStatus(workspaceId);

    if (!integration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Slack integration not found for this workspace',
      });
    }

    // Remove encrypted token from response
    const { accessToken, ...integrationData } = integration;

    res.status(200).json({
      data: integrationData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update integration settings
 * PATCH /api/slack/integration/:integrationId
 */
export async function updateIntegrationSettings(
  req: Request<{ integrationId: string }, {}, UpdateIntegrationSettingsDto>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this integration',
      });
    }

    const updated = await prisma.slackIntegration.update({
      where: { id: integrationId },
      data: req.body,
    });

    const { accessToken, ...responseData } = updated;

    res.status(200).json({
      message: 'Integration settings updated',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect Slack integration
 * DELETE /api/slack/integration/:integrationId
 */
export async function disconnectIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to disconnect this integration',
      });
    }

    const result = await SlackService.revokeAccess(integrationId);

    if (!result.success) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: result.error || 'Failed to disconnect Slack',
      });
    }

    res.status(200).json({
      message: 'Slack integration disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List available Slack channels
 * GET /api/slack/integration/:integrationId/channels
 */
export async function listChannels(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;
    const { cursor } = req.query;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this integration',
      });
    }

    const result = await SlackService.listChannels(
      integration.workspaceId,
      cursor as string | undefined
    );

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create channel mapping
 * POST /api/slack/integration/:integrationId/channels
 */
export async function createChannelMapping(
  req: Request<{ integrationId: string }, {}, CreateChannelMappingDto>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to create channel mappings',
      });
    }

    // If projectId is provided, verify it belongs to this workspace
    if (req.body.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: req.body.projectId,
          workspaceId: integration.workspaceId,
        },
      });

      if (!project) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Project does not belong to this workspace',
        });
      }
    }

    const mapping = await prisma.slackChannelMapping.create({
      data: {
        integrationId,
        channelId: req.body.channelId,
        channelName: req.body.channelName,
        channelType: req.body.channelId.startsWith('D') ? 'dm' : 'public',
        projectId: req.body.projectId,
        notifyOnAssignment: req.body.notifyOnAssignment ?? true,
        notifyOnStatusChange: req.body.notifyOnStatusChange ?? true,
        notifyOnComment: req.body.notifyOnComment ?? true,
        notifyOnDueDate: req.body.notifyOnDueDate ?? true,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      message: 'Channel mapping created',
      data: mapping,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This channel is already mapped',
      });
    }
    next(error);
  }
}

/**
 * Update channel mapping
 * PATCH /api/slack/channels/:mappingId
 */
export async function updateChannelMapping(
  req: Request<{ mappingId: string }, {}, UpdateChannelMappingDto>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { mappingId } = req.params;

    // Verify user has access to this mapping
    const mapping = await prisma.slackChannelMapping.findUnique({
      where: { id: mappingId },
      include: {
        integration: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId,
                    role: { in: ['OWNER', 'ADMIN'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mapping || mapping.integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this channel mapping',
      });
    }

    const updated = await prisma.slackChannelMapping.update({
      where: { id: mappingId },
      data: req.body,
    });

    res.status(200).json({
      message: 'Channel mapping updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete channel mapping
 * DELETE /api/slack/channels/:mappingId
 */
export async function deleteChannelMapping(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { mappingId } = req.params;

    // Verify user has access to this mapping
    const mapping = await prisma.slackChannelMapping.findUnique({
      where: { id: mappingId },
      include: {
        integration: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId,
                    role: { in: ['OWNER', 'ADMIN'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mapping || mapping.integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this channel mapping',
      });
    }

    await prisma.slackChannelMapping.delete({
      where: { id: mappingId },
    });

    res.status(200).json({
      message: 'Channel mapping deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user preferences
 * GET /api/slack/integration/:integrationId/preferences
 */
export async function getUserPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this integration',
      });
    }

    let preferences = await prisma.slackUserPreference.findUnique({
      where: {
        userId_integrationId: {
          userId,
          integrationId,
        },
      },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.slackUserPreference.create({
        data: {
          userId,
          integrationId,
        },
      });
    }

    res.status(200).json({
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user preferences
 * PATCH /api/slack/integration/:integrationId/preferences
 */
export async function updateUserPreferences(
  req: Request<{ integrationId: string }, {}, UpdateUserPreferencesDto>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    const { integrationId } = req.params;

    // Verify user has access to this integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { id: integrationId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!integration || integration.workspace.members.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this integration',
      });
    }

    // Prepare update data
    const updateData: any = { ...req.body };

    // Handle quiet hours separately
    if (req.body.quietHours) {
      updateData.quietHoursEnabled = req.body.quietHours.enabled;
      updateData.quietHoursStart = req.body.quietHours.start;
      updateData.quietHoursEnd = req.body.quietHours.end;
      delete updateData.quietHours;
    }

    const preferences = await prisma.slackUserPreference.upsert({
      where: {
        userId_integrationId: {
          userId,
          integrationId,
        },
      },
      update: updateData,
      create: {
        userId,
        integrationId,
        ...updateData,
      },
    });

    res.status(200).json({
      message: 'Preferences updated',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}
