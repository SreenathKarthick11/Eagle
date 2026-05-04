import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { DialogHandle } from "../../components/customDialog";
import type { Visitor } from "../../interfaces";

import "../styles/admin/BlackList.css";

export const AdminBlackList = () => {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  const dialogRef = useRef<MdDialog>(null);
  const fetchErrorDialogRef = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
    fetchErrorDialogRef.current?.open("Error", msg);
  };

  // Fetch Blacklisted users
  useEffect(() => {
    const loadBlacklistedUsers = async () => {
      try {
        const res = await fetch("https://localhost:8000/api/blacklisted"); // TODO Replace with api rul
        const data: Visitor[] = await res.json();
        setVisitors(data);
      } catch {
        showError("Failed to load blacklisted events");
      }
    };

    loadBlacklistedUsers();
  }, []);

  // Whitelist a person
  const confirmWhiteList = async () => {
    if (!selectedVisitor) return;

    try {
      const res = await fetch("https://localhost:8000/api/whitelist", { // TODO Replace with api url
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedVisitor.user_id,
        }),
      });

      let data: { detail?: string } = {};
      data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to whitelist");
        return;
      }

      setVisitors((prev) =>
        prev.filter((v) => v.user_id !== selectedVisitor.user_id),
      );

      dialogRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

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

  const openConfirmDialog = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    dialogRef.current?.show();
  };

  return (
    <div className="panel">
      <h1>Blacklisted Users</h1>

      <md-list className="userlist">
        {visitors.map((visitor, index) => (
          <md-list-item key={index}>
            <div slot="headline">{visitor.username}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmDialog(visitor)}
            >
              <md-icon>remove</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRef}>
        <div slot="headline">
          Whitelist <b>{selectedVisitor?.username}?</b>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmWhiteList}>Yes</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
