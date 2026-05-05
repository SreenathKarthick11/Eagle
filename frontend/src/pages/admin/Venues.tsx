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
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { VenueItem, LocationItem, UserInfoItem } from "../../interfaces";

import "../styles/admin/Venue.css";
import type { MdFilledSelect } from "@material/web/select/filled-select";

export const AdminVenue = () => {
  const [selectedVenue, setSelectedVenue] = useState<VenueItem | null>(null);
  const [venueList, setVenueList] = useState<VenueItem[]>([]);
  const [newVenue, setNewVenue] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(
    null,
  );
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
    const loadVenues = async () => {
      try {
        const res = await fetch(`http://localhost:8000/venues`);
        const data: VenueItem[] = await res.json();
        setVenueList(data);
      } catch {
        showError("Server Error");
      }
    };

    loadVenues();
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

  const openConfirmAddDialog = (venue: string) => {
    if (venue === "") return;
    if (!selectedLocation) {
      showError("Please select a location");
      return;
    }
    setNewVenue(venue);
    dialogAddRef.current?.show();
  };

  const confirmAdd = async () => {
    if (!selectedLocation) {
      return;
    }

    try {
      const user: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const url = `http://localhost:8000/venues`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_name: newVenue,
          capacity: Number(capacity),
          location_id: Number(selectedLocation.location_id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to add venue");
        return;
      }

      setNewVenue("");
      setCapacity("");
      console.log("Added venue:", selectedVenue);
      dialogAddRef.current?.close();
    } catch {
      showError("server Error");
    }
  }; // TODO reload after adding venue

  const openConfirmRemoveDialog = (venue: VenueItem) => {
    setSelectedVenue(venue);
    dialogRemoveRef.current?.show();
  };

  const confirmRemove = async () => {
    if (!selectedVenue) return;

    try {
      const user: UserInfoItem = JSON.parse(
        localStorage.getItem("user") || "{}",
      );
      const url = `http://localhost:8000/venues?venue_id=${selectedVenue.venue_id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to delete venue");
        return;
      }

      setVenueList((prev) =>
        prev.filter((v) => v.venue_id !== selectedVenue?.venue_id),
      );

      console.log("Removed venue:", selectedVenue);
      dialogRemoveRef.current?.close();
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="venue_panel">
      <h1>Add Venue</h1>

      <md-filled-text-field
        label="Name"
        value={newVenue}
        onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
          const target = e.target as MdOutlinedTextField;
          setNewVenue(target.value);
        }}
      />

      <md-filled-select
        label="Select a location"
        value={String(selectedLocation?.location_id || "")}
        onInput={(e: React.InputEvent<MdFilledSelect>) => {
          const target = e.target as MdFilledSelect;
          const campus = locationList.find(
            (v) => String(v.location_id) === target.value,
          );
          setSelectedLocation(campus || null);
        }}
      >
        {locationList.map((location) => (
          <md-select-option
            key={location.location_id}
            value={String(location.location_id)}
          >
            <div slot="headline">{location.location_name}</div>
          </md-select-option>
        ))}
      </md-filled-select>

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

      <md-filled-button onClick={() => openConfirmAddDialog(newVenue)}>
        Add
      </md-filled-button>

      <h1>Remove Venue</h1>

      <md-list className="venue_list">
        {venueList.map((venue, index) => (
          <md-list-item key={index}>
            <div slot="headline">{venue.venue_name}</div>
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
          Remove venue <b>{selectedVenue?.venue_name}?</b>
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
          Add venue <b>{newVenue}?</b>
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
