import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';
import ApiKeyComponent from './ApiKeyComponent';

function App() {
  const [steamId, setSteamId] = useState('');
  const [steamIds, setSteamIds] = useState(() => {
    const storedSteamIds = localStorage.getItem('steamIds');
    return storedSteamIds ? JSON.parse(storedSteamIds) : [];
  });

  const [profilesData, setProfilesData] = useState([]);
  const [error, setError] = useState(null);
  const [gameName, setGameName] = useState(() => {
    const storedGameName = localStorage.getItem('gameName');
    return storedGameName || '';
  });

  const alertSound = new Audio('/steam-account-monitor/alert.mp3');

  const handleInputChange = (e) => {
    setSteamId(e.target.value);
  };

  const isSteamIdValid = (steamId) => {
    const steamIdRegex = /^\d{17}$/;
    return steamIdRegex.test(steamId);
  };

  const handleAddProfile = () => {
    if (isSteamIdValid(steamId)) {
      if (steamIds.includes(steamId)) {
        setError('Profile already added');
      } else {
        setSteamIds((prevIds) => {
          const newIds = [...prevIds, steamId];
          localStorage.setItem('steamIds', JSON.stringify(newIds));
          return newIds;
        });
        setSteamId('');
        setError(null);
      }
    } else {
      setError('Invalid Steam ID format');
    }
  };

  const handleClearProfiles = () => {
    localStorage.removeItem('steamIds');
    setSteamIds([]);
    setProfilesData([]);
  };

  const handleGameNameChange = (e) => {
    const newGameName = e.target.value;
    console.log('New gameName:', newGameName);
    setGameName(newGameName);
    localStorage.setItem('gameName', newGameName);
  };

  const fetchData = async () => {
    try {
      const profilesResponses = await Promise.all(
        steamIds.map(async (steamId) => await axios.get(`https://www.geckuss.com/profile/${steamId}`, { withCredentials: true }))
      );
  
      const profilesData = profilesResponses.map((response) => response.data);
      setProfilesData(profilesData);
      setError(null);
  
      if (gameName.trim() !== '') {
        const isGameBeingPlayed = profilesData.some(
          (profile) => profile.onlineStatus === 'Online' && profile.gamePlaying?.toLowerCase() === gameName.toLowerCase()
        );
  
        if (isGameBeingPlayed) {
          alertSound.play();
        }
      }
    } catch (error) {
      setProfilesData([]);
      setError('Error fetching profiles');
    }
  };
  

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [steamIds, gameName]);

  const [apiKeyStatus, setApiKeyStatus] = useState('Not Set');

  return (
    <div className="app-container">
      <h1>Steam Profile Monitor</h1>

      <div className="input-container">
        <label>
          Enter Steam ID:
          <input
            type="text"
            value={steamId}
            onChange={handleInputChange}
            placeholder="e.g., 76561197972495328"
          />
        </label>

        <label>
          Waiting for Game:
          <input
            type="text"
            value={gameName}
            onChange={handleGameNameChange}
            placeholder="Enter game name"
          />
        </label>

        <ApiKeyComponent
          apiKeyStatus={apiKeyStatus}
          setApiKeyStatus={setApiKeyStatus}
          fetchData={fetchData}
        />
        <button className="action-button" onClick={handleAddProfile}>Add Profile</button>
        <button className="action-button" onClick={handleClearProfiles}>Clear All Profiles</button>
      </div>
      {error && <p className="error-message">{error}</p>}

      {profilesData.length > 0 && (
        <div className="profiles-container">
          {profilesData.map((profileData, index) => (
            <div
              key={index}
              className="profile-card"
              style={{
                background: profileData.onlineStatus === 'Online'
                  ? (profileData.gameId ? '#90ba3c' : '#57cbde')
                  : '#898989'
              }}
            >
              <img
                src={profileData.avatar}
                alt={`Avatar for ${profileData.personaname}`}
                className="avatar"
              />
              <p className="username">{profileData.personaname}</p>
              <p className="status" style={{ color: '#4CAF50' }}>{profileData.onlineStatus}</p>
              {profileData.onlineStatus === 'Online' && profileData.gameId && (
                <div>
                  <p className="game-playing" style={{ fontStyle: 'italic' }}>Playing: {profileData.gamePlaying}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
