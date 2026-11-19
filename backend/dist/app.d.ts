import { Application } from 'express';
export interface CreateAppOptions {
    /**
     * When true, runs in unified single-domain mode (Express API + Socket.IO + Next.js on ONE port).
     * Scopes rate limiting, body parsers, and 404 JSON fallback to API routes so Next.js handles UI pages.
     */
    unifiedFrontend?: boolean;
}
export declare const createApp: (options?: CreateAppOptions) => Application;
export default createApp;
