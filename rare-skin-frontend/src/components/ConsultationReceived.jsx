import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import ViewRoutine from './ViewRoutine';
import { API_BASE } from '../api';

export default function ConsultationReceived({ consultationId, onBackHome, onProceedToBuy }) {
  const [status, setStatus] = useState('Under Review');
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    // SAFEGUARD: Deeply extract the raw ID string/number if an object or nested object was passed
    let actualId = consultationId;
    if (typeof consultationId === 'object' && consultationId !== null) {
      actualId = consultationId.id || consultationId._id || consultationId.consultation_id || consultationId.consultationId;
    }
    if (typeof actualId === 'object' && actualId !== null) {
      actualId = actualId.id || actualId.consultation_id || null;
    }

    if (!actualId) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/consultations/${actualId}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();

      const consultationData = data.consultation || data;

      if (consultationData && consultationData.status) {
        const currentStatus = consultationData.status;
        setStatus(currentStatus);

        // Flexible check for completed or reviewed statuses (case-insensitive)
        const normalizedStatus = currentStatus.toLowerCase();
        if (
          normalizedStatus.includes('completed') || 
          normalizedStatus.includes('ready') || 
          normalizedStatus.includes('paid') || 
          normalizedStatus.includes('reviewed')
        ) {
          const routineRes = await fetch(`${API_BASE}/routines/${actualId}`);
          if (routineRes.ok) {
            const routineData = await routineRes.json();
            setRoutine(routineData.routine || routineData);
          } else {
            setRoutine({ products: [], notes: 'Your personalized routine is ready!' });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching consultation status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [consultationId]);

  const normalizedStatus = status.toLowerCase();
  if (
    (normalizedStatus.includes('completed') || 
     normalizedStatus.includes('ready') || 
     normalizedStatus.includes('paid') || 
     normalizedStatus.includes('reviewed')) && 
    routine
  ) {
    return (
      <ViewRoutine 
        consultationId={consultationId} 
        onProceedToBuy={onProceedToBuy} 
      />
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm text-center border border-gray-100 font-sans">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
      <p className="text-gray-600 text-xs leading-relaxed mb-6">
        Your consultation has been received. Our skincare team will review your answers and prepare your personalized routine.
      </p>

      <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 mb-6 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Status</span>
        </div>
        <p className="text-sm font-semibold text-amber-900 mb-2">
          {loading ? 'Checking Status...' : status}
        </p>
        <div className="flex items-center text-xs text-amber-700 gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Estimated review: Within 24 hours</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="w-full py-3 bg-[#e91e63] hover:bg-[#c2185b] text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>

        {onBackHome && (
          <button
            onClick={onBackHome}
            className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 transition"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}