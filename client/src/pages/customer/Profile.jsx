import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { updateProfile } from '../../store/slices/authSlice';
import { Input, Button } from '../../components/common';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    preferredLanguage: 'en',
    preferredCurrency: 'USD',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        preferredLanguage: user.preferredLanguage || 'en',
        preferredCurrency: user.preferredCurrency || 'USD',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">{t('nav.account')}</h1>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">Personal Information</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('auth.firstName')}
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              <Input
                label={t('auth.lastName')}
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />

            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Preferred Language</label>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="label">Preferred Currency</label>
                <select
                  name="preferredCurrency"
                  value={formData.preferredCurrency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <Button type="submit" loading={loading}>
              {t('common.save')}
            </Button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-6">Change Password</h2>

          <form className="space-y-6">
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
            />
            <Input
              label="New Password"
              type="password"
              name="newPassword"
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmNewPassword"
            />
            <Button type="submit">Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
