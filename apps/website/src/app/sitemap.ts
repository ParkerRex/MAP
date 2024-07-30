import { getBlogPosts } from "@/utils/blog";

export default async function sitemap() {
	const blogPosts = await getBlogPosts();
	if (!blogPosts) {
		// Return an empty array or handle the error as appropriate
		return [];
	}

	const blogs = Object.entries(blogPosts).flatMap(([section, posts]) =>
		posts.map((post) => ({
			url: `https://mapthemap.com/blog/${section}/${post.slug}`,
			lastModified: post.metadata.publishedAt,
		})),
	);

	const routes = ["", "/blog"].map((route) => ({
		url: `https://mapthemap.com${route}`,
		lastModified: new Date().toISOString().split("T")[0],
	}));

	return [...routes, ...blogs];
}
