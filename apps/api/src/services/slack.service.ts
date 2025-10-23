/**
 * Slack Integration Service
 * Handles OAuth, messaging, and Slack API interactions
 */

import { WebClient } from '@slack/web-api';
import { InstallProvider } from '@slack/oauth';
import { PrismaClient } from '@teamflow/database';
import { encrypt, decrypt } from '../utils/encryption';
import type {
  SlackOAuthResponse,
  SlackChannel,
  SlackUser,
  SlackMessage,
  SlackServiceResult,
  SlackChannelListResult,
  SlackMessageResult,
  SlackIntegrationConfig,
} from '../modules/slack/slack.types';

const prisma = new PrismaClient();

// Environment variables
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:4000/api/slack/oauth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Slack OAuth scopes required
const SLACK_SCOPES = [
  'chat:write',           // Send messages
  'chat:write.public',    // Post to public channels
  'channels:read',        // List public channels
  'groups:read',          // List private channels
  'users:read',           // Read user information
  'users:read.email',     // Read user emails for mapping
  'im:write',             // Send DMs
];

/**
 * Slack OAuth installer
 */
const installer = new InstallProvider({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  stateSecret: SLACK_SIGNING_SECRET,
  installationStore: {
    storeInstallation: async (installation) => {
      // We'll store this in our database via the OAuth callback
      return;
    },
    fetchInstallation: async (installQuery) => {
      // Fetch from database
      const integration = await prisma.slackIntegration.findFirst({
        where: { teamId: installQuery.teamId as string },
      });

      if (!integration) {
        throw new Error('Installation not found');
      }

      const decryptedToken = decrypt(integration.accessToken);

      return {
        team: { id: integration.teamId, name: integration.teamName },
        bot: {
          token: decryptedToken,
          scopes: SLACK_SCOPES,
          userId: integration.botUserId,
          id: integration.botUserId,
        },
      };
    },
    deleteInstallation: async (installQuery) => {
      // Delete from database
      await prisma.slackIntegration.deleteMany({
        where: { teamId: installQuery.teamId as string },
      });
    },
  },
});

/**
 * SlackService Class
 */
export class SlackService {
  /**
   * Generate OAuth authorization URL
   * @param workspaceId - TeamFlow workspace ID
   * @returns Authorization URL to redirect user to
   */
  static async getOAuthUrl(workspaceId: string): Promise<string> {
    try {
      const url = await installer.generateInstallUrl({
        scopes: SLACK_SCOPES,
        redirectUri: SLACK_REDIRECT_URI,
        metadata: JSON.stringify({ workspaceId }), // Pass workspace ID through OAuth flow
      });

      return url;
    } catch (error) {
      console.error('Failed to generate OAuth URL:', error);
      throw new Error('Failed to generate Slack OAuth URL');
    }
  }

