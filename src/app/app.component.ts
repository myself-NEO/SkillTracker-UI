import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService, private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    // The backend sleeps when idle (Render free tier) and takes a while to boot. Wake it up as soon
    // as anyone opens the app, on any page, so it is ready by the time they log in. The answer
    // itself doesn't matter.
    this.http.get('/api/health').subscribe({ error: () => {} });

    await this.authService.ensureSession();
  }
}
