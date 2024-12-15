import React, { useState } from "react";
import "../styles/LoginPage.css";

const SignUpModal = ({ onClose }) => {  // Add this function declaration
    const [signupCredentials, setSignupCredentials] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSignUp = async (event) => {
        event.preventDefault();
        
        try {
            const response = await fetch("http://localhost:8080/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(signupCredentials),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Sign up successful!");
                onClose();
            } else {
                alert(data.message || "Sign up failed! Please try again.");
            }
        } catch (err) {
            console.error("Error signing up:", err);
            alert("An error occurred. Please try again later.");
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSignupCredentials((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Sign Up</h2>
                <form className="signup-form" onSubmit={handleSignUp}>
                    <div className="form-group">
                        <label htmlFor="signup-username">Username:</label>
                        <input
                            type="text"
                            id="signup-username"
                            name="username"
                            value={signupCredentials.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="signup-email">Email:</label>
                        <input
                            type="email"
                            id="signup-email"
                            name="email"
                            value={signupCredentials.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="signup-password">Password:</label>
                        <input
                            type="password"
                            id="signup-password"
                            name="password"
                            value={signupCredentials.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirm-password"
                            name="confirmPassword"
                            value={signupCredentials.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>
                    <button type="submit">Sign Up</button>
                    <button type="button" className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUpModal;