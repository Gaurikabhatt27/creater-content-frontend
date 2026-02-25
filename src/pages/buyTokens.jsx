import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUserAsync } from "../store/slices/authSlice";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";

const ButTokens = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Window size for confetti
    const [windowDimension, setWindowDimension] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const detectSize = () => {
            setWindowDimension({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener("resize", detectSize);
        return () => window.removeEventListener("resize", detectSize);
    }, []);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axiosInstance.get("/payment/plans");
            setPlans(response.data);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to fetch plans"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBuy = async (planId) => {
        try {
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                return;
            }

            const { data } = await axiosInstance.post("/payment/createOrder", {
                planId: planId,
            });

            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Content Creator Platform",
                description: "Purchase Tokens",
                order_id: data.orderId,
                handler: function (response) {
                    console.log("Razorpay handler triggered:", response);

                    // Immediately show the success popup to the user
                    setShowSuccess(true);

                    // Silently verify payment on the backend in the background
                    axiosInstance.post("/payment/verifyPayment", {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    })
                        .then(() => {
                            console.log("Payment verified successfully on backend.");
                            // Refresh the user tokens in the Redux store
                            dispatch(fetchUserAsync());
                        })
                        .catch((error) => {
                            console.error("Verification error:", error);
                            toast.error(
                                error.response?.data?.message || "Payment verification failed"
                            );
                        });
                },
                prefill: {
                    name: "User",
                    email: "user@example.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#4F46E5",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Payment initiation failed"
            );
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Purchase Tokens
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Get tokens to create assets and interact with AI models.
                </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div
                        key={plan._id}
                        className={`bg-white border rounded-2xl shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 duration-300 overflow-hidden flex flex-col relative ${plan.price === 199 ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        {/* Most Popular Badge */}
                        {plan.price === 199 && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider shadow-sm z-10">
                                Most Popular
                            </div>
                        )}

                        <div className="p-6 flex-grow">
                            <h3 className="text-2xl font-semibold text-gray-900 text-center uppercase tracking-wider">
                                {plan.name}
                            </h3>
                            <div className="mt-4 text-center">
                                <span className="text-5xl font-extrabold text-gray-900">
                                    ₹{plan.price}
                                </span>
                            </div>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-center">
                                    <svg
                                        className="flex-shrink-0 h-6 w-6 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="ml-3 text-base text-gray-700">
                                        {plan.tokens} Tokens included
                                    </span>
                                </li>
                                {plan.bonusTokens > 0 && (
                                    <li className="flex items-center">
                                        <svg
                                            className="flex-shrink-0 h-6 w-6 text-green-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span className="ml-3 text-base text-gray-700 font-medium">
                                            + {plan.bonusTokens} Bonus Tokens
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="p-6 bg-gray-50 border-t items-end">
                            <button
                                onClick={() => handleBuy(plan._id)}
                                className={`w-full border border-transparent rounded-lg py-3 px-4 text-center font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${plan.price === 199 ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-md' : 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-800'}`}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                ))}

                {plans.length === 0 && !loading && (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        No Active Plans Available.
                    </div>
                )}
            </div>

            {/* Indigo Success Modal & Confetti onClick Dismiss */}
            {showSuccess && (
                <>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity"
                        onClick={() => {
                            setShowSuccess(false);
                            navigate("/dashboard");
                        }}
                    >
                        {/* Confetti sits INSIDE the top z-index container so it bursts OVER the backdrop */}
                        <div className="absolute inset-0 pointer-events-none">
                            <Confetti
                                width={windowDimension.width}
                                height={windowDimension.height}
                                recycle={false}
                                numberOfPieces={600}
                                gravity={0.15}
                                colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500']}
                                style={{ zIndex: 9999 }}
                            />
                        </div>

                        <div
                            className="bg-white rounded-xl p-10 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all flex flex-col items-center text-center relative overflow-hidden z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Top Accent aligned with project Indigo */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800"></div>

                            {/* Icon aligned with project Indigo */}
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border-4 border-indigo-100 shadow-sm">
                                <svg
                                    className="w-12 h-12 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                            </div>

                            <h3 className="text-3xl font-serif text-gray-900 mb-3 tracking-wide">
                                Payment Received
                            </h3>

                            <div className="w-16 h-[2px] bg-indigo-600 mb-5"></div>

                            <p className="text-gray-600 mb-8 text-lg font-light leading-relaxed">
                                Tokens successfully added to your account.
                            </p>

                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    navigate("/dashboard");
                                }}
                                className="w-full bg-indigo-600 border border-transparent rounded-none py-3 px-4 text-center text-lg font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors uppercase tracking-widest shadow-md"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ButTokens;
