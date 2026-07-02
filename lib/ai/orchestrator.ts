// GoalMind — Multi-Agent Orchestration
// Multiple specialized AI agents that collaborate to provide insights.
// Uses QVAC native tool calling: the LLM decides which tools to call,
// the SDK parses the calls, and we invoke real handlers (RAG retrieval,
// the statistical prediction engine, team stats) before the final answer.

import { z } from 'zod';
import { completion, type ToolInput } from '@qvac/sdk';
import { generateText, generateStructured, ensureModelLoaded } from './models';
import { queryKnowledgeBase } from './rag';
import { predictMatch } from '@/lib/predictions/engine';
import {
  SAMPLE_MATCHES,
  SAMPLE_TEAMS,
  formatTeamStatsForAnalysis,
  type MatchData,
} from '@/lib/data/football';

// ---- Agent Types ----

export type AgentRole =
  | 'coach'       // Tactical analysis and strategy
  | 'analyst'     // Statistical analysis and predictions
  | 'commentator' // Live commentary generation
  | 'scout'       // Player and team scouting reports
  | 'orchestrator'; // Coordinates other agents

export interface AgentMessage {
  from: AgentRole;
  to: AgentRole | 'all';
  content: string;
  timestamp: number;
  type: 'request' | 'response' | 'insight' | 'question';
}

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  dependencies?: string[];
}

export interface AnalysisReport {
  matchId: string;
  tactical: string;
  statistical: string;
  commentary: string;
  scouting: string;
  synthesis: string;
  agents: AgentRole[];
  timestamp: number;
}

// ---- Tool Definitions (QVAC native tool calling) ----
// These are passed to `completion({ tools })`. The SDK constrains the model's
// output to valid tool-call grammar, parses calls, and `toolCall.invoke()`
// runs the real handler below.

function findTeamByName(name: string) {
  const needle = name.trim().toLowerCase();
  return Object.values(SAMPLE_TEAMS).find(
    (t) => t.name.toLowerCase().includes(needle) || t.shortName.toLowerCase() === needle
  );
}

const agentTools = [
  {
    name: 'query_knowledge',
    description:
      'Search the on-device football knowledge base (rules, tactics, history, players, teams). Returns the most relevant passages.',
    parameters: z.object({
      query: z.string().describe('The search query'),
    }),
    handler: async ({ query }: { query: string }) => {
      const results = await queryKnowledgeBase(query, 2);
      if (results.length === 0) return 'No relevant knowledge found.';
      return results.map((r) => `${r.document.title}: ${r.relevantChunk}`).join('\n\n');
    },
  },
  {
    name: 'predict_match',
    description:
      'Run the statistical prediction engine (Elo + Poisson + form) for a match between two known teams. Returns win/draw/loss probabilities and expected goals.',
    parameters: z.object({
      homeTeam: z.string().describe('Home team name'),
      awayTeam: z.string().describe('Away team name'),
    }),
    handler: async ({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) => {
      const match =
        SAMPLE_MATCHES.find(
          (m) =>
            m.homeTeam.name.toLowerCase().includes(homeTeam.trim().toLowerCase()) &&
            m.awayTeam.name.toLowerCase().includes(awayTeam.trim().toLowerCase())
        ) ?? null;
      const home = match?.homeTeam ?? findTeamByName(homeTeam);
      const away = match?.awayTeam ?? findTeamByName(awayTeam);
      if (!home || !away) return `Unknown team(s): ${homeTeam} vs ${awayTeam}.`;

      const syntheticMatch: MatchData = match ?? {
        ...SAMPLE_MATCHES[0],
        id: `synthetic_${Date.now()}`,
        homeTeam: home,
        awayTeam: away,
      };
      const p = predictMatch(syntheticMatch);
      return (
        `Home win ${(p.homeWin * 100).toFixed(0)}%, draw ${(p.draw * 100).toFixed(0)}%, ` +
        `away win ${(p.awayWin * 100).toFixed(0)}%. xG ${p.xgHome.toFixed(2)} vs ${p.xgAway.toFixed(2)}. ` +
        `Confidence ${(p.confidence * 100).toFixed(0)}%.`
      );
    },
  },
  {
    name: 'get_team_stats',
    description: 'Get season statistics for a team (possession, shots, goals, form).',
    parameters: z.object({
      team: z.string().describe('Team name'),
    }),
    handler: async ({ team }: { team: string }) => {
      const found = findTeamByName(team);
      if (!found) return `No data for team "${team}".`;
      return formatTeamStatsForAnalysis(found);
    },
  },
];

/**
 * Ask the LLM a question with the football tools available.
 * Implements a full agentic loop: the model requests tools, we invoke the
 * real handlers via the SDK, feed results back, and get the final answer.
 */
export async function askWithTools(
  question: string,
  systemPrompt: string = AGENT_SYSTEM_PROMPTS.analyst
): Promise<{ answer: string; toolsUsed: string[] }> {
  const modelId = await ensureModelLoaded('llm');

  const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ];

  const toolsUsed: string[] = [];

  // Agentic loop: allow up to 3 rounds of tool use before the final answer.
  for (let round = 0; round < 3; round++) {
    const run = completion({
      modelId,
      history,
      stream: false,
      tools: agentTools as unknown as ToolInput[],
    });
    const final = await run.final;

    if (final.toolCalls.length === 0) {
      return { answer: final.contentText.trim(), toolsUsed };
    }

    for (const toolCall of final.toolCalls) {
      toolsUsed.push(toolCall.name);
      let result: string;
      try {
        result = toolCall.invoke
          ? String(await toolCall.invoke())
          : 'Tool handler unavailable.';
      } catch (err) {
        result = `Tool failed: ${err instanceof Error ? err.message : 'unknown error'}`;
      }
      history.push({ role: 'assistant', content: `Called ${toolCall.name}.` });
      history.push({ role: 'user', content: `Tool result (${toolCall.name}): ${result}` });
    }
  }

  // Tool budget exhausted — ask for a direct answer.
  history.push({ role: 'user', content: 'Answer the original question now using the tool results above.' });
  const answer = await generateText(
    history.map((h) => `${h.role}: ${h.content}`).join('\n'),
    systemPrompt
  );
  return { answer, toolsUsed };
}

