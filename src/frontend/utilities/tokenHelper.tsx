import { Buffer } from 'buffer';

export interface JwtPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp?: number | undefined;
  nbf?: number | undefined;
  iat?: number | undefined;
  jti?: string | undefined;
}

/**
 * Decode JSON Web Token.
 */
export const decodeJwt = (token: string): null | JwtPayload => {
  try {
    const base64Main = token.split('.')[1];
    const decodedMain = Buffer.from(base64Main, 'base64').toString();

    return JSON.parse(decodedMain);
  }
  catch (e) {
    return null;
  }
}
