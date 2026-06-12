import { useState } from 'react';

interface UsePaginationResult {
  currentPage: number;
  perPage: number;
  setCurrentPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  resetPage: () => void;
}

/**
 * Custom hook for pagination
 * @param initialPage - Initial page number (default: 1)
 * @param initialPerPage - Initial items per page (default: 10)
 * @returns Pagination state and methods
 */
export function usePagination(
  initialPage: number = 1,
  initialPerPage: number = 10
): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, page));
  };

  const resetPage = () => {
    setCurrentPage(initialPage);
  };

  return {
    currentPage,
    perPage,
    setCurrentPage,
    setPerPage,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
  };
}
