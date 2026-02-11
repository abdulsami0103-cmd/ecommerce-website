const Campaign = require('../models/Campaign');
const CampaignRecipient = require('../models/CampaignRecipient');
const AudienceSegment = require('../models/AudienceSegment');
const NotificationPreference = require('../models/NotificationPreference');
const PushToken = require('../models/PushToken');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * @desc    Get all campaigns
 * @route   GET /api/admin/campaigns
 * @access  Admin
 */
exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, channel } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (channel) query.channel = channel;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('audience.segmentId', 'name customerCount')
        .populate('createdBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Campaign.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/admin/campaigns/:id
 * @access  Admin
 */
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('audience.segmentId')
      .populate('createdBy', 'email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Create campaign
 * @route   POST /api/admin/campaigns
 * @access  Admin
 */
exports.createCampaign = async (req, res) => {
  try {
    const {
      name,
      type,
      channel,
      audience,
      content,
      scheduling,
      abTest,
    } = req.body;

    // Estimate reach
    let estimatedReach = 0;
    if (audience?.segmentId) {
      const segment = await AudienceSegment.findById(audience.segmentId);
      if (segment) {
        await segment.refreshCount();
        estimatedReach = segment.customerCount;
      }
    } else if (audience?.targetAll) {
      estimatedReach = await User.countDocuments({ role: 'customer' });
    }

    const campaign = await Campaign.create({
      name,
      type,
      channel,
      audience: {
        ...audience,
        estimatedReach,
      },
      content,
      scheduling,
      abTest,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created',
      data: campaign,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/admin/campaigns/:id
 * @access  Admin
 */
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (!['draft', 'scheduled'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update campaign in current status',
      });
    }

    const allowedUpdates = ['name', 'content', 'scheduling', 'audience', 'abTest'];
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        campaign[key] = req.body[key];
      }
    }

    // Re-estimate reach if audience changed
    if (req.body.audience) {
      if (req.body.audience.segmentId) {
        const segment = await AudienceSegment.findById(req.body.audience.segmentId);
        if (segment) {
          await segment.refreshCount();
          campaign.audience.estimatedReach = segment.customerCount;
        }
      } else if (req.body.audience.targetAll) {
        campaign.audience.estimatedReach = await User.countDocuments({ role: 'customer' });
      }
    }

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated',
      data: campaign,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Schedule campaign
 * @route   POST /api/admin/campaigns/:id/schedule
 * @access  Admin
 */
exports.scheduleCampaign = async (req, res) => {
  try {
    const { scheduledAt, sendImmediately } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Campaign must be in draft status to schedule',
      });
    }

    campaign.scheduling.scheduledAt = sendImmediately ? new Date() : scheduledAt;
    campaign.scheduling.sendImmediately = sendImmediately;
    campaign.status = 'scheduled';

    await campaign.save();

    // If send immediately, trigger the send
    if (sendImmediately) {
      // This would typically be handled by a background job
      setImmediate(() => {
        exports.executeCampaign(campaign._id);
      });
    }

    res.json({
      success: true,
      message: sendImmediately ? 'Campaign is being sent' : 'Campaign scheduled',
      data: campaign,
    });
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Execute campaign (internal)
 */
exports.executeCampaign = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'scheduled') return;

    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await campaign.save();

    // Get target users
    let users = [];
    if (campaign.audience.segmentId) {
      const segment = await AudienceSegment.findById(campaign.audience.segmentId);
      if (segment && segment.rules.length > 0) {
        const query = segment.buildQuery();
        query.role = 'customer';
        users = await User.find(query).select('_id email profile');
      } else if (segment?.prebuiltType) {
        // Handle prebuilt segments
        users = await User.find({ role: 'customer' }).select('_id email profile');
      }
    } else if (campaign.audience.targetAll) {
      users = await User.find({ role: 'customer' }).select('_id email profile');
    }

    campaign.stats.totalRecipients = users.length;

    // Create recipient records
    const recipientDocs = users.map(user => ({
      campaign: campaign._id,
      user: user._id,
      email: user.email,
    }));

    await CampaignRecipient.insertMany(recipientDocs, { ordered: false }).catch(() => {});

    // Send based on channel
    if (campaign.channel === 'email') {
      const recipients = users.map(user => ({
        email: user.email,
        variables: {
          customer_name: user.profile?.firstName || 'Customer',
        },
      }));

      const result = await emailService.sendBulk(
        recipients,
        campaign.content.subject,
        campaign.content.htmlBody
      );

      campaign.stats.sent = result.sent;
    }

    // Update recipients status
    await CampaignRecipient.updateMany(
      { campaign: campaign._id },
      { sentAt: new Date() }
    );

    campaign.status = 'sent';
    campaign.completedAt = new Date();
    await campaign.save();

    console.log(`Campaign ${campaign.name} completed. Sent: ${campaign.stats.sent}`);
  } catch (error) {
    console.error('Error executing campaign:', error);
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.status = 'draft'; // Reset to allow retry
      await campaign.save();
    }
  }
};

/**
 * @desc    Pause campaign
 * @route   PUT /api/admin/campaigns/:id/pause
 * @access  Admin
 */
exports.pauseCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (!['scheduled', 'sending'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot pause campaign in current status',
      });
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign paused',
      data: campaign,
    });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel campaign
 * @route   DELETE /api/admin/campaigns/:id
 * @access  Admin
 */
