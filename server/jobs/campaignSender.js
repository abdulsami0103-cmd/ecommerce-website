const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const CampaignRecipient = require('../models/CampaignRecipient');
const NotificationPreference = require('../models/NotificationPreference');
const AudienceSegment = require('../models/AudienceSegment');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Campaign Sender Job
 * Runs every 5 minutes to:
 * - Check for scheduled campaigns ready to send
 * - Process campaign recipients in batches
 * - Update campaign statistics
 */

const BATCH_SIZE = 100; // Process 100 recipients at a time

/**
 * Get users matching a segment
 */
const getSegmentUsers = async (segment) => {
  if (!segment) return [];

  // Build query from segment rules
  const query = { isActive: true };

  if (segment.rules && segment.rules.length > 0) {
    for (const rule of segment.rules) {
      switch (rule.field) {
        case 'total_orders':
          // Would need aggregation - simplified for now
          break;
        case 'last_order_date':
          // Would need join with orders
          break;
        case 'created_at':
          if (rule.operator === 'within_days') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - rule.value);
            query.createdAt = { $gte: daysAgo };
          }
          break;
        case 'role':
          query.role = rule.value;
          break;
        default:
          break;
      }
    }
  }

  // Get users who have marketing consent
  const users = await User.find(query).select('_id email profile');

  // Filter by notification preferences
  const usersWithConsent = [];
  for (const user of users) {
    const prefs = await NotificationPreference.findOne({ user: user._id });
    if (!prefs || prefs.marketingConsent !== false) {
      usersWithConsent.push(user);
    }
  }

  return usersWithConsent;
};

/**
 * Send campaign to a single recipient
 */
const sendToRecipient = async (campaign, user, recipientRecord) => {
  try {
    if (campaign.channel === 'email' || campaign.channel === 'multi') {
      // Personalize content
      const personalizedSubject = campaign.content.subject
        .replace('{{firstName}}', user.profile?.firstName || 'Valued Customer')
        .replace('{{lastName}}', user.profile?.lastName || '');

      const personalizedBody = campaign.content.htmlBody
        .replace(/\{\{firstName\}\}/g, user.profile?.firstName || 'Valued Customer')
        .replace(/\{\{lastName\}\}/g, user.profile?.lastName || '')
        .replace(/\{\{email\}\}/g, user.email);

      // Add tracking pixel and unsubscribe link
      const trackingPixel = `<img src="${process.env.API_URL}/api/campaigns/${campaign._id}/track/open?rid=${recipientRecord._id}" width="1" height="1" style="display:none;" />`;
      const unsubscribeLink = `${process.env.CLIENT_URL}/unsubscribe?token=${recipientRecord._id}`;

      const finalBody = personalizedBody
        .replace('{{unsubscribe_link}}', unsubscribeLink)
        + trackingPixel;

      await emailService.send(
        user.email,
        personalizedSubject,
        finalBody,
        campaign.content.textBody
      );

      recipientRecord.sentAt = new Date();
      recipientRecord.status = 'sent';
    }

    if (campaign.channel === 'push' || campaign.channel === 'multi') {
      // Push notification would be sent here
      // Requires push token management
    }

    await recipientRecord.save();
    return true;
  } catch (error) {
    console.error(`[CampaignSender] Failed to send to ${user.email}:`, error);
    recipientRecord.status = 'failed';
    recipientRecord.error = error.message;
    await recipientRecord.save();
    return false;
  }
};

/**
 * Process a scheduled campaign
 */
