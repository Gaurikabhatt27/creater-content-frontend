import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import assetReducer from './slices/assetSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        assets: assetReducer,
    },
});

export default store;
