import { apiDelete } from './client';

export const deleteCurrentUser = async (): Promise<void> => {
    await apiDelete<void>('/api/users/me', { parseJson: false });
};
