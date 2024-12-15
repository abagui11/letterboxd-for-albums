const { Pool, types } = require('pg');
const config = require('./config.json')
const express = require('express');
const router = express.Router();

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
// Modify your connection in routes.js temporarily to connect to default 'postgres' database
const connection = new Pool({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: 'postgres',  // Use an existing database
    ssl: {
        rejectUnauthorized: false,
    },
});
  
  // Add this route to list all databases
  router.get('/list-dbs', async (req, res) => {
      try {
          const result = await connection.query('SELECT datname FROM pg_database;');
          res.json({
              databases: result.rows
          });
      } catch (err) {
          res.status(500).json({
              error: 'Database error',
              details: err.message
          });
      }
  });

  router.get('/list-tables', async (req, res) => {
    try {
        const result = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        res.json({
            tables: result.rows
        });
    } catch (err) {
        res.status(500).json({
            error: 'Database error',
            details: err.message
        });
    }
});

// Placeholder for future routes
// router.get('/your-route', async (req, res) => { ... });
// router.post('/your-route', async (req, res) => { ... });

// Login route
router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await connection.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: result.rows[0].id,
                    username: result.rows[0].username
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (err) {
        res.status(500).json({
            error: 'Database error during login',
            details: err.message
        });
    }
});

// In routes.js
router.post('/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Add validation
    if (!username || !password || !email) {
        return res.status(400).json({
            success: false,
            message: 'Username, email, and password are required'
        });
    }
    
    try {
        // Debug log
        console.log('Attempting to create user:', { username, email });

        // Check if username already exists
        const checkUser = await connection.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Insert new user
        const result = await connection.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, password]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email
            }
        });
    } catch (err) {
        console.error('Detailed signup error:', err);
        res.status(500).json({
            error: 'Error creating user',
            details: err.message
        });
    }
});

// profile shiiii
// Get user's profile information
router.get('/profile', async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }

    try {
        const result = await connection.query(
            'SELECT username, email FROM Users WHERE id = $1',
            [userId]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({
            error: 'Error fetching profile',
            details: err.message
        });
    }
});

//search
// Search route - searches both artists and albums
router.get('/search', async (req, res) => {
    const { term, type } = req.query;
    
    try {
        let results = [];

        if (type === 'all' || type === 'artist') {
            // Search in artists table (limited to 5)
            const artistResults = await connection.query(
                `SELECT mbid as id, artist as name, 'artist' as type 
                 FROM artists 
                 WHERE LOWER(artist) LIKE LOWER($1)
                 LIMIT 5`,
                [`%${term}%`]
            );
            results = [...results, ...artistResults.rows];
        }

        if (type === 'all' || type === 'album') {
            // Search in albums table (limited to 5)
            const albumResults = await connection.query(
                `SELECT id, title as name, 'album' as type 
                 FROM albums 
                 WHERE LOWER(title) LIKE LOWER($1)
                 LIMIT 5`,
                [`%${term}%`]
            );
            results = [...results, ...albumResults.rows];
        }

        // If searching for all, limit total results to 5
        if (type === 'all') {
            results = results.slice(0, 5);
        }
        
        res.json(results);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({
            error: 'Error performing search',
            details: err.message
        });
    }
});
// Save artist to user's profile
router.post('/profile/save-artist', async (req, res) => {
    const { itemId, userId } = req.body;
    
    if (!userId) {
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }
    
    try {
        // First check if already saved
        const checkExisting = await connection.query(
            'SELECT * FROM user_artists WHERE user_id = $1 AND artist_id = $2',
            [userId, itemId]
        );

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Artist already saved to your profile'
            });
        }

        // Save the artist
        await connection.query(
            'INSERT INTO user_artists (user_id, artist_id) VALUES ($1, $2)',
            [userId, itemId]
        );

        res.json({
            success: true,
            message: 'Artist saved successfully'
        });
    } catch (err) {
        console.error('Error saving artist:', err);
        res.status(500).json({
            error: 'Error saving artist',
            details: err.message
        });
    }
});
// Save album to user's profile
router.post('/profile/save-album', async (req, res) => {
    const { itemId, userId } = req.body;
    
    if (!userId) {
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }
    
    try {
        // First check if already saved
        const checkExisting = await connection.query(
            'SELECT * FROM user_saved_albums WHERE user_id = $1 AND album_id = $2',
            [userId, itemId]
        );

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Album already saved to your profile'
            });
        }

        // Save the album
        await connection.query(
            'INSERT INTO user_saved_albums (user_id, album_id) VALUES ($1, $2)',
            [userId, itemId]
        );

        res.json({
            success: true,
            message: 'Album saved successfully'
        });
    } catch (err) {
        console.error('Error saving album:', err);
        res.status(500).json({
            error: 'Error saving album',
            details: err.message
        });
    }
});
// Get user's saved artists
router.get('/profile/artists', async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }
    
    try {
        console.log('Fetching artists for user:', userId);

        const result = await connection.query(
            `SELECT artists.mbid as id, artists.artist as name 
             FROM artists 
             JOIN user_artists ON artists.mbid = user_artists.artist_id 
             WHERE user_artists.user_id = $1`,
            [userId]
        );

        console.log('Found artists:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Detailed error fetching saved artists:', err);
        res.status(500).json({
            error: 'Error fetching saved artists',
            details: err.message
        });
    }
});

