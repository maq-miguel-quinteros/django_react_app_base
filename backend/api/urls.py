from django.urls import path
from . import views

urlpatterns = [
    # para crear y listar las notas
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    # para eliminar una nota
    path('notes/delete/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
]