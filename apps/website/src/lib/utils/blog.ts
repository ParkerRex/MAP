import fs from "node:fs/promises";
import path from "node:path";

export type OpenGraphMetadata = {
  type: string;
  url: string;
  title?: string;
  description: string;
  images: {
    url?: string;
    width: number;
    height: number;
    alt: string;
  }[];
};

export type SectionDetails = {
  title: string;
  description: string;
  image?: string;
};

export type Metadata = {
  title: string;
  publishedAt: string;
  description?: string;
  summary: string;
  image?: string;
  section: string; // Added section
  // biome-ignore lint: <any>
  openGraph?: any;
  // biome-ignore lint: <any>
  twitter?: any;
};
export type PostsBySection = Record<string, Post[]>;

export type Post = {
  metadata: Metadata;
  slug: string;
  content: string;
  updatedAt?: string;
};

export enum BlogSection {
  Lists = "lists",
  Letters = "letters",
  Routines = "routines",
  Resources = "resources",
}

export const BLOG_SECTIONS_DETAILS: Record<BlogSection, SectionDetails> = {
  [BlogSection.Lists]: {
    title: "Curated Lists",
    description: "Explore our curated lists of topics, tips, and tools.",
    image: "/images/lists-section.jpg",
  },
  [BlogSection.Letters]: {
    title: "Momentum Letters",
    description: "Read open letters from our community and team.",
    image: "/images/letters-section.jpg",
  },
  [BlogSection.Routines]: {
    title: "Daily Routines",
    description: "Discover daily routines and habits for success.",
    image: "/images/routines-section.jpg",
  },
  [BlogSection.Resources]: {
    title: "Resources",
    description:
      "Access a wealth of resources to fuel your growth and learning.",
    image: "/images/resources-section.jpg",
  },
};

export function formatDate(date: string) {
  const currentDate = new Date();
  let modifiedDate = date;
  if (!date.includes("T")) {
    modifiedDate = `${date}T00:00:00`;
  }
  const targetDate = new Date(modifiedDate);

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  const daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  const fullDate = targetDate.toLocaleString("en-us", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${fullDate} (${formattedDate})`;
}

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  if (!match) throw new Error("Frontmatter not found");

  if (!match || !match[1]) throw new Error("Frontmatter block is undefined");
  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<Metadata> = {};

  for (const line of frontMatterLines) {
    const [key, ...valueArr] = line.split(": ");
    if (!key) continue;
    const value = valueArr
      .join(": ")
      .trim()
      .replace(/^['"](.*)['"]$/, "$1");
    metadata[key.trim() as keyof Metadata] = value;
  }

  return { metadata: metadata as Metadata, content };
}

async function readMDXFile(filePath: string) {
  const rawContent = await fs.readFile(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

export async function getBlogPosts(): Promise<PostsBySection> {
  const dir = path.join(process.cwd(), "src", "content");

  const mdxFiles = (await fs.readdir(dir)).filter(
    (file) => path.extname(file) === ".mdx",
  );

  const posts = await Promise.all(
    mdxFiles.map(async (file) => {
      const { metadata, content } = await readMDXFile(path.join(dir, file));
      const slug = path.basename(file, ".mdx");
      return { metadata, slug, content };
    }),
  );

  const postsBySection = posts.reduce((acc, post) => {
    const section = post.metadata.section.toLowerCase();

    if (!acc[section]) {
      acc[section] = [];
    }

    acc[section].push({ ...post, updatedAt: post.metadata.publishedAt });

    return acc;
  }, {} as PostsBySection);

  return postsBySection;
}

export async function getPostsBySection(
  targetSection: BlogSection,
): Promise<Post[]> {
  const postsBySection = await getBlogPosts();

  const posts = postsBySection[targetSection];

  if (posts === undefined) {
    return [];
  }

  return posts.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );
}

export function validateBlogSection(section: string): BlogSection | undefined {
  return Object.values(BlogSection).find((value) => value === section);
}

export async function getPostBySlug(
  targetSection: BlogSection,
  targetSlug: string,
): Promise<Post> {
  const dir = path.join(process.cwd(), "src", "content");

  const mdxFiles = (await fs.readdir(dir)).filter(
    (file) => path.extname(file) === ".mdx",
  );

  const posts = await Promise.all(
    mdxFiles.map(async (file) => {
      const { metadata, content } = await readMDXFile(path.join(dir, file));
      const slug = path.basename(file, ".mdx");
      return { metadata, slug, content };
    }),
  );

  const post = posts.find(
    (post) =>
      post.metadata.section.toLowerCase() === targetSection.toLowerCase() &&
      post.slug === targetSlug,
  );

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
}
