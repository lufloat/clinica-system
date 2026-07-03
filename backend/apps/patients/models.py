from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=150)
    cpf = models.CharField(max_length=14, unique=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    birth_date = models.DateField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name