  /**
   * Exchange OAuth code for access token and save integration
   * @param code - OAuth authorization code
   * @param state - OAuth state parameter
   * @param workspaceId - TeamFlow workspace ID
   * @param installedBy - User ID who installed the integration
   * @returns Created SlackIntegration
   */
  static async exchangeCodeForToken(
    code: string,
    state: string,
    workspaceId: string,
    installedBy: string
  ): Promise<SlackServiceResult<any>> {
    try {
      // Exchange code for token
      const result = await installer.handleCallback({
        code,
        state,
      });

      const installation = result.installation as any;

      if (!installation || !installation.bot) {
        return {
          success: false,
          error: 'Invalid OAuth response from Slack',
        };
      }

      // Encrypt the access token before storing
      const encryptedToken = encrypt(installation.bot.token);

      // Check if integration already exists for this workspace
      const existing = await prisma.slackIntegration.findUnique({
        where: { workspaceId },
      });

      if (existing) {
        // Update existing integration
        const updated = await prisma.slackIntegration.update({
          where: { workspaceId },
          data: {
            accessToken: encryptedToken,
            botUserId: installation.bot.userId,
            teamId: installation.team.id,
            teamName: installation.team.name || 'Unknown',
            isActive: true,
            installedBy,
            updatedAt: new Date(),
          },
          include: {
            workspace: true,
            installedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          success: true,
          data: {
            ...updated,
            accessToken: undefined, // Don't return the encrypted token
          },
        };
      }

      // Create new integration
      const integration = await prisma.slackIntegration.create({
        data: {
          workspaceId,
          accessToken: encryptedToken,
          botUserId: installation.bot.userId,
          teamId: installation.team.id,
          teamName: installation.team.name || 'Unknown',
          isActive: true,
          installedBy,
        },
        include: {
          workspace: true,
          installedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return {
        success: true,
        data: {
          ...integration,
          accessToken: undefined, // Don't return the encrypted token
        },
      };
    } catch (error: any) {
      console.error('OAuth token exchange failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to exchange OAuth code',
      };
    }
  }

  /**
   * Get Slack Web API client for a workspace
   * @param workspaceId - TeamFlow workspace ID
   * @returns Slack WebClient instance
   */
  static async getClient(workspaceId: string): Promise<WebClient> {
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId, isActive: true },
    });

    if (!integration) {
      throw new Error('Slack integration not found or inactive');
    }

    const decryptedToken = decrypt(integration.accessToken);
    return new WebClient(decryptedToken);
  }

  /**
   * List available Slack channels
   * @param workspaceId - TeamFlow workspace ID
   * @param cursor - Pagination cursor
   * @returns List of Slack channels
   */
  static async listChannels(
    workspaceId: string,
    cursor?: string
  ): Promise<SlackChannelListResult> {
    try {
      const client = await this.getClient(workspaceId);

      // Get public channels
      const publicChannels = await client.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
        limit: 100,
        cursor,
      });

      // Get private channels the bot is a member of
      const privateChannels = await client.conversations.list({
        types: 'private_channel',
        exclude_archived: true,
        limit: 100,
      });

      const allChannels: SlackChannel[] = [];

      // Process public channels
      if (publicChannels.channels) {
        allChannels.push(
          ...publicChannels.channels.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            is_channel: ch.is_channel,
            is_group: ch.is_group,
            is_im: ch.is_im,
            is_mpim: ch.is_mpim,
            is_private: ch.is_private,
            is_archived: ch.is_archived,
            is_member: ch.is_member,
            num_members: ch.num_members,
          }))
        );
      }

      // Process private channels
      if (privateChannels.channels) {
        allChannels.push(
          ...privateChannels.channels.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            is_channel: ch.is_channel,
            is_group: ch.is_group,
            is_im: ch.is_im,
            is_mpim: ch.is_mpim,
            is_private: ch.is_private,
            is_archived: ch.is_archived,
            is_member: ch.is_member,
            num_members: ch.num_members,
          }))
        );
      }

      return {
        channels: allChannels,
        nextCursor: publicChannels.response_metadata?.next_cursor,
      };
    } catch (error) {
      console.error('Failed to list Slack channels:', error);
      throw new Error('Failed to retrieve Slack channels');
    }
  }

  /**
   * Find Slack user by email
   * @param workspaceId - TeamFlow workspace ID
   * @param email - User email address
   * @returns Slack user or null
   */
  static async findUserByEmail(
    workspaceId: string,
    email: string
  ): Promise<SlackUser | null> {
    try {
      const client = await this.getClient(workspaceId);

      const result = await client.users.lookupByEmail({ email });

      if (!result.ok || !result.user) {
        return null;
      }

      const user = result.user as any;

      return {
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        profile: {
          email: user.profile?.email,
          display_name: user.profile?.display_name,
          real_name: user.profile?.real_name,
          image_72: user.profile?.image_72,
        },
        is_bot: user.is_bot,
        deleted: user.deleted,
      };
    } catch (error) {
      console.error('Failed to find Slack user by email:', error);
      return null;
    }
  }

  /**
   * Send a direct message to a Slack user
   * @param workspaceId - TeamFlow workspace ID
   * @param slackUserId - Slack user ID
   * @param message - Message to send
   * @returns Message result
   */
  static async sendDirectMessage(
    workspaceId: string,
    slackUserId: string,
    message: SlackMessage
  ): Promise<SlackMessageResult> {
    try {
      const client = await this.getClient(workspaceId);

      const result = await client.chat.postMessage({
        channel: slackUserId,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
        thread_ts: message.thread_ts,
      });

      return {
        ok: result.ok,
        channel: result.channel!,
        ts: result.ts!,
        message: result.message as any,
      };
    } catch (error) {
      console.error('Failed to send Slack DM:', error);
      throw new Error('Failed to send Slack direct message');
    }
  }

  /**
   * Send a message to a Slack channel
   * @param workspaceId - TeamFlow workspace ID
   * @param channelId - Slack channel ID
   * @param message - Message to send
   * @returns Message result
   */
  static async sendChannelMessage(
    workspaceId: string,
    channelId: string,
    message: SlackMessage
  ): Promise<SlackMessageResult> {
    try {
      const client = await this.getClient(workspaceId);

      const result = await client.chat.postMessage({
        channel: channelId,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
        thread_ts: message.thread_ts,
      });

      return {
        ok: result.ok,
        channel: result.channel!,
        ts: result.ts!,
        message: result.message as any,
      };
    } catch (error) {
      console.error('Failed to send Slack channel message:', error);
      throw new Error('Failed to send message to Slack channel');
    }
  }

  /**
   * Update an existing Slack message
   * @param workspaceId - TeamFlow workspace ID
   * @param channelId - Channel ID where message was sent
   * @param messageTs - Message timestamp
   * @param message - Updated message content
   * @returns Message result
   */
  static async updateMessage(
    workspaceId: string,
    channelId: string,
    messageTs: string,
    message: SlackMessage
  ): Promise<SlackMessageResult> {
    try {
      const client = await this.getClient(workspaceId);

      const result = await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      });

      return {
        ok: result.ok,
        channel: result.channel!,
        ts: result.ts!,
        message: result.message as any,
      };
    } catch (error) {
      console.error('Failed to update Slack message:', error);
      throw new Error('Failed to update Slack message');
    }
  }

  /**
   * Revoke Slack access and delete integration
   * @param integrationId - Slack integration ID
   * @returns Success result
   */
  static async revokeAccess(integrationId: string): Promise<SlackServiceResult> {
    try {
      const integration = await prisma.slackIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        return {
          success: false,
          error: 'Integration not found',
        };
      }

      // Revoke token with Slack
      try {
        const decryptedToken = decrypt(integration.accessToken);
        const client = new WebClient(decryptedToken);
        await client.auth.revoke();
      } catch (error) {
        console.warn('Failed to revoke token with Slack:', error);
        // Continue with local deletion even if revocation fails
      }

      // Delete integration and related data
      await prisma.slackIntegration.delete({
        where: { id: integrationId },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to revoke Slack access:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke Slack access',
      };
    }
  }

  /**
   * Get integration status for a workspace
   * @param workspaceId - TeamFlow workspace ID
   * @returns Integration details or null
   */
  static async getIntegrationStatus(workspaceId: string) {
    return await prisma.slackIntegration.findUnique({
      where: { workspaceId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        installedByUser: {
          select: { id: true, name: true, email: true },
        },
        channelMappings: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }
}

export default SlackService;
