import { apiFetch } from "../lib/api";

export async function createGoal(data: any) {
  return apiFetch<any>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createGoalItem(data: any) {
  return apiFetch<any>("/goals/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGoalItem(id: string, data: any) {
  return apiFetch<any>(`/goals/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
	export async function setGoalCompletion(id: string, isCompleted: boolean) {
	  return apiFetch<any>(`/goals/${id}/complete`, {
	    method: "PATCH",
	    body: JSON.stringify({ isCompleted }),
	  });
	}

	export async function setGoalItemCompletion(id: string, isCompleted: boolean) {
  return apiFetch<any>(`/goals/items/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ isCompleted }),
  });
}

export async function deleteGoalItem(id: string) {
  return apiFetch<void>(`/goals/items/${id}`, {
    method: "DELETE",
  });
}

export async function getGoals(owner?: string) {
  return apiFetch<any[]>("/goals", {
    params: { owner },
  });
}

export async function updateGoal(id: string, data: any) {
  return apiFetch<any>(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(id: string) {
  return apiFetch<void>(`/goals/${id}`, {
    method: "DELETE",
  });
}

export async function getGoalDetails(goalId: string) {
  return apiFetch<any>(`/goals/${goalId}`, { cache: "no-store" });
}

export async function addGroup(goalId: string, groupData: any) {
  return apiFetch<any>(`/goals/${goalId}/groups`, {
    method: "POST",
    body: JSON.stringify(groupData),
  });
}

export async function updateGroup(goalId: string, groupId: string, groupData: any) {
  return apiFetch<any>(`/goals/${goalId}/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(groupData),
  });
}

export async function deleteGroup(goalId: string, groupId: string) {
  return apiFetch<void>(`/goals/${goalId}/groups/${groupId}`, {
    method: "DELETE",
  });
}

// Deprecated alias
export async function upsertGroupStyle(goalId: string, groupData: any) {
   // This was a legacy name-based upsert. Our new API uses IDs.
   // This should ideally be refactored in the UI, but forwarding to create/update if name exists.
   return addGroup(goalId, groupData);
}
