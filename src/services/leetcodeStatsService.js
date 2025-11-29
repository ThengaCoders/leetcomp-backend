import fetch from "node-fetch";

export default async function fetchLeetCodeSolved(username) {
    if (!username) return 0;

    try {
        const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
        const data = await res.json();

        if (data && typeof data.totalSolved === "number") {
            return data.totalSolved;
        }

        console.error("[LeetCode API] Unexpected response for", username, data);
        return 0;
    } catch (err) {
        console.error("[LeetCode API ERROR]", err);
        return 0;
    }
}
