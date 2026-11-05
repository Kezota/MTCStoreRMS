import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  // Scroll the rows inside the table's own box. Put the Table in a
  // height-limited flex column; pair with a sticky TableHeader
  fitScreen?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, fitScreen = false, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    // Which sides still have hidden columns, to show a fade there
    const [more, setMore] = React.useState({ left: false, right: false })

    const updateMore = React.useCallback(() => {
      const el = scrollRef.current
      if (!el) return
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      setMore((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right }
      )
    }, [])

    React.useEffect(() => {
      const el = scrollRef.current
      if (!el) return
      updateMore()
      const observer = new ResizeObserver(updateMore)
      observer.observe(el)
      if (el.firstElementChild) observer.observe(el.firstElementChild)
      return () => observer.disconnect()
    }, [updateMore])

    return (
      <div
        className={cn(
          "relative w-full",
          fitScreen && "flex min-h-0 flex-1 flex-col"
        )}
      >
        <div
          ref={scrollRef}
          onScroll={updateMore}
          className={cn(
            "w-full overflow-auto",
            fitScreen && "min-h-0 flex-1 overscroll-contain"
          )}
        >
          <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
          />
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-slate-900/20 via-slate-900/5 to-transparent transition-opacity duration-200",
            more.left ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-slate-900/20 via-slate-900/5 to-transparent transition-opacity duration-200",
            more.right ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    )
  }
)
Table.displayName = "Table"

interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  // Keep the column names on top while the rows scroll (use with fitScreen)
  sticky?: boolean
}

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, sticky = false, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b",
      sticky &&
        "sticky top-0 z-10 [&_th]:bg-slate-50 [&_th]:shadow-[inset_0_-1px_0_#e2e8f0]",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 max-sm:h-8 px-2 max-sm:px-1.5 text-left align-middle font-medium text-muted-foreground whitespace-nowrap max-sm:text-[11px] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 max-sm:px-1.5 max-sm:py-1 align-middle whitespace-nowrap max-sm:text-[11px] max-sm:leading-tight max-sm:[&_.rounded]:px-1 max-sm:[&_.rounded]:py-0 max-sm:[&_.rounded]:text-[10px] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
