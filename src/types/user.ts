
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Will store Base64 Data URL
  // Password should not be part of the User object returned to the frontend
  // It's only used during signup/login checks against stored data.
}

export interface StoredUser extends User {
  passwordHash: string; // In a real app, this would be a securely hashed password
}
