import { useEffect, useState } from 'react';
import { getLeaderboard } from '../../fetchers/getLeaderboard';
import { Link } from 'react-router-dom';

export default function LeaderBoardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userList = await getLeaderboard();
                setUsers(userList);
            } catch {
                setError('Failed to load leaderboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="text-center my-5">Loading...</div>;
    }

    if (error) {
        return <div className="text-center my-5 text-danger">{error}</div>;
    }

    return (
        <div className='container my-4 mt-5'>
            <h2 className='text-center mb-4'>Leaderboard</h2>
            <div className='text-center'>
                <p className='mb-0'>
                    Welcome to the Alias Game Leaderboard! Here, you can see the top
                    players competing for glory.
                </p>
                <p>
                    <strong>Challenge yourself!</strong> The more you play, the better you
                    get! Can you beat the top players?
                </p>
            </div>

            <div className='table-responsive'>
                <div className='row justify-content-center'>
                    <div className='col-lg-7 col-md-8'>
                        <div className='table-responsive'>
                            <table className='table table-striped table-hover'>
                                <thead className='thead-dark'>
                                    <tr>
                                        <th scope='col'>#</th>
                                        <th scope='col'>Username</th>
                                        <th scope='col'>Score</th>
                                        <th scope='col' className='text-center'>
                                            Games Played
                                        </th>
                                        <th scope='col'>Wins</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.userId}>
                                            <th scope='row'>{index + 1}</th>
                                            <td>{user.username}</td>
                                            <td>{user.score}</td>
                                            <td className='text-center'>{user.played}</td>
                                            <td>{user.wins}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className='text-center mb-4 mt-4'>
                <h5>Ready to join the fun?</h5>
                <Link to='/' className='btn btn-secondary'>
                    Register Now
                </Link>
            </div>
        </div>
    );
}