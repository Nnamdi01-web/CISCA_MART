import React, { useState, useEffect } from 'react';

export default function ViewRoutine({ consultationId, onProceedToBuy }) {
  const [routineData, setRoutineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhyModal, setShowWhyModal] = useState(false);

  // Business support phone number (Format: 234XXXXXXXXXX)
  const SUPPORT_WHATSAPP = '2348107005498'; 

  useEffect(() => {
    fetchRoutine();
  }, [consultationId]);

  const fetchRoutine = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/routines/${consultationId}`);
      const data = await response.json();
      if (data.success) {
        setRoutineData(data.routine);
      }
    } catch (err) {
      console.error("Failed to load routine", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6 flex items-center justify-center font-sans">
        <p className="text-sm font-medium text-gray-500">Loading your routine...</p>
      </div>
    );
  }

  const products = typeof routineData?.products === 'string' 
    ? JSON.parse(routineData.products) 
    : (routineData?.products || []);

  const totalPrice = products.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleNeedHelp = () => {
    const text = encodeURIComponent(`Hello Rare Skin Consult! I have a question about my consultation routine (ID: #${consultationId}).`);
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4 flex flex-col justify-between font-sans shadow-lg rounded-2xl border border-gray-100 relative">
      <div>
        {/* Header */}
        <div className="text-center my-4">
          <h1 className="text-xl font-bold text-gray-800">Your Personalized Routine</h1>
          <p className="text-xs text-[#e91e63] font-medium mt-1">
            Prepared by Rare Skin Consult by Cisca Mart ✨
          </p>
        </div>

        {/* Admin Advice / Notes */}
        {routineData?.admin_notes && (
          <div className="bg-[#fce4ec] border border-pink-200 p-3 rounded-xl mb-4 text-xs text-[#c2185b]">
            <span className="font-bold">Admin Note: </span>"{routineData.admin_notes}"
          </div>
        )}

        {/* Products List */}
        <div className="space-y-3 my-4">
          {products.map((item, index) => {
            const imgSrc = getImageUrl(item.image_url);

            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {imgSrc ? (
                  <img 
                    src={imgSrc} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-white"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}

                <div 
                  className="w-12 h-12 rounded-lg border border-pink-100 bg-pink-50 flex items-center justify-center text-xs font-bold text-[#e91e63] shrink-0"
                  style={{ display: imgSrc ? 'none' : 'flex' }}
                >
                  {item.name ? item.name.charAt(0).toUpperCase() : '✨'}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-800">
                    {index + 1}. {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.description || item.category || 'Protects and repairs your skin barrier.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => setShowWhyModal(true)}
          className="w-full text-center text-xs text-[#e91e63] font-medium py-1 hover:underline"
        >
          Why these products?
        </button>
      </div>

      {/* Footer / Action */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500 text-sm font-medium">Total</span>
          <span className="text-xl font-bold text-gray-900">₦{totalPrice.toLocaleString()}</span>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleNeedHelp}
            className="flex-1 py-3 border border-[#e91e63] text-[#e91e63] rounded-xl font-semibold text-sm hover:bg-pink-50 transition"
          >
            Need help?
          </button>
          <button 
            onClick={() => onProceedToBuy && onProceedToBuy(products, totalPrice)}
            className="flex-1 py-3 bg-[#e91e63] text-white rounded-xl font-semibold text-sm hover:bg-[#c2185b] transition shadow-md"
          >
            Proceed to Buy
          </button>
        </div>
      </div>

      {/* "Why these products" Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">Why These Products?</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our estheticians carefully selected this routine based on your submitted skin type and specific concerns. These formulas work synergistically to repair your barrier, manage breakouts, and boost natural radiance safely.
            </p>
            <button 
              onClick={() => setShowWhyModal(false)}
              className="w-full py-2.5 bg-[#e91e63] text-white font-semibold text-xs rounded-xl hover:bg-[#c2185b]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}