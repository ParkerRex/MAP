import { UTCDate } from "@date-fns/utc";
import { faker } from "@faker-js/faker";

import type { Client } from "../types";

export type GetCurrentBurnRateQueryParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetMetricsParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetRunwayQueryParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetTeamBankAccountsParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetTrackerProjectsQueryParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetTransactionsParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetVaultParams = {
  teamId: string;
  // Add other necessary properties
};

export type GetBankAccountsCurrenciesParams = {
  teamId: string;
  // Add other necessary properties
};

export type getBankAccountsCurrenciesQuery = {
  teamId: string;
  // Add other necessary properties
};

export type getCurrentBurnRateQuery = {
  teamId: string;
  // Add other necessary properties
};

export const getCurrentBurnRateQuery = (
  supabase: any,
  params: GetCurrentBurnRateQueryParams,
) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeCurrentBurnRate = {
          amount: faker.finance.amount(1000, 100000, 2),
          currency: faker.finance.currencyCode(),
          period: faker.helpers.arrayElement(["daily", "weekly", "monthly"]),
          timestamp: faker.date.recent().toISOString(),
        };

        resolve({
          data: fakeCurrentBurnRate,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type getSpendingQuery = {
  teamId: string;
  // Add other necessary properties
};

export type getMetricsQuery = {
  teamId: string;
  // Add other necessary properties
};

export const getMetricsQuery = (supabase: Client, params: GetMetricsParams) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeMetrics = {
          revenue: faker.finance.amount(10000, 1000000, 2),
          expenses: faker.finance.amount(5000, 500000, 2),
          profit: faker.finance.amount(1000, 100000, 2),
          userCount: faker.number.int({ min: 100, max: 10000 }),
          activeUsers: faker.number.int({ min: 50, max: 5000 }),
          churnRate: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
          conversionRate: faker.number.float({
            min: 1,
            max: 10,
            precision: 0.1,
          }),
          averageOrderValue: faker.finance.amount(50, 500, 2),
          customerAcquisitionCost: faker.finance.amount(10, 200, 2),
          timestamp: faker.date.recent().toISOString(),
        };

        resolve({
          data: fakeMetrics,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type GetTeamMembersQueryParams = {
  teamId: string;
};

export const getTeamMembersQuery = (supabase: Client, teamId: string) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeTeamMembers = Array.from(
          { length: faker.number.int({ min: 3, max: 10 }) },
          () => ({
            id: faker.string.uuid(),
            user_id: faker.string.uuid(),
            team_id: teamId,
            full_name: faker.person.fullName(),
            email: faker.internet.email(),
            role: faker.helpers.arrayElement(["admin", "member", "viewer"]),
            avatar_url: faker.image.avatar(),
            joined_at: faker.date.past().toISOString(),
            last_active: faker.date.recent().toISOString(),
          }),
        );

        resolve({
          data: fakeTeamMembers,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type GetBankAccountsCurrenciesQueryParams = {
  teamId: string;
};

export const getBankAccountsCurrenciesQuery = (
  supabase: Client,
  params: GetBankAccountsCurrenciesQueryParams,
) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeCurrencies = Array.from(
          { length: faker.number.int({ min: 1, max: 5 }) },
          () => faker.finance.currencyCode(),
        );

        resolve({
          data: fakeCurrencies,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type GetBurnRateQueryParams = {
  teamId: string;
  startDate: string;
  endDate: string;
};

export const getBurnRateQuery = (
  supabase: Client,
  params: GetBurnRateQueryParams,
) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeBurnRate = {
          averageBurnRate: faker.finance.amount(5000, 50000, 2),
          burnRateByMonth: Array.from({ length: 6 }, () => ({
            month: faker.date
              .between({ from: params.startDate, to: params.endDate })
              .toISOString()
              .slice(0, 7),
            burnRate: faker.finance.amount(3000, 60000, 2),
          })),
          totalBurn: faker.finance.amount(30000, 300000, 2),
          currency: "USD",
        };

        resolve({
          data: fakeBurnRate,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export const getUserInvitesQuery = (supabase: Client, email: string) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeUserInvites = Array.from(
          { length: faker.number.int({ min: 0, max: 3 }) },
          () => ({
            id: faker.string.uuid(),
            team_id: faker.string.uuid(),
            team_name: faker.company.name(),
            invitee_email: email,
            inviter_id: faker.string.uuid(),
            inviter_name: faker.person.fullName(),
            role: faker.helpers.arrayElement(["admin", "member", "viewer"]),
            created_at: faker.date.recent().toISOString(),
            expires_at: faker.date.future().toISOString(),
            status: "pending",
          }),
        );

        resolve({
          data: fakeUserInvites,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export const getVaultQuery = (supabase: Client, params: GetVaultParams) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeVaultItems = Array.from(
          { length: faker.number.int({ min: 3, max: 10 }) },
          () => ({
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            type: faker.helpers.arrayElement(["password", "note", "file"]),
            created_at: faker.date.past().toISOString(),
            updated_at: faker.date.recent().toISOString(),
            last_accessed: faker.date.recent().toISOString(),
            size: faker.number.int({ min: 1, max: 1000 }),
            encrypted_data: faker.string.alphanumeric(100),
          }),
        );

        resolve({
          data: fakeVaultItems,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type getTeamInvitesQuery = {
  teamId: string;
  // Add other necessary properties
};

export const getTeamInvitesQuery = (supabase: any, teamId: string) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeTeamInvites = Array.from(
          { length: faker.number.int({ min: 1, max: 5 }) },
          () => ({
            id: faker.string.uuid(),
            team_id: teamId,
            invitee_email: faker.internet.email(),
            inviter_id: faker.string.uuid(),
            inviter_name: faker.person.fullName(),
            role: faker.helpers.arrayElement(["admin", "member", "viewer"]),
            created_at: faker.date.recent().toISOString(),
            expires_at: faker.date.future().toISOString(),
            status: faker.helpers.arrayElement([
              "pending",
              "accepted",
              "rejected",
            ]),
          }),
        );

        resolve({
          data: fakeTeamInvites,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type getTeamUserQuery = {
  teamId: string;
  // Add other necessary properties
};

export type getBurnRateQuery = {
  userId: string;
  // Add other necessary properties
};

export type getTeamsByUserIdQuery = {
  userId: string;
  // Add other necessary properties
};

export const getTeamsByUserIdQuery = (supabase: any, userId: string) => {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeTeams = Array.from(
          { length: faker.number.int({ min: 1, max: 3 }) },
          () => ({
            id: faker.string.uuid(),
            name: faker.company.name(),
            created_at: faker.date.past().toISOString(),
            updated_at: faker.date.recent().toISOString(),
            owner_id: userId,
            subscription_tier: faker.helpers.arrayElement([
              "free",
              "pro",
              "enterprise",
            ]),
            logo_url: faker.image.url(),
            members_count: faker.number.int({ min: 1, max: 50 }),
          }),
        );

        resolve({
          data: fakeTeams,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
};

export type getTeamMembersQuery = {
  userId: string;
  // Add other necessary properties
};

export type getVaultQuery = {
  userId: string;
  // Add other necessary properties
};

export type getUserInvitesQuery = {
  userId: string;
  // Add other necessary properties
};

// Keep this function as is
export function getPercentageIncrease(a: number, b: number) {
  return a > 0 && b > 0 ? Math.abs(((a - b) / b) * 100).toFixed() : 0;
}

// Keep getUserQuery as is
export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getTeamUserQuery(
  supabase: Client,
  params: { userId: string; teamId: string },
) {
  // Simulate a delay to mimic a database query
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const fakeTeamUser = {
          id: params.userId,
          team_id: params.teamId,
          role: faker.helpers.arrayElement(["admin", "member", "viewer"]),
          joined_at: faker.date.past().toISOString(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          avatar_url: faker.image.avatar(),
          last_active: faker.date.recent().toISOString(),
        };

        resolve({
          data: fakeTeamUser,
          error: null,
        });
      },
      faker.number.int({ min: 100, max: 1000 }),
    );
  });
}

// Keep getGoalsQuery as is
export async function getGoalsQuery(supabase: Client, userId: string) {
  return supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("due_at", { ascending: true })
    .throwOnError();
}

// Keep getTasksQuery as is
export async function getTasksQuery(supabase: Client, userId: string) {
  return supabase
    .from("tasks")
    .select(`
      *,
      project:project_id(*),
      header:header_id(*),
      assigned:assigned_to(*)
    `)
    .eq("created_by", userId)
    .order("due_at", { ascending: true })
    .throwOnError();
}

// Keep getProjectsQuery as is
export async function getProjectsQuery(supabase: Client, userId: string) {
  return supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .throwOnError();
}

// Fake the rest of the functions
export async function getTransactionsQuery(
  supabase: unknown,
  p0: { teamId: any },
) {
  return {
    data: Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      amount: faker.number.int({ min: -1000, max: 1000 }),
      currency: "USD",
      date: faker.date.recent().toISOString(),
      description: faker.lorem.sentence(),
      category: {
        id: faker.string.uuid(),
        name: faker.commerce.department(),
        color: faker.color.rgb(),
      },
    })),
    count: 100,
  };
}

export type GetRunwayParams = {
  teamId: string;
  from: string;
  to: string;
};

export async function getRunwayQuery(
  supabase: unknown,
  p0: { teamId: any },
  params: GetRunwayParams,
) {
  const { from, to } = params;

  return {
    data: {
      runway: faker.number.int({ min: 1, max: 24 }),
      burnRate: faker.number.float({
        min: 10000,
        max: 100000,
        precision: 0.01,
      }),
      balance: faker.number.float({
        min: 100000,
        max: 1000000,
        precision: 0.01,
      }),
      currency: "USD",
      updatedAt: faker.date.recent().toISOString(),
    },
    meta: {
      from,
      to,
    },
  };
}

export async function getBankConnectionsByTeamIdQuery(
  supabase: unknown,
  teamId: any,
) {
  return {
    data: Array.from({ length: 3 }, () => ({
      id: faker.string.uuid(),
      name: faker.company.name(),
      logo_url: faker.image.url(),
      created_at: faker.date.past().toISOString(),
    })),
  };
}

export async function getTeamBankAccountsQuery(
  supabase: unknown,
  p0: { teamId: any },
) {
  return {
    data: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      name: faker.finance.accountName(),
      balance: faker.number.int({ min: 1000, max: 100000 }),
      currency: "USD",
      created_at: faker.date.past().toISOString(),
    })),
  };
}

export async function getTrackerProjectsQuery(
  supabase: unknown,
  p0: { teamId: any },
) {
  return {
    data: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    })),
  };
}

export type GetSpendingParams = {
  teamId: string;
  from: string;
  to: string;
  groupBy: "day" | "week" | "month";
};

export async function getSpendingQuery(
  supabase: unknown,
  params: GetSpendingParams,
) {
  const { from, to, groupBy } = params;
  const numberOfGroups = groupBy === "day" ? 30 : groupBy === "week" ? 12 : 6;

  return {
    data: Array.from({ length: numberOfGroups }, (_, index) => ({
      date: faker.date.between({ from, to }).toISOString(),
      amount: faker.number.int({ min: 1000, max: 10000 }),
      currency: "USD",
    })),
    meta: {
      total: faker.number.int({ min: 50000, max: 200000 }),
      from,
      to,
      groupBy,
    },
  };
}

export type GetTrackerRecordsByRangeParams = {
  from: string;
  to: string;
  projectId: string;
  teamId: string;
};

export async function getTrackerRecordsByRangeQuery(
  supabase: unknown,
  params: GetTrackerRecordsByRangeParams,
) {
  return {
    meta: {
      totalDuration: faker.number.int({ min: 1000, max: 10000 }),
      from: params.from,
      to: params.to,
    },
    data: Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      date: faker.date.recent().toISOString(),
      duration: faker.number.int({ min: 1, max: 8 }),
      project_id: params.projectId,
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    })),
  };
}

export type GetCategoriesParams = {
  limit?: number;
  teamId: string;
};

export async function getCategoriesQuery(
  supabase: unknown,
  params: GetCategoriesParams,
) {
  return {
    data: Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      name: faker.commerce.department(),
      color: faker.color.rgb(),
      slug: faker.helpers.slugify(faker.commerce.department()),
      description: faker.lorem.sentence(),
      system: faker.datatype.boolean(),
      vat: faker.number.int({ min: 0, max: 20 }),
    })),
  };
}

type GetInboxSearchParams = {
  limit?: number;
  q: string;
};

export async function getInboxSearchQuery(params: GetInboxSearchParams) {
  return {
    data: Array.from({ length: params.limit || 10 }, () => ({
      id: faker.string.uuid(),
      created_at: faker.date.past().toISOString(),
      file_name: faker.system.fileName(),
      amount: faker.number.int({ min: -1000, max: 1000 }),
      currency: "USD",
      file_path: faker.system.filePath(),
      content_type: faker.system.mimeType(),
      due_date: faker.date.future().toISOString(),
      display_name: faker.person.fullName(),
      size: faker.number.int({ min: 1000, max: 10000 }),
    })),
  };
}
