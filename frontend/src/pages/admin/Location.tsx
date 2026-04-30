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

import "../styles/admin/Location.css";

export const AdminLocation = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const dialogAddRef = useRef<MdDialog>(null);
  const dialogRemoveRef = useRef<MdDialog>(null);

  const locations = ["A01", "B03", "C06"];

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

  const openConfirmAddDialog = (location: string) => {
    setSelectedLocation(location);
    dialogAddRef.current?.show();
  };

  const confirmAdd = () => {
    console.log("Added location:", selectedLocation);
    dialogAddRef.current?.close();
  };

  const openConfirmRemoveDialog = (location: string) => {
    setSelectedLocation(location);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = () => {
    console.log("Removed location:", selectedLocation);
    dialogRemoveRef.current?.close();
  };

  return (
    <div className="location_panel">
      <h1>Add Location</h1>

      <md-filled-text-field
        label="Name"
        value={location}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setLocation(target.value);
        }}
      />

      <md-filled-text-field
        label="Landmark"
        value={landmark}
        type="textarea"
        rows="3"
        className="resizable"
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setLandmark(target.value);
        }}
      />

      <md-filled-text-field
        label="Latitude"
        type="number"
        step="0.0000001"
        value={latitude}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setLatitude(target.value);
        }}
      >
        <md-icon slot="leading-icon">north</md-icon>
      </md-filled-text-field>

      <md-filled-text-field
        label="Longitude"
        type="number"
        step="0.0000001"
        value={longitude}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setLongitude(target.value);
        }}
      >
        <md-icon slot="leading-icon">east</md-icon>
      </md-filled-text-field>

      <md-filled-button onClick={() => openConfirmAddDialog(location)}>
        Add
      </md-filled-button>

      <h1>Remove Location</h1>

      <md-list className="location_list">
        {locations.map((location, index) => (
          <md-list-item key={index}>
            <div slot="headline">{location}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmRemoveDialog(location)}
            >
              <md-icon>remove</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRemoveRef}>
        <div slot="headline">
          Remove location <b>{selectedLocation}?</b>
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
          Add location <b>{location}?</b>
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
