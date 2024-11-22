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
    // si el request falla infomamos el error
    (error) => {
        return Promise.reject(error)
    }
)

export default api