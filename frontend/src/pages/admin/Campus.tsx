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

import "../styles/admin/Campus.css";

export const AdminCampus = () => {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [campus, setCampus] = useState<string>("");

  const dialogAddRef = useRef<MdDialog>(null);
  const dialogRemoveRef = useRef<MdDialog>(null);

  const campuses = ["Nila", "Sahyadri", "Ahalia"];

  useEffect(() => {
    const dialog = dialogAddRef.current;
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

  const openConfirmAddDialog = (campus: string) => {
    setSelectedCampus(campus);
    dialogAddRef.current?.show();
  };

  const confirmAdd = () => {
    console.log("Added campus:", selectedCampus);
    dialogAddRef.current?.close();
  };

  const openConfirmRemoveDialog = (campus: string) => {
    setSelectedCampus(campus);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = () => {
    console.log("Removed campus:", selectedCampus);
    dialogRemoveRef.current?.close();
  };

  return (
    <div className="campus_panel">
      <h1>Add Campus</h1>

      <md-filled-text-field
        label="Name"
        value={campus}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setCampus(target.value);
        }}
      />

      <md-filled-button onClick={() => openConfirmAddDialog(campus)}>
        Add
      </md-filled-button>

      <h1>Remove Campus</h1>

      <md-list className="campus_list">
        {campuses.map((campus, index) => (
          <md-list-item key={index}>
            <div slot="headline">{campus}</div>
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
          Remove campus <b>{selectedCampus}?</b>
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
          Add campus <b>{campus}?</b>
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
