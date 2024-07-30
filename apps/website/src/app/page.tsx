import FirstTimeNavBar from "@/components/FirstTimeNavBar";
import GradientSeparator from "@/components/GradientSeparator";
import { WaitlistInput } from "@/components/waitlist-input";
import { Post, getBlogPosts } from "@/lib/blog";
import WordRotate, { WORD_ROTATE_DURATION } from "@map/ui/magicui/word-rotate";
import Link from "next/link";

import HealthCrisis from "@/components/health-crisis";
import MarketingFooter from "@/components/marketing-footer";
import { Button } from "@map/ui/button";
import dynamic from "next/dynamic";

const ClientCloudScene = dynamic(() => import("@/components/cloud-wrapper"), {
  ssr: false,
});

export default async function Page() {
  const postsBySection = await getBlogPosts();
  const letterPosts = postsBySection.letters || [];
  const recentLetterPosts = letterPosts
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <div className="absolute inset-0 z-0">
        <ClientCloudScene />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <FirstTimeNavBar tocItems={undefined} />
        {/* Hero Section - 900px high on desktop, full height on mobile */}
        <section className="min-h-screen md:h-[900px] flex flex-col container relative">
          {/* Mobile header - visible only on small screens */}
          <div className="md:hidden pt-4 pb-8 pr-[50px]">
            <h1 className="text-[24px] leading-snug tracking-tighter">
              Map is an AI health-tech company building tools to help you live
              healthier and work smarter.
            </h1>
          </div>

          <div className="flex-grow flex flex-col justify-between md:justify-end pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
              {/* Left column with H1 Copy - hidden on mobile, visible on desktop */}
              <div className="hidden md:block w-full md:w-1/2 pr-4 mb-8 md:mb-0">
                <h1 className="text-[36px] leading-snug tracking-tighter uppercase">
                  MAP IS AN AI HEALTH-TECH COMPANY BUILDING tools to help you
                  live healthier and work smarter.
                </h1>
              </div>
              {/* Right column */}
              <div className="w-full md:w-1/2 md:pl-4">
                {/* Email capture - hidden on mobile */}
                <div className="hidden md:block">
                  <h2 className="text-xl mb-4 uppercase">
                    Request Early Access
                  </h2>
                  <p className="mb-2">
                    Get news, photos, events, and business updates
                  </p>
                  <WaitlistInput />
                </div>
              </div>
            </div>
          </div>
          {/* Email capture - visible only on mobile */}
          <div className="md:hidden mt-auto">
            <p className="mb-2">Keep up with us</p>
            <p className="mb-4">
              Get news, photos, events, and business updates
            </p>
            <WaitlistInput placeholder="Email Address*" buttonText="Sign Up" />
          </div>
        </section>
        {/* Rotating text section - 700px high on desktop, 390px on mobile */}
        <section className="w-full bg-white py-8 md:py-16 h-[390px] md:h-[700px] flex items-center">
          <div className="container mx-auto px-4">
            <div className="relative">
              <div className="absolute -top-[30px] md:-top-[60px] left-0 w-full md:w-[620px]">
                <GradientSeparator />
              </div>
              <h2 className="text-[42px] md:text-[85px] uppercase leading-tight relative">
                <span>PICTURE YOURSELF</span>
                <div className="absolute w-full top-full">
                  <WordRotate
                    words={[
                      "Guided by your peak self",
                      "Mastering skills you never thought possible",
                      "Looking better than you've ever looked",
                      "Feeling more confident than you've ever felt",
                    ]}
                    gradientWords={[1]}
                    className="block text-[42px] md:text-[85px]"
                    duration={WORD_ROTATE_DURATION}
                  />
                </div>
              </h2>
            </div>
          </div>
        </section>
        {/* Master Plan section - 320px high on mobile, 300px on desktop */}
        <section className="w-full bg-white h-[320px] md:h-[300px] flex items-center">
          <div className="container mx-auto px-4 flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 pr-0 md:pr-8">
              <h2 className="text-[24px] md:text-[48px] leading-tight uppercase mb-4 md:mb-6">
                The world's first AI-driven health and productivity platform
              </h2>
              <p className="text-[14px] md:hidden mb-6">
                We've leveraged our lives around disconnected health and
                productivity tools. Map brings together cutting-edge AI, health
                tracking, and productivity tools to give you a holistic view of
                your life. Seamless integration means less time spent across all
                aspects of your life.
              </p>
              <Link href="/master-plan">
                <Button
                  variant="default"
                  type="button"
                  className="bg-black text-white px-6 py-3 rounded-full text-sm font-semibold"
                >
                  See our Master Plan
                </Button>
              </Link>
            </div>
            <div className="hidden md:block w-full md:w-1/2 mt-8 md:mt-0">
              <p className="text-lg">
                with map by our side, we'll have the ability to understand our
                health, optimize our productivity, and achieve our goals like
                never before, addressing the global health crisis and
                revolutionizing how we approach personal wellness.
              </p>
            </div>
          </div>
        </section>
        {/* Introducing MAP section - responsive height */}
        <section className="w-full bg-white py-8 md:py-16">
          <div className="container mx-auto px-4 flex flex-col h-full">
            <div className="flex flex-col md:flex-row mb-8 md:mb-auto">
              <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-8 md:mb-0">
                <h2 className="text-[42px] md:text-[64px] leading-tight uppercase mb-4">
                  INTRODUCING MAP
                </h2>
                <p className="text-[14px] md:text-lg mb-8">
                  The world's first AI-driven health and productivity platform
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <div className="space-y-4 md:space-y-6">
                  {[
                    "AI-Powered Insights",
                    "Seamless Integration",
                    "Continuous learning",
                    "Real-time Health Monitoring",
                    "Calendar, Notes, Tasks, Reinvented.",
                  ].map((feature, index) => (
                    <h3
                      key={feature}
                      className="text-[24px] md:text-[36px] font-semibold text-left md:text-right"
                      style={{
                        background:
                          "linear-gradient(90deg, #4ade80 0%, #60a5fa 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {feature}
                    </h3>
                  ))}
                  <h3 className="text-[32px] md:text-[48px] font-bold text-left md:text-right uppercase">
                    YOUR BEST SELF
                  </h3>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-auto">
              <p className="text-sm uppercase mb-4">Designed for our lives</p>
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-6 md:mb-0">
                  <h2 className="text-[32px] md:text-[48px] leading-tight uppercase mb-6">
                    WHY AN INTEGRATED PLATFORM?
                  </h2>
                  <Link href="/about-us">
                    <Button
                      variant="default"
                      type="button"
                      className="bg-black text-white px-6 py-3 rounded-full text-sm"
                    >
                      About Us
                    </Button>
                  </Link>
                </div>
                <div className="w-full md:w-1/2">
                  <p className="text-[14px] md:text-lg">
                    We've leveraged our lives around disconnected health and
                    productivity tools. Map brings together cutting-edge AI,
                    health tracking, and productivity tools to give you a
                    holistic view of your life. Seamless integration means less
                    time spent across all aspects of your life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ARTICLES */}
        <section className="w-full bg-black text-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-[48px] mb-12">READ OUR PERSPECTIVE</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentLetterPosts.map((post) => (
                <div
                  key={post.slug}
                  className="border border-white/20 rounded-lg p-6 flex flex-col justify-between group hover:cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0))",
                  }}
                >
                  <div>
                    <p className="text-sm mb-4">Letters</p>
                    <h3 className="text-xl font-semibold mb-4">
                      <span className="link link-underline link-underline-white link-underline-trigger text-white">
                        {post.metadata.title}
                      </span>
                    </h3>
                  </div>
                  <Link
                    href={`/blog/letters/${post.slug}`}
                    className="text-sm flex items-center"
                  >
                    <span className="link link-underline link-underline-white link-underline-trigger text-white">
                      Read Now
                    </span>
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* HEALTH CRISIS */}
        <HealthCrisis />
        <section className="w-full bg-white py-16 h-[440px] flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="w-full md:w-1/2 pr-8">
                <h2 className="text-[48px] leading-tight mb-6">
                  THE TEAM BRINGING IMPOSSIBLE IDEAS TO LIFE
                </h2>
                <Link href="/about-us">
                  <Button
                    variant="default"
                    type="button"
                    className="bg-black text-white px-6 py-3 rounded-full text-sm font-semibold"
                  >
                    About Us
                  </Button>
                </Link>
              </div>
              <div className="w-full md:w-1/2 mt-8 md:mt-0">
                <p className="text-lg">
                  Map is building a world-class talent in mobile development,
                  AI, healthcare policy, and hardware engineering to tackle the
                  most pressing health and productivity challenges of our time.
                </p>
              </div>
            </div>
          </div>
        </section>
        <MarketingFooter />
      </div>
    </div>
  );
}
