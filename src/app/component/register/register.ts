import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../service/auth-service';
import { RegisterRequest } from '../../interface/register-request';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {

  name = '';
  email = '';
  password = '';
  phone = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {

    const data: RegisterRequest = {
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    this.authService.register(data).subscribe({
      next: (response: any) => {
        console.log('Registration successful', response);
        alert('Registration successful!');
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.log('Registration failed', error);
        alert('Registration failed. Please try again.');
      }
    });
  }
}
