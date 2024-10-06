// Fetches the selectedWord ID for the given room and team
export default async function getSelectedWordId(roomId, teamId) {
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/rooms/${roomId}/teams/${teamId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch team data");
    }

    const team = await response.json();

    // Extract and return the selectedWord ID
    return team.selectedWord;
  } catch (error) {
    console.error("Error fetching selected word ID:", error);
    throw error;
  }
}