const processCampaign = async (campaign) => {
  console.log(`[CampaignSender] Processing campaign: ${campaign.name}`);

  try {
    // Get segment users
    const segment = await AudienceSegment.findById(campaign.audience?.segmentId);
    const users = await getSegmentUsers(segment);

    console.log(`[CampaignSender] Found ${users.length} recipients for campaign`);

    // Create recipient records if not exists
    for (const user of users) {
      const exists = await CampaignRecipient.findOne({
        campaign: campaign._id,
        user: user._id,
      });

      if (!exists) {
        await CampaignRecipient.create({
          campaign: campaign._id,
          user: user._id,
          email: user.email,
          status: 'pending',
        });
      }
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await campaign.save();

    // Process pending recipients in batches
    let sent = 0;
    let failed = 0;

    while (true) {
      const pendingRecipients = await CampaignRecipient.find({
        campaign: campaign._id,
        status: 'pending',
      }).limit(BATCH_SIZE).populate('user');

      if (pendingRecipients.length === 0) break;

      for (const recipient of pendingRecipients) {
        if (!recipient.user) {
          recipient.status = 'failed';
          recipient.error = 'User not found';
          await recipient.save();
          failed++;
          continue;
        }

        const success = await sendToRecipient(campaign, recipient.user, recipient);
        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update campaign stats
    campaign.status = 'sent';
    campaign.stats = {
      ...campaign.stats,
      sent: sent,
      delivered: sent, // Simplified - real delivery tracking would come from webhooks
    };
    await campaign.save();

    console.log(`[CampaignSender] Campaign "${campaign.name}" completed: ${sent} sent, ${failed} failed`);
  } catch (error) {
    console.error(`[CampaignSender] Campaign processing failed:`, error);
    campaign.status = 'failed';
    campaign.error = error.message;
    await campaign.save();
  }
};

/**
 * Check for scheduled campaigns ready to send
 */
const checkScheduledCampaigns = async () => {
  console.log('[CampaignSender] Checking for scheduled campaigns...');

  try {
    const now = new Date();

    // Find campaigns scheduled to send now
    const scheduledCampaigns = await Campaign.find({
      status: 'scheduled',
      'scheduling.scheduledAt': { $lte: now },
    });

    console.log(`[CampaignSender] Found ${scheduledCampaigns.length} campaigns to process`);

    for (const campaign of scheduledCampaigns) {
      await processCampaign(campaign);
    }
  } catch (error) {
    console.error('[CampaignSender] Job failed:', error);
  }
};

/**
 * Process immediate campaigns
 */
const processImmediateCampaigns = async () => {
  try {
    const campaigns = await Campaign.find({
      status: 'scheduled',
      'scheduling.sendImmediately': true,
    });

    for (const campaign of campaigns) {
      await processCampaign(campaign);
    }
  } catch (error) {
    console.error('[CampaignSender] Immediate campaigns processing failed:', error);
  }
};

/**
 * Update campaign statistics from webhook data
 */
const updateCampaignStats = async (campaignId) => {
  try {
    const stats = await CampaignRecipient.aggregate([
      { $match: { campaign: campaignId } },
      {
        $group: {
          _id: null,
          sent: { $sum: { $cond: [{ $ne: ['$sentAt', null] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $ne: ['$deliveredAt', null] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $ne: ['$clickedAt', null] }, 1, 0] } },
          bounced: { $sum: { $cond: [{ $ne: ['$bouncedAt', null] }, 1, 0] } },
          unsubscribed: { $sum: { $cond: [{ $ne: ['$unsubscribedAt', null] }, 1, 0] } },
        },
      },
    ]);

    if (stats.length > 0) {
      await Campaign.findByIdAndUpdate(campaignId, {
        stats: stats[0],
      });
    }
  } catch (error) {
    console.error('[CampaignSender] Stats update failed:', error);
  }
};

// Schedule jobs
const startCampaignSenderJobs = () => {
  // Check for scheduled campaigns every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkScheduledCampaigns();
  });

  // Process immediate campaigns every minute
  cron.schedule('* * * * *', async () => {
    await processImmediateCampaigns();
  });

  console.log('[CampaignSender] Jobs scheduled');
};

module.exports = {
  startCampaignSenderJobs,
  checkScheduledCampaigns,
  processCampaign,
  updateCampaignStats,
  sendToRecipient,
};
