# Letterboxd for Albums

A web application that serves as a "Letterboxd for Albums" - allowing users to track, analyze, and share their music listening habits with friends. Users can save albums, discover new music through various analytical queries, and connect with friends over shared musical interests.

## Feature Screenshots
<img width="1230" alt="letterboxd-for-music-ex1" src="https://github.com/user-attachments/assets/cec1f876-f9ab-43af-b18a-922927f371ea" />
<img width="1060" alt="letterboxd-for-music-ex2" src="https://github.com/user-attachments/assets/934c6a73-6f0e-453c-af71-8349b8b37e9d" />
<img width="608" alt="letterboxd-for-music-ex3" src="https://github.com/user-attachments/assets/a3a15a8e-2f02-4aaa-b610-cb1bddfd988e" />
<img width="843" alt="letterboxd-for-music-ex4" src="https://github.com/user-attachments/assets/b930b1ae-c576-4dd4-89dd-1b26e809c880" />
<img width="719" alt="letterboxd-for-music-ex5" src="https://github.com/user-attachments/assets/726914c0-c2b0-4fbc-baeb-08fd27316d4c" />

## Tech Stack

### Frontend
- React.js
- CSS for styling
- React Router for navigation
- Fetch API for backend communication

### Backend
- Node.js
- Express.js
- PostgreSQL database
- pg (node-postgres) for database connection

## Features

### User Authentication
- User registration and login system
- Secure password handling
- Session management

### Core Functionality
- Save and track albums
- View detailed album information
- Follow other users
- Analyze listening habits
- Discover music through various metrics

## Key Queries and Optimizations

### 1. Top N Albums by Genre Analysis
**Purpose:** Analyzes a user's top N saved albums, breaking them down by genre and providing artist statistics.

**Optimization:**
- Uses CTEs (Common Table Expressions) for better query organization
- Implements efficient grouping and aggregation
- Original version used multiple separate queries, now consolidated into one
- Added indexes on frequently queried columns (genre, release_date)

### 2. Artists by Genre in Date Range
**Purpose:** Finds top artists in a specific genre within a given date range.

**Optimization:**
- Utilizes subqueries for better performance
- Implements date range filtering at the database level
- Added compound index on (release_date, genre)
- Reduced data transfer by selecting only necessary columns

### 3. Friends with Common Artists
**Purpose:** Discovers friends who share N or more common artists with the user.

**Optimization:**
- Uses CTEs for better query structure and performance
- Implements efficient JOIN operations
- Added indexes on user_id and artist_name
- Original version used nested loops, now uses set operations
- Reduced memory usage by limiting results to top 10 matches

### 4. Top 10 Saved Albums Analysis
**Purpose:** Provides detailed analysis of user's top 10 saved albums.

**Optimization:**
- Implements efficient sorting and limiting
- Uses JOIN operations instead of subqueries
- Added indexes on frequently accessed columns
- Reduced data transfer by combining multiple queries into one

## Database Schema

### Key Tables
- users: User account information
- albums: Album metadata
- artists: Artist information
- user_saved_albums: Junction table for user-album relationships
- followers: User following relationships

### Indexes
Strategic indexes on:
- album_id and user_id in junction tables
- genre and release_date in albums table
- artist_name in artists table

## Setup and Installation

1. Clone the repository
