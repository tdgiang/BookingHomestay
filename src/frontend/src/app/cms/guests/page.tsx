'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/cms/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminGuestsApi, AdminGuest } from '@/lib/admin-api';
import {
  Search, ChevronLeft, ChevronRight, Loader2, Download, ExternalLink,
} from 'lucide-react';

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-amber-50 text-amber-700',
  'Khách quen': 'bg-blue-50 text-blue-700',
  'Khách nhóm': 'bg-purple-50 text-purple-700',
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-slate-100 text-slate-600';
}

function GuestsContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [meta, setMeta] = useState<{ total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const search = sp.get('search') ?? '';
  const page = Number(sp.get('page') ?? 1);
  const tagFilter = sp.get('tag') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (tagFilter) params['tags[]'] = tagFilter;
      const result = await adminGuestsApi.list(params);
      setGuests(result.items);
      setMeta({ total: result.meta.total, totalPages: result.meta.totalPages });
    } catch {
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tagFilter]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    router.push(`/cms/guests?${p.toString()}`);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (tagFilter) params['tags[]'] = tagFilter;
      await adminGuestsApi.exportCsv(params);
    } finally {
      setExporting(false);
    }
  };

  const TAGS = ['VIP', 'Khách quen', 'Khách nhóm'];

  return (
    <>
      <Header title="CRM Khách hàng" />
      <main className="flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Tìm theo tên, SĐT, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setParam('search', searchInput)}
              className="h-9 text-sm max-w-xs"
            />
            <Button size="sm" onClick={() => setParam('search', searchInput)} className="gap-1">
              <Search size={13} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setParam('tag', tagFilter === t ? '' : t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  tagFilter === t
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {meta && <span className="text-sm text-slate-500">{meta.total} khách</span>}

          <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Khách hàng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Số điện thoại</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tags</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày tạo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <Loader2 size={20} className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : guests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      Không tìm thấy khách hàng nào
                    </td>
                  </tr>
                ) : guests.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{g.fullName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{g.phone}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{g.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {g.tags.map((tag) => (
                          <Badge key={tag} className={`text-xs ${tagColor(tag)}`}>{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cms/guests/${g.id}`}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <ExternalLink size={11} />
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm text-slate-500">Trang {page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages}
              onClick={() => setParam('page', String(page + 1))}>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

export default function GuestsPage() {
  return <Suspense><GuestsContent /></Suspense>;
}
