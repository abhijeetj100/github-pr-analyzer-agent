const Anthropic = require('@anthropic-ai/sdk');

class ClaudeReviewService {
  constructor({ apiKey, model }) {
    this.model = model;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async analyzePullRequest(prContext) {
    if (!this.client) {
      return {
        summary: 'Mock review generated. Set ANTHROPIC_API_KEY for live Claude analysis.',
        architecturalConcerns: ['No live model configured in this environment.'],
        refactoringSuggestions: ['Add ANTHROPIC_API_KEY to enable production review output.'],
        riskLevel: 'unknown',
      };
    }

    const prompt = [
      'You are a senior staff backend engineer performing a pull request review.',
      'Return only valid JSON with this exact shape:',
      '{"summary":"string","architecturalConcerns":["string"],"refactoringSuggestions":["string"],"riskLevel":"low|medium|high"}',
      `Repository: ${prContext.repoFullName}`,
      `PR: #${prContext.prId} ${prContext.prTitle}`,
      `URL: ${prContext.prUrl}`,
      'Pull request body:',
      prContext.prBody || '(empty)',
      'Unified diff:',
      prContext.diff,
    ].join('\n\n');

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n');

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Claude returned invalid structured output.');
    }

    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  }
}

module.exports = { ClaudeReviewService };
