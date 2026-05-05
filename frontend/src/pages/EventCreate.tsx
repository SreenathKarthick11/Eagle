import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./styles/EventCreate.css";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/dialog/dialog.js";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { MdOutlinedSelect } from "@material/web/select/outlined-select.js";
import type { UserInfoItem, Visitor } from "../interfaces";
import type { DialogHandle } from "../components/customDialog";
import type { MdDialog } from "@material/web/dialog/dialog.js";

import { CustomDialog } from "../components/customDialog";

export const EventCreate = () => {
  const navigate = useNavigate();

  type VenueItem = { venue_id: number; venue_name: string };

  // ------------------ REFS ------------------
  const titleRef = useRef<MdOutlinedTextField>(null);
  const startRef = useRef<MdOutlinedTextField>(null);
  const endRef = useRef<MdOutlinedTextField>(null);
  const locationRef = useRef<MdOutlinedSelect>(null);
  const venueRef = useRef<MdOutlinedSelect>(null);
  const capacityRef = useRef<MdOutlinedTextField>(null);
  const tagsRef = useRef<MdOutlinedTextField>(null);
  const descRef = useRef<MdOutlinedTextField>(null);

  const customDialogRef = useRef<DialogHandle>(null);
  const dialogRef = useRef<MdDialog>(null);

  // ------------------ STATE ------------------
  const [organisers, setOrganisers] = useState<Visitor[]>([]);
  const [editors, setEditors] = useState<Visitor[]>([]);
  const [selectedOrganisers, setSelectedOrganisers] = useState<Visitor[]>([]);
  const [selectedEditors, setSelectedEditors] = useState<Visitor[]>([]);
  const [searchOrganizer, setSearchOrganizer] = useState("");
  const [searchEditor, setSearchEditor] = useState("");

  const [venues, setVenues] = useState<VenueItem[]>([]);

  const user: UserInfoItem = JSON.parse(localStorage.getItem("user") || "{}");

  const showError = (msg: string) => {
    customDialogRef.current?.open("Error", msg);
  };

  // ------------------ LOAD ORGANISERS ------------------
  useEffect(() => {
    const loadOrganisers = async () => {
      try {
        const res = await fetch(`http://localhost:8000/organizers?role=${user.role}`);
        const data: Visitor[] = await res.json();
        setOrganisers(data);
        // setOrganisers(data.map((o) => o.username));
      } catch {
        showError("Failed to load organisers");
      }
    };

    loadOrganisers();
  }, []);

  // load all venues initially
  useEffect(() => {
    // ------------------ LOAD VENUES ------------------
    const loadVenues = async (location?: string) => {
      try {
        const url = location
          ? `http://localhost:8000/venues?location_id=${location}&role=${user.role}`
          : `http://localhost:8000/venues?role=${user.role}`;

        const res = await fetch(url);
        const data = await res.json();

        setVenues(data);
      } catch {
        showError("Failed to load venues");
      }
    };

    loadVenues();
  }, []);

  useEffect(() => {
    const loadEditors = async () => {
      try {
        const res = await fetch(`http://localhost:8000/editors?role=${user.role}`);
        const data: Visitor[] = await res.json();
        setEditors(data);
      } catch {
        showError("Failed to load editors");
      }
    };

    loadEditors();
  }, []);

  // ------------------ TOGGLE ORGANISER ------------------
  const toggleOrganiser = (organiser: Visitor) => {
    setSelectedOrganisers((prev) =>
      prev.includes(organiser)
        ? prev.filter((o) => o !== organiser)
        : [...prev, organiser],
    );
  };
  const toggleEditor = (editor: Visitor) => {
    setSelectedEditors((prev) =>
      prev.includes(editor)
        ? prev.filter((e) => e !== editor)
        : [...prev, editor]
    );
  };

  const filteredOrganisers = organisers.filter((o) =>
    o.username.toLowerCase().includes(searchOrganizer.toLowerCase()),
  );

  const filteredEditors = editors.filter((e) =>
    e.username.toLowerCase().includes(searchEditor.toLowerCase())
  );

  const addEditor = async (editor_event_id: [Visitor, number]) => {
    const [editor, event_id] = editor_event_id;
    try {
      const res = await fetch(`http://localhost:8000/add_editor?user_id=${user.user_id}&editor_id=${editor.user_id}&event_id=${event_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to create event");
        return;
      }
    } catch {
      showError("Failed to add editor");
    }
  }

  // ------------------ CREATE EVENT ------------------
  const handleCreate = async () => {
    try {
      const title = titleRef.current?.value;
      const start_time = startRef.current?.value;
      const end_time = endRef.current?.value;
      const location = locationRef.current?.value;
      const venue = venueRef.current?.value;
      const capacity = parseInt(capacityRef.current?.value || "0");
      const tagsRaw = tagsRef.current?.value;
      const description = descRef.current?.value;

      if (!title || !start_time || !end_time) {
        showError("Please fill required fields");
        return;
      }

      if (start_time >= end_time) {
        showError("End time must be after start time");
        return;
      }

      const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [];

      const res = await fetch(`http://localhost:8000/event?role=${user.role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          name: title,
          start_time: start_time,
          finish_time: end_time,
          // location,
          venue_id: venue,
          secondary_organizer_ids: selectedOrganisers.map((o) => o.user_id),
          capacity: capacity,
          tags: tags,
          description: description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to create event");
        return;
      }
      
      selectedEditors.map((e) => addEditor([e, data.event_id]));

      dialogRef.current?.show();
    } catch (err) {
      showError("Server error" + err);
    }

  };

  // ------------------ UI ------------------
  return (
    <div>
      <div className="event-create-container">
        <h2 className="page-header">Create Event</h2>

        <div className="event-create-form">
          <md-outlined-text-field
            ref={titleRef}
            label="Event Title"
            class="input"
          />

          <md-outlined-text-field
            ref={startRef}
            label="Start Time"
            type="datetime-local"
            class="input"
          />

          <md-outlined-text-field
            ref={endRef}
            label="End Time"
            type="datetime-local"
            class="input"
          />

          {/* VENUE */}
          {/* VENUE */}
          <md-outlined-select ref={venueRef} label="Venue" class="input">
            {venues.map((v) => (
              <md-select-option key={v.venue_id} value={String(v.venue_id)}>
                <div slot="headline">{v.venue_name}</div>
              </md-select-option>
            ))}
          </md-outlined-select>

          {/* ORGANISERS */}
          <div className="multi-select">
            <label className="multi-label">Secondary Organisers</label>

            <md-outlined-text-field
              label="Search organisers"
              value={searchOrganizer}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
                setSearchOrganizer((e.target as MdOutlinedTextField).value)
              }
            />
            
            <div className="selected-chips">
              {selectedOrganisers.map((org, i) => (
                <span
                  key={i}
                  className="chip"
                  onClick={() => toggleOrganiser(org)}
                >
                  {org.username} ✕
                </span>
              ))}
            </div>

            <div className="checkbox-list">
              {filteredOrganisers.map((org, index) => (
                <div key={index} className="checkbox-item">
                  <md-checkbox
                    checked={selectedOrganisers.includes(org)}
                    onChange={() => toggleOrganiser(org)}
                  />
                  <span>{org.username}</span>
                </div>
              ))}
            </div>
          </div>

            {/* EDITORS */}
            <div className="multi-select">
            <label className="multi-label">Editors</label>

            <md-outlined-text-field
              label="Search editors"
              value={searchEditor}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
                setSearchEditor((e.target as MdOutlinedTextField).value)
              }
            />
            
            <div className="selected-chips">
              {selectedEditors.map((editor, i) => (
                <span
                  key={i}
                  className="chip"
                  onClick={() => toggleEditor(editor)}
                >
                  {editor.username} ✕
                </span>
              ))}
            </div>

            <div className="checkbox-list">
              {filteredEditors.map((editor, index) => (
                <div key={index} className="checkbox-item">
                  <md-checkbox
                    checked={selectedEditors.includes(editor)}
                    onChange={() => toggleEditor(editor)}
                  />
                  <span>{editor.username}</span>
                </div>
              ))}
            </div>
          </div>

          <md-outlined-text-field
            ref={capacityRef}
            label="Capacity"
            class="input"
          />

          <md-outlined-text-field
            ref={tagsRef}
            label="Tags (comma separated)"
            class="input"
          />

          <md-outlined-text-field
            ref={descRef}
            label="Description"
            textarea
            rows="4"
            class="input"
          />

          <md-filled-button class="create-btn" onClick={handleCreate}>
            Create Event
          </md-filled-button>
        </div>
      </div>

      {/* SUCCESS DIALOG */}
      <md-dialog ref={dialogRef}>
        <div slot="headline">Success</div>
        <div slot="content">Event created successfully</div>
        <div slot="actions">
          <md-filled-button
            onClick={() => {
              dialogRef.current?.close();
              navigate(0);
            }}
          >
            OK
          </md-filled-button>
        </div>
      </md-dialog>

      <CustomDialog ref={customDialogRef} />
    </div>
  );
};
