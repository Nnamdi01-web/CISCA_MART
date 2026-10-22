import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Camera, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const QUESTIONS = [
  {
    id: 'skin_type',
    title: 'What is your primary skin type?',
    subtitle: 'Select the option that best describes how your skin feels normally.',
    options: [
      { value: 'oily', label: 'Oily', desc: 'Shiny across face, enlarged pores' },
      { value: 'dry', label: 'Dry', desc: 'Tight feeling, flaky or rough patches' },
      { value: 'combination', label: 'Combination', desc: 'Oily T-zone, normal or dry cheeks' },
      { value: 'sensitive', label: 'Sensitive', desc: 'Easily irritated, prone to redness' },
      { value: 'normal', label: 'Normal', desc: 'Well-balanced, clear skin' },
    ],
  },
  {
    id: 'primary_concerns',
    title: 'What are your primary skin concerns?',
    subtitle: 'Select up to 3 concerns you want to address.',
    multiSelect: true,
    options: [
      { value: 'acne', label: 'Acne & Breakouts' },
      { value: 'hyperpigmentation', label: 'Dark Spots & Hyperpigmentation' },
      { value: 'aging', label: 'Fine Lines & Wrinkles' },
      { value: 'dullness', label: 'Dullness & Uneven Tone' },
      { value: 'redness', label: 'Rosacea & Redness' },
      { value: 'dehydration', label: 'Severe Dehydration' },
    ],
  },
  {
    id: 'current_routine',
    title: 'How complex is your current skincare routine?',
    subtitle: 'Help us understand what you are accustomed to daily.',
    options: [
      { value: 'minimal', label: 'Minimal', desc: 'Just cleanser and moisturizer (or nothing)' },
      { value: 'moderate', label: 'Moderate', desc: 'Cleanser, moisturizer, and sunscreen' },
      { value: 'advanced', label: 'Advanced', desc: 'Includes serums, exfoliants, and active ingredients' },
    ],
  },
  {
    id: 'sun_exposure',
    title: 'How much direct sun exposure do you get daily?',
    subtitle: 'Sun exposure heavily influences active treatment options.',
    options: [
      { value: 'low', label: 'Low', desc: 'Mostly indoors / work from home' },
      { value: 'moderate', label: 'Moderate', desc: '1–2 hours outdoors daily' },
      { value: 'high', label: 'High', desc: 'Outdoors frequently or direct sunlight' },
    ],
  },
  {
    id: 'sensitivity_level',
    title: 'How does your skin react to new products?',
    subtitle: 'Determines the concentration of active ingredients to recommend.',
    options: [
      { value: 'rarely', label: 'Rarely Reacts', desc: 'Can handle strong active ingredients' },
      { value: 'sometimes', label: 'Sometimes Tingles', desc: 'Needs gentle introduction' },
      { value: 'frequently', label: 'Highly Sensitive', desc: 'Prone to burning or rash easily' },
    ],
  },
];

export default function ConsultationFlow({ user, onComplete }) {
  const [step, setStep] = useState(-1); 
  const [answers, setAnswers] = useState({});
  
  // Single photo tracking
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentQ = QUESTIONS[step];

  const handleSelectOption = (value) => {
    if (currentQ?.multiSelect) {
      const currentList = answers[currentQ.id] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value].slice(0, 3);
      setAnswers({ ...answers, [currentQ.id]: updatedList });
    } else {
      setAnswers({ ...answers, [currentQ.id]: value });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitConsultation = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = 
        localStorage.getItem('ciscamart_token') || 
        localStorage.getItem('token') || 
        localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));

      // Append single photo across common fallback keys so Multer picks it up
      if (photo) {
        formData.append('front_photo', photo);
        formData.append('frontPhoto', photo);
        formData.append('photo', photo);
      }

      const res = await axios.post(`${API_BASE}/consultation`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = res.data.consultation || res.data.data || res.data;
      const consultationId = responseData.id || responseData._id || responseData.consultation_id;

      if (!consultationId) {
        throw new Error("Invalid consultation ID received from server.");
      }

      onComplete(consultationId);
    } catch (err) {
      console.error("Backend submit error:", err);
      setErrorMessage(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit consultation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-creamBg flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-roseBrand-100 p-8 space-y-6">
        
        {step >= 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400">
              <span>SKIN DIAGNOSIS CONSULTATION</span>
              <span>Step {step + 1} of {QUESTIONS.length + 1}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-roseBrand-500 h-full transition-all duration-300"
                style={{ width: `${((step + 1) / (QUESTIONS.length + 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* STEP -1: SPLASH SCREEN */}
        {step === -1 && (
          <div className="text-center space-y-6 py-4 animate-fadeIn">
            <div className="w-20 h-20 bg-roseBrand-50 text-roseBrand-500 rounded-full mx-auto flex items-center justify-center border border-roseBrand-100 shadow-inner">
              <Sparkles className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Personalized Skincare Consultation</h1>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                Answer 5 simple questions and upload a clear facial photo to receive a custom skincare routine curated by experts.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 font-medium pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-roseBrand-500" /> Takes 2 mins
              </span>
              <span>•</span>
              <span>1 Facial Photo</span>
              <span>•</span>
              <span>Expert Backed</span>
            </div>

            <button
              onClick={() => setStep(0)}
              className="w-full py-3.5 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-bold rounded-2xl text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Start Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* QUESTIONS (Steps 0 - 4) */}
        {step >= 0 && step < QUESTIONS.length && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentQ.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{currentQ.subtitle}</p>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = currentQ.multiSelect
                  ? (answers[currentQ.id] || []).includes(opt.value)
                  : answers[currentQ.id] === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-roseBrand-500 bg-roseBrand-50/50 ring-2 ring-roseBrand-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      {opt.desc && <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-roseBrand-500" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                disabled={!answers[currentQ.id] || (currentQ.multiSelect && answers[currentQ.id].length === 0)}
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SINGLE PHOTO UPLOAD (Step 5) */}
        {step === QUESTIONS.length && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Upload Your Photo</h2>
              <p className="text-xs text-gray-500">
                Upload a clear picture of your face with good lighting for precise skin analysis.
              </p>
            </div>

            <div className="border-2 border-dashed border-roseBrand-200 bg-roseBrand-50/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3">
              {preview ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-md">
                  <img src={preview} alt="Facial preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center border border-roseBrand-100">
                  <Camera className="w-8 h-8 text-roseBrand-500" />
                </div>
              )}

              <label className="cursor-pointer px-4 py-2 bg-white border border-roseBrand-200 text-roseBrand-600 font-semibold text-xs rounded-xl hover:bg-roseBrand-50 transition shadow-sm">
                <span>{photo ? 'Change Photo' : 'Choose Photo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleSubmitConsultation}
                disabled={isSubmitting || !photo}
                className="px-6 py-3 bg-roseBrand-500 hover:bg-roseBrand-600 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Generate My Routine'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}