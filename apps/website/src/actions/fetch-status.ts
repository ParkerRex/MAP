"use server";

import { getStatus } from "@openstatus/react";

export async function fetchStatus() {
  const res = await getStatus("map");

  const { status } = res;

  return status;
}