// ---- Agent Implementations ----

const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  coach: `You are the Coach Agent in GoalMind, a tactical football expert.
Your role: Analyze formations, pressing patterns, defensive structures, and strategic approaches.
Focus on: Why certain tactics work against specific opponents, what adjustments to make, and how to exploit weaknesses.
Be direct and technical. Use proper football terminology. Keep responses under 3 paragraphs.`,

  analyst: `You are the Analyst Agent in GoalMind, a statistical football expert.
Your role: Analyze team and player statistics, calculate probabilities, and identify statistical trends.
Focus on: xG, possession metrics, passing accuracy, defensive records, and form analysis.
Be precise with numbers. Provide context for statistics. Keep responses data-driven.`,

  commentator: `You are the Commentator Agent in GoalMind, an exciting football commentator.
Your role: Generate vivid, energetic commentary for match events and key moments.
Focus on: Drama, excitement, atmosphere, and storytelling. Make the listener feel like they're in the stadium.
Be dramatic but not cheesy. Use varied vocabulary. Keep it to 1-2 sentences per event.`,

  scout: `You are the Scout Agent in GoalMind, a player and team scouting expert.
Your role: Analyze player strengths, weaknesses, playing styles, and potential transfer targets.
Focus on: Technical ability, physical attributes, tactical awareness, and mental strength.
Be objective and thorough. Compare players to established archetypes. Keep reports concise.`,

  orchestrator: `You are the Orchestrator Agent in GoalMind, coordinating multiple specialized agents.
Your role: Break down complex questions into sub-tasks, delegate to appropriate agents, and synthesize results.
Focus on: Efficient task distribution, identifying which agent is best for each sub-task, and combining insights into coherent answers.
Be systematic and thorough. Ensure all aspects of the question are addressed.`,
};

// ---- Orchestrator ----

export class AgentOrchestrator {
  private messageHistory: AgentMessage[] = [];
  private taskQueue: AgentTask[] = [];

  /**
   * Process a complex query by breaking it into sub-tasks
   * and delegating to appropriate agents.
   */
  async processQuery(
    query: string,
    match?: MatchData,
    options?: { maxAgents?: number; includeKnowledge?: boolean }
  ): Promise<AnalysisReport> {
    const { maxAgents = 3, includeKnowledge = true } = options || {};

    // Step 1: Orchestrator decides which agents to use.
    // QVAC structured output (json_schema) guarantees a parseable plan —
    // the grammar is enforced by llama.cpp during generation.
    const orchestrationPrompt = `Query: "${query}"
${match ? `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}` : 'No specific match context.'}

Available agents: coach, analyst, commentator, scout.
Break this query into sub-tasks and assign each to the most appropriate agent.
Only include agents relevant to the query. Maximum ${maxAgents} agents.`;

