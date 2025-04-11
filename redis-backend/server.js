
const express = require('express');
const redis = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 5000;
const fs = require('fs');
const csv = require('csv-parser');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const uploadFolder = path.join(__dirname, 'uploads/csvsaved');



// Ensure the folder exists and has proper permissions
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });  // Create folder if it doesn't exist
  console.log('Created folder:', uploadFolder);
} else {
  console.log('Folder already exists:', uploadFolder);
}



const API_URL = "http://localhost:5000";
// Redis Client
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://@127.0.0.1:6379'
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/officials/'); // Folder to save the uploaded images
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Ensure unique filenames
    }
  });


  const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadFolder); // Folder to save the uploaded CSV files
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Ensure unique filenames
    }
  });

  const uploadCSV = multer({
    storage: csvStorage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'), false);
      }
    }
  });


client.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Redis connection error:', err));


// Utility Function
const handleServerError = (res, error, message = 'Internal Server Error') => {
    console.error(error);
    return res.status(500).json({ message: message, error: error.message });
};
const validateResidentData = (data) => {
    // List of mandatory fields
    const requiredFields = ['surname', 'firstName', 'middleName', 'gender', 'birthdate', 'birthplace', 'purok', 'maritalStatus', 'bloodType', 'occupation', 'lengthOfStay', 'monthlyIncome'];

    for (let field of requiredFields) {
        if (!data[field]) {
            throw new Error(`The ${field} field is required.`);
        }
    }

    if (isNaN(parseInt(data.lengthOfStay))) {
        throw new Error('Length of Stay must be a number.');
    }

    // Validate that the monthly income is a valid option
    const validIncomeRanges = [
        'Less Than 5000',
        '5000 To 10000',
        '10000 To 20000',
        '20000 To 50000',
        '50000 To 100000',
        'More Than 100000'
    ];

    if (!validIncomeRanges.includes(data.monthlyIncome)) {
        throw new Error('Invalid monthly income range.');
    }

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(data.bloodType)) {
        throw new Error('Invalid blood type.');
    }

    return data;
};

const validateOfficialData = (data) => {
    // List of mandatory fields for officials
    const requiredFields = ['name', 'age', 'position', 'description', 'contactNo'];

    for (let field of requiredFields) {
        if (!data[field]) {
            throw new Error(`The ${field} field is required.`);
        }
    }

    // Ensure the age is a valid number
    if (isNaN(parseInt(data.age))) {
        throw new Error('Age must be a number.');
    }

    // Ensure the contact number is a valid string (basic check)
    if (!/^\d{10}$/.test(data.contactNo)) {
        throw new Error('Contact Number must be a 10-digit number.');
    }

    // Ensure the position is one of the allowed positions
    const validPositions = [
        'Barangay Captain',
        'Barangay Councilor',
        'Barangay Secretary',
        'Barangay Treasurer',
        'Barangay Police Officer',
        'Sangguniang Kabataan Chairperson',
        'Sangguniang Kabataan Council',
        'Sangguniang Kabataan Secretary',
        'Sangguniang Kabataan Treasurer',
        'Peacekeeping Committee'
    ];
    if (!validPositions.includes(data.position)) {
        throw new Error('Invalid position.');
    }

    return data;
};


// Function to calculate age based on birthdate
const calculateAge = (birthdate) => {
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate)) {
    console.log('Invalid birthdate:', birthdate);  // Log invalid date for debugging
    return null;  // Return null if the birthdate is invalid
  }

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Adjust age if the birthdate hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }

  return age;
};
const upload = multer({ storage });

// --- User Authentication ---

// Initialize default admin account
const initializeAdmin = async () => {
    try {
        const existingAdmin = await client.hGetAll('user:lrnblss');
        if (Object.keys(existingAdmin).length === 0) {
            const hashedPassword = await bcrypt.hash('blissnisnisan', 10);
            await client.hSet('user:lrnblss', 'password', hashedPassword);
            await client.hSet('user:lrnblss', 'role', 'admin');
            await client.hSet('user:lrnblss', 'status', 'approved');
            console.log('-----');
        }
    } catch (error) {
        console.error('Failed to initialize admin account:', error);
    }
};


// Call initialization function
initializeAdmin();



