import { apiClient } from '@/lib/axios';
import type { ApiResponse, CalendarDay, RecurringMistake, UserProgress } from '@/types/api';

export const analyticsApi = {
  getProgress: () =>
    apiClient.get<ApiResponse<UserProgress>>('/api/v1/analytics/progress'),

  getCalendar: (days = 90) =>
    apiClient.get<ApiResponse<CalendarDay[]>>('/api/v1/analytics/calendar', { params: { days } }),

  getMistakes: () =>
    apiClient.get<ApiResponse<RecurringMistake[]>>('/api/v1/mistakes'),
};
