import { useEffect, useRef, useState } from "react";
import "./styles/Profile.css";

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/dialog/dialog.js';

import { MdDialog } from "@material/web/dialog/dialog.js";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

export const Profile = () => {
  const dialogSaveChangesRef = useRef<MdDialog>(null);
  const dialogChangePassRef = useRef<MdDialog>(null);

  const [userData, setUserData] = useState({
    name: "Sreenath",
    username: "sreenath_admin",
    email: "admin@example.com",
    phone: "1234567890",
  });

  const handleSave = () => {
    console.log("Changes saved.");
    dialogSaveChangesRef.current?.show();
  };

  const handlePasswordChange = () => {
    console.log("Password changed.");
    dialogChangePassRef.current?.close();
    dialogSaveChangesRef.current?.show();
  }

  const handlePasswordCancel = () => {
    console.log("Password change cancelled.");
    dialogChangePassRef.current?.close();
  }

  const handlePasswordChangeOpen = () => {
    dialogChangePassRef.current?.show();
  }

  useEffect(() => {
    const dialogSaveChanges = dialogSaveChangesRef.current;
    const dialogChangePass  = dialogChangePassRef.current;
    if (!dialogSaveChanges) return;
    if (!dialogChangePass) return;
  }, []);

  return (
    <div className="ProfilePage">
      <div className="content profile-page">
        <h2 className="page-header">User Profile</h2>

        <div className="profile-form">
          <md-outlined-text-field
            label="Name"
            value={userData.name}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
              const target = e.target as MdOutlinedTextField;
              setUserData({ ...userData, name: target.value });
            }}
          />

          <md-outlined-text-field
            label="Username"
            value={userData.username}
            readOnly
            disabled
          />

          <md-outlined-text-field
            label="Email"
            value={userData.email}
            readOnly
            disabled
          />

          <md-outlined-text-field
            label="Phone"
            type="number"
            value={userData.phone}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
              const target = e.target as MdOutlinedTextField;
              setUserData({ ...userData, phone: target.value });
            }}
          />

          <div className="profile-footer">
            <md-outlined-button onClick={handlePasswordChangeOpen}> Change Password</md-outlined-button>

            <md-filled-button onClick={handleSave}>Save Changes</md-filled-button>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD DIALOG */}
      <md-dialog ref={dialogChangePassRef}>
        <div slot="headline">Change Password</div>
        <form slot="content" id="pw-form" className="dialog-form">
          <md-outlined-text-field label="Current Password" type="password" />
          <md-outlined-text-field label="New Password" type="password" />
          <md-outlined-text-field label="Confirm New Password" type="password" />
        </form>
        <div slot="actions">
          <md-text-button onClick={handlePasswordCancel}>Cancel</md-text-button>
          <md-filled-button onClick={handlePasswordChange}>Update</md-filled-button>
        </div>
      </md-dialog>

      {/* SUCCESS DIALOG */}
      <md-dialog ref={dialogSaveChangesRef}>
        <div slot="headline">Successfully updated!</div>
        <div slot="actions">
          <md-text-button onClick={() => dialogSaveChangesRef.current?.close()}>Ok</md-text-button>
        </div>
      </md-dialog>
    </div>
  );
};