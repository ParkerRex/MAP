import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";
import { highlight } from "sugar-high";
import { TweetComponent } from "./tweet";

function YouTubeVideo({ src }: { src: string }) {
  return (
    <Suspense fallback={<IframeLoadingState />}>
      <IframeVideoComponent src={src} />
    </Suspense>
  );
}

function IframeVideoComponent({ src }: { src: string }) {
  return (
    <iframe
      className="aspect-video w-full"
      title="YouTube video player"
      src={src}
      allowFullScreen
    />
  );
}

function IframeLoadingState() {
  return (
    <div className="height-[315px] flex w-[560px] animate-pulse items-center justify-center bg-stone-800">
      <p>Loading Video...</p>
    </div>
  );
}

function Table({ data }: { data: { headers: string[]; rows: string[][] } }) {
  const headers = data.headers.map((header, index) => (
    <th
      key={`th-${crypto.randomUUID()}`}
      style={{ whiteSpace: "normal", wordWrap: "break-word" }}
    >
      {header}
    </th>
  ));
  const rows = data.rows.map((row, index) => (
    <tr key={`tr-${crypto.randomUUID()}`}>
      {row.map((cell, cellIndex) => (
        <td
          key={`td-${crypto.randomUUID()}`}
          style={{ whiteSpace: "normal", wordWrap: "break-word" }}
        >
          {cell}
        </td>
      ))}
    </tr>
  ));

  return (
    <table style={{ tableLayout: "fixed", width: "100%" }}>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
// biome-ignore lint: <any>
function CustomLink(props: any) {
  const href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

// biome-ignore lint: <any>
function RoundedImage(props: any) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />;
}
// biome-ignore lint: <any>
function RoundedVideo(props: any) {
  return <video controls {...props} />;
}

interface CalloutProps {
  emoji: React.ReactNode;
  children: React.ReactNode;
}

function Callout({ emoji, children }: CalloutProps) {
  return (
    <div className="mb-8 flex items-center rounded border border-neutral-200 bg-neutral-50 p-1 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
      <div className="mr-4 flex w-4 items-center">{emoji}</div>
      <div className="callout w-full">{children}</div>
    </div>
  );
}

function ProsCard({ title, pros }: { title: string; pros: string[] }) {
  return (
    <div className="my-4 w-full rounded-xl border border-emerald-200 bg-neutral-50 p-6 dark:border-emerald-900 dark:bg-neutral-900">
      <span>{title}</span>
      <div className="mt-4">
        {pros.map((pro) => (
          <div key={pro} className="mb-2 flex items-baseline font-medium">
            <div className="mr-2 h-4 w-4">
              <svg
                className="h-4 w-4 text-emerald-500"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>Checkmark</title>
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </g>
              </svg>
            </div>
            <ReactMarkdown>{pro}</ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsCard({ title, cons }: { title: string; cons: string[] }) {
  return (
    <div className="my-6 w-full rounded-xl border border-red-200 bg-neutral-50 p-6 dark:border-red-900 dark:bg-neutral-900">
      <span>{title}</span>
      <div className="mt-4">
        {cons.map((con, index) => (
          <div
            key={`cons-${crypto.randomUUID()}`}
            className="mb-2 flex items-baseline font-medium"
          >
            <div className="mr-2 h-4 w-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-red-500"
                aria-hidden="true"
              >
                <title>Cross</title>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </div>
            <ReactMarkdown>{con}</ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CodeProps {
  children: string;
  // biome-ignore lint: <any>
  [propName: string]: any;
}
const Code: React.FC<CodeProps> = ({ children, ...props }) => {
  const codeHTML = highlight(children);
  // biome-ignore lint: <any>
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(React.Children.toArray(children).join(""));
    return React.createElement(
      `h${level}`,
      { id: slug },
      React.createElement("a", {
        href: `#${slug}`,
        key: `link-${slug}`,
        className: "anchor",
      }),
      children,
    );
  };

  // Assign a displayName to the component for better debugging support
  Heading.displayName = `Heading${level}`;

  return Heading;
}

const HighlightText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <span className="bg-yellow-200 px-1">{children}</span>;
};

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),

  HighlightText,
  Image: RoundedImage,
  Video: RoundedVideo,
  a: CustomLink,
  Callout,
  ProsCard,
  ConsCard,
  StaticTweet: TweetComponent,
  code: Code,
  Table,
  YouTubeVideo,
};

// biome-ignore lint: <any>
export function CustomMDX(props: any) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
