# Backend

  ## Setup

### Install dependencies

Creamos el entorno virtual para python y activamos el mismo

```shellscript
python -m venv env
env/Scripts/activate
```

Instalamos las dependencias, para hacerlo creamos un archivo llamado `requirements.txt` y dentro copiamos lo siguiente:

```plaintext
asgiref
Django
django-cors-headers
djangorestframework
djangorestframework-simplejwt
PyJWT
pytz
sqlparse
psycopg2-binary
python-dotenv
```

Instalamos las librerías mediante el siguiente comando

```shellscript
pip install -r requirements.txt
o
pip install -r backend/requirements.txt # si estamos copiando el proyecto
```

Creamos un nuevo proyecto de django. Podemos llamar backend_nombre_app o perecido.

```shellscript
django-admin startproject backend
```

Creamos una app llamada `api`.

```shellscript
python manage.py startapp api
```

### Setting

Editamos el archivo `setting.py` de la app base `backend`. Primero realizamos importaciones

```py3
from pathlib import Path
# importamos las siguiente librerías
from datetime import timedelta
from dotenv import load_dotenv
import os

# ejecutamos la función que importamos antes. Se usa para credenciales de la base de datos
load_dotenv()
```

Configuramos permisos

```py3
# editamos el atributo. * permite a cualquier host consultar la app que estamos creando
ALLOWED_HOSTS = ["*"]

# configuramos la autenticación mediante las clases que se indican en el objeto. Esto permite el uso de JWT
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# indicamos cual es el tiempo que van a ser validos los tokens
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}
```

Agregamos apps a la configuración. `corsheaders` evita problemas de cors en el navegador, que son errores cuando el origen de los datos (backend) difiere de donde son solicitados (frontend) por estar en servidores diferentes.

```py3
INSTALLED_APPS = [
	# otras apps
    'django.contrib.staticfiles',
    # agregamos las apps, api es la que creamos nosotros
    "api",
    "rest_framework",
    "corsheaders",
]
```

Agregamos `middleware` a la configuración

```py3
MIDDLEWARE = [
	# otro middleware
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # agregamos el middleware para el uso de la app de corsheaders
    "corsheaders.middleware.CorsMiddleware",
]
```

Al final del archivo agregamos atributos para la configuración de los cors. Por lo general no se configuran como `CORS_ALLOW_ALL_ORIGINS = True`, lo dejamos de esta manera por la posibilidad de diferentes servidores para back y front sin conocerlos aun. (investigar como configurar esto de forma mas segura)

```py3
# Agregamos atributos de configuración para los cors
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWS_CREDENTIALS = True
```

## Config Javascript Web Token JWT 

JWT: el frontend envía credenciales al backend (usuario y contraseña), si estos datos son correctos el backend devuelve dos tokens, el access token y el refresh token. Las siguiente llamadas desde el frontend, donde se envía el access token, va a poder acceder a endpoints que no podría de no estar autenticado. Después de un tiempo determinado (que definimos en 30 minutos) el access token deja de ser válido, en ese momento el frontend puede enviar el refresh token para volver a autenticarse y obtener un nuevo access token para seguir trabajando.

### User model

ORM Object Relational Mapping: un ORM se encarga mapear los objetos de python en el código que se necesita para modificar, en la base de datos, las tablas a las que los mismos objetos hacen referencia. La comunicación desde el frontend es mediante JSON, para trabajar esos datos que llegan utilizamos en python los serializers, que traducen esos JSON en datos que puede manejar python a la vez que envían esos datos trabajados como JSON hacia el frontend.

En `api` creamos el archivo `serializers.py`

```py3
# con import User evitamos tener que crear un modelo para los usuarios
from django.contrib.auth.models import User
from rest_framework import serializers

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
```

### Registration view

En `api` editamos el archivo `views.py`. Creamos una view, es decir, un endpoint al que va a llamar el frontend cuando quieran, en este caso, crear un nuevo usuario

```py3
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
```

Editamos `urls.py` de la app `backend`

```py3
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
    path("api-auth/", include("rest_framework.urls"))

]
```

Creamos o actualizamos la base de datos con el modelo de usuario que configuramos. Después ejecutamos el servidor para probar las path.

