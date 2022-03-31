from django.shortcuts import render, redirect
from requests import Request, post
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response

from .credentials import REDIRECT_URI, CLIENT_SECRET, CLIENT_ID
from .util import *
from api.models import Room
from .models import Vote


class AuthURL(APIView):
    def get(self, request, format=None):
        scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        # Generetes URL for Frontend
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scope,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)

def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    # Sends request to API
    # "grant_type is what we are sending
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')
    error = response.get('error')

    # Check if user have active session with our server
    if not request.session.exists(request.session.session_key):
        # Create session if not
        request.session.create()

    # Call function from util.py and update or create tokens
    update_or_create_user_tokens(request.session.session_key, access_token, token_type, expires_in, refresh_token)

    # Redirect back to frontends homepage, frontend:room would redirect to room page
    return redirect('frontend:')


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)

        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)


class CurrentSong(APIView):
    def get(self, request, format=None):
        # Get the room host, so we can query spotify API -> person in room in not always a host
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        # Retur error, if there were no session, or no room
        if not room:
            return Response({'Error': 'Room does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        host = room.host

        # Send request to API
        endpoint = "player/currently-playing"
        response =  execute_spotify_api_request(host, endpoint)

        # Validate the response
        if 'error' in response or 'item' not in response:
            return Response({"Message": 'No song is currently playing'}, status=status.HTTP_204_NO_CONTENT)

        # Get data from API response (json)
        is_playing = response.get('is_playing')
        progress = response.get('progress_ms')

        item = response.get('item')
        title = item.get('name')
        duration = item.get('duration_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        song_id = item.get('id')

        # Handle multiple artist case - iterate over artist
        artist_string = ""
        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            name = artist.get('name')
            artist_string += name

        # Count current votes
        votes = Vote.objects.filter(room=room, song_id=song_id).count()

        # Prepere data to return
        song = {
            'title': title,
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': votes,
            'votes_required': room.votes_to_skip,
            'id': song_id
        }

        # Call update function
        self.update_room_song(room, song_id)

        return Response(song, status=status.HTTP_200_OK)

    def update_room_song(self, room, song_id):
        current_song = room.current_song

        # Update field, if song has changed
        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])

            # Query database by room instance/foreign key
            # Delete all votes, that have been placed since the song has changed
            votes = Vote.objects.filter(room=room).delete


class PauseSong(APIView):
    def put(self, response, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        # Host can pause and guests, when it is allowed
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({'Message': 'Song paused.'}, status=status.HTTP_204_NO_CONTENT)

        return Response({'Error': 'Not llowed to temper with song'}, status=status.HTTP_403_FORBIDDEN)


class PlaySong(APIView):
    def put(self, response, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        # Host can pause and guests, when it is allowed
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({'Message': 'Song played.'}, status=status.HTTP_204_NO_CONTENT)

        return Response({'Error': 'Not llowed to temper with song'}, status=status.HTTP_403_FORBIDDEN)


class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        # song_id... Can cause error, if you skip the song and next one is the same 
        votes = Vote.objects.filter(room=room, song_id=room.current_song).count()
        votes_needed = room.votes_to_skip

        # Skip song if you are host of the room or amount of votes is enough to skip
        if self.request.session.session_key == room.host or (votes + 1) >= votes_needed:
            # Clear the votes before skip
            votes.delete()
            skip_song(room.host)
            
        # If you are guest, and votes are not enough
        else:
            # Create a vote
            vote = Vote(user=self.request.session.session_key, room=room, song_id=room.current_song)
            vote.save()
        
        return Response({'Message': 'Problem while skipping a song.'}, status=status.HTTP_204_NO_CONTENT)


