import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/providers/auth";
import { useAuthDialog } from "@/providers/auth-dialog";

type ProtectedRouteProps = {
  children: ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLogin } = useAuthDialog();
  const hasPrompted = useRef(false);

  const destination = useMemo(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    return path || "/";
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      hasPrompted.current = false;
      return;
    }

    if (!hasPrompted.current) {
      openLogin(destination);
      hasPrompted.current = true;
    }
  }, [destination, isAuthenticated, isLoading, openLogin]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
