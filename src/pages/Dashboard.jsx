// import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicAssetsAsync } from "../store/slices/assetSlice";
import { useNavigate } from "react-router-dom";
import { createConversation } from "../api/chatApi";
import Layout from "../components/Layout";

const Dashboard = () => {

  // const { user } = useAuth();
  // const [assets, setAssets] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { publicAssets: assets, loading, error } = useSelector(state => state.assets);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // fetchAssets();
    dispatch(fetchPublicAssetsAsync({ page: 1 }));
  }, [dispatch]);

  // const fetchAssets = async () => {
  //   const data = await getPublicAssets({ page: 1 });
  //   setAssets(data.assets);
  // };

  const handleMessage = async (ownerId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user._id === ownerId) return; 

    try {
      const data = {
        senderId: user._id,
        receiverId: ownerId
      };
      const res = await createConversation(data);
      navigate('/chat', { state: { conversationId: res.conversation._id } });

    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">
        Explore Public Assets
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div
            key={asset._id}
            className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
          >
            {asset.type === "image" ? (
              <img
                src={asset.url}
                alt={asset.title}
                className="h-48 w-full object-cover"
              />
            ) : (
              <video
                src={asset.url}
                className="h-48 w-full object-cover"
                controls
              />
            )}

            <div className="p-4">
              <h3 className="font-semibold text-lg">
                {asset.title}
              </h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  By {asset.owner.name}
                </p>

                {user && user._id !== asset.owner._id && (
                  <button
                    onClick={() => handleMessage(asset.owner._id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    Message
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Dashboard;