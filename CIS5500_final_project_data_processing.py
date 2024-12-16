import pandas as pd
import re

df = pd.read_csv('~/downloads/artists.csv', low_memory=False)

dropped_cols = ['artist_mb', 'country_mb', 'tags_mb']
df.drop(columns=dropped_cols, inplace=True)

df['tags_lastfm'] = df['tags_lastfm'].str.split(';').str[0]


df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Rock.*', 'Rock', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Metal.*', 'Metal', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Country.*', 'Country', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Rap.*', 'Rap', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Electr.*', 'Electronic', regex=True, flags=re.IGNORECASE)

df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Jazz.*', 'Jazz', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace('Dubstep', 'Electronic', flags=re.IGNORECASE)

df['tags_lastfm'] = df['tags_lastfm'].str.capitalize()

df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Funk.*', 'Funk / Soul', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Soul.*', 'Funk / Soul', regex=True, flags=re.IGNORECASE)
df['tags_lastfm'] = df['tags_lastfm'].str.replace(r'.*Pop.*', 'Pop', regex=True, flags=re.IGNORECASE)

df['tags_lastfm'] = df['tags_lastfm'].str.replace('Hip-hop', 'Hip Hop', flags=re.IGNORECASE)

df.to_csv('~/downloads/artists.csv', index=False)


