// Import necessary modules and functions
import { createClient } from "@map/supabase/client";
import {
  globalShortcut,
  nativeWindow,
  object,
  platform,
} from "@todesktop/client-core";

// Define window identifiers
const windows = {
  command: "XEVrd9yvoaSgNhFr6GqYX",
};

async function main() {
  // Set up menu item handlers
  // Open X (Twitter) when 'open-x' event is triggered
  await object.on("open-x", () => {
    platform.os.openURL("https://x.com/map_hq");
  });

  // Open Discord when 'open-discord' event is triggered
  await object.on("open-discord", () => {
    platform.os.openURL("https://discord.gg/Ze2hxHen4p");
  });

  // Open GitHub when 'open-github' event is triggered
  await object.on("open-github", () => {
    platform.os.openURL("https://github.com/midday-ai/midday");
  });

  // Set up command menu handler
  // Show the command window when 'open-command-menu' event is triggered
  await object.on("open-command-menu", async () => {
    const winRef = await object.retrieve({ id: windows.command });
    await nativeWindow.show({ ref: winRef });
  });

  // Set up focus event handler for authentication state and command menu behavior
  nativeWindow.on("focus", async () => {
    const winRef = await object.retrieve({ id: windows.command });
    const isCommandWindow = await nativeWindow.isVisible({ ref: winRef });

    // Register or unregister Escape key shortcut based on command window visibility
    if (isCommandWindow) {
      globalShortcut.register("Escape", async () => {
        await nativeWindow.hide({ ref: winRef });
      });
    } else {
      globalShortcut.unregister("Escape");
    }

    // Handle command window specific behavior
    if (winRef?.id === windows.command && isCommandWindow) {
      if (window.location.pathname !== "/desktop/command") {
        // TODO: Fix redirect from middleware if command
        window.location.pathname = "/desktop/command";
      } else {
        // Check authentication status
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Redirect to home if not authenticated
        if (!session) {
          window.location.pathname = "/";
        }
      }
    }
  });
}

// Execute the main function
main();
