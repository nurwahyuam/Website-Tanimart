import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const visiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const sidePages = 2;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - sidePages);
      const end = Math.min(totalPages, currentPage + sidePages);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 pt-3 sm:px-6">
      <p className="text-sm text-gray-700">
        Showing page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </p>

      <nav className="flex items-center space-x-1" aria-label="Pagination">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-7 w-7 flex items-center justify-center border rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Pages */}
        {visiblePages().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`h-7 w-7 flex items-center justify-center border rounded text-sm font-medium ${
                page === currentPage
                  ? "bg-indigo-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="h-7 w-7 flex items-center justify-center text-sm text-gray-500"
            >
              ...
            </span>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-7 w-7 flex items-center justify-center border rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
