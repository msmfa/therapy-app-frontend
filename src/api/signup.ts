type ApiUser = { id: string; email: string; name: string };

export type RegisterSuccess = { token: string; user: ApiUser };

export type RegisterError = { error: string };
