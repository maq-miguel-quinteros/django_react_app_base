from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, NoteSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note

# CreateAPIView permite manejar la creación de un nuevo objeto como cualquiera como User
class CreateUserView(generics.CreateAPIView):
    # indicamos que el query van a ser todos los atributos de UserSerializer
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # al endpoint de creación de usuarios van a tener permiso cualquiera
    permission_classes = [AllowAny]

# utilizamos ListCreateAPIView ya que esta view va a poder crear una nueva nota o listar las notas de un usuario
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    # esta view solo va a devolver datos si el pedido desde el front envía un token access valido de JWT
    permission_classes = [IsAuthenticated]

    # sobrescribimos el método get_queryset que se encarga de dar valor al atributo queryset
    def get_queryset(self):
        # traemos el usuario que está autenticado, el usuario actual y lo guardamos en user
        user = self.request.user
        # traemos todas las notas de ese user en particular. Para traer todas las notas de todos los usuarios utilizamos Note.objects.All()
        return Note.objects.filter(author=user)
    
    # sobrescribimos el método perform_create. En caso de no hacerlo esté método utiliza queryset, serializer_class y permission_classes para crear nuevas notas de forma automática
    def perform_create(self, serializer):
        if serializer.is_valid():
            # si los datos son validos se guarda la nota con el campo usuario igual user, es decir, el usuario autenticado
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

# DestroyAPIView es una view que se encarga de borrar los elementos de la base de datos según el modelo que le pasamos
class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    # indicamos mediante un método el queryset
    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)