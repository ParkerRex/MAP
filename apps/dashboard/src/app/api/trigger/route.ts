// Import the client from the jobs package
import { client } from "@map/jobs";
// Import the createAppRoute function from the trigger.dev Next.js package
import { createAppRoute } from "@trigger.dev/nextjs";

// Specify that this route should use the Node.js runtime
export const runtime = "nodejs";
// Set the maximum execution duration to 5 minutes (300 seconds)
export const maxDuration = 300; // 5min

// Import all exports from the jobs package
import "@map/jobs";

// Create and export the POST and dynamic properties for the app route
export const { POST, dynamic } = createAppRoute(client);
