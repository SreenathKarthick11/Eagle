import { useState, useEffect, useRef } from "react";

import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/select/outlined-select.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/filled-icon-button.js";
import "@material/web/icon/icon.js";

import type { MdDialog } from "@material/web/dialog/dialog.js";

export const AdminBlackList = () => {
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);

  const dialogRef = useRef<MdDialog>(null);

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
    <div style={{ paddingTop: "128px" }}>
      <md-list>
        {visitors.map((visitor, index) => (
          <md-list-item key={index}>
            <div slot="headline">{visitor}</div>
            <md-filled-tonal-icon-button
              slot="end"
              onClick={() => openConfirmDialog(visitor)}
            >
              <md-icon>delete</md-icon>
            </md-filled-tonal-icon-button>
          </md-list-item>
        ))}
      </md-list>

      <md-dialog ref={dialogRef}>
        <div slot="headline">
          Blacklist <b>{selectedVisitor} ?</b>
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
