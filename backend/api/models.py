from django.db import models
from django.contrib.auth.models import User

# creamos un nuevo modelo llamado Note, que hereda de models.Model. Mediante la ORM se va a crear una tabla en la base de datos para este modelo
class Note(models.Model):
    # campos de la base de datos con su tipo
    title = models.CharField(max_length=100)
    content = models.TextField()
    # carga la fecha y hora del momento en que se crea la nota
    created_at = models.DateTimeField(auto_now_add=True)
    # establece la relación de la tabla de usuarios con la tabla de notas. on_delete=models.CASCADE indica que, si se elimina el usuario se eliminan todas las notas que creó
    # en el modelo de User, si vamos al atributo User.notes vamos a ver todas las notas que ese User creó
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    # redefinimos el método srt para que devuelva el título de la nota
    def __str__(self):
        return self.title