import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const CLOUD_NAME = 'dw3wwmm7w'; 
const UPLOAD_PRESET = 'swp391_sum26';  
const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

async function test() {
  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // create a dummy file
  fs.writeFileSync('test.txt', 'Hello World');
  formData.append('file', fs.createReadStream('test.txt'));

  try {
    const res = await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders()
    });
    console.log("Success:", res.data.secure_url);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
