import fetch from "node-fetch";

export default async function fetchLeetCodeSolved(username) {
  if (!username) return 0;

  const graphqlUrl = "https://leetcode.com/graphql";
  const query = {
    query: `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username: username },
  };

  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(query),
    });

    const data = await response.json();

    if (data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum) {
      const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
      const totalSolvedObj = stats.find((stat) => stat.difficulty === "All");
      return totalSolvedObj ? totalSolvedObj.count : 0;
    }

    console.error("[LeetCode API] Unexpected response for", username);
    return 0;
  } catch (err) {
    console.error("[LeetCode API ERROR]", err.message);
    return 0;
  }
}