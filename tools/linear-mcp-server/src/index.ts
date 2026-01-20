#!/usr/bin/env node
/**
 * Linear MCP Server - Entry Point
 * 
 * Custom MCP Server umożliwiający integrację z Linear issue tracking.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required env vars
const requiredEnvVars = ['LINEAR_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`);
    console.error('📝 Create .env file and add LINEAR_API_KEY');
    process.exit(1);
  }
}

// Initialize Linear GraphQL client
const linearClient = new GraphQLClient('https://api.linear.app/graphql', {
  headers: {
    Authorization: process.env.LINEAR_API_KEY!,
    'Content-Type': 'application/json',
  },
});

// Initialize MCP Server
const server = new Server(
  {
    name: 'linear-cursor',
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
        name: 'linear_list_issues',
        description: 'Lista issues z Linear (można filtrować po statusie, assignee, team)',
        inputSchema: {
          type: 'object',
          properties: {
            team: {
              type: 'string',
              description: 'Nazwa teamu (opcjonalne)',
            },
            assignee: {
              type: 'string',
              description: 'Email assignee (opcjonalne)',
            },
            status: {
              type: 'string',
              description: 'Status issue (opcjonalne: backlog, started, completed, canceled)',
            },
            limit: {
              type: 'number',
              description: 'Maksymalna liczba wyników (domyślnie 20)',
              default: 20,
            },
          },
          required: [],
        },
      },
      {
        name: 'linear_get_issue',
        description: 'Pobierz szczegóły konkretnego issue po ID',
        inputSchema: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'string',
              description: 'Linear Issue ID (np. ABC-123)',
            },
          },
          required: ['issue_id'],
        },
      },
      {
        name: 'linear_create_issue',
        description: 'Utwórz nowe issue w Linear',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Tytuł issue',
            },
            description: {
              type: 'string',
              description: 'Opis issue (markdown)',
            },
            team_id: {
              type: 'string',
              description: 'ID teamu (opcjonalne)',
            },
            assignee_id: {
              type: 'string',
              description: 'ID assignee (opcjonalne)',
            },
            priority: {
              type: 'number',
              description: 'Priorytet (1-4, gdzie 1 = najwyższy)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'linear_update_issue',
        description: 'Aktualizuj issue (status, assignee, itp.)',
        inputSchema: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'string',
              description: 'Linear Issue ID',
            },
            status: {
              type: 'string',
              description: 'Nowy status (backlog, started, completed, canceled)',
            },
            assignee_id: {
              type: 'string',
              description: 'ID nowego assignee',
            },
            priority: {
              type: 'number',
              description: 'Nowy priorytet (1-4)',
            },
          },
          required: ['issue_id'],
        },
      },
      {
        name: 'linear_list_teams',
        description: 'Lista dostępnych teamów w Linear',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
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
      case 'linear_list_issues': {
        const { team, assignee, status, limit = 20 } = args as {
          team?: string;
          assignee?: string;
          status?: string;
          limit?: number;
        };

        // GraphQL query dla listy issues
        const query = `
          query ListIssues($filter: IssueFilter, $first: Int) {
            issues(filter: $filter, first: $first) {
              nodes {
                id
                identifier
                title
                description
                state {
                  name
                  type
                }
                assignee {
                  name
                  email
                }
                team {
                  name
                  key
                }
                priority
                createdAt
                updatedAt
              }
            }
          }
        `;

        // Build filter
        const filter: any = {};
        if (team) {
          filter.team = { name: { eq: team } };
        }
        if (assignee) {
          filter.assignee = { email: { eq: assignee } };
        }
        if (status) {
          filter.state = { name: { eq: status } };
        }

        const data = await linearClient.request(query, {
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: limit,
        });

        const issues = (data as any).issues?.nodes || [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
            {
              count: issues.length,
              issues: issues.map((issue: any) => ({
                id: issue.identifier,
                title: issue.title,
                description: issue.description,
                status: issue.state?.name,
                assignee: issue.assignee?.name,
                team: issue.team?.name,
                priority: issue.priority,
              })),
            },
            null,
            2
          ),
            },
          ],
        };
      }

      case 'linear_get_issue': {
        const { issue_id } = args as { issue_id: string };

        const query = `
          query GetIssue($id: String!) {
            issue(id: $id) {
              id
              identifier
              title
              description
              state {
                name
                type
              }
              assignee {
                id
                name
                email
              }
              team {
                id
                name
                key
              }
              priority
              createdAt
              updatedAt
              comments {
                nodes {
                  body
                  user {
                    name
                  }
                  createdAt
                }
              }
            }
          }
        `;

        const data = await linearClient.request(query, { id: issue_id });

        const issue = (data as any).issue;

        if (!issue) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Issue ${issue_id} nie znaleziony`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
            {
              id: issue.identifier,
              title: issue.title,
              description: issue.description,
              status: issue.state?.name,
              assignee: issue.assignee?.name,
              team: issue.team?.name,
              priority: issue.priority,
              comments: issue.comments?.nodes?.map((c: any) => ({
                author: c.user?.name,
                body: c.body,
                createdAt: c.createdAt,
              })),
            },
            null,
            2
          ),
            },
          ],
        };
      }

      case 'linear_create_issue': {
        const {
          title,
          description,
          team_id,
          assignee_id,
          priority,
        } = args as {
          title: string;
          description?: string;
          team_id?: string;
          assignee_id?: string;
          priority?: number;
        };

        // Najpierw pobierz team_id jeśli nie podano
        let finalTeamId = team_id;
        if (!finalTeamId) {
          const teamsQuery = `
            query {
              teams {
                nodes {
                  id
                  name
                }
              }
            }
          `;
          const teamsData = await linearClient.request(teamsQuery);
          const teams = (teamsData as any).teams?.nodes || [];
          if (teams.length > 0) {
            finalTeamId = teams[0].id; // Użyj pierwszego dostępnego teamu
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: '❌ Brak dostępnych teamów w Linear',
                },
              ],
              isError: true,
            };
          }
        }

        const mutation = `
          mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                identifier
                title
              }
            }
          }
        `;

        const input: any = {
          title,
          teamId: finalTeamId,
        };

        if (description) {
          input.description = description;
        }
        if (assignee_id) {
          input.assigneeId = assignee_id;
        }
        if (priority) {
          input.priority = priority;
        }

        const data = await linearClient.request(mutation, { input });

        const result = (data as any).issueCreate;

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Nie udało się utworzyć issue',
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Issue utworzony: ${result.issue.identifier} - ${result.issue.title}`,
            },
          ],
        };
      }

      case 'linear_update_issue': {
        const { issue_id, status, assignee_id, priority } = args as {
          issue_id: string;
          status?: string;
          assignee_id?: string;
          priority?: number;
        };

        // Najpierw pobierz aktualne dane issue
        const getIssueQuery = `
          query GetIssue($id: String!) {
            issue(id: $id) {
              id
              state {
                id
              }
            }
          }
        `;

        const issueData = await linearClient.request(getIssueQuery, {
          id: issue_id,
        });
        const issue = (issueData as any).issue;

        if (!issue) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Issue ${issue_id} nie znaleziony`,
              },
            ],
            isError: true,
          };
        }

        const mutation = `
          mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
              success
              issue {
                identifier
                title
              }
            }
          }
        `;

        const input: any = {};

        if (status) {
          // Pobierz state ID dla danego statusu
          const statesQuery = `
            query {
              workflowStates {
                nodes {
                  id
                  name
                  type
                }
              }
            }
          `;
          const statesData = await linearClient.request(statesQuery);
          const states = (statesData as any).workflowStates?.nodes || [];
          const targetState = states.find((s: any) => s.name === status);
          if (targetState) {
            input.stateId = targetState.id;
          }
        }

        if (assignee_id) {
          input.assigneeId = assignee_id;
        }
        if (priority) {
          input.priority = priority;
        }

        if (Object.keys(input).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Brak zmian do zaktualizowania',
              },
            ],
            isError: true,
          };
        }

        const data = await linearClient.request(mutation, {
          id: issue.id,
          input,
        });

        const result = (data as any).issueUpdate;

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Nie udało się zaktualizować issue',
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Issue zaktualizowany: ${result.issue.identifier}`,
            },
          ],
        };
      }

      case 'linear_list_teams': {
        const query = `
          query {
            teams {
              nodes {
                id
                name
                key
              }
            }
          }
        `;

        const data = await linearClient.request(query);
        const teams = (data as any).teams?.nodes || [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
            {
              teams: teams.map((team: any) => ({
                id: team.id,
                name: team.name,
                key: team.key,
              })),
            },
            null,
            2
          ),
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
 * Start MCP Server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Linear MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
