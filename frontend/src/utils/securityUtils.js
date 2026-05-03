/**
 * Utility functions for XSS protection and input sanitization
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Raw text input
 * @returns {string} Escaped text safe for HTML rendering
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize user input - removes potentially dangerous characters
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick, onerror, etc)
    .trim();
}

/**
 * Sanitize error messages from API - escape HTML but preserve text
 * @param {string} message - Error message from API
 * @returns {string} Sanitized message
 */
export function sanitizeApiMessage(message) {
  if (!message || typeof message !== 'string') return 'Terjadi kesalahan';
  return escapeHtml(message);
}

/**
 * Validate username - alphanumeric and underscore only
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize text for safe display in UI
 * Removes any HTML tags and escapes special chars
 * @param {string} text
 * @returns {string}
 */
export function safeDisplayText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
