import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import type { PagedRequest, PagedResponse } from '../api';
import './PagedGrid.css';

export interface PagedGridColumn<T> {
  key: string;
  label: string;
  sortKey?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
}

interface PagedGridProps<T> {
  columns: PagedGridColumn<T>[];
  fetchPage: (request: PagedRequest) => Promise<PagedResponse<T>>;
  rowKey: (row: T) => string | number;
  searchPlaceholder?: string;
  emptyText?: string;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSizeOptions?: number[];
  refreshKey?: string | number;
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  actionsLabel?: string;
}

export function PagedGrid<T>({
  columns,
  fetchPage,
  rowKey,
  searchPlaceholder = 'Listede ara...',
  emptyText = 'Kayıt bulunamadı.',
  defaultSortBy = 'Id',
  defaultSortDirection = 'desc',
  pageSizeOptions = [10, 25, 50, 100],
  refreshKey = 0,
  onRowClick,
  renderActions,
  actionsLabel = 'İşlem',
}: PagedGridProps<T>) {
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;
  const [rows, setRows] = useState<T[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualRefresh, setManualRefresh] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPageNumber(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    void fetchPageRef.current({
      pageNumber,
      pageSize,
      search,
      sortBy,
      sortDirection,
      filterLogic: 'and',
      filters: [],
    })
      .then((page) => {
        if (!active) return;
        setRows(page.items ?? page.data ?? []);
        setTotalCount(page.totalCount ?? 0);
        setTotalPages(page.totalPages ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
        setTotalCount(0);
        setTotalPages(0);
        setError('Liste yüklenemedi. Yenileyerek tekrar deneyin.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [manualRefresh, pageNumber, pageSize, refreshKey, search, sortBy, sortDirection]);

  function changeSort(column: PagedGridColumn<T>) {
    if (!column.sortKey) return;
    if (sortBy === column.sortKey) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column.sortKey);
      setSortDirection('asc');
    }
    setPageNumber(1);
  }

  const firstRow = totalCount === 0 ? 0 : ((pageNumber - 1) * pageSize) + 1;
  const lastRow = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="paged-grid">
      <div className="paged-grid-toolbar">
        <label className="paged-grid-search">
          <Search size={16} />
          <input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </label>
        <div className="paged-grid-toolbar-actions">
          <span className="paged-grid-total">{totalCount} kayıt</span>
          <button aria-label="Listeyi yenile" className="grid-icon-button" type="button" onClick={() => setManualRefresh((value) => value + 1)}>
            <RefreshCw className={isLoading ? 'spin' : ''} size={16} />
          </button>
        </div>
      </div>

      <div className="paged-grid-table-shell">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th className={`align-${column.align ?? 'left'}`} key={column.key} style={{ width: column.width }}>
                  <button disabled={!column.sortKey} type="button" onClick={() => changeSort(column)}>
                    <span>{column.label}</span>
                    {column.sortKey && (sortBy !== column.sortKey
                      ? <ArrowUpDown size={13} />
                      : sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </button>
                </th>
              ))}
              {renderActions && <th className="align-right actions-column">{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
              <tr className="skeleton-row" key={`skeleton-${index}`}>
                {columns.map((column) => <td key={column.key}><span /></td>)}
                {renderActions && <td><span /></td>}
              </tr>
            ))}
            {!isLoading && error && (
              <tr><td className="paged-grid-message error" colSpan={columns.length + (renderActions ? 1 : 0)}>{error}</td></tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr><td className="paged-grid-message" colSpan={columns.length + (renderActions ? 1 : 0)}>{emptyText}</td></tr>
            )}
            {!isLoading && !error && rows.map((row) => (
              <tr className={onRowClick ? 'clickable' : undefined} key={rowKey(row)} onDoubleClick={() => onRowClick?.(row)}>
                {columns.map((column) => (
                  <td className={`align-${column.align ?? 'left'}`} key={column.key}>{column.render(row)}</td>
                ))}
                {renderActions && <td className="align-right actions-column">{renderActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="paged-grid-footer">
        <div className="paged-grid-range">
          <select
            aria-label="Sayfa boyutu"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageNumber(1);
            }}
          >
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>{firstRow}-{lastRow} / {totalCount}</span>
        </div>
        <div className="paged-grid-pagination">
          <span>Sayfa {totalCount === 0 ? 0 : pageNumber} / {totalPages}</span>
          <button aria-label="Önceki sayfa" className="grid-icon-button" disabled={pageNumber <= 1 || isLoading} type="button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>
            <ChevronLeft size={17} />
          </button>
          <button aria-label="Sonraki sayfa" className="grid-icon-button" disabled={pageNumber >= totalPages || isLoading} type="button" onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
