# con import User evitamos tener que crear un modelo para los usuarios
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note

# creamos el serializer para el modelo User
class UserSerializer(serializers.ModelSerializer):
    # clase base para los serializer
    class Meta:
        model = User
        # atributos que puede recibir y enviar el serializer
        fields = ["id", "username", "password"]
        # reglas extra para los atributos anteriores. El password solo se va a poder escribir desde el front, no leer (devolver hacia el front)
        extra_kwargs = {"password": {"write_only": True}}
    
    # redefinimos la función create de ModelSerializer para adaptarla a nuestro serializer
    def create(self, validate_data):
        # a la función create_user le pasamos los datos validados. Esta validación fue hecha previamente por el propio ModelSerializer. Los datos que valida son los indicados en fields de la clase Meta
        user = User.objects.create_user(**validate_data)
        return user

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'author']
        # podemos traer el usuario desde este serializer pero no podemos editarlo
        extra_kwargs = {'author': {'read_only': True}}