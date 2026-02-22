import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import VerifyOtp from "./pages/Verifyotp";
import CreateAsset from "./pages/CreateAsset";
import MyAssets from "./pages/MyAsset";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-asset"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateAsset />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assets"
            element={
                <ProtectedRoute>
              <Layout>
                <MyAssets />
              </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;