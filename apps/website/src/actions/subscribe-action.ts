"use server";

export async function subscribeAction(formData: FormData, userGroup: string) {
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return { success: false, error: "Please provide a valid email address." };
  }

  console.log(`Attempting to subscribe email: ${email} to group: ${userGroup}`);

  try {
    const res = await fetch(
      "https://app.loops.so/api/newsletter-form/cll3w34ka00rtme0ptr6td5au",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          userGroup,
        }),
      },
    );

    const json = await res.json();
    console.log("Loops API response:", json);

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return { success: true, data: json };
  } catch (error) {
    console.error("Error in subscribeAction:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred",
    };
  }
}
