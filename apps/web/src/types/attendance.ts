import type { Customer } from './customer';

export type AttendanceOrigin = 'WHATSAPP' | 'INSTAGRAM' | 'PHONE' | 'IN_PERSON' | 'OTHER';

export type AttendanceStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'WAITING_PAYMENT'
  | 'DONE'
  | 'CANCELED';

export type Attendance = {
  id: string;
  customerId: string;
  origin: AttendanceOrigin;
  status: AttendanceStatus;
  summary?: string | null;
  internalNotes?: string | null;
  responsibleName?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
};

export type CreateAttendanceInput = {
  customerId: string;
  origin: AttendanceOrigin;
  summary?: string;
  internalNotes?: string;
  responsibleName?: string;
};
