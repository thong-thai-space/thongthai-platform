import { Language } from '@prisma/client';

const messages = {
  // Auth
  'auth.emailExists': {
    VI: 'Email đã được đăng ký',
    EN: 'Email already registered',
  },
  'auth.invalidCredentials': {
    VI: 'Thông tin đăng nhập không hợp lệ',
    EN: 'Invalid credentials',
  },
  'auth.unauthorized': {
    VI: 'Bạn không có quyền truy cập',
    EN: 'Unauthorized access',
  },

  // User
  'user.notFound': {
    VI: 'Không tìm thấy người dùng',
    EN: 'User not found',
  },

  // Project
  'project.notFound': {
    VI: 'Không tìm thấy dự án',
    EN: 'Project not found',
  },
  'project.forbidden': {
    VI: 'Bạn không có quyền truy cập dự án này',
    EN: 'You do not have access to this project',
  },

  // Task
  'task.notFound': {
    VI: 'Không tìm thấy công việc',
    EN: 'Task not found',
  },

  // Invoice
  'invoice.notFound': {
    VI: 'Không tìm thấy hóa đơn',
    EN: 'Invoice not found',
  },

  // Client
  'client.notFound': {
    VI: 'Không tìm thấy khách hàng',
    EN: 'Client not found',
  },

  // Notification
  'notification.notFound': {
    VI: 'Không tìm thấy thông báo',
    EN: 'Notification not found',
  },

  // File
  'file.notFound': {
    VI: 'Không tìm thấy tệp',
    EN: 'File not found',
  },

  // General
  'general.forbidden': {
    VI: 'Bạn không có quyền thực hiện hành động này',
    EN: 'You do not have permission to perform this action',
  },
  'general.serverError': {
    VI: 'Đã xảy ra lỗi hệ thống',
    EN: 'An internal server error occurred',
  },
} as const;

export type MessageKey = keyof typeof messages;

/**
 * Get translated message by key and locale.
 * Falls back to Vietnamese if key is not found.
 */
export function t(key: MessageKey, locale: Language = Language.VI): string {
  const msg = messages[key];
  return msg ? msg[locale] : key;
}

// Currency formatting
const currencyFormatters = {
  VND: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

export function formatCurrency(
  amount: number,
  currency: 'VND' | 'USD' = 'VND',
): string {
  return currencyFormatters[currency].format(amount);
}
