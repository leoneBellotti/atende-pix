import { apiClient } from './apiClient';
import type {
  Attendance,
  AttendanceOrigin,
  AttendanceStatus,
  CreateAttendanceInput
} from '../types/attendance';

export async function listAttendances(filters: {
  search?: string;
  origin?: AttendanceOrigin | '';
  status?: AttendanceStatus | '';
}) {
  const { data } = await apiClient.get<Attendance[]>('/attendances', {
    params: {
      search: filters.search || undefined,
      origin: filters.origin || undefined,
      status: filters.status || undefined
    }
  });

  return data;
}

export async function createAttendance(input: CreateAttendanceInput) {
  const { data } = await apiClient.post<Attendance>('/attendances', input);
  return data;
}

export async function updateAttendanceStatus(id: string, status: AttendanceStatus) {
  const { data } = await apiClient.patch<Attendance>(`/attendances/${id}`, { status });
  return data;
}
