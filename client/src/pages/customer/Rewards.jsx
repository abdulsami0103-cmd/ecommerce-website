import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Loading } from '../../components/common';

// Icons
const GiftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TrophyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Rewards = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loyaltyRes, referralRes, leaderboardRes] = await Promise.all([
        api.get('/loyalty'),
        api.get('/loyalty/referrals'),
        api.get('/loyalty/leaderboard'),
      ]);

      setLoyaltyData(loyaltyRes.data.data);
      setReferralData(referralRes.data.data);
      setLeaderboard(leaderboardRes.data.data);
    } catch (error) {
      console.error('Failed to fetch rewards data:', error);
      toast.error('Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-400 to-orange-600',
      silver: 'from-gray-300 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
    };
    return colors[tier] || colors.bronze;
  };

  const getTierBadgeColor = (tier) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[tier] || colors.bronze;
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Rewards & Referrals</h1>
        <p className="text-gray-500">Earn points and get rewards for shopping and referring friends</p>
      </div>

      {/* Points Overview Card */}
      <div className={`card p-6 mb-8 bg-gradient-to-r ${getTierColor(loyaltyData?.tier)} text-white`}>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-white/80 text-sm uppercase tracking-wide">Available Points</p>
            <p className="text-5xl font-bold">{loyaltyData?.availablePoints?.toLocaleString() || 0}</p>
            <p className="text-white/80 mt-1">
              Worth ${((loyaltyData?.availablePoints || 0) * (loyaltyData?.pointsValue || 0.01)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <TrophyIcon className="w-5 h-5" />
              <span className="font-semibold capitalize">{loyaltyData?.tier || 'Bronze'} Member</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Lifetime: {loyaltyData?.lifetimePoints?.toLocaleString() || 0} points
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'points' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <GiftIcon className="w-5 h-5 inline mr-2" />
          My Points
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'referrals' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <UsersIcon className="w-5 h-5 inline mr-2" />
          Referrals
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'leaderboard' ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <TrophyIcon className="w-5 h-5 inline mr-2" />
          Leaderboard
        </button>
      </div>

      {/* Points Tab */}
      {activeTab === 'points' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* How to Earn */}
          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">How to Earn Points</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GiftIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Shop & Earn</p>
                    <p className="text-sm text-gray-500">Earn 10 points for every $1 spent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Refer Friends</p>
                    <p className="text-sm text-gray-500">Earn 500 points per referral</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <StarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Write Reviews</p>
                    <p className="text-sm text-gray-500">Earn 50 points per review</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrophyIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Tier Bonuses</p>
                    <p className="text-sm text-gray-500">Higher tiers earn up to 2x points</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Points History</h2>
              {loyaltyData?.transactions?.length > 0 ? (
                <div className="space-y-3">
                  {loyaltyData.transactions.map((txn, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`font-semibold ${txn.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.points > 0 ? '+' : ''}{txn.points}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No transactions yet. Start shopping to earn points!</p>
              )}
            </div>
          </div>

          {/* Tier Progress */}
          <div className="card p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Membership Tiers</h2>
            <div className="space-y-4">
              {['bronze', 'silver', 'gold', 'platinum'].map((tier, index) => {
                const thresholds = [0, 2000, 5000, 10000];
                const multipliers = ['1x', '1.25x', '1.5x', '2x'];
                const isCurrentTier = loyaltyData?.tier === tier;
                const isAchieved = loyaltyData?.lifetimePoints >= thresholds[index];

                return (
                  <div
                    key={tier}
                    className={`p-4 rounded-lg border-2 ${isCurrentTier ? 'border-primary-500 bg-primary-50' : isAchieved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAchieved && <CheckIcon className="w-5 h-5 text-green-600" />}
                        <span className={`font-semibold capitalize ${isCurrentTier ? 'text-primary-600' : ''}`}>
                          {tier}
                        </span>
                      </div>
                      <span className={`badge ${getTierBadgeColor(tier)}`}>{multipliers[index]} points</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{thresholds[index].toLocaleString()}+ lifetime points</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Referral Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-primary-600">{referralData?.totalReferrals || 0}</p>
                <p className="text-sm text-gray-500">Total Referrals</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{referralData?.completedReferrals || 0}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{referralData?.pendingReferrals || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{referralData?.totalEarned || 0}</p>
                <p className="text-sm text-gray-500">Points Earned</p>
              </div>
            </div>

            {/* Referral List */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Your Referrals</h2>
              {referralData?.referrals?.length > 0 ? (
                <div className="space-y-3">
                  {referralData.referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{ref.name || ref.email}</p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(ref.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${ref.status === 'rewarded' ? 'badge-success' : 'badge-warning'}`}>
                          {ref.status}
                        </span>
                        {ref.rewardAmount > 0 && (
                          <p className="text-sm text-green-600 mt-1">+{ref.rewardAmount} pts</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No referrals yet. Share your code to start earning!</p>
              )}
            </div>
          </div>

          {/* Share Referral */}
          <div className="card p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Share & Earn</h2>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <GiftIcon className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-gray-600">
                Invite friends and earn <span className="font-bold text-primary-600">500 points</span> for each friend who makes a purchase!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Your Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralData?.referralCode || ''}
                    readOnly
                    className="input font-mono text-lg text-center"
                  />
                  <Button onClick={copyReferralCode} variant="outline">
                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="label">Referral Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralData?.referralLink || ''}
                    readOnly
                    className="input text-sm"
                  />
                  <Button onClick={copyReferralLink} variant="outline">
                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-3">Share via</p>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=Join%20MarketPlace%20and%20get%20200%20bonus%20points!%20Use%20my%20code:%20${referralData?.referralCode}%20${encodeURIComponent(referralData?.referralLink || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=Join%20MarketPlace%20and%20get%20200%20bonus%20points!%20Use%20my%20code:%20${referralData?.referralCode}&url=${encodeURIComponent(referralData?.referralLink || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn bg-blue-400 text-white text-center py-2 rounded-lg hover:bg-blue-500"
                  >
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="card p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-6 text-center">Top Earners</h2>
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {user.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <span className={`badge ${getTierBadgeColor(user.tier)} text-xs`}>{user.tier}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{user.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
