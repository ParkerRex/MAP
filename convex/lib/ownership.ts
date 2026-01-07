import { ConvexError } from "convex/values";

export function assertOwner(ownerId: string, viewerId: string, message = "Forbidden") {
  if (ownerId !== viewerId) {
    throw new ConvexError(message);
  }
}
