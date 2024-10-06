/**
 * Fetches team scores for a specific room.
 * @param {string} roomId - The ID of the room to fetch teams for.
 * @returns {Promise<Array>} - A promise that resolves to an array of teams.
 */
const getTeamScoresInRoom = async (roomId) => {
  const response = await fetch(
    `http://localhost:8080/api/v1/rooms/${roomId}/teams`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch team scores");
  }

  const teams = await response.json();

  return teams.map((team) => ({
    _id: team._id,
    name: team.name,
    teamScore: team.teamScore,
  }));
};

export default getTeamScoresInRoom;
