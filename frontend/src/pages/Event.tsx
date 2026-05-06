import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, isRouteErrorResponse } from "react-router-dom";
import "./styles/Event.css";
import type { UserInfoItem, Visitor } from "../interfaces";
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/dialog/dialog.js';

import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";
import { MdDialog } from "@material/web/dialog/dialog.js";

import { CustomDialog } from "../components/customDialog";
import type { DialogHandle } from "../components/customDialog";

export const EventPage = () => {
  // "id" here must match the name used in the Route path (path="/event/:id")
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedEditors, setSelectedEditors] = useState<Visitor[]>([]);
  const [availableEditors, setAvailableEditors] = useState<Visitor[]>([]);
  const [presentEditors, setPresentEditors] = useState<Visitor[]>([]);
  const [allEditors, setAllEditors] = useState<Visitor[]>([]);
  const [searchEditor, setSearchEditor] = useState("");
  // const [event, setEvent] = useState<any>(null);

  // useEffect(() => {
  //   const fetchEventDetails = async () => {
  //     try {
  //       const res = await fetch(`http://localhost:8000/events/${id}`);
  //       const data = await res.json();
  //       setEvent(data);
  //     } catch (error) {
  //       console.error("Failed to fetch event", error);
  //     }
  //   };

  //   if (id) fetchEventDetails();
  // }, [id]);
  const customDialogRef = useRef<DialogHandle>(null);
  const successDialogRef = useRef<MdDialog>(null);
  const confirmDeleteDialogRef = useRef<MdDialog>(null);

  const nameRef = useRef<MdOutlinedTextField>(null);
  const descRef = useRef<MdOutlinedTextField>(null);

  const [eventData, setEventData] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = storedUser?.user_id;
  const role = storedUser?.role;

  const isEditor = role === "organizer_role" || role === "editor_role";
  const isOgranizer = role == "organizer_role";
  const user: UserInfoItem = JSON.parse(localStorage.getItem("user") || "{}");

  const showError = (msg: string) => {
    customDialogRef.current?.open("Error", msg);
  };

  // ---- LOAD ALL EDITORS ----
  useEffect(() => {
    const loadEditors = async () => {
      try {
        const res = await fetch(`http://localhost:8000/editors?role=${user.role}`);
        const data: Visitor[] = await res.json();
        setAllEditors(data);
      } catch {
        showError("Failed to load editors");
      }
    };

    loadEditors();
  }, []);

  // ---- LOAD PRESENT EDITORS ----
  useEffect(() => {
    const loadAvailableEditors = async () => {
      try {
        const res = await fetch(`http://localhost:8000/editors?event_id=${id}&role=${user.role}`);
        const data: Visitor[] = await res.json();
        setPresentEditors(data);
      } catch {
        showError("Failed to load editors");
      }
    };

    loadAvailableEditors();
  }, [])

  // ---- LOAD AVAILABLE EDITORS ----
  useEffect(() => {
    setAvailableEditors(allEditors.filter(e => !presentEditors.some(pe => pe.user_id === e.user_id)));

  }, [allEditors, presentEditors])

  // ---- TOGGLE EDITORS ----
  const toggleEditor = (editor: Visitor) => {
    setSelectedEditors((prev) =>
      prev.includes(editor)
        ? prev.filter((e) => e !== editor)
        : [...prev, editor]
    );
  };

  const filteredEditors = availableEditors.filter((e) =>
    e.username.toLowerCase().includes(searchEditor.toLowerCase())
  );

  const addEditor = async (editor: Visitor) => {
    try {
      const res = await fetch(`http://localhost:8000/add_editor?user_id=${user.user_id}&editor_id=${editor.user_id}&event_id=${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to create event");
        return;
      }
    } catch {
      showError("Failed to add editor");
    }
  }

  // const handleAddEditors = () => {

  // 1. LOAD EVENT
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:8000/event/${id}?role=${user.role}`);
        const data = await res.json();

        if (!res.ok) {
          showError(data.detail);
          return;
        }

        setEventData(data);
      } catch {
        showError("Failed to load event");
      }
    };

    const checkRegistration = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/is_user_registered?user_id=${user_id}&event_id=${id}&role=${user.role}`
        );
        const data = await res.json();
        setIsRegistered(data.success);
      } catch {
        showError("Failed to check registration");
      }
    };

    fetchEvent();
    if (user_id) checkRegistration();
  }, [id]);

  // ---- DELETE EVENT ----
  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8000/event/${id}?user_id=${user.user_id}&role=${user.role}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Failed to delete event");
        return;
      }

      console.log("Deleted event: ", String(id));
      confirmDeleteDialogRef.current?.close();
      successDialogRef.current?.show();
      navigate("/");
    } catch {
      showError("Server Error");
    }
  }

  // 2. UPDATE EVENT (organiser/editor)
  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:8000/event/${id}?role=${user.role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          event_id: id,
          name: nameRef.current?.value,
          description: descRef.current?.value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Update failed");
        return;
      }

      selectedEditors.forEach((editor) => addEditor(editor));

      successDialogRef.current?.show();
    } catch {
      showError("Server error");
    }
  };

  // 3. REGISTER / WITHDRAW
  const handleRegister = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/event/${id}/register?user_id=${user_id}&event_id=${id}&role=${user.role}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError("Registration failed");
        return;
      }

      setIsRegistered(true);
      successDialogRef.current?.show();
    } catch {
      showError("Server error");
    }
  };

  const handleWithdraw = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/event/${id}/withdraw?user_id=${user_id}&event_id=${id}&role=${user.role}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError("Withdraw failed");
        return;
      }

      setIsRegistered(false);
      successDialogRef.current?.show();
    } catch {
      showError("Server error");
    }
  };

  if (!eventData) {
    return <div className="content">Loading event...</div>;
  }

  return (
    <div className="EventPage">
      <div className="content event-page">
        <h2 className="page-header">{eventData.event_name}</h2>

        {/* BASIC INFO */}
        <p><b>Venue:</b> {eventData.venue_name}</p>
        <p><b>Location:</b> {eventData.location_name}, {eventData.campus_name}</p>
        <p><b>Time:</b> {new Date(eventData.start_time).toLocaleString()} → {new Date(eventData.finish_time).toLocaleString()}</p>
        <p><b>Capacity:</b> {eventData.capacity}</p>
        <p><b>Registered:</b> {eventData.registered_count}</p>
        <p><b>Organiser:</b> {eventData.primary_organizer}</p>

        {/* TAGS */}
        <div className="tags">
          {eventData.tags.map((tag: string, i: number) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>

        {/* EDIT MODE */}
        {isEditor ? (
          <div className="edit-section">
            <md-outlined-text-field
              ref={nameRef}
              label="Event Name"
              value={eventData.event_name}
            />

            <md-outlined-text-field
              ref={descRef}
              label="Description"
              value={eventData.description}
            />

            {/* EDITORS */}
            {isOgranizer && (< div className="multi-select">
              <label className="multi-label">Editors</label>

              <md-outlined-text-field
                label="Search editors"
                value={searchEditor}
                onInput={(e: React.InputEvent<MdOutlinedTextField>) =>
                  setSearchEditor((e.target as MdOutlinedTextField).value)
                }
              />

              <div className="selected-chips">
                {selectedEditors.map((editor, i) => (
                  <span
                    key={i}
                    className="chip"
                    onClick={() => toggleEditor(editor)}
                  >
                    {editor.username} ✕
                  </span>
                ))}
              </div>

              <div className="checkbox-list">
                {filteredEditors.map((editor, index) => (
                  <div key={index} className="checkbox-item">
                    <md-checkbox
                      checked={selectedEditors.includes(editor)}
                      onChange={() => toggleEditor(editor)}
                    />
                    <span>{editor.username}</span>
                  </div>
                ))}
              </div>
            </div>
            )}

            <md-filled-button onClick={handleUpdate}>
              Save Changes
            </md-filled-button>

            <md-filled-button onClick={handleDelete}>
              Delete Event
            </md-filled-button>
          </div>
        ) : (
          <div className="action-section">
            {!eventData.is_full && !isRegistered && (
              <md-filled-button onClick={handleRegister}>
                Register
              </md-filled-button>
            )}

            {isRegistered && (
              <md-outlined-button onClick={handleWithdraw}>
                Withdraw
              </md-outlined-button>
            )}

            {eventData.is_full && !isRegistered && (
              <p>Event is full</p>
            )}
          </div>
        )}
      </div>

      {/* SUCCESS DIALOG */}
      <md-dialog ref={successDialogRef}>
        <div slot="headline">Success</div>
        <div slot="content">Action completed successfully</div>
        <div slot="actions">
          <md-text-button onClick={() => {
            successDialogRef.current?.close();
            navigate(0);
          }}>
            OK
          </md-text-button>
        </div>
      </md-dialog>

      <md-dialog ref={confirmDeleteDialogRef}>
        <div slot="headline">
          Delete event?
        </div>
        <div slot="actions">
          <md-text-button onClick={() => confirmDeleteDialogRef.current?.close()}>
            No
          </md-text-button>
          <md-filled-button onClick={handleDelete}>Yes</md-filled-button>
        </div>
      </md-dialog>
      <CustomDialog ref={customDialogRef} />
    </div >
  );
};
