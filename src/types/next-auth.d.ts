import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: number;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: number;
  }
}