exports.cancelCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (['sent', 'cancelled'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel campaign in current status',
      });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign cancelled',
    });
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Get campaign statistics
 * @route   GET /api/admin/campaigns/:id/stats
 * @access  Admin
 */
exports.getCampaignStats = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Refresh stats
    await campaign.updateStats();

    // Get detailed breakdown
    const statusBreakdown = await CampaignRecipient.aggregate([
      { $match: { campaign: campaign._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        campaign: {
          name: campaign.name,
          status: campaign.status,
          sentAt: campaign.sentAt,
          completedAt: campaign.completedAt,
        },
        stats: campaign.stats,
        rates: {
          openRate: campaign.openRate,
          clickRate: campaign.clickRate,
          bounceRate: campaign.stats.sent > 0
            ? ((campaign.stats.bounced / campaign.stats.sent) * 100).toFixed(2)
            : 0,
          unsubscribeRate: campaign.stats.sent > 0
            ? ((campaign.stats.unsubscribed / campaign.stats.sent) * 100).toFixed(2)
            : 0,
        },
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

// ============ Audience Segment Controllers ============

/**
 * @desc    Get audience segments
 * @route   GET /api/admin/segments
 * @access  Admin
 */
exports.getSegments = async (req, res) => {
  try {
    const { includePrebuilt = true } = req.query;

    let segments = [];

    // Get prebuilt segments
    if (includePrebuilt === 'true' || includePrebuilt === true) {
      const prebuilt = await AudienceSegment.getPrebuiltSegments();
      segments = segments.concat(prebuilt);
    }

    // Get custom segments
    const custom = await AudienceSegment.find({
      isPrebuilt: false,
      isActive: true,
    }).sort({ createdAt: -1 });

    segments = segments.concat(custom);

    res.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching segments',
      error: error.message,
    });
  }
};

/**
 * @desc    Create audience segment
 * @route   POST /api/admin/segments
 * @access  Admin
 */
exports.createSegment = async (req, res) => {
  try {
    const { name, description, rules, matchType } = req.body;

    const segment = await AudienceSegment.create({
      name,
      description,
      rules,
      matchType,
      createdBy: req.user._id,
    });

    // Calculate initial count
    await segment.refreshCount();

    res.status(201).json({
      success: true,
      message: 'Segment created',
      data: segment,
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating segment',
      error: error.message,
    });
  }
};

/**
 * @desc    Update audience segment
 * @route   PUT /api/admin/segments/:id
 * @access  Admin
 */
exports.updateSegment = async (req, res) => {
  try {
    const segment = await AudienceSegment.findById(req.params.id);

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found',
      });
    }

    if (segment.isPrebuilt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify prebuilt segments',
      });
    }

    const { name, description, rules, matchType } = req.body;

    if (name) segment.name = name;
    if (description !== undefined) segment.description = description;
    if (rules) segment.rules = rules;
    if (matchType) segment.matchType = matchType;

    await segment.save();
    await segment.refreshCount();

    res.json({
      success: true,
      message: 'Segment updated',
      data: segment,
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating segment',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete audience segment
 * @route   DELETE /api/admin/segments/:id
 * @access  Admin
 */
exports.deleteSegment = async (req, res) => {
  try {
    const segment = await AudienceSegment.findById(req.params.id);

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found',
      });
    }

    if (segment.isPrebuilt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete prebuilt segments',
      });
    }

    await segment.deleteOne();

    res.json({
      success: true,
      message: 'Segment deleted',
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting segment',
      error: error.message,
    });
  }
};

// ============ Notification Preference Controllers ============

/**
 * @desc    Get user notification preferences
 * @route   GET /api/notifications/preferences
 * @access  User
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.getOrCreate(req.user._id, req.user.email);

    res.json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences',
      error: error.message,
    });
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  User
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.getOrCreate(req.user._id, req.user.email);

    const { channels, preferences, marketingConsent, quietHours } = req.body;

    if (channels) prefs.channels = { ...prefs.channels, ...channels };
    if (preferences) prefs.preferences = { ...prefs.preferences, ...preferences };
    if (marketingConsent !== undefined) {
      prefs.marketingConsent = marketingConsent;
      prefs.marketingConsentDate = new Date();
    }
    if (quietHours) prefs.quietHours = { ...prefs.quietHours, ...quietHours };

    await prefs.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      data: prefs,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message,
    });
  }
};

/**
 * @desc    Register push token
 * @route   POST /api/notifications/push-token
 * @access  User
 */
exports.registerPushToken = async (req, res) => {
  try {
    const { token, deviceType, deviceInfo } = req.body;

    const pushToken = await PushToken.registerToken(
      req.user._id,
      token,
      deviceType,
      deviceInfo
    );

    res.json({
      success: true,
      message: 'Push token registered',
      data: pushToken,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering push token',
      error: error.message,
    });
  }
};

/**
 * @desc    Unsubscribe from marketing emails
 * @route   POST /api/notifications/unsubscribe
 * @access  Public
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { token, email, reason } = req.body;

    let prefs;
    if (token) {
      prefs = await NotificationPreference.findOne({ unsubscribeToken: token });
    } else if (email) {
      const user = await User.findOne({ email });
      if (user) {
        prefs = await NotificationPreference.findOne({ user: user._id });
      }
    }

    if (!prefs) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    prefs.marketingConsent = false;
    prefs.unsubscribedAt = new Date();
    prefs.unsubscribeReason = reason;
    await prefs.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed from marketing emails',
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing unsubscribe',
      error: error.message,
    });
  }
};
