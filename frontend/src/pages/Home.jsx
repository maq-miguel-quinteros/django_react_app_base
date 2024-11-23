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
