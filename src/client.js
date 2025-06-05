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

    const base = this.baseURL.replace(/\/+$/, '');
    let url = `${base}/v1/chat/completions`;
    const body = {
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens
    };

    if (this.apiType === 'ollama') {
      url = `${base}/api/chat`;
      Object.assign(body, { stream: false, options: { num_predict: params.max_tokens } });
      delete body.max_tokens;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token && this.apiType !== 'ollama') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let message = 'API request failed';
      try {
        const errData = await response.json();
        message = errData.error?.message || JSON.stringify(errData);
      } catch {
        message = await response.text();
      }

      if (this.apiType === 'ollama' && response.status === 403) {
        message = `Request failed with status 403. Ensure Ollama is running with --cors. Raw response: ${message}`;
      }
      throw new Error(message);
    }

    const data = await response.json();
    if (this.apiType === 'ollama') {
      return { choices: [{ message: data.message }] };
    }
    return data;
  }
}

export default Client;
