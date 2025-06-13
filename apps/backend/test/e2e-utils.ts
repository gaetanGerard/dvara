/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as http from 'node:http';
import * as https from 'node:https';
import axios, { AxiosInstance } from 'axios';

export interface TestUser {
  email: string;
  password: string;
  token?: string;
}

export class E2EContext {
  users: Record<string, TestUser> = {};
  tokens: Record<string, string> = {};
  http: AxiosInstance;

  constructor(baseURL: string) {
    this.http = axios.create({
      baseURL,
      httpAgent: new http.Agent({ keepAlive: false }),
      httpsAgent: new https.Agent({ keepAlive: false }),
    });
  }

  async loginUser(key: string, email: string, password: string) {
    const res = await this.http.post('/auth/login', { email, password });
    this.tokens[key] = res.data.access_token;
    this.users[key] = { email, password, token: res.data.access_token };
    return res.data;
  }

  getAuthHeaders(key: string) {
    return { Authorization: `Bearer ${this.tokens[key]}` };
  }

  toJSON() {
    // Empêche la sérialisation de l'instance (et donc de l'agent)
    return {};
  }
}
