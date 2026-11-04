import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortField } from "@/lib/sort";

interface SortableTableHeadProps {
  field: string;
  sorts: SortField[];
  onSort: (field: string) => void;
  children: ReactNode;
  className?: string;
  // True while the newly sorted rows are still loading from the server
  loading?: boolean;
}

export const SortableTableHead = ({
  field,
  sorts,
  onSort,
  children,
  className,
  loading = false,
}: SortableTableHeadProps) => {
  const index = sorts.findIndex((s) => s.field === field);
  const active = index !== -1 ? sorts[index] : undefined;

  return (
    <TableHead
      className={cn("p-0", className)}
      aria-sort={
        index === 0
          ? active?.order === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title="Klik untuk urutkan"
        className={cn(
          "flex h-full w-full items-center gap-1 px-2 py-2 text-left font-medium transition hover:bg-slate-100 hover:text-slate-900",
          index === 0 && "text-blue-700",
        )}
      >
        <span>{children}</span>
        {loading && index === 0 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
        ) : active ? (
          <span className="inline-flex items-center text-blue-600">
            {active.order === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            {sorts.length > 1 && (
              <span className="text-[10px] font-semibold">{index + 1}</span>
            )}
          </span>
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
};
