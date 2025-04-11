import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AddOfficial.css';



const AddOfficial = ({ API_URL, token, fetchOfficials, closeAddOfficial }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: '',
    description: '',
    contactNo: '' ,
    photo: null 
  });
  const [isContactValid, setIsContactValid] = useState(true);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
    if (name === "contactNo") {
      setIsContactValid(/^\d{10}$/.test(value)); // Validate contact number
    }
  };
  const handleFileChange = (e) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      photo: e.target.files[0] // Capture the file
    }));
  };

  

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending official data:', formData);  // 🔍 Debug log

    const formDataToSend = new FormData();
    for (let key in formData) {
      formDataToSend.append(key, formData[key]);
    }


    try {
      // Make API request to add the official
      const response = await axios.post(`${API_URL}/officials`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // Important for file upload
        }
      });
      
      // Check if the response contains the ID and display success message
      if (response.data.id) {
        toast.success('Official added successfully!');
        fetchOfficials(); // Refresh officials list
        closeAddOfficial(); // Close modal after successful addition
      } else {
        toast.error('Failed to add official!');
      }
    } catch (error) {
      console.error('Error adding official:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Error adding official!');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeAddOfficial}>&times;</span>
        <form onSubmit={handleAddSubmit}>
          <h2>Add Official</h2>

          {/* Name input */}
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          {/* Age input */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          {/* Position select dropdown */}
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

          {/* Description textarea */}
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          {/* Contact Number input */}
          <input
            type="text"
            name="contactNo"
            placeholder="Contact Number"
            value={formData.contactNo}
            onChange={handleChange}
            required
          />
           <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            required
          />



           {!isContactValid && <p style={{ color: 'red' }}>Contact number must be 10 digits.</p>} {/* Show error message for invalid contact number */}


          {/* Submit button */}
          <button type="submit">Add Official</button>
        </form>
      </div>
    </div>
  );
};

export default AddOfficial;
