import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    messages: []
}

// The variable name was 'messSlice' but you were exporting 'messagesSlice'
const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        // Your message reducers will go here
    },
});

export default messagesSlice.reducer;
