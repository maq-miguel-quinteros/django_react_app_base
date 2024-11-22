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