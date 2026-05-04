import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";

import "./styles/Login.css";
import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";

export const Login = () => {
  const usernameRef = useRef<MdOutlinedTextField>(null);
  const passwordRef = useRef<MdOutlinedTextField>(null);
  const dialogRef = useRef<DialogHandle>(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (!username || !password) {
      dialogRef.current?.open(
        "Login Failed",
        "Please enter both username and password."
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/signin", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        const userData = {
          ...data,
          username,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/");
      } else {
        dialogRef.current?.open(
          "Login Failed",
          data.detail || data.message || "Invalid credentials"
        );
      }

    } catch (error) {
      dialogRef.current?.open(
        "Server Error",
        "Unable to connect to server"
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-grid">
        <h2 className="login-title">Login</h2>

        <hr className="divider" />

        <md-outlined-text-field
          ref={usernameRef}
          label="Username"
          className="login-input"
        ></md-outlined-text-field>

        <md-outlined-text-field
          ref={passwordRef}
          label="Password"
          type="password"
          className="login-input"
        ></md-outlined-text-field>

        <div className="btn-group">

          <md-outlined-button onClick={() => navigate("/signup")}>
            Sign Up
          </md-outlined-button>
          <md-filled-button onClick={handleLogin}>Login</md-filled-button>
        </div>
      </div>
      <CustomDialog ref={dialogRef} />
    </div>
  );
};
