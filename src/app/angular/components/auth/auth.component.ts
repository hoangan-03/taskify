import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { environment } from '../../../../environments/environment';
declare const google: any;
export function fullNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    const isValid = /^[a-zA-Z]+ [a-zA-Z]+$/.test(value);
    return isValid ? null : { fullNameInvalid: true };
  };
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginView: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      fullname: ['', [Validators.required, fullNameValidator()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  toggleView() {
    this.isLoginView = !this.isLoginView;
  }

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  onLoginSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe(
        (response: any) => {
          console.log('Login successful', response);
          localStorage.setItem('user', JSON.stringify(response));
          this.router.navigate(['/angular/todo']);
          alert('Login successful');
        },
        (error) => {
          console.error('Login failed', error);
        }
      );
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      const { fullname, email, password } = this.registerForm.value;
      console.log('register', this.registerForm.value);
      this.authService.register(fullname, email, password).subscribe(
        (response: any) => {
          this.toggleView();
          alert('Registration successful');
        },
        (error) => {
          console.error('Registration failed', error);
        }
      );
    }
  }
  onGoogleLogin() {
    console.log('Prompting Google Sign-In');
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.error(
          'Google Sign-In was not displayed or was skipped',
          notification
        );
      }
    });
  }

  private initializeGoogleSignIn(): void {
    console.log('Initializing Google Sign-In');
    google.accounts.id.initialize({
      client_id: environment.clientId,
      callback: this.handleCredentialResponse.bind(this),
    });
  }

  private handleCredentialResponse(response: any): void {
    console.log('Credential response received', response);
    if (response.credential) {
      const tokenId = response.credential;
      this.authService.googleLogin(tokenId).subscribe(
        (response: any) => {
          console.log('Google login successful', response);
          localStorage.setItem('user', JSON.stringify(response));
          this.router.navigate(['/angular/todo']);
        },
        (error) => {
          console.error('Google login failed', error);
        }
      );
    } else {
      console.error('No credential received', response);
    }
  }
}
