import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile({getIdFromToken, getTokens}) {
    const [userData, setUserData] = useState({
      username: '',
      score: 0,
      played: 0,
      wins: 0,
    });
  
    const [isEditing, setIsEditing] = useState(false);

    const userId = getIdFromToken();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
              const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/users/${userId}`, 
                {
                    headers: {
                        Authorization: `Bearer ${getTokens().access_token}`
                    }
                }
            );
    
                setUserData(response.data);
            } catch (error) {
                console.error('Error', error)
            }
        }
      fetchUserData();
    }, []);
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setUserData({
        ...userData,
        [name]: value,
      });
    };
  
    const handleEditClick = () => {
      setIsEditing(true);
    };
  
    const handleSaveClick = async () => {
        try {
            await axios.patch(`${import.meta.env.VITE_SERVER_URL}/api/v1/users/${userData.userId}`, { username: userData.username });
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/users/${userData.userId}`);
            setUserData(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error', error);
        }
    };
  
    const handleCancelClick = () => {
      setIsEditing(false);
    };
  
    return (
      <div className="container mt-5">
        <h2 className="mb-4">Profile</h2>
        <form>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
  
          <div className="mb-3">
            <label htmlFor="score" className="form-label">
              Score
            </label>
            <input
              type="number"
              className="form-control"
              id="score"
              name="score"
              value={userData.score}
              readOnly
            />
          </div>
  
          <div className="mb-3">
            <label htmlFor="played" className="form-label">
              Games Played
            </label>
            <input
              type="number"
              className="form-control"
              id="played"
              name="played"
              value={userData.played}
              readOnly
            />
          </div>
  
          <div className="mb-3">
            <label htmlFor="wins" className="form-label">
              Wins
            </label>
            <input
              type="number"
              className="form-control"
              id="wins"
              name="wins"
              value={userData.wins}
              readOnly
            />
          </div>
  
          <div className="d-flex justify-content-between">
            {isEditing ? (
              <>
                <button type="button" className="btn btn-success" onClick={handleSaveClick}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleEditClick}>
                Edit Username
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }