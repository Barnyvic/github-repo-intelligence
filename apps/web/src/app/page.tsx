'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { RepositoryCard } from '@/components/RepositoryCard';
import { Developer, Repository, apiGet } from '@/lib/api';

interface SearchResponse<T> {
  totalCount: number;
  page: number;
  perPage: number;
  items: T[];
}

export default function Dashboard() {
  const [mode, setMode] = useState<'repositories' | 'developers'>('repositories');
  const [query, setQuery] = useState('nestjs');
  const [language, setLanguage] = useState('TypeScript');
  const [minStars, setMinStars] = useState(1000);
  const [page, setPage] = useState(1);
  const [repoResults, setRepoResults] = useState<SearchResponse<Repository> | null>(null);
  const [developerResults, setDeveloperResults] = useState<SearchResponse<Developer> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runSearch(nextPage = 1) {
    setLoading(true);
    setError('');
    setPage(nextPage);
    try {
      if (mode === 'repositories') {
        const data = await apiGet<SearchResponse<Repository>>('/repositories/search', {
          q: query,
          language,
          minStars,
          sort: 'stars',
          page: nextPage,
          perPage: 10,
        });
        setRepoResults(data);
      } else {
        const data = await apiGet<SearchResponse<Developer>>('/developers/search', {
          q: query,
          sort: 'followers',
          page: nextPage,
          perPage: 10,
        });
        setDeveloperResults(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void runSearch(1);
  }

  const activeItems = mode === 'repositories' ? repoResults?.items : developerResults?.items;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 border-b border-stone-300 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-moss">GitHub Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold">Repository and developer activity dashboard</h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form onSubmit={submit} className="h-fit rounded border border-stone-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 rounded border border-stone-200 p-1">
            <button type="button" onClick={() => setMode('repositories')} className={`rounded px-3 py-2 text-sm ${mode === 'repositories' ? 'bg-moss text-white' : ''}`}>
              Repos
            </button>
            <button type="button" onClick={() => setMode('developers')} className={`rounded px-3 py-2 text-sm ${mode === 'developers' ? 'bg-moss text-white' : ''}`}>
              Developers
            </button>
          </div>
          <label className="mt-4 block text-sm font-medium">Search query</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          {mode === 'repositories' && (
            <>
              <label className="mt-4 block text-sm font-medium">Language</label>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
              <label className="mt-4 block text-sm font-medium">Minimum stars</label>
              <input type="number" value={minStars} onChange={(e) => setMinStars(Number(e.target.value))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
            </>
          )}
          <button className="mt-5 w-full rounded bg-river px-4 py-2 font-medium text-white">Search</button>
        </form>

        <div className="space-y-4">
          {error && <ErrorState message={error} />}
          {loading && <LoadingState />}
          {!loading && !activeItems?.length && <EmptyState title="Search results will appear here." />}
          {mode === 'repositories' &&
            repoResults?.items.map((repo) => <RepositoryCard key={repo.id} repo={repo} />)}
          {mode === 'developers' &&
            developerResults?.items.map((dev) => (
              <article key={dev.username} className="rounded border border-stone-200 bg-white p-4 shadow-sm">
                <Link href={`/developers/${dev.username}`} className="flex items-center gap-4">
                  <img src={dev.avatarUrl} alt="" className="h-12 w-12 rounded" />
                  <div>
                    <h2 className="font-semibold text-river">{dev.username}</h2>
                    <p className="text-sm text-stone-600">{dev.followers.toLocaleString()} followers · {dev.publicRepos.toLocaleString()} repos</p>
                  </div>
                </Link>
              </article>
            ))}
          {activeItems?.length ? (
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => void runSearch(page - 1)} className="rounded border border-stone-300 px-3 py-2 disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => void runSearch(page + 1)} className="rounded border border-stone-300 px-3 py-2">
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
