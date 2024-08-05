"use client";
import { TableOfContents } from "@/components/TableOfContents";
import NavBar from "@/components/header";
import Footer from "@/components/marketing-footer";

const tocItems = [
  { id: "our-mission", title: "OUR MISSION", level: 1 },
  { id: "the-company", title: "THE COMPANY", level: 1 },
  { id: "the-present", title: "THE PRESENT", level: 1 },
  { id: "the-possibility", title: "THE POSSIBILITY", level: 1 },
  { id: "the-solution", title: "THE SOLUTION", level: 1 },
  { id: "how-we-can-do-it", title: "HOW WE CAN DO IT", level: 1 },
  { id: "conclusion", title: "CONCLUSION", level: 1 },
];

function Page() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <NavBar tocItems={tocItems} />
      <main className="flex-grow">
        <section className="relative w-full min-h-screen md:h-[900px] flex flex-col pt-16 md:pt-32 bg-black text-white">
          <div className="px-4 flex flex-col justify-center h-full">
            <h1 className="text-sm mb-4 md:mb-6">Master Plan</h1>
            <h2 className="text-[42px] md:text-[85px] mb-6 md:mb-8 tracking-tighter leading-tight">
              ROADMAP TO A
              <br />
              POSITIVE FUTURE
              <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                POWERED BY AI
              </span>
            </h2>
            <p className="text-[14px] md:text-sm mb-4">
              By: Parker Rex, Founder & CEO • July 19, 2024
            </p>

            <p className="text-[17px] md:text-base max-w-[900px] mb-6">
              Background: With over a decade of experience building technology
              companies, including roles as a product designer, product manager,
              and engineer, I've generated over $250M in revenue from consumer
              startups. My sole focus now is Map. My ambition is to build this
              company with a 30-year view, dedicating my time and resources to
              maximizing our positive impact on global health and productivity.
            </p>
            <a
              href="/about"
              className="inline-flex items-center text-[14px] md:text-sm group"
            >
              <span className="link link-underline link-underline-white link-underline-trigger text-white">
                About Us
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
            </a>
          </div>
        </section>
        <section className="bg-white text-black">
          <div className="flex flex-col px-4 relative pt-[120px]">
            <div className="w-full">
              <div
                id="toc-start"
                className="absolute"
                style={{ top: "-120px" }}
              />
              <section id="our-mission" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Our Mission
                </h2>
                <p className="text-[17px] md:text-xl mb-4">
                  Accelerate global health through productivity and goal
                  accomplishment.
                </p>
              </section>
              <section id="the-company" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  The Company
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  I believe that improving global health and productivity is one
                  of the most pressing challenges of our time. The most
                  meaningful impact can come from developing technologies that
                  make it easy for individuals to accomplish their goals and
                  live healthier lives. In the coming age, we will see great
                  advancements in AI-assisted health tracking and productivity
                  tools, and by contributing in the early stages, we can set the
                  course for a healthier, more productive future for humanity.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  Hence the goal of Map: to develop a comprehensive suite of
                  health and productivity tools that make a positive impact on
                  humanity and create better lives for current and future
                  generations. Our platform can eliminate the barriers to
                  achieving personal health and productivity goals — ultimately
                  allowing us to live happier, more purposeful lives.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  Our company journey will take years — and require a
                  championship team dedicated to the mission, significant
                  investment, and technological innovation to achieve a
                  mass-market impact. We face challenges and competition in a
                  rapidly evolving market. However, if we are successful, we
                  have the potential to positively impact global health and
                  productivity and to build one of the most influential
                  companies in the health-tech space.
                </p>
              </section>

              <section id="the-present" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  The Present
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  Today, we are seeing unprecedented health challenges. Nearly
                  50% of Americans are obese, causing over 8 million deaths this
                  year alone. Traditional methods to combat obesity and improve
                  health are proving ineffective, with 32% of GLP-1 users
                  discontinuing after the first year. Meanwhile, productivity
                  tools often lack integration with health data, creating a
                  disconnect between personal wellbeing and accomplishment.
                </p>
              </section>
              <section id="the-possibility" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  The Possibility
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We are in the early stages of an AI and health-tech
                  revolution. This presents a unique opportunity to
                  substantially increase our health outcomes and productivity.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  As AI-assisted health and productivity tools continue to
                  integrate with daily life at scale, we can predict that the
                  approach to personal health and goal accomplishment will
                  transform. Tools that can think, learn, reason, and interact
                  with our daily routines will eventually be capable of guiding
                  us towards better health and higher productivity better than
                  traditional methods. Over time, achieving optimal health and
                  peak productivity could become more accessible to everyone,
                  not just those who can afford expensive treatments or personal
                  coaches.
                </p>
              </section>

              <section id="the-solution" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  The Solution
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We believe an integrated suite of health and productivity
                  tools will revolutionize how people approach their personal
                  and professional goals. Our initial focus will be on active
                  men and women ages 18-35, busy professionals balancing work
                  and personal life who are already invested in their health
                  journey. However, our long-term vision encompasses serving a
                  broad range of users across various demographics.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We see three major business opportunities in the long term:
                </p>
                <ol className="list-decimal list-inside text-[17px] md:text-[19px] mb-4 pl-4">
                  <li className="mb-2">
                    Personal Health Management
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>
                        165.5 million potential customers in the U.S. alone
                      </li>
                      <li>$79.4 billion Total Addressable Market</li>
                    </ul>
                  </li>
                  <li className="mb-2">
                    Professional Productivity Enhancement
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>Targeting the 50% of Americans who use wearables</li>
                      <li>
                        Integrating health data with professional goal-setting
                        and achievement
                      </li>
                    </ul>
                  </li>
                  <li className="mb-2">
                    Corporate Wellness Programs
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>
                        Partnering with companies to improve employee health and
                        productivity
                      </li>
                      <li>
                        Potential to reduce healthcare costs and increase
                        workforce efficiency
                      </li>
                    </ul>
                  </li>
                </ol>
                <p className="text-[17px] md:text-[19px] mb-4">
                  At Map, we believe that a fully integrated suite of health and
                  productivity products built for the human lifestyle is the
                  desired route to have the largest overall impact. For that
                  reason, our platform resembles a personal assistant that
                  understands both health and productivity needs. With one
                  product, we can meet the complex human environment with
                  AI-assisted capabilities, and provide endless types of support
                  across a variety of circumstances.
                </p>
              </section>
              <section id="how-we-can-do-it" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  How We Can Do It
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  In my years of studying and building companies, I've never
                  seen a potential market size similar to what an integrated
                  health and productivity platform can bring. Arriving there
                  will require significant advancements in technology and user
                  experience. We're heads-down and focused on making substantive
                  leaps in those areas of advancement. They include:
                </p>
                <ul className="list-disc list-inside text-[17px] md:text-[19px] mb-4 pl-4">
                  <li className="mb-2">
                    <strong>AI Integration:</strong> Building an AI system that
                    enables our platform to provide personalized health and
                    productivity advice is one of our core challenges. We are
                    tackling this by developing intelligent agents that can
                    interact with complex and unstructured real-world data from
                    various health and productivity sources.
                  </li>
                  <li className="mb-2">
                    <strong>Data Integration:</strong> We're aiming to
                    seamlessly integrate data from various health wearables,
                    productivity tools, and user inputs to provide a
                    comprehensive view of an individual's health and
                    productivity status.
                  </li>
                  <li className="mb-2">
                    <strong>User Experience:</strong> It's essential that our
                    platform is intuitive and engaging for users to interact
                    with daily. We will design it to adhere to the highest
                    standards of UX/UI design and gamification principles.
                  </li>
                  <li className="mb-2">
                    <strong>Privacy and Security:</strong> Given the sensitive
                    nature of health and productivity data, we are prioritizing
                    robust privacy and security measures to ensure user trust
                    and compliance with regulations.
                  </li>
                  <li className="mb-2">
                    <strong>Scalability:</strong> We anticipate needing to
                    deliver a high-quality product at an exceptionally high
                    volume. We are preparing for this by being thoughtful about
                    our tech stack, system architecture, and scalability
                    planning.
                  </li>
                </ul>
              </section>
              <section id="conclusion" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Conclusion
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  In summary, here is the first phase of our Master Plan:
                </p>
                <ol className="list-decimal list-inside text-[17px] md:text-[19px] mb-4 pl-4">
                  <li className="mb-2">
                    Build a feature-complete, integrated health and productivity
                    platform.
                  </li>
                  <li className="mb-2">
                    Perform AI-assisted health tracking and goal setting.
                  </li>
                  <li className="mb-2">
                    Integrate our platform into users' daily lives and corporate
                    wellness programs.
                  </li>
                </ol>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We have the potential to alter the course of global health and
                  productivity and fundamentally improve millions of lives.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  It's time to build.
                </p>
                <div className="flex flex-col items-start mt-8">
                  <div className="flex items-center">
                    <img
                      src="/avatar.png"
                      alt="Parker Rex"
                      className="w-24 h-24 mr-4 rounded-none"
                    />
                    <div className="flex flex-col">
                      <img
                        src="/signature.png"
                        alt="Parker Rex Signature"
                        className="w-[150px] mb-4"
                      />
                      <p className="text-[17px] md:text-[19px]">
                        Parker Rex
                        <br />
                        Founder & CEO
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <TableOfContents items={tocItems} title="Master Plan" />
    </div>
  );
}

export default Page;
