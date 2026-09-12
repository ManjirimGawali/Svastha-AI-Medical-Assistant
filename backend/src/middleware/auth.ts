import { Request, Response, NextFunction } from "express";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || "";
const jwksUrl = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

if (!projectId) {
  console.warn("WARNING: FIREBASE_PROJECT_ID is missing in the .env file. Firebase token verification will fail.");
}

const client = jwksClient({
  jwksUri: jwksUrl,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10 minutes
});

// Extend Express Request type to include user details
export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Function to fetch the signing key for a specific JWT header kid
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error("JWT kid header is missing"));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      return callback(err || new Error("Signing key not found"));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Authentication Middleware
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("Auth warning: No authorization header found. Bypassing with anonymous session.");
    req.user = { sub: "anonymous-user" };
    return next();
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`
    },
    (err, decoded) => {
      if (err) {
        console.warn("Firebase JWT verification failed:", err.message, "- Bypassing with anonymous session for development.");
        req.user = { sub: "anonymous-user" };
        return next();
      }
      req.user = decoded;
      next();
    }
  );
};

