"use client";
import NavBar from "@/components/NavBar";
import { type TOCItem, TableOfContents } from "@/components/TableOfContents";
import MarketingFooter from "@/components/marketing-footer";
import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@map/ui/accordion";

const tocItems: TOCItem[] = [
  { id: "origin", title: "Origin", level: 1 },
  { id: "the-company", title: "The Company", level: 1 },
  { id: "mission", title: "Mission", level: 1 },
  { id: "vision", title: "Vision", level: 1 },
  { id: "values", title: "Values", level: 1 },
  { id: "conclusion", title: "Conclusion", level: 1 },
];

function Page() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <NavBar tocItems={tocItems} />
      <main className="flex-grow">
        <section className="relative w-full h-[740px] flex flex-col justify-center bg-black text-white">
          <div className="px-4">
            <h1 className="text-sm mb-6">Culture at Map</h1>
            <h2 className="text-[42px] md:text-[85px] mb-8 tracking-tighter leading-tight md:w-[850px]">
              MAP WAS FOUNDED
              <br />
              WITH THE AMBITION
              <br />
              <span className="bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
                TO CHANGE LIVES
              </span>
            </h2>
            <p className="text-[14px] md:text-sm mb-4">
              By: Parker Rex, Founder & CEO • July 19, 2024
            </p>
          </div>
        </section>

        <section className="bg-white text-black">
          <div className="flex flex-col px-4 relative pt-[120px]">
            <div className="w-full">
              <section id="origin" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Origin
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
                  Through the intersection of AI and health technology, we are
                  building a comprehensive suite of health and productivity
                  tools. This platform will eliminate the barriers to achieving
                  personal health and productivity goals, allowing current and
                  future generations to live healthier, more purposeful, and
                  more productive lives.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  However, this is no easy feat — in the history of health tech,
                  we have not yet seen the successful integration of health
                  tracking, productivity tools, and AI-driven personalization at
                  a global scale. The journey to build Map to serve millions of
                  users will take years, but if successful, our team has the
                  opportunity to make an unprecedented impact on global health
                  and productivity.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  Here, you will find Map's culture, as laid out in our Mission,
                  Vision, and Values. The culture we build will make or break
                  our future. The following values and beliefs define our
                  identity as a company - how we work, make decisions, treat
                  each other, and operate every day. We will hire, recognize,
                  reward, and fire based on these cultural values. It's
                  important for me to disclose that our culture is not for
                  everyone. If you believe in what you read below, then you are
                  likely to thrive here. If you do not, Map is not for you.
                </p>
              </section>

              <section id="mission" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Mission
                </h2>
                <p className="text-[17px] md:text-[22px] mb-4">
                  Map's mission is to accelerate global health through
                  productivity and goal accomplishment.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  Map is a mission-focused company. We aspire to create
                  healthier, more productive lives for current and future
                  generations and will dedicate our time and resources to this
                  pursuit.
                </p>
              </section>
              <section id="vision" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Vision
                </h2>
                <p className="text-[17px] md:text-[22px] mb-4">
                  Map's vision is to deploy an integrated suite of AI-driven
                  health and productivity tools on a global scale to solve
                  challenges within personal health management and workplace
                  productivity.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We envision a future where our integrated health and
                  productivity platform is the universal interface for personal
                  wellness and achievement. In the early days, our platform will
                  be deployed to individuals struggling with health issues and
                  productivity challenges, particularly in areas with
                  significant health crises like obesity. Longer term, Map will
                  play an important role in many areas such as corporate
                  wellness programs, eldercare support, and optimizing human
                  performance in extreme environments like space exploration.
                </p>
              </section>

              <section id="values" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Values
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  We are looking for the overachievers — the special few who
                  want to put a dent in this world. We are not looking for
                  candidates seeking to minimize their workload or maximize
                  compensation. There are plenty of high paying, cushy jobs out
                  there — that's not what we stand for. Our culture is
                  deliberately cultivated to amplify high performance and to
                  push ourselves to operate at the best of our ability every
                  day.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  In parallel, we will constantly fight to prevent corporate
                  bloat — if we become bureaucratic, morale will die and so will
                  the business. In order to achieve our mission, it is critical
                  to stay focused. The company will always act in the best
                  interest of our users' health and productivity, behave
                  ethically, and treat others fairly. We will not support
                  unrelated social activism, assume negative intent, treat
                  others unfairly, or take on causes outside of our core
                  mission. We are all here to do one job and that is to bring an
                  impactful, useful product to market that improves people's
                  lives.
                </p>

                <p className="text-[17px] md:text-[19px] mb-4">
                  Here are our 5 core values that we live by every day:
                </p>

                <Accordion type="single" collapsible className="space-y-6">
                  <AccordionItem value="item-1">
                    <AccordionTrigger
                      sectionNumber="01"
                      className="text-left md:text-center"
                    >
                      Speed
                    </AccordionTrigger>
                    <AccordionContent>
                      We move fast and iterate quickly. In the rapidly evolving
                      health-tech space, speed is crucial to staying ahead and
                      making a real impact. We're not afraid to launch early and
                      often, learning from our users and improving our product
                      at a rapid pace.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger
                      sectionNumber="02"
                      className="text-left md:text-center"
                    >
                      Take it Personally
                    </AccordionTrigger>
                    <AccordionContent>
                      Our work is our art. We approach every feature, every user
                      interaction, and every line of code as a reflection of our
                      commitment to improving lives. We take pride in our work
                      and hold ourselves to the highest standards of quality and
                      innovation.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger
                      sectionNumber="03"
                      className="text-left md:text-center"
                    >
                      Data-Driven Empathy
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-[17px] md:text-[19px]">
                        We use data to understand our users deeply, but we never
                        forget the human element behind every data point. We
                        combine rigorous analysis with genuine care for our
                        users' wellbeing, ensuring that our solutions are both
                        effective and compassionate.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger
                      sectionNumber="04"
                      className="text-left md:text-center"
                    >
                      Continuous Learning
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-[17px] md:text-[19px]">
                        We're always evolving, just like the technology we
                        build. We encourage constant learning and growth in our
                        team. We stay curious, embrace challenges, and view
                        every obstacle as an opportunity to learn and improve.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger
                      sectionNumber="05"
                      className="text-left md:text-center"
                    >
                      Simplify the Complex
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-[17px] md:text-[19px]">
                        We take complex health and productivity concepts and
                        make them accessible and actionable for our users. We
                        believe that powerful tools should be easy to use, and
                        we strive to create intuitive solutions that seamlessly
                        integrate into our users' lives.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              <section id="conclusion" className="mb-16">
                <h2 className="text-[24px] md:text-5xl font-bold mb-4">
                  Conclusion
                </h2>
                <p className="text-[17px] md:text-[19px] mb-4">
                  I am hopeful that this document will instill the importance of
                  our culture to our current employees, as well as attract new
                  team members with similar beliefs. Map is a mission-focused
                  company, and clarity around our culture will empower the team
                  to make the highest-impact decisions for the benefit of our
                  long-term success.
                </p>
                <p className="text-[17px] md:text-[19px] mb-4">
                  If you share our commitment to building a healthier, more
                  productive future, please apply on our careers page. With a
                  strong, undivided culture, there is potential to change the
                  world of health and productivity.
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
      <MarketingFooter />
      <TableOfContents items={tocItems} title="Culture at Map" />
    </div>
  );
}
export default Page;
