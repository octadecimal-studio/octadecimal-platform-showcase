#!/usr/bin/env node
/**
 * Slack MCP Server - Entry Point
 * 
 * Custom MCP Server umożliwiający kontrolę workflow przez Slack.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { App } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required env vars
const requiredEnvVars = [
  'SLACK_BOT_TOKEN',
  'SLACK_APP_TOKEN',
  'SLACK_SIGNING_SECRET',
  'GITHUB_TOKEN',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`);
    console.error('📝 Copy .env.example to .env and fill in values');
    process.exit(1);
  }
}

// Initialize Slack App
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true, // Enable Socket Mode for local dev
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initialize GitHub client
const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Initialize MCP Server
const server = new Server(
  {
    name: 'slack-cursor',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Lista dostępnych narzędzi MCP
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'slack_send_message',
        description: 'Wyślij wiadomość na Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: {
              type: 'string',
              description: 'Slack channel ID lub nazwa',
            },
            message: {
              type: 'string',
              description: 'Treść wiadomości',
            },
          },
          required: ['channel', 'message'],
        },
      },
      {
        name: 'github_check_pr_status',
        description: 'Sprawdź status PR i CI/CD checks',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Numer Pull Request',
            },
          },
          required: ['pr_number'],
        },
      },
      {
        name: 'github_merge_pr',
        description: 'Zmerguj Pull Request',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Numer Pull Request',
            },
            merge_method: {
              type: 'string',
              enum: ['merge', 'squash', 'rebase'],
              description: 'Metoda mergowania',
              default: 'squash',
            },
          },
          required: ['pr_number'],
        },
      },
    ],
  };
});

/**
 * Obsługa wywołań narzędzi
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'slack_send_message': {
        const { channel, message } = args as { channel: string; message: string };
        
        await slackApp.client.chat.postMessage({
          channel,
          text: message,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Wiadomość wysłana na #${channel}`,
            },
          ],
        };
      }

      case 'github_check_pr_status': {
        const { pr_number } = args as { pr_number: number };
        
        const pr = await github.pulls.get({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          pull_number: pr_number,
        });

        const checks = await github.checks.listForRef({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          ref: pr.data.head.sha,
        });

        const status = {
          title: pr.data.title,
          state: pr.data.state,
          mergeable: pr.data.mergeable,
          checks: checks.data.check_runs.map(check => ({
            name: check.name,
            status: check.status,
            conclusion: check.conclusion,
          })),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'github_merge_pr': {
        const { pr_number, merge_method = 'squash' } = args as {
          pr_number: number;
          merge_method?: 'merge' | 'squash' | 'rebase';
        };

        const result = await github.pulls.merge({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          pull_number: pr_number,
          merge_method,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ PR #${pr_number} zmergowany! SHA: ${result.data.sha}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Slack Commands
 */

// /cursor status
slackApp.command('/cursor-status', async ({ command, ack, respond }) => {
  await ack();

  try {
    // Pobierz otwarte PRy
    const prs = await github.pulls.list({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      state: 'open',
    });

    const message = prs.data.length === 0
      ? '✅ Brak otwartych Pull Requests'
      : `📊 Otwarte PRy:\n${prs.data
          .map((pr) => `• #${pr.number}: ${pr.title}`)
          .join('\n')}`;

    await respond(message);
  } catch (error) {
    await respond(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}`);
  }
});

// /cursor merge <pr_number>
slackApp.command('/cursor-merge', async ({ command, ack, respond }) => {
  await ack();

  const prNumber = parseInt(command.text.trim(), 10);
  
  if (isNaN(prNumber)) {
    await respond('❌ Podaj poprawny numer PR: `/cursor-merge 14`');
    return;
  }

  try {
    await respond(`⏳ Mergowanie PR #${prNumber}...`);

    await github.pulls.merge({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      pull_number: prNumber,
      merge_method: 'squash',
    });

    await respond(`✅ PR #${prNumber} zmergowany pomyślnie!`);
  } catch (error) {
    await respond(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}`);
  }
});

/**
 * Start servers
 */
async function main() {
  // Start Slack Bot
  await slackApp.start();
  console.log('⚡ Slack Bot is running!');

  // Start MCP Server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🚀 MCP Server is running!');
}

main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
