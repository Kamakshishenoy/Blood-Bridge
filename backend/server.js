const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 5005;

const donors = [
  {
    id: 'd1',
    name: 'Kabir Das',
    bloodGroup: 'A+',
    phone: '9876543210',
    email: 'kabir@example.com',
    location: 'Indiranagar',
    city: 'Bengaluru',
    availability: 'Available',
    lastDonationDate: '2025-07-08',
    age: 28,
    gender: 'Male',
    additionalInfo: 'Available for urgent donations.',
    createdAt: '2025-07-08T09:10:00.000Z',
    updatedAt: '2025-07-08T09:10:00.000Z'
  },
  {
    id: 'd2',
    name: 'Lavanya Iyer',
    bloodGroup: 'O+',
    phone: '9876541122',
    email: 'lavanya@example.com',
    location: 'Koramangala',
    city: 'Bengaluru',
    availability: 'Available',
    lastDonationDate: '2025-06-25',
    age: 33,
    gender: 'Female',
    additionalInfo: 'Can donate in 2 weeks.',
    createdAt: '2025-07-08T09:12:00.000Z',
    updatedAt: '2025-07-08T09:12:00.000Z'
  }
];

const requests = [
  {
    id: 'r1',
    requiredBloodGroup: 'O+',
    requiredQuantity: 2,
    patientName: 'Nandana Pillai',
    hospitalName: 'City Care Hospital',
    location: 'Mangalore',
    city: 'Mangalore',
    requiredDate: '2025-07-18',
    requiredTime: '18:30',
    emergencyDescription: 'Urgent O+ blood needed for emergency surgery.',
    contactPerson: 'Sanjay Menon',
    contactPhone: '9988776655',
    urgency: 'Critical',
    status: 'Active',
    createdAt: '2025-07-15T10:30:00.000Z',
    updatedAt: '2025-07-15T10:30:00.000Z'
  },
  {
    id: 'r2',
    requiredBloodGroup: 'A+',
    requiredQuantity: 3,
    patientName: 'Amit Joshi',
    hospitalName: 'CarePoint Medical',
    location: 'Bengaluru',
    city: 'Bengaluru',
    requiredDate: '2025-07-17',
    requiredTime: '21:00',
    emergencyDescription: 'High-priority blood support for a dialysis patient.',
    contactPerson: 'Rita Joshi',
    contactPhone: '9876549876',
    urgency: 'High',
    status: 'In Progress',
    createdAt: '2025-07-14T08:45:00.000Z',
    updatedAt: '2025-07-14T08:45:00.000Z'
  }
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DONOR_AVAILABILITY = ['Available', 'Temporarily unavailable'];
const REQUEST_URGENCY = ['Critical', 'High', 'Normal'];
const REQUEST_STATUS = ['Active', 'In Progress', 'Fulfilled', 'Cancelled'];

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

const buildDonorResponse = (donor) => ({
  id: donor.id,
  name: donor.name,
  bloodGroup: donor.bloodGroup,
  phone: donor.phone,
  email: donor.email,
  location: donor.location,
  city: donor.city,
  availability: donor.availability,
  lastDonationDate: donor.lastDonationDate,
  age: donor.age,
  gender: donor.gender,
  additionalInfo: donor.additionalInfo,
  createdAt: donor.createdAt,
  updatedAt: donor.updatedAt
});

const buildRequestResponse = (request) => ({
  id: request.id,
  requiredBloodGroup: request.requiredBloodGroup,
  requiredQuantity: request.requiredQuantity,
  patientName: request.patientName,
  hospitalName: request.hospitalName,
  location: request.location,
  city: request.city,
  requiredDate: request.requiredDate,
  requiredTime: request.requiredTime,
  emergencyDescription: request.emergencyDescription,
  contactPerson: request.contactPerson,
  contactPhone: request.contactPhone,
  urgency: request.urgency,
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt
});

const validateDonor = (payload, excludeId = null) => {
  const requiredFields = ['name', 'bloodGroup', 'phone', 'email', 'location', 'city', 'availability', 'lastDonationDate', 'age'];
  for (const field of requiredFields) {
    if (!payload[field] && payload[field] !== 0) {
      return `Missing required field: ${field}`;
    }
  }

  if (!BLOOD_GROUPS.includes(payload.bloodGroup)) {
    return 'Invalid blood group value.';
  }

  if (!DONOR_AVAILABILITY.includes(payload.availability)) {
    return 'Invalid availability value.';
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(String(payload.phone).trim())) {
    return 'Phone number is invalid.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email).trim())) {
    return 'Email address is invalid.';
  }

  const age = Number(payload.age);
  if (!Number.isInteger(age) || age < 18 || age > 65) {
    return 'Age must be a whole number between 18 and 65.';
  }

  const donationDate = new Date(payload.lastDonationDate);
  if (Number.isNaN(donationDate.getTime())) {
    return 'Last donation date is invalid.';
  }

  const email = String(payload.email).trim().toLowerCase();
  const duplicate = donors.some((donor) => donor.id !== excludeId && donor.email.toLowerCase() === email);
  if (duplicate) {
    return 'A donor with this email already exists.';
  }

  return null;
};

const validateRequest = (payload) => {
  const requiredFields = ['requiredBloodGroup', 'requiredQuantity', 'patientName', 'hospitalName', 'location', 'city', 'requiredDate', 'requiredTime', 'emergencyDescription', 'contactPerson', 'contactPhone', 'urgency'];
  for (const field of requiredFields) {
    if (!payload[field] && payload[field] !== 0) {
      return `Missing required field: ${field}`;
    }
  }

  if (!BLOOD_GROUPS.includes(payload.requiredBloodGroup)) {
    return 'Invalid required blood group value.';
  }

  const quantity = Number(payload.requiredQuantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return 'Required quantity must be between 1 and 20 units.';
  }

  if (!REQUEST_URGENCY.includes(payload.urgency)) {
    return 'Invalid urgency value.';
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(String(payload.contactPhone).trim())) {
    return 'Contact phone number is invalid.';
  }

  const requiredDate = new Date(payload.requiredDate);
  if (Number.isNaN(requiredDate.getTime())) {
    return 'Required date is invalid.';
  }

  return null;
};

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BloodBridge API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/donors', (req, res) => {
  try {
    const { bloodGroup, availability, city } = req.query;
    let result = [...donors];

    if (bloodGroup) result = result.filter((donor) => donor.bloodGroup === bloodGroup);
    if (availability) result = result.filter((donor) => donor.availability === availability);
    if (city) result = result.filter((donor) => donor.city === city);

    res.status(200).json({ success: true, count: result.length, data: result.map(buildDonorResponse) });
  } catch (error) {
    sendError(res, 500, 'Unable to fetch donor records.');
  }
});

