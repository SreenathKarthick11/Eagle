import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";

import "../styles/admin/Event.css";

export const AdminEvent = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const dialogRef = useRef<MdDialog>(null);

  const visitors = [
    "Math Quiz",
    "Dual Boot",
    "OCaml Workshop",
    "Paper Bag Making",
    "Rocket Launch Challange 100m",
    "CSE Research Symposium",
    "Astrophotography Workshop",
  ];

  useEffect(() => {
    const dialog = dialogRef.current;
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

  const openConfirmDialog = (visitor: string) => {
    setSelectedEvent(visitor);
    dialogRef.current?.show();
  };

  const confirmBlacklist = () => {
    console.log("Deleted event: ", selectedEvent);
    dialogRef.current?.close();
  };

  return (
    <div className="event_panel">
      <h1>Events</h1>

      <md-list className="event_list">
        {visitors.map((event, index) => (
          <md-list-item key={index}>
            <div slot="headline">{event}</div>
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
          Delete event <b>{selectedEvent}?</b>
        </div>
        <div slot="actions">
          <md-text-button onClick={() => dialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={confirmBlacklist}>Yes</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
};
