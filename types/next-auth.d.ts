import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        accessToken: string;
        sessionId: string;
        userType: string;
        user: DefaultSession["user"];
    }

    interface User {
        accessToken: string;
        sessionId: string;
        userType: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string;
        sessionId: string;
        userType: string;
    }
}