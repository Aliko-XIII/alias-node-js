/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import 'bootstrap/dist/css/bootstrap.min.css';
import TeamCard from './TeamCard';
import { leaveRoom } from '../../fetchers/userRoom';
import { getTeamsFromRoom } from '../../fetchers/getTeamsFromRoom';
import { getPlayersFromRoom } from '../../fetchers/getPlayersFromRoom';
import { joinTeam, leaveTeam } from '../../fetchers/userTeam';
import { getTeam } from '../../fetchers/getTeam';

export default function Room({
	roomObj,
	teamObj,
	setRoom,
	setTeam,
	getIdFromToken,
	setRole,
}) {
	const navigate = useNavigate();
	const [cookies] = useCookies(['access_token']);

	const handleBackClick = async () => {
		const accessToken = cookies.access_token;

		const userId = getIdFromToken();
		if (!userId) {
			console.error('No userId found in token.');
			return;
		}
		await leaveRoom(userId, roomObj._id, accessToken);
		if (teamObj._id) {
			await leaveTeam(userId, teamObj._id, accessToken);
		}
		setRoom({});
		setTeam({});
		navigate('/home');
	};

	const maxUsers = 3;
	const [teams, setTeams] = useState([]);

	const loadTeams = async () => {
		try {
			const authToken = cookies.access_token;

			if (!authToken) {
				console.error('No access token found.');
				navigate('/login');
				return;
			}

			let fetchedTeams = await getTeamsFromRoom(roomObj._id, authToken);
			fetchedTeams = await Promise.all(
				fetchedTeams.map(async (team) => {
					const players = await getPlayersFromRoom(team.roomId, team._id, authToken);
					team.players = players;
					return team;
				})
			);
			setTeams(fetchedTeams);
			fetchedTeams.forEach((fetchedTeam) => {
				if (teamObj._id == fetchedTeam._id) {
					setTeam(fetchedTeam);
				}
			});
		} catch (error) {
			console.error('Failed to load teams:', error);
		}
	};

	useEffect(() => {
		loadTeams();
		const intervalId = setInterval(() => {
			loadTeams();
		}, 500);
		return () => clearInterval(intervalId);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cookies, roomObj, navigate]);

	const updateTeam = async () => {
		const team = await getTeam(roomObj._id, teamObj._id, cookies.access_token);
		setTeam(team);
	};

	useEffect(() => {
		const allTeamsFull = teams.every((team) => team.players.length >= maxUsers);
		if (allTeamsFull && teams.length > 0) {
			updateTeam();
			console.log('ready');
			const userId = getIdFromToken();
			console.log('teamObj:', teamObj);
			if (teamObj.describer != null && teamObj.teamLeader != null) {
				if (teamObj.describer == userId) {
					setRole('describer');
					navigate('/describer');
					return;
				} else if (teamObj.teamLeader == userId) {
					setRole('leader');
				} else {
					setRole('player');
				}
				navigate('/wait-describer');
				return;
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teams, navigate]);

	const addUserToTeam = (teamId) => {
		const userId = getIdFromToken();
		teams.forEach(async (team) => {
			if (team._id === teamId && team.players.length < maxUsers) {
				const teamToJoin = await joinTeam(userId, teamId, cookies.access_token);
				console.log(teamToJoin);
				if(!teamToJoin.teamId){
					return;
				}
				setTeam(teams.find((team) => team._id == teamToJoin.teamId));
			}
			return team;
		});
	};

	const removeUserFromTeam = (teamId) => {
		const userId = getIdFromToken();
		teams.forEach(async (team) => {
			if (team._id === teamId) {
				await leaveTeam(userId, teamId, cookies.access_token);
				setTeam({});
			}
			return team;
		});
	};

	const totalUsers = teams.reduce((acc, team) => acc + team.players.length, 0);

	return (
		<div className='container text-black py-5'>
			<div className='d-flex justify-content-between align-items-center mb-4'>
				<h3 className='mb-0'>Room {roomObj.name}</h3>
				<h3 className='mb-0'>
					Users {totalUsers}/{maxUsers * teams.length}
				</h3>
				<button className='btn btn-secondary' onClick={handleBackClick}>
					BACK
				</button>
			</div>

			{/* <div className="row"> */}
			{teams.map((team) => (
				<div key={team.id} className='col-md-4 mb-4'>
					<TeamCard
						team={team}
						isFull={team.players.length >= maxUsers}
						onAddUser={addUserToTeam}
						onRemoveUser={removeUserFromTeam}
					/>
				</div>
			))}
			{/* </div> */}
		</div>
	);
}
