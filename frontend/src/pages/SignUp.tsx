import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { hashText } from "./hash";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";

import "./styles/SignUp.css";
import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";

export const SignUp = () => {
  const dialogRef = useRef<DialogHandle>(null);

  const nameRef = useRef<any>(null);
  const usernameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);

  const navigate = useNavigate();

  const showError = (msg: string) => {
    dialogRef.current?.open("Sign Up Failed", msg);
  };

  const handleSignUp = async () => {
    const name = nameRef.current?.value;
    const username = usernameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;
    const phone = phoneRef.current?.value;

    if (!name || !username || !email || !password || !confirmPassword || !phone) {
      showError("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    const hashed_password = await hashText(password);

    try {
      const response = await fetch("http://localhost:8000/signup", { //TODO: update the backend URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          username: username,
          email_id: email,
          password: hashed_password,
          phone_no: phone,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        showError(data.detail || data.message || "Signup failed");
        return;
      }


      dialogRef.current?.open("Success", "Account created successfully!");

      // redirect after short delay
      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      showError("Unable to connect to server");
    }
  };

  return (
    <div className="login-container">
      <div className="signup-card">
        <h2 className="login-title">Sign Up</h2>

        <md-outlined-text-field ref={nameRef} label="Name" className="login-input" />
        <md-outlined-text-field ref={usernameRef} label="Username" className="login-input" />
        <md-outlined-text-field ref={emailRef} label="Email" type="email" className="login-input" />
        <md-outlined-text-field ref={passwordRef} label="Password" type="password" className="login-input" />
        <md-outlined-text-field ref={confirmPasswordRef} label="Confirm Password" type="password" className="login-input" />
        <md-outlined-text-field ref={phoneRef} label="Phone" type="tel" className="login-input" />

        <div className="btn-container">
          <md-filled-button class="button" onClick={() => navigate("/login")}>
            Login
          </md-filled-button>

          <md-filled-button class="button" onClick={handleSignUp}>
            Sign Up
          </md-filled-button>
        </div>
      </div>

      <CustomDialog ref={dialogRef} />
    </div>
  );
};