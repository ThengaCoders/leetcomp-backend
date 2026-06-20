import fetch from "node-fetch";

export async function getLeetCodeTotalSolved(username) {
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

    if (!response.ok) {
      throw new Error(`Failed to fetch stats for ${username}`);
    }

    const data = await response.json();

    // Safely check if user exists and navigate the GraphQL response
    if (data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum) {
      const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;
      const totalSolvedObj = stats.find((stat) => stat.difficulty === "All");
      return totalSolvedObj ? totalSolvedObj.count : 0;
    }

    return 0; // Fallback if data is missing
  } catch (error) {
    console.error(`[LeetCode API ERROR for ${username}]:`, error.message);
    return 0;
  }
}