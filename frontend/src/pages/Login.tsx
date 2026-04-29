import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";

import "./styles/Login.css";

export const Login = () => {
  const usernameRef = useRef<MdOutlinedTextField>(null);
  const passwordRef = useRef<MdOutlinedTextField>(null);

  const navigate = useNavigate();

  const handleLogin = () => {
    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (!username || !password) {
      alert("Please fill in all fields");
      return;
    }

    console.log(username, password);
    navigate("/");
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
    </div>
  );
};
