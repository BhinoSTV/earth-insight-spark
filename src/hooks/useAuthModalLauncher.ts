import { useCallback } from "react";
import type { MouseEvent } from "react";

import { useAuth } from "@/providers/auth";
import { useAuthDialog } from "@/providers/auth-dialog";

type AuthMode = "login" | "register";

interface AuthLaunchOptions {
  mode?: AuthMode;
  onAuthenticated?: () => void;
}

const useAuthModalLauncher = () => {
  const { isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthDialog();

  const launch = useCallback(
    ({ mode = "login", onAuthenticated }: AuthLaunchOptions = {}) => {
      if (isAuthenticated) {
        onAuthenticated?.();
        return;
      }

      if (mode === "register") {
        openRegister();
      } else {
        openLogin();
      }
    },
    [isAuthenticated, openLogin, openRegister]
  );

  const intercept = useCallback(
    <Element extends HTMLElement>(options?: AuthLaunchOptions) =>
      (event: MouseEvent<Element>) => {
        if (!isAuthenticated) {
          event.preventDefault();
          event.stopPropagation();
        }

        launch(options);
      },
    [isAuthenticated, launch]
  );

  return { isAuthenticated, launch, intercept };
};

export default useAuthModalLauncher;