```shellscript
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

## Custom model

### Model

En `api` editamos el archivo `models.py`. Agregamos un modelo para las notas y establecemos una relación de muchos a uno entre user y las notas que puede tener.

```py3
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
```

### Serializer

En `api` editamos el archivo `serializers.py` y agregamos el serializer para el modelo que creamos

```py3
from django.contrib.auth.models import User
from rest_framework import serializers
# importamos el custom model
from .models import Note

# otros serializer

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'author']
        # podemos traer el usuario desde este serializer pero no podemos editarlo
        extra_kwargs = {'author': {'read_only': True}}
```

### Views

En `api` editamos el archivo `views.py`. Creamos una view para crear y listar notas y una view para eliminar notas.

```py3
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, NoteSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note

# otras views

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
```

### Urls

En `api` creamos un nuevo archivo `urls.py`

```py3
from django.urls import path
from . import views

urlpatterns = [
    # para crear y listar las notas
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    # para eliminar una nota
    path('notes/delete/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
]
```

En `backend` editamos el archivo `urls.py`

```py3
# otros import

urlpatterns = [
    # otros path
    # traemos las urls de la app api
    path('api/', include('api.urls')),
]
```

# Frontend



## Create project and install dependencies 

Creamos un nuevo proyecto de `react` con `vite`. Ponemos de nombre `frontend` al proyecto

```shellscript
npm create vite@latest
```

Ingresamos en la carpeta `frontend` e instalamos las siguientes dependencias. Instalamos también tailwindcss desde el siguiente [link](https://tailwindcss.com/docs/guides/vite)

```shellscript
npm install
npm install axios react-router-dom jwt-decode
```

Eliminamos los archivos css que no vamos a utilizar y limpiamos el código de los componentes principales del proyecto

## Config axios

En `src` creamos el archivo `constants.js`. Configuramos las constantes que vamos a utlizar para los tokens.

```js
export const ACCESS_TOKEN = 'access';
export const REFRESH_TOKEN = 'refresh';
```

En `frontend` creamos el archivo `.env`. La variable que configuramos aquí tiene que empezar con VITE

```plaintext
VITE_API_URL='http://localhost:8000'
```

En `src` creamos el archivo `api.js`. Configuramos `axios` y el `inteceptor` que se va a encargar de armar la cabecera del `request` a la api, para que la misma lleve los valores del `token`.

```js
import axios from 'axios'
import { ACCESS_TOKEN } from './constants'

// configuramos la variables api mediante axios
const api = axios.create({
    // la URL base de todos los llamados con axios va a ser la de la variable VITE_API_URL
    baseURL: import.meta.env.VITE_API_URL
})

// configuramos el interceptor, que van a configurar el header de los request que hagamos. Use recibe funciones para su configuración
api.interceptors.request.use(
    // si el request que hacemos es sxitoso, es decir, la api responde
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (token){
            // agregamos el token al header del request para el parámetro de autorización
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    // si el request falla informamos el error
    (error) => {
        return Promise.reject(error)
    }
)

export default api
```

## Protected routes

Creamos la carpeta `components` y en la misma el archivo `ProtectedRoute.jsx`. Aqui vamos a configurar el check del token antes de permitir el acceso a otras rutas de la app

```javascriptreact
import {Navigate} from 'react-router-dom'
import {jwtDecode} from 'jwt-decode'
import api from '../api'
import { REFRESH_TOKEN, ACCESS_TOKEN } from '../constants'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({children}) {
    const [isAuthorized, setIsAuthorized] = useState(null)

    // al cargar el componente ProtectedRoute va ejeutar auth desencadenando las comprobaciones de token y refresh token
    useEffect(()=>{
        auth().catch(()=>{
            isAuthorized(false)
        })
    }, [])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN) 
        try{
            // tratamos de generar un nuevo token con el refresh
            const response = await api.post('/api/token/refresh/', {refresh: refreshToken})
            // si la respuesta es 200 success
            if ( response.status === 200 ){
                // guardamos el nuevo access token en el local storage
                localStorage.setItem(ACCESS_TOKEN, response.data.access)
                setIsAuthorized(true)
            }else{
                setIsAuthorized(false)
            }
        }catch(error){
            // si no logramos hacer el refresh del token no ingresa
            console.log(error)
            setIsAuthorized(false)
        }
    }

    const auth = async () => {
        // recuperamos el token
        const token = localStorage.getItem(ACCESS_TOKEN)
        // si no hay token 
        if (!token){
            setIsAuthorized(false)
            return
        }
        // separamos los datos del token
        const decoded = jwtDecode(token)
        // recuperamos la fecha y hora de expiración del token
        const tokenExpiration = decoded.exp
        // recuperamos la fecha actual en segundos diviendo por 1000
        const now = Date.now() / 1000

        // verificamos si el token expiró
        if (tokenExpiration < now ){
            // ejecutamos el refresh del token
            await refreshToken()
        }else {
            // permitimos el acceso
            setIsAuthorized(true)
        }
    }

    // se va a mostrar loading mientras se ejecutan las otras dos funciones async
    if (isAuthorized === null){
        return <div>Loading</div>
    }

    // si las funciones de auth o rereshToken hacen isAuthorized true se va a devolver el chldren, es decir, la páginas que se configuren dentro e la ruta segura, si devuelven false va a redireccionar a /login para hacer el logueo del usuario
    return isAuthorized ? children : <Navigate to='/login' />
}
```

## Navigation, register & login pages

### Navigation

Creamos la carpeta `pages` y dentro creamos 4 componentes `Home`, `Login`, `NotFound` y `Register`. Editamos el componente `App.jsx`

```javascriptreact
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

