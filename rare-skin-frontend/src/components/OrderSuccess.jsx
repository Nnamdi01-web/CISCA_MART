import React from 'react';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';

export default function OrderSuccess({ reference, totalPrice, onBackHome }) {
  // Generate a clean display Order ID from the reference or a fallback
  const orderId = reference ? `#RSC${reference.slice(-5)}` : '#RSC1045';

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 text-center font-sans space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
        <p className="text-xs text-gray-500 mt-1">
          Thank you! Your order has been received.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left space-y-3 text-xs">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <span className="text-gray-500">Order ID:</span>
          <span className="font-bold text-gray-900">{orderId}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <span className="text-gray-500">Estimated Delivery:</span>
          <span className="font-semibold text-gray-800">2 – 3 days</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment Ref:</span>
          <span className="font-mono font-semibold text-gray-800">{reference}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Amount Paid:</span>
          <span className="font-bold text-pink-600">₦{Number(totalPrice).toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={() => alert("Your order is being prepared and will ship within 2-3 days!")}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4 text-pink-600" />
          <span>Track My Order</span>
        </button>

        <button
          onClick={onBackHome}
          className="w-full py-3 bg-[#e91e63] hover:bg-[#c2185b] text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
        >
          <span>Return to Home</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}