// Register Endpoint
app.post('/register', async (req, res) => {
  const { username, password, isAdminCreated, assignedResident } = req.body;  // Add 'assignedResident' to allow assigning a resident

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Log the username to ensure it's being passed correctly
  console.log("Received username:", username);

  // Validate the username
  if (typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ message: 'Invalid username' });
  }

  try {
    // Check if the username already exists
    const existingUser = await client.hGetAll(`user:${username}`);
    if (Object.keys(existingUser).length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    // Set user status based on the source of registration
    const userStatus = isAdminCreated ? 'approved' : 'pending';

    // Store user info into Redis (ensure key is constructed properly)
    console.log(`Storing user data for user: ${username}`);
    await client.hSet(`user:${username}`, 'password', hashedPassword);
    await client.hSet(`user:${username}`, 'role', 'user');
    await client.hSet(`user:${username}`, 'status', userStatus);

    // If the admin is creating the account, assign a resident if provided
    if (assignedResident) {
      // Save the assigned resident data (if provided)
      await client.hSet(`user:${username}`, 'assignedResident', JSON.stringify(assignedResident));
    }

    res.status(201).json({ message: `User registered successfully. Status: ${userStatus}.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
});


  

// Login Endpoint

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
      const user = await client.hGetAll(`user:${username}`);

      if (Object.keys(user).length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is approved
      if (user.status !== 'approved') {
          return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin confirmation.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set loggedIn to true in Redis after successful login
      await client.hSet(`user:${username}`, 'loggedIn', 'true');

      // Get assigned resident details if available
      const assignedResident = user.assignedResident ? JSON.parse(user.assignedResident) : null;

      // Store username in Redis with 'loggedIn' as true
      await client.hSet(`user:${username}`, 'username', username);

      // Generate JWT token
      const token = jwt.sign(
          { username: username, role: user.role, assignedResident: assignedResident },
          JWT_SECRET,
          { expiresIn: '1h' }
      );

      res.json({ token, role: user.role, assignedResident: assignedResident });
  } catch (error) {
      handleServerError(res, error, 'Failed to login');
  }
});



// --- Authentication Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];


  if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
  }


  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
          return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
  });
};





// --- Authorization Middleware ---
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized: insufficient role' });
        }
        next();
    };
};

// Check if username exists
app.get('/checkUsername/:username', authenticate, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await client.hGetAll(`user:${username}`);
  
      if (Object.keys(user).length > 0) {
        return res.json({ exists: true }); // Username exists
      }
  
      res.json({ exists: false }); // Username does not exist
    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({ message: 'Failed to check username' });
    }
  });

// --- User Management (Admin only) ---

// Get pending users (users who are waiting for approval)
// Get pending users
app.get('/pendingUsers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const keys = await client.keys('user:*');
    const userKeys = keys.filter(key => key.split(':').length === 2);
    const pendingUsers = [];
    
    for (const key of userKeys) {
      const userData = await client.hGetAll(key);
      if (userData.status === 'pending') {
        pendingUsers.push({
          username: key.split(':')[1],
          role: userData.role
        });
      }
    }


      res.json(pendingUsers);
  } catch (error) {
      handleServerError(res, error, 'Failed to retrieve pending users');
  }
});

// Get all users who have successfully logged in and check if they have been assigned
app.get('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const keys = await client.keys('user:*');
    const userKeys = keys.filter(key => key.split(':').length === 2);
    const users = [];
    
    for (const key of userKeys) {
      const userData = await client.hGetAll(key);
      const username = key.split(':')[1];
      // Check if the user has successfully logged in and exclude 'lrnblss'
      if (userData.loggedIn === 'true' && username !== 'lrnblss') {
        // Check if the user has an assigned resident
        const isAssigned = userData.assignedResident ? true : false; // Check assignedResident field
        
        users.push({
          username: username,  // Add the username to the list
          role: userData.role,
          status: userData.status,
          isAssigned: isAssigned,  // Add isAssigned field to the user object
        });
      }
    }

    res.json(users);  // Return the filtered list of users
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});


//assignlibog2lang
// Fetch assigned resident details based on username
app.get('/getAssignedResident/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch assignedResident for the username
    const assignedResident = await client.hGet(`user:${username}`, 'assignedResident');

    if (!assignedResident) {
      return res.status(404).json({ message: 'Assigned resident not found' });
    }

    // Parse the JSON stored in Redis and send the data back
    res.json(JSON.parse(assignedResident));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assignedResident' });
  }
});






// Delete user
app.delete('/deleteUser/:username', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { username } = req.params;  // Use 'username' instead of 'userId'

    // Check if the user exists in Redis
    const userExists = await client.exists(`user:${username}`);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Perform the delete action
    await client.del(`user:${username}`);
    res.status(200).json({ message: `User ${username} deleted successfully.` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

//Assign
app.put('/assignUser/:username', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { username } = req.params;
    const { residentId } = req.body; // Pass residentId from the frontend

    // Fetch the resident data using residentId
    const resident = await client.hGetAll(`resident:${residentId}`);
    
    // Check if the resident exists
    if (Object.keys(resident).length === 0) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Store assigned resident data in the user profile
    await client.hSet(`user:${username}`, 'assignedResident', JSON.stringify(resident));

    res.status(200).json({ message: `Resident assigned successfully to ${username}` });
  } catch (error) {
    console.error('Error assigning user:', error);
    res.status(500).json({ message: 'Failed to assign user', error: error.message });
  }
});



// Approve user
app.put('/approveUser/:username', authenticate, authorize(['admin']), async (req, res) => {
    const { username } = req.params;
   
    try {
        const user = await client.hGetAll(`user:${username}`);
       
        if (Object.keys(user).length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
       
        await client.hSet(`user:${username}`, 'status', 'approved');
       
        res.json({ message: 'User approved successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to approve user');
    }
});


// Reject user
app.delete('/rejectUser/:username', authenticate, authorize(['admin']), async (req, res) => {
    const { username } = req.params;
   
    try {
        const user = await client.hGetAll(`user:${username}`);
       
        if (Object.keys(user).length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
       
        await client.del(`user:${username}`);
       
        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to reject user');
    }
});


// --- Staff Management (Admin only) ---


// Create staff
app.post('/staff', authenticate, authorize(['admin']), async (req, res) => {
    const { username, password, name, position } = req.body;


    if (!username || !password || !name || !position) {
        return res.status(400).json({ message: 'All fields are required' });
    }


    try {
        // Check if the username already exists
        const existingUser = await client.hGetAll(`user:${username}`);
        if (Object.keys(existingUser).length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
       
        // Create staff user account
        await client.hSet(`user:${username}`, 'password', hashedPassword);
        await client.hSet(`user:${username}`, 'role', 'staff');
        await client.hSet(`user:${username}`, 'status', 'approved');
       
        // Create staff profile
        const staffId = Date.now().toString();
        await client.hSet(`staff:${staffId}`,
            'username', username,
            'name', name,
            'position', position,
            'createdAt', new Date().toISOString()
        );


        res.status(201).json({ message: 'Staff created successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to create staff');
    }
});


// Get all staff
app.get('/staffs', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const keys = await client.keys('staff:*');
        let staffs = await Promise.all(keys.map(async (key) => {
            const staffData = await client.hGetAll(key);
            return { id: key.split(':')[1], ...staffData };
        }));


        res.json(staffs);
    } catch (error) {
        handleServerError(res, error, 'Failed to retrieve staffs');
    }
});


// Update staff
app.put('/staff/:id', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    const { name, position } = req.body;
   
    try {
        const staff = await client.hGetAll(`staff:${id}`);
       
        if (Object.keys(staff).length === 0) {
            return res.status(404).json({ message: 'Staff not found' });
        }
       
        if (name) await client.hSet(`staff:${id}`, 'name', name);
        if (position) await client.hSet(`staff:${id}`, 'position', position);
       
        res.json({ message: 'Staff updated successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to update staff');
    }
});


// Delete staff
app.delete('/staff/:id', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
   
    try {
        const staff = await client.hGetAll(`staff:${id}`);
       
        if (Object.keys(staff).length === 0) {
            return res.status(404).json({ message: 'Staff not found' });
        }
       
        // Delete staff user account
        await client.del(`user:${staff.username}`);
       
        // Delete staff profile
        await client.del(`staff:${id}`);
       
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to delete staff');
    }
});


// --- Resident CRUD Operations (with RBAC) ---

// POST /residents (Admin only)

app.post('/residents', authenticate, authorize(['admin']), async (req, res) => {
  try {
      console.log('Received resident data:', req.body);  // 🔍 Log received data

      // Validate the resident data using the updated validation function
      const residentData = validateResidentData(req.body);

      // Generate ID based on the current year and an incrementing number (e.g., 2025-00001)
      const year = new Date().getFullYear();
      
      // Redis Transaction
      const transaction = client.multi();

      // Increment the resident ID counter
      transaction.incr('residentIdCounter');

      // Execute the transaction to increment the counter atomically
      const [newId] = await transaction.exec();

      // Generate the final resident ID
      const residentId = `${year}-${String(newId).padStart(5, '0')}`;
      residentData.id = residentId;  // Set the generated ID

      // Save the resident data to the database
      for (const key in residentData) {
          await client.hSet(`resident:${residentData.id}`, key, residentData[key]);
      }

      // Respond with a success message and the generated ID
      res.status(201).json({ message: 'Resident saved successfully', id: residentData.id });
  } catch (error) {
      console.error('Error saving resident:', error);
      res.status(500).json({ message: 'Failed to save resident', error: error.message });
  }
});


// GET /residents (All users)
app.get('/residents', authenticate, async (req, res) => {
  try {
      console.log("Fetching residents from Redis..."); // Debug log
      const { search } = req.query;
      console.log("Search term:", search);


      const keys = await client.keys('resident:*');
      console.log("Keys found:", keys); // Debug log


      let residents = await Promise.all(keys.map(async (key) => {
          const residentData = await client.hGetAll(key);
          console.log(`Resident Data for ${key}:`, residentData); // Debug log
          return { id: key.split(':')[1], ...residentData };
      }));


      if (search) {
          residents = residents.filter(resident =>
              Object.values(resident).some(value =>
                  String(value).toLowerCase().includes(search.toLowerCase())
              )
          );
      }


      res.json(residents);
  } catch (error) {
      handleServerError(res, error, 'Failed to retrieve residents');
  }
});


// GET /residents/:id (All users)
app.get('/residents/:id', authenticate, async (req, res) => {
  const id = req.params.id;

  try {
      // Attempt to get resident data from Redis
      const resident = await client.hGetAll(`resident:${id}`);

      // Check if the resident data exists
      if (Object.keys(resident).length === 0) {
          return res.status(404).json({ message: 'Resident not found' });
      }

      // Return the resident data if found
      res.json(resident);
  } catch (error) {
      // Catch any Redis-related or unexpected errors and log them
      console.error('Error retrieving resident data:', error);
      res.status(500).json({ message: 'Failed to retrieve resident data', error: error.message });
  }
});

// PUT /residents/:id (Admin only)
app.put('/residents/:id', authenticate, authorize(['admin']), async (req, res) => {
  const id = req.params.id;
  try {
      const updateData = req.body;


      const existingResident = await client.hGetAll(`resident:${id}`);
      if (Object.keys(existingResident).length === 0) {
          return res.status(404).json({ message: 'Resident not found' });
      }


      for (const key in updateData) {
          try {
              await client.hSet(`resident:${id}`, key, updateData[key]);
          } catch (redisError) {
              return res.status(500).json({ message: `Failed to update field ${key}`, error: redisError.message });
          }
      }


      res.status(200).json({ message: 'Resident updated successfully' });
  } catch (error) {
      handleServerError(res, error, 'Failed to update resident');
  }
});

// DELETE /residents/:id (Admin only)
app.delete('/residents/:id', authenticate, authorize(['admin']), async (req, res) => {
    const id = req.params.id;
    console.log(`Attempting to delete resident with ID: ${id}`);


    try {
        // Fetch the resident data from Redis
        const resident = await client.hGetAll(`resident:${id}`);
        console.log('Resident data fetched:', resident);


        if (Object.keys(resident).length === 0) {
            console.log('Resident not found');
            return res.status(404).json({ message: 'Resident not found' });
        }


        // Delete the resident from Redis
        await client.del(`resident:${id}`);
        console.log(`Resident with ID: ${id} deleted successfully`);
       
        res.status(200).json({ message: 'Resident deleted successfully' });
    } catch (error) {
        console.error('Error deleting resident:', error);
        res.status(500).json({ message: 'Failed to delete resident', error: error.message });
    }
});
      


//FOR OFFICIAL KAPOY NAKO
app.post('/officials', authenticate, authorize(['admin']), upload.single('photo'), async (req, res) => {
  try {
      console.log('Received official data:', req.body);  // 🔍 Log received data
  
      const officialData = req.body;
  
      // If a photo is uploaded, add the file path to the official data
      if (req.file) {
        officialData.photo = req.file.path;  // Store the file path in the officialData
      }
  
      // Validate the official data using the validation function
      const validatedOfficialData = validateOfficialData(officialData);
  
      // Generate ID based on the current year and an incrementing number (e.g., 2025-00001)
      const year = new Date().getFullYear();
      
      // Redis Transaction to ensure atomic increment
      const transaction = client.multi();
      
      // Increment the official ID counter atomically
      transaction.incr('officialIdCounter');
      
      // Execute the transaction
      const [newId] = await transaction.exec();

      // Generate the final official ID using the incremented counter
      const officialId = `${year}-${String(newId).padStart(3, '0')}`;
      validatedOfficialData.id = officialId;  // Set the generated ID
  
      // Save the official data to the database (Redis)
      for (const key in validatedOfficialData) {
          await client.hSet(`official:${validatedOfficialData.id}`, key, validatedOfficialData[key]);
      }
  
      // Respond with a success message and the generated ID
      res.status(201).json({ message: 'Official saved successfully', id: validatedOfficialData.id });
  } catch (error) {
      console.error('Error saving official:', error);
      res.status(500).json({ message: 'Failed to save official', error: error.message });
  }
});


// PUT /officials/:id (Admin only)
app.put('/officials/:id', authenticate, authorize(['admin']), async (req, res) => {
    const id = req.params.id;  // Get the official's ID from the URL parameters
    try {
        const updateData = req.body;  // Get the updated official data from the request body

        // Fetch the official data using the official ID
        const existingOfficial = await client.hGetAll(`official:${id}`);
        
        // If the official doesn't exist, return a 404 error
        if (Object.keys(existingOfficial).length === 0) {
            return res.status(404).json({ message: 'Official not found' });
        }

        // Iterate through the updateData and update each field in the Redis store
        for (const key in updateData) {
            try {
                await client.hSet(`official:${id}`, key, updateData[key]);
            } catch (redisError) {
                // Handle any errors during the update process for each field
                return res.status(500).json({ message: `Failed to update field ${key}`, error: redisError.message });
            }
        }

        // Respond with a success message after the update
        res.status(200).json({ message: 'Official updated successfully' });
    } catch (error) {
        // Handle any errors that occur in the try block
        handleServerError(res, error, 'Failed to update official');
    }
});


// GET /officials/:id (All users)
app.get('/officials/:id', authenticate, async (req, res) => {
    const id = req.params.id; // Get the official's ID from the URL parameters

    try {
        // Fetch official data from Redis using the official ID
        const official = await client.hGetAll(`official:${id}`);

        // If the official is not found, return a 404 error
        if (Object.keys(official).length === 0) {
            return res.status(404).json({ message: 'Official not found' });
        }

        // Return the official's data as JSON
        res.json(official);
    } catch (error) {
        // Handle any server errors
        handleServerError(res, error, 'Failed to retrieve official');
    }
});


// GET /officials (All users)
app.get('/officials', authenticate, async (req, res) => {
    try {
        console.log("Fetching officials from Redis..."); // Debug log
        const { search } = req.query;
        console.log("Search term:", search);

        const keys = await client.keys('official:*');
        console.log("Keys found:", keys); // Debug log

        let officials = await Promise.all(keys.map(async (key) => {
            const officialData = await client.hGetAll(key);
            console.log(`Official Data for ${key}:`, officialData); // Debug log
            return { name: key.split(':')[1], ...officialData }; // Use name as unique identifier
        }));

        if (search) {
            officials = officials.filter(official =>
                Object.values(official).some(value =>
                    String(value).toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        res.json(officials);
    } catch (error) {
        handleServerError(res, error, 'Failed to retrieve officials');
    }
});

app.delete('/officials/:id', authenticate, authorize(['admin']), async (req, res) => {
    const id = req.params.id;
    console.log(`Attempting to delete official with ID: ${id}`);

    try {
        // Fetch the official data from Redis
        const official = await client.hGetAll(`official:${id}`);
        console.log('Official data fetched:', official);

        if (Object.keys(official).length === 0) {
            console.log('Official not found');
            return res.status(404).json({ message: 'Official not found' });
        }

        // Delete the official from Redis
        await client.del(`official:${id}`);
        console.log(`Official with ID: ${id} deleted successfully`);
       
        res.status(200).json({ message: 'Official deleted successfully' });
    } catch (error) {
        console.error('Error deleting official:', error);
        res.status(500).json({ message: 'Failed to delete official', error: error.message });
    }
});

  // --- Announcemetns ---

// POST /announcements (Admin only)
app.post('/announcements', authenticate, authorize(['admin']), async (req, res) => {
    try {
        console.log('Received announcement data:', req.body);  // 🔍 Log received data

        // Validate the announcement data (ensure both title and description are provided)
        const announcementData = req.body;

        // Check if title or description is missing
        if (!announcementData.title || !announcementData.description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        // Log the description to verify it's present
        console.log("Title:", announcementData.title);
        console.log("Description:", announcementData.description);

        // Generate ID based on the current year and an incrementing number (e.g., 2025-00001)
        const year = new Date().getFullYear();
        const announcementId = `${year}-${String(await client.incr('announcementIdCounter')).padStart(5, '0')}`;
        announcementData.id = announcementId;  // Set the generated ID

        // Log the ID to verify it
        console.log("Generated Announcement ID:", announcementData.id);

        // Save the announcement data to the database (Redis)
        await client.hSet(`announcement:${announcementData.id}`, 'title', announcementData.title);
        await client.hSet(`announcement:${announcementData.id}`, 'description', announcementData.description);

        // Respond with a success message and the generated ID
        res.status(201).json({ message: 'Announcement saved successfully', id: announcementData.id });
    } catch (error) {
        console.error('Error saving announcement:', error);
        res.status(500).json({ message: 'Failed to save announcement', error: error.message });
    }
});


// PUT /announcements/:id (Admin only)
app.put('/announcements/:id', authenticate, authorize(['admin']), async (req, res) => {
    const id = req.params.id;  // Get the announcement's ID from the URL parameters
    try {
        const updateData = req.body;  // Get the updated announcement data from the request body

        // Fetch the announcement data using the announcement ID
        const existingAnnouncement = await client.hGetAll(`announcement:${id}`);
        
        // If the announcement doesn't exist, return a 404 error
        if (Object.keys(existingAnnouncement).length === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Validate the update data
        if (updateData.title && !updateData.description || !updateData.title && updateData.description) {
            return res.status(400).json({ message: 'Both title and description are required' });
        }

        // Log the existing announcement and update data to verify
        console.log("Existing Announcement:", existingAnnouncement);
        console.log("Update Data:", updateData);

        // Iterate through the updateData and update each field in the Redis store
        for (const key in updateData) {
            try {
                await client.hSet(`announcement:${id}`, key, updateData[key]);
                console.log(`Updated field: ${key} with value: ${updateData[key]}`); // Log each update
            } catch (redisError) {
                return res.status(500).json({ message: `Failed to update field ${key}`, error: redisError.message });
            }
        }

        res.status(200).json({ message: 'Announcement updated successfully' });
    } catch (error) {
        handleServerError(res, error, 'Failed to update announcement');
    }
});

// GET /announcements/:id (All users)
app.get('/announcements/:id', authenticate, async (req, res) => {
    const id = req.params.id; // Get the announcement's ID from the URL parameters

    try {
        // Fetch announcement data from Redis using the announcement ID
        const announcement = await client.hGetAll(`announcement:${id}`);

        // If the announcement is not found, return a 404 error
        if (Object.keys(announcement).length === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Return the announcement's data as JSON
        res.json(announcement);
    } catch (error) {
        console.error('Error fetching announcement:', error); // Improved logging
        res.status(500).json({ message: 'Failed to retrieve announcement', error: error.message });
    }
});

// GET /announcements (All users)
app.get('/announcements', authenticate, async (req, res) => {
    try {
        console.log("Fetching announcements from Redis..."); // Debug log
        const { search } = req.query;
        console.log("Search term:", search);

        const keys = await client.keys('announcement:*');
        console.log("Keys found:", keys); // Debug log

        let announcements = await Promise.all(keys.map(async (key) => {
            const announcementData = await client.hGetAll(key);
            console.log(`Announcement Data for ${key}:`, announcementData); // Debug log
            return { id: key, title: announcementData.title, description: announcementData.description }; // Use title and description with the ID
        }));

        // Filter announcements based on search query
        if (search) {
            announcements = announcements.filter(announcement =>
                Object.values(announcement).some(value =>
                    String(value).toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error); // Improved logging
        res.status(500).json({ message: 'Failed to retrieve announcements', error: error.message });
    }
});

// DELETE /announcements/:id (Admin only)
app.delete('/announcements/:id', authenticate, authorize(['admin']), async (req, res) => {
    const id = req.params.id;
    console.log(`Attempting to delete announcement with ID: ${id}`);

    try {
        // Fetch the announcement data from Redis
        const announcement = await client.hGetAll(`announcement:${id}`);
        console.log('Announcement data fetched:', announcement);

        if (Object.keys(announcement).length === 0) {
            console.log('Announcement not found');
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Delete the announcement from Redis
        await client.del(`announcement:${id}`);
        console.log(`Announcement with ID: ${id} deleted successfully`);

        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error); // Improved logging
        res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
    }
});
//admin certificate

// Fetch all pending certificate requests for the admin
app.get('/admin/pendingCertificateRequests', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const keys = await client.keys('certificate:*');  // Get all certificate keys from Redis
    const pendingRequests = [];

    // Fetch all pending certificate requests
    for (const key of keys) {
      const certificate = await client.hGetAll(key);
      if (certificate.status !== 'Completed') {  // Only include pending requests
        const username = certificate.username;
        const user = await client.hGetAll(`user:${username}`);  // Fetch user data
        const details = (() => {
          switch (certificate.certificateType) {
            case 'barangayGuardianship':
              return `Child: ${certificate.childName}, Relationship: ${certificate.relationship}`;
            case 'barangaySoloParent':
              return `Child: ${certificate.childName}, Parent: ${certificate.fatherOrMother}`;
            case 'barangayDeath':
              return `Deceased: ${certificate.deadName}, Age: ${certificate.deadAge}`;
            default:
              return 'N/A';
          }
        })();

        pendingRequests.push({
          certificateId: certificate.certificateId,
          username: certificate.username,
          certificateType: certificate.certificateType,
          childName: certificate.childName,
          relationship: certificate.relationship,
          fatherOrMother: certificate.fatherOrMother,
          deadName: certificate.deadName,
          deadAge: certificate.deadAge,
          status: certificate.status,
          userRole: user.role,  // Include the role of the user requesting the certificate
        });
      }
    }

    res.status(200).json(pendingRequests);  // Return the list of pending certificate requests
  } catch (error) {
    console.error('Error fetching pending certificate requests:', error);
    res.status(500).json({ message: 'Failed to fetch pending requests', error: error.message });
  }
});
// Update certificate status by Admin
app.put('/admin/updateCertificateStatus/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;  // The new status to be set

  try {
    const certificateData = await client.hGetAll(`certificate:${id}`);
    
    if (!certificateData || Object.keys(certificateData).length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Validate that the status is one of the accepted statuses
    const validStatuses = ['Pending', 'Processing', 'Ready for pick-up', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update the certificate status in Redis
    await client.hSet(`certificate:${id}`, 'status', status);

    // If the status is "Completed", remove it from the pending list and mark it as completed
    if (status === 'Completed') {
      await client.sRem(`user:${certificateData.username}:certificates`, id); // Remove from the user's list
    }

    res.status(200).json({ message: 'Certificate status updated successfully' });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res.status(500).json({ message: 'Failed to update certificate status', error: error.message });
  }
});









// Request certificate
// Submit certificate request and store it with the user's username
app.post('/user/requestCertificate', authenticate, authorize(['user']), async (req, res) => {
  try {
    const certificateData = req.body;
    const username = req.user.username;

    if (!username) {
      return res.status(400).json({ message: 'Username is not available' });
    }

    if (!certificateData.certificateType) {
      return res.status(400).json({ message: 'Certificate type is required' });
    }

    // Generate unique certificate ID
    const certificateId = `${new Date().getFullYear()}-${String(await client.incr('certificateIdCounter')).padStart(5, '0')}`;
    certificateData.id = certificateId;
    certificateData.username = username;

    // Save all certificate data to Redis
    await client.hSet(`certificate:${certificateId}`, 'certificateType', certificateData.certificateType);
    await client.hSet(`certificate:${certificateId}`, 'childName', certificateData.childName || '');
    await client.hSet(`certificate:${certificateId}`, 'relationship', certificateData.relationship || '');
    await client.hSet(`certificate:${certificateId}`, 'fatherOrMother', certificateData.fatherOrMother || '');
    await client.hSet(`certificate:${certificateId}`, 'deadName', certificateData.deadName || '');
    await client.hSet(`certificate:${certificateId}`, 'deadAge', certificateData.deadAge || '');
    await client.hSet(`certificate:${certificateId}`, 'status', certificateData.status || 'Pending');
    await client.hSet(`certificate:${certificateId}`, 'username', username);
    await client.hSet(`certificate:${certificateId}`, 'certificateId', certificateId);

    // Track certificate under user
    await client.sAdd(`user:${username}:certificates`, certificateId);

    res.status(200).json({ message: 'Certificate request submitted successfully' });
  } catch (error) {
    console.error('Error saving certificate request:', error);
    res.status(500).json({ message: 'Failed to submit certificate request', error: error.message });
  }
});


// Get certificates for the authenticated user
app.get('/user/certificates', authenticate, authorize(['user']), async (req, res) => {
  try {
    const username = req.user.username; // Get the username from the authenticated user (using req.user)

    // Fetch all certificate IDs associated with the user from Redis
    const certificateIds = await client.sMembers(`user:${username}:certificates`);
    const certificates = [];

    // Fetch the certificate data for each certificate ID
    for (const certId of certificateIds) {
      const certificate = await client.hGetAll(`certificate:${certId}`);
      certificates.push(certificate);
    }

    res.status(200).json({ certificates }); // Return the list of certificates for the authenticated user
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Failed to fetch certificates', error: error.message });
  }
});
// PUT /user/certificate/:id
app.put('/user/certificate/:id', authenticate, authorize(['user']), async (req, res) => {
  try {
    const certificateId = req.params.id;
    const username = req.user.username;  // Using username instead of userId
    const certificateData = req.body;

    // Fetch the existing certificate
    const existingCertificate = await client.hGetAll(`certificate:${certificateId}`);

    // Check if the certificate exists and if it belongs to the user
    if (Object.keys(existingCertificate).length === 0 || !await client.sIsMember(`user:${username}:certificates`, certificateId)) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized access' });
    }

    // Prevent updates if the certificate is in process
    if (existingCertificate.status === 'IN PROCESS') {
      return res.status(400).json({ message: 'Cannot update a certificate that is already in process' });
    }

    // If the status is pending, allow updates
    // Update the certificate fields (title, details, status, etc.)
    if (certificateData.certificateType) {
      await client.hSet(`certificate:${certificateId}`, 'certificateType', certificateData.certificateType);
    }

    if (certificateData.details !== undefined) {
      await client.hSet(`certificate:${certificateId}`, 'details', certificateData.details);
    }

    if (certificateData.status) {
      await client.hSet(`certificate:${certificateId}`, 'status', certificateData.status);
    }

    res.status(200).json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ message: 'Failed to update certificate', error: error.message });
  }
});
  

 // DELETE /user/certificate/:id
 app.delete('/user/certificate/:id', authenticate, authorize(['user']), async (req, res) => {
  try {
    const certificateId = req.params.id;
    const username = req.user.username;  // Using username instead of userId

    // Fetch the existing certificate data
    const existingCertificate = await client.hGetAll(`certificate:${certificateId}`);

    // Check if the certificate exists and if it belongs to the user
    if (Object.keys(existingCertificate).length === 0 || !await client.sIsMember(`user:${username}:certificates`, certificateId)) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized access' });
    }

    // Prevent deletion if the certificate status is IN PROCESS
    if (existingCertificate.status === 'IN PROCESS') {
      return res.status(400).json({ message: 'Cannot delete a certificate that is in process' });
    }

    // Delete the certificate data from Redis
    await client.del(`certificate:${certificateId}`);

    // Also remove the certificate ID from the user's set of certificates
    await client.sRem(`user:${username}:certificates`, certificateId);

    res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ message: 'Failed to delete certificate', error: error.message });
  }
});

// Handle canceling a certificate request by User
app.put('/user/certificate/cancel/:id', authenticate, authorize(['user']), async (req, res) => {
  const certificateId = req.params.id;
  const username = req.user.username;

  try {
    const existingCertificate = await client.hGetAll(`certificate:${certificateId}`);
    
    // Check if the certificate exists and if it belongs to the user
    if (Object.keys(existingCertificate).length === 0 || !await client.sIsMember(`user:${username}:certificates`, certificateId)) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized access' });
    }

    // If the certificate is not pending, do not allow cancellation
    if (existingCertificate.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot cancel a certificate that is not pending' });
    }

    // Remove the certificate from the user's certificates set
    await client.sRem(`user:${username}:certificates`, certificateId);

    // Delete the certificate from Redis (this removes it for admin as well)
    await client.del(`certificate:${certificateId}`);

    res.status(200).json({ message: 'Certificate request canceled successfully' });
  } catch (error) {
    console.error('Error canceling certificate:', error);
    res.status(500).json({ message: 'Failed to cancel certificate', error: error.message });
  }
});
//AccountsInfo
// Endpoint to fetch account details
app.get('/account', authenticate, async (req, res) => {
    try {
      const username = req.user.username; // Get username from decoded JWT
      if (!username) {
        return res.status(400).json({ message: 'Username not found in request' });
      }
  
      // Fetch user data from Redis using the username
      const user = await client.hGetAll(`user:${username}`);
  
      if (!user || Object.keys(user).length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Parse the assignedResident if available, otherwise set it as null
      const assignedResident = user.assignedResident ? JSON.parse(user.assignedResident) : null;
  
      // Send back the username and any related data, including assignedResident if available
      res.json({
        username: user.username, // Always include the username
        assignedResident: assignedResident, // Include assignedResident data if available
      });
    } catch (error) {
      console.error("Error fetching account information:", error);
      res.status(500).json({ message: 'Failed to fetch account information' });
    }
  });
  
//asign
app.put('/assignResidentToUser', async (req, res) => {
  const { username, residentId } = req.body;

  try {
    // Fetch the resident details
    const resident = await client.hGetAll(`resident:${residentId}`);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Assign resident data to the user profile
    await client.hSet(`user:${username}`, 'assignedResident', JSON.stringify(resident));

    res.status(200).json({ message: 'Resident assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign resident' });
  }
});


//csv
app.post('/uploadCSV', uploadCSV.single('file'), async (req, res) => {
  console.log('Received file:', req.file);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No CSV file uploaded"
    });
  }

  const results = [];

  const readStream = fs.createReadStream(req.file.path).pipe(csv());

  readStream.on('data', (row) => {
    console.log('Parsed row:', row);

    results.push(row);  // Collect all rows for processing
  });

  readStream.on('end', async () => {
    console.log('Total rows processed:', results.length);

    try {
      const multi = client.multi();
      const year = new Date().getFullYear();

      for (const resident of results) {
        const surname = resident['Surname'];
        if (!surname) {
          console.log('Error: Missing surname in row:', resident);
          continue;
        }

        const birthdate = resident['Birthdate'];
        // Validate birthdate before calculating age
        const age = birthdate && !isNaN(new Date(birthdate).getTime())
          ? calculateAge(birthdate)
          : 0;  // Default to 0 if the birthdate is invalid

        const residentId = `${year}-${String(await client.incr('residentIdCounter')).padStart(5, '0')}`;
        const residentData = {
          id: residentId,
          surname: surname,
          firstName: resident['First Name'],
          middleName: resident['Middle Name'],
          gender: resident.Gender,
          birthdate: resident.Birthdate,
          age: calculateAge(resident.Birthdate) || 0,  // Default to 0 if age calculation fails
          birthplace: resident.Birthplace,
          purok: resident.Purok,
          maritalStatus: resident['Marital Status'],
          totalHouseholdMembers: resident['Total Household Members'],
          bloodType: resident['Blood Type'],
          occupation: resident.Occupation,
          lengthOfStay: resident['Length of Stay'],
          monthlyIncome: resident['Monthly Income']
        };

        for (const key in residentData) {
          multi.hSet(`resident:${residentData.id}`, key, residentData[key]);
        }
      }

      await multi.exec();

      res.status(200).json({ message: 'Residents added successfully' });

    } catch (error) {
      console.error('Error processing CSV data:', error);
      res.status(500).json({ message: 'Error processing the CSV file' });
    }
  });

  readStream.on('error', (err) => {
    console.error('Error reading CSV file:', err);
    res.status(500).json({ message: 'Error processing the CSV file' });
  });
});


  
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
