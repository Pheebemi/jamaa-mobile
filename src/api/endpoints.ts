export const API = {
  LOGIN:            '/auth/login/',
  REFRESH:          '/auth/token/refresh/',
  LOGOUT:           '/auth/logout/',
  ME:               '/auth/me/',

  CASES:            '/cases/',
  CASE:             (id: string) => `/cases/${id}/`,
  CASE_NOTES:       (id: string) => `/cases/${id}/notes/`,
  CASE_HISTORY:     (id: string) => `/cases/${id}/history/`,

  SYNC_PUSH:        '/sync/push/',
  SYNC_PULL:        '/sync/pull/',
  SYNC_STATUS:      '/sync/status/',

  AI_ANALYZE:       '/ai/analyze/',
  AI_DIGEST:        '/ai/digest/',

  ALERTS:           '/alerts/',
  ALERT_BROADCAST:  '/alerts/broadcast/',

  ANALYTICS:        '/analytics/dashboard/',
} as const;
