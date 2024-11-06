export type Auth = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  token_type: 'Bearer';
};

export function validateAuth(input: any): Auth {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Input must be a non-null object');
  }

  if (typeof input.access_token !== 'string') {
    throw new Error('access_token must be a string');
  }

  if (typeof input.expires_in !== 'number') {
    throw new Error('expires_in must be a number');
  }

  if (typeof input.id_token !== 'string') {
    throw new Error('id_token must be a string');
  }

  if (typeof input.refresh_token !== 'string') {
    throw new Error('refresh_token must be a string');
  }

  if (input.token_type !== 'Bearer') {
    throw new Error("token_type must be 'Bearer'");
  }

  return input as Auth;
}
