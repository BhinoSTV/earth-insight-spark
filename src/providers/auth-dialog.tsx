import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import { useAuth } from "@/providers/auth";

interface AuthDialogContextValue {
  openLogin: (redirectTo?: string) => void;
  openRegister: (redirectTo?: string) => void;
  close: () => void;
}

type DialogMode = "login" | "register" | null;

interface DialogState {
  open: boolean;
  mode: DialogMode;
  redirectTo?: string;
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(
  undefined
);

const AuthDialogProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<DialogState>({ open: false, mode: null });

  const currentPath = useMemo(() => {
    const destination = `${location.pathname}${location.search}${location.hash}`;
    return destination || "/";
  }, [location.hash, location.pathname, location.search]);

  const close = useCallback(() => {
    setState((previous) => {
      if (!previous.open && !previous.mode) {
        return previous;
      }

      return {
        open: false,
        mode: null,
        redirectTo: previous.redirectTo,
      };
    });
  }, []);

  const openLogin = useCallback(
    (redirectTo?: string) => {
      setState({
        open: true,
        mode: "login",
        redirectTo: redirectTo ?? currentPath,
      });
    },
    [currentPath]
  );

  const openRegister = useCallback(
    (redirectTo?: string) => {
      setState({
        open: true,
        mode: "register",
        redirectTo: redirectTo ?? currentPath,
      });
    },
    [currentPath]
  );

  const handleSuccess = useCallback(() => {
    let redirectTarget: string | undefined;
    setState((previous) => {
      redirectTarget = previous.redirectTo;
      return { open: false, mode: null, redirectTo: undefined };
    });

    if (redirectTarget) {
      navigate(redirectTarget, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let redirectTarget: string | undefined;
    setState((previous) => {
      if (!previous.open && !previous.redirectTo) {
        return previous;
      }
      redirectTarget = previous.redirectTo;
      return { open: false, mode: null, redirectTo: undefined };
    });

    if (redirectTarget) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const value = useMemo(
    () => ({
      openLogin,
      openRegister,
      close,
    }),
    [close, openLogin, openRegister]
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <LoginModal
        open={state.open && state.mode === "login"}
        onOpenChange={(open) => {
          if (!open) {
            close();
          } else {
            openLogin(state.redirectTo);
          }
        }}
        onSwitchToRegister={() => openRegister(state.redirectTo)}
        onSuccess={handleSuccess}
      />
      <RegisterModal
        open={state.open && state.mode === "register"}
        onOpenChange={(open) => {
          if (!open) {
            close();
          } else {
            openRegister(state.redirectTo);
          }
        }}
        onSwitchToLogin={() => openLogin(state.redirectTo)}
        onSuccess={handleSuccess}
      />
    </AuthDialogContext.Provider>
  );
};

const useAuthDialog = () => {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }
  return context;
};

export { AuthDialogProvider, useAuthDialog };
