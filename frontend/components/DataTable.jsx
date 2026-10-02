import React from 'react';
import EmptyState from './EmptyState';

/**
 * Reusable DataTable component with accessibility support
 * @param {{
 *   columns: Array<{
 *     header: string,
 *     accessor: string | ((row: any, index: number) => React.ReactNode),
 *     align?: 'left' | 'center' | 'right',
 *     width?: string
 *   }>,
 *   data: Array<any>,
 *   keyField?: string,
 *   emptyTitle?: string,
 *   emptyText?: string,
 *   loading?: boolean,
 *   className?: string
 * }} props
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  emptyTitle = 'No records found',
  emptyText = 'There are no items matching this criteria.',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className="table-loading-container" role="status" aria-live="polite">
        <div className="skeleton-bar" style={{ height: 44, marginBottom: 8 }} />
        <div className="skeleton-bar" style={{ height: 48, marginBottom: 8 }} />
        <div className="skeleton-bar" style={{ height: 48, marginBottom: 8 }} />
        <span className="sr-only">Loading table records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <div
      className={`table-container ${className}`.trim()}
      tabIndex={0}
      role="region"
      aria-label="Data Table"
    >
      <table className="shopeers-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => {
            const rowKey = row[keyField] || row._id || rowIdx;
            return (
              <tr key={rowKey}>
                {columns.map((col, colIdx) => {
                  let content = null;
                  if (typeof col.accessor === 'function') {
                    content = col.accessor(row, rowIdx);
                  } else if (typeof col.accessor === 'string') {
                    content = row[col.accessor];
                  }
                  return (
                    <td
                      key={colIdx}
                      style={{
                        textAlign: col.align || 'left',
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
