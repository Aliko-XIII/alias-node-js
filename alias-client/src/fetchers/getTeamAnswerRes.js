// Function to fetch the team result based on roomId and teamId
const getTeamAnswerRes = async (roomId, teamId) => {
  const url = `http://localhost:8080/api/v1/rooms/${roomId}/teams/${teamId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch team results");
    }

    const data = await response.json();
    const { answer, selectedWord, success } = data;
    return { answer, selectedWord, success };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to fetch team results");
  }
};

export default getTeamAnswerRes;
