import type {
  MeetingDetail,
  MeetingListItem,
  SteeringProfile,
  SteeringProfileUpdate,
  TriggerPollResponse,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = init.method?.toUpperCase() ?? "GET";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    cache: method === "GET" ? "no-store" : init.cache,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function getMeetings(): Promise<MeetingListItem[]> {
  return request<MeetingListItem[]>("/meetings");
}

export async function getMeeting(id: number): Promise<MeetingDetail | null> {
  const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  return (await response.json()) as MeetingDetail;
}

export async function runMeeting(id: number): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/meetings/${id}/run`, { method: "POST" });
}

export async function sendFeedback(
  id: number,
  score: 0 | 1,
  notes: string,
): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/meetings/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify({ score, notes }),
  });
}

export async function getSteering(): Promise<SteeringProfile> {
  return request<SteeringProfile>("/steering");
}

export async function updateSteering(
  payload: SteeringProfileUpdate,
): Promise<SteeringProfile> {
  return request<SteeringProfile>("/steering", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function triggerPoll(): Promise<TriggerPollResponse> {
  return request<TriggerPollResponse>("/trigger-poll", { method: "POST" });
}
