const mongoose = require('mongoose');

const vendorRoleSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  isDefault: {
    type: Boolean,
    default: false,
  },
  permissions: {
    // Product permissions
    can_view_products: { type: Boolean, default: false },
    can_create_products: { type: Boolean, default: false },
    can_edit_products: { type: Boolean, default: false },
    can_delete_products: { type: Boolean, default: false },

    // Order permissions
    can_view_orders: { type: Boolean, default: false },
    can_process_orders: { type: Boolean, default: false },
    can_cancel_orders: { type: Boolean, default: false },
    can_issue_refunds: { type: Boolean, default: false },

    // Customer permissions
    can_view_customers: { type: Boolean, default: false },
    can_contact_customers: { type: Boolean, default: false },

    // Analytics permissions
    can_view_analytics: { type: Boolean, default: false },
    can_export_reports: { type: Boolean, default: false },

    // Payout permissions
    can_view_payouts: { type: Boolean, default: false },
    can_request_payouts: { type: Boolean, default: false },
    can_manage_bank_details: { type: Boolean, default: false },

    // Store settings
    can_edit_store_settings: { type: Boolean, default: false },
    can_manage_shipping: { type: Boolean, default: false },

    // Team permissions
    can_view_team: { type: Boolean, default: false },
    can_invite_users: { type: Boolean, default: false },
    can_manage_roles: { type: Boolean, default: false },
    can_remove_users: { type: Boolean, default: false },

    // Subscription
    can_manage_subscription: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// Index
vendorRoleSchema.index({ vendor: 1, name: 1 }, { unique: true });

// Pre-defined roles
vendorRoleSchema.statics.createDefaultRoles = async function(vendorId) {
  const defaultRoles = [
    {
      vendor: vendorId,
      name: 'Owner',
      description: 'Full access to all features',
      isDefault: true,
      permissions: {
        can_view_products: true,
        can_create_products: true,
        can_edit_products: true,
        can_delete_products: true,
        can_view_orders: true,
        can_process_orders: true,
        can_cancel_orders: true,
        can_issue_refunds: true,
        can_view_customers: true,
        can_contact_customers: true,
        can_view_analytics: true,
        can_export_reports: true,
        can_view_payouts: true,
        can_request_payouts: true,
        can_manage_bank_details: true,
        can_edit_store_settings: true,
        can_manage_shipping: true,
        can_view_team: true,
        can_invite_users: true,
        can_manage_roles: true,
        can_remove_users: true,
        can_manage_subscription: true,
      },
    },
    {
      vendor: vendorId,
      name: 'Manager',
      description: 'Manage products, orders, and team',
      isDefault: true,
      permissions: {
        can_view_products: true,
        can_create_products: true,
        can_edit_products: true,
        can_delete_products: true,
        can_view_orders: true,
        can_process_orders: true,
        can_cancel_orders: true,
        can_issue_refunds: false,
        can_view_customers: true,
        can_contact_customers: true,
        can_view_analytics: true,
        can_export_reports: true,
        can_view_payouts: true,
        can_request_payouts: false,
        can_manage_bank_details: false,
        can_edit_store_settings: true,
        can_manage_shipping: true,
        can_view_team: true,
        can_invite_users: true,
        can_manage_roles: false,
        can_remove_users: false,
        can_manage_subscription: false,
      },
    },
    {
      vendor: vendorId,
      name: 'Product Editor',
      description: 'Manage product catalog',
      isDefault: true,
      permissions: {
        can_view_products: true,
        can_create_products: true,
        can_edit_products: true,
        can_delete_products: false,
        can_view_orders: false,
        can_process_orders: false,
        can_cancel_orders: false,
        can_issue_refunds: false,
        can_view_customers: false,
        can_contact_customers: false,
        can_view_analytics: false,
        can_export_reports: false,
        can_view_payouts: false,
        can_request_payouts: false,
        can_manage_bank_details: false,
        can_edit_store_settings: false,
        can_manage_shipping: false,
        can_view_team: false,
        can_invite_users: false,
        can_manage_roles: false,
        can_remove_users: false,
        can_manage_subscription: false,
      },
    },
    {
      vendor: vendorId,
      name: 'Order Handler',
      description: 'Process and manage orders',
      isDefault: true,
      permissions: {
        can_view_products: true,
        can_create_products: false,
        can_edit_products: false,
        can_delete_products: false,
        can_view_orders: true,
        can_process_orders: true,
        can_cancel_orders: false,
        can_issue_refunds: false,
        can_view_customers: true,
        can_contact_customers: true,
        can_view_analytics: false,
        can_export_reports: false,
        can_view_payouts: false,
        can_request_payouts: false,
        can_manage_bank_details: false,
        can_edit_store_settings: false,
        can_manage_shipping: false,
        can_view_team: false,
        can_invite_users: false,
        can_manage_roles: false,
        can_remove_users: false,
        can_manage_subscription: false,
      },
    },
    {
      vendor: vendorId,
      name: 'Viewer',
      description: 'View-only access',
      isDefault: true,
      permissions: {
        can_view_products: true,
        can_create_products: false,
        can_edit_products: false,
        can_delete_products: false,
        can_view_orders: true,
        can_process_orders: false,
        can_cancel_orders: false,
        can_issue_refunds: false,
        can_view_customers: true,
        can_contact_customers: false,
        can_view_analytics: true,
        can_export_reports: false,
        can_view_payouts: true,
        can_request_payouts: false,
        can_manage_bank_details: false,
        can_edit_store_settings: false,
        can_manage_shipping: false,
        can_view_team: true,
        can_invite_users: false,
        can_manage_roles: false,
        can_remove_users: false,
        can_manage_subscription: false,
      },
    },
  ];

  return this.insertMany(defaultRoles);
};

module.exports = mongoose.model('VendorRole', vendorRoleSchema);
