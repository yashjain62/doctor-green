import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const predictDisease = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile, 'leaf.jpg');
  const { data } = await axios.post(`${API_URL}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
};

export const getSupplements = async () => {
  const { data } = await axios.get(`${API_URL}/supplements`, { timeout: 10000 });
  return data.supplements || [];
};

export const checkHealth = async () => {
  const { data } = await axios.get(`${API_URL}/health`, { timeout: 5000 });
  return data;
};
