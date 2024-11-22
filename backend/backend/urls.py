
from django.contrib import admin
from django.urls import include, path
# importamos la view a la que vamos a configurar su path
from api.views import CreateUserView
# estos dos métodos nos van a brindar los tokens de access y refresh
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # configuramos el path para la view
    path("api/user/register/", CreateUserView.as_view(), name="register"),
    # path para obtener el token
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    # path para hacer un refresh del token
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    # todas los path a los que va a poder ingresar el usuario una vez autenticado
    path("api-auth/", include("rest_framework.urls")),
    # traemos las urls de la app api
    path('api/', include('api.urls'))

]
