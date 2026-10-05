import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../service/auth-service';
import { LoginRequest } from '../../interface/login-request';
import { LoginResponse } from '../../interface/login-response';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {

  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {

    const data: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(data).subscribe({
      next: (response: LoginResponse) => {

        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId.toString());
        localStorage.setItem('name', response.name);
        localStorage.setItem('email', response.email);

        alert('Login successful!');

        this.router.navigate(['/dashboard']);
      },

      error: (error: any) => {
        console.log('Login failed', error);
        alert('Invalid email or password.');
      }
    });
  }
}
