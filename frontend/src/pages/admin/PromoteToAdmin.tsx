import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { Visitor } from "../../interfaces";
import type { DialogHandle } from "../../components/customDialog";

import "../styles/admin/User.css";

export const AdminPromoteToAdmin = () => {
  const [selectedOrganiser, setSelectedOrganiser] = useState<Visitor | null>(null);
  const [organiserList, setOrganiserList] = useState<Visitor[]>([]);

  const dialogRef = useRef<MdDialog>(null);
  const fetchErrorDialogRef = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
    fetchErrorDialogRef.current?.open("Error", msg);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
  }, []);

  // Fetch organiser  list
  useEffect(() => {
    const loadOrganiserList = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/get_organisers`); // TODO Replace with api url
        const data: Visitor[] = await res.json();
        setOrganiserList(data);
      } catch {
        showError("Failed to load organiser list");
      }
    };

    loadOrganiserList();
  }, []);

  const openConfirmDialog = (organiser: Visitor) => {
    setSelectedOrganiser(organiser);
    dialogRef.current?.show();
  };

  const confirmPromoteOrganiser = async () => {
    if (!selectedOrganiser) return;

    try {
      const res = await fetch(`http://localhost:8000/api/promote_to_admin`, {
        // TODO Replace with api url
        method: "POST", // TODO Replace with actual method
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedOrganiser.user_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to promote organiser");
        return;
      }

      setOrganiserList((prev) =>
        prev.filter((v) => v.user_id !== selectedOrganiser.user_id),
      );

      console.log("Promoted to admin: ", selectedOrganiser);
      dialogRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="user_panel">
      <h1>Promote to Admin</h1>

      <md-list className="user_list">
        {organiserList.map((organiser, index) => (
          <md-list-item key={index}>
            <div slot="headline">{organiser.username}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmDialog(organiser)}
            >
              <md-icon>keyboard_double_arrow_up</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRef}>
        <div slot="headline">
          Promote <b>{selectedOrganiser?.username}</b> to admin?
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmPromoteOrganiser}>
            Yes
          </md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
