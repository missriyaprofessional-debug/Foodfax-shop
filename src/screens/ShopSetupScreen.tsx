import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, MapPin, Clock, CreditCard, Navigation, Loader2 } from 'lucide-react';

export const ShopSetupScreen: React.FC = () => {
  const { ownerProfile, saveShop, isLoading, setActiveScreen } = useOwnerApp();

  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('Restaurant & Cafe');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(ownerProfile?.phone || '');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [openingTime, setOpeningTime] = useState('10:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');
  const [upiId, setUpiId] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const shopTypes = [
    'Restaurant & Cafe',
    'Fast Food & QSR',
    'Bakery & Desserts',
    'Beverages & Juice Bar',
    'Cloud Kitchen',
    'Dhaba / Street Food',
  ];

  const handleDetectLocation = () => {
    setFormError(null);
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        setLocationSuccess(true);
      },
      (err) => {
        console.warn('Location detection failed:', err);
        setLocating(false);
        setFormError('Could not retrieve current GPS coordinates. Please enter your street address and area manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!shopName.trim()) {
      setFormError('Please provide your restaurant name.');
      return;
    }

    const success = await saveShop({
      name: shopName.trim(),
      shopType,
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude,
      longitude,
      openingTime,
      closingTime,
      upiId: upiId.trim(),
      isOpen: true,
      isRushMode: false,
      rushExtraMinutes: 15,
    });

    if (success) {
      setActiveScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-600/30">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Setup Your Restaurant Profile</h2>
        <p className="text-slate-400 text-xs mt-1">
          Welcome, {ownerProfile?.fullName || 'Partner'}! Let&apos;s configure your store details to begin receiving customer orders.
        </p>
      </div>

      {formError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Basic Info */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-2">
          1. Store Identity & Category
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant / Outlet Name *</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g. Spice Garden Bistro"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Shop / Outlet Category</label>
          <select
            value={shopType}
            onChange={(e) => setShopType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none"
          >
            {shopTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline or Cuisine Highlights</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Authentic Charcoal Tandoor, Dum Biryani & Rolls"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98450 12345"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
          />
        </div>

        {/* Location & Address */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-2 pt-2">
          2. Outlet Address & GPS Coordinates
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop #14, Ground Floor, 80 Feet Road"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Locality</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Koramangala"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Karnataka"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="560034"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        {/* GPS Location Button */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Device GPS Location</p>
              <p className="text-[11px] text-slate-400">
                {locationSuccess
                  ? `Lat: ${latitude?.toFixed(4)}, Long: ${longitude?.toFixed(4)}`
                  : 'Allows nearby customers to locate your store'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locating}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-orange-400 flex items-center gap-1.5 transition"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{locationSuccess ? 'Updated' : 'Detect GPS'}</span>
          </button>
        </div>

        {/* Hours & Payouts */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-2 pt-2">
          3. Operating Hours & Direct UPI Payouts
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Opening Time
            </label>
            <input
              type="text"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Closing Time
            </label>
            <input
              type="text"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              placeholder="11:00 PM"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            Direct UPI ID for Customer Payouts
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. partner@okaxis or 9845012345@paytm"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Customer order payments will transfer instantly directly to this verified UPI ID.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving shop settings...</span>
            </>
          ) : (
            <span>Launch Owner Dashboard</span>
          )}
        </button>
      </form>
    </div>
  );
};
