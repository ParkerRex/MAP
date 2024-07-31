"use client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/marketing-footer";
import { Separator } from "@map/ui/separator";
import React from "react";

function Page() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <NavBar tocItems={[]} />
      <main className="flex flex-col justify-between">
        <section className="relative w-full flex flex-col justify-center">
          <div className="px-4 py-8 md:h-[550px] md:flex md:items-center">
            <h1 className="text-[42px] pr-[50px] md:text-[85px] lg:text-[100px] tracking-tighter leading-tight w-full">
              OUR POPULATION IS <br />
              UNHEALTHY.
            </h1>
          </div>
          <Separator />
          <div className="px-4 py-8 md:h-[550px] md:flex md:items-center">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
              <p className="text-[24px] md:text-[32px] lg:text-[36px] mb-4 md:mb-0 md:max-w-md md:text-right order-2 md:order-1">
                DEATHS PER YEAR BY OBESITY.
              </p>
              <div className="text-[158px] md:text-[300px] lg:text-[440px] bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text tracking-tighter order-1 md:order-2">
                8M
              </div>
            </div>
          </div>
          <Separator />
          <div className="px-4 py-8 md:h-[550px] md:flex md:items-center">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
              <p className="text-[24px] md:text-[32px] lg:text-[36px] mb-4 md:mb-0 md:max-w-md md:text-right order-2 md:order-1">
                OF THE GLOBAL POPULATION WILL BE OBESE BY 2030.
              </p>
              <div className="text-[158px] md:text-[300px] lg:text-[440px] bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text tracking-tighter order-1 md:order-2">
                50%
              </div>
            </div>
          </div>
          <Separator />
          <div className="px-4 py-8 md:h-[550px] md:flex md:items-center">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
              <p className="text-[24px] md:text-[32px] lg:text-[36px] mb-4 md:mb-0 md:max-w-md md:text-right order-2 md:order-1">
                of leading causes of death in America are from preventable
                chronic diseases
              </p>
              <div className="text-[158px] md:text-[300px] lg:text-[440px] bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text tracking-tighter uppercase order-1 md:order-2">
                90 %
              </div>
            </div>
          </div>
          <Separator />
          <div className="px-4 py-8 md:h-[850px] md:flex md:items-center bg-black text-white">
            <div className="flex flex-col justify-center w-full">
              <p className="text-sm mb-4">
                Enter: a platform to bridge the gap
              </p>
              <h2 className="text-[42px] md:text-[70px] lg:text-[85px] tracking-tighter leading-tight w-full mb-8">
                OUR GOAL IS TO DEPLOY AN INTEGRATED SUITE OF AI-DRIVEN HEALTH
                AND PRODUCTIVITY TOOLS{" "}
                <span className="bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
                  ON A GLOBAL SCALE
                </span>
              </h2>
            </div>
          </div>
          <Separator />
          <div className="px-4 py-8 md:h-[550px] md:flex md:items-center bg-black text-white">
            <div className="flex flex-col md:flex-row md:justify-between w-full">
              <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-8 md:mb-0">
                <h2 className="text-[24px] md:text-[32px] lg:text-[36px] tracking-tighter leading-tight">
                  As we reach the limits of traditional health and productivity
                  approaches, Map will empower individuals with the ability to
                  think, learn, and interact with their health and goals in
                  unprecedented ways.
                </h2>
              </div>
              <div className="w-full md:w-1/2">
                <p className="text-[14px] md:text-sm">
                  Map is AI-powered and user-centric, ready to produce an
                  abundance of personalized health insights and productivity
                  gains to a degree which humanity has never seen.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Page;
