import React, { createContext, useContext, useState, useEffect } from "react";
import { User, setAuthTokenGetter, useGetMe, useLogout } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("jee_token"));
  const [user, setUser] = useState<User | null>(null);
  
  // Update the token getter whenever the token changes
  useEffect(() => {
    setAuthTokenGetter(() => token);
    if (token) {
      localStorage.setItem("jee_token", token);
    } else {
      localStorage.removeItem("jee_token");
    }
  }, [token]);

  const { data: me, isLoading: isLoadingMe } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    if (me) {
      setUser(me);
    }
  }, [me]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setToken(null);
        setUser(null);
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading: isLoadingMe,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
