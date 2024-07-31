import { BlogSection, PostsBySection, getBlogPosts } from "@/lib/utils/blog";
import { BLOG_SECTIONS_DETAILS } from "@/lib/utils/blogconstants";
import type { MetadataRoute } from "next";

export const baseUrl = "https://mapthemap.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postsBySection = await getBlogPosts();

  const blogSectionUrls = Object.keys(BLOG_SECTIONS_DETAILS).map((section) => ({
    url: `${baseUrl}/blog/${section}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const blogPostUrls = Object.entries(postsBySection).flatMap(
    ([section, posts]) =>
      posts.map((post) => ({
        url: `${baseUrl}/blog/${section}/${post.slug}`,
        lastModified: post.metadata.publishedAt,
      })),
  );

  const mainRoutes = ["", "/updates", "/blog"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...mainRoutes, ...blogSectionUrls, ...blogPostUrls];
}
