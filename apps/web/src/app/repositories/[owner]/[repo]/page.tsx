import Link from 'next/link';
import { Repository, apiGet } from '@/lib/api';

interface ActivityItem {
  sha?: string;
  message?: string;
  title?: string;
  authorName?: string;
  url: string;
}

export default async function RepositoryDetails({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const [details, commits, issues] = await Promise.all([
    apiGet<Repository>(`/repositories/${owner}/${repo}`),
    apiGet<{ items: ActivityItem[] }>(`/repositories/${owner}/${repo}/commits`).catch(() => ({ items: [] })),
    apiGet<{ items: ActivityItem[] }>(`/repositories/${owner}/${repo}/issues`).catch(() => ({ items: [] })),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-river hover:underline">Back to search</Link>
      <section className="mt-6 border-b border-stone-300 pb-6">
        <h1 className="text-3xl font-semibold">{details.fullName}</h1>
        <p className="mt-3 max-w-3xl text-stone-700">{details.description ?? 'No description provided.'}</p>
        <a href={details.url} className="mt-4 inline-block rounded bg-river px-4 py-2 text-sm font-medium text-white">Open on GitHub</a>
      </section>

      <dl className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Stars', details.stars],
          ['Forks', details.forks],
          ['Watchers', details.watchers],
          ['Open issues', details.openIssues],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-stone-200 bg-white p-4">
            <dt className="text-sm text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{Number(value).toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Activity title="Recent commits" items={commits.items.map((item) => ({ label: item.message ?? item.sha ?? 'Commit', url: item.url, meta: item.authorName }))} />
        <Activity title="Recent issues" items={issues.items.map((item) => ({ label: item.title ?? 'Issue', url: item.url, meta: item.sha }))} />
      </div>
    </div>
  );
}

function Activity({ title, items }: { title: string; items: { label: string; url: string; meta?: string }[] }) {
  return (
    <section className="rounded border border-stone-200 bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-3">
        {items.slice(0, 8).map((item) => (
          <li key={item.url} className="border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
            <a className="line-clamp-2 text-sm font-medium text-river hover:underline" href={item.url}>{item.label}</a>
            {item.meta && <p className="mt-1 text-xs text-stone-500">{item.meta}</p>}
          </li>
        ))}
        {!items.length && <li className="text-sm text-stone-500">No recent activity found.</li>}
      </ul>
    </section>
  );
}
