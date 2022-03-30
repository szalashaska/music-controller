from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # Fields that are taken from Model and serialized as response
        fields = ('id', 'code', 'host', 'guest_can_pause', 'votes_to_skip', 'created_at')


class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        # Fields that are sended in POST request
        fields = ('guest_can_pause', 'votes_to_skip')


class UpdateRoomSerializer(serializers.ModelSerializer):
    # Redefine field in serializer: 'code' field in models has 'unique=true' constriant, 
    # which will couse invalid data error when updating the room data. Lets us pass a code value,
    # that is not unique.
    code = serializers.CharField(validators=[])

    class Meta:
        model = Room
        # Fields that are sended in POST request
        fields = ('guest_can_pause', 'votes_to_skip', 'code')