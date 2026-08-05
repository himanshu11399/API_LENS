/* ============================================
   APILens — AI Provider Abstraction Service
   Abstracts OpenAI / NVIDIA API calls
   ============================================ */

import OpenAI from 'openai';

class AIProviderService {
  constructor() {
    this.client = null;
    this.providerName = 'nvidia';
    this.defaultModel = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash';
    this.initClient();
  }

  initClient() {
    if (process.env.NVIDIA_API_KEY) {
      this.providerName = 'nvidia';
      this.client = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
      });
      this.defaultModel = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash';
    } else if (process.env.OPENAI_API_KEY) {
      this.providerName = 'openai';
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    } else {
      this.client = null;
    }
  }

  /**
   * Execute chat completion
   * @param {Array} messages - [{ role: 'system'|'user'|'assistant', content: string }]
   * @param {Object} options - { temperature, maxTokens, stream, model }
   */
  async generateCompletion(messages, options = {}) {
    if (!this.client) {
      this.initClient();
    }

    if (!this.client) {
      throw new Error('AI Provider not configured. Please set NVIDIA_API_KEY or OPENAI_API_KEY in backend .env.');
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 4096;

    try {
      const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      // Add NVIDIA-specific reasoning parameter if using NVIDIA DeepSeek model
      if (this.providerName === 'nvidia' && model.includes('deepseek')) {
        payload.chat_template_kwargs = { thinking: true, reasoning_effort: 'high' };
      }

      const completion = await this.client.chat.completions.create(payload);

      const choice = completion.choices[0];
      const messageContent = choice?.message?.content || '';
      const reasoning = choice?.message?.reasoning || choice?.message?.reasoning_content || '';

      return {
        success: true,
        provider: this.providerName,
        model,
        content: messageContent,
        reasoning: reasoning || null,
        usage: completion.usage || null
      };
    } catch (err) {
      console.error(`AI Completion Error (${this.providerName}/${model}):`, err.message);

      // User-friendly error mapping
      if (err.status === 401) {
        throw new Error('AI API Key is invalid or expired. Please check NVIDIA_API_KEY in backend .env.');
      } else if (err.status === 429) {
        throw new Error('AI Provider rate limit reached. Please wait a moment before trying again.');
      } else if (err.status === 504 || err.code === 'ETIMEDOUT') {
        throw new Error('AI Provider request timed out. Please try again.');
      }

      throw new Error(err.message || 'AI request failed');
    }
  }
}

export const aiProvider = new AIProviderService();
