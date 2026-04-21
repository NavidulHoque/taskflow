import type { AppRouter } from './routers/app.router';

// AppRouterClient is the fully-typed router shape — useful for generating
// type-safe clients (e.g. @orpc/client) on the frontend side.
export type AppRouterClient = AppRouter;
