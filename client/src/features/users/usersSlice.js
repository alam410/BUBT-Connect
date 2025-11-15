import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // Or your API client

/**
 * This "thunk" is an async action that fetches the list of all users
 * from your backend. It needs the auth token to work.
 */
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (token, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      // Use the discover endpoint with empty input to get all users
      const response = await axios.post('/api/user/discover', { input: '' }, config);
      return response.data.users || []; // Return array of users
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [], // This will hold the ARRAY of users
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  },
  reducers: {},
  // This handles the async 'fetchAllUsers' thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload; // Store the fetched ARRAY in state.users.list
      })
      .addCase(fetchAllUsers.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default usersSlice.reducer;