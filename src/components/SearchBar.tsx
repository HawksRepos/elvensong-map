import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function SearchBar({ value, onChange, resultCount, totalCount }: SearchBarProps) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 max-w-[90vw]">
      <div className="bg-dark-panel rounded-lg shadow-xl flex items-center px-3 sm:px-4 py-2 gap-2">
        <Search size={18} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-32 sm:w-64"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {value && (
        <div className="bg-dark-panel rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-400">
          {resultCount}/{totalCount}
        </div>
      )}
    </div>
  );
}
