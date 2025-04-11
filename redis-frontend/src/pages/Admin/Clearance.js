import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from "jspdf";
const Clearance = ({ API_URL, token }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false); // Track loading state
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [assignedResident, setAssignedResident] = useState(null);
  // Fetch pending certificate requests from the backend
  const fetchPendingRequests = async () => {
    setLoading(true); // Set loading state to true before making the API call
    try {
      const response = await axios.get(`${API_URL}/admin/pendingCertificateRequests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(response.data); // Set the pending requests state from the backend
    } catch (error) {
      toast.error("Failed to fetch pending requests.");
    } finally {
      setLoading(false); // Set loading state to false after the request is completed
    }
  };

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

  useEffect(() => {
    fetchPendingRequests(); // Fetch pending requests when the component mounts
    
    // Set an interval to re-fetch every 5 seconds
    const intervalId = setInterval(() => {
      fetchPendingRequests();
    }, 5000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [token]);
   // Handle status update
   const handleStatusChange = async (certificateId, status) => {
    try {
      setLoading(true);
  
      // Log the status to make sure the correct value is being passed
      console.log('Updating status for certificateId:', certificateId, 'to status:', status);
  
      // Send the status update to the backend
      await axios.put(`${API_URL}/admin/updateCertificateStatus/${certificateId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update the status in the frontend immediately
      setPendingRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.certificateId === certificateId
            ? { ...request, status: status } // Update status in the frontend
            : request
        )
      );
  
      toast.success("Certificate status updated successfully!");
  
      // Only remove the certificate if the status is "Completed"
      if (status === 'Completed') {
        setPendingRequests((prevRequests) =>
          prevRequests.filter((request) => request.certificateId !== certificateId)
        );
        toast.success("User gets the document!");
      }
  
    } catch (error) {
      toast.error("Failed to update status.");
    } finally { 
      setLoading(false);
    }
  };


  const handleSelectResident = async (certificateId) => {
    const selectedRequest = pendingRequests.find(request => request.certificateId === certificateId);
    setSelectedCertificate(selectedRequest);
    try {
      const response = await axios.get(`${API_URL}/getAssignedResident/${selectedRequest.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedResident(response.data);
    } catch (error) {
      toast.error("Failed to fetch assigned resident.");
    }
  };

  const generateBarangayClearancePDF = (userData) => {
    const { fullName, purok, dateIssued } = userData;
    const doc = new jsPDF();
  
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Republic of the Philippines", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.text("BARANGAY MAINIT", 10, 30);
    doc.text("Iligan City", 10, 40);
  
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("B A R A N G A Y  C L E A R A N C E", 10, 60);
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`This is to certify that `, 10, 80);
    
    // Make the full name bold
    doc.setFont("helvetica", "bold");
    doc.text(fullName, 10, 90);
    
    doc.setFont("helvetica", "normal");
  
    // Wrapping text to prevent cut-off
    const addressText = `with residence and postal address at Purok ${purok}, Barangay Mainit, Iligan City has no derogatory record filed in our Barangay Office.`;
    const wrappedAddressText = doc.splitTextToSize(addressText, 180);  // 180 is the maximum width
    doc.text(wrappedAddressText, 10, 100);
  
    const characterText = "The above-mentioned individual who is a bonafide resident of this barangay is a person of a good moral character, peace-loving and civic-minded citizen.";
    const wrappedCharacterText = doc.splitTextToSize(characterText, 180);  // 180 is the maximum width
    doc.text(wrappedCharacterText, 10, 120);
  
    const certificationText = "This certification is hereby issued in connection with the subject application for the reason and for whatever legal purpose it may serve him/her best, and is valid for six (6) months from the date issued.";
    const wrappedCertificationText = doc.splitTextToSize(certificationText, 180);  // 180 is the maximum width
    doc.text(wrappedCertificationText, 10, 140);
  
    doc.setFont("helvetica", "bold");
    doc.text("NOT VALID WITHOUT OFFICIAL SEAL.", 10, 160);
  
    doc.setFont("helvetica", "normal");
    doc.text(`Date Issued: ${dateIssued}`, 10, 180);
  
    doc.text("__________________________", 10, 200);
    doc.text("Ramon Cabili", 10, 210);
    doc.text("Barangay Captain", 10, 220);
  
    doc.text("Signature of Applicant", 10, 240);
    doc.text("__________", 10, 250);
  
    doc.save("Brgy_Clearance.pdf");
  };


  const generateGuardianDocumentPDF = (userData) => {
    const { fullName, childName, purok,relationship, dateIssued } = userData;
    if (!fullName || !childName || !relationship ) {
      toast.error("Missing required information to generate the document.");
      return;
    }
    const doc = new jsPDF();
  
    // Set document properties
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Republic of the Philippines", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.text("BARANGAY MAINIT", 10, 30);
    doc.text("Iligan City", 10, 40);
  
    // Add title
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("B A R A N G A Y  G U A R D I A N S H I P  C E R T I F I C A T E", 10, 60);
  
    // Add applicant details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`This is to certify that `, 10, 80);
  
    // Make the full name bold
    doc.setFont("helvetica", "bold");
    doc.text(fullName, 10, 90);
  
    doc.setFont("helvetica", "normal");
  
   
     // Wrapping text to prevent cut-off
     const addressText = `with residence and postal address at Purok ${purok}, Barangay Mainit, Iligan City has no derogatory record filed in our Barangay Office.`;
     const wrappedAddressText = doc.splitTextToSize(addressText, 180);  // 180 is the maximum width
     doc.text(wrappedAddressText, 10, 110);
    
    const relationshipText =  `is the legal guardian and ${relationship} of  ${childName}.`;
    const wrappedRelationshipText = doc.splitTextToSize(relationshipText, 180); // 180 is the maximum width
    doc.text(wrappedRelationshipText, 10, 100);
  
    // Add date issued
    doc.text(`Date Issued: ${dateIssued}`, 10, 120);
  
    // Add signature lines
    doc.text("__________________________", 10, 140);
    doc.text("Signature of Guardian", 10, 150);
  
    doc.text("__________________________", 100, 140);
    doc.text("Barangay Captain", 100, 150);
  
    // Save the PDF
    doc.save("Brgy_Guardianship_Certificate.pdf");
  };

  return (
    <div style={{ marginLeft: '220px', padding: '20px' }}>
      <h2>Pending Certificate Requests</h2>
      <p>Below are the certificate requests that are pending approval.</p>

      {loading && <p>Loading...</p>}
      <table className="certificates-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Certificate ID</th>
            <th>Requester Username</th>
            <th>Certificate Type</th>
            <th>Details</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingRequests.length > 0 ? (
            [...pendingRequests]
              .sort((a, b) => b.certificateId - a.certificateId) // DESCENDING
              .map((request) => (
                <tr key={request.certificateId}>
                  <td>
                    <input
                      type="radio"
                      name="selectCertificate"
                      value={request.certificateId}
                      onChange={() => handleSelectResident(request.certificateId)}
                    />
                  </td>
                  <td>{request.certificateId}</td>
                  <td>{request.username}</td>
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
                    <select
                      onChange={(e) => handleStatusChange(request.certificateId, e.target.value)}
                      value={request.status}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Ready for pick-up">Ready for pick-up</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="7">No pending requests.</td>
            </tr>
          )}
        </tbody>
      </table>

      <button
  className="generate-document-btn"
  onClick={() => {
    if (assignedResident && selectedCertificate) {
      const commonData = {
        fullName: `${assignedResident.firstName} ${assignedResident.surname}`,
        purok: assignedResident.purok,
        dateIssued: new Date().toLocaleDateString(),
      };

      switch (selectedCertificate.certificateType) {
        case 'barangayClearance':
          generateBarangayClearancePDF(commonData);
          break;
        case 'barangayGuardianship':
          generateGuardianDocumentPDF({
            ...commonData,
            childName: selectedCertificate.childName,
            relationship: selectedCertificate.relationship,
          });
          break;
       
       
        default:
          toast.error("Unsupported certificate type.");
          break;
      }
    } else {
      toast.error("No resident or certificate selected.");
    }
  }}
  style={{
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  }}
>
  Generate Document
</button>
    
    </div>
  );
};

export default Clearance;
