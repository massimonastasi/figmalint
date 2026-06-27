/**
 * GitHub Models Provider Implementation
 *
 * GitHub Models exposes an OpenAI-compatible inference API, authenticated with a
 * GitHub fine-grained PAT (Models permission). This is GitHub's officially
 * supported endpoint — distinct from a Copilot subscription, with its own
 * (rate-limited) quota.
 *
 * Request/response shape mirrors OpenAI Chat Completions.
 */

import {
  LLMProvider,
  LLMModel,
  RequestConfig,
  LLMResponse,
  ApiKeyValidationResult,
  RequestHeaders,
  LLMError,
  LLMErrorCode,
  GITHUB_MODELS,
} from './types';

/** GitHub Models response (OpenAI Chat Completions shape) */
interface GitHubModelsResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GitHubModelsErrorResponse {
  error?: { message?: string; code?: string };
  message?: string;
}

class GitHubProvider implements LLMProvider {
  readonly name = 'GitHub Models';
  readonly id = 'github';
  readonly endpoint = 'https://models.github.ai/inference/chat/completions';
  readonly keyPrefix = 'github_pat_';
  readonly keyPlaceholder = 'github_pat_... or ghp_...';
  readonly models: LLMModel[] = GITHUB_MODELS;

  formatRequest(config: RequestConfig): Record<string, unknown> {
    const request: Record<string, unknown> = {
      model: config.model,
      messages: [{ role: 'user', content: config.prompt }],
      max_tokens: config.maxTokens,
    };

    // `config.temperature` is intentionally dropped, matching the other providers:
    // some catalog models reject non-default temperature. Determinism is enforced
    // upstream via deterministic prompts and JSON extraction.

    if (config.additionalParams) {
      Object.assign(request, config.additionalParams);
    }

    return request;
  }

  parseResponse(response: unknown): LLMResponse {
    const data = response as GitHubModelsResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new LLMError(
        'Invalid response format from GitHub Models: no choices returned',
        LLMErrorCode.INVALID_REQUEST
      );
    }

    const choice = data.choices[0];
    if (!choice.message || typeof choice.message.content !== 'string') {
      throw new LLMError(
        'Invalid response format from GitHub Models: missing message content',
        LLMErrorCode.INVALID_REQUEST
      );
    }

    const result: LLMResponse = {
      content: choice.message.content.trim(),
      model: data.model || 'github-models',
    };

    if (data.usage) {
      result.usage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      };
    }

    return result;
  }

  validateApiKey(apiKey: string): ApiKeyValidationResult {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API Key Required: Please provide a GitHub personal access token.' };
    }

    const trimmedKey = apiKey.trim();

    if (trimmedKey.length === 0) {
      return { isValid: false, error: 'API Key Required: The GitHub token cannot be empty.' };
    }

    if (!trimmedKey.startsWith('github_pat_') && !trimmedKey.startsWith('ghp_')) {
      return {
        isValid: false,
        error: 'Invalid Token Format: GitHub tokens should start with "github_pat_" (fine-grained) or "ghp_" (classic).',
      };
    }

    if (trimmedKey.length < 20) {
      return {
        isValid: false,
        error: 'Invalid Token Format: The token appears to be too short. Please verify you copied the complete token.',
      };
    }

    return { isValid: true };
  }

  getHeaders(apiKey: string): RequestHeaders {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    };
  }

  getDefaultModel(): LLMModel {
    return this.models.find((m) => m.isDefault) || this.models[0];
  }

  handleError(statusCode: number, response: unknown): LLMError {
    const err = response as GitHubModelsErrorResponse | null;
    const message =
      err?.error?.message || err?.message ||
      (typeof response === 'string' ? response : 'Unknown error');

    switch (statusCode) {
      case 400:
        return new LLMError(`GitHub Models Error (400): ${message}.`, LLMErrorCode.INVALID_REQUEST, 400);
      case 401:
        return new LLMError(
          'GitHub Models Error (401): Invalid token. Check that your GitHub PAT has the "Models" permission.',
          LLMErrorCode.INVALID_API_KEY,
          401
        );
      case 403:
        return new LLMError(
          'GitHub Models Error (403): Access forbidden. Your token may lack the Models permission or your org may restrict it.',
          LLMErrorCode.INVALID_API_KEY,
          403
        );
      case 404:
        return new LLMError(`GitHub Models Error (404): Model not found. ${message}`, LLMErrorCode.MODEL_NOT_FOUND, 404);
      case 429:
        return new LLMError(
          'GitHub Models Error (429): Rate limit exceeded (GitHub Models has a limited free quota). Please try again later.',
          LLMErrorCode.RATE_LIMIT_EXCEEDED,
          429
        );
      case 500:
        return new LLMError('GitHub Models Error (500): Server error. Please try again later.', LLMErrorCode.SERVER_ERROR, 500);
      case 503:
        return new LLMError('GitHub Models Error (503): Service unavailable. Please try again later.', LLMErrorCode.SERVICE_UNAVAILABLE, 503);
      default:
        return new LLMError(`GitHub Models Error (${statusCode}): ${message}`, LLMErrorCode.UNKNOWN_ERROR, statusCode);
    }
  }
}

export const githubProvider: LLMProvider = new GitHubProvider();
export { GitHubProvider };
export default githubProvider;
