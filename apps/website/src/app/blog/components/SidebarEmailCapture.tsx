"use client";
import { Button } from "@map/ui/button";
import { Card, CardContent, CardHeader } from "@map/ui/card";
import { Input } from "@map/ui/input";
import { type SetStateAction, useState } from "react";

const SideBarEmailCapture = () => {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<
    "INIT" | "SUBMITTING" | "SUCCESS" | "ERROR"
  >("INIT");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formState !== "INIT") return; // Ensure we only submit from initial state
    setFormState("SUBMITTING");
    setFeedbackMessage("");

    // Prepare the form body with email
    const formBody = `email=${encodeURIComponent(email)}`;

    try {
      // Fetch request to the specified endpoint
      const response = await fetch(
        "https://app.loops.so/api/newsletter-form/cll3w34ka00rtme0ptr6td5au",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody,
        },
      );

      if (!response.ok) {
        // Handle response error
        const responseData = await response.json();
        console.error("Error response:", responseData); // Logging error response
        throw new Error(
          responseData.error || "Something went wrong, please try again.",
        );
      }

      // Reset form on success
      setEmail("");
      setFormState("SUCCESS");
      setFeedbackMessage("Good moves. Chat soon.");
    } catch (error) {
      console.error("Failed to submit email:", error);
      setFormState("ERROR");
      setFeedbackMessage("Failed to subscribe. Please try again later.");
    }
  };

  return (
    <Card className="">
      <CardContent>
        <CardHeader>
          <h3 className="font-bold">Weekly Health & Productity Tips</h3>
          <span className="text-6xl">📨</span>
        </CardHeader>

        {formState !== "SUCCESS" && (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setEmail(e.target.value)
              }
              required
              className="rounded-md border-2 border-gray-300 p-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            />
            <Button
              type="submit"
              disabled={formState === "SUBMITTING"}
              variant="default"
            >
              {formState === "SUBMITTING" ? "Submitting..." : "Get It Now"}
            </Button>
          </form>
        )}
        {feedbackMessage && (
          <p
            className={`text-sm ${
              formState === "ERROR" ? "text-red-500" : "text-green-500"
            } dark:text-gray-300`}
          >
            {feedbackMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SideBarEmailCapture;
