from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room

# Lets u create record in model Create/ListAPIView
# class RoomView(generics.CreateAPIView):
#     queryset = Room.objects.all()
#     serializer_class = RoomSerializer


class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class GetRoom(APIView):
    # When we call GetRoom view by GET request, we are passing 'code' parameter, room code from front end
    serializer_class = RoomSerializer
    # kwarg = Key Word Arguments
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        # .GET -> info about URL from get request
        # .get parameters in URL
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code).first()

            # If room matches the code
            if room:
                data = RoomSerializer(room).data

                # Add new keyvalue
                data['is_host'] = self.request.session.session_key == room.host
                return Response(data, status=status.HTTP_200_OK)
            # When room does not exists
            return Response({'Room Not Found': 'Invalid room Code.'}, status=status.HTTP_404_NOT_FOUND)

        # When room code was not passed in URL
        return Response({'Bad Request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)


class JoinRoom(APIView):
    # Allows to join the Room

    # This is not the same as in GetRoom -> it is done to avoid hard codeing
    lookup_url_kwarg = 'code'

    def post(self, request, format=None):
        # Check if user has got active session
        if not self.request.session.exists(self.request.session.session_key):
            # Create session if not
            self.request.session.create()
        
        # Get room code from post request
        code = request.data.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code).first()
            if room:
                # Save the information about the user in the room 
                self.request.session['room_code'] = code

                return Response({'message': 'Room Joined!'}, status=status.HTTP_200_OK)

            return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'Bad Request': 'Invalid post data, did not find a code key'}, status=status.HTTP_404_NOT_FOUND)


class CreateRoomView(APIView):
    # APIView allows us to override GET, POST and PUT method
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        # Check if user have active session with our server
        if not self.request.session.exists(self.request.session.session_key):
            # Create session if not
            self.request.session.create()

        # Use serializer, take data and give back python representation   
        serializer = self.serializer_class(data=request.data)

        # Create Room if valid
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key

            # Check if user already created a room
            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                # Update room
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                # When updating with save method use update_fields parameter
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])

                # Save the information about room code in session
                self.request.session['room_code'] = room.code

                # Return serialized object that we just created/updated and status code
                # .data gives JSON formated data
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                # Create room
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()

                # Save the information about room code in session
                self.request.session['room_code'] = room.code

                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

           
            return Response({'Bad Request': "Invalid data."}, status=status.HTTP_400_BAD_REQUEST)


class UserInRoom(APIView):
    def get(self, request, format=None):
        # Check if user have active session with our server
        if not self.request.session.exists(self.request.session.session_key):
            # Create session if not
            self.request.session.create()
        # Get room code from session storage
        data = {
            'code': self.request.session.get('room_code')
        }

        return JsonResponse(data, status=status.HTTP_200_OK)


class LeaveRoom(APIView):
    def post(self, request, format=None):
        # Check if room code is stored in session
        if 'room_code' in self.request.session:
            # Remove code from the session
            self.request.session.pop('room_code')

            # Get user id
            user_id = self.request.session.session_key
            # Check if user is room host
            room =  Room.objects.filter(host=user_id).first()

            # Delete room when host leaves it
            if room:
                room.delete()
        return Response({'Message': 'Success.'}, status=status.HTTP_200_OK)


class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    # Update/modify something on server with "patch"
    def patch(self, request, format=None):
        # Check if user have active session 
        if not self.request.session.exists(self.request.session.session_key):
            # Create session if not
            self.request.session.create()

        # Validate the data
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')
            
            # Serch for the room in model, return 404 when not found
            room = Room.objects.filter(code=code).first()
            if not room:
                return Response({'Message': "Room not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check if user is the host of the room
            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({'Message': "You are not host of this room."}, status=status.HTTP_403_FORBIDDEN)

            # Update fields
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])

            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        # Return if serialized data is not valid
        return Response({'Bad Request': 'Invalid Data...'}, status=status.HTTP_400_BAD_REQUEST)

