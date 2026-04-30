import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";

import "../styles/admin/User.css";

export const AdminUser = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const dialogRef = useRef<MdDialog>(null);

  const users = [
    "Alan Turing",
    "Ada Lovelace",
    "Grace Hopper",
    "Donald Knuth",
    "John von Neumann",
    "Claude Shannon",
    "Ken Thompson",
    "Dennis Ritchie",
    "Barbara Liskov",
  ];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleOpened = () => console.log("Dialog animation finished: Open");
    const handleClosed = () => {
      console.log("Dialog animation finished: Closed");
    };

    dialog.addEventListener("opened", handleOpened);
    dialog.addEventListener("closed", handleClosed);

    return () => {
      dialog.removeEventListener("opened", handleOpened);
      dialog.removeEventListener("closed", handleClosed);
    };
  }, []);

  const openConfirmDialog = (visitor: string) => {
    setSelectedUser(visitor);
    dialogRef.current?.show();
  };

  const confirmBlacklist = () => {
    console.log("Promoted to admin: ", selectedUser);
    dialogRef.current?.close();
  };

  return (
    <div className="user_panel">
      <h1>Users</h1>

      <md-list className="user_list">
        {users.map((user, index) => (
          <md-list-item key={index}>
            <div slot="headline">{user}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmDialog(user)}
            >
              <md-icon>keyboard_double_arrow_up</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRef}>
        <div slot="headline">
          Promote <b>{selectedUser}</b> to admin?
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmBlacklist}>Yes</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
