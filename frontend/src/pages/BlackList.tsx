import { useState, useEffect, useRef } from "react";

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

import "./styles/BlackList.css";

interface EventItem {
  event_id: string | number;
  title: string
}

interface Visitor {
  user_id: string | number;
  username: string
}

interface UserSession {
  user_id: string | number;
}

export const BlackList = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  const dialogRef = useRef<MdDialog>(null);
  const customDialogRef = useRef<DialogHandle>(null);

  const showError = (msg: string) => {
        customDialogRef.current?.open("Error", msg);
  };

  // ---------------- LOAD EVENTS ----------------
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const user: UserSession = JSON.parse(localStorage.getItem("user") || "{}");

        const res = await fetch(`http://localhost:8000/api/events/${user.user_id}`);  // TODO: update with actual url
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
          `http://localhost:8000/api/events/${selectedEvent}/visitors`     // TODO: update with actual url
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
      const res = await fetch("http://localhost:8000/api/events/blacklist", {  // TODO: update the url
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
                <div slot="headline">{event.title}</div>
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
