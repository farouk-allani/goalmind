// GoalMind — Multi-Agent Orchestration
// Multiple specialized AI agents that collaborate to provide insights.
// Uses QVAC for local inference with tool calling.

import { generateText, generateTextStream } from './models';
import { queryKnowledgeBase, ragQuery } from './rag';
import { predictMatch, type PredictionResult } from '@/lib/predictions/engine';
import type { MatchData, TeamData } from '@/lib/data/football';

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

// ---- Tool Definitions ----

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required: boolean }>;
  execute: (params: Record<string, any>) => Promise<string>;
}

const tools: Tool[] = [
  {
    name: 'query_knowledge',
    description: 'Query the football knowledge base for rules, history, tactics, player info, etc.',
    parameters: {
      query: { type: 'string', description: 'The search query', required: true },
    },
    execute: async (params) => {
      const results = await queryKnowledgeBase(params.query, 2);
      return results.map(r => `${r.document.title}: ${r.relevantChunk}`).join('\n\n');
    },
  },
  {
    name: 'predict_match',
    description: 'Generate a statistical prediction for a match outcome',
    parameters: {
      homeTeam: { type: 'string', description: 'Home team name', required: true },
      awayTeam: { type: 'string', description: 'Away team name', required: true },
    },
    execute: async (params) => {
      // This would use the prediction engine
      return `Prediction for ${params.homeTeam} vs ${params.awayTeam}: Use the prediction engine for detailed analysis.`;
    },
  },
  {
    name: 'get_team_stats',
    description: 'Get detailed statistics for a team',
    parameters: {
      team: { type: 'string', description: 'Team name or ID', required: true },
    },
    execute: async (params) => {
      // Would fetch from data service
      return `Statistics for ${params.team}: [Stats would be fetched from API or local data]`;
    },
  },
];

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

    // Step 1: Orchestrator analyzes the query and decides which agents to use
    const orchestrationPrompt = `${AGENT_SYSTEM_PROMPTS.orchestrator}

Query: "${query}"
${match ? `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}` : 'No specific match context.'}

Available agents: coach, analyst, commentator, scout
Available tools: query_knowledge, predict_match, get_team_stats

Break this query into sub-tasks and assign each to the most appropriate agent.
Respond with a JSON array of tasks:
[{"agent": "coach", "task": "description", "priority": 1}, ...]

Only include agents that are relevant to the query. Maximum ${maxAgents} agents.`;

    const orchestrationResult = await generateText(orchestrationPrompt, AGENT_SYSTEM_PROMPTS.orchestrator);

    // Parse tasks (simplified for hackathon)
    let tasks: Array<{ agent: AgentRole; task: string }> = [];
    try {
      // Try to extract JSON from response
      const jsonMatch = orchestrationResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: assign to coach and analyst
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
