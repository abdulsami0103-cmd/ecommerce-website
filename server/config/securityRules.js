/**
 * Security Rules Configuration
 * Defines automated rules for detecting and responding to security events
 */

const SECURITY_RULES = [
  {
    name: 'brute_force',
    description: 'Detect brute force login attempts',
    condition: {
      event: 'login_failed',
      threshold: 5,
      windowMinutes: 10,
      groupBy: ['ipAddress'],
    },
    actions: ['block_ip', 'alert_admin'],
    severity: 'high',
    alertTitle: 'Brute Force Attack Detected',
    alertDescription: 'Multiple failed login attempts detected from the same IP address.',
    autoBlock: {
      enabled: true,
      durationMinutes: 60,
    },
  },
  {
    name: 'multiple_failed_logins',
    description: 'Multiple failed logins for single account',
    condition: {
      event: 'login_failed',
      threshold: 5,
      windowMinutes: 15,
      groupBy: ['email'],
    },
    actions: ['lock_account', 'alert_user', 'alert_admin'],
    severity: 'medium',
    alertTitle: 'Account Under Attack',
    alertDescription: 'Multiple failed login attempts for a single account.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'unusual_payout',
    description: 'Payout amount significantly higher than average',
    condition: {
      event: 'payout_requested',
      multiplier: 3,
      comparisonField: 'vendor_average_payout',
    },
    actions: ['hold_payout', 'alert_admin'],
    severity: 'critical',
    alertTitle: 'Suspicious Payout Request',
    alertDescription: 'Payout amount is significantly higher than vendor average.',
    autoBlock: {
      enabled: true,
      action: 'hold_payout',
    },
  },
  {
    name: 'bulk_price_change',
    description: 'Vendor changing many product prices rapidly',
    condition: {
      event: 'price_changed',
      threshold: 20,
      windowMinutes: 5,
      groupBy: ['vendorId'],
    },
    actions: ['alert_admin'],
    severity: 'medium',
    alertTitle: 'Bulk Price Changes Detected',
    alertDescription: 'Vendor is rapidly changing product prices.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'new_location_login',
    description: 'Login from a new country not seen in 90 days',
    condition: {
      event: 'login_success',
      checkNewLocation: true,
      lookbackDays: 90,
    },
    actions: ['require_2fa', 'alert_user'],
    severity: 'medium',
    alertTitle: 'Login From New Location',
    alertDescription: 'Account login detected from a new geographic location.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'permission_escalation',
    description: 'User role or permissions changed',
    condition: {
      event: 'role_changed',
      escalationOnly: true,
    },
    actions: ['alert_admin'],
    severity: 'high',
    alertTitle: 'Permission Escalation',
    alertDescription: 'User permissions or role has been elevated.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'mass_data_export',
    description: 'Large data export detected',
    condition: {
      event: 'data_exported',
      threshold: 1000,
      windowMinutes: 60,
    },
    actions: ['alert_admin'],
    severity: 'high',
    alertTitle: 'Mass Data Export Detected',
    alertDescription: 'Large amount of data exported from the system.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'api_abuse',
    description: 'Excessive API calls from single source',
    condition: {
      event: 'api_call',
      threshold: 1000,
      windowMinutes: 1,
      groupBy: ['ipAddress'],
    },
    actions: ['rate_limit', 'alert_admin'],
    severity: 'medium',
    alertTitle: 'API Abuse Detected',
    alertDescription: 'Excessive API calls detected from a single source.',
    autoBlock: {
      enabled: true,
      durationMinutes: 15,
    },
  },
  {
    name: 'account_lockout',
    description: 'Account has been locked',
    condition: {
      event: 'account_locked',
    },
    actions: ['alert_user', 'log_security'],
    severity: 'medium',
    alertTitle: 'Account Locked',
    alertDescription: 'User account has been locked due to security policy.',
    autoBlock: {
      enabled: false,
    },
  },
  {
    name: 'suspicious_refund',
    description: 'Large refund requested',
    condition: {
      event: 'refund_requested',
      threshold: 50000, // Amount in base currency
    },
    actions: ['hold_refund', 'alert_admin'],
    severity: 'high',
    alertTitle: 'Large Refund Request',
    alertDescription: 'Refund request for a large amount detected.',
    autoBlock: {
      enabled: true,
      action: 'hold_refund',
    },
  },
];

// Severity levels and their priorities
const SEVERITY_LEVELS = {
  low: { priority: 1, color: '#6b7280', notifyAdmin: false },
  medium: { priority: 2, color: '#f59e0b', notifyAdmin: true },
  high: { priority: 3, color: '#ef4444', notifyAdmin: true },
  critical: { priority: 4, color: '#dc2626', notifyAdmin: true, notifyImmediately: true },
};

// Rate limiting configuration
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 15,
  },
  api: {
    maxRequests: 100,
    windowMinutes: 1,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMinutes: 60,
  },
  export: {
    maxPerDay: 10,
  },
};

// IP Blocking configuration
const IP_BLOCKING = {
  enabled: true,
  defaultBlockDuration: 60, // minutes
  permanentBlockThreshold: 5, // Number of temporary blocks before permanent
  whitelist: [
    '127.0.0.1',
    '::1',
    // Add trusted IPs here
  ],
};

// Actions that can be taken
const AVAILABLE_ACTIONS = {
  alert_admin: {
    name: 'Alert Admin',
    description: 'Send alert to admin users',
    automatic: true,
  },
  alert_user: {
    name: 'Alert User',
    description: 'Send alert to affected user',
    automatic: true,
  },
  block_ip: {
    name: 'Block IP',
    description: 'Temporarily block IP address',
    automatic: true,
    requiresApproval: false,
  },
  lock_account: {
    name: 'Lock Account',
    description: 'Lock user account',
    automatic: true,
    requiresApproval: false,
  },
  require_2fa: {
    name: 'Require 2FA',
    description: 'Force 2FA verification',
    automatic: true,
  },
  hold_payout: {
    name: 'Hold Payout',
    description: 'Put payout on hold for review',
    automatic: true,
    requiresApproval: true,
  },
  hold_refund: {
    name: 'Hold Refund',
    description: 'Put refund on hold for review',
    automatic: true,
    requiresApproval: true,
  },
  rate_limit: {
    name: 'Rate Limit',
    description: 'Apply rate limiting',
    automatic: true,
  },
  log_security: {
    name: 'Log Security Event',
    description: 'Log the security event',
    automatic: true,
  },
};

// Get rule by name
const getRuleByName = (name) => {
  return SECURITY_RULES.find(rule => rule.name === name);
};

// Get rules by event type
const getRulesByEvent = (eventType) => {
  return SECURITY_RULES.filter(rule => rule.condition.event === eventType);
};

// Check if IP is whitelisted
const isIPWhitelisted = (ipAddress) => {
  return IP_BLOCKING.whitelist.includes(ipAddress);
};

module.exports = {
  SECURITY_RULES,
  SEVERITY_LEVELS,
  RATE_LIMITS,
  IP_BLOCKING,
  AVAILABLE_ACTIONS,
  getRuleByName,
  getRulesByEvent,
  isIPWhitelisted,
};
