import { useState } from "react";
import { Navbar } from "../components/navbar";
import "./styles/Profile.css";

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/dialog/dialog.js';

export const Profile = () => {
  const [userData, setUserData] = useState({
    name: "Sreenath",
    username: "sreenath_admin",
    email: "admin@example.com",
    phone: "1234567890",
  });

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleSave = () => {
    // Logic for updating profile
    setIsSuccessOpen(true);
  };

  const handlePasswordChange = () => {
    // Logic for changing password
    setIsPasswordOpen(false);
    setIsSuccessOpen(true);
  }

  return (
    <div className="ProfilePage">
      <Navbar />
      
      <div className="content profile-page">
        <h2 className="page-header">User Profile</h2>
        
        <div className="profile-form">
          {/* @ts-ignore */}
          <md-outlined-text-field
            label="Name"
            value={userData.name}
            onInput={(e) => setUserData({...userData, name: e.target.value})}
          />

          {/* @ts-ignore */}
          <md-outlined-text-field
            label="Username"
            value={userData.username}
            readOnly
            disabled
          />

          {/* @ts-ignore */}
          <md-outlined-text-field
            label="Email"
            value={userData.email}
            readOnly
            disabled
          />

          {/* @ts-ignore */}
          <md-outlined-text-field
            label="Phone"
            value={userData.phone}
            onInput={(e) => setUserData({...userData, phone: e.target.value})}
          />

          <div className="profile-footer">
            {/* @ts-ignore */}
            <md-outlined-button onClick={() => setIsPasswordOpen(true)}> Change Password</md-outlined-button>
            
            {/* @ts-ignore */}
            <md-filled-button onClick={handleSave}>Save Changes</md-filled-button>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD DIALOG */}
      {/* @ts-ignore */}
      <md-dialog 
        open={isPasswordOpen} 
        onClosed={() => setIsPasswordOpen(false)}>
        <div slot="headline">Change Password</div>
        <form slot="content" id="pw-form" className="dialog-form">
          {/* @ts-ignore */}
          <md-outlined-text-field label="Current Password" type="password" />
          {/* @ts-ignore */}
          <md-outlined-text-field label="New Password" type="password" />
          {/* @ts-ignore */}
          <md-outlined-text-field label="Confirm New Password" type="password" />
        </form>
        <div slot="actions">
          {/* @ts-ignore */}
          <md-text-button onClick={() => setIsPasswordOpen(false)}>Cancel</md-text-button>
          {/* @ts-ignore */}
          <md-filled-button onClick={handlePasswordChange}>Update</md-filled-button>
        </div>
      {/* @ts-ignore */}
      </md-dialog>

      {/* SUCCESS DIALOG */}
      {/* @ts-ignore */}
      <md-dialog 
        open={isSuccessOpen} 
        onClosed={() => setIsSuccessOpen(false)}>
        <div slot="headline">Success</div>
        <div slot="content">Your profile has been updated successfully.</div>
        <div slot="actions">
          {/* @ts-ignore */}
          <md-text-button onClick={() => setIsSuccessOpen(false)}>Close</md-text-button>
        </div>
        {/*@ts-ignore*/}
      </md-dialog>
    </div>
  );
};