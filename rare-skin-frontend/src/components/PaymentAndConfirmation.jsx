import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';

const PaymentAndConfirmation = ({ 
  consultationId, 
  customerEmail, 
  totalAmount, 
  items = [], 
  onOrderSuccess 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fallback to localStorage user data if customerEmail prop is missing
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const activeEmail = customerEmail || storedUser.email || 'customer@example.com';

  // Ensure amount is valid and converted to Kobo for Paystack
  const cleanAmount = Number(totalAmount) || 0;

  const config = {
    reference: `RSC_${new Date().getTime()}`,
    email: activeEmail,
    amount: cleanAmount * 100, // Amount in Kobo
    publicKey: 'pk_test_faa7c2f6496f98fe8962434bcd84d4c92e43a2b1', 
  };

  const initializePayment = usePaystackPayment(config);

  // Function to save the order to backend /api/orders
  const saveOrderToBackend = async (paymentRef) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

// ✅ Updated to use your dynamic API_BASE variable
const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          total_amount: cleanAmount, // Sends the exact dynamic amount, not hardcoded!
          customer_email: activeEmail,
          items: items.map(item => ({
            product_id: item.id || item.product_id,
            quantity: item.quantity || 1,
            price: item.price
          })),
          payment_reference: paymentRef
        })
      });

      const data = await response.json();

      if (response.ok) {
        const confirmation = {
          orderId: data.order?.id ? `#RSC${data.order.id}` : `#RSC${Math.floor(1000 + Math.random() * 9000)}`,
          estimatedDelivery: '2 – 3 days',
          reference: paymentRef,
        };
        setOrderDetails(confirmation);
        setIsOrderConfirmed(true);
        if (onOrderSuccess) onOrderSuccess(confirmation);
      } else {
        alert('Failed to process order: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      console.error('Order saving error:', err);
      alert('Network error while saving order.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (reference) => {
    saveOrderToBackend(reference.reference);
  };

  const handleClose = () => {
    alert('Payment process was cancelled.');
  };

  const handlePayment = () => {
    if (cleanAmount <= 0) {
      alert('Your cart amount is invalid or zero.');
      return;
    }
    if (selectedMethod === 'paystack') {
      initializePayment(handleSuccess, handleClose);
    } else {
      saveOrderToBackend('MANUAL_BANK_TRANSFER_' + Date.now());
    }
  };

  // Screen 9B: Order Confirmed
  if (isOrderConfirmed && orderDetails) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-6 flex flex-col items-center justify-center text-center font-sans shadow-lg rounded-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-2xl mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-800">Thank you!</h2>
        <p className="text-sm text-gray-500 mb-6">Your order has been received.</p>

        <div className="w-full bg-gray-50 p-4 rounded-xl mb-6 space-y-2 border border-gray-100 text-left">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Order ID</span>
            <span className="font-bold text-gray-800">{orderDetails.orderId}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Amount Paid</span>
            <span className="font-bold text-pink-600">₦{cleanAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Estimated Delivery</span>
            <span className="font-bold text-gray-800">{orderDetails.estimatedDelivery}</span>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="w-full py-3 bg-[#e91e63] text-white rounded-xl font-semibold text-sm hover:bg-[#c2185b] transition shadow-md"
        >
          Track My Order
        </button>
      </div>
    );
  }

  // Screen 9A: Choose Payment
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4 flex flex-col justify-between font-sans shadow-lg rounded-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800 text-center my-4">Payment</h1>
        <p className="text-xs text-gray-500 text-center mb-2">Choose a payment method</p>
        <div className="text-center mb-6">
          <span className="text-xs text-gray-400">Total to Pay: </span>
          <span className="text-base font-bold text-pink-600">₦{cleanAmount.toLocaleString()}</span>
        </div>

        <div className="space-y-3">
          <label
            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
              selectedMethod === 'paystack'
                ? 'border-[#e91e63] bg-pink-50/30'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === 'paystack'}
                onChange={() => setSelectedMethod('paystack')}
                className="accent-[#e91e63]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Pay with Paystack</p>
                <p className="text-xs text-gray-400">(Card, USSD, Bank)</p>
              </div>
            </div>
            <span className="text-blue-600 font-bold text-xs">paystack</span>
          </label>

          <label
            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
              selectedMethod === 'bank'
                ? 'border-[#e91e63] bg-pink-50/30'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === 'bank'}
                onChange={() => setSelectedMethod('bank')}
                className="accent-[#e91e63]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Bank Transfer</p>
                <p className="text-xs text-gray-400">(Manual)</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm">🏦</span>
          </label>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-3 bg-[#e91e63] text-white rounded-xl font-semibold text-sm hover:bg-[#c2185b] transition shadow-md disabled:opacity-50"
      >
        {loading ? 'Processing Order...' : `Pay ₦${cleanAmount.toLocaleString()}`}
      </button>
    </div>
  );
};

export default PaymentAndConfirmation;