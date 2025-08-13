import { JwtPayload, decodeJwt } from "../tokenHelper";

describe("JwtPayload", () => {
  it("should have the correct properties", () => {
    const payload: JwtPayload = {
      iss: "issuer",
      sub: "subject",
      aud: ["audience1", "audience2"],
      exp: 1234567890,
      nbf: 123456789,
      iat: 12345678,
      jti: "jwtId",
      customProperty: "customValue",
    };

    expect(payload.iss).toBe("issuer");
    expect(payload.sub).toBe("subject");
    expect(payload.aud).toEqual(["audience1", "audience2"]);
    expect(payload.exp).toBe(1234567890);
    expect(payload.nbf).toBe(123456789);
    expect(payload.iat).toBe(12345678);
    expect(payload.jti).toBe("jwtId");
    expect(payload.customProperty).toBe("customValue");
  });
});

describe("decodeJwt", () => {
  it("should decode a valid JWT token", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    const decoded = decodeJwt(token);

    expect(decoded).toEqual({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
  });

  it("should return null for an invalid JWT token", () => {
    const token = "invalid.token";

    const decoded = decodeJwt(token);

    expect(decoded).toBeNull();
  });
});
