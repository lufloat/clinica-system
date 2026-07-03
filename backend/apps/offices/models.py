from django.db import models

class Office(models.Model):
    name = models.CharField(max_length=100)
    room = models.CharField(max_length=20)
    floor = models.CharField(max_length=20)
    observations = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name