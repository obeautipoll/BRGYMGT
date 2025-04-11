import React, { useState, useEffect } from "react";
import axios from "axios";
import OfficialAlbum from "../../components/OfficialAlbum";  // Assuming OfficialAlbum component exists
import { toast } from "react-toastify";

const Uofficials = ({ API_URL, token }) => {
  const [officials, setOfficials] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For search functionality if needed

  // Fetch officials based on search query (if provided)
  const fetchOfficials = async (search = "") => {
    try {
      const response = await axios.get(`${API_URL}/officials`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setOfficials(response.data); // Update the officials state with the fetched data
    } catch (error) {
      toast.error("Failed to fetch officials.");
    }
  };

  useEffect(() => {
    fetchOfficials(searchQuery); // Fetch officials whenever the search query or token changes
  }, [searchQuery, token]);

  return (
    <div>

      <h2>Barangay Officials Directory</h2>

      {/* Optional Search Input */}
      <input
        type="text"
        placeholder="Search officials..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Update search query
      />

      {/* Display the Official Album for the user */}
      <OfficialAlbum officials={officials} />
    </div>
  );
};

export default Uofficials;
