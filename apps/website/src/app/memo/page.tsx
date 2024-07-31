import type { Metadata } from "next";
import Image from "next/image";
import NextScript from "next/script";
import parker from "public/avatar.png";

export const metadata: Metadata = {
  title: "Master Plan",
};

export default function Page() {
  return (
    <section>
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-slate-500 to-slate-800"
          id="readingProgress"
          style={{ width: "0" }}
        />
      </div>
      <div className="container max-w-[750px]">
        <article className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white">
          <h1 className="mt-24 mb-4 text-5xl font-extrabold tracking-tighter md:text-6xl dark:text-white">
            Why Build
            <br />
            Map.
          </h1>

          <h3 className="font-medium text-xl mb-2">Introduction</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white">
            We live in an unhealthy and unhappy world. This needs to be
            addressed globally. 40% of the Earth's population is obese. Obesity
            tracks the same slope as internet adoption. This trend bleeds into
            all areas of life, including mental and emotional well-being. We
            will write 1 billion anti-anxiety prescriptions over the next
            decade. The top reason cited is "lack of fulfillment".
            <br />
            <br />
            One in five adults in the United States lives with a mental illness,
            which amounts to 66.6 million people. 75% of workers are
            unfulfilled, costing the global economy $8.8 trillion, or 9% of
            global GDP. Leading strong and accomplished lives helps every health
            problem downstream. Following Maslow's Hierarchy of Needs, goal
            accomplishment, exercise, and diet will have tremendous downstream
            effects on the negative trends we are living through.
            <br />
            <br />
            Map addresses these issues by offering a comprehensive platform for
            goal accomplishment, health, and wellness. Our platform helps people
            dominate goals and improve health to lead happier and more
            fulfilling lives. With Map, people take control of their health and
            well-being to work towards brighter futures.
          </p>

          <h3 className="font-medium text-xl mb-2">Mission</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-8">
            Map's mission is to rethink goal accomplishment and personal growth.
            Happiness and health are intertwined. The most effective way to
            improve one's life is to accomplish goals. Our goal is to unite
            productivity, health, and wellness into a single platform.
            <br />
            <br />
            We're building your home for goals – a single system of goal data
            that sits beneath every popular productivity and health app. Our
            users will go about their day, using Map's coach and Map's apps to
            get things done. Behind the scenes, Map tracks and updates goal
            progress while sending motivational messages to the user. This will
            keep people accountable and highly performant.
            <br />
            <br />
            Our critical metric for success is the number of goals accomplished
            by our users, measured quarterly. We will offer a bundled pricing
            model, providing an all-in-one platform for leading accomplished and
            healthy lives. This benefits our users by consolidating their
            systems and reducing complexity.
          </p>

          <h3 className="font-medium text-xl mb-2">Overview</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-12">
            People use home-brewed systems to make progress towards their goals.
            These legacy health and productivity apps don't communicate with
            each other, and there's no central system.
            <br />
            <br />
            This makes it difficult for individuals to see progress. Many people
            string together dozens of apps with Zapier and build their own
            systems, while others pay multiple coaches to hold them accountable.
            Without a system or coach, most people don't accomplish their goals.
          </p>

          <h3 className="font-medium text-xl mb-2">Our Strategy</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-12">
            <span className="font-bold">
              PART I: By Bundling and Gamifying Productivity and Health Apps, We
              Build a Generational Business.
            </span>{" "}
            Being the comprehensive system for productivity and health is
            lucrative because of the platform power it provides. This allows us
            to offer a bundled pricing model.
            <br />
            <br />
            <span className="font-bold">
              PART II: We market our software through hard-hitting media,
              reaching a wide audience to attract new users at a low cost.
            </span>{" "}
            We start with long-form content on the blog, then produce videos. We
            chop and distribute thousands of clips across hundreds of accounts
            to overwhelm algorithms. We'll build a young and cost-efficient
            media team responsible for plastering social feeds with short-form
            clips. These clips deliver hard-hitting truths about the health
            industry and easy wins in health, nutrition, and fitness.
            <br />
            <br />
            <span className="font-bold">
              PART III: A conversational AI goal coach sets us apart as the
              system of record and coach for goals data.
            </span>{" "}
            Map's coach will provide continuous tight feedback loops based on
            live behavior. For example, when you complete a walk, you can opt-in
            to text messages about the walk, how it compared to previous walks,
            and what potential health benefits you'll see from continuing to go
            on walks. Coaching is proactive across a customer's day, while LLMs
            are reactive. This is not helpful in the world of getting things
            done. Great coaches stay on top of you and hold you accountable to
            the promises you make.
            <br />
            <br />
            <span className="font-bold">
              PART IV: We win consumer productivity and health by offering a
              comprehensive solution, rather than a point solution.
            </span>{" "}
            Many consumer SaaS companies have come and gone with the idea of
            handling one area of an individual's goals. These do not work. We
            will offer a core feature set that includes a calendar, opinionated
            and generative to-do software (includes daily habits, daily
            must-dos, and quarterly goals), an AI assistant, and a notes system.
            All are backed by generative AI tooling. This means when you set a
            goal, Map works with you to break it down into actions you must take
            to make progress. By distilling your goals down into achievable
            actions Maps allows everyone to make progress toward their dreams.
            Map’s role is to turn any goal into manageable tasks that lead to
            life-altering changes for our users.
          </p>
          <h3 className="font-medium text-xl mb-2">Product Overview</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-12">
            The best way to understand our product is to see it in action. We're
            currently in private beta. You can sign up by visiting{" "}
            <span className="underline">
              <a href="https://app.mapthemap.com">this link</a>
            </span>
            . Map is a hybrid of three different software categories:
            productivity, fitness, and AI coaching. We plan to build out an app
            to replace every popular productivity and fitness app, all AI-first
            and model-agnostic. We're model-agnostic and will run benchmarks
            internally to make sure we're using the state-of-the-art while
            balancing trade-offs of cost.
            <br />
            <br />
            Our strategy for getting customers to open Map 20+ times a day is to
            bundle "getting things done" apps with nutrition and fitness apps.
            We quarterback the bundle with an accountability coach who has the
            full context of a customer's personal repository. The coach
            represents the customer's ideal self.
            <br />
            <br />
            Map's coach will provide tight feedback loops to help customers make
            progress on their goals, proactively nudging them with day start,
            day end, and weekly summaries, contextual questions, temperature
            checks, and random acts of motivation.
            <br />
            <br />
            Coaching style is personal. We will be opinionated with a base style
            but have options for users to change. We made three coach types for
            the first version: lenient, casual, and intense. Being pushed is
            good. We'll teach users that erring on the side of intense will get
            them to their goals faster.
            <br />
            <br />
            Our MVP is a customer's home for getting things done. Future
            iterations introduce a tabbed workstation similar to Figma.
            Customers will never have to open another personal app for
            operationalizing their goals day-to-day. In order to succeed in this
            industry, we must build a compound startup. We will focus on
            building apps that would stand on their own without our platform – a
            company that builds companies. We will deeply integrate each product
            with one another and build a vast component library that makes
            building new apps faster than building from scratch. This has
            obvious R&D cost benefits. We will compete to make each one of our
            apps superior to point solutions.
          </p>
          <h3 className="font-medium text-xl mb-2">Competition</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-12">
            On the productivity side, we compete against Amie, Mem, Type,
            Reclaim, Google Calendar, Trello, and other similar companies. These
            companies offer point solutions for productivity and do not offer
            the comprehensive, all-in-one platform that Map offers.
            <br />
            <br />
            In the fitness and nutrition space, we compete against Fitbod,
            MyFitnessPal, Strava, Garmin, Whoop, Oura, and Apple Fitness. These
            companies focus on specific areas of fitness and nutrition and do
            not offer the integrated, holistic approach that Map offers.
            <br />
            <br />
            On the AI coaching side, we compete against a handful of
            use-case-specific LLMs trying to be digital therapists. These
            companies focus on specific areas of AI coaching and do not offer
            the comprehensive, all-in-one platform that Map offers. We believe
            point solutions will lose in the long run.
          </p>

          <h3 className="font-medium text-xl mb-2">Conclusion</h3>
          <p className="prose prose-lg prose-neutral dark:prose-invert lg:col-span-3 dark:text-white mb-12">
            Map unites productivity and health within a single system. By
            offering a bundled pricing model and a conversational AI goal coach,
            we will provide an all-in-one platform for getting things done while
            maximizing revenue for our business. Our team is focused on building
            a compound startup and is committed to delivering fantastic
            software.
          </p>
          <p>Thanks for reading - Parker.</p>
        </article>

        <div className="flex flex-row space-x-4">
          <Image
            src={parker}
            width={300}
            height={300}
            className="rounded-full grayscale"
            alt="Parker Rex"
          />
        </div>

        <NextScript
          id="reading-progress-script"
          strategy="afterInteractive"
          src="/scripts/reading-progress.js"
        />
      </div>
    </section>
  );
}
