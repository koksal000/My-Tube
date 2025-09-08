import type { User } from './types';
import { getUsersAction } from '@/app/actions';

// This file handles client-side session management.
// All data fetching and mutation (reading/writing files) are now handled in `src/app/actions.ts`.

const CURRENT_USER_KEY = 'myTube-currentUser-id';

let currentLoggedInUser: User | null = null;

// This sets the user for the CURRENT session, both in memory and localStorage.
export function setCurrentUser(user: User | null): void {
    currentLoggedInUser = user;
    if (typeof window !== 'undefined') {
        try {
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, user.id);
            } else {
                localStorage.removeItem(CURRENT_USER_KEY);
            }
        } catch (error) {
            console.error("Could not set user session in localStorage", error);
        }
    }
}

// This retrieves the user for the current session, ensuring data is fresh from the central store.
export async function getCurrentUser(): Promise<User | null> {
    // Return from memory if already fetched in this session
    if (currentLoggedInUser) {
        // Quick refresh of data from the source to avoid stale data
        const users = await getUsersAction();
        const freshUser = users.find(u => u.id === currentLoggedInUser!.id);
        if (freshUser) {
            currentLoggedInUser = freshUser;
            return currentLoggedInUser;
        }
    }

    if (typeof window !== 'undefined') {
        try {
            const userId = localStorage.getItem(CURRENT_USER_KEY);
            if (userId) {
                const users = await getUsersAction();
                const userFromCentralStore = users.find(u => u.id === userId);
                if (userFromCentralStore) {
                    currentLoggedInUser = userFromCentralStore;
                    return currentLoggedInUser;
                }
            }
        } catch (error) {
            console.error("Could not read user session from localStorage", error);
        }
    }
    
    setCurrentUser(null);
    return null;
}

export function logout(): void {
    currentLoggedInUser = null;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(CURRENT_USER_KEY);
        } catch (error) {
            console.error("Could not clear user session from localStorage", error);
        }
    }
}
