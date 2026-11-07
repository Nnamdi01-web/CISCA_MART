import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import AuthScreens from './components/AuthScreens';
import ConsultationFlow from './components/ConsultationFlow';
import ConsultationReceived from './components/ConsultationReceived';
import ProceedToBuy from './components/ProceedToBuy';
import OrderSuccess from './components/OrderSuccess';
import AdminDashboard from './components/admin/AdminDashboard';
import ConsultationDetail from './components/admin/ConsultationDetail';
import CreateRoutine from './components/admin/CreateRoutine';

function PaystackCheckoutButton({ amount, email = 'customer@example.com', onSuccess, onClose }) {
  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount * 100,
    publicKey: 'pk_test_faa7c2f6496f98fe8962434bcd84d4c92e43a2b1',
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full py-3 bg-[#e91e63] text-white font-bold rounded-xl text-sm hover:bg-[#c2185b] shadow-md transition"
    >
      Pay via Paystack
    </button>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ciscamart_token'));
  const [user, setUser] = useState(null);

  const [activeConsultationId, setActiveConsultationId] = useState(() => {
    return localStorage.getItem('activeConsultationId') || null;
  });

  const [view, setView] = useState(() => {
    return localStorage.getItem('activeConsultationId') ? 'customer-received' : 'customer-flow';
  });

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [sessionKey, setSessionKey] = useState(Date.now());
  const [checkoutData, setCheckoutData] = useState({ products: [], totalPrice: 0 });

  useEffect(() => {
    if (activeConsultationId) {
      localStorage.setItem('activeConsultationId', activeConsultationId);
    } else {
      localStorage.removeItem('activeConsultationId');
    }
  }, [activeConsultationId]);

  const handleAuthSuccess = (userData) => {
    setToken(localStorage.getItem('ciscamart_token'));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('ciscamart_token');
    localStorage.removeItem('activeConsultationId');
    setToken(null);
    setUser(null);
    setView('customer-flow');
  };

  const handleConsultationComplete = (consultationData) => {
    const id = consultationData?.id || consultationData;
    setActiveConsultationId(id);
    setView('customer-received');
  };

  const handleProceedToBuy = (products, totalPrice) => {
    setCheckoutData({ products, totalPrice });
    setView('customer-checkout');
  };

  const handleSelectConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    setActiveConsultationId(consultation.id);
    setView('admin-detail');
  };

  const handleProceedToRoutine = (consultation) => {
    setSelectedConsultation(consultation);
    setActiveConsultationId(consultation.id);
    setView('admin-create');
  };

  const handleRoutineSent = () => {
    setView('admin-dashboard');
  };
const handlePaymentSuccess = async (reference) => {
    setPaymentRef(reference.reference);

    // Make sure this line is added so it knows whether to use Render or localhost
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      // ✅ Now using the dynamic variable instead of hardcoded localhost
      await fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // (Make sure to include your body data or closing code here depending on the rest of your function)
        body: JSON.stringify({
          reference: reference.reference,
          consultationId: activeConsultationId,
          amount: checkoutData.totalPrice,
        }),
      });
    } catch (err) {
      console.error('Error saving payment to database:', err);
    }

    setView('order-success');
  };

  const handlePaymentClose = () => {
    console.log('Payment modal closed');
  };

  const handleReturnHome = () => {
    setActiveConsultationId(null);
    setSelectedConsultation(null);
    setPaymentRef('');
    setCheckoutData({ products: [], totalPrice: 0 });
    localStorage.removeItem('activeConsultationId');
    setSessionKey(Date.now());
    setView('customer-flow');
  };

  if (!token) {
    return <AuthScreens onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center text-xs">
        <span className="font-semibold text-pink-400">Rare Skin Consult App</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setView(activeConsultationId ? 'customer-received' : 'customer-flow')}
              className={`px-3 py-1 rounded transition-colors ${
                view.startsWith('customer') || view === 'order-success' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Customer View
            </button>
            <button
              onClick={() => setView('admin-dashboard')}
              className={`px-3 py-1 rounded transition-colors ${
                view.startsWith('admin') ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Admin View
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition font-semibold"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="p-4">
        {view === 'customer-flow' && (
          <ConsultationFlow 
            key={sessionKey} 
            onComplete={handleConsultationComplete} 
          />
        )}

        {view === 'customer-received' && (
          <ConsultationReceived 
            consultationId={activeConsultationId || selectedConsultation?.id} 
            onBackHome={handleReturnHome}
            onProceedToBuy={handleProceedToBuy}
          />
        )}

        {view === 'customer-checkout' && (
          <ProceedToBuy
            cartItems={checkoutData.products}
            setCartItems={(updater) => {
              setCheckoutData((prev) => {
                const updatedProducts = typeof updater === 'function' ? updater(prev.products) : updater;
                const newTotal = updatedProducts.reduce(
                  (acc, item) => acc + Number(item.price || 0) * (item.quantity || 1),
                  0
                );
                return { ...prev, products: updatedProducts, totalPrice: newTotal };
              });
            }}
            onProceedToPayment={() => setView('customer-paystack-gateway')}
          />
        )}

        {view === 'customer-paystack-gateway' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 font-sans space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <button 
                onClick={() => setView('customer-checkout')}
                className="text-xs text-pink-600 font-semibold hover:underline"
              >
                ← Back to Cart
              </button>
              <h2 className="font-bold text-gray-800">Secure Payment</h2>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
              <p className="text-xs text-gray-500">Total Amount Due</p>
              <p className="text-2xl font-extrabold text-[#e91e63]">₦{checkoutData.totalPrice.toLocaleString()}</p>
            </div>

            <PaystackCheckoutButton 
              amount={checkoutData.totalPrice} 
              onSuccess={handlePaymentSuccess} 
              onClose={handlePaymentClose} 
            />
          </div>
        )}

        {view === 'order-success' && (
          <OrderSuccess 
            reference={paymentRef} 
            totalPrice={checkoutData.totalPrice} 
            onBackHome={handleReturnHome} 
          />
        )}

        {view === 'admin-dashboard' && (
          <AdminDashboard onSelectConsultation={handleSelectConsultation} />
        )}

        {view === 'admin-detail' && selectedConsultation && (
          <ConsultationDetail
            consultation={selectedConsultation}
            onProceedToRoutine={handleProceedToRoutine}
            onBack={() => setView('admin-dashboard')}
          />
        )}

        {view === 'admin-create' && selectedConsultation && (
          <CreateRoutine
            consultation={selectedConsultation}
            onRoutineSent={handleRoutineSent}
            onBack={() => setView('admin-detail')}
          />
        )}
      </main>
    </div>
  );
}