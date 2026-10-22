import React from 'react';

const ProceedToBuy = ({ cartItems, setCartItems, onProceedToPayment }) => {
  const updateQuantity = (id, delta) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4 flex flex-col justify-between font-sans shadow-lg rounded-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800 text-center my-4">
          Everything in your routine
        </h1>

        <div className="space-y-3 my-6">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {/* Letter Avatar Fallback */}
                  <div className="w-12 h-12 rounded-lg border border-pink-100 bg-pink-50 flex items-center justify-center text-sm font-extrabold text-[#e91e63] shrink-0 shadow-sm">
                    {item.name ? item.name.charAt(0).toUpperCase() : '✨'}
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-800">{item.name}</h3>
                    <p className="text-xs font-bold text-[#e91e63]">
                      ₦{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 border rounded border-gray-300 flex items-center justify-center text-xs font-bold bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold w-4 text-center">
                    {item.quantity || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 border rounded border-gray-300 flex items-center justify-center text-xs font-bold bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 ml-1 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-xl font-bold text-gray-900">
            ₦{totalAmount.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-400 text-center mb-4">
          You can also remove or add products before checkout.
        </p>

        <button
          type="button"
          onClick={() => onProceedToPayment(totalAmount)}
          disabled={cartItems.length === 0}
          className="w-full py-3 bg-[#e91e63] text-white rounded-xl font-semibold text-sm hover:bg-[#c2185b] transition disabled:bg-gray-300 shadow-md cursor-pointer"
        >
          Proceed to Buy
        </button>
      </div>
    </div>
  );
};

export default ProceedToBuy;