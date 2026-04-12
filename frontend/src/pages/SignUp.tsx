import { useRef, useState } from "react";
import "./styles/SignUp.css";
import { useNavigate } from "react-router-dom";

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/dialog/dialog.js';

export const SignUp = () => {
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  // Proper typing for Material Web elements
  const nameRef = useRef<any>(null);
  const usernameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);

  const navigate = useNavigate();

  const handleSignUp = () => {
    const name = nameRef.current?.value;
    const username = usernameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;
    const phone = phoneRef.current?.value;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setOpen(true);
      return;
    }

    console.log(name, username, email, password, confirmPassword, phone);

    // TODO: API call here
    navigate("/login");
  };

  return (
    <div className="login-container">
      <div className="signup-card">
        <h2 className="login-title">Sign Up</h2>

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={nameRef}
          label="Name"
          type="text"
          className="login-input"
        />

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={usernameRef}
          label="Username"
          type="text"
          className="login-input"
        />

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={emailRef}
          label="Email"
          type="email"
          className="login-input"
        />

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={passwordRef}
          label="Password"
          type="password"
          className="login-input"
        />

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={confirmPasswordRef}
          label="Confirm Password"
          type="password"
          className="login-input"
        />

        {/* @ts-ignore */}
        <md-outlined-text-field
          ref={phoneRef}
          label="Phone"
          type="tel"
          className="login-input"
        />

        <div className="btn-container">
          {/* @ts-ignore */}
          <md-filled-button className="button" onClick={() => navigate("/login")}>Login</md-filled-button>
          {/* @ts-ignore */}
          <md-filled-button className="button" onClick={handleSignUp}>Sign Up</md-filled-button>
        </div>
      </div>

      {/* Dialog */}
      {/* @ts-ignore */}
      <md-dialog open={open} onClosed={() => setOpen(false)}>
        <div slot="headline">Error</div>
        <div slot="content">{error}</div>
        <div slot="actions">
          {/* @ts-ignore */}
          <md-filled-button onClick={() => setOpen(false)}>Close</md-filled-button>
        </div>
       {/* @ts-ignore */} 
      </md-dialog>
    </div>
  );
};