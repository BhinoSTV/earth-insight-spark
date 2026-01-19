import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthTokens = {
  access: string;
  refresh: string;
};

type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
};

type LoginCredentials = {
  identifier: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextValue = {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
};

const STORAGE_KEY = "earth-insight-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseErrorMessage = (payload: unknown): string => {
  if (!payload) {
    return "Unable to complete the request. Please try again.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object") {
    if (
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
    ) {
      return (payload as { detail: string }).detail;
    }

    const messages: string[] = [];
    Object.values(payload as Record<string, unknown>).forEach((value) => {
      if (typeof value === "string") {
        messages.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string") {
            messages.push(item);
          } else if (item && typeof item === "object") {
            const nested = parseErrorMessage(item);
            if (nested) {
              messages.push(nested);
            }
          }
        });
      } else if (value && typeof value === "object") {
        const nested = parseErrorMessage(value);
        if (nested) {
          messages.push(nested);
        }
      }
    });

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Unable to complete the request. Please try again.";
};

const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((nextTokens: AuthTokens | null, nextUser: AuthUser | null) => {
    setTokens(nextTokens);
    setUser(nextUser);

    if (typeof window === "undefined") {
      return;
    }

    if (nextTokens) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tokens: nextTokens, user: nextUser })
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = JSON.parse(raw) as {
        tokens?: AuthTokens | null;
        user?: AuthUser | null;
      };
      if (stored.tokens) {
        setTokens(stored.tokens);
        setUser(stored.user ?? null);
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!tokens?.access || user) {
        return;
      }

      try {
        const response = await fetch("/api/auth/me/", {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            persistSession(null, null);
          }
          return;
        }

        const profile = (await safeJson(response)) as AuthUser | null;
        if (profile) {
          setUser(profile);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ tokens, user: profile })
            );
          }
        }
      } catch (error) {
        // Ignore network failures but keep the existing session so the user can retry manually.
      }
    };

    void loadUserProfile();
  }, [persistSession, tokens, user]);

  const login = useCallback(
    async ({ identifier, password }: LoginCredentials) => {
      const payload = identifier.includes("@")
        ? { email: identifier, password }
        : { username: identifier, password };

      try {
        const response = await fetch("/api/auth/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (await safeJson(response)) as
          | Record<string, unknown>
          | null;
        if (
          !response.ok ||
          !data ||
          typeof data.access !== "string" ||
          typeof data.refresh !== "string"
        ) {
          throw new Error(parseErrorMessage(data));
        }

        const nextTokens: AuthTokens = {
          access: data.access,
          refresh: data.refresh,
        };

        let nextUser: AuthUser | null = null;
        try {
          const profileResponse = await fetch("/api/auth/me/", {
            headers: {
              Authorization: `Bearer ${nextTokens.access}`,
              "Content-Type": "application/json",
            },
          });

          if (profileResponse.ok) {
            nextUser = (await safeJson(profileResponse)) as AuthUser | null;
          }
        } catch (error) {
          // Profile lookup failed; continue with tokens only.
        }

        persistSession(nextTokens, nextUser);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to sign in. Please try again.";
        throw new Error(message);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async ({
      username,
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
    }: RegisterPayload) => {
      try {
        const response = await fetch("/api/auth/register/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            password_confirm: passwordConfirm,
            first_name: firstName ?? "",
            last_name: lastName ?? "",
          }),
        });

        const data = (await safeJson(response)) as
          | Record<string, unknown>
          | null;
        if (!response.ok) {
          throw new Error(parseErrorMessage(data));
        }

        await login({ identifier: email || username, password });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to register. Please try again.";
        throw new Error(message);
      }
    },
    [login]
  );

  const logout = useCallback(async () => {
    if (tokens?.refresh) {
      try {
        await fetch("/api/auth/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens.access
              ? { Authorization: `Bearer ${tokens.access}` }
              : {}),
          },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
      } catch (error) {
        // Ignored: even if logout fails remotely we clear the local session.
      }
    }

    persistSession(null, null);
  }, [persistSession, tokens]);

  const refreshAccessToken = useCallback(async () => {
    if (!tokens?.refresh) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      const data = (await safeJson(response)) as Record<string, unknown> | null;

      if (!response.ok || !data || typeof data.access !== "string") {
        persistSession(null, null);
        return null;
      }

      const nextTokens: AuthTokens = {
        access: data.access,
        refresh: tokens.refresh,
      };

      persistSession(nextTokens, user ?? null);
      return data.access;
    } catch (error) {
      return null;
    }
  }, [persistSession, tokens?.refresh, user]);

  const value = useMemo(
    () => ({
      tokens,
      user,
      isAuthenticated: Boolean(tokens?.access),
      isLoading,
      login,
      register,
      logout,
      refreshAccessToken,
    }),
    [isLoading, login, logout, refreshAccessToken, register, tokens, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export type { LoginCredentials, RegisterPayload, AuthUser, AuthTokens };
export { AuthProvider, useAuth };
