import { useEffect, useRef, useState } from "react";
import "./styles/Profile.css";

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/dialog/dialog.js';

import { MdDialog } from "@material/web/dialog/dialog.js";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";

export const Profile = () => {
  const dialogSaveChangesRef = useRef<MdDialog>(null);
  const dialogChangePassRef = useRef<MdDialog>(null);
  const customDialogRef = useRef<DialogHandle>(null);

  const currentPassRef = useRef<MdOutlinedTextField>(null);
  const newPassRef = useRef<MdOutlinedTextField>(null);
  const confirmPassRef = useRef<MdOutlinedTextField>(null);


  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email_id: "",
    phone_no: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const user_id = storedUser.user_id;

        const res = await fetch(`http://localhost:8000/profile?user_id=${user_id}`); 
        let data: any = {};
        try {
          data = await res.json();
        } catch {}

        if (!res.ok) {
          showError(data.detail);
          return;
        }

        setUserData(data);

      } catch (err) {
        showError("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const showError = (msg: string) => {
    customDialogRef.current?.open("Error", msg);
  };

  const handleSave = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      const current = currentPassRef.current?.value;
      const newPass = newPassRef.current?.value;
      const confirm = confirmPassRef.current?.value;

      // password validation (only if user typed something)
      if (current || newPass || confirm) {
        if (!current || !newPass || !confirm) {
          showError("Fill all password fields");
          return;
        }

        if (newPass !== confirm) {
          showError("Passwords do not match");
          return;
        }
      }

      const res = await fetch("http://localhost:8000/profile/", { // TODO: update with actual url
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: storedUser.user_id,
          name: userData.name,
          phone: userData.phone_no,
          current_password: current || null,
          new_password: newPass || null,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        showError(data.detail || "Update failed");
        return;
      }

      dialogChangePassRef.current?.close();
      dialogSaveChangesRef.current?.show();

    } catch {
      showError("Server error");
    }
  };

  const handlePasswordChange = async () => {
    await handleSave();
    currentPassRef.current!.value = "";
    newPassRef.current!.value = "";
    confirmPassRef.current!.value = "";
  }

  const handlePasswordCancel = () => {
    currentPassRef.current!.value = "";
    newPassRef.current!.value = "";
    confirmPassRef.current!.value = "";
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
            value={userData.email_id}
            readOnly
            disabled
          />

          <md-outlined-text-field
            label="Phone"
            type="number"
            value={userData.phone_no}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
              const target = e.target as MdOutlinedTextField;
              setUserData({ ...userData, phone_no: target.value });
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
          <md-outlined-text-field ref={currentPassRef} label="Current Password" type="password" />
          <md-outlined-text-field ref={newPassRef} label="New Password" type="password" />
          <md-outlined-text-field ref={confirmPassRef} label="Confirm New Password" type="password" />
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

      <CustomDialog ref={customDialogRef} />
    </div>
  );
};