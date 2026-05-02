import { useState, useRef } from "react";
import "./styles/EventCreate.css";

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/dialog/dialog.js';

export const EventCreate = () => {

    const organisers = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"];

    const [selectedOrganisers, setSelectedOrganisers] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    const dialogRef = useRef<any>(null);

    const toggleOrganiser = (name: string) => {
        setSelectedOrganisers(prev =>
            prev.includes(name)
                ? prev.filter(o => o !== name)
                : [...prev, name]
        );
    };

    const filteredOrganisers = organisers.filter(o =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        //  you can add API call here

        // show success dialog
        dialogRef.current?.show();
    };

    return (
        <div>
            <div className="event-create-container">
                <h2 className="page-header">Create Event</h2>

                <div className="event-create-form">
                    <md-outlined-text-field label="Event Title" class="input"></md-outlined-text-field>
                    <md-outlined-text-field label="Start Time" type="datetime-local" class="input"></md-outlined-text-field>
                    <md-outlined-text-field label="End Time" type="datetime-local" class="input"></md-outlined-text-field>
                    <md-outlined-select label="Location" class="input">
                        {["Location 1", "Location 2", "Location 3"].map((location, index) => (
                            <md-select-option key={index} value={location}>
                                <div slot="headline">{location}</div>
                            </md-select-option>
                        ))}
                    </md-outlined-select>

                    <md-outlined-select label="Venue" class="input">
                        {["Venue A", "Venue B", "Venue C"].map((venue, index) => (
                            <md-select-option key={index} value={venue}>
                                <div slot="headline">{venue}</div>
                            </md-select-option>
                        ))}
                    </md-outlined-select>

                    <div className="multi-select">
                        <label className="multi-label">Secondary Organisers</label>

                        {/* Search */}
                        <md-outlined-text-field
                            label="Search organisers"
                            value={search}
                            onInput={(e: any) => setSearch(e.target.value)}
                        ></md-outlined-text-field>

                        {/* Selected Chips */}
                        <div className="selected-chips">
                            {selectedOrganisers.map((org, i) => (
                                <span key={i} className="chip" onClick={() => toggleOrganiser(org)}>
                                    {org} ✕
                                </span>
                            ))}
                        </div>

                        {/* Filtered List */}
                        <div className="checkbox-list">
                            {filteredOrganisers.map((org, index) => (
                                <div key={index} className="checkbox-item">
                                    <md-checkbox
                                        checked={selectedOrganisers.includes(org)}
                                        onChange={() => toggleOrganiser(org)}
                                    ></md-checkbox>
                                    <span>{org}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <md-outlined-text-field label="Capacity" class="input"></md-outlined-text-field>

                    <md-outlined-text-field label="Tags (comma separated)" class="input"></md-outlined-text-field>

                    <md-outlined-text-field label="Description" textarea rows="4" class="input"></md-outlined-text-field>

                    <md-filled-button class="create-btn" onClick={handleCreate}>Create Event</md-filled-button>

                </div>
            </div>

            {/* Success Dialog */}
            <md-dialog ref={dialogRef}>
                <div slot="headline">Success</div>
                <div slot="content">Event created successfully </div>
                <div slot="actions">
                    <md-filled-button onClick={() => dialogRef.current?.close()}>OK</md-filled-button>
                </div>
            </md-dialog>
        </div>
    );
};