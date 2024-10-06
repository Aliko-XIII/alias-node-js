// fetchers/updateTeamScores.js
const updateTeamScores = async (roomId) => {
  const response = await fetch(
    `http://localhost:8080/api/v1/rooms/${roomId}/calculate-scores`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update team scores");
  }

  return response.json(); // или просто верните response, если не нужно возвращать данные
};

export default updateTeamScores;
