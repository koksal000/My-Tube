// This file is now primarily for type definitions and initial seeding logic,
// which is handled inside db.ts. The mock data exports are removed to
// ensure the app relies solely on the IndexedDB database.

import type { User, Video, Post } from './types';

// The functions to get data (e.g., mockUsers, mockVideos) are removed.
// All data fetching should now go through the functions in `src/lib/db.ts`.

// For example, instead of `mockUsers`, you would use `await getAllUsers()`.
// Instead of `mockVideos`, you would use `await getAllVideos()`.

// This ensures a single source of truth for the application's data.
