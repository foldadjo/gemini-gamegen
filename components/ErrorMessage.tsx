
import React from 'react';
import { ExclamationTriangleIcon } from './icons/EditorIcons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 rounded-md shadow-lg" role="alert">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
        <div>
          <p className="font-bold">Error</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};
