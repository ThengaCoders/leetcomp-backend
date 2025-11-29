import fetch from "node-fetch";

export async function getLeetCodeTotalSolved(username) {
  try {
    const url = `https://leetcode-stats-api.herokuapp.com/${username}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch stats for ${username}`);
    }

    const data = await response.json();

    // API returns: { totalSolved: number, ... }
    if (data.totalSolved === undefined) {
      throw new Error("totalSolved not found in API response");
    }

    return data.totalSolved;

  } catch (error) {
    console.error("Error fetching LeetCode stats:", error.message);
    return 0;
  }
}
