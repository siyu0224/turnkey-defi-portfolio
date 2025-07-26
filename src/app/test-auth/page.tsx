"use client";

import { useState } from 'react';
import ImprovedAuthModal from '@/components/ImprovedAuthModal';

export default function TestAuthPage() {
  const [showModal, setShowModal] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Test Authentication</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Open Auth Modal
        </button>
      </div>
      
      <ImprovedAuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAuthSuccess={() => {
          alert('Authentication successful!');
          setShowModal(false);
        }}
      />
    </div>
  );
}