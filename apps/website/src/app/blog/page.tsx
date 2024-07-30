import {
  BLOG_SECTIONS_DETAILS,
  BlogSection,
  type PostsBySection,
  getBlogPosts,
} from '@/lib/blog';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: "Map's Blog | Get Educated on Productivity, Health, and Happiness",
  description:
    'Map delivers short, high value articles on productivity, health, and happiness. ',
};

export default async function BlogPage() {
  const postsBySection: PostsBySection = await getBlogPosts();

  // Custom sort function to prioritize 'Momentum Letters'
  const sortedSections = Object.entries(postsBySection).sort(
    ([sectionA], [sectionB]) => {
      if (sectionA === 'letters') return -1;
      if (sectionB === 'letters') return 1;
      return 0;
    },
  );

  return (
    <div className="justify-left container">
      <hr className="my-8 h-[.5px] w-full bg-gray-200" />
      <section className="justify-left grid py-6 lg:py-10">
        <div className="gap-4 md:gap-8">
          <div className="space-y-4">
            <h3 className="font-thin uppercase tracking-widest">The Blog</h3>
            <h1 className="text-4xl font-black tracking-tighter lg:text-5xl">
              Get Educated Now
            </h1>
            <p className="text-lg">
              Looking to go deeper?{' '}
              <Link href="/blog/letters" className="underline">
                The Momentum Letters.
              </Link>{' '}
              are for you. Want quick wins for the day? Check our{' '}
              <Link href="/blog/routines" className="underline">
                routines.
              </Link>{' '}
              Just a list of healthy habits, supplements or recipes? Check out{' '}
              <Link href="/blog/lists" className="underline">
                lists.
              </Link>
            </p>
          </div>
        </div>
      </section>
      <div className="h-4" />
      {sortedSections.length ? (
        sortedSections.map(([section, posts]) => (
          <div key={section} className="mb-10">
            <h2 className="mb-4 text-5xl font-black capitalize">
              {BLOG_SECTIONS_DETAILS[
                section as keyof typeof BLOG_SECTIONS_DETAILS
              ]?.title || section}
            </h2>
            <p className="text-lg mb-4 text-slate-500 dark:text-slate-400">
              {
                BLOG_SECTIONS_DETAILS[
                  section as keyof typeof BLOG_SECTIONS_DETAILS
                ]?.description
              }
            </p>
            <div className="grid items-start gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts
                .sort(
                  (a, b) =>
                    new Date(b.metadata.publishedAt).getTime() -
                    new Date(a.metadata.publishedAt).getTime(),
                )
                .map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${section.toLowerCase()}/${post.slug}`}
                    className="block"
                  >
                    <div className="flex h-[100%] flex-col overflow-hidden transition-shadow duration-300 ease-in-out justify-start align-left text-left">
                      {post.metadata.image && (
                        <div className="flex-shrink-0">
                          <Image
                            src={post.metadata.image}
                            alt={post.metadata.title}
                            height={300}
                            width={450}
                            className="rounded-sm transition-opacity duration-300 ease-in-out hover:opacity-75"
                          />
                        </div>
                      )}
                      <div className="flex flex-grow flex-col py-4">
                        <h3 className="mb-2 md:line-clamp-2 text-2xl font-semibold">
                          {post.metadata.title}
                        </h3>
                        {post.metadata.summary && (
                          <p className="line-clamp-2 flex-grow text-sm">
                            {post.metadata.summary}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {post.metadata.publishedAt &&
                            `Published on ${new Date(
                              post.metadata.publishedAt,
                            ).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))
      ) : (
        <p>No posts published.</p>
      )}
    </div>
  );
}