app.post('/api/donors', (req, res) => {
  try {
    const payload = req.body || {};
    const validationError = validateDonor(payload);

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const donor = {
      id: randomUUID(),
      name: String(payload.name).trim(),
      bloodGroup: payload.bloodGroup,
      phone: String(payload.phone).trim(),
      email: String(payload.email).trim().toLowerCase(),
      location: String(payload.location).trim(),
      city: String(payload.city).trim(),
      availability: payload.availability,
      lastDonationDate: new Date(payload.lastDonationDate).toISOString().slice(0, 10),
      age: Number(payload.age),
      gender: payload.gender || 'Prefer not to say',
      additionalInfo: payload.additionalInfo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    donors.unshift(donor);
    return res.status(201).json({ success: true, message: 'Donor created successfully.', data: buildDonorResponse(donor) });
  } catch (error) {
    return sendError(res, 500, 'Failed to create donor record.');
  }
});

app.get('/api/donors/:id', (req, res) => {
  const donor = donors.find((item) => item.id === req.params.id);
  if (!donor) {
    return sendError(res, 404, 'Donor not found.');
  }
  return res.status(200).json({ success: true, data: buildDonorResponse(donor) });
});

app.put('/api/donors/:id', (req, res) => {
  try {
    const donorIndex = donors.findIndex((donor) => donor.id === req.params.id);
    if (donorIndex === -1) {
      return sendError(res, 404, 'Donor not found.');
    }

    const payload = req.body || {};
    const validationError = validateDonor({ ...donors[donorIndex], ...payload, email: payload.email || donors[donorIndex].email }, donors[donorIndex].id);

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    donors[donorIndex] = {
      ...donors[donorIndex],
      ...payload,
      email: String(payload.email || donors[donorIndex].email).trim().toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({ success: true, message: 'Donor updated successfully.', data: buildDonorResponse(donors[donorIndex]) });
  } catch (error) {
    return sendError(res, 500, 'Failed to update donor record.');
  }
});
app.delete('/api/donors/:id', (req, res) => {
  try {
    const { id } = req.params;

    const donorIndex = donors.findIndex((donor) => donor.id === id);

    if (donorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found.'
      });
    }

    const deletedDonor = donors.splice(donorIndex, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'Donor deleted successfully.',
      data: deletedDonor
    });
  } catch (error) {
    console.error('Delete donor error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete donor record.',
      error: error.message
    });
  }
});

