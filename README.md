# pkce-utils

A lightweight utility for implementing PKCE (Proof Key for Code Exchange) with Auth UI, designed for easy integration and secure OAuth flows.

[![npm version](https://img.shields.io/npm/v/@rmg-dev/pkce-utils.svg)](https://www.npmjs.com/package/@rmg-dev/pkce-utils)
[![license](https://img.shields.io/npm/l/@rmg-dev/pkce-utils.svg)](https://github.com/rmg-dev-br/pkce-utils/blob/main/LICENSE)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Importing the Library](#importing-the-library)
  - [Redirecting to the Identity Provider's Login Page](#redirecting-to-the-identity-providers-login-page)
  - [Handling the Callback and Exchanging the Authorization Code](#handling-the-callback-and-exchanging-the-authorization-code)
- [API Reference](#api-reference)
  - [`getChallenge`](#getchallenge)
  - [`redirectToLogin`](#redirecttologin)
  - [`exchangeCode`](#exchangecode)
  - [`handleCallback`](#handlecallback)
- [Types](#types)
  - [`Challenge`](#challenge)
  - [`RedirectToLogin`](#redirecttologin-1)
  - [`ExchangeCode`](#exchangecode-1)
  - [`handleCallback`](#handlecallback-1)
  - [`Auth`](#auth)
- [Error Handling](#error-handling)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Easy Integration**: Simplifies the implementation of OAuth 2.0 Authorization Code Flow with PKCE in web applications.
- **Secure**: Uses high-entropy cryptographic random strings and SHA-256 hashing to enhance security.
- **Lightweight**: Minimal dependencies for ease of use and performance.

## Installation

Install the package using npm:

```bash
npm install @rmg-dev/pkce-utils
```

Or with yarn:

```bash
yarn add @rmg-dev/pkce-utils
```

## Usage

### Importing the Library

```typescript
import {
  redirectToLogin,
  handleCallback,
  Auth,
} from '@rmg-dev/pkce-utils';
```

### Redirecting to the Identity Provider's Login Page

Use the `redirectToLogin` function to initiate the OAuth 2.0 authorization code flow by redirecting the user to the identity provider's login page.

```typescript
await redirectToLogin({
  idpUrl: 'https://your-idp.com',
  clientId: 'your-client-id',
  redirectUri: 'https://your-app.com/callback',
  path: '/authorize', // Optional, defaults to '/login'
  scope: 'openid profile email', // Optional, defaults to 'openid'
});
```

This function will automatically redirect the user to the identity provider's login page with the appropriate query parameters.

### Handling the Callback and Exchanging the Authorization Code

After the user authenticates, the identity provider will redirect back to your `redirectUri`. Use the `handleCallback` function to handle the callback and exchange the authorization code for tokens.

```typescript
import { handleCallback, Auth } from '@rmg-dev/pkce-utils';

(async () => {
  try {
    const authData: Auth = await handleCallback({
      idpUrl: 'https://your-idp.com',
      clientId: 'your-client-id',
      redirectUri: 'https://your-app.com/callback',
    });
    console.log(authData);
    // Use authData to access protected resources
  } catch (error) {
    console.error(error);
  }
})();
```

## API Reference

### `getChallenge`

Generates a PKCE code challenge and state parameter for the OAuth 2.0 authorization code flow.

```typescript
const challenge: Challenge = await getChallenge();
```

#### Returns

- `Promise<Challenge>`: An object containing `state`, `codeVerifier`, and `codeChallenge`.

### `redirectToLogin`

Initiates the OAuth 2.0 authorization code flow by redirecting the user to the identity provider's login page.

```typescript
await redirectToLogin(params: RedirectToLogin): Promise<void>
```

#### Parameters

- `idpUrl: string` - The base URL of the identity provider (IdP).
- `clientId: string` - The client identifier issued during registration.
- `redirectUri: string` - The URI to which the response will be sent after authorization.
- `path?: string` - Optional. The path to the authorization endpoint at the IdP. Defaults to `/login`.
- `scope?: string` - Optional. The scope of the access request. Defaults to `openid`.

### `exchangeCode`

Exchanges the authorization code for an access token by making a POST request to the identity provider's token endpoint.

```typescript
const authData: Auth = await exchangeCode(params: ExchangeCode): Promise<Auth>
```

#### Parameters

- `code: string` - The authorization code received from the authorization server.
- `codeVerifier: string` - The code verifier used in the PKCE flow.
- `idpUrl: string` - The base URL of the identity provider (IdP).
- `clientId: string` - The client identifier issued during registration.
- `redirectUri: string` - The URI to which the response was sent after authorization.

#### Returns

- `Promise<Auth>`: An object containing authentication data like access token.

#### Throws

- Will throw an error if the token exchange fails or the returned data does not conform to the expected schema.

### `handleCallback`

Handles the OAuth 2.0 callback by extracting the authorization code and state from the URL, retrieving the code verifier from session storage, and exchanging the code for tokens.

```typescript
const authData: Auth = await handleCallback(params: handleCallback): Promise<Auth>
```

#### Parameters

- `idpUrl: string` - The base URL of the identity provider (IdP).
- `clientId: string` - The client identifier issued during registration.
- `redirectUri: string` - The URI to which the response was sent after authorization.

#### Returns

- `Promise<Auth>`: An object containing authentication data like access token.

#### Throws

- Will throw an error if the state or code is missing from the URL, the code verifier is missing from session storage, or the token exchange fails.

## Types

### `Challenge`

Represents the PKCE challenge data required for the OAuth 2.0 authorization code flow with PKCE.

```typescript
type Challenge = {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
};
```

- `state`: A random string used to prevent CSRF attacks.
- `codeVerifier`: A high-entropy cryptographic random string used to generate the code challenge.
- `codeChallenge`: The code challenge derived from the code verifier.

### `RedirectToLogin`

Parameters required to construct the authorization request URL.

```typescript
type RedirectToLogin = {
  idpUrl: string;
  clientId: string;
  redirectUri: string;
  path?: string; // Defaults to '/login'
  scope?: string; // Defaults to 'openid'
};
```

- `idpUrl`: The base URL of the identity provider.
- `clientId`: The client identifier issued during registration.
- `redirectUri`: The URI to which the response will be sent after authorization.
- `path`: Optional. The path to the authorization endpoint. Defaults to `/login`.
- `scope`: Optional. The scope of the access request. Defaults to `openid`.

### `ExchangeCode`

Parameters required to exchange an authorization code for an access token.

```typescript
type ExchangeCode = {
  code: string;
  codeVerifier: string;
  idpUrl: string;
  clientId: string;
  redirectUri: string;
};
```

- `code`: The authorization code received from the authorization server.
- `codeVerifier`: The code verifier used in the PKCE flow.
- `idpUrl`: The base URL of the identity provider.
- `clientId`: The client identifier issued during registration.
- `redirectUri`: The URI to which the response was sent after authorization.

### `handleCallback`

Parameters required to handle the OAuth 2.0 callback.

```typescript
type handleCallback = {
  idpUrl: string;
  clientId: string;
  redirectUri: string;
};
```

- `idpUrl`: The base URL of the identity provider.
- `clientId`: The client identifier issued during registration.
- `redirectUri`: The URI to which the response was sent after authorization.

### `Auth`

Represents the authentication data received after exchanging the authorization code.

```typescript
type Auth = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  // Additional fields as per your authSchema
};
```

- `accessToken`: The access token issued by the authorization server.
- `idToken`: Optional. The ID token issued by the authorization server.
- `refreshToken`: Optional. The refresh token issued by the authorization server.
- `expiresIn`: Optional. The lifetime in seconds of the access token.
- `tokenType`: Optional. The type of the token issued.

## Error Handling

- **Missing State or Code**: If the `state` or `code` is missing from the callback URL, `handleCallback` will throw an error.
- **Missing Code Verifier**: If the code verifier is missing from session storage, an error is thrown.
- **Token Exchange Failure**: If the token exchange fails or the returned data does not conform to the expected schema, an error is thrown with detailed information.

## Dependencies

- **Zod**: Used for schema validation. Ensure you have it installed as it's listed under `peerDependencies`.

  ```bash
  npm install zod
  ```

- **TypeScript**: Type definitions and interfaces.
- **Fetch API**: Used for making HTTP requests. You may need a polyfill for environments where Fetch is not available.

## Contributing

Contributions are welcome! Please check the [repository](https://github.com/rmg-dev-br/pkce-utils) for issues or create a new one to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).
