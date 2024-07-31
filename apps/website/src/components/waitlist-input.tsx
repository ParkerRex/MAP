"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribeAction } from "../actions/subscribe-action";

interface WaitlistInputProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit?: (email: string) => void;
}

export function WaitlistInput({
  placeholder = "Email Address*",
  buttonText = "Sign Up",
  onSubmit,
}: WaitlistInputProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (email) {
      console.log(`Submitting email: ${email}`);
      const formData = new FormData();
      formData.append("email", email);
      const result = await subscribeAction(formData, "waitlist");
      console.log("subscribeAction result:", result);

      if (result.success) {
        console.log("Subscription successful");
        toast.success("You've been added to the waitlist!");
        if (onSubmit) {
          onSubmit(email);
        }
        setEmail("");
      } else {
        console.error("Subscription failed:", result.error);
        setError(result.error || "Failed to subscribe. Please try again.");
        toast.error(result.error || "Failed to subscribe. Please try again.");
      }
    } else {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[500px] flex-col sm:flex-row"
    >
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        className="flex-grow px-6 py-3 text-black placeholder-gray-500 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent mb-2 sm:mb-0"
      />
      <button
        type="submit"
        className="px-6 py-3 sm:ml-2 text-white bg-black rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 text-sm font-semibold"
      >
        {buttonText}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