app.delete('/api/requests/:id', (req, res) => {
  try {
    const { id } = req.params;

    const requestIndex = requests.findIndex((request) => request.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    const deletedRequest = requests.splice(requestIndex, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'Request deleted successfully.',
      data: deletedRequest
    });
  } catch (error) {
    console.error('Delete request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete request.',
      error: error.message
    });
  }
});




app.get('/api/requests', (req, res) => {
  try {
    const { status, urgency, city } = req.query;
    let result = [...requests];

    if (status) result = result.filter((request) => request.status === status);
    if (urgency) result = result.filter((request) => request.urgency === urgency);
    if (city) result = result.filter((request) => request.city === city);

    res.status(200).json({ success: true, count: result.length, data: result.map(buildRequestResponse) });
  } catch (error) {
    sendError(res, 500, 'Unable to fetch emergency requests.');
  }
});

app.post('/api/requests', (req, res) => {
  try {
    const payload = req.body || {};
    const validationError = validateRequest(payload);

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const request = {
      id: randomUUID(),
      requiredBloodGroup: payload.requiredBloodGroup,
      requiredQuantity: Number(payload.requiredQuantity),
      patientName: String(payload.patientName).trim(),
      hospitalName: String(payload.hospitalName).trim(),
      location: String(payload.location).trim(),
      city: String(payload.city).trim(),
      requiredDate: new Date(payload.requiredDate).toISOString().slice(0, 10),
      requiredTime: String(payload.requiredTime).trim(),
      emergencyDescription: String(payload.emergencyDescription).trim(),
      contactPerson: String(payload.contactPerson).trim(),
      contactPhone: String(payload.contactPhone).trim(),
      urgency: payload.urgency,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    requests.unshift(request);
    return res.status(201).json({ success: true, message: 'Emergency request created successfully.', data: buildRequestResponse(request) });
  } catch (error) {
    return sendError(res, 500, 'Failed to create emergency request.');
  }
});

app.get('/api/requests/:id', (req, res) => {
  const request = requests.find((item) => item.id === req.params.id);
  if (!request) {
    return sendError(res, 404, 'Request not found.');
  }
  return res.status(200).json({ success: true, data: buildRequestResponse(request) });
});

app.put('/api/requests/:id/status', (req, res) => {
  try {
    const requestIndex = requests.findIndex((request) => request.id === req.params.id);
    if (requestIndex === -1) {
      return sendError(res, 404, 'Request not found.');
    }

    const { status } = req.body || {};
    if (!REQUEST_STATUS.includes(status)) {
      return sendError(res, 400, 'Invalid status value.');
    }

    requests[requestIndex] = {
      ...requests[requestIndex],
      status,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({ success: true, message: 'Request status updated successfully.', data: buildRequestResponse(requests[requestIndex]) });
  } catch (error) {
    return sendError(res, 500, 'Failed to update request status.');
  }
});

app.delete('/api/requests/:id', (req, res) => {
  const requestIndex = requests.findIndex((request) => request.id === req.params.id);
  if (requestIndex === -1) {
    return sendError(res, 404, 'Request not found.');
  }

  requests.splice(requestIndex, 1);
  return res.status(200).json({ success: true, message: 'Request deleted successfully.' });
});

app.use((req, res) => {
  return sendError(res, 404, 'API route not found.');
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  return sendError(res, 500, 'Internal server error.');
});

app.listen(PORT, () => {
  console.log(`BloodBridge API running on http://localhost:${PORT}`);
});
