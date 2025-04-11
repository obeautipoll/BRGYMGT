import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Account.css"
const Account = ({ API_URL, token }) => {
  const [accountInfo, setAccountInfo] = useState(null);
  const [assignedResident, setAssignedResident] = useState(null);
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    // Fetch user details and assigned resident info after login
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Always display the username
        setAccountInfo({ username: response.data.username });

        // Assign resident data if available
        if (response.data.assignedResident) {
          setAssignedResident(response.data.assignedResident);
          setIsAssigned(true); // Mark as assigned if resident data is available
        } else {
          setIsAssigned(false); // If no assigned resident, set it to false
        }
      } catch (error) {
        toast.error("Failed to fetch account information.");
      }
    };

    fetchUserInfo();
  }, [token]);

  // Function to calculate the age based on birthdate
  const calculateAge = (birthdate) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }

    return age;
  };

  return (
    <div className="account-container">
    <h2>Account Information</h2>
    
    <div className="username-pouch">
      <p>Username   :       {accountInfo ? accountInfo.username : 'Loading...'}</p>
    </div>
  
    {isAssigned ? (
      <div className="account-details">
        <p><strong>Surname:</strong> {assignedResident.surname}</p>
        <p><strong>First Name:</strong> {assignedResident.firstName}</p>
        <p><strong>Middle Name:</strong> {assignedResident.middleName}</p>
        <p><strong>Gender:</strong> {assignedResident.gender}</p>
        <p><strong>Birthdate:</strong> {assignedResident.birthdate} (Age: {calculateAge(assignedResident.birthdate)})</p>
        <p><strong>Birthplace:</strong> {assignedResident.birthplace}</p>
        <p><strong>Purok:</strong> {assignedResident.purok}</p>
        <p><strong>Marital Status:</strong> {assignedResident.maritalStatus}</p>
        <p><strong>Total Household Members:</strong> {assignedResident.totalHouseholdMembers}</p>
        <p><strong>Blood Type:</strong> {assignedResident.bloodType}</p>
        <p><strong>Occupation:</strong> {assignedResident.occupation}</p>
        <p><strong>Length of Stay:</strong> {assignedResident.lengthOfStay}</p>
        <p><strong>Monthly Income:</strong> {assignedResident.monthlyIncome}</p>
      </div>
    ) : (
      <p className="no-assignment">Your account has not been assigned to any resident yet. Please contact the admin.</p>
    )}
  </div>
    
  );
};

export default Account;
