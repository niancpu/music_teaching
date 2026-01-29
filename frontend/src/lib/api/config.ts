/**
 * API configuration
 */

// For server-side rendering (internal Docker network)
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:8000';

// For client-side (browser) - goes through nginx in production
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Use internal URL for server-side, public URL for client-side
const isServer = typeof window === 'undefined';
export const API_BASE_URL = isServer ? INTERNAL_API_URL : PUBLIC_API_URL;

export const API_V1_URL = `${API_BASE_URL}/api/v1`;
