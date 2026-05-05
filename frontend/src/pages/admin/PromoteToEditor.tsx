import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { UserInfoItem, Visitor } from "../../interfaces";
import type { DialogHandle } from "../../components/customDialog";

import "../styles/admin/User.css";

export const VisitorPromoteToEditor = () => {
  const navigate = useNavigate();

  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [visitorList, setVisitorList] = useState<Visitor[]>([]);

  const dialogRef = useRef<MdDialog>(null);
  const fetchErrorDialogRef = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
    fetchErrorDialogRef.current?.open("Error", msg);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
  }, []);

  // Fetch visitors list
  useEffect(() => {
    const loadVisitorList = async () => {
      try {
        const user: UserInfoItem = JSON.parse(
          localStorage.getItem("user") || "{}",
        );
        const res = await fetch(`http://localhost:8000/visitors?role=${user.role}`); // TODO Replace with api url
        const data: Visitor[] = await res.json();
        setVisitorList(data);
      } catch {
        showError("Failed to load visitor list");
      }
    };

    loadVisitorList();
  }, []);

  const openConfirmDialog = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    dialogRef.current?.show();
  };

  const confirmPromoteVisitor = async () => {
    if (!selectedVisitor) return;

    try {
      const user: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const res = await fetch(`http://localhost:8000/promote_visitor_to_editor?user_id=${selectedVisitor.user_id}&role=${user.role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedVisitor.user_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to promote visitor");
        return;
      }

      setVisitorList((prev) =>
        prev.filter((v) => v.user_id !== selectedVisitor.user_id),
      );

      console.log("Promoted to editor: ", selectedVisitor);
      dialogRef.current?.close();
      navigate(0);
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="user_panel">
      <h1>Promote to Editor</h1>

      <md-list className="user_list">
        {visitorList.map((user, index) => (
          <md-list-item key={index}>
            <div slot="headline">{user.username}</div>
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
          Promote <b>{selectedVisitor?.username}</b> to editor?
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmPromoteVisitor}>
            Yes
          </md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
