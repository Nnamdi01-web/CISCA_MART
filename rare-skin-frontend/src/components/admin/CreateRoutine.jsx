import React, { useState } from 'react';
// 👇 ADD THIS LINE RIGHT HERE
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';
  
const AVAILABLE_PRODUCTS = [
  // Cleansers
  { id: 1, name: 'Gentle Cleanser', price: 6500, category: 'Cleanser' },
  { id: 2, name: 'Salicylic Acid Foaming Cleanser', price: 7200, category: 'Cleanser' },
  { id: 3, name: 'Hydrating Facial Wash', price: 6800, category: 'Cleanser' },

  // Serums & Treatments
  { id: 4, name: 'Niacinamide Serum 10%', price: 7500, category: 'Serum' },
  { id: 5, name: 'Vitamin C Serum 15%', price: 6000, category: 'Serum' },
  { id: 6, name: 'Hyaluronic Acid Hydrating Serum', price: 7000, category: 'Serum' },
  { id: 7, name: 'Alpha Arbutin Brightening Serum', price: 8200, category: 'Serum' },
  { id: 8, name: 'Retinol 0.5% Night Serum', price: 9500, category: 'Serum' },

  // Moisturizers & Creams
  { id: 9, name: 'Hydrating Moisturizer', price: 8000, category: 'Moisturizer' },
  { id: 10, name: 'Ceramide Barrier Repair Cream', price: 9000, category: 'Moisturizer' },
  { id: 11, name: 'Oil-Free Mattifying Lotion', price: 7500, category: 'Moisturizer' },

  // Sun Protection
  { id: 12, name: 'Sunscreen SPF 50', price: 6500, category: 'Sunscreen' },
  { id: 13, name: 'Invisible Gel Sunscreen SPF 50+', price: 8500, category: 'Sunscreen' },

  // Toners & Exfoliants
  { id: 14, name: 'AHA/BHA Exfoliating Toner', price: 7800, category: 'Toner' },
  { id: 15, name: 'Soothing Rosewater Toner', price: 5500, category: 'Toner' }
];

export default function CreateRoutine({ consultation, onRoutineSent, onBack }) {
  const [selectedProductIds, setSelectedProductIds] = useState([1, 4, 5, 12]);
  const [adminNotes, setAdminNotes] = useState('Avoid scrubs. Use sunscreen every morning.');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleProduct = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pId => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const recommendedProducts = AVAILABLE_PRODUCTS.filter(p => selectedProductIds.includes(p.id));
  const totalPrice = recommendedProducts.reduce((acc, curr) => acc + curr.price, 0);

  const handleSubmit = async () => {
    const consultationId = consultation?.id;
    
    if (!consultationId) {
      alert('Error: Consultation ID is missing. Please select a consultation from the dashboard.');
      return;
    }

    if (selectedProductIds.length === 0) {
      alert('Please select at least one product for the routine.');
      return;
    }

    setSubmitting(true);

    try {
    // ✅ Using your dynamic API_BASE variable
    const response = await fetch(`${API_BASE}/admin/routines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: consultationId,
        consultation_id: consultationId,
        recommendedProducts,
        products: recommendedProducts,
        adminNotes,
        totalPrice
      })
    });

      const data = await response.json();
      if (data.success || response.ok) {
        setIsSubmitted(true);
        if (onRoutineSent) onRoutineSent();
      } else {
        alert('Failed to send routine: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error sending routine. Ensure backend server is running on port 5000.');
    } finally {
      setSubmitting(false);
    }
  };

  // ROUTINE SENT CONFIRMATION SCREEN
  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 flex flex-col items-center justify-center text-center font-sans shadow-lg rounded-2xl border border-gray-100 my-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Routine Sent!</h2>
        <p className="text-xs text-gray-500 mb-6 px-4">
          {consultation?.name ? consultation.name : 'The client'}'s routine has been saved successfully. They can now view their custom regimen and proceed to purchase.
        </p>

        <button
          onClick={onBack}
          className="w-full py-3 border border-[#e91e63] text-[#e91e63] rounded-xl font-semibold text-sm hover:bg-pink-50 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // CREATE ROUTINE FORM
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-md border border-gray-100 my-6 font-sans">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-xs text-gray-500 hover:underline flex items-center gap-1">
          &larr; Back to Details
        </button>
        <span className="text-xs text-gray-400 font-mono">Consultation #{consultation?.id || 'N/A'}</span>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-1">
        Create Routine {consultation?.name ? `for ${consultation.name}` : ''}
      </h2>
      <p className="text-xs text-gray-500 mb-6">Select products to recommend and add advice notes for the client.</p>

      {/* Select Products */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
            Select Products ({selectedProductIds.length})
          </label>
          <span className="text-xs font-semibold text-pink-600">
            Total: ₦{totalPrice.toLocaleString()}
          </span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {AVAILABLE_PRODUCTS.map((prod) => {
            const isChecked = selectedProductIds.includes(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => toggleProduct(prod.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-[#e91e63] bg-pink-50/40 text-[#c2185b]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent container click
                    className="accent-[#e91e63] h-4 w-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium block">{prod.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{prod.category}</span>
                  </div>
                </div>
                <span className="text-xs font-bold">₦{prod.price.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Notes */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
          Admin Notes & Usage Instructions
        </label>
        <textarea
          rows="3"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="e.g. Apply Vitamin C in the morning followed by Sunscreen..."
          className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:border-transparent"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || selectedProductIds.length === 0}
        className="w-full bg-[#e91e63] hover:bg-[#c2185b] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 shadow-md"
      >
        {submitting ? 'Sending Routine...' : `Send Routine • ₦${totalPrice.toLocaleString()}`}
      </button>
    </div>
  );
}