import Link from 'next/link';
import { Developer, apiGet } from '@/lib/api';
import { RepositoryCard } from '@/components/RepositoryCard';

export default async function DeveloperProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const developer = await apiGet<Developer>(`/developers/${username}`);
  const languages = Object.entries(developer.activitySummary?.languages ?? {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-river hover:underline">Back to search</Link>
      <section className="mt-6 flex flex-col gap-5 border-b border-stone-300 pb-6 sm:flex-row sm:items-center">
        <img src={developer.avatarUrl} alt="" className="h-24 w-24 rounded" />
        <div>
          <h1 className="text-3xl font-semibold">{developer.name ?? developer.username}</h1>
          <p className="mt-1 text-stone-600">@{developer.username}</p>
          {developer.bio && <p className="mt-3 max-w-2xl text-stone-700">{developer.bio}</p>}
        </div>
      </section>

      <dl className="my-6 grid gap-3 sm:grid-cols-3">
        {[
          ['Public repos', developer.publicRepos],
          ['Followers', developer.followers],
          ['Following', developer.following],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-stone-200 bg-white p-4">
            <dt className="text-sm text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{Number(value).toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <section className="mb-6 rounded border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Recent activity summary</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {languages.map(([language, count]) => (
            <span key={language} className="rounded bg-stone-100 px-2 py-1 text-sm text-stone-700">{language}: {count}</span>
          ))}
          {!languages.length && <span className="text-sm text-stone-500">No languages found in recent repositories.</span>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Recently updated repositories</h2>
        {developer.recentRepositories?.map((repo) => <RepositoryCard key={repo.id} repo={repo} />)}
      </section>
    </div>
  );
}
