// frontend/src/pages/FeedPage.jsx
import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import "../styles/FeedPage.css";

const FeedPage = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving item');
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/api/feed?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received feed data:', data);
        setFeedItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching feed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (error) {
    return (
      <div className="feed-page">
        <NavBar />
        <div className="feed-content">
          <div className="error-message">
            Error loading feed: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <NavBar />
      <div className="feed-content">
        <h1 className="feed-header">Activity Feed</h1>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : feedItems.length === 0 ? (
          <div className="no-activity">
            <p>No recent activity from your friends.</p>
            <p>Try adding more friends to see their activity!</p>
          </div>
        ) : (
          <div className="feed-items">
            {feedItems.map((item, index) => (
              <div key={index} className="feed-item">
                <div className="feed-item-header">
                  <span className="username">{item.username}</span>
                </div>
                <div className="feed-item-content">
                  <div className="feed-item-text">
                    saved {item.type === 'album' ? 'the album' : 'the artist'}{' '}
                    <span className="item-name">{item.name}</span>
                  </div>
                  <div className="feed-item-actions">
                    {item.type === 'album' && item.matchPercentage !== undefined && (
                      <span className="match-percentage">
                        {item.matchPercentage}% match
                      </span>
                    )}
                    <button 
                      className="save-button"
                      onClick={() => handleSave(item)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;