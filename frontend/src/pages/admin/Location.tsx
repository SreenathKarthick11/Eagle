import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/select/filled-select";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { CampusItem, LocationItem, UserInfoItem } from "../../interfaces";
import type { DialogHandle } from "../../components/customDialog";

import "../styles/admin/Location.css";
import type { MdFilledSelect } from "@material/web/select/filled-select";

export const AdminLocation = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(
    null,
  );
  const [newLocation, setNewLocation] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [campusList, setCampusList] = useState<CampusItem[]>([]);
  const [selectedCampus, SetSelectedCapus] = useState<CampusItem | null>(null);
  const [locationList, setLocationList] = useState<LocationItem[]>([]);

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
    const loadLocations = async () => {
      try {
        const res = await fetch(`http://localhost:8000/locations`);
        const data: LocationItem[] = await res.json();
        setLocationList(data);
      } catch {
        showError("Server Error");
      }
    };

    loadLocations();
  }, []);

  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const res = await fetch(`http://localhost:8000/campuses`);
        const data: CampusItem[] = await res.json();
        setCampusList(data);
      } catch {
        showError("Server Error");
      }
    };

    loadCampuses();
  }, []);

  const openConfirmAddDialog = (location: string) => {
    if (location === "") return;
    if (!selectedCampus) {
      showError("Please select a campus.");
      return;
    }
    setNewLocation(location);
    dialogAddRef.current?.show();
  };

  const confirmAdd = async () => {
    if (!selectedCampus) {
      return;
    }

    try {
      const user: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const url = `http://localhost:8000/locations?role=${user.role}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_name: newLocation,
          landmark: landmark,
          latitute: latitude,
          longitude: longitude,
          campus_id: selectedCampus.campus_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to add location");
        return;
      }

      setNewLocation("");
      setLandmark("");
      setLatitude("");
      setLongitude("");
      console.log("Added location:", selectedLocation);
      dialogAddRef.current?.close();
    } catch {
      showError("Server Error");
    }
  }; // TODO reload after adding a location

  const openConfirmRemoveDialog = (location: LocationItem) => {
    setSelectedLocation(location);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = async () => {
    if (!selectedLocation) return;

    try {
      const user: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const url = `http://localhost:8000/locations?location_id=${selectedLocation.location_id}&role=${user.role}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to delete location");
        return;
      }

      setLocationList((prev) =>
        prev.filter((v) => v.location_id !== selectedLocation?.location_id),
      );

      console.log("Removed location:", selectedLocation?.location_name);
      dialogRemoveRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="location_panel">
      <h1>Add Location</h1>

      <md-filled-text-field
        label="Name"
        value={newLocation}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setNewLocation(target.value);
        }}
      />

      <md-filled-select
        label="Select a campus"
        value={String(selectedCampus?.campus_id || "")}
        onInput={(e: React.InputEvent<MdFilledSelect>) => {
          const target = e.target as MdFilledSelect;
          const campus = campusList.find(
            (v) => String(v.campus_id) === target.value,
          );
          SetSelectedCapus(campus || null);
        }}
      >
        {campusList.map((campus) => (
          <md-select-option
            key={campus.campus_id}
            value={String(campus.campus_id)}
          >
            <div slot="headline">{campus.campus_name}</div>
          </md-select-option>
        ))}
      </md-filled-select>

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

      <md-filled-button onClick={() => openConfirmAddDialog(newLocation)}>
        Add
      </md-filled-button>

      <h1>Remove Location</h1>

      <md-list className="location_list">
        {locationList.map((location, index) => (
          <md-list-item key={index}>
            <div slot="headline">{location.location_name}</div>
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
          Remove location <b>{selectedLocation?.location_name}?</b>
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
          Add location <b>{newLocation}?</b>
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
