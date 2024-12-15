// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import "../styles/ProfilePage.css";
import FriendModal from '../components/FriendModal';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all"); // can be "all", "artist", or "album"
  const [searchResults, setSearchResults] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]); // Initialize as empty array
  const [savedAlbums, setSavedAlbums] = useState([]); // Initialize as empty array
  const [friends, setFriends] = useState([]);
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [queryResults, setQueryResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [topNValue, setTopNValue] = useState('');
  const [dateRange, setDateRange] = useState({ low: '', high: '' });
  const [commonArtistsN, setCommonArtistsN] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        // Fetch profile data
        fetch(`http://localhost:8080/api/profile?userId=${userId}`)
            .then(res => res.json())
            .then(data => setProfileData(data))
            .catch(err => console.error('Error fetching profile:', err));

        // Fetch saved artists
        fetch(`http://localhost:8080/api/profile/artists?userId=${userId}`)
            .then(res => res.json())
            .then(data => setSavedArtists(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Error fetching saved artists:', err);
                setSavedArtists([]);
            });

        // Fetch saved albums
        fetch(`http://localhost:8080/api/profile/albums?userId=${userId}`)
            .then(res => res.json())
            .then(data => setSavedAlbums(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Error fetching saved albums:', err);
                setSavedAlbums([]);
            });

        // Fetch friends
        fetch(`http://localhost:8080/api/profile/friends?userId=${userId}`)
            .then(res => res.json())
            .then(data => setFriends(data))
            .catch(err => console.error('Error fetching friends:', err));
    }
}, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/search?term=${searchTerm}&type=${searchType}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching:", err);
    }
  };

 // In ProfilePage.jsx
// In ProfilePage.jsx
const handleSaveItem = async (item, type) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
      alert('Please log in to save items');
      return;
  }

  try {
      const response = await fetch(`http://localhost:8080/api/profile/save-${type}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
              itemId: item.id,
              userId: userId
          }),
      });

      if (response.ok) {
          if (type === 'artist') {
              setSavedArtists([...savedArtists, item]);
          } else {
              setSavedAlbums([...savedAlbums, item]);
          }
          alert(`${type} saved successfully!`);
      }
  } catch (err) {
      console.error(`Error saving ${type}:`, err);
  }
};

// Also update the fetch calls for getting saved items
useEffect(() => {
  const userId = localStorage.getItem('userId');
  if (userId) {
      // Fetch saved artists
      fetch(`http://localhost:8080/api/profile/artists?userId=${userId}`)
          .then(res => res.json())
          .then(data => setSavedArtists(data))
          .catch(err => console.error('Error fetching saved artists:', err));

      // Fetch saved albums
      fetch(`http://localhost:8080/api/profile/albums?userId=${userId}`)
          .then(res => res.json())
          .then(data => setSavedAlbums(data))
          .catch(err => console.error('Error fetching saved albums:', err));
  }
}, []);

const handleFriendSearch = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(`http://localhost:8080/api/search/users?term=${friendSearchTerm}`);
    const data = await response.json();
    setFriendSearchResults(data);
  } catch (err) {
    console.error("Error searching friends:", err);
  }
};

const handleAddFriend = async (friendId) => {
  const userId = localStorage.getItem('userId');
  try {
    const response = await fetch('http://localhost:8080/api/profile/add-friend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, friendId }),
    });

    if (response.ok) {
      // Refresh friends list
      const updatedFriends = await fetch(`http://localhost:8080/api/profile/friends?userId=${userId}`).then(res => res.json());
      setFriends(updatedFriends);
      setFriendSearchResults([]); // Clear search results
      setFriendSearchTerm(""); // Clear search input
    }
  } catch (err) {
    console.error("Error adding friend:", err);
  }
};

