import { 
  arrayBufferToBase64, 
  generateNonce, 
  sha256,
} from "./crypto.utils";
import { Auth, validateAuth } from "./validation";

/**
 * Represents the PKCE challenge data required for the OAuth 2.0 authorization code flow with Proof Key for Code Exchange (PKCE).
 */
export type Challenge = {
  /**
   * A random string used to maintain state between the request and callback to prevent CSRF attacks.
   */
  state: string,
  /**
   * A high-entropy cryptographic random string used to generate the code challenge.
   */
  codeVerifier: string,
  /**
   * The code challenge derived from the code verifier, sent to the authorization server.
   */
  codeChallenge: string
}

/**
 * Generates a PKCE code challenge and state parameter for the OAuth 2.0 authorization code flow.
 *
 * @returns {Promise<Challenge>} A promise that resolves to a `Challenge` object containing the state, code verifier, and code challenge.
 */
export const getChallenge = async (): Promise<Challenge> => {
  const [state, codeVerifier] = await Promise.all([
    generateNonce(),
    generateNonce(),
  ]);

  const codeChallenge = await sha256(codeVerifier);

  return {
    state,
    codeVerifier,
    codeChallenge: arrayBufferToBase64(codeChallenge),
  };
};

/**
 * Parameters required to construct the authorization request URL and redirect the user to the identity provider's login page.
 */
export type RedirectToLogin = {
  /**
   * The base URL of the identity provider (IdP).
   */
  idpUrl: string,
  /**
   * The client identifier issued to the client during the registration process.
   */
  clientId: string,
  /**
   * The URI to which the response will be sent after authorization.
   */
  redirectUri: string,
  /**
   * The path to the authorization endpoint at the identity provider. Defaults to '/login'.
   */
  path?: string,
  /**
   * The scope of the access request. Defaults to 'openid'.
   */
  scope?: string,
}

/**
 * Initiates the OAuth 2.0 authorization code flow by redirecting the user to the identity provider's login page with the appropriate query parameters.
 *
 * @param {RedirectToLogin} params - The parameters required to build the authorization request URL.
 * @param {string} params.idpUrl - The base URL of the identity provider (IdP).
 * @param {string} params.clientId - The client identifier issued to the client during the registration process.
 * @param {string} params.redirectUri - The URI to which the response will be sent after authorization.
 * @param {string} [params.path='/login'] - The path to the authorization endpoint at the identity provider.
 * @param {string} [params.scope='openid'] - The scope of the access request.
 *
 * @returns {Promise<void>} A promise that resolves when the redirect has been initiated.
 */
export const redirectToLogin = async ({
  idpUrl,
  clientId,
  redirectUri,
  path = '/login',
  scope = 'openid'
}: RedirectToLogin): Promise<void> => {
  const { 
    state, 
    codeVerifier, 
    codeChallenge 
  } = await getChallenge()

  sessionStorage.setItem(state, codeVerifier)

  const url = new URL(path, idpUrl)
  url.search = new URLSearchParams({
    response_type: 'code',
    scope,
    state,
    client_id: clientId,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: redirectUri,
  }).toString();

  window.location.href = url.toString();
}

export type RedirectToLogout = {
  idpUrl: string,
  path?: string,
  clientId: string,
  logoutUri: string,
}

export const redirectToLogout = ({
  idpUrl,
  path = '/logout',
  clientId,
  logoutUri,
}: RedirectToLogout) => {
  const logoutUrl = `${idpUrl}${path}?client_id=${clientId}&logout_uri=${logoutUri}`
  window.location.href = logoutUrl;
}

/**
 * Parameters required to exchange an authorization code for an access token.
 */
export type ExchangeCode = {
  /**
   * The authorization code received from the authorization server.
   */
  code: string,
  /**
   * The code verifier used in the PKCE flow to generate the code challenge.
   */
  codeVerifier: string,
  /**
   * The base URL of the identity provider (IdP).
   */
  idpUrl: string,
  /**
   * The client identifier issued to the client during the registration process.
   */
  clientId: string,
  /**
   * The URI to which the response was sent after authorization.
   */
  redirectUri: string
}

/**
 * Exchanges the authorization code for an access token by making a POST request to the identity provider's token endpoint.
 *
 * @param {ExchangeCode} params - The parameters required to perform the token exchange.
 * @param {string} params.code - The authorization code received from the authorization server.
 * @param {string} params.codeVerifier - The code verifier used in the PKCE flow.
 * @param {string} params.idpUrl - The base URL of the identity provider (IdP).
 * @param {string} params.clientId - The client identifier issued to the client during the registration process.
 * @param {string} params.redirectUri - The URI to which the response was sent after authorization.
 *
 * @returns {Promise<Auth>} A promise that resolves to an `Auth` object containing the access token and other authentication data.
 *
 * @throws Will throw an error if the token exchange fails or the returned data does not conform to the expected schema.
 */
export const exchangeCode = async ({
  code,
  codeVerifier,
  idpUrl,
  clientId,
  redirectUri
}: ExchangeCode): Promise<Auth> => {
  const res = await fetch(`${idpUrl}/oauth2/token`, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/x-www-form-urlencoded',
    }),
    body: Object.entries({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri
    }).map(([k, v]) => `${k}=${v}`).join('&'),
  });
  
  const rawData = await res.json();

  if (!res.ok) {
    throw new Error(`Error exchanging code: ${JSON.stringify(rawData)}`);
  }

  return validateAuth(rawData);
};

/**
 * Parameters required to handle the OAuth 2.0 callback and exchange the authorization code for tokens.
 */
export type handleCallback = {
  /**
   * The base URL of the identity provider (IdP).
   */
  idpUrl: string,
  /**
   * The client identifier issued to the client during the registration process.
   */
  clientId: string,
  /**
   * The URI to which the response was sent after authorization.
   */
  redirectUri: string
}

/**
 * Handles the OAuth 2.0 callback by extracting the authorization code and state from the URL, retrieving the code verifier from session storage, and exchanging the code for tokens.
 *
 * @param {handleCallback} params - The parameters required to handle the callback.
 * @param {string} params.idpUrl - The base URL of the identity provider (IdP).
 * @param {string} params.clientId - The client identifier issued to the client during the registration process.
 * @param {string} params.redirectUri - The URI to which the response was sent after authorization.
 *
 * @returns {Promise<Auth>} A promise that resolves to an `Auth` object containing the access token and other authentication data.
 *
 * @throws Will throw an error if the state or code is missing from the URL, the code verifier is missing from session storage, or the token exchange fails.
 */
export const handleCallback = async ({
  idpUrl,
  clientId,
  redirectUri
}: handleCallback): Promise<Auth> => {
  const queryString = new URLSearchParams(window.location.search);
  const code = queryString.get('code') as string;
  const state = queryString.get('state') as string;

  if (!state || !code) {
    throw new Error(`Missing state or code`)
  }

  const codeVerifier = sessionStorage.getItem(state);
  sessionStorage.removeItem(state)

  if (!codeVerifier) {
    throw new Error('Missing state');
  }

  return exchangeCode({
    code,
    codeVerifier,
    clientId,
    idpUrl,
    redirectUri
  })
}