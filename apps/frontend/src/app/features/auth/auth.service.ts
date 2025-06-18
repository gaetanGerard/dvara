import { Injectable, signal } from '@angular/core';
import { AuthResponseDto } from './auth.api';
import { environment } from '@/environments/environment';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh_token';
const LAST_ACTIVE_KEY = 'auth_last_active';
const EXPIRATION_DAYS = 7;

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<any | null>(null);
  isAuthenticated = signal(false);

  constructor() {
    this.restoreSession();
  }

  async fetchUserProfile() {
    const token = this.getToken();
    if (!token) {
      this.user.set(null);
      this.isAuthenticated.set(false);
      return;
    }
    try {
      const res = await fetch(`${environment.apiUrl}/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        this.user.set(null);
        this.isAuthenticated.set(false);
        return;
      }
      const user = await res.json();
      this.user.set(user);
      this.isAuthenticated.set(true);
    } catch (e) {
      this.user.set(null);
      this.isAuthenticated.set(false);
    }
  }

  login(data: AuthResponseDto) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    if (data.refresh_token)
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    this.isAuthenticated.set(true);
    this.fetchUserProfile();
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    this.user.set(null);
    this.isAuthenticated.set(false);
  }

  restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!token || !lastActive) {
      this.logout();
      return;
    }
    const now = Date.now();
    const last = parseInt(lastActive, 10);
    const diff = now - last;
    if (diff > EXPIRATION_DAYS * 24 * 60 * 60 * 1000) {
      this.logout();
      return;
    }
    this.isAuthenticated.set(true);
    // Met à jour la dernière activité
    localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    this.fetchUserProfile();
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    // Vérifie si l'access token est expiré (on ne peut pas le vérifier sans décoder le JWT, donc on tente l'appel API et on gère l'erreur 401)
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return false;
    }
    try {
      const res = await fetch(`${environment.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        this.logout();
        return false;
      }
      const data: AuthResponseDto = await res.json();
      this.login(data);
      return true;
    } catch (e) {
      this.logout();
      return false;
    }
  }

  async getValidToken(): Promise<string | null> {
    // Tente d'utiliser le token courant, sinon tente un refresh
    const token = this.getToken();
    if (!token) return null;
    // Optionnel: décoder le JWT pour vérifier l'expiration côté client (sinon, on laisse l'API répondre 401)
    // Pour l'instant, on retourne le token courant
    return token;
  }

  async logoutBackend() {
    const token = this.getToken();
    if (!token) {
      this.logout();
      return;
    }
    try {
      await fetch(`${environment.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // Ignorer les erreurs réseau pour le logout
    }
    this.logout();
  }
}
