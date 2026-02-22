import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser, loginUser, logoutUser } from '../../api/authApi';

export const fetchUserAsync = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
    try {
        const data = await getCurrentUser();
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
});

export const loginAsync = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const data = await loginUser(credentials);
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});

export const logoutAsync = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await logoutUser();
        return null;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: true,
        actionLoading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch User
        builder.addCase(fetchUserAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUserAsync.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        });
        builder.addCase(fetchUserAsync.rejected, (state) => {
            state.loading = false;
            state.user = null;
        });

        // Login
        builder.addCase(loginAsync.pending, (state) => {
            state.actionLoading = true;
            state.error = null;
        });
        builder.addCase(loginAsync.fulfilled, (state, action) => {
            state.actionLoading = false;
            state.user = action.payload;
        });
        builder.addCase(loginAsync.rejected, (state, action) => {
            state.actionLoading = false;
            state.error = action.payload;
        });

        // Logout
        builder.addCase(logoutAsync.fulfilled, (state) => {
            state.user = null;
        });
    }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
