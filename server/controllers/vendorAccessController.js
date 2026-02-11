const Vendor = require('../models/Vendor');
const VendorRole = require('../models/VendorRole');
const VendorSubUser = require('../models/VendorSubUser');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @desc    Get team members
// @route   GET /api/vendor/team
// @access  Private (Vendor)
exports.getTeamMembers = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const teamMembers = await VendorSubUser.find({ vendor: vendor._id })
      .populate('user', 'email profile')
      .populate('role', 'name permissions')
      .populate('invitedBy', 'email profile.firstName');

    // Include the owner
    const owner = await User.findById(vendor.user).select('email profile');

    res.json({
      success: true,
      data: {
        owner: {
          user: owner,
          role: { name: 'Owner', isOwner: true },
        },
        members: teamMembers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get roles
// @route   GET /api/vendor/team/roles
// @access  Private (Vendor)
exports.getRoles = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const roles = await VendorRole.find({ vendor: vendor._id });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create custom role
// @route   POST /api/vendor/team/roles
// @access  Private (Vendor)
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check if role name already exists
    const existingRole = await VendorRole.findOne({ vendor: vendor._id, name });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role name already exists' });
    }

    const role = await VendorRole.create({
      vendor: vendor._id,
      name,
      description,
      permissions,
      isDefault: false,
    });

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'role_created',
      resourceType: 'team',
      resourceId: role._id,
      description: `Created new role: ${name}`,
      metadata: { ipAddress: req.ip },
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update role
// @route   PUT /api/vendor/team/roles/:id
// @access  Private (Vendor)
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const role = await VendorRole.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.name === 'Owner') {
      return res.status(400).json({ success: false, message: 'Cannot modify Owner role' });
    }

    const oldData = role.toObject();

    role.name = name || role.name;
    role.description = description || role.description;
    if (permissions) {
      role.permissions = { ...role.permissions, ...permissions };
    }

    await role.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'role_updated',
      resourceType: 'team',
      resourceId: role._id,
      description: `Updated role: ${role.name}`,
      changes: { before: oldData.permissions, after: role.permissions },
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete role
// @route   DELETE /api/vendor/team/roles/:id
// @access  Private (Vendor)
exports.deleteRole = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const role = await VendorRole.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default roles' });
    }

    // Check if any users have this role
    const usersWithRole = await VendorSubUser.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users. Reassign users first.',
      });
    }

    await role.deleteOne();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'role_deleted',
      resourceType: 'team',
      description: `Deleted role: ${role.name}`,
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite team member
// @route   POST /api/vendor/team/invite
// @access  Private (Vendor)
exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, roleId } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check subscription limits
    const VendorSubscription = require('../models/VendorSubscription');
    const VendorPlan = require('../models/VendorPlan');

    const subscription = await VendorSubscription.findOne({ vendor: vendor._id, status: 'active' });
    if (subscription) {
      const plan = await VendorPlan.findById(subscription.plan);
      if (plan && plan.limits.maxSubAccounts !== -1) {
        const currentMembers = await VendorSubUser.countDocuments({
          vendor: vendor._id,
          status: { $in: ['pending', 'active'] },
        });
        if (currentMembers >= plan.limits.maxSubAccounts) {
          return res.status(400).json({
            success: false,
            message: `Your plan allows maximum ${plan.limits.maxSubAccounts} team members. Upgrade to add more.`,
          });
        }
      }
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create user with temporary password
      const bcrypt = require('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-8);
      user = await User.create({
        email,
        password: await bcrypt.hash(tempPassword, 10),
        role: 'customer',
        profile: { firstName: email.split('@')[0] },
      });
    }

    // Check if already a team member
    const existingMember = await VendorSubUser.findOne({ vendor: vendor._id, user: user._id });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a team member' });
    }

    // Verify role exists
    const role = await VendorRole.findOne({ _id: roleId, vendor: vendor._id });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Create sub-user
    const subUser = new VendorSubUser({
      vendor: vendor._id,
      user: user._id,
      role: role._id,
      invitedBy: req.user._id,
      status: 'pending',
    });

    subUser.generateInviteToken();
    await subUser.save();

    // TODO: Send invitation email with token

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'team_member_invited',
      resourceType: 'team',
      resourceId: subUser._id,
      description: `Invited ${email} as ${role.name}`,
      metadata: { ipAddress: req.ip },
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email,
        role: role.name,
        inviteToken: subUser.inviteToken, // Remove in production, send via email
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept team invitation
// @route   POST /api/vendor/team/accept-invite
// @access  Public
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    const subUser = await VendorSubUser.findOne({
      inviteToken: token,
      inviteTokenExpires: { $gt: new Date() },
      status: 'pending',
    }).populate('vendor', 'storeName');

    if (!subUser) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
    }

    subUser.status = 'active';
    subUser.acceptedAt = new Date();
    subUser.inviteToken = undefined;
    subUser.inviteTokenExpires = undefined;
    await subUser.save();

    res.json({
      success: true,
      message: `You are now a team member of ${subUser.vendor.storeName}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team member role
// @route   PUT /api/vendor/team/:id/role
// @access  Private (Vendor)
exports.updateMemberRole = async (req, res) => {
  try {
    const { roleId } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const subUser = await VendorSubUser.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!subUser) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const role = await VendorRole.findOne({ _id: roleId, vendor: vendor._id });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const oldRole = await VendorRole.findById(subUser.role);
    subUser.role = role._id;
    await subUser.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'team_role_changed',
      resourceType: 'team',
      resourceId: subUser._id,
      description: `Changed role from ${oldRole?.name} to ${role.name}`,
      changes: { before: oldRole?.name, after: role.name },
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove team member
// @route   DELETE /api/vendor/team/:id
// @access  Private (Vendor)
exports.removeTeamMember = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const subUser = await VendorSubUser.findOne({ _id: req.params.id, vendor: vendor._id })
      .populate('user', 'email');

    if (!subUser) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    subUser.status = 'removed';
    await subUser.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'team_member_removed',
      resourceType: 'team',
      resourceId: subUser._id,
      description: `Removed team member: ${subUser.user.email}`,
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit logs
// @route   GET /api/vendor/audit-logs
// @access  Private (Vendor)
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resourceType } = req.query;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const query = { vendor: vendor._id };
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const logs = await AuditLog.find(query)
      .populate('user', 'email profile.firstName profile.lastName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
