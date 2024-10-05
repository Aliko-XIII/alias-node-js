async function getTeam(roomId, teamId, authToken) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/teams/${teamId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get team: ${response.statusText}`);
        }

        const team = await response.json();
        return team;
    } catch (error) {
        console.error('Error getting team:', error);
        throw error;
    }
}

export { getTeam };