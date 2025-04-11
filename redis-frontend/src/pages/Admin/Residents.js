
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AddResident from "../../components/AddResident";
import EditResident from "../../components/EditResident";
import DeleteResident from "../../components/DeleteResident";
import { CSVLink } from "react-csv"; 
import Papa from 'papaparse';

const Residents = ({ API_URL, token }) => {
  const [residents, setResidents] = useState([]);
  const [showAddResident, setShowAddResident] = useState(false);
  const [showEditResident, setShowEditResident] = useState(false);
  const [residentIdToEdit, setResidentIdToEdit] = useState(null);
  const [showDeleteResident, setShowDeleteResident] = useState(false);
  const [residentIdToDelete, setResidentIdToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedResidents, setSelectedResidents] = useState(null);
  const [password, setPassword] = useState("");
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [assignedResidents, setAssignedResidents] = useState({});
  const [showPassword, setShowPassword] = useState(false);
    //forcsv
    const [tempData, setTempData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);


 // Handle CSV File Upload
 const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate File Type & Size
  if (!file.name.endsWith(".csv")) {
      toast.error("Invalid file format. Please upload a CSV file.");
      return;
  }
  if (file.size > 10 * 1024 * 1024) { // Increased the limit to 10MB for larger files
      toast.error("File size exceeds 10MB limit.");
      return;
  }

  setSelectedFile(file);

  // Use PapaParse to parse the CSV
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,  // Automatically convert numbers and boolean values
    complete: (result) => {
        if (!result.data.length) {
            toast.error("Uploaded CSV file is empty.");
            return;
        }

          // Only update tempData if parsing was successful and data is not empty
          setTempData(result.data);
          setCsvHeaders(Object.keys(result.data[0] || {}));  // Extract CSV headers
      },
      error: (error) => {
          toast.error('Error parsing CSV file: ' + error.message);
      }
  });
};

// Restore the original student list
const handleDone = () => {
  setSelectedFile(null);
  setTempData([]);
  setCsvHeaders([]);
  document.querySelector('input[type="file"]').value = "";  // Clear file input
};

