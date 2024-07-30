import SideBarEmailCapture from "@/app/blog/components/SidebarEmailCapture";
import { CustomMDX } from "@/app/blog/components/mdx";

import {
  type Metadata,
  type Post,
  getBlogPosts,
  getPostBySlug,
} from "@/lib/blog";
import { formatDate } from "@/lib/blog";

import { notFound } from "next/navigation";
import NextScript from "next/script";

import MarketingFooter from "@/components/marketing-footer";
import { validateBlogSection } from "@/lib/blog";

type Props = {
  params: {
    section: string;
    slug: string;
  };
};

export async function generateStaticParams(): Promise<
  { section: string; slug: string }[]
> {
  const postsBySection = await getBlogPosts();
  const params: { section: string; slug: string }[] = [];

  for (const section in postsBySection) {
    const posts = postsBySection[section] || [];
    for (const post of posts) {
      params.push({
        section,
        slug: post.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = params;
  const validSection = validateBlogSection(section);
  if (!validSection) {
    notFound();
  }
  const post: Post = await getPostBySlug(validSection, slug);

  const fullImageUrl = post.metadata.image
    ? `https://mapthemap.com${post.metadata.image}`
    : `https://mapthemap.com/og?title=${encodeURIComponent(
        post.metadata.title,
      )}`;

  // Construct the metadata object
  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    publishedAt: post.metadata.publishedAt,
    summary: post.metadata.summary,
    image: fullImageUrl,
    section: section,
    openGraph: {
      type: "article",
      url: `https://mapthemap.com/blog/${section}/${slug}`,
      title: post.metadata.title,
      description: post.metadata.summary,
      images: [
        {
          url: fullImageUrl,
          width: 800,
          height: 600,
          alt: post.metadata.title,
        },
      ],
    },
    twitter: {
      cardType: "summary_large_image",
      site: "@mapdotcom", // Replace with your Twitter handle
      title: post.metadata.title,
      description: post.metadata.summary,
      image: fullImageUrl,
    },
  };
}

export default async function BlogListingPage({
  params,
}: {
  params: { section: string; slug: string };
}) {
  const { section, slug } = params;

  // Validate and convert the section string to a BlogSection enum type
  const validSection = validateBlogSection(section);

  if (!validSection) {
    notFound();
    return; // Stop execution if the section is not valid
  }

  const post: Post = await getPostBySlug(validSection, slug);

  if (!post) {
    notFound();
  }

  const shareUrl = `https://mapthemap.com/blog/${section}/${post.slug}`;
  const shareTitle = post.metadata.title;

  return (
    <section className="flex flex-col items-center justify-center py-6 lg:py-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `https://mapthemap.com${post.metadata.image}`
              : `https://mapthemap.com/og?title=${post.metadata.title}`,
            url: shareUrl,
            author: {
              name: "Parker",
            },
          }),
        }}
      />
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-slate-500 to-slate-800"
          id="readingProgress"
          style={{ width: "0" }}
        />
      </div>
      <hr className="my-8" />
      <div className="container w-full max-w-4xl py-12">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tighter md:text-6xl dark:text-white">
          {post.metadata.title}
        </h1>
        <div className="mb-8 mt-2 flex items-center justify-between text-sm">
          <p className="text-sm text-neutral-600 dark:text-white">
            {formatDate(post.metadata.publishedAt)}
          </p>
        </div>
        <div className="gap-8 lg:grid lg:grid-cols-4">
          <article className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white">
            <CustomMDX source={post.content} />
          </article>
          <aside className="sticky top-[65px] hidden max-h-[calc(100vh-65px)] space-y-20 overflow-y-auto border-l border-neutral-200 dark:border-neutral-700 pl-4 lg:col-span-1 lg:block">
            <SideBarEmailCapture />
          </aside>
        </div>
      </div>
      <NextScript
        id="reading-progress-script"
        strategy="afterInteractive"
        src="/scripts/reading-progress.js"
      />
      <MarketingFooter />
    </section>
  );
}
