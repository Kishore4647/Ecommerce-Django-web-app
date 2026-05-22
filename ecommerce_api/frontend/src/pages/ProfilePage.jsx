import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/services';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', new_password2: '' });
  const [saving, setSaving] = useState(false);

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(profileForm);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.new_password2) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(passForm);
      toast.success('Password changed successfully!');
      setPassForm({ old_password: '', new_password: '', new_password2: '' });
    } catch (err) {
      const msg = err.response?.data?.old_password || err.response?.data?.new_password || 'Failed to change password';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Avatar + Info */}
      <div className="card p-6 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.first_name} {user?.last_name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge bg-blue-100 text-blue-700 mt-1">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('profile')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
            ${tab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><User size={14} /> Profile Info</span>
        </button>
        <button onClick={() => setTab('password')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
            ${tab === 'password' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <span className="flex items-center gap-2"><Lock size={14} /> Change Password</span>
        </button>
      </div>

      {tab === 'profile' ? (
        <div className="card p-6">
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">First Name</label>
                <input className="input" value={profileForm.first_name}
                  onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Last Name</label>
                <input className="input" value={profileForm.last_name}
                  onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
              <input className="input" value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Default Address</label>
              <textarea className="input resize-none" rows={3} value={profileForm.address}
                onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-6">
          <form onSubmit={changePassword} className="space-y-4">
            {['old_password', 'new_password', 'new_password2'].map((field) => (
              <div key={field}>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  {field === 'old_password' ? 'Current Password' :
                   field === 'new_password' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input type="password" className="input" required
                  value={passForm[field]}
                  onChange={e => setPassForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Lock size={14} /> {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
