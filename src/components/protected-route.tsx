"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: number;
  fallbackUrl?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requiredRole,
  fallbackUrl = "/auth/login"
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (requireAuth && !session) {
      router.push(fallbackUrl);
      return;
    }

    if (requiredRole !== undefined && session?.user?.role !== requiredRole) {
      router.push("/"); // Redirect to home if role doesn't match
      return;
    }
  }, [session, status, router, requireAuth, requiredRole, fallbackUrl]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (requiredRole !== undefined && session?.user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Insufficient permissions.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
