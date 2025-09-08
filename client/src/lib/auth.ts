import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("authToken");
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function removeCurrentUser(): void {
  localStorage.removeItem("currentUser");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "admin";
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  const data: AuthResponse = await response.json();
  
  setAuthToken(data.token);
  setCurrentUser(data.user);
  
  return data;
}

export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/signup", { email, password, name });
  const data: AuthResponse = await response.json();
  
  setAuthToken(data.token);
  setCurrentUser(data.user);
  
  return data;
}

export function logout(): void {
  removeAuthToken();
  removeCurrentUser();
}

// Add token to fetch requests
export function createAuthenticatedRequest(url: string, options: RequestInit = {}): RequestInit {
  const token = getAuthToken();
  if (token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
  }
  return options;
}
