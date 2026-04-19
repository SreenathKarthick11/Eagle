import { useState } from "react";
import { Navbar } from "../components/navbar";

import "./styles/BlackList.css"

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/button/filled-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';

import close_icon from "../assets/close.png";

export const BlackList = () => {
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");

  // dummy data (replace with API later)
  const events = ["Tech Talk", "Hackathon", "Workshop"];
  const visitors = ["a", "b", "c", "d","a", "b", "c", "d","a", "b", "c", "d"];

  const handleBlacklistClick = (visitor: string) => {
    setSelectedVisitor(visitor);
    setOpen(true);
  };

  const confirmBlacklist = () => {
    console.log("Blacklisted:", selectedVisitor);
    setOpen(false);
  };

  return (
    <div>
      <Navbar />
      <h2 className="page-header">Black List Visitors</h2>
      <div className="blacklist-container">
        
        {/* LEFT SIDE */}
        <div className="left-panel">
          <h2>Events</h2>


        {/* @ts-ignore */}
        <md-outlined-select label="Pick an Event" className="event-select" 
            onInput={(e: any) => setSelectedEvent(e.target.value)}>
                {events.map((event, index) => (
                // @ts-ignore
                <md-select-option key={index} value={event}>
                    <div slot="headline">{event}</div> 
                {/* @ts-ignore */}
                </md-select-option>
                ))}
            {/* @ts-ignore */}    
            </md-outlined-select>
        </div>

        {/* RIGHT SIDE */}
        <div className="right-panel">
          <h2>Visitors</h2>

          {/* Visitor List */}
          {/* @ts-ignore */}
            <md-list>
                {visitors.map((visitor, index) => (
                // @ts-ignore
                <md-list-item key={index}>
                    <div slot="headline">{visitor}</div>
                    
                    {/* Use the 'end' slot for the action button */}
                    <div slot="end" className="delete-btn" onClick={() => handleBlacklistClick(visitor)}>
                        <img src={close_icon} alt="close" />
                    </div>
                {/* @ts-ignore */}
                </md-list-item>
                ))}
            {/* @ts-ignore */}    
            </md-list>
        </div>
      </div>

      {/* Dialog */}
      {/* @ts-ignore */}
      <md-dialog open={open} onClosed={() => setOpen(false)}>
        <div slot="headline">Confirm Action</div>
        <div slot="content">
          Are you sure you want to blacklist{" "}
          <b>{selectedVisitor}</b>?
        </div>
        <div slot="actions">
          {/* @ts-ignore */}
          <md-filled-button onClick={() => setOpen(false)}> Cancel</md-filled-button>
          {/* @ts-ignore */}
          <md-filled-button onClick={confirmBlacklist}>Confirm</md-filled-button>
        </div>
      {/* @ts-ignore */}
      </md-dialog>
    </div>
  );
};