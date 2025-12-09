import { useEffect, useState } from "react"
import { supabase } from "./config/supabaseConfig"


export default function App() {
    const [data, setData] = useState('')
    const [update, setUpdate] = useState(false)
    async function handleDatabase() {
        const response = await supabase
            .from('Metrics')
            .select('*')
            .eq("entry_id", 1)
        console.log(response)
        setData(JSON.stringify(response['data'][0]['sleep']))
    }
    useEffect(() => {
        handleDatabase()
    }, [update])

    return (
        <>
            <button onClick={() => setUpdate(!update)}>Update</button>
            <hr/>
            {data}
        </>
    )
}