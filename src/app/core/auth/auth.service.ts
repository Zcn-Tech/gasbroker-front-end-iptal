import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { FuseConfigService } from '@fuse/services/config';
import { Router } from '@angular/router';
import { Scheme } from '../config/app.config';
import { Theme } from '@fullcalendar/core';

@Injectable()
export class AuthService
{
    private _authenticated: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private _fuseConfigService: FuseConfigService,
        private _router: Router,

    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }
    get CompanyId(): string
    {
        let tmp =JSON.parse(localStorage.getItem('user'));
        return tmp.company_id;
    }
    get user_id(): string
    { 
        let tmp = JSON.parse(localStorage.getItem('user'));
        return tmp.user_id;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post(`${environment.url}/api/auth/recover`, {email:email});
    }

    /**
     * Reset password
     *
     * @param token
     */
    resetPassword(token: string, password:any): Observable<any>
    {
        return this._httpClient.post(`${environment.url}/api/auth/change-password/${token}`, {token:token,password:password});
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any>
    {
        // Throw error, if the user is already logged in
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }
    //return this._httpClient.post(`api/auth/sign-in`, credentials).pipe(
    return this._httpClient.post(`${environment.url}/api/auth/signin`, credentials).pipe(
            switchMap((response: any) => {
                this.accessToken = response.access_token;
                this._authenticated = true;
                this._userService.user = response.user.data;
                localStorage.setItem('user', JSON.stringify(response.user.data));
                this.setLayout(response.user.data.settings?.layout);
                this.setScheme(response.user.data.settings?.scheme);
                this.setTheme(response.user.data.settings?.theme);
                return of(response.user.data); 
            })
        );
    }

    validateResetToken(token: string) {
        return this._httpClient.post(`${environment.url}/api/auth/reset/${token}`,  {token:token} );
    }

    setLayout(layout: string): void
    {
        // Clear the 'layout' query param to allow layout changes
        this._router.navigate([], {
            queryParams        : {
                layout: null
            },
            queryParamsHandling: 'merge'
        }).then(() => {

            // Set the config
            this._fuseConfigService.config = {layout};
        });
    }

    setScheme(scheme: Scheme): void
    {
        this._fuseConfigService.config = {scheme};
    }

    setTheme(theme: Theme): void
    {
        this._fuseConfigService.config = {theme};
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Renew token
        return this._httpClient.post('api/auth/refresh-access-token', {
            accessToken: this.accessToken
        }).pipe(
            catchError(() =>

                // Return false
                of(false)
            ),
            switchMap((response: any) => {

                // Store the access token in the local storage
                this.accessToken = response.accessToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return true
                return of(true);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;
        localStorage.clear();
        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        // Check if the user is logged in
        if ( this._authenticated )
        {
            return of(true);
        }

        // Check the access token availability
        if ( !this.accessToken )
        {
            return of(false);
        }

        // Check the access token expire date
        if ( AuthUtils.isTokenExpired(this.accessToken) )
        {
            return of(false);
        }

        // If the access token exists and it didn't expire, sign in using it
        return this.signInUsingToken();
    }

    getToken(): Observable<any>
    {
        return this._httpClient.get(`${environment.url}/api/auth/access-token`)
    }
}
