from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# CreateAPIView permite manejar la creación de un nuevo objeto como cualquiera como User
class CreateUserView(generics.CreateAPIView):
    # indicamos que el query van a ser todos los atributos de UserSerializer
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # al endpoint de creación de usuarios van a tener permiso cualquiera
    permission_classes = [AllowAny]