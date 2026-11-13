import React, { useState } from 'react';
import { API_BASE } from '../api';

export default function ConsultationDetail({ consultation, onProceedToRoutine, onBack }) {
  const [activeTab, setActiveTab] = useState('answers'); // 'answers' or 'photos'

  if (!consultation) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-md text-center my-6">
        <p className="text-gray-500 text-sm">No consultation selected.</p>
        <button onClick={onBack} className="mt-4 text-xs text-pink-600 font-semibold hover:underline">
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  // Safely parse JSON answers if stored as a string, with fallback to flat consultation properties
  let answers = consultation.answers || {};
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch (e) {
      answers = {};
    }
  }

  // Extract photo paths directly from consultation join or fallback answers
  const frontPhoto = consultation.front_photo_url || consultation.photo_url || consultation.image_url || answers.front_photo_url || answers.photo_url;
  const leftPhoto = consultation.left_photo_url || answers.left_photo_url;
  const rightPhoto = consultation.right_photo_url || answers.right_photo_url;

  const hasAnyPhotos = frontPhoto || leftPhoto || rightPhoto;

  // Helper to ensure image URLs point to the correct backend server instead of relative paths
  const getPhotoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    // Extract root domain from API_BASE (e.g., changing https://backend.onrender.com/api to https://backend.onrender.com)
    const rootBackend = API_BASE.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${rootBackend}${cleanPath}`;
  };

  // Helper to format array or string values cleanly
  const formatValue = (val, fallback = 'None specified') => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : fallback;
    return val;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md border border-gray-100 my-6 font-sans">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-xs text-gray-500 hover:underline flex items-center gap-1">
          &larr; Back to Dashboard
        </button>
        <span className="text-xs font-mono text-gray-400">ID: #{consultation.id || 'N/A'}</span>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-1">Consultation Details</h2>
      <p className="text-xs text-gray-500 mb-4">Review answers and uploaded facial angles before building a custom routine.</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('answers')}
          className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'answers'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Answers
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'photos'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Photos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'answers' ? (
        <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Skin Type</p>
            <p className="font-semibold text-gray-800 capitalize">
              {formatValue(consultation.skin_type || answers.skin_type || answers.skinType)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Primary Skin Concerns</p>
            <p className="font-semibold text-gray-800 capitalize">
              {formatValue(consultation.skin_concern || answers.primary_concerns || answers.concern || answers.concerns)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Routine Complexity</p>
            <p className="font-semibold text-gray-800 capitalize">
              {formatValue(consultation.current_routine || answers.current_routine || answers.currentProducts)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Daily Sun Exposure</p>
            <p className="font-semibold text-gray-800 capitalize">
              {formatValue(consultation.concern_duration || consultation.sun_exposure || answers.sun_exposure)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Skin Sensitivity Level</p>
            <p className="font-semibold text-gray-800 capitalize">
              {formatValue(consultation.allergies || consultation.sensitivity_level || answers.sensitivity_level)}
            </p>
          </div>
        </div>
      ) : (
        <div className="py-4 bg-gray-50 rounded-xl border border-gray-100 p-4">
          {hasAnyPhotos ? (
            <div className="flex flex-wrap justify-center gap-6">
              {/* Front Photo */}
              {frontPhoto && (
                <div className="flex flex-col items-center gap-1.5 max-w-xs w-full">
                  <p className="text-xs font-bold text-gray-600">Front View</p>
                  <img 
                    src={getPhotoUrl(frontPhoto)} 
                    alt="Front View" 
                    className="h-64 w-full rounded-xl border border-gray-200 object-cover shadow-sm"
                  />
                </div>
              )}

              {/* Left Photo (Only shows if uploaded) */}
              {leftPhoto && (
                <div className="flex flex-col items-center gap-1.5 max-w-xs w-full">
                  <p className="text-xs font-bold text-gray-600">Left Profile</p>
                  <img 
                    src={getPhotoUrl(leftPhoto)} 
                    alt="Left Profile" 
                    className="h-64 w-full rounded-xl border border-gray-200 object-cover shadow-sm"
                  />
                </div>
              )}

              {/* Right Photo (Only shows if uploaded) */}
              {rightPhoto && (
                <div className="flex flex-col items-center gap-1.5 max-w-xs w-full">
                  <p className="text-xs font-bold text-gray-600">Right Profile</p>
                  <img 
                    src={getPhotoUrl(rightPhoto)} 
                    alt="Right Profile" 
                    className="h-64 w-full rounded-xl border border-gray-200 object-cover shadow-sm"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">No facial photos were uploaded for this consultation.</p>
          )}
        </div>
      )}

      <button
        onClick={() => onProceedToRoutine(consultation)}
        className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md"
      >
        Create Routine &rarr;
      </button>
    </div>
  );
}