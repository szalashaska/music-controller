from django.db import models
import string
import random

def generete_unique_code():
    lenght = 6

    # Generates random code of lenght 'lenght' and only contains uppercase ASCII characters
    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=lenght))
        # Check if code is unique
        if Room.objects.filter(code=code).count() == 0:
            break
    return code

class Room(models.Model):
    code = models.CharField(max_length=8, default=generete_unique_code, unique=True)
    host = models.CharField(max_length=50, unique=True)
    guest_can_pause = models.BooleanField(null=False, default=False)
    votes_to_skip = models.IntegerField(null=False, default=1)
    created_at = models.DateTimeField(auto_now_add=True)