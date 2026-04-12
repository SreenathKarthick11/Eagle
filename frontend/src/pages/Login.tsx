import { useRef } from "react";
import "./styles/Login.css";

import { useNavigate } from "react-router-dom";
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';

export const Login = () => {
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const navigate = useNavigate();

  const handleLogin = () => {
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    console.log(email, password);
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>

        {/* @ts-ignore */}
        <md-outlined-text-field ref={emailRef} label="Email" type="email" class="login-input" ></md-outlined-text-field>

        {/* @ts-ignore */}
        <md-outlined-text-field ref={passwordRef} label="Password" type="password" class="login-input" ></md-outlined-text-field>

        <div className="btn-container">
          {/* @ts-ignore */}
          <md-filled-button class="button" onClick={handleLogin}> Login </md-filled-button>
          {/* @ts-ignore */}
          <md-filled-button class="button" onClick={()=> navigate("/signup") }> SignUp </md-filled-button>
        </div>
      </div>
    </div>
  );
};