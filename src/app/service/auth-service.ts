import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RegisterRequest } from '../interface/register-request';
import { LoginRequest } from '../interface/login-request';
import { LoginResponse } from '../interface/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://smart-safety-and-emergency-response.onrender.com/api/auth';

  constructor(private http: HttpClient) {
  }

  register(data: RegisterRequest): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );

  }

  login(data: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      data
    );

  }

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');

  }

  isLoggedIn(): boolean {

    return !!localStorage.getItem('token');

  }
}
