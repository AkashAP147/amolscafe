'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Mail, Phone, MapPin, QrCode } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    cafeName: "Amol's Cafe",
    phone: "+91 74111 21806",
    email: "admin@amolscafe.com",
    address: "Nipani, Karnataka",
    taxRate: "5",
    currency: "INR (₹)",
    upiId: "",
    upiName: "",
    qrImageUrl: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const snapshot = await get(ref(db, 'settings/payment'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings(s => ({ 
          ...s, 
          upiId: data.upiId || "", 
          upiName: data.upiName || "",
          qrImageUrl: data.qrImageUrl || ""
        }));
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await set(ref(db, 'settings/payment'), {
        upiId: settings.upiId,
        upiName: settings.upiName,
        qrImageUrl: settings.qrImageUrl || ""
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cafe Settings</h1>
        <p className="text-[#B5B5B5]">Manage your cafe's public profile and operational settings.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Profile Settings */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Store className="text-[#F58A1F]" size={24} />
            Public Profile
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Cafe Name</label>
              <input 
                type="text" 
                value={settings.cafeName}
                onChange={(e) => setSettings({...settings, cafeName: e.target.value})}
                className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]" size={18} />
                <input 
                  type="text" 
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#F58A1F]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]" size={18} />
                <input 
                  type="email" 
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#F58A1F]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]" size={18} />
                <input 
                  type="text" 
                  value={settings.address}
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#F58A1F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Operational Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Tax Rate (%)</label>
              <input 
                type="number" 
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
                className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Currency</label>
              <input 
                type="text" 
                disabled
                value={settings.currency}
                className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-[#888] rounded-xl py-3 px-4 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <QrCode className="text-[#F58A1F]" size={24} />
            Payment Settings (UPI QR Code)
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Business UPI ID</label>
                <input 
                  type="text" 
                  value={settings.upiId}
                  onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                  placeholder="e.g. 7411121806@ybl"
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
                />
                <p className="text-xs text-[#888] mt-1">Required for the mobile "Pay with UPI App" button.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Business Name (for UPI)</label>
                <input 
                  type="text" 
                  value={settings.upiName}
                  onChange={(e) => setSettings({...settings, upiName: e.target.value})}
                  placeholder="e.g. Amol's Cafe"
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Custom QR Image Upload</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSettings({ ...settings, qrImageUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-[#888] rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#F58A1F]/10 file:text-[#F58A1F] hover:file:bg-[#F58A1F]/20 cursor-pointer"
              />
              <p className="text-xs text-[#888] mt-2">Upload your shop's static QR code. If provided, this image will be shown instead of generating a dynamic one.</p>
              
              {settings.qrImageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-[#B5B5B5] mb-2">Current QR Image:</p>
                  <div className="relative inline-block">
                    <img src={settings.qrImageUrl} alt="QR Preview" className="w-32 h-32 object-contain bg-white p-2 rounded-xl" />
                    <button 
                      type="button" 
                      onClick={() => setSettings({ ...settings, qrImageUrl: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="bg-[#F58A1F] hover:bg-[#e07a1b] disabled:bg-[#444] disabled:text-[#888] text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  );
}
