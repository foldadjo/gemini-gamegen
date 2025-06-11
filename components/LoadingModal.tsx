import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/loading.json';

interface LoadingModalProps {
  isLoading: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ isLoading }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="p-8 rounded-2xl flex flex-col items-center bg-gray-900/90">
          <div className="w-48 h-48">
            <Lottie animationData={loadingAnimation} loop={true} />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-4">
            {formatTime(elapsedTime)}
          </div>
          <p className="text-gray-300 mt-2">Generating your game...</p>
        </div>
      </div>
    </div>
  );
}; 