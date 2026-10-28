import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-botanical-mesh">
      <div className="w-16 h-16 rounded-2xl bg-[#D9FBEA] text-[#079669] border border-emerald-300 flex items-center justify-center mb-4 shadow-sm">
        <Sprout className="w-8 h-8" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18231D] tracking-tight">404 - Field Not Found</h1>
      <p className="text-sm text-[#647B6E] mt-2 max-w-md">
        The agricultural page you are looking for does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to AgriTech Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
