import React from 'react';
import { GuestSide } from '../../types';
import { Users } from 'lucide-react';

interface GuestSideClassificationBarProps {
  currentSide: 'all' | GuestSide;
  onSelectSide: (side: 'all' | GuestSide) => void;
  groomCount?: number;
  brideCount?: number;
  totalCount?: number;
}

export const GuestSideClassificationBar: React.FC<GuestSideClassificationBarProps> = ({
  currentSide,
  onSelectSide,
  groomCount,
  brideCount,
  totalCount,
}) => {
  return (
    <div className="bg-white border-b border-neutral-200/90 shadow-2xs py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span>طرف الدعوة</span>
        </div>

        {/* Classification Segmented Buttons */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200/80 w-full sm:w-auto shadow-2xs">
          {/* All */}
          <button
            onClick={() => onSelectSide('all')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentSide === 'all'
                ? 'bg-white text-neutral-900 shadow-xs ring-1 ring-neutral-200/60'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span>الكل</span>
            {totalCount !== undefined && (
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-700">
                {totalCount}
              </span>
            )}
          </button>

          {/* Groom's Guests */}
          <button
            onClick={() => onSelectSide('groom')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentSide === 'groom'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700'
                : 'text-blue-900 hover:bg-blue-100/60'
            }`}
          >
            <span className="text-sm">🤵</span>
            <span>ضيوف العريس</span>
            {groomCount !== undefined && (
              <span
                className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-md ${
                  currentSide === 'groom' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {groomCount}
              </span>
            )}
          </button>

          {/* Bride's Guests */}
          <button
            onClick={() => onSelectSide('bride')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentSide === 'bride'
                ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-700'
                : 'text-pink-900 hover:bg-pink-100/60'
            }`}
          >
            <span className="text-sm">👰</span>
            <span>ضيوف العروس</span>
            {brideCount !== undefined && (
              <span
                className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-md ${
                  currentSide === 'bride' ? 'bg-pink-700 text-white' : 'bg-pink-100 text-pink-800'
                }`}
              >
                {brideCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