// si hacemos logout limpiamos del local storage los token y redireccionamos a login
function Logout() {
	localStorage.clear()
	return <Navigate to='/login/' />
}

// cuando hacemos el registro de un nuevo usuario necesitamos borrar el local storage para que no queden token de un usuario anterior
function RegisterAndLogout() {
	localStorage.clear()
	return <Register />
}

function App() {

	return (
		<BrowserRouter>
			<Routes>
				{/* para el path / se va a renderizar ProtectedRoute, si se cumplen las condiciones de ese elemento muestra su children que en el ejemplo es Home, sino hace lo que indica la lógica de ese elemento, que es ir a login directamente */}
				<Route
					path='/'
					element={
						<ProtectedRoute>
							<Home />
						</ProtectedRoute>
					}
				/>
				{/* rutas que no necesitan la validación de ProtectedRoute */}
				<Route path='/login' element={<Login />} />
				<Route path='/logout' element={<Logout />} />
				<Route path='/register' element={<RegisterAndLogout />} />
				<Route path='\*' element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
```

### 404 NotFound

En `pages` editamos el componente `NotFound`

```javascriptreact

export default function NotFound() {
    return (
        <div>
            <h1>404 No Found</h1>
            <p>La página a la que trata de ingresar no existe o no tiene los permisos necesarios para visitarla</p>
        </div>
    )
}
```

### Register & login form component

En `components` creamos un componente llamado `Form`. Va a ser un formulario genérico que vamos a usar para hacer el registro del usuario o para el login del usuario, ya que ambos, en este caso, utilizan los mismos datos.

```javascriptreact
/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

export default function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            // hacemos un llamado a la api con la route que mandan al componente cuando lo llaman. Si la respuesta es correcta, es decir, si el try no da error, pueden ser dos los caminos
            const response = await api.post(route, { username, password });
            // si la route era login guardamos los token en el local storage
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                navigate("/");
                // si la ruta era register no tenemos nada mas que hacer que redireccionar a login para que el usuario ingrese con el username recién creado
            } else {
                navigate("/login");
            }
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
            <h1 className="text-base/7 font-semibold text-gray-900">{name}</h1>
            <div className="mb-5">
                <label
                    htmlFor="username"
                    className="block mb-2 text-sm font-medium text-gray-900"
                >
                    Your username
                </label>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    id="username"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Username"
                    required
                />
            </div>
            <div className="mb-5">
                <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                >
                    Your password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                />
            </div>
            <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
                {name}
            </button>
        </form>
    );
}

```

En `pages` editamos el componente `Register` y `Login`. Agregamos el componente `Form` con sus parámetros según el caso

```javascriptreact
import Form from "../components/Form"

export default function Register() {
    return <Form route='/api/user/register/' method='register' />
}
```

```javascriptreact
import Form from "../components/Form"

