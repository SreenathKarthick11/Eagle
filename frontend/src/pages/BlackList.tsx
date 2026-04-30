import { useState, useEffect, useRef } from "react";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/button/filled-button.js";
import "@material/web/dialog/dialog.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import type { MdDialog } from "@material/web/dialog/dialog.js";

import "./styles/BlackList.css";

export const BlackList = () => {
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState("");

  const dialogRef = useRef<MdDialog>(null);

  const events = ["Tech Talk", "Hackathon", "Workshop"];
  const visitors = [
    "Alan Turing",
    "Ada Lovelace",
    "Grace Hopper",
    "Donald Knuth",
    "John von Neumann",
    "Claude Shannon",
    "Ken Thompson",
    "Dennis Ritchie",
    "Barbara Liskov",
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
    setSelectedVisitor(visitor);
    dialogRef.current?.show();
  };

  const confirmBlacklist = () => {
    console.log("Blacklisted: ", selectedVisitor);
    dialogRef.current?.close();
  };

  return (
    <div className="addbl_layout">
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
              <md-select-option key={event} value={event}>
                <div slot="headline">{event}</div>
              </md-select-option>
            ))}
          </md-filled-select>
        </div>
      </div>

      <div className="addbl_panel">
        <h1>Visitors</h1>

        <md-list className="addbl_userlist">
          {visitors.map((visitor, index) => (
            <md-list-item key={index}>
              <div slot="headline">{visitor}</div>
              <md-filled-tonal-icon-button
                slot="end"
                onClick={() => openConfirmDialog(visitor)}
              >
                <md-icon>person_remove</md-icon>
              </md-filled-tonal-icon-button>
            </md-list-item>
          ))}
        </md-list>

        <md-dialog ref={dialogRef}>
          <div slot="headline">
            Blacklist <b>{selectedVisitor}?</b>
          </div>
          <div slot="actions">
            <md-text-button onClick={() => dialogRef.current?.close()}>
              No
            </md-text-button>
            <md-filled-button onClick={confirmBlacklist}>Yes</md-filled-button>
          </div>
        </md-dialog>
      </div>
    </div>
  );
};
