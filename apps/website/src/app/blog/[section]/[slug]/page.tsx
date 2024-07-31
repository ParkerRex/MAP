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

import Footer from "@/components/marketing-footer";
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

  return (
    <div className="flex flex-col min-h-screen">
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
      <main className="flex-grow">
        <div className="container max-w-[1140px] mx-auto">
          <hr className="my-8" />
          <div className="w-full max-w-4xl py-12 mx-auto">
            <h1 className="mb-4 text-5xl font-extrabold tracking-tighter md:text-6xl dark:text-white">
              {post.metadata.title}
            </h1>
            <div className="mb-8 mt-2 flex items-center justify-between text-sm">
              <p className="text-sm text-neutral-600 dark:text-white">
                {formatDate(post.metadata.publishedAt)}
              </p>
            </div>
            <div className="gap-8 lg:grid lg:grid-cols-4">
              <article className="max-w-[680px] pt-[80px] md:pt-[150px] w-full">
                <CustomMDX source={post.content} />
              </article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <NextScript
        id="reading-progress-script"
        strategy="afterInteractive"
        src="/scripts/reading-progress.js"
      />
    </div>
  );
}
