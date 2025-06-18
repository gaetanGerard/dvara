import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { UiButtonComponent } from '@/app/shared/ui/button/ui-button.component';
import { UiInputComponent } from '@/app/shared/ui/input/ui-input.component';
import { AuthResponseDto } from './auth.api';
import { AuthService } from './auth.service';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, NgIf, UiButtonComponent, UiInputComponent],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  user = signal<any | null>(null);
  authService = inject(AuthService);

  constructor() {
    this.user = this.authService.user;
    if (this.authService.isAuthenticated()) {
      // L'utilisateur est déjà connecté
      // ... tu peux ajouter une logique ici si besoin ...
    }
  }

  async ngOnInit() {
    // Au chargement, tente un refresh si l'utilisateur est authentifié mais que le token a expiré
    if (this.authService.isAuthenticated()) {
      const refreshed = await this.authService.refreshTokenIfNeeded();
      if (!refreshed) {
        this.authService.logout();
      }
    }
    // Si un token est présent, on tente de récupérer le profil utilisateur
    if (this.authService.getToken()) {
      this.authService.fetchUserProfile();
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.error.set(null);
    this.loading.set(true);
    try {
      const res = await fetch(`${environment.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email(),
          password: this.password(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        this.error.set(data.message || 'Erreur lors de la connexion.');
        this.loading.set(false);
        return;
      }
      const data: AuthResponseDto = await res.json();
      this.authService.login(data);
      // Ne pas set this.user ici, laisser le service gérer la réactivité
    } catch (e) {
      this.error.set('Erreur réseau ou serveur.');
    } finally {
      this.loading.set(false);
    }
  }

  get isLoggedIn() {
    return this.authService.isAuthenticated();
  }
  get currentUser() {
    return this.authService.user();
  }
}
