import { useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { Dropdown } from "react-native-element-dropdown"


type DailyEntry ={
    id: string,
    created_at: string,
    datetime: string
}


interface DateDropDownProps {
    setEntryId: React.Dispatch<React.SetStateAction<any>>
    style?: StyleProp<ViewStyle>,
    data?: DailyEntry[]
}


export function DateDropDown({ setEntryId, style, data = [{
        datetime: 'Oct 30, 2025', 
        created_at: '',
        id: '-1'
    }]
}: DateDropDownProps) {
    const [value, setValue] = useState(
        data.length > 0 ? data[0].id : null
    )
    function handleOnChange(item: any) {
        setValue(item.id)
        setEntryId(item.id)
    }
    return (
        <Dropdown
            placeholder="Select..."
            data={data}
            labelField="datetime"
            valueField="id"
            value={value}
            onChange={handleOnChange}
        />
    )
}
