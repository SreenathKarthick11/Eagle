import { Navbar } from '../components/navbar';
import './styles/Home.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

export const Home = () => {
  const navigate = useNavigate();

  const [checkedCampus, setCheckedCampus] = useState<any>({
    Nila: false,
    Shayadiri: false,
    Ahalia: false
  });

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");

  const allTags = ["AI", "Web", "Robotics", "ML", "Cloud", "Cybersecurity"];
  const locations = ["Palakkad", "Kochi", "Trivandrum"];
  const venues = ["Auditorium", "Lab", "Open Ground", "Seminar Hall"];

  const events = [
    { id: 1, name: "Hackathon 2025" },
    { id: 2, name: "AI Workshop" },
    { id: 3, name: "Tech Talk" }
  ];

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleCampus = (campus: string) => {
    setCheckedCampus((prev: any) => ({
      ...prev,
      [campus]: !prev[campus]
    }));
  };

  const handleFilter = () => {
  console.log({
    campus: checkedCampus,
    title,
    location,
    venue,
    tags,
    eventDateTime
  });
};

  return (
    <div className='Homepage'>
      <Navbar />

      <div className="hcontent">

        {/* FILTER PANEL */}
        <div className="filter-box">
          <div className="filter-header">
              <h2>Filter Options</h2>
              {/* @ts-ignore */}
              <md-filled-button className="filter-btn" onClick={handleFilter}>Apply</md-filled-button>
          </div>

          {/* Campus */}
          <h4>Campus</h4>
          <div className="chip-group">
            {Object.keys(checkedCampus).map(campus => (
              <span
                key={campus}
                className={`chip ${checkedCampus[campus] ? "active" : ""}`}
                onClick={() => toggleCampus(campus)}
              >
                {campus}
              </span>
            ))}
          </div>

          {/* Title */}
          {/* @ts-ignore */}
          <md-outlined-text-field
            label="Search by Title"
            value={title}
            onInput={(e: any) => setTitle(e.target.value)}
          />

          {/* Date Time */}
          {/* @ts-ignore */}
          <md-outlined-text-field
            type="datetime-local"
            label="Event Date & Time"
            onInput={(e: any) => setEventDateTime(e.target.value)}
          />

          {/* Location */}
          {/* @ts-ignore */}
          <md-outlined-select
            label="Location"
            value={location}
            onInput={(e: any) => setLocation(e.target.value)}
          >
            {locations.map(loc => (
              // @ts-ignore
              <md-select-option key={loc} value={loc}>
                <div slot="headline">{loc}</div>
              {/* @ts-ignore */}
              </md-select-option>
            ))}
          {/* @ts-ignore */}
          </md-outlined-select>

          {/* Venue */}
          {/* @ts-ignore */}
          <md-outlined-select
            label="Venue"
            value={venue}
            onInput={(e: any) => setVenue(e.target.value)}
          >
            {venues.map(v => (
              // @ts-ignore
              <md-select-option key={v} value={v}>
                <div slot="headline">{v}</div>
              {/* @ts-ignore */}
              </md-select-option>
            ))}
          {/* @ts-ignore */} 
          </md-outlined-select>

        
          {/* Tags */}
          <div className="tags-box">
            <h4>Tags</h4>

            {/* Search input */}
            {/* @ts-ignore */}
            <md-outlined-text-field
              label="Search Tags"
              value={tagInput}
              onInput={(e: any) => setTagInput(e.target.value)}
            />

            {/* Selected tags (collapsed view) */}
            <div className="tags">
              {tags.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="tag active"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ✕
                </span>
              ))}

              {/* +X more */}
              {tags.length > 5 && (
                <span className="tag more">
                  +{tags.length - 5} more
                </span>
              )}
            </div>

            {/* Available tags (filtered) */}
            <div className="tags available-tags">
              {allTags
                .filter(tag =>
                  tag.toLowerCase().includes(tagInput.toLowerCase())
                )
                .map(tag => (
                  <span
                    key={tag}
                    className={`tag ${tags.includes(tag) ? "active" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* EVENTS PANEL */}
        <div className="events-box">
          <h2>Events</h2>

          {/* @ts-ignore */}
          <md-list>
            {events.map(event => (
              // @ts-ignore
              <md-list-item
                key={event.id}
                onClick={() => navigate(`/event`)}
              >
                <div slot="headline">{event.name}</div>
              {/* @ts-ignore */}
              </md-list-item>
            ))}
          {/* @ts-ignore */}
          </md-list>
        </div>

      </div>
    </div>
  );
};