import "next-auth";
import "next-auth/jwt";

interface BackendUser {
  userId: string;
  email: string;
  displayName: string;
  role: "BUYER" | "FARMER" | "ADMIN" | "DRIVER";
}

declare module "next-auth" {
  interface User {
    accessToken?: string;
    backendUser?: BackendUser;
  }

  interface Session {
    accessToken?: string;
    user?: BackendUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    backendUser?: BackendUser;
  }
}
