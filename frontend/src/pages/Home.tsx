import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/select/filled-select.js";
import "@material/web/select/select-option.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/chips/chip-set.js";
import "@material/web/chips/filter-chip.js";

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";
import "./styles/Home.css";

export const Home = () => {
  const navigate = useNavigate();
  const customDialogRef = useRef<DialogHandle>(null);

  // ---------------- STATE ----------------
  const [title, setTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [campuses, setCampuses] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const showError = (msg: string) => {
    customDialogRef.current?.open("Error", msg);
  };

  // ---------------- LOAD INITIAL ----------------
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("http://localhost:8000/api/campuses"),  // TODO: update with actual url
          fetch("http://localhost:8000/api/tags"),      // TODO: update with actual url
        ]);

        setCampuses(await cRes.json());
        setAllTags(await tRes.json());
      } catch {
        showError("Failed to load initial data");
      }
    };

    loadInitial();
  }, []);



  // ---------------- CAMPUS → LOCATION ----------------
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const url = campus
          ? `http://localhost:8000/api/locations?campus=${campus}`  // TODO: update with actual url
          : `http://localhost:8000/api/locations`;                  // TODO: update with actual url

        const res = await fetch(url);
        setLocations(await res.json());

        // reset dependent fields
        setLocation("");
        setVenue("");
        setVenues([]);
      } catch {
        showError("Failed to load locations");
      }
    };

    loadLocations();
  }, [campus]);

  // ---------------- LOCATION → VENUE ----------------
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const url = location
          ? `http://localhost:8000/api/venues?location=${location}`   // TODO: update with actual url
          : `http://localhost:8000/api/venues`;                       // TODO: update with actual url

        const res = await fetch(url);
        setVenues(await res.json());

        setVenue("");
      } catch {
        showError("Failed to load venues");
      }
    };

    loadVenues();
  }, [location]);

  // ---------------- TAG TOGGLE ----------------
  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ---------------- FILTER ----------------
  const handleFilter = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/events/search", {     // TODO: update with actual url
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campus: campus || null,
          location: location || null,
          venue: venue || null,
          tags: tags.length ? tags : null,
          title_substring: title || null,
          start_after: startTime || null,
          finish_before: endTime || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail);
        return;
      }

      setEvents(data);
    } catch {
      showError("Search failed");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="layout">
      {/* FILTER SIDEBAR */}
      <div className="filter-sidebar">
        <h2>Filter Events</h2>

        <div className="filter-contents">
          {/* TITLE */}
          <md-filled-text-field
            label="Event Title"
            value={title}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setTitle((e.target as MdOutlinedTextField).value)
            }
          />

          {/* TIME FILTERS */}
          <md-filled-text-field
            type="datetime-local"
            label="Start After"
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setStartTime((e.target as MdOutlinedTextField).value)
            }
          />

          <md-filled-text-field
            type="datetime-local"
            label="End Before"
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setEndTime((e.target as MdOutlinedTextField).value)
            }
          />

          {/* CAMPUS */}
          <md-filled-select
            label="Campus"
            value={campus}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setCampus((e.target as MdOutlinedTextField).value)
            }
          >
            {campuses.map((c) => (
              <md-select-option key={c} value={c}>
                <div slot="headline">{c}</div>
              </md-select-option>
            ))}
          </md-filled-select>

          {/* LOCATION */}
          <md-filled-select
            label="Location"
            value={location}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setLocation((e.target as MdOutlinedTextField).value)
            }
          >
            {locations.map((l) => (
              <md-select-option key={l} value={l}>
                <div slot="headline">{l}</div>
              </md-select-option>
            ))}
          </md-filled-select>

          {/* VENUE */}
          <md-filled-select
            label="Venue"
            value={venue}
            onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
              setVenue((e.target as MdOutlinedTextField).value)
            }
          >
            {venues.map((v) => (
              <md-select-option key={v} value={v}>
                <div slot="headline">{v}</div>
              </md-select-option>
            ))}
          </md-filled-select>
        </div>

        {/* TAG SEARCH */}
        <div>Tags</div>

        <md-filled-text-field
          label="Search Tags"
          value={tagInput}
          onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
            setTagInput((e.target as MdOutlinedTextField).value)
          }
        />

        {/* TAG CHIPS */}
        <md-chip-set>
          {allTags
            .filter((tag) =>
              tag.toLowerCase().includes(tagInput.toLowerCase())
            )
            .map((tag) => (
              <md-filter-chip
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                <md-icon slot="icon">tag</md-icon>
              </md-filter-chip>
            ))}
        </md-chip-set>

        <md-filled-button onClick={handleFilter}>
          Apply Filters
        </md-filled-button>
      </div>

      {/* EVENTS PANEL */}
      <div className="events-panel">
        <h2>Events</h2>

        <md-list>
          {events.map((event) => (
            <md-list-item
              key={event.event_id}
              type="button"
              onClick={() => navigate(`/event/${event.event_id}`)}
            >
              <div slot="headline">{event.title}</div>
              <div slot="supporting-text">{event.organizer}</div>
            </md-list-item>
          ))}
        </md-list>
      </div>
      <CustomDialog ref={customDialogRef} />
    </div>
  );
};
