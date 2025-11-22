import fetch from "node-fetch";

export async function validateLeetCodeUsername(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { username }
    })
  });

  const data = await response.json();

  return Boolean(data?.data?.matchedUser);
}
