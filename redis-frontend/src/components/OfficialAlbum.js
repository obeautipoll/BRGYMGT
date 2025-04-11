import React from 'react';
import './OfficialAlbum.css';  // Add your custom CSS for album styling

const OfficialAlbum = ({ officials }) => {
  return (
    <div className="official-album">
      <h3>Official Album</h3>
      <div className="album-container">
        {officials.map((official) => (
          <div className="album-card" key={official.id}>
            <div className="photo-container">
              {official.photo ? (
                <img
                  src={`http://localhost:5000/${official.photo}`}
                  alt={official.name}
                  className="official-photo"
                />
              ) : (
                <div className="no-photo">No Image</div>
              )}
            </div>
            <div className="official-info">
              <h4>{official.name}</h4>
              <p>{official.position}</p>
              <p>{official.age} years old</p>
              <p>{official.contactNo}</p>
              <p>{official.description}</p> {/* Corrected the typo here */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficialAlbum;
