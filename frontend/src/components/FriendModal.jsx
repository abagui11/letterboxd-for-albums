import React, { useState, useEffect } from 'react';
import '../styles/FriendModal.css';

const FriendModal = ({ friend, onClose }) => {
  const [friendData, setFriendData] = useState({
    artists: [],
    albums: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        // Fetch friend's saved artists
        const artistsResponse = await fetch(`http://localhost:8080/api/profile/artists?userId=${friend.id}`);
        const artistsData = await artistsResponse.json();

        // Fetch friend's saved albums
        const albumsResponse = await fetch(`http://localhost:8080/api/profile/albums?userId=${friend.id}`);
        const albumsData = await albumsResponse.json();

        console.log('Artists:', artistsData);
        console.log('Albums:', albumsData);

        setFriendData({
          artists: artistsData,
          albums: albumsData
        });
      } catch (error) {
        console.error('Error fetching friend data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendData();
  }, [friend.id]);

  return (
    <div className="friend-modal-overlay" onClick={onClose}>
      <div className="friend-modal-content" onClick={e => e.stopPropagation()}>
        <div className="friend-modal-header">
          <h2>{friend.username}'s Profile</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="friend-data">
            <div className="saved-section-f">
              <h3>Saved Artists</h3>
              <div className="saved-items-f">
                {friendData.artists.map((artist) => (
                  <div key={artist.id} className="saved-item-f">
                    <span className="item-name-f">{artist.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="saved-section-f">
              <h3>Saved Albums</h3>
              <div className="saved-items-f">
                {friendData.albums.map((album) => (
                  <div key={album.id} className="saved-item-f">
                    <span className="item-name-f">{album.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendModal; 