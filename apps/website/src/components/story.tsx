import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function SectionOne() {
  return (
    <section className="flex flex-col text-center mt-8 md:mt-[200px] mb-12 p-2 overflow-x-hidden">
      <div className="mx-auto py-8">
        <div className="mx-auto max-w-md text-left sm:max-w-screen">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            Ditch the clutter. <br />
            Fly through goals instead.
          </h2>
          <p className="mb-3 mt-8 font-light md:text-2xl">
            It's a struggle to keep track of all the things you need to do.
            You've got your work life, your personal life, your laundry, your
            health, and so much more. We're like you. That's{' '}
            <span className="underline">why I built Map.</span>
          </p>
          <p>
            <br />
            <span className="font-bold">
              In Map, your entire day operates from a single page.
            </span>{' '}
            Map is built for getting things done. It's not a place to store your
            ideas, it's a place to make them happen.{' '}
          </p>
          <br />

          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            You don't need to glue together your own system.
          </h2>
          <p className="mb-3 mt-8 font-light md:text-2xl">
            You need all the daily drivers. You need a calendar, a to-do list, a
            habit tracker, a journal.. Something to track your fitness. But the
            issue is it doesn't need to be separate. It could be a whole lot
            easier if they all talked to eachother.{' '}
            <span className="font-bold">That's what Map is.</span>
          </p>
          <p className="mb-3 mt-8 font-light md:text-2xl">
            {' '}
            One spot for all your daily drivers. Productivity and health
            combined. Everything bubbles up to your goals. Oh. Almost forgot.
            There's a coach.
          </p>
          <h2 className="font-display pt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            Everybody Deserves a Coach.
          </h2>
          <p className="mb-3 mt-8 font-light md:text-2xl">
            {' '}
            Map is a platform. What's that mean? It means we have a bunch of
            different apps, and they all are powered by a coach. It's not a
            coach _we_ tell how to act. It's a coach _you_ tell how to act based
            on the goals you want to achieve. You speak with Map about what you
            want to be when you grow up and it's sole purpose in life is to help
            you get there.
          </p>
          <h2 className="font-display pt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            Seems Too Aspirational..{' '}
          </h2>
          <p className="mb-3 mt-8 font-light md:text-2xl">
            {' '}
            I know. It's a big claim. But you have to try it for yourself. In
            the future everyone will have a coach in their pocket. They'll have
            access to the best version of themselves. One that is you when you
            are at your best. A representation of the Ideal Parker. We're
            working hard to make this a reality and using quartlery timescales
            to start. <br />
            Why quarters? Quarters are long enough to get a lot done, and short
            enough to keep track and course correct quickly. `
          </p>
        </div>
      </div>

      <div className="">
        <div className="text-center">
          <h4 className="text-4xl">Frequently asked questions</h4>
        </div>

        <Accordion type="single" collapsible className="w-full mt-10 mb-48">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <span className="truncate">How did Map come to be?</span>
            </AccordionTrigger>
            <AccordionContent>
              I (Parker) wrote software for myself to help me get more done
              everyday, then chose to make it available to the public. .
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>When can I get access to Map?</AccordionTrigger>
            <AccordionContent>Fall 2024.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What is Map?</AccordionTrigger>
            <AccordionContent>
              Map is a suite of health and productivity tools designed to help
              you get healthier and happier.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>
              <span className="truncate max-w-[300px] md:max-w-full">
                How does Map help me?
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Map takes the crazy learning curve that is getting healthier and
              more accomplished, and pushes it down as far as possible.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>
              <span className="truncate max-w-[300px] md:max-w-full">
                Can I cancel my subscription at any time?
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Yes, you can cancel your subscription at any time. If you cancel
              your subscription, you will still be able to use Map until the end
              of your billing period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>
              <span className="truncate max-w-[300px] md:max-w-full">
                I have more questions about MaptheMap.com. How can I get in
                touch?
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Sure, we're happy to answer any questions you might have. Just
              send us an email at{' '}
              <a href="mailto:support@map.ai">support@mapthemap.com</a> and
              we'll get back to you as soon as possible.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>
              <span className="truncate max-w-[300px] md:max-w-full">
                What problems will you solve in the future?
              </span>
            </AccordionTrigger>
            <AccordionContent>Making sense of health data.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
