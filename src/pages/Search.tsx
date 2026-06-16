import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Card, CardContent, Badge } from '../components/ui';
import { api } from '../lib/api';
import type { SearchResult } from '../lib/types';
import { Clock, FolderKanban, Search, AlertTriangle } from 'lucide-react';

function isOverdue(deadline: string) {
  return new Date(deadline) < new Date(new Date().toDateString());
}

const statusVariant = (s: string) =>
  s === 'active' ? 'success' : s === 'completed' ? 'default' : s === 'dormant' ? 'warning'
  : s === 'rejected' ? 'destructive' : s === 'under_review' ? 'warning' : 'secondary';

export const SearchResults: React.FC = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!q.trim()) return;
    setIsLoading(true);
    setError('');
    api.search(q)
      .then(setResults)
      .catch(err => setError(err instanceof Error ? err.message : 'Search failed'))
      .finally(() => setIsLoading(false));
  }, [q]);

  const total = (results?.projects.length ?? 0) + (results?.tasks.length ?? 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <Search className="w-6 h-6 text-slate-400" />
          Search Results
        </h1>
        {q && <p className="text-slate-500 dark:text-slate-400 mt-1">Results for <strong className="text-slate-700 dark:text-slate-300">"{q}"</strong></p>}
      </div>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Searching…</p>}
      {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}

      {results && !isLoading && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} result{total !== 1 ? 's' : ''} found</p>

          {/* Projects */}
          {results.projects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Projects ({results.projects.length})
              </h2>
              {results.projects.map(p => {
                const overdue = !['completed', 'rejected', 'deletion_requested'].includes(p.status) && isOverdue(p.deadline);
                return (
                  <Link key={p.id} to={`/projects/${p.id}`}>
                    <Card className="hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant={statusVariant(p.status)}>{p.status.replace('_', ' ')}</Badge>
                            {overdue && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />overdue</Badge>}
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{p.course}</p>
                          {p.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs shrink-0 ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {p.deadline}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Tasks ({results.tasks.length})
              </h2>
              {results.tasks.map(t => {
                const overdue = t.status !== 'done' && isOverdue(t.deadline);
                return (
                  <Link key={t.id} to={`/projects/${t.projectId}`}>
                    <Card className="hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'warning' : 'secondary'}>{t.priority}</Badge>
                              <Badge variant={t.status === 'done' ? 'success' : 'secondary'}>{t.status.replace('_', ' ')}</Badge>
                              {overdue && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />overdue</Badge>}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                            {t.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>}
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs shrink-0 ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {t.deadline}
                          </div>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          {t.projectTitle}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {total === 0 && (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              No results found for "{q}". Try different keywords.
            </div>
          )}
        </>
      )}

      {!q && (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
          Use the search bar in the header to search across projects and tasks.
        </div>
      )}
    </div>
  );
};
