import { getToken } from './utils.js';

class Client {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.apiType = config.apiType || 'custom';
    this.chat = {
      completions: {
        create: this.createChatCompletion.bind(this)
      }
    };
  }

  async createChatCompletion(params) {
    const token = await getToken();

    let url = `${this.baseURL}/v1/chat/completions`;
    const body = {
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens
    };

    if (this.apiType === 'ollama') {
      url = `${this.baseURL}/api/chat`;
      Object.assign(body, { stream: false, options: { num_predict: params.max_tokens } });
      delete body.max_tokens;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'API request failed' } }));
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    if (this.apiType === 'ollama') {
      return { choices: [{ message: data.message }] };
    }
    return data;
  }
}

export default Client;
