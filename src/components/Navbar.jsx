import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { logoutUser } from "../api/authApi";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync } from "../store/slices/authSlice";

const Navbar = () => {
  //   const { user, setUser } = useAuth();
  //   const navigate = useNavigate();

  // const handleLogout = async () => {
  //   await logoutUser();
  //   setUser(null);
  //   navigate("/login");
  // };
  //   const { user, logout } = useAuth();
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  //   const handleLogout = async () => {
  //     await logout();
  //     navigate("/login");
  //   };

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* <Link to="/" className="text-xl font-bold text-blue-600"> */}

        <Link
          to="/dashboard"
          className="text-2xl font-bold text-blue-600"
        >
          Pixora
        </Link>

        {/* {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="text-gray-700">
              Login
            </Link>
            <Link to="/signup" className="text-blue-600 font-medium">
              Signup
            </Link>
          </div> */}
        {/* )} */}
        {/* Right Side */}
        <div className="flex items-center gap-6">

          {user && (
            <>
              {/* Create Asset Button */}
              <Link
                to="/create-asset"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Create Asset
              </Link>
              <Link
                to="/my-assets"
                className="text-gray-700 hover:text-blue-600"
              >
                My Assets
              </Link>
              <Link
                to="/chat"
                className="text-gray-700 hover:text-blue-600"
              >
                Chat
              </Link>

              {/* Tokens & Buy Tokens */}
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <span className="text-blue-800 font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  {user.tokenBalance ?? 0}
                </span>
                <Link
                  to="/buy-tokens"
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition font-medium"
                >
                  Buy +
                </Link>
              </div>

              {/* Username */}
              <span className="text-gray-600 text-sm">
                {user.name}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="text-gray-700">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Signup
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
};
export default Navbar;