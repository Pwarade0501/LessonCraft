"use client";

import React, { useState } from "react";
import { Mail, Lock, User, School } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AuthPage() {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [institution, setInstitution] = useState(""); // Optional field
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const validateForm = () => {
        // Full Name is only required for signup
        if (!isLoginView && !fullName) {
            toast.error("Please enter your full name.");
            return false;
        }
        if (!email || !password) {
            toast.error("Please fill in all required fields.");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        if (isLoginView) {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res.error) {
                toast.error(res.error || "Invalid login credentials.");
            } else {
                toast.success("Login successful!");
                router.push("/"); // Redirect to the main app/dashboard
            }
        } else {
            // Handle Sign Up
            try {
                const res = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: fullName,
                        email,
                        password,
                        institution, // Sending optional field
                    }),
                });

                const responseText = await res.text();
                let data = {};
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch {
                    throw new Error(`Signup service returned an invalid response (HTTP ${res.status}).`);
                }
                if (res.ok) {
                    toast.success("Account created! Please log in to continue.");
                    setIsLoginView(true);
                    // Clear form for login
                    setFullName("");
                    setInstitution("");
                    setPassword("");
                } else {
                    console.error("Signup API error:", {
                        status: res.status,
                        message: data.message,
                        detail: data.error,
                    });
                    toast.error(data.message || data.error || `Signup failed (HTTP ${res.status}).`);
                }
            } catch (error) {
                console.error("Signup request failed:", error);
                toast.error(error.message || "Signup failed. Please try again later.");
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-200 p-4">
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <div className="flex w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Panel: Branding & Visuals */}
                <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-600 text-white p-12 text-center">
                    <Image
                        src="/LessonCraftLogo.png" // Using the main logo for branding
                        alt="LessonCraft AI"
                        width={80}
                        height={80}
                        className="rounded-full mb-6 shadow-lg"
                    />
                    <h1 className="text-3xl font-bold leading-tight">
                        Empowering Educators, One Lesson at a Time
                    </h1>
                    <p className="mt-4 text-blue-100 max-w-sm">
                        Join a community of forward-thinking teachers using AI to create
                        engaging and effective learning experiences.
                    </p>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <h2 className="text-3xl font-bold text-gray-800">
                        {isLoginView ? "Teacher Login" : "Teacher Registration"}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {isLoginView
                            ? "Welcome back! Access your dashboard."
                            : "Create your free account to get started."}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {!isLoginView && (
                            <>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full text-gray-400 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="School or Institution (Optional)"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        className="w-full text-gray-400 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 border text-gray-400 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2  -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full text-gray-400 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4  py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading
                                ? "Processing..."
                                : isLoginView
                                    ? "Log In"
                                    : "Create Account"}
                        </button>
                    </form>

                    {/* Toggle View */}
                    <p className="mt-8 text-sm text-center text-gray-600">
                        {isLoginView
                            ? "Need an account?"
                            : "Already have an account?"}
                        <button
                            onClick={() => setIsLoginView(!isLoginView)}
                            className="ml-1 font-semibold text-blue-600 hover:underline"
                        >
                            {isLoginView ? "Sign Up" : "Log In"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
