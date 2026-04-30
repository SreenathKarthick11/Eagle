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

import "../styles/admin/Venue.css";

export const AdminVenue = () => {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [venue, setVenue] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");

  const dialogAddRef = useRef<MdDialog>(null);
  const dialogRemoveRef = useRef<MdDialog>(null);

  const venues = ["A01-109", "A01-002", "A01-201"];

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

  const openConfirmAddDialog = (venue: string) => {
    setSelectedVenue(venue);
    dialogAddRef.current?.show();
  };

  const confirmAdd = () => {
    console.log("Added venue:", selectedVenue);
    dialogAddRef.current?.close();
  };

  const openConfirmRemoveDialog = (venue: string) => {
    setSelectedVenue(venue);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = () => {
    console.log("Removed venue:", selectedVenue);
    dialogRemoveRef.current?.close();
  };

  return (
    <div className="venue_panel">
      <h1>Add Venue</h1>

      <md-filled-text-field
        label="Name"
        value={venue}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setVenue(target.value);
        }}
      />

      <md-filled-text-field
        label="Capacity"
        type="number"
        step="1"
        value={capacity}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setCapacity(target.value);
        }}
      >
        <md-icon slot="leading-icon">groups</md-icon>
      </md-filled-text-field>

      <md-filled-button onClick={() => openConfirmAddDialog(venue)}>
        Add
      </md-filled-button>

      <h1>Remove Venue</h1>

      <md-list className="venue_list">
        {venues.map((venue, index) => (
          <md-list-item key={index}>
            <div slot="headline">{venue}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmRemoveDialog(venue)}
            >
              <md-icon>remove</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRemoveRef}>
        <div slot="headline">
          Remove venue <b>{selectedVenue}?</b>
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
          Add venue <b>{venue}?</b>
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
