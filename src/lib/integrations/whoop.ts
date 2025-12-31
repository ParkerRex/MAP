const _WHOOP_API_HOSTNAME = process.env.WHOOP_API_HOSTNAME || "";

export class WhoopClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getSleep(startDate: string, endDate: string) {
    const url = `${process.env.WHOOP_API_HOSTNAME}/developer/v1/activity/sleep?start=${startDate}&end=${endDate}`;
    return this.fetchWithAuth(url);
  }

  async getWorkouts(startDate: string, endDate: string) {
    const url = `${process.env.WHOOP_API_HOSTNAME}/developer/v1/activity/workout?start=${startDate}&end=${endDate}`;
    return this.fetchWithAuth(url);
  }
}
