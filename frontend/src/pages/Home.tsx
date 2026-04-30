import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/filled-select.js";
import "@material/web/select/select-option.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/chips/chip-set.js";
import "@material/web/chips/filter-chip.js";

import { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

import "./styles/Home.css";

export const Home = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");

  const allTags = ["AI", "Web", "Robotics", "ML", "Cloud", "Cybersecurity"];
  const campuses = ["Nila", "Sahyadri", "Ahalia"];
  const locations = ["Palakkad", "Kochi", "Trivandrum"];
  const venues = ["Auditorium", "Lab", "Open Ground", "Seminar Hall"];

  const events = [
    { id: 1, name: "Hackathon 2025" },
    { id: 2, name: "AI Workshop" },
    { id: 3, name: "Tech Talk" },
  ];

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleFilter = () => {
    console.log({
      campus,
      title,
      location,
      venue,
      tags,
      eventDateTime,
    });
  };

  return (
    <div>
      <div className="layout">
        {/* Filter Sidebar */}
        <div className="filter-sidebar">
          <h2>Filter Events</h2>
          <div className="filter-contents">
            {/* Title */}
            <md-filled-text-field
              label="Event Title"
              value={title}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
                const target = e.target as MdOutlinedTextField;
                setTitle(target.value);
              }}
            />

            {/* Date and Time */}
            <md-filled-text-field
              type="datetime-local"
              label="Event Date and Time"
              onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
                const target = e.target as MdOutlinedTextField;
                setEventDateTime(target.value);
              }}
            />

            {/* Campus */}
            <md-filled-select
              label="Campus"
              value={campus}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
                const target = e.target as MdOutlinedTextField;
                setCampus(target.value);
              }}
            >
              {campuses.map((campus) => (
                <md-select-option key={campus} value={campus}>
                  <div slot="headline">{campus}</div>
                </md-select-option>
              ))}
            </md-filled-select>

            {/* Location */}
            <md-filled-select
              label="Location"
              value={location}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
                const target = e.target as MdOutlinedTextField;
                setLocation(target.value);
              }}
            >
              {locations.map((loc) => (
                <md-select-option key={loc} value={loc}>
                  <div slot="headline">{loc}</div>
                </md-select-option>
              ))}
            </md-filled-select>

            {/* Venue */}
            <md-filled-select
              label="Venue"
              value={venue}
              onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
                const target = e.target as MdOutlinedTextField;
                setVenue(target.value);
              }}
            >
              {venues.map((v) => (
                <md-select-option key={v} value={v}>
                  <div slot="headline">{v}</div>
                </md-select-option>
              ))}
            </md-filled-select>
          </div>

          {/* Tags */}
          <div>Tags</div>
          <md-filled-text-field
            label="Search Tags"
            value={tagInput}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) => {
              const target = e.target as MdOutlinedTextField;
              setTagInput(target.value);
            }}
          />

          <div>
            <md-chip-set>
              {allTags.map((tag) => (
                <md-filter-chip
                  key={tag}
                  label={tag}
                  onClick={() => toggleTag(tag)}
                >
                  <md-icon slot="icon">tag</md-icon>
                </md-filter-chip>
              ))}
            </md-chip-set>
          </div>

          <md-filled-button onClick={handleFilter}>Apply</md-filled-button>
        </div>

        {/* Events Panel */}
        <div className="events-panel">
          <h2>Events</h2>

          <md-list>
            {events.map((event) => (
              <md-list-item
                key={event.id}
                type="button"
                onClick={() => navigate(`/event`)}
              >
                <div slot="headline">{event.name}</div>
              </md-list-item>
            ))}
          </md-list>
        </div>
      </div>
    </div>
  );
};
