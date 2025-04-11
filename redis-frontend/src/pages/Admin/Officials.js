import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AddOfficial from "../../components/AddOfficial";
import EditOfficial from "../../components/EditOfficial";
import DeleteOfficial from "../../components/DeleteOfficial";
import './Officials.css';
import OfficialAlbum from "../../components/OfficialAlbum";

const Officials = ({ API_URL, token,role }) => {
  const [officials, setOfficials] = useState([]);
  const [showAddOfficial, setShowAddOfficial] = useState(false);
  const [showEditOfficial, setShowEditOfficial] = useState(false);
  const [officialIdToEdit, setOfficialIdToEdit] = useState(null);
  const [showDeleteOfficial, setShowDeleteOfficial] = useState(false);
  const [officialIdToDelete, setOfficialIdToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch officials based on search query
  const fetchOfficials = async (search = "") => {
    try {
      const response = await axios.get(`${API_URL}/officials`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      
      // Sort the officials by position
      const sortedOfficials = response.data.sort((a, b) => {
        const positions = [
          "Barangay Captain",
          "Barangay Councilor",
          "Barangay Secretary",
          "Barangay Treasurer",
          "Barangay Police Officer",
          "Sangguniang Kabataan Chairperson",
          "Sangguniang Kabataan Council",
          "Sangguniang Kabataan Secretary",
          "Sangguniang Kabataan Treasurer",
          "Peacekeeping Committee"
        ];
        return positions.indexOf(a.position) - positions.indexOf(b.position);
      });
  
      setOfficials(sortedOfficials); // Update the officials state with sorted data
    } catch (error) {
      toast.error("Failed to fetch officials.");
    }
  };
  useEffect(() => {
    fetchOfficials(searchQuery);
  }, [searchQuery, token]); // Fetch officials when the search query or token changes

  // Handle delete confirmation
  const confirmDelete = (id) => {
    setOfficialIdToDelete(id);
    setShowDeleteOfficial(true);
  };

  return (
    <div>
      {role === "admin" && (
      <h2>Official List</h2>
      )}
      {/* Search input */}
      <input
        type="text"
        placeholder="Search officials..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Update search query
      />
{role === "admin" && (
      <button className="add-official-btn" onClick={() => setShowAddOfficial(true)}>
        Add Official
      </button>
)}
      {role === "admin" && (
      <table>
        <thead>
          <tr>
          <th id="idColumn">Official ID</th>
      <th id="nameColumn">Name</th>
      <th id="ageColumn">Age</th>
      <th id="positionColumn">Position</th>
      <th id="descriptionColumn">Description</th>
      <th id="contactColumn">Contact No</th>
      <th id="imageColumn">Image</th>
      <th id="actionsColumn">Actions</th>
          </tr>
        </thead>
        <tbody>
          {officials.map((official) => (
            <tr key={official.id}>
              <td>{official.id}</td> {/* Official ID column */}
              <td>{official.name}</td>
              <td>{official.age}</td>
              <td>{official.position}</td>
              <td>{official.description}</td>
              <td>{official.contactNo}</td>
              <td>
                  {official.photo ? (
                    <img src={`http://localhost:5000/${official.photo}`} alt="Official Image" width="50" />
                  ) : (
                    "No Image"
                  )}
                </td>
              <td>
                <button
                  className="edit-btn"
                  onClick={() => {
                    setOfficialIdToEdit(official.id);
                    setShowEditOfficial(true);
                  }}
                >
                  Edit
                </button>
                <button className="delete-btn" onClick={() => confirmDelete(official.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {/* Modals */}
      {showAddOfficial && (
        <AddOfficial
          API_URL={API_URL}
          token={token}
          fetchOfficials={fetchOfficials}
          closeAddOfficial={() => setShowAddOfficial(false)}
        />
      )}

      {showEditOfficial && (
        <EditOfficial
          API_URL={API_URL}
          token={token}
          fetchOfficials={fetchOfficials}
          closeEditOfficial={() => setShowEditOfficial(false)}
          officialId={officialIdToEdit}
        />
      )}

      {showDeleteOfficial && (
        <DeleteOfficial
          officialId={officialIdToDelete}
          onDeleteConfirm={() => {
            axios
              .delete(`${API_URL}/officials/${officialIdToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then(() => {
                toast.success("Official deleted successfully!");
                fetchOfficials(); // Refresh official list after deletion
              })
              .catch(() => {
                toast.error("Error deleting official.");
              });
            setShowDeleteOfficial(false);
          }}
          onCancel={() => setShowDeleteOfficial(false)}
        />
      )}

<OfficialAlbum officials={officials} />


    </div>
  );
};

export default Officials;
