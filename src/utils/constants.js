/**
 * constants.js — Các hằng số toàn ứng dụng
 * Import: import { APP_NAME, ROUTES } from '@/utils/constants'
 */

/* ===========================
   App Info
   =========================== */
export const APP_NAME = 'MyApp';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'React + Vite starter template';

/* ===========================
   Routes
   =========================== */
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  NOT_FOUND: '*',
};

/* ===========================
   API
   =========================== */
export const API_TIMEOUT = 15_000; // ms
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com';

/* ===========================
   Local Storage Keys
   =========================== */
export const LS_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

/* ===========================
   Pagination defaults
   =========================== */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

/* ===========================
   Validation
   =========================== */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(0|\+84)[3-9]\d{8}$/,
  PASSWORD_MIN_LENGTH: 8,
};
