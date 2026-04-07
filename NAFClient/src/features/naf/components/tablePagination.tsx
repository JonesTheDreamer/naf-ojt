"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

function buildPages(
  current: number,
  total: number,
  siblings: number,
): (number | "...")[] {
  if (total <= 1) return [1];

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const pages: (number | "...")[] = [1];
  if (showLeftDots) pages.push("...");
  pages.push(...range(left, right));
  if (showRightDots) pages.push("...");
  if (total > 1) pages.push(total);

  return pages;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  siblingCount = 1,
}: TablePaginationProps) {
  const pages = buildPages(currentPage, totalPages, siblingCount);

  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="px-4 rounded-full text-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        {pages.map((page, idx) =>
          page === "..." ? (
            <Button
              key={`dots-${idx}`}
              variant="outline"
              size="sm"
              className="w-9 h-9 rounded-full text-sm pointer-events-none"
              disabled
            >
              ...
            </Button>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={cn(
                "w-9 h-9 rounded-full text-sm font-medium",
                page === currentPage
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                  : "hover:bg-muted",
              )}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          className="px-4 rounded-full text-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>

      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {firstItem}-{lastItem} of {totalCount} record
          {totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
