import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { CampusItem, UserInfoItem } from "../../interfaces";
import type { DialogHandle } from "../../components/customDialog";

import "../styles/admin/Campus.css";

export const AdminCampus = () => {
  const [selectedCampus, setSelectedCampus] = useState<CampusItem | null>(null);
  const [campusList, setCampusList] = useState<CampusItem[]>([]);
  const [newCampus, setNewCampus] = useState<string>("");

  const dialogAddRef = useRef<MdDialog>(null);
  const dialogRemoveRef = useRef<MdDialog>(null);
  const fetchErrorDialogReg = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
    fetchErrorDialogReg.current?.open("Error", msg);
  };

  useEffect(() => {
    const dialog = dialogAddRef.current;
    if (!dialog) return;
  }, []);

  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const res = await fetch("http://localhost:8000/campuses/");
        const data: CampusItem[] = await res.json();
        console.log(data);
        setCampusList(data);
      } catch {
        showError("Server Error");
      }
    };
    loadCampuses();
  }, []);

  const openConfirmAddDialog = (campus: string) => {
    if (campus === "") return;
    setNewCampus(campus);
    dialogAddRef.current?.show();
  };

  const confirmAdd = async () => {
    try {
      const role: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const url = `http://localhost:8000/campuses?role=${role}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campus_name: newCampus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to create campus");
        return;
      }

      console.log("Added campus:", newCampus);
      dialogAddRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

  const openConfirmRemoveDialog = (campus: CampusItem) => {
    setSelectedCampus(campus);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = async () => {
    if (!selectedCampus) return;

    try {
      const res = await fetch("http://localhost:8000/api/delete_campus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campus_id: selectedCampus.campus_id,
        }),
      });

      let data: { detail?: string } = {};
      data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to add campus");
        return;
      }

      setCampusList((prev) =>
        prev.filter((v) => v.campus_id !== selectedCampus.campus_id),
      );

      console.log("Removed campus:", selectedCampus?.campus_name);
      dialogRemoveRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="campus_panel">
      <h1>Add Campus</h1>

      <md-filled-text-field
        label="Name"
        value={newCampus}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setNewCampus(target.value);
        }}
      />

      <md-filled-button onClick={() => openConfirmAddDialog(newCampus)}>
        Add
      </md-filled-button>

      <h1>Remove Campus</h1>

      <md-list className="campus_list">
        {campusList.map((campus, index) => (
          <md-list-item key={index}>
            <div slot="headline">{campus.campus_name}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmRemoveDialog(campus)}
            >
              <md-icon>remove</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRemoveRef}>
        <div slot="headline">
          Remove campus <b>{selectedCampus?.campus_name}?</b>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRemoveRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmRemove}>Yes</md-filled-button>
        </div>
      </md-dialog>

      <md-dialog ref={dialogAddRef}>
        <div slot="headline">
          Add campus <b>{newCampus}?</b>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogAddRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmAdd}>Yes</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
