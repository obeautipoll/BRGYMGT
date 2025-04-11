import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Announcements.css"; // Assuming you have the correct styles applied

const API_URL = "http://localhost:5000"; // Ensure this matches your backend URL

const Announcements = ({ API_URL, token,role }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", description: "" });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // State for expanding description
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please log in.");
        return;
      }

      const response = await axios.get(`${API_URL}/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAnnouncements(response.data);
    } catch (error) {
      toast.error("Failed to fetch announcements.");
      console.error("Error fetching announcements:", error);
    }
  };

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    try {
      // Validate input fields
      if (!newAnnouncement.title || !newAnnouncement.description) {
        toast.error("Both title and description are required.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please log in.");
        return;
      }

      // Make the API request to create the announcement
      const response = await axios.post(
        `${API_URL}/announcements`,
        newAnnouncement,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Announcement created successfully.");
      setNewAnnouncement({ title: "", description: "" }); // Reset form
      fetchAnnouncements(); // Reload announcements
    } catch (error) {
      toast.error("Failed to create announcement.");
      console.error("Error creating announcement:", error);
    }
  };

  // Handle update announcement
  const handleUpdateAnnouncement = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please log in.");
        return;
      }

      // Extract the announcement ID by removing the prefix 'announcement:'
      const { id, title, description } = editingAnnouncement;
      const announcementId = id.split(":")[1]; // Remove 'announcement:' prefix

      const response = await axios.put(
        `${API_URL}/announcements/${announcementId}`, // Use the correct ID format
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Announcement updated successfully.");
      setEditingAnnouncement(null); // Reset the editing state
      fetchAnnouncements(); // Reload announcements
    } catch (error) {
      toast.error("Failed to update announcement.");
      console.error("Error updating announcement:", error);
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please log in.");
        return;
      }

      // Remove 'announcement:' prefix from the id if it exists
      const announcementId = id.split(":")[1]; // Split and get the actual ID

      const response = await axios.delete(`${API_URL}/announcements/${announcementId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Announcement deleted successfully.");
      fetchAnnouncements(); // Reload announcements
    } catch (error) {
      toast.error("Failed to delete announcement.");
      console.error("Error deleting announcement:", error);
    }
  };

  // Toggle the expanded description
  const handleExpand = (id) => {
    setExpanded(expanded === id ? null : id); // Toggle the expanded state
  };

  return (
    
    <div className="announcements-container">
     {role === "admin" && ( <h2>Manage Announcements</h2>)}
      
      {/* Form for adding or editing announcement */}
      {role === "admin" && (
      <div className="announcement-form">
        <h3>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</h3>
        <input
          type="text"
          placeholder="Title"
          value={editingAnnouncement ? editingAnnouncement.title : newAnnouncement.title}
          onChange={(e) =>
            editingAnnouncement
              ? setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
              : setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
          }
        />
        
        {/* Description pouch */}
        <div className="description-pouch">
          <textarea
            placeholder="Description"
            value={editingAnnouncement ? editingAnnouncement.description : newAnnouncement.description}
            onChange={(e) =>
              editingAnnouncement
                ? setEditingAnnouncement({ ...editingAnnouncement, description: e.target.value })
                : setNewAnnouncement({ ...newAnnouncement, description: e.target.value })
            }
          />
        </div>

        <button className="create-btn" onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}>
          {editingAnnouncement ? "Update" : "Create"}
        </button>
        {editingAnnouncement && (
          <button className="cancel-btn" onClick={() => setEditingAnnouncement(null)}>
            Cancel Edit
          </button>
        )}
      </div>
      )}
        
      {/* Display announcements */}
      {announcements.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        <ul className="announcement-list">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="announcement-item">
              <div className="announcement-header">
                <h3 className="announcement-title">{announcement.title}</h3>
                <p className="announcement-description">
                  {expanded === announcement.id
                    ? announcement.description
                    : `${announcement.description.substring(0, 100)}...`}
                </p>
              </div>

              {/* "MORE" button */}
              <button
                className="more-btn"
                onClick={() => handleExpand(announcement.id)}
              >
                {expanded === announcement.id ? "LESS" : "MORE"}
              </button>

              {/* Controls for edit and delete */}
              {role === "admin" && (
              <div className="announcement-buttons">
                <button
                  className="edit-btn"
                  onClick={() => setEditingAnnouncement(announcement)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                >
                  Delete
                </button>
              </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Announcements;
