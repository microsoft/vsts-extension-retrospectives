export interface JwtPayload {
  [key: string]: string | number | string[] | undefined;
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp?: number | undefined;
  nbf?: number | undefined;
  iat?: number | undefined;
  jti?: string | undefined;
}

/**
 * Decode JSON Web Token using native browser APIs.
 */
export const decodeJwt = (token: string): null | JwtPayload => {
  try {
    const base64Main = token.split(".")[1];
    const base64 = base64Main.replace(/-/g, "+").replace(/_/g, "/");
    const decodedMain = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(decodedMain);
  } catch (e) {
    return null;
  }
};
