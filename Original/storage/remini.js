const axios = require('axios');
const qs = require('qs');
const { fromBuffer } = require('file-type');

async function uploadToPxpic(buffer) {
  const { ext, mime } = await fromBuffer(buffer) || {};
  const fileName = `${Date.now()}.${ext}`;
  const { data } = await axios.post('https://pxpic.com/getSignedUrl', {
    folder: 'uploads',
    fileName
  }, { headers: { 'Content-Type': 'application/json' } });
  await axios.put(data.presignedUrl, buffer, { headers: { 'Content-Type': mime } });
  return `https://files.fotoenhancer.com/uploads/${fileName}`;
}

async function createPxpicImage(buffer, type = "removebg") {
  const url = await uploadToPxpic(buffer);
  const data = qs.stringify({
    imageUrl: url,
    targetFormat: 'png',
    needCompress: 'no',
    imageQuality: '100',
    compressLevel: '6',
    fileOriginalExtension: 'png',
    aiFunction: type,
    upscalingLevel: ''
  });
  const result = await axios.post('https://pxpic.com/callAiFunction', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return result.data?.resultImageUrl;
}

module.exports = createPxpicImage