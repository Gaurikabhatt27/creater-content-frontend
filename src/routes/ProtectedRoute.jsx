import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  // const { user, loading } = useAuth();
  const { user, loading } = useSelector(state => state.auth);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;