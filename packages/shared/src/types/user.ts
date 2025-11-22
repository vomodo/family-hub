export interface User {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
