import { createSlice } from "@reduxjs/toolkit";
import Connections from "../../pages/Connections";

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: []
}

const connectionsSlice = createSlice({
    name: "connections",
    initialState,
    reducers: {
        
    },
});

export default connectionsSlice.reducer;
