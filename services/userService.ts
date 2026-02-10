import { User } from '../types';

const API_Base = 'http://localhost:3001/api';

export const getUsers = async (): Promise<Record<string, User>> => {
  try {
    const response = await fetch(`${API_Base}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error(error);
    return {};
  }
};

export const getUser = async (id: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_Base}/users/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const loginUser = async (id: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_Base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const response = await fetch(`${API_Base}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};
