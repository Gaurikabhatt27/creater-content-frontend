import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPublicAssets, getMyAssets } from '../../api/assetApi';

export const fetchPublicAssetsAsync = createAsyncThunk('assets/fetchPublicAssets', async (params, { rejectWithValue }) => {
    try {
        const data = await getPublicAssets(params || { page: 1 });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch public assets');
    }
});

export const fetchMyAssetsAsync = createAsyncThunk('assets/fetchMyAssets', async (params, { rejectWithValue }) => {
    try {
        const data = await getMyAssets(params || { page: 1 });
        return data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch my assets');
    }
});

const assetSlice = createSlice({
    name: 'assets',
    initialState: {
        publicAssets: [],
        myAssets: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        // Public Assets
        builder.addCase(fetchPublicAssetsAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPublicAssetsAsync.fulfilled, (state, action) => {
            state.loading = false;
            state.publicAssets = action.payload.assets || action.payload; // accommodate backend response shape
        });
        builder.addCase(fetchPublicAssetsAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // My Assets
        builder.addCase(fetchMyAssetsAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchMyAssetsAsync.fulfilled, (state, action) => {
            state.loading = false;
            state.myAssets = action.payload.assets || action.payload;
        });
        builder.addCase(fetchMyAssetsAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    }
});

export default assetSlice.reducer;