    let tasks: Array<{ agent: AgentRole; task: string }>;
    try {
      const plan = await generateStructured<{ tasks: Array<{ agent: AgentRole; task: string }> }>(
        orchestrationPrompt,
        AGENT_SYSTEM_PROMPTS.orchestrator,
        {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string', enum: ['coach', 'analyst', 'commentator', 'scout'] },
                  task: { type: 'string' },
                },
                required: ['agent', 'task'],
              },
            },
          },
          required: ['tasks'],
        },
        'agent_plan'
      );
      tasks = plan.tasks;
    } catch {
      // Model unavailable or malformed plan — sensible default coverage.
      tasks = [
        { agent: 'coach', task: query },
        { agent: 'analyst', task: query },
      ];
    }

    // Step 2: Execute tasks in parallel
    const agentResults: Partial<Record<AgentRole, string>> = {};

    const promises = tasks.slice(0, maxAgents).map(async (task) => {
      const agent = task.agent;
      const systemPrompt = AGENT_SYSTEM_PROMPTS[agent];

      let enhancedPrompt = task.task;

      // Add knowledge base context if enabled
      if (includeKnowledge) {
        try {
          const knowledge = await queryKnowledgeBase(task.task, 2);
          if (knowledge.length > 0) {
            const context = knowledge.map(k => k.relevantChunk).join('\n');
            enhancedPrompt = `Context: ${context}\n\nTask: ${task.task}`;
          }
        } catch {
          // Knowledge base not available, proceed without
        }
      }

      // Add match context if available
      if (match) {
        enhancedPrompt = `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}
Home stats: ${JSON.stringify(match.homeTeam.stats)}
Away stats: ${JSON.stringify(match.awayTeam.stats)}

${enhancedPrompt}`;
      }

      try {
        const result = await generateText(enhancedPrompt, systemPrompt);
        agentResults[agent] = result;

        this.messageHistory.push({
          from: agent,
          to: 'orchestrator',
          content: result,
          timestamp: Date.now(),
          type: 'response',
        });
      } catch (error) {
        agentResults[agent] = `Agent ${agent} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    });

    await Promise.all(promises);

    // Step 3: Synthesize results
    const synthesis = await this.synthesizeResults(query, agentResults, match);

    return {
      matchId: match?.id || 'general',
      tactical: agentResults.coach || '',
      statistical: agentResults.analyst || '',
      commentary: agentResults.commentator || '',
      scouting: agentResults.scout || '',
      synthesis,
      agents: Object.keys(agentResults) as AgentRole[],
      timestamp: Date.now(),
    };
  }

  /**
   * Synthesize results from multiple agents into a coherent answer.
   */
  private async synthesizeResults(
    query: string,
    results: Partial<Record<AgentRole, string>>,
    match?: MatchData
  ): Promise<string> {
    const availableResults = Object.entries(results)
      .filter(([_, value]) => value && value.length > 0)
      .map(([role, content]) => `[${role.toUpperCase()}]: ${content}`)
      .join('\n\n');

    const synthesisPrompt = `You are the GoalMind Orchestrator. Synthesize the following agent analyses into a coherent, concise answer.

Original query: "${query}"
${match ? `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}` : ''}

Agent analyses:
${availableResults}

Provide a unified summary that combines the best insights from each agent. Be concise and actionable. Maximum 3 paragraphs.`;

    return generateText(synthesisPrompt, AGENT_SYSTEM_PROMPTS.orchestrator);
  }

  /**
   * Generate live commentary using the commentator agent.
   */
  async generateLiveCommentary(
    event: string,
    match: MatchData,
    language: string = 'en'
  ): Promise<string> {
    const langInstruction = language === 'en' ? '' : `Respond in ${language}.`;

    const prompt = `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}
Event: ${event}

Generate exciting commentary for this moment. ${langInstruction}`;

    return generateText(prompt, AGENT_SYSTEM_PROMPTS.commentator);
  }

  /**
   * Generate a scouting report for a player or team.
   */
  async generateScoutingReport(
    subject: string,
    type: 'player' | 'team',
    context?: string
  ): Promise<string> {
    // Query knowledge base for background info
    const knowledge = await queryKnowledgeBase(subject, 2);
    const knowledgeContext = knowledge.map(k => k.relevantChunk).join('\n');

    const prompt = `Subject: ${subject} (${type})
${context ? `Context: ${context}` : ''}
${knowledgeContext ? `Background: ${knowledgeContext}` : ''}

Generate a comprehensive scouting report. Include strengths, weaknesses, key attributes, and tactical recommendations.`;

    return generateText(prompt, AGENT_SYSTEM_PROMPTS.scout);
  }

  /**
   * Get message history for debugging/display.
   */
  getMessageHistory(): AgentMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history.
   */
  clearHistory(): void {
    this.messageHistory = [];
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