export default function Login() {    
    return <Form route='/api/token/' method='login' />
}
```

### Test registe & login

Para poder probar el formulario y la respuesta de la base de datos tenemos que hacer `runserver` en el backend y configurar el archivo `.env` con la ruta que nos devuelve al levantar el servidor. Esa ruta va a tomar `axios` para configurar `api` y es a la que vamos a hacer las consultas.

```plaintext
VITE_API_URL='http://127.0.0.1:8000' 
```

## Home page 

### Loading component

En `components` creamos un componente para mostrar como `Loading`, si el alta de una nota demora, y le damos estilos. Para este componente vamos a crear una carpeta llamada `styles` en `src` y dentro un archivo llamado `LoadingIndicator.css`

```javascriptreact
import "../styles/LoadingIndicator.css"

export default function LoadingIndicator() {
    return (
        <div className="loading-container">
        <div className="loader"></div>
    </div>
    )
}
```

`LoadingIndicator.css`

```css
.loader-container {
	display: flex;
	justify-content: center;
	align-items: center;
}

.loader {
	border: 5px solid #f3f3f3;
	/* Light grey */
	border-top: 5px solid #3498db;
	/* Blue */
	border-radius: 50%;
	width: 50px;
	height: 50px;
	animation: spin 2s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}
```

### Note component

En `components` creamos el componente `Note`. Mediante este vamos a mostrar la lista de notas en `Home`. Le damos estilos desde un css

```javascriptreact
/* eslint-disable react/prop-types */
import "../styles/Note.css"

export default function Note({note, onDelete}) {

    // damos formato a la fecha que viene en created_at
    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US")

    return (
        <div className="note-container">
            <p className="note-title">{note.title}</p>
            <p className="note-content">{note.content}</p>
            <p className="note-date">{formattedDate}</p>
            <button className="delete-button" onClick={() => onDelete(note.id)}>
                Delete
            </button>
        </div>
    )
}
```

`Note.css`

```css
.note-container {
	padding: 10px;
	margin: 20px 0;
	border: 1px solid #ccc;
	border-radius: 5px;
}

.note-title {
	color: #333;
}

.note-content {
	color: #666;
}

.note-date {
	color: #999;
	font-size: 0.8rem;
}

.delete-button {
	background-color: #f44336;
	/* Red */
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 5px;
	cursor: pointer;
	transition: background-color 0.3s;
}

.delete-button:hover {
	background-color: #d32f2f;
	/* Darker red */
}
```

### Home component

En `pages` editamos el component `Home`

```javascriptreact
import {useState, useEffect} from 'react'
import Note from '../components/Note'
import api from '../api'

export default function Home() {
    const [notes, setNotes] = useState([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    
    const getNotes = () => {
        api.get('/api/notes/')
            .then((response) => response.data)
            .then((data) => {setNotes(data); console.log(data)})
            .catch((error) => alert(error))
    }

    const deleteNote = (id) => {
        api.delete(`/api/notes/delete/${id}/`)
            .then((res) => {
                // 204 es respuesta entregada con exito
                if (res.status === 204) alert('Note deleted!')
                else alert('Fail to delete note')
                getNotes()
            })
            .catch((error) => alert(error))
        
    }

    const createNote = (e) => {
        e.preventDefault()
        api.post('/api/notes/', {title, content})
            .then((res) => {
                // 201 creación correcta
                if(res.status === 201) alert('Note created')
                else alert('Fail to make note')
                // después de crear la nota llamamos a getNotes para traer todas las notas
                getNotes()
            })
            .catch((error) => alert(error))        
    }

    useEffect(()=> {
        getNotes()
    }, [])

    return (
        <div>
            <div className="max-w-sm mx-auto">
                <h2 className="text-base/7 font-semibold text-gray-900">Notes</h2>
                {notes.map((note) => (
                    <Note note={note} onDelete={deleteNote} key={note.id} />
                ))}
            </div>
            
            <form onSubmit={createNote} className="max-w-sm mx-auto">
            <h2 className="text-base/7 font-semibold text-gray-900">Create a Note</h2>
                <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">Title:</label>
                <br />
                <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
                <label htmlFor="content"  className="block mb-2 text-sm font-medium text-gray-900">Content:</label>
                <br />
                <textarea
                    id="content"
                    name="content"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                ></textarea>
                <br />
                <input type="submit" value="Submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"></input>
            </form>
        </div>
    )
}
```

# Deploy
