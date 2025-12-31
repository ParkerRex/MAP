"use server";
// TODO: add in our tools.
import { BotMessage, SpinnerMessage } from "@/components/chat/messages";
import { openai } from "@ai-sdk/openai";
import {
  // getBankAccountsCurrencies,
  getUser,
} from "@/lib/db/cached-queries";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { startOfMonth, subMonths } from "date-fns";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getAssistantSettings, saveChat } from "../storage";
import type { AIState, Chat, ClientMessage, UIState } from "../types";
// import { getBurnRateTool } from "./tools/burn-rate";
// import { getForecastTool } from "./tools/forecast";
// import { getDocumentsTool } from "./tools/get-documents";
// import { getTransactionsTool } from "./tools/get-transactions";
// import { getProfitTool } from "./tools/profit";
// import { createReport } from "./tools/report";
// import { getRevenueTool } from "./tools/revenue";
// import { getRunwayTool } from "./tools/runway";
// import { getSpendingTool } from "./tools/spending";

// Simple in-memory rate limiting for dev
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const ratelimit = {
  limit: async (key: string | null) => {
    const now = Date.now();
    const entry = rateLimitMap.get(key ?? "default");
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key ?? "default", { count: 1, resetAt: now + 10000 });
      return { success: true };
    }
    if (entry.count >= 10) {
      return { success: false };
    }
    entry.count++;
    return { success: true };
  },
};

export async function submitUserMessage(
  content: string,
): Promise<ClientMessage> {
  "use server";
  const ip = headers().get("x-forwarded-for");
  const { success } = await ratelimit.limit(ip);

  const aiState = getMutableAIState<typeof AI>();

  if (!success) {
    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: "assistant",
          content:
            "Not so fast, tiger. You've reached your message limit. Please wait a minute and try again.",
        },
      ],
    });

    return {
      id: nanoid(),
      role: "assistant",
      display: (
        <BotMessage content="Not so fast, tiger. You've reached your message limit. Please wait a minute and try again." />
      ),
    };
  }

  const user = await getUser();
  const teamId = user?.data?.team_id as string;

  const defaultValues = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    currency:
      (await getBankAccountsCurrencies())?.data?.at(0)?.currency ?? "USD",
  };

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: "user",
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  const result = await streamUI({
    model: openai("gpt-4o-mini"),
    initial: <SpinnerMessage />,
    system: `\
    You are a helpful assistant in Map who can help users ask questions about their calendar, goals, tasks, health statistics and more.

    If the user wants to see today's calendar agenda, call \`getAgenda\` function.
    If the user just wants the weather, call \`getWeather\` function.
    If the user just wants the runway, call \`getRunway\` function.
    If the user just wants the profit, call \`getProfit\` function.
    If the user just wants to find transactions, call \`getTransactions\` function.
    If the user just wants to find documents, invoices or receipts, call \`getDocuments\` function.

    Always try to call the functions with default values, otherwise ask the user to respond with parameters. Just show one example if you can't call the function.
    
    `,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
        display: null,
      })),
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue("");
        textNode = <BotMessage content={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
    tools: {
      getSpending: getSpendingTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getBurnRate: getBurnRateTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getRunway: getRunwayTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getProfit: getProfitTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getRevenue: getRevenueTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getForecast: getForecastTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getTransactions: getTransactionsTool({ aiState }),
      getDocuments: getDocumentsTool({ aiState, teamId }),
      createReport: createReport({
        aiState,
        userId: user?.data?.id ?? "",
        teamId,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  onSetAIState: async ({ state, done }) => {
    "use server";

    const settings = await getAssistantSettings();
    const createdAt = new Date();
    const userId = state.user.id;

    const { chatId, messages } = state;

    const firstMessageContent = messages?.at(0)?.content ?? "";
    const title =
      typeof firstMessageContent === "string"
        ? firstMessageContent.substring(0, 100)
        : "";

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
    };

    if (done && settings?.enabled) {
      await saveChat(chat);
    }
  },
});
