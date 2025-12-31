import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { DEV_USER, DEV_SESSION } from "../dev-user";
import {
	getGoalsQuery,
	getProjectsQuery,
	getTasksQuery,
	getUserQuery,
} from "./index";

// Always return dev session in local development
export const getSession = cache(async () => {
	return {
		data: { session: DEV_SESSION },
		error: null,
	};
});

// Always return dev user in local development
export const getUser = async () => {
	const user = await getUserQuery(DEV_USER.id);

	return {
		data: user || DEV_USER,
		id: DEV_USER.id,
	};
};

export const getGoals = async () => {
	const userId = DEV_USER.id;

	return unstable_cache(
		async () => {
			return getGoalsQuery(userId);
		},
		["goals", userId],
		{
			tags: [`goals_${userId}`],
			revalidate: 180,
		},
	)();
};

export const getTasks = async () => {
	const userId = DEV_USER.id;

	return unstable_cache(
		async () => {
			return getTasksQuery(userId);
		},
		["tasks", userId],
		{
			tags: [`tasks_${userId}`],
			revalidate: 180,
		},
	)();
};

export const getProjects = async () => {
	const userId = DEV_USER.id;

	return unstable_cache(
		async () => {
			return getProjectsQuery(userId);
		},
		["projects", userId],
		{
			tags: [`projects_${userId}`],
			revalidate: 180,
		},
	)();
};