const handleQuery = async (queryType) => {
  setIsLoading(true);
  setQueryResults(null);
  const startTime = performance.now();
  const userId = localStorage.getItem('userId');

  try {
    let response;
    switch(queryType) {
      case 'top10':
        response = await fetch(`http://localhost:8080/api/user/${userId}/top10albums`);
        break;
      case 'topN':
        if (!topNValue) {
          alert('Please enter a value for N');
          setIsLoading(false);
          return;
        }
        response = await fetch(`http://localhost:8080/api/user/${userId}/topN/${topNValue}`);
        break;
      case 'artistsByGenre':
        if (!dateRange.low || !dateRange.high) {
          alert('Please enter both dates');
          setIsLoading(false);
          return;
        }
        response = await fetch(
          `http://localhost:8080/api/user/${userId}/artists-by-genre?low=${dateRange.low}&high=${dateRange.high}`
        );
        break;
      case 'friendsCommonArtists':
        if (!commonArtistsN) {
          alert('Please enter the number of common artists');
          return;
        }
        response = await fetch(
          `http://localhost:8080/api/user/${userId}/friends-common-artists/${commonArtistsN}`
        );
        break;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Query response data:', data);
    const endTime = performance.now();
    setExecutionTime((endTime - startTime).toFixed(2));
    setQueryResults(data);
  } catch (error) {
    console.error('Error executing query:', error);
    setQueryResults({ error: error.message });
  } finally {
    setIsLoading(false);
  }
};

const handleSave = async (item) => {
    const userId = localStorage.getItem('userId');
    const endpoint = item.type === 'artist' ? 'save-artist' : 'save-album';
    
    try {
        const response = await fetch(`http://localhost:8080/api/profile/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                itemId: item.type === 'artist' ? item.id : item.album_id
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Show error message
            alert(data.message || 'Error saving item');
            return;
        }

        // Show success message
        alert(data.message);
        
        // Refresh the saved items list
        fetchSavedItems();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving item');
    }
};

const handleFriendClick = (friend) => {
  console.log("Friend clicked:", friend);
  setSelectedFriend(friend);
};

  return (
    <div className="profile-page">
      <NavBar />
      <div className="profile-content">
        <div className="profile-info">
          <h2>Welcome, {profileData.username}!</h2>
        </div>
        
        {/* Search Section */}
        <div className="search-section">
          <form onSubmit={handleSearch}>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-filter"
            >
              <option value="all">All</option>
              <option value="artist">Artists</option>
              <option value="album">Albums</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for artists or albums..."
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            {searchResults.map((result) => (
              <div key={result.id} className="search-result-item">
                <span>{result.name}</span>
                <span>{result.type}</span>
                <button 
                  onClick={() => handleSaveItem(result, result.type)}
                  className="save-button"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Saved Lists */}
        <div className="saved-lists">
          <div className="saved-artists">
            <h3>Saved Artists</h3>
            {savedArtists.map(artist => (
              <div key={artist.id} className="saved-item">
                {artist.name}
              </div>
            ))}
          </div>

          <div className="saved-albums">
            <h3>Saved Albums</h3>
            {savedAlbums.map(album => (
              <div key={album.id} className="saved-item">
                {album.name}
              </div>
            ))}
          </div>
          {/* Friends Section */}
      <div className="friends-section">
        <h2>Friend Search</h2>
        
        {/* Friend Search */}
        <form onSubmit={handleFriendSearch} className="friend-search">
          <input
            type="text"
            value={friendSearchTerm}
            onChange={(e) => setFriendSearchTerm(e.target.value)}
            placeholder="Search for users..."
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        {/* Friend Search Results */}
        {friendSearchResults.length > 0 && (
          <div className="friend-search-results">
            <h2>Search Results</h2>
            {friendSearchResults.map((user) => (
              <div key={user.id} className="friend-result-item">
                <span>{user.username} </span>
                <button 
                  onClick={() => handleAddFriend(user.id)}
                  className="add-friend-button"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="friends-list">
          <h3>Your Friends</h3>
          {friends.map((friend) => (
            <div 
              key={friend.id} 
              className="friend-item"
              onClick={() => handleFriendClick(friend)}
              style={{ cursor: 'pointer' }}
            >
              {friend.username}
            </div>
          ))}
        </div>
      </div>
        </div>

        <div className="extra-section">
          <h3>Analyze saved albums, artists, and shared taste with friends</h3>
          <div className="query-buttons">
            <button onClick={() => handleQuery('top10')}>
              Get Info on Your Top 10 Albums
            </button>
            
            <div className="query-input-group">
              <input 
                type="number" 
                value={topNValue}
                onChange={(e) => setTopNValue(e.target.value)}
                placeholder="Enter N"
              />
              <button 
                onClick={() => handleQuery('topN')}
                disabled={!topNValue}
              >
                Get Top N Albums by Genre
              </button>
            </div>

            <div className="query-input-group">
              <div className="date-range-inputs">
                <input 
                  type="text" 
                  value={dateRange.low}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setDateRange(prev => ({ ...prev, low: value }))
                  }}
                  placeholder="Start Year"
                  maxLength="4"
                />
                <input 
                  type="text" 
                  value={dateRange.high}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setDateRange(prev => ({ ...prev, high: value }))
                  }}
                  placeholder="End Year"
                  maxLength="4"
                />
              </div>
              <button 
                onClick={() => handleQuery('artistsByGenre')}
                disabled={!dateRange.low || !dateRange.high}
              >
                Get Top Artists by Genre
              </button>
            </div>

            <div className="query-input-group">
              <input 
                type="number"
                value={commonArtistsN}
                onChange={(e) => {
                  const value = Math.max(1, parseInt(e.target.value) || 0);
                  setCommonArtistsN(value.toString());
                }}
                placeholder="Number of common artists"
                min="1"
              />
              <button 
                onClick={() => handleQuery('friendsCommonArtists')}
                disabled={!commonArtistsN}
              >
                Find Friends with Common Artists
              </button>
            </div>
          </div>

          <div className="query-results">
            <h4>Analysis Results</h4>
            {executionTime && <p className="execution-time">Time taken to execute query: {executionTime}ms</p>}
            {isLoading ? (
              <div className="loading-spinner">Loading...</div>
            ) : (
              queryResults && (
                <div className="results-container">
                  {/* Top 10 albums display */}
                  {queryResults.albums && (
                    <div className="albums-grid">
                      <h5>Top {queryResults.count} Albums</h5>
                      <div className="albums-list">
                        {queryResults.albums.map((album, index) => (
                          <div key={album.album_id} className="album-card">
                            <h6>{index + 1}. {album.album_title}</h6>
                            <p>Artist: {album.artist_name}</p>
                            <p>Genre: {album.genre}</p>
                            <p>Release Date: {album.release_date || 'N/A'}</p>
                            <p>Country: {album.artist_country || 'N/A'}</p>
                            <p>Listeners: {album.listeners.toLocaleString()}</p>
                            <p>Scrobbles: {album.scrobbles.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TopN query display */}
                  {queryResults.genreBreakdown && (
                    <div className="albums-grid">
                      <h5>Top {queryResults.requestedN} Albums Analysis</h5>
                      <p>Total Saved Albums: {queryResults.totalSavedAlbums}</p>
                      
                      {queryResults.genreBreakdown.map((genreGroup, index) => (
                        <div key={index} className="genre-section">
                          <h6 className="genre-title">
                            {genreGroup.genre} ({genreGroup.count} albums)
                          </h6>
                          <div className="albums-list">
                            {genreGroup.albums.map((album, albumIndex) => (
                              <div key={albumIndex} className="album-card">
                                <h6>{album.title}</h6>
                                <p>Artist: {album.artist}</p>
                                <p>Listeners: {album.listeners.toLocaleString()}</p>
                                <p>Scrobbles: {album.scrobbles.toLocaleString()}</p>
                                <p>Total Saves: {album.total_saves}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Artists by Genre display - Styled */}
                  {queryResults?.message && (
                    <div className="artists-grid">
                      <h5>Artists by Genre Analysis ({dateRange.low} - {dateRange.high})</h5>
                      
                      {queryResults.favoriteGenre ? (
                        <>
                          <div className="genre-info">
                            <p>Favorite Genre: <span className="highlight">{queryResults.favoriteGenre}</span></p>
                            <p>Albums in Genre: <span className="highlight">{queryResults.albumsInGenre}</span></p>
                          </div>

                          <div className="artists-list">
                            {queryResults.artists && queryResults.artists.map((artist, index) => (
                              <div key={index} className="artist-card">
                                <h6>{artist.name}</h6>
                                <div className="artist-stats">
                                  <p>Listeners: {artist.listeners?.toLocaleString() || 'N/A'}</p>
                                  <p>Scrobbles: {artist.scrobbles?.toLocaleString() || 'N/A'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="no-results">
                          <p>{queryResults.message}</p>
                          {queryResults.details && (
                            <p>Year Range: {queryResults.details.yearRange}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Common Artists with Friends display */}
                  {queryResults?.friends && (
                    <div className="common-artists-grid">
                      <h5>Friends with Common Artists Analysis</h5>
                      <div className="friends-common-artists-list">
                        {queryResults.friends.map((friend, index) => (
                          <div key={index} className="friend-common-artists-card">
                            <h6 className="friend-name">{friend.username}</h6>
                            <div className="common-artists-info">
                              <p className="artist-count">
                                Common Artists: {friend.commonArtists.count}
                              </p>
                              <div className="artists-names-list">
                                <h7>Shared Artists:</h7>
                                <ul>
                                  {friend.commonArtists.names.map((artistName, artistIndex) => (
                                    <li key={artistIndex}>{artistName}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                 
                </div>
              )
            )}
          </div>
        </div>
      </div>
      {selectedFriend && (
        <FriendModal 
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </div>
    
  );

};


export default ProfilePage;