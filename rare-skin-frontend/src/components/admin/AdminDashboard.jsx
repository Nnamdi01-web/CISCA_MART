import React, { useState, useEffect } from 'react';

export const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

export default function AdminDashboard({ onSelectConsultation, products = [], onRefreshProducts }) {
  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' | 'products'
  const [stats, setStats] = useState({ pending: 0, completed: 0, totalOrders: 0, totalSales: 0 });
  const [consultations, setConsultations] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Product Management Form State
  const [productForm, setProductForm] = useState({ id: null, name: '', price: '', category: '', description: '' });
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/admin/consultations`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      if (data.success || Array.isArray(data.consultations)) {
        setStats(data.stats || { pending: 0, completed: 0, totalOrders: 0, totalSales: 0 });
        setConsultations(data.consultations || []);
      } else {
        setErrorMessage(data.error || 'Failed to fetch consultations.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMessage(`Could not connect to server at ${API_BASE}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedConsult(item);
    setSelectedProducts([]);
    setAdminNotes('');
    setSuccessMessage(null);
    if (onSelectConsultation) onSelectConsultation(item);
  };

  const toggleProduct = (prod) => {
    if (selectedProducts.find((p) => p.id === prod.id)) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== prod.id));
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  const handleSendRoutine = async () => {
    if (!selectedConsult) return;
    setSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/admin/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: selectedConsult.id,
          products: selectedProducts,
          adminNotes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Routine successfully created and sent to customer!');
        setSelectedConsult(null);
        fetchConsultations();
      } else {
        setErrorMessage(data.error || 'Failed to save routine.');
      }
    } catch (err) {
      setErrorMessage('Error sending routine to server.');
    } finally {
      setSaving(false);
    }
  };

  // --- PRODUCT MANAGEMENT HANDLERS ---
  const handleEditProductClick = (prod) => {
    setProductForm({
      id: prod.id,
      name: prod.name || '',
      price: prod.price || '',
      category: prod.category || '',
      description: prod.description || ''
    });
    setIsEditingProduct(true);
  };

  const resetProductForm = () => {
    setProductForm({ id: null, name: '', price: '', category: '', description: '' });
    setIsEditingProduct(false);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const url = isEditingProduct 
      ? `${API_BASE}/products/${productForm.id}`
      : `${API_BASE}/products`;
    
    const method = isEditingProduct ? 'PUT' : 'POST';

    const token = localStorage.getItem('ciscamart_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(productForm)
      });
      const data = await response.json();

      if (response.ok || data.success) {
        setSuccessMessage(isEditingProduct ? 'Product price & details updated!' : 'New product added!');
        resetProductForm();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        setErrorMessage(data.error || data.message || 'Failed to save product.');
      }
    } catch (err) {
      setErrorMessage('Error connecting to product server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Manage consultations, products & pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('consultations')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeTab === 'consultations' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            📋 Consultations
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeTab === 'products' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            🏷️ Products & Prices
          </button>
          <button
            onClick={fetchConsultations}
            className="text-xs bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full font-medium hover:bg-pink-200 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Pending Consults</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Completed Consults</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800">₦{(stats.totalSales || 0).toLocaleString()}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-medium">
          ✅ {successMessage}
        </div>
      )}

      {/* --- TAB 1: CONSULTATIONS TAB --- */}
      {activeTab === 'consultations' && (
        <>
          {/* Detail Review Modal / View */}
          {selectedConsult && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h2 className="text-lg font-bold text-gray-800">
                  Reviewing Consultation #{selectedConsult.id}
                </h2>
                <button
                  onClick={() => setSelectedConsult(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-bold"
                >
                  ✕ Close Detail
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Skin Type</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize mb-3">
                    {selectedConsult.skin_type || selectedConsult.answers?.skin_type || 'N/A'}
                  </p>

                  <p className="text-xs font-bold text-gray-500 uppercase">Client Answers</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 max-h-40 overflow-y-auto mt-1">
                    <pre className="whitespace-pre-wrap font-sans">
                      {typeof selectedConsult.answers === 'object'
                        ? JSON.stringify(selectedConsult.answers, null, 2)
                        : selectedConsult.answers || 'No additional details provided'}
                    </pre>
                  </div>
                </div>

                {(selectedConsult.photo_url || selectedConsult.front_photo_url || selectedConsult.left_photo_url) && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Submitted Photo</p>
                    <img
                      src={selectedConsult.photo_url || selectedConsult.front_photo_url || selectedConsult.left_photo_url}
                      alt="Skin consultation"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* Product Recommendation Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Select Recommended Products</h3>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No inventory products supplied to view.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {products.map((prod) => {
                      const isSelected = selectedProducts.some((p) => p.id === prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => toggleProduct(prod)}
                          className={`p-2 rounded-lg text-left text-xs border transition-all ${
                            isSelected
                              ? 'border-pink-600 bg-pink-50 text-pink-900 font-semibold'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <p>{prod.name}</p>
                          <p className="text-gray-500">₦{Number(prod.price).toLocaleString()}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prescription Notes</label>
                  <textarea
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="How should the client apply these products?"
                    className="w-full text-xs p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <button
                  onClick={handleSendRoutine}
                  disabled={saving}
                  className="w-full bg-[#e91e63] hover:bg-[#c2185b] text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                >
                  {saving ? 'Sending Routine...' : 'Send Routine to Client'}
                </button>
              </div>
            </div>
          )}

          {/* Consultations Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Consultations</h2>

            {loading ? (
              <p className="text-gray-500 text-center py-4 text-xs">Loading consultations...</p>
            ) : consultations.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-xs">No consultations found in database.</p>
            ) : (
              <div className="space-y-3">
                {consultations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-pink-50/30 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Client #{item.id || item.user_id}</p>
                      <p className="text-xs text-gray-400">
                        Skin Type: <span className="capitalize">{item.skin_type || item.answers?.skin_type || 'N/A'}</span> • 
                        Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          item.status === 'Completed' || item.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.status || 'Pending'}
                      </span>
                      <button
                        onClick={() => handleSelect(item)}
                        className="bg-[#e91e63] hover:bg-[#c2185b] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- TAB 2: PRODUCTS & PRICING TAB --- */}
      {activeTab === 'products' && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Form: Add or Edit Product */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm md:col-span-1">
            <h2 className="text-sm font-bold text-gray-800 mb-3">
              {isEditingProduct ? '✏️ Update Product Price' : '➕ Add New Product'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Hydrating Cleanser"
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price (₦)</label>
                <input
                  type="number"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="e.g. 15000"
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="e.g. Serums, Cleansers"
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Brief product usage..."
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : isEditingProduct ? 'Update Price' : 'Add Product'}
                </button>
                {isEditingProduct && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Product Inventory List */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Product Inventory ({products.length})</h2>
            {products.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No products currently in inventory.</p>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{prod.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {prod.category || 'General'} • ₦{Number(prod.price).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditProductClick(prod)}
                      className="text-xs text-pink-600 hover:text-pink-800 border border-pink-200 bg-pink-50 px-2.5 py-1 rounded-md font-medium"
                    >
                      ✏️ Edit Price
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}