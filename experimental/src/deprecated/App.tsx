import { useEffect, useState } from "react"
import { supabase } from "../config/supabaseConfig"

/*
For testing supabase connection to frontend
*/

export default function App() {
    const [update, setUpdate] = useState(true)
    const [display, setDisplay] = useState('')
    async function handleDatabase() {
        const response = await supabase
            .from('Test')
            .select('*')
        
        setDisplay(JSON.stringify(response))
        console.log('updated')
    }
    useEffect(() => {
        handleDatabase()
    }, [update])
    return (
        <>
            <button onClick={() => setUpdate(!update)}>Update</button>
            <hr/>
            {display}
        </>
    )
}


