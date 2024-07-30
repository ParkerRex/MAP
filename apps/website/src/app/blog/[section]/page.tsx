import {
  type BlogSection,
  type Metadata,
  type Post,
  formatDate,
  getPostsBySection,
} from '@/lib/blog';
import { BLOG_SECTIONS_DETAILS } from '@/lib/blog';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  params: {
    section: string;
    slug: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = params;
  const sectionDetails = BLOG_SECTIONS_DETAILS[section as BlogSection];
  const fullUrl = `https://mapthemap.com/blog/${section}`;

  return {
    title: sectionDetails.title,
    publishedAt: new Date().toISOString(), // You need to provide the actual published date
    summary: sectionDetails.description, // Assuming the description can also serve as a summary
    section: section, // The current section
    description: sectionDetails.description,
    image: sectionDetails.image, // Assuming you have an image for the section
    openGraph: {
      type: 'website',
      url: fullUrl,
      title: sectionDetails.title,
      description: sectionDetails.description,
      images: [
        {
          url: sectionDetails.image,
          width: 1200,
          height: 630,
          alt: sectionDetails.title,
        },
      ],
    },
    twitter: {
      cardType: 'summary_large_image',
      site: '@mapdotcom',
      title: sectionDetails.title,
      description: sectionDetails.description,
      image: sectionDetails.image,
    },
  };
}

export default async function SectionPage({ params }: Props) {
  const { section } = params;
  const posts: Post[] = await getPostsBySection(section as BlogSection);

  return (
    <div className="mx-auto my-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 className="mb-12 text-center text-4xl font-bold dark:text-white">
        Map's{' '}
        <span className="underline">
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </span>{' '}
        Blog Posts
      </h1>
      <p className="mb-5 text-center dark:text-white">
        Here's our weekly newsletter that is delivered each monday at 9AM ET.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="group overflow-hidden rounded-lg shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-xl"
          >
            <Link
              className="flex h-full w-full flex-col justify-between"
              href={`/blog/${section}/${post.slug}`}
            >
              <div>
                <Image
                  src={post.metadata.image || '/images/default-blog-image.jpg'}
                  alt={post.metadata.title}
                  width={600}
                  height={400}
                  className="transition-opacity duration-300 ease-in-out hover:opacity-75"
                />
                <div className="p-6">
                  <h2 className="mb-2 line-clamp-2 text-lg font-semibold transition-colors duration-300 ease-in-out dark:text-white">
                    {post.metadata.title}
                  </h2>
                  <p className="line-clamp-2 text-sm transition-colors duration-300 ease-in-out dark:text-white">
                    {post.metadata.summary}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="mt-2 text-xs transition-colors duration-300 ease-in-out dark:text-white">
                  Published on {formatDate(post.metadata.publishedAt)}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
