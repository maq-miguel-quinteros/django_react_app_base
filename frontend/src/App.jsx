import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

// si hacemos logout limpiamos del local storage los token y redireccionamos a login
function Logout(){
  localStorage.clear()
  return <Navigate to='/login/' />
}

// cuando hacemos el registro de un nuevo usuario necesitamos borrar el local storage para que no queden token de un usuario anterior
function RegisterAndLogout(){
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
        <Route path='/login'element={<Login />} />
        <Route path='/logout'element={<Logout />} />
        <Route path='/register'element={<RegisterAndLogout />} />
        <Route path='*'element={<NotFound />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App
