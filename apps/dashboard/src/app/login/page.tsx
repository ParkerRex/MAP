import { GoogleSignIn } from "@/components/google-sign-in";
import { Icons } from "@map/ui/icons";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";

export const metadata: Metadata = {
  title: "Login | MAP",
};

export default async function Page() {
  const { device } = userAgent({ headers: headers() });

  const signInOption = <GoogleSignIn />;

  return (
    <div>
      <header className="w-full fixed left-0 right-0">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="https://mapthemap.com">
            <Icons.Logo />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col py-8">
          <div className="flex w-full flex-col relative">
            {/* Login title */}
            <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
              <h1 className="font-medium pb-1 text-3xl">Login to MAP.</h1>
            </div>

            {/* Description */}
            <p className="font-medium pb-1 text-2xl text-[#878787]">
              Set goals, <br /> track progress, and boost
              <br />
              your health
              <br /> and happiness effortlessly.
            </p>

            {/* Sign-in option */}
            <div className="pointer-events-auto mt-6 flex flex-col mb-6">{signInOption}</div>

            {/* Terms and Privacy Policy */}
            <p className="text-xs text-[#878787]">
              By clicking continue, you acknowledge that you have read and agree to map's{" "}
              <a href="https://mapthemap.com/terms" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="https://mapthemap.com/policy" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
