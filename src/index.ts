import { 
  arrayBufferToBase64, 
  generateNonce, 
  sha256,
} from "./crypto.utils";

import {
  Auth,
  authSchema,
} from "./schemas";

import { flattenIssues } from "./zod.utils";

export type Challenge = {
  state: string,
  codeVerifier: string,
  codeChallenge: string
}

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

export type RedirectToLogin = {
  idpUrl: string,
  clientId: string,
  redirectUri: string,
  path?: string,
  scope?: string,
}

export const redirectToLogin = async ({
  idpUrl,
  clientId,
  redirectUri,
  path = '/login',
  scope = 'openid'
}: RedirectToLogin) => {
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

export type ExchangeCode = {
  code: string,
  codeVerifier: string,
  idpUrl: string,
  clientId: string,
  redirectUri: string
}

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

  const parsing = authSchema.safeParse(rawData);
  if (parsing.error) {
    const issues = flattenIssues(parsing.error.issues)
    throw new Error(`Returned auth data does not conform to schema: ${issues}`)
  }

  return parsing.data
};

export type handleCallback = {
  idpUrl: string,
  clientId: string,
  redirectUri: string
}

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
