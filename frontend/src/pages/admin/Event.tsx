import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";
import type { EventItem } from "../../interfaces";
import type { DialogHandle } from "../../components/customDialog";
import type { UserInfoItem } from "../../interfaces";

import "../styles/admin/Event.css";

export const AdminEvent = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [eventList, setEventList] = useState<EventItem[]>([]);

  const dialogRef = useRef<MdDialog>(null);
  const fetchErrorDialogRef = useRef<DialogHandle>(null);
  const user: UserInfoItem = JSON.parse(
    localStorage.getItem("user") || "{}",
  );
  const showError = (msg: string) => {
    fetchErrorDialogRef.current?.open("Error", msg);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch(`http://localhost:8000/search?role=${user.role}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();

        if (!res.ok) {
          showError(data.detail || "Failed to fetch events");
        }

        setEventList(data);
      } catch {
        showError("Server Error");
      }
    };

    loadEvents();
  }, []);

  const openConfirmDialog = (event: EventItem) => {
    setSelectedEvent(event);
    dialogRef.current?.show();
  };

  const confirmRemoveEvent = async () => {
    if (!selectedEvent) return;

    try {
      const res = await fetch(`http://localhost:8000/event/${selectedEvent.event_id}?user_id=${user.user_id}&role=${user.role}`, {
        // TODO Replace with api url
        method: "DELETE", // TODO Update Method
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: selectedEvent.event_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to delete event");
        return;
      }

      setEventList((prev) =>
        prev.filter((e) => e.event_id !== selectedEvent.event_id),
      );
      console.log("Deleted event: ", selectedEvent);
      dialogRef.current?.close();
      navigate(0);
    } catch {
      showError("Server Error");
    }
  };

  return (
    <div className="event_panel">
      <h1>Events</h1>

      <md-list className="event_list">
        {eventList.map((event, index) => (
          <md-list-item key={index}>
            <div slot="headline">{event.event_name}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmDialog(event)}
            >
              <md-icon>remove</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRef}>
        <div slot="headline">
          Delete event <b>{selectedEvent?.event_name}?</b>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmRemoveEvent}>Yes</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
