import { Injectable, Logger } from '@nestjs/common';

export type LlmToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type LlmChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: LlmToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export type LlmStreamResult = {
  content: string;
  toolCalls: LlmToolCall[];
  tokensIn: number;
  tokensOut: number;
};

type ToolCallAccumulator = { id: string; name: string; arguments: string };

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey = process.env.CHATBOT_LLM_API_KEY || '';
  private readonly baseUrl = process.env.CHATBOT_LLM_BASE_URL || 'https://api.deepseek.com';
  private readonly model = process.env.CHATBOT_LLM_MODEL || 'deepseek-v4-flash';

  isConfigured(): boolean {
    return this.apiKey.length >= 20;
  }

  computeCostUsd(tokensIn: number, tokensOut: number): number {
    return (tokensIn / 1_000_000) * 0.14 + (tokensOut / 1_000_000) * 0.28;
  }

  async streamCompletion(options: {
    messages: LlmChatMessage[];
    tools?: any[];
    onToken: (token: string) => void;
    signal: AbortSignal;
  }): Promise<LlmStreamResult> {
    if (!this.apiKey) throw new Error('CHATBOT_LLM_API_KEY missing');

    const hasTools = Array.isArray(options.tools) && options.tools.length > 0;
    const body: Record<string, unknown> = {
      model: this.model,
      messages: options.messages,
      max_tokens: hasTools ? 400 : 120,
      temperature: 0.3,
      stream: true,
      stream_options: { include_usage: true },
      thinking: { type: 'disabled' },
    };
    if (hasTools) {
      body.tools = options.tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      this.logger.error(`LLM HTTP error: ${response.status}`);
      throw new Error('LLM HTTP error');
    }
    if (!response.body) throw new Error('LLM empty body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let promptTokens = 0;
    let completionTokens = 0;
    const toolAcc = new Map<number, ToolCallAccumulator>();
    const pendingTokens: string[] = [];

    const parseChunk = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) return null;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return null;
      try { return JSON.parse(payload); } catch { return null; }
    };

    const handleChunk = (chunk: any) => {
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
        completionTokens = chunk.usage.completion_tokens ?? completionTokens;
      }
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) return;
      if (delta.tool_calls?.length > 0) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const cur = toolAcc.get(idx) ?? { id: '', name: '', arguments: '' };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name += tc.function.name;
          if (tc.function?.arguments) cur.arguments += tc.function.arguments;
          toolAcc.set(idx, cur);
        }
      }
      if (typeof delta.content === 'string' && delta.content.length > 0) {
        content += delta.content;
        pendingTokens.push(delta.content);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const chunk = parseChunk(line);
        if (chunk) handleChunk(chunk);
      }
    }
    if (buffer.trim()) {
      const chunk = parseChunk(buffer);
      if (chunk) handleChunk(chunk);
    }

    const toolCalls: LlmToolCall[] = [...toolAcc.entries()]
      .sort(([a], [b]) => a - b)
      .map(([i, v]) => ({
        id: v.id || `call_${i}`,
        type: 'function' as const,
        function: { name: v.name, arguments: v.arguments },
      }))
      .filter(tc => tc.function.name.length > 0);

    if (toolCalls.length === 0) {
      for (const token of pendingTokens) options.onToken(token);
    }

    if (!promptTokens) promptTokens = Math.ceil(JSON.stringify(options.messages).length / 4);
    if (!completionTokens) completionTokens = Math.ceil(content.length / 4);

    return { content, toolCalls, tokensIn: promptTokens, tokensOut: completionTokens };
  }
}
