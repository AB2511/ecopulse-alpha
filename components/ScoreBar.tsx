
import React from 'react';

interface ScoreBarProps {
  label: string;
  value: number;
  color: string;
  description: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ label, value, color, description }) => {
  const displayValue = Math.round(value);
  
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-base font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-600">{displayValue}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${displayValue}%` }}
        ></div>
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">{displayValue > 75 ? description : ''}</div>
    </div>
  );
};
