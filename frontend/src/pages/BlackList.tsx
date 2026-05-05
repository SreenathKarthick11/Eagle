import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/button/filled-button.js";
import "@material/web/dialog/dialog.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { MdDialog } from "@material/web/dialog/dialog.js";

import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";
import type { EventItem, Visitor, UserInfoItem } from "../interfaces"

import "./styles/BlackList.css";

export const BlackList = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  const dialogRef = useRef<MdDialog>(null);
  const customDialogRef = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
    customDialogRef.current?.open("Error", msg);
  };

  const user: UserInfoItem = JSON.parse(localStorage.getItem("user") || "{}");

  // ---------------- LOAD EVENTS ----------------
  useEffect(() => {
    const loadEvents = async () => {
      try {


        const res = await fetch(`http://localhost:8000/events?organizer_id=${user.user_id}&role=${user.role}`);
        const data: EventItem[] = await res.json();

        setEvents(data);
      } catch {
        showError("Failed to load events");
      }
    };

    loadEvents();
  }, []);

  // ---------------- LOAD VISITORS ----------------
  useEffect(() => {
    if (!selectedEvent) return;

    const loadVisitors = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/event_participants?event_id=${selectedEvent}&role=${user.role}`
        );

        const data: Visitor[] = await res.json();
        setVisitors(data);
      } catch {
        showError("Failed to load visitors");
      }
    };

    loadVisitors();
  }, [selectedEvent]);

  // ---------------- OPEN DIALOG ----------------
  const openConfirmDialog = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    dialogRef.current?.show();
  };

  // ---------------- BLACKLIST ----------------
  const confirmBlacklist = async () => {
    if (!selectedVisitor) return;

    try {
      const res = await fetch(`http://localhost:8000/blacklist/${selectedEvent}?user_id=${user.user_id}&visitor_id=${selectedVisitor.user_id}&role=${user.role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: Number(selectedEvent),
          user_id: selectedVisitor.user_id,
        }),
      });

      let data: { detail?: string } = {};
      data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to blacklist");
        return;
      }

      // remove from UI immediately
      setVisitors((prev) =>
        prev.filter((v) => v.user_id !== selectedVisitor.user_id)
      );

      dialogRef.current?.close();
      navigate(0);
    } catch {
      showError("Server error");
    }
  };

  return (
    <div className="addbl_layout">
      {/* SIDEBAR */}
      <div className="addbl_sidebar">
        <h2>Events</h2>

        <div className="addbl_sidebar_contents">
          <md-filled-select
            label="Select an event"
            value={selectedEvent}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
              const target = e.target as MdOutlinedTextField;
              setSelectedEvent(target.value);
            }}
          >
            {events.map((event) => (
              <md-select-option key={event.event_id} value={String(event.event_id)}>
                <div slot="headline">{event.event_name}</div>
              </md-select-option>
            ))}
          </md-filled-select>
        </div>
      </div>

      {/* VISITOR PANEL */}
      <div className="addbl_panel">
        <h1>Visitors</h1>

        <md-list className="addbl_userlist">
          {visitors.map((visitor) => (
            <md-list-item key={visitor.user_id}>
              <div slot="headline">{visitor.username}</div>

              <md-filled-tonal-icon-button
                slot="end"
                onClick={() => openConfirmDialog(visitor)}
              >
                <md-icon>person_remove</md-icon>
              </md-filled-tonal-icon-button>
            </md-list-item>
          ))}
        </md-list>

        {/* DIALOG */}
        <md-dialog ref={dialogRef}>
          <div slot="headline">
            Blacklist <b>{selectedVisitor?.username}</b>?
          </div>

          <div slot="actions">
            <md-text-button onClick={() => dialogRef.current?.close()}>
              No
            </md-text-button>

            <md-filled-button onClick={confirmBlacklist}>
              Yes
            </md-filled-button>
          </div>
        </md-dialog>
      </div>
      <CustomDialog ref={customDialogRef} />
    </div>
  );
};
