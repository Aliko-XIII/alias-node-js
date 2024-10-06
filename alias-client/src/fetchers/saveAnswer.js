export const saveAnswer = async (roomId, teamId, answer, success) => {
	try {
		const response = await fetch(
			`http://localhost:8080/api/v1/rooms/${roomId}/teams/${teamId}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					answer,
					success,
				}),
			}
		);

		if (!response.ok) {
			throw new Error('Failed to save the answer');
		}

		return true; // Вернуть true, если запрос прошел успешно
	} catch (error) {
		console.error('Error saving answer:', error);
		return false; // Вернуть false в случае ошибки
	}

};
