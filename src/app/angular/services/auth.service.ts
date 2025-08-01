import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private apiUrl = this.baseUrl + '/api/auth';
  constructor(private http: HttpClient) {}

  register(fullname: string, email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, { fullname, email, password })
      .pipe(catchError(this.handleError));
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(catchError(this.handleError));
  }

  googleLogin(tokenId: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/google-login`, { tokenId })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
