import { Schema } from "@/generated";
import { isAddress } from "viem";
import { shortId } from "../utils";

type Result = { label: string, emoji: string, type: Schema["Atom"]["type"] }

export function getSupportedAtomMetadata(atomData: string): Result {
  if (isAddress(atomData)) {
    return { label: shortId(atomData), emoji: "⛓️", type: "Account" }
  }

  switch (atomData) {
    case "https://schema.org/Person":
      return { label: "is person", emoji: "👤", type: "PersonPredicate" }

    case "https://schema.org/Thing":
      return { label: "is thing", emoji: "🧩", type: "ThingPredicate" }

    case "https://schema.org/Organization":
      return { label: "is organization", emoji: "🏢", type: "OrganizationPredicate" }

    case "https://schema.org/keywords":
      return { label: "has tag", emoji: "🏷️", type: "Keywords" }

    case "https://schema.org/LikeAction":
      return { label: "like", emoji: "👍", type: "LikeAction" }

    case "https://schema.org/FollowAction":
      return { label: "follow", emoji: "🔔", type: "FollowAction" }

    default:
      return { label: "Unknown", emoji: "❓", type: "Unknown" }
  }
}
