import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'frontend';
  message: string = '';

  private http = inject(HttpClient);

  ngOnInit(): void {
    this.http
      .get<{ message: string }>('http://localhost:3000/users/1')
      .subscribe({
        next: (data) => {
          this.message = data.message;
          console.log('Utilisateurs récupérés :', data);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des utilisateurs', err);
        },
      });
  }
}
