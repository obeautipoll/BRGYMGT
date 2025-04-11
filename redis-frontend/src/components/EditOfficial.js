import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditOfficial = ({ API_URL, token, officialId, fetchOfficials, closeEditOfficial }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    age: '',
    position: '',
    description: '',
    contactNo: ''
  });

  const [errors, setErrors] = useState({
    contactNo: ''
  });

  useEffect(() => {
    if (!officialId) {
      toast.error('Official ID is required.');
      return;
    }

    // Fetch the official's data for editing using the official ID
    const fetchOfficialData = async () => {
      try {
        const response = await axios.get(`${API_URL}/officials/${officialId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(response.data);
      } catch (error) {
        toast.error('Failed to fetch official data');
      }
    };

    fetchOfficialData();
  }, [officialId, token, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const validateContactNo = (contactNo) => {
    const regex = /^[0-9]{10}$/; // Only allows a 10-digit number
    return regex.test(contactNo);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation for contact number
    if (!validateContactNo(formData.contactNo)) {
      setErrors({ contactNo: 'Contact number must be exactly 10 digits.' });
      return;
    }

    setErrors({ contactNo: '' }); // Clear any existing errors

    try {
      // Send the updated data to the server using PUT request
      await axios.put(`${API_URL}/officials/${officialId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Official updated successfully!');
      fetchOfficials(); // Refresh official list
      closeEditOfficial(); // Close modal
    } catch (error) {
      console.error('Update Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error updating official!');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeEditOfficial}>&times;</span>
        <form onSubmit={handleEditSubmit}>
          <h2>Edit Official</h2>
          <input
            type="text"
            name="id"
            placeholder="ID"
            value={formData.id}
            onChange={handleChange}
            required
            disabled
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Position</option>
            <option value="Barangay Captain">Barangay Captain</option>
            <option value="Barangay Councilor">Barangay Councilor</option>
            <option value="Barangay Secretary">Barangay Secretary</option>
            <option value="Barangay Treasurer">Barangay Treasurer</option>
            <option value="Barangay Police Officer">Barangay Police Officer</option>
            <option value="Sangguniang Kabataan Chairperson">Sangguniang Kabataan Chairperson</option>
            <option value="Sangguniang Kabataan Council">Sangguniang Kabataan Council</option>
            <option value="Sangguniang Kabataan Secretary">Sangguniang Kabataan Secretary</option>
            <option value="Sangguniang Kabataan Treasurer">Sangguniang Kabataan Treasurer</option>
            <option value="Peacekeeping Committee">Peacekeeping Committee</option>
          </select>

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="contactNo"
            placeholder="Contact Number"
            value={formData.contactNo}
            onChange={handleChange}
            required
          />
          {errors.contactNo && <p style={{ color: 'red' }}>{errors.contactNo}</p>} {/* Display error for invalid contact number */}

          <button type="submit">Update Official</button>
        </form>
      </div>
    </div>
  );
};

export default EditOfficial;
