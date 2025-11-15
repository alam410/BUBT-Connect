import {configureStore} from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import messagesReducer from "../features/messages/messagesSlice";
import connectionsReducer from "../features/connections/connectionsSlice";
import usersReducer from '../features/users/usersSlice'; // <-- 1. IMPORT IT


export const store = configureStore({
    reducer: {
        user: userReducer,
        users: usersReducer, 
        messages: messagesReducer,
        connections: connectionsReducer
    }
});


export default store;
