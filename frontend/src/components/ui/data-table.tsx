'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDirection,
  onSort,
  emptyMessage = 'No data available',
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`border border-border rounded-sm overflow-hidden bg-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}
                    ${col.width ? '' : ''}
                  `}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 px-3 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`
                        py-2.5 px-3 whitespace-nowrap
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                      `}
                    >
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