// Handle Saving Data to Redis
const handleSaveToRedis = async () => {
  if (!tempData.length) {
    toast.error("No data to save.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);  // Ensure the field name 'file' matches the backend

    const response = await axios.post(
      `${API_URL}/uploadCSV`,  // Ensure this matches your backend route
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do not set 'Content-Type' header manually here; axios will set it for us
        },
      }
    );

    toast.success("CSV data saved to Redis!");
    setTempData([]); // Clear temporary data after saving
  } catch (error) {
    console.error("Error in handleSaveToRedis:", error);
    toast.error("An error occurred while saving the CSV data.");
  }
};







  // Fetch residents based on search query
  const fetchResidents = async (search = "") => {
    try {
      const response = await axios.get(`${API_URL}/residents`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setResidents(response.data);
    } catch (error) {
      toast.error("Failed to fetch residents.");
    }
  };

  useEffect(() => {
    fetchResidents(searchQuery);
  }, [searchQuery, token]); // Fetch residents when the search query or token changes



// Function to calculate age based on birthdate
const calculateAge = (birthdate) => {
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Adjust age if the birthdate hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }

  return age;
};




   // Handle select individual resident
   const handleSelectResident = (id) => {
    if (selectedResident === id) {
      setSelectedResident(null); // Unselect if already selected
    } else {
      setSelectedResident(id); // Select the resident
    }
  };


  // Generate username based on the format: lastname.firstname.age
  const generateUsername = (resident) => {
    const age = calculateAge(resident.birthdate);  // Calculate age based on birthdate
    return `${resident.surname.toLowerCase()}.${resident.firstName.toLowerCase()}.${age}`;
  };
  
  // Handle Create Account for selected resident
  const handleCreateAccount = async () => {
    if (!selectedResident) {
      toast.error("Please select a resident.");
      return;
    }
  
    try {
      const resident = residents.find((r) => r.id === selectedResident);
      const username = generateUsername(resident); // Generate username
  
      const response = await axios.get(`${API_URL}/checkUsername/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.exists) {
        toast.error(`Username ${username} already exists.`);
        return;
      }
  
      // Prepare assignedResident data
      const assignedResident = {
        id: resident.id,
        surname: resident.surname,
        firstName: resident.firstName,
        middleName: resident.middleName,
        gender: resident.gender,
        birthdate: resident.birthdate,
        birthplace: resident.birthplace,
        purok: resident.purok,
        maritalStatus: resident.maritalStatus,
        totalHouseholdMembers: resident.totalHouseholdMembers,
        bloodType: resident.bloodType,
        occupation: resident.occupation,
        lengthOfStay: resident.lengthOfStay,
        monthlyIncome: resident.monthlyIncome,
      };
  
      // Send username, password, and assignedResident to backend to create the account with auto-approval
      await axios.post(
        `${API_URL}/register`,
        {
          username,
          password,
          isAdminCreated: true,
          assignedResident: assignedResident, // Include assigned resident data
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      toast.success(`Account for ${username} automatically approved and created successfully!`);
      setPassword(""); // Clear password input
      setSelectedResident(null); // Clear selection
      setShowCreateAccountModal(false); // Close modal
    } catch (error) {
      toast.error("Failed to create account.");
    }
  };


  const csvExportData = residents.map((resident) => ({
    id : resident.id,
    surname: resident.surname,
    firstName: resident.firstName,
    middleName: resident.middleName,
    gender: resident.gender,
    birthdate: resident.birthdate,
    birthplace: resident.birthplace,
    purok: resident.purok,
    maritalStatus: resident.maritalStatus,
    totalHouseholdMembers: resident.totalHouseholdMembers,
    bloodType: resident.bloodType,
    occupation: resident.occupation,
    lengthOfStay: resident.lengthOfStay,
    monthlyIncome: resident.monthlyIncome,
  }));
  
  const headers = [
    
    { label: "Surname", key: "surname" },
    { label: "First Name", key: "firstName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Gender", key: "gender" },
    { label: "Birthdate", key: "birthdate" },
    { label: "Birthplace", key: "birthplace" },
    { label: "Purok", key: "purok" },
    { label: "Marital Status", key: "maritalStatus" },
    { label: "Total Household Members", key: "totalHouseholdMembers" },
    { label: "Blood Type", key: "bloodType" },
    { label: "Occupation", key: "occupation" },
    { label: "Length of Stay", key: "lengthOfStay" },
    { label: "Monthly Income", key: "monthlyIncome" },
  ];


  

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/pendingUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(response.data); // Store the list of pending users in state
    } catch (error) {
      toast.error("Failed to fetch pending users.");
      console.error("Error fetching pending users:", error);
    }
  };

  

  useEffect(() => {
    fetchPendingUsers(); // Fetch pending users when component mounts or token changes
  }, [token]);

  // Handle approve user
  const handleApprove = async (username) => {
    try {
      await axios.put(`${API_URL}/approveUser/${username}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User approved successfully!");
      fetchPendingUsers(); // Refresh pending users list
    } catch (error) {
      toast.error("Failed to approve user.");
    }
  };

  // Handle reject user
  const handleReject = async (username) => {
    try {
      await axios.delete(`${API_URL}/rejectUser/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User rejected successfully!");
      fetchPendingUsers(); // Refresh pending users list
    } catch (error) {
      toast.error("Failed to reject user.");
    }
  };

  // Handle delete confirmation
  const confirmDelete = (id) => {
    setResidentIdToDelete(id);
    setShowDeleteResident(true);
  };


 // Users Modal (for user management)
 const UsersModal = ({ showModal, closeModal }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (showModal) {
      fetchUsers();
    }
  }, [showModal]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data); 
    } catch (error) {
      toast.error("Failed to fetch users.");
    }
  };


  // Handle assign user
const handleAssign = async (username) => {
  if (!selectedResident) {
    toast.error("Please select a resident to assign.");
    return;
  }

  try {
    const resident = residents.find((r) => r.id === selectedResident);

    // Call the backend API to assign this resident to a user by their username
    const response = await axios.put(`${API_URL}/assignResidentToUser`, {
      username: username, // Pass the username from the selected row
      residentId: resident.id,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Check if the response was successful
    if (response.status === 200) {
      toast.success("Resident assigned successfully!");

      // Update the UI state with assigned resident
      setAssignedResidents(prevState => ({
        ...prevState,
        [resident.id]: true,
      }));

      // Re-fetch users to reflect the changes
      fetchUsers();

      setShowUsersModal(false); // Close modal after assigning
    }
  } catch (error) {
    // Handle the case where the user is already assigned a resident
    if (error.response && error.response.status === 400) {
      toast.error("This user is already assigned.");
    } else {
      toast.error("Failed to assign resident.");
    }
  }
};
  // Handle delete user
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_URL}/deleteUser/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("User deleted successfully!");
        closeModal();
      } catch (error) {
        toast.error("Failed to delete user.");
      }
    }
  };

 









  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={() => closeModal()}>&times;</span>
        <h3>Manage Users</h3>
        <table>
          <thead>
            <tr>
            <th className="username-header1">Username</th>
            <th className="actions-header1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>
                <button
          className={`assign-action-btn1 ${user.isAssigned ? 'assigned' : ''}`}
          onClick={() => handleAssign(user.username)}
          disabled={user.isAssigned} // Disable if already assigned
        >
          {user.isAssigned ? 'Assigned' : 'Assign'}
        </button>
                <button className="delete-action-btn1" onClick={() => handleDelete(user.username)}>Delete</button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};








  return (
    <div>
      <h2>Resident List</h2>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search residents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}  // Update search query
      />
  
      



<button onClick={() => setShowUsersModal(true)}>Users</button>
      {showUsersModal && (
        <UsersModal
          showModal={showUsersModal}
          closeModal={() => setShowUsersModal(false)} 
        />
      )}


      {/* Button to trigger modal for adding a resident account */}
      <button onClick={() => setShowCreateAccountModal(true)}>
        Create Account for Selected Resident
        
      </button>
      

      {/* Modal for creating account */}
      {showCreateAccountModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowCreateAccountModal(false)}>&times;</span>
            <h3>Create Account for Selected Resident</h3>
            <input
               type={showPassword ? 'text' : 'password'}
              placeholder="Set Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update password input
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <button onClick={handleCreateAccount}>Create Account</button>
          </div>
        </div>
      )}



      

      <button className="add-resident-btn" onClick={() => setShowAddResident(true)}>
        Add Resident
      </button>

      {/* Button to show Pending Users modal */}
      <button className="pending-users-btn" onClick={() => setShowPendingModal(true)}>
        View Pending Users
      </button>
      
      <div className="upload-container">
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>


          <CSVLink
        data={csvExportData}
        headers={headers}
        filename="residents.csv"
        className="export-btn"
      >
        Export to CSV
      </CSVLink>


      {/* Modal for Pending Users */}
      {showPendingModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowPendingModal(false)}>&times;</span>
            <h3>Pending Users</h3>
            <table>
              <thead>
                <tr>
                <th className="username-column">Username</th>
                <th className="actions-column">Actions</th> {/* Removed Password column */}
                </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.username}>
                      <td className="username-column">{user.username}</td>
                      <td className="actions-column">
                        <button onClick={() => handleApprove(user.username)}>Approve</button>
                        <button onClick={() => handleReject(user.username)}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

              {tempData.length > 0 ? (
                <div>
                  <table>
                    <thead>
                      <tr>
                        {csvHeaders.map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                        
                      </tr>
                    </thead>
                    <tbody>
                    {tempData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {csvHeaders.map((header, colIndex) => (
                          <td key={colIndex}>
                               {row[header] || ''}
                            </td>
                          ))}
                          <td>
                          
                          
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={handleDone}>Done</button>
                  <button onClick={handleSaveToRedis}>Save CSV Data to Redis</button>

                </div>
              )
             : (

  




      <table>
        <thead>
          <tr>
            <th> </th>
            <th id="idColumn">ID</th>
            <th id="surnameColumn">Surname</th>
            <th id="firstNameColumn">First Name</th>
            <th id="middleNameColumn">Middle Name</th>
            <th id="genderColumn">Gender</th>
            <th id="birthdateColumn">Birthdate</th>
            <th id="ageColumn">Age</th>
            <th id="birthplaceColumn">Birthplace</th>
            <th id="purokColumn">Purok</th>
            <th id="maritalStatusColumn">Marital Status</th>
            <th id="totalHouseholdMembersColumn">Total Household Members</th>
            <th id="bloodTypeColumn">Blood Type</th>
            <th id="occupationColumn">Occupation</th>
            <th id="lengthOfStayColumn">Length of Stay (Months)</th>
            <th id="monthlyIncomeColumn">Monthly Income</th>
            <th id="actionsColumn">Actions</th>
          </tr>
        </thead>
        <tbody>
     
        {residents
  .sort((a, b) => {
    // Ensure both IDs are treated as strings for correct sorting (e.g., 2025-00001, 2025-00002)
    return a.id.localeCompare(b.id);
  })
  .map((resident) => (
            <tr key={resident.id}>
            <td>
              <input
                type="checkbox"
                checked={selectedResident === resident.id}
                onChange={() => handleSelectResident(resident.id)}
              />
            </td>
            <td>{resident.id}</td>
              <td>{resident.surname}</td>
              <td>{resident.firstName}</td> 
              <td>{resident.middleName}</td>
              <td>{resident.gender}</td>
              <td>{resident.birthdate} </td>
              <td>{calculateAge(resident.birthdate)}</td>
              <td>{resident.birthplace}</td>
              <td>{resident.purok}</td>
              <td>{resident.maritalStatus}</td>
              <td>{resident.totalHouseholdMembers}</td>
              <td>{resident.bloodType}</td>
              <td>{resident.occupation}</td>
              <td>{resident.lengthOfStay}</td>
              <td>{resident.monthlyIncome}</td>
              <td>
                <button
                  className="edit-btn"
                  onClick={() => {
                    setResidentIdToEdit(resident.id);
                    setShowEditResident(true);
                  }}
                >
                  Edit
                </button>
                <button className="delete-btn" onClick={() => confirmDelete(resident.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
            )}
      {/* Modals */}
      {showAddResident && (
        <AddResident
          API_URL={API_URL}
          token={token}
          fetchResidents={fetchResidents}
          closeAddResident={() => setShowAddResident(false)}
        />
      )}

      {showEditResident && (
        <EditResident
          API_URL={API_URL}
          token={token}
          fetchResidents={fetchResidents}
          closeEditResident={() => setShowEditResident(false)}
          residentId={residentIdToEdit}
        />
      )}

      {showDeleteResident && (
        <DeleteResident
          residentId={residentIdToDelete}
          onDeleteConfirm={() => {
            axios
              .delete(`${API_URL}/residents/${residentIdToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then(() => {
                toast.success("Resident deleted successfully!");
                fetchResidents(); // Refresh resident list after deletion
              })
              .catch(() => {
                toast.error("Error deleting resident.");
              });
            setShowDeleteResident(false);
          }}
          onCancel={() => setShowDeleteResident(false)}
        />
      )}
    </div>
  );
};

export default Residents;