// Get user's saved albums
router.get('/profile/albums', async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }
    
    try {
        console.log('Fetching albums for user:', userId);

        const result = await connection.query(
            `SELECT albums.id as id, albums.title as name 
             FROM albums 
             JOIN user_saved_albums ON albums.id = user_saved_albums.album_id 
             WHERE user_saved_albums.user_id = $1`,
            [userId]
        );

        console.log('Found albums:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Detailed error fetching saved albums:', err);
        res.status(500).json({
            error: 'Error fetching saved albums',
            details: err.message
        });
    }
});

// Friends features shiii

// Get user's friends
router.get('/profile/friends', async (req, res) => {
    const { userId } = req.query;
    
    try {
        const result = await connection.query(
            `SELECT u.id, u.username 
             FROM Users u 
             JOIN Followers f ON u.id = f.following_id 
             WHERE f.user_id = $1`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching friends:', err);
        res.status(500).json({ error: 'Error fetching friends' });
    }
});

// Search for users
router.get('/search/users', async (req, res) => {
    const { term } = req.query;
    
    try {
        const result = await connection.query(
            `SELECT id, username 
             FROM Users 
             WHERE LOWER(username) LIKE LOWER($1)
             LIMIT 5`,
            [`%${term}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Error searching users' });
    }
});

// Add friend (creates mutual following)
router.post('/profile/add-friend', async (req, res) => {
    const { userId, friendId } = req.body;
    
    try {
        // Start a transaction since we're doing multiple inserts
        await connection.query('BEGIN');

        // Add friend in both directions
        await connection.query(
            'INSERT INTO Followers (user_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, friendId]
        );
        await connection.query(
            'INSERT INTO Followers (user_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [friendId, userId]
        );

        await connection.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await connection.query('ROLLBACK');
        console.error('Error adding friend:', err);
        res.status(500).json({ error: 'Error adding friend' });
    }
});

// In routes.js
// In routes.js
router.get('/feed', async (req, res) => {
    const { userId } = req.query;
    
    try {
        // First get user's saved albums and their genres
        const userGenres = await connection.query(
            `SELECT DISTINCT a.genre, COUNT(*) as genre_count
             FROM user_saved_albums usa
             JOIN albums a ON usa.album_id = a.id
             WHERE usa.user_id = $1 AND a.genre IS NOT NULL
             GROUP BY a.genre`,
            [userId]
        );

        // Get total count of user's saved albums
        const totalAlbums = await connection.query(
            `SELECT COUNT(*) as total
             FROM user_saved_albums
             WHERE user_id = $1`,
            [userId]
        );

        const userGenreMap = userGenres.rows.reduce((acc, row) => {
            acc[row.genre] = parseInt(row.genre_count);
            return acc;
        }, {});

        const totalUserAlbums = parseInt(totalAlbums.rows[0].total);

        // Get feed items with genres
        const albumActivity = await connection.query(
            `SELECT DISTINCT u.username, a.title as name, 'album' as type,
                    a.id as album_id, a.genre
             FROM Users u
             JOIN Followers f ON u.id = f.following_id
             JOIN user_saved_albums usa ON f.following_id = usa.user_id
             JOIN albums a ON usa.album_id = a.id
             WHERE f.user_id = $1`,
            [userId]
        );

        // Calculate match percentage for each album
        const albumsWithMatch = albumActivity.rows.map(item => {
            if (item.type === 'album' && item.genre) {
                const matchScore = userGenreMap[item.genre] || 0;
                const matchPercentage = totalUserAlbums > 0 
                    ? Math.round((matchScore / totalUserAlbums) * 100)
                    : 0;

                return {
                    ...item,
                    matchPercentage
                };
            }
            return item;
        });

        // Get artist activity (unchanged)
        const artistActivity = await connection.query(
            `SELECT u.username, art.artist as name, 'artist' as type
             FROM Users u
             JOIN Followers f ON u.id = f.following_id
             JOIN user_artists ua ON f.following_id = ua.user_id
             JOIN artists art ON ua.artist_id = art.mbid
             WHERE f.user_id = $1`,
            [userId]
        );

        // Combine and sort activities
        const allActivity = [...albumsWithMatch, ...artistActivity.rows]
            .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

        res.json(allActivity);
    } catch (err) {
        console.error('Error fetching feed:', err);
        res.status(500).json({
            error: 'Error fetching feed',
            details: err.message
        });
    }
});

// Complex queries

// Route 1: Get top 10 saved albums info - Fixed joins
router.get('/user/:user_id/top10albums', async (req, res) => {
  const user_id = req.params.user_id;

  try {
    // Debug query to check album and artist relationship
    const debugJoin = await connection.query(`
      SELECT a.id, a.title, a.artist_id, ar.mbid, ar.artist
      FROM albums a
      LEFT JOIN artists ar ON a.artist_name = ar.artist
      WHERE a.id = $1
    `, [9548218]); // Using the album_id from your debug output
    
    console.log('Debug join results:', debugJoin.rows);

    // Modified main query to use artist_name instead of artist_id
    const result = await connection.query(`
      SELECT 
        a.id AS album_id,
        a.title AS album_title,
        a.release_date,
        a.genre,
        ar.artist AS artist_name,
        ar.country AS artist_country,
        ar.tags AS artist_tags,
        ar.listeners,
        ar.scrobbles
      FROM user_saved_albums usa
      JOIN albums a ON usa.album_id = a.id
      JOIN artists ar ON a.artist_name = ar.artist  -- Changed join condition
      WHERE usa.user_id = $1
      ORDER BY ar.listeners DESC, ar.scrobbles DESC
      LIMIT 10
    `, [user_id]);

    console.log('Final query results:', result.rows);

    if (result.rows.length === 0) {
      // Get raw album data for debugging
      const rawAlbums = await connection.query(`
        SELECT a.*, ar.*
        FROM user_saved_albums usa
        JOIN albums a ON usa.album_id = a.id
        LEFT JOIN artists ar ON a.artist_name = ar.artist
        WHERE usa.user_id = $1
      `, [user_id]);

      console.log('Raw album data:', rawAlbums.rows);

      return res.json({ 
        message: "No saved albums found",
        count: 0,
        albums: [],
        debug: {
          savedCount: (await connection.query('SELECT COUNT(*) as count FROM user_saved_albums WHERE user_id = $1', [user_id])).rows[0].count,
          sampleData: rawAlbums.rows
        }
      });
    }

    res.json({
      message: "Successfully retrieved albums",
      count: result.rows.length,
      albums: result.rows
    });

  } catch (err) {
    console.error('Error in top10albums:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message,
      userId: user_id
    });
  }
});

// Route 2: Get top N albums with genre breakdown - Fixed version
router.get('/user/:user_id/topN/:n', async (req, res) => {
  const { user_id, n } = req.params;

  try {
    // First check total number of saved albums
    const totalAlbums = await connection.query(`
      SELECT COUNT(*) as count 
      FROM user_saved_albums 
      WHERE user_id = $1
    `, [user_id]);

    const totalCount = parseInt(totalAlbums.rows[0].count);
    const requestedN = parseInt(n);

    // Validate n
    if (requestedN <= 0) {
      return res.status(400).json({
        error: 'N must be greater than 0'
      });
    }

    if (requestedN > totalCount) {
      return res.status(400).json({
        error: `N cannot be greater than total saved albums (${totalCount})`
      });
    }

    const result = await connection.query(`
      WITH AlbumPopularity AS (
        SELECT 
          usa.album_id,
          COUNT(usa.user_id) AS total_saves
        FROM user_saved_albums usa 
        GROUP BY usa.album_id
      ),
      UserTopAlbums AS (
        SELECT 
          usa.album_id,
          a.title,
          a.genre,
          a.artist_name,
          ar.listeners,
          ar.scrobbles,
          ap.total_saves
        FROM user_saved_albums usa
        JOIN albums a ON usa.album_id = a.id
        JOIN artists ar ON a.artist_name = ar.artist
        JOIN AlbumPopularity ap ON usa.album_id = ap.album_id
        WHERE usa.user_id = $1
        ORDER BY ar.listeners DESC, ar.scrobbles DESC
        LIMIT $2
      ),
      GenreBreakdown AS (
        SELECT 
          genre,
          COUNT(album_id) AS genre_count
        FROM UserTopAlbums 
        GROUP BY genre
      )
      SELECT 
        uta.title AS album_title,
        uta.artist_name,
        uta.genre,
        uta.listeners,
        uta.scrobbles,
        uta.total_saves,
        gb.genre_count
      FROM UserTopAlbums uta
      JOIN GenreBreakdown gb ON uta.genre = gb.genre
      ORDER BY uta.listeners DESC, uta.scrobbles DESC, gb.genre_count DESC
    `, [user_id, requestedN]);

    if (result.rows.length === 0) {
      return res.json({
        message: "No albums found",
        count: 0,
        albums: []
      });
    }

    // Group albums by genre for the response
    const genreGroups = result.rows.reduce((acc, album) => {
      if (!acc[album.genre]) {
        acc[album.genre] = {
          genre: album.genre,
          count: album.genre_count,
          albums: []
        };
      }
      acc[album.genre].albums.push({
        title: album.album_title,
        artist: album.artist_name,
        listeners: album.listeners,
        scrobbles: album.scrobbles,
        total_saves: album.total_saves
      });
      return acc;
    }, {});

    res.json({
      message: "Successfully retrieved albums",
      totalSavedAlbums: totalCount,
      requestedN: requestedN,
      genreBreakdown: Object.values(genreGroups)
    });

  } catch (err) {
    console.error('Error in topN:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message 
    });
  }
});

// Route 3: Get top artists by genre in date range - with debug logging
router.get('/user/:user_id/artists-by-genre', async (req, res) => {
  const { user_id } = req.params;
  const { low, high } = req.query;

  try {
    // Debug log - input parameters
    console.log('Route 3 Input:', { user_id, dateRange: { low, high } });

    // Validate year inputs
    if (!low || !high || low.length !== 4 || high.length !== 4) {
      console.log('Route 3 Error: Invalid year format');
      return res.status(400).json({
        error: 'Invalid year format. Please provide 4-digit years.'
      });
    }

    // Convert years to dates for comparison
    const lowDate = `${low}-01-01`;
    const highDate = `${high}-12-31`;

    const result = await connection.query(`
      WITH favorite_genre AS (
        SELECT 
          a.genre,
          COUNT(a.id) AS genre_freq
        FROM albums a
        JOIN user_saved_albums usa ON usa.album_id = a.id
        WHERE usa.user_id = $1
          AND a.release_date >= $2 
          AND a.release_date <= $3
          AND a.genre IS NOT NULL
        GROUP BY a.genre
        ORDER BY genre_freq DESC
        LIMIT 1
      ),
      top_artists AS (
        SELECT 
          ar.artist,
          ar.listeners,
          ar.scrobbles,
          a.genre
        FROM artists ar
        JOIN albums a ON a.artist_name = ar.artist
        WHERE a.genre = (SELECT genre FROM favorite_genre)
          AND ar.mbid NOT IN (
            SELECT artist_id 
            FROM user_artists 
            WHERE user_id = $1
          )
      )
      SELECT 
        ta.artist,
        ta.listeners,
        ta.scrobbles,
        ta.genre,
        fg.genre_freq AS albums_in_genre
      FROM top_artists ta
      CROSS JOIN favorite_genre fg
      ORDER BY ta.listeners DESC, ta.scrobbles DESC
      LIMIT 5
    `, [user_id, lowDate, highDate]);

    // Debug log - query results
    console.log('Route 3 Query Results:', result.rows);

    if (result.rows.length === 0) {
      const response = {
        message: "No matching artists found",
        details: {
          yearRange: `${low}-${high}`,
          userId: user_id
        }
      };
      console.log('Route 3 Empty Response:', response);
      return res.json(response);
    }

    const response = {
      message: "Successfully found top artists",
      favoriteGenre: result.rows[0].genre,
      albumsInGenre: result.rows[0].albums_in_genre,
      artists: result.rows.map(row => ({
        name: row.artist,
        listeners: row.listeners,
        scrobbles: row.scrobbles
      }))
    };

    // Debug log - final response
    console.log('Route 3 Success Response:', response);
    res.json(response);

  } catch (err) {
    console.error('Route 3 Error:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message,
      params: { userId: user_id, yearRange: `${low}-${high}` }
    });
  }
});

// Route 4: Get friends with N+ common artists - Optimized version
router.get('/user/:user_id/friends-common-artists/:n', async (req, res) => {
  const { user_id, n } = req.params;
  const requestedN = parseInt(n);

  try {
    // Validate inputs
    if (!user_id || !n) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    if (isNaN(requestedN) || requestedN < 1) {
      return res.status(400).json({
        error: 'N must be a positive number'
      });
    }

    // Optimized query with better indexing and fewer subqueries
    const result = await connection.query(`
      WITH UserFriends AS (
        SELECT DISTINCT following_id as friend_id
        FROM followers
        WHERE user_id = $1
      ),
      UserArtists AS (
        SELECT DISTINCT artist_name
        FROM user_saved_albums usa
        JOIN albums a ON usa.album_id = a.id
        WHERE usa.user_id = $1
      ),
      MatchingArtists AS (
        SELECT 
          u.username,
          u.email,
          COUNT(DISTINCT a.artist_name) as match_count,
          array_agg(DISTINCT a.artist_name) as artist_list
        FROM UserFriends uf
        JOIN users u ON uf.friend_id = u.id
        JOIN user_saved_albums fsa ON u.id = fsa.user_id
        JOIN albums a ON fsa.album_id = a.id
        WHERE a.artist_name IN (SELECT artist_name FROM UserArtists)
        GROUP BY u.username, u.email
        HAVING COUNT(DISTINCT a.artist_name) >= $2
      )
      SELECT 
        username,
        email,
        match_count as matching_artists,
        artist_list as artist_names
      FROM MatchingArtists
      ORDER BY matching_artists DESC
      LIMIT 10
    `, [user_id, requestedN]);

    res.json({
      message: "Successfully found friends with common artists",
      friends: result.rows.map(row => ({
        username: row.username,
        email: row.email,
        commonArtists: {
          count: parseInt(row.matching_artists),
          names: row.artist_names
        }
      }))
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message 
    });
  }
});

module.exports = router;