import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EditResident.css';

const EditResident = ({ API_URL, token, residentId, fetchResidents, closeEditResident }) => {
  const [formData, setFormData] = useState({
    id: '',
    surname: '',
    firstName: '',
    middleName: '',
    gender: '',
    birthdate: '',
    birthplace: '',
    purok: '',
    maritalStatus: '',
    totalHouseholdMembers: '',
    bloodType: '',
    occupation: '',
    lengthOfStay: '',
    monthlyIncome: ''
  });

  useEffect(() => {
    const fetchResidentData = async () => {
      try {
        const response = await axios.get(`${API_URL}/residents/${residentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(response.data);
      } catch (error) {
        toast.error('Failed to fetch resident data');
      }
    };
    fetchResidentData();
  }, [residentId, token, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Create an object without the 'id' field (if your backend does not expect it)
    const updatedData = { ...formData };
    delete updatedData.id;

    try {
      await axios.put(`${API_URL}/residents/${residentId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resident updated successfully!');
      fetchResidents(); // Refresh resident list
      closeEditResident(); // Close modal
    } catch (error) {
      console.error('Update Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error updating resident!');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeEditResident}>&times;</span>
        <form onSubmit={handleEditSubmit}>
          <h2>Edit Resident</h2>
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
            name="surname"
            placeholder="Surname"
            value={formData.surname}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="middleName"
            placeholder="Middle Name"
            value={formData.middleName}
            onChange={handleChange}
            required
          />
          
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="birthplace"
            placeholder="Birthplace"
            value={formData.birthplace}
            onChange={handleChange}
            required
          />

          <select
            name="purok"
            value={formData.purok}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Purok</option>
            {[...Array(8)].map((_, index) => (
              <option key={index + 1} value={index + 1}>{index + 1}</option>
            ))}
          </select>

          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Divorced">Divorced</option>
          </select>

          <input
            type="text"
            name="totalHouseholdMembers"
            placeholder="Total no. of Household Members"
            value={formData.totalHouseholdMembers}
            onChange={handleChange}
            required
          />
          
          <select
          name="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select Blood Type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
          <input
            type="text"
            name="occupation"
            placeholder="Occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="lengthOfStay"
            placeholder="Length of Stay (in Months)"
            value={formData.lengthOfStay}
            onChange={handleChange}
            required
          />
          <select
          name="monthlyIncome"
          value={formData.monthlyIncome}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select Monthly Income</option>
          <option value="Less Than 5000">Less than ₱5,000</option>
          <option value="5000 To 10000">₱5,000 - ₱10,000</option>
          <option value="10000 To 20000">₱10,000 - ₱20,000</option>
          <option value="20000 To 50000">₱20,000 - ₱50,000</option>
          <option value="50000 To 100000">₱50,000 - ₱100,000</option>
          <option value="More Than 100000">More than ₱100,000</option>
        </select>
          <button type="submit">Update Resident</button>
        </form>
      </div>
    </div>
  );
};

export default EditResident;
