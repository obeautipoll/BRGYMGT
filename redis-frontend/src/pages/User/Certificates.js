import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './Certificates.css';  // Assuming you've added the necessary styles in this CSS file

const Certificates = ({ API_URL, token }) => {
  const [formData, setFormData] = useState({
    certificateType: '',
    childName: '',
    relationship: '',
    deadName: '',
    deadAge: '',
    fatherOrMother: '',
  });

  const [submittedRequests, setSubmittedRequests] = useState([]); // State to store multiple requests
  const [loading, setLoading] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  // Mapping object to convert certificate type value to human-readable name
  const certificateTypeNames = {
    barangayClearance: 'Barangay Clearance',
    barangayIndigency: 'Barangay Indigency Certificate',
    barangayResidency: 'Barangay Residency Certificate',
    barangayGoodMoral: 'Barangay Good Moral Certificate',
    barangayGuardianship: 'Barangay Certificate of Guardianship',
    barangaySoloParent: 'Barangay Solo Parent Certification',
    barangayFinancialAssistance: 'Barangay Certificate for Financial Assistance',
    barangayDeath: 'Barangay Certificate of Death',
  };

  // Fetch certificate requests for the user from the backend
  const fetchSubmittedRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmittedRequests(response.data.certificates);  // Set the submitted requests state from the backend
    } catch (error) {
      toast.error("Failed to fetch submitted requests.");
    }
  };






  useEffect(() => {
    fetchSubmittedRequests();  // Fetch submitted requests when the component mounts
  }, [token]);  // Use token as a dependency to refetch when the token changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCertificateChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      certificateType: value,
      childName: '',
      relationship: '',
      deadName: '',
      deadAge: '',
      fatherOrMother: '',
    }));
  };


  // Handle the cancellation of the certificate request
  const handleCancel = async (certificateId) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        setLoading(true);
        await axios.put(`${API_URL}/user/certificate/cancel/${certificateId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Certificate request canceled!");
        fetchSubmittedRequests(); // Refresh the list of submitted requests
      } catch (error) {
        toast.error("Failed to cancel certificate request.");
      } finally {
        setLoading(false);
      }
    }
  };




  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields based on certificate type
    if (!formData.certificateType) {
      toast.error('Please select a certificate type');
      return;
    }

    const certificateRequest = {
      certificateType: formData.certificateType,
      status: 'Pending',
      childName: formData.childName || '',
      relationship: formData.relationship || '',
      deadName: formData.deadName || '',
      deadAge: formData.deadAge || '',
      fatherOrMother: formData.fatherOrMother || '',
    };

    // Ensure the required fields for each certificate type are filled in
    const type = formData.certificateType;

if (type === 'barangayGuardianship' && (!formData.childName || !formData.relationship)) {
  toast.error('Please fill in child name and relationship');
  return;
}

if (type === 'barangaySoloParent' && (!formData.childName || !formData.fatherOrMother)) {
  toast.error('Please fill in child name and father or mother');
  return;
}

if (type === 'barangayDeath' && (!formData.deadName || !formData.deadAge)) {
  toast.error('Please fill in deceased name and age');
  return;
}

    // Send the certificate request to the backend
    axios.post(`${API_URL}/user/requestCertificate`, certificateRequest, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        toast.success('Certificate request submitted successfully!');

        // Refresh the list of submitted requests
        fetchSubmittedRequests();
        setFormData({
          certificateType: '',
          childName: '',
          relationship: '',
          deadName: '',
          deadAge: '',
          fatherOrMother: '',
        });
      })
      .catch(() => {
        toast.error('Failed to submit certificate request.');
      });
  };

  const certificatePrices = {
    barangayClearance: 100,
    barangayIndigency: 20,
    barangayResidency: 50,
    barangayGoodMoral: 50,
    barangayGuardianship: 50,
    barangaySoloParent: 50,
    barangayFinancialAssistance: 20,
    barangayDeath: 50,
  };



// Modal for Document Prices
const closeModal = () => {
  setIsModalOpen(false);
};




  return (
    <div className="certificates-container">
      <h3>Request Certificate</h3>

 {/* Disclaimer */}
 <p className="disclaimer">
        ⚠️ Please double-check your request because once processed, it cannot be canceled! You'll be held accountable, so make sure everything is correct. 🚫
      </p>

      <button onClick={() => setIsModalOpen(true)} className="view-prices-btn">
        View Document Prices
      </button>



      <form onSubmit={handleSubmit}>
        <div>
          <label>Choose Certificate Type</label>
          <select
            name="certificateType"
            value={formData.certificateType}
            onChange={handleCertificateChange}
            required
          >
            <option value="">Select Certificate</option>
            <option value="barangayClearance">Barangay Clearance</option>
            <option value="barangayIndigency">Barangay Indigency Certificate</option>
            <option value="barangayResidency">Barangay Residency Certificate</option>
            <option value="barangayGoodMoral">Barangay Good Moral Certificate</option>
            <option value="barangayGuardianship">Barangay Certificate of Guardianship</option>
            <option value="barangaySoloParent">Barangay Solo Parent Certification</option>
            <option value="barangayFinancialAssistance">Barangay Certificate for Financial Assistance</option>
            <option value="barangayDeath">Barangay Certificate of Death</option>
          </select>
        </div>

        {/* Conditional Inputs Based on the Selected Certificate */}
        {formData.certificateType === 'barangayGuardianship' && (
          <div>
            <label>Child's Name</label>
            <input
              type="text"
              name="childName"
              placeholder="Child's Name"
              value={formData.childName}
              onChange={handleChange}
              required
            />
            <label>Relationship</label>
            <input
              type="text"
              name="relationship"
              placeholder="Relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {formData.certificateType === 'barangaySoloParent' && (
          <div>
            <label>Child's Name</label>
            <input
              type="text"
              name="childName"
              placeholder="Child's Name"
              value={formData.childName}
              onChange={handleChange}
              required
            />
            <label>Father or Mother</label>
            <input
              type="text"
              name="fatherOrMother"
              placeholder="Father or Mother"
              value={formData.fatherOrMother}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {formData.certificateType === 'barangayDeath' && (
          <div>
            <label>Deceased Person's Name</label>
            <input
              type="text"
              name="deadName"
              placeholder="Deceased Person's Name"
              value={formData.deadName}
              onChange={handleChange}
              required
            />
            <label>Age of Deceased</label>
            <input
              type="number"
              name="deadAge"
              placeholder="Age of Deceased"
              value={formData.deadAge}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
        <button type="submit" name="submitButton" className="submit-btn">Submit</button>
      </form>

      {/* Display the submitted certificate request details in a table */}
      {submittedRequests.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Submitted Certificate Requests</h4>
          <table className="certificates-table">
  <thead>
    <tr>
      <th>Certificate Type</th>
      <th>Details</th>
      <th>Status</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {submittedRequests.map((request, index) => (
      <tr key={index}>
        <td>{certificateTypeNames[request.certificateType]}</td>
        <td>
          {(() => {
            switch (request.certificateType) {
              case 'barangayGuardianship':
                return `Child: ${request.childName}, Relationship: ${request.relationship}`;
              case 'barangaySoloParent':
                return `Child: ${request.childName}, Parent: ${request.fatherOrMother}`;
              case 'barangayDeath':
                return `Deceased: ${request.deadName}, Age: ${request.deadAge}`;
              default:
                return 'N/A';
            }
          })()}
        </td>
        <td>{request.status}</td>
        <td>
          {request.status === 'Pending' && (
            <button
              onClick={() => handleCancel(request.certificateId)}
              disabled={loading}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
        </div>
      )}
    {/* Modal for Document Prices */}
    {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Document Prices</h2>
            <p>Please double-check the certificate prices below:</p>
            <ul>
              {Object.keys(certificatePrices).map((key) => (
                <li key={key}>
                  <strong>{certificateTypeNames[key]}</strong>: ₱{certificatePrices[key]}
                </li>
              ))}
            </ul>
            <button onClick={closeModal} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Certificates;
