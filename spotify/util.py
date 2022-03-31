from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from requests import post, put, get

from .credentials import CLIENT_ID, CLIENT_SECRET

BASE_URL = "https://api.spotify.com/v1/me/"

def get_user_tokens(session_id):
    user_token = SpotifyToken.objects.filter(user=session_id).first()
    if user_token:
        return user_token
    else:
        return None
    

def update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_id)
    # We are adding are expires time to current time, so we can know exact time of expiry
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # Update tokens
    if tokens:
        tokens.access_token = access_token
        tokens.token_type = token_type
        tokens.expires_in = expires_in
        tokens.refresh_token = refresh_token
        tokens.save(update_fields=['access_token', 'token_type', 'expires_in', 'refresh_token'])
    # Create tokens, if there are none
    else:
        tokens = SpotifyToken(user=session_id, access_token=access_token, token_type=token_type, expires_in=expires_in, refresh_token=refresh_token)
        tokens.save()


def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        # Check if tokes expired
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            refresh_spotify_token(session_id)
        return True
        
    # When there is no tokens
    return False


def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

    # grant_type is what we are sending
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
        }).json()
        
    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    # Token remains the same, it is only refreshed by spotify
    # refresh_token = response.get('refresh_token')

    # Update tokens
    update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)


def execute_spotify_api_request(session_id, endpoint, post_=False, put_=False):
    # Assuming we are sending host id
    tokens = get_user_tokens(session_id)
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {tokens.access_token}'}

    if post_:
        post(f'{BASE_URL}{endpoint}', headers=headers)
    if put_:
        put(f'{BASE_URL}{endpoint}', headers=headers)

    # For get request we need to put empty dict, syntax stuff
    response = get(f'{BASE_URL}{endpoint}', {}, headers=headers)
    try:
        return response.json()
    except: 
        return {'Error': 'Issue with request'}


def play_song(session_id):
    return execute_spotify_api_request(session_id, "player/play", put_=True)


def pause_song(session_id):
    return execute_spotify_api_request(session_id, "player/pause", put_=True)


def skip_song(session_id):
    return execute_spotify_api_request(session_id, "player/next", post_=True)