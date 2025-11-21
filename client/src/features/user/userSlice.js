import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ Backend base URL (change if needed)
axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.withCredentials = true;

/* ---------------- FETCH USER ---------------- */
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async ({ clerkUser, token }, { rejectWithValue }) => {
    if (!clerkUser || !clerkUser.id) {
      return rejectWithValue("User data is incomplete.");
    }

    const userData = {
      id: clerkUser.id,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      image_url: clerkUser.imageUrl,
      username: clerkUser.username,
      email_addresses: (clerkUser.emailAddresses || []).map((email) => ({
        id: email.id,
        email_address: email.emailAddress,
      })),
      primary_email_address_id: clerkUser.primaryEmailAddressId,
    };

    try {
      const response = await axios.post(
        "/api/user/get-or-create-user",
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // toast.success("User authenticated ✅");
        return response.data;
      } else {
        toast.error(response.data.message || "Authentication failed ❌");
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.error(
        "Error fetching user:",
        error.response?.data || error.message
      );
      toast.error("Error connecting to server ❌");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* ---------------- UPDATE USER ---------------- */
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ userData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put("/api/user/update-profile", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully 🎉");
        return response.data;
      } else {
        toast.error(response.data.message || "Failed to update user");
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.error(
        "Error updating user:",
        error.response?.data || error.message
      );
      toast.error("Update failed ❌");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  value: null,
  status: "idle",
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUserLocal: (state, action) => {
      state.value = { ...state.value, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.value = action.payload.user;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.status = "updating";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.value = action.payload.user || action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { updateUserLocal } = userSlice.actions;
export default userSlice.reducer;
