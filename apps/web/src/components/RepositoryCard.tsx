import Link from 'next/link';
import type { Repository } from '@/lib/api';

export function RepositoryCard({ repo }: { repo: Repository }) {
  const [owner, name] = repo.fullName.split('/');

  return (
    <article className="rounded border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link className="text-lg font-semibold text-river hover:underline" href={`/repositories/${owner}/${name}`}>
            {repo.fullName}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-stone-600">{repo.description ?? 'No description provided.'}</p>
        </div>
        <span className="rounded bg-amber/10 px-2 py-1 text-sm font-medium text-amber">{repo.stars.toLocaleString()} stars</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
        {repo.primaryLanguage && <span className="rounded bg-stone-100 px-2 py-1">{repo.primaryLanguage}</span>}
        <span className="rounded bg-stone-100 px-2 py-1">{repo.forks.toLocaleString()} forks</span>
        <span className="rounded bg-stone-100 px-2 py-1">{repo.openIssues.toLocaleString()} issues</span>
      </div>
    </article>
  );
}
