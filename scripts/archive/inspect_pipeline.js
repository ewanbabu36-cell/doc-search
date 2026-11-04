const http = require('http');

http.get('http://localhost:4000/api/v1/commercial/hq/pipeline', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('json keys:', Object.keys(json));
      if (json.data) console.log('json.data keys:', Object.keys(json.data));
      console.log('Sample data:', JSON.stringify(json.data).slice(0, 500));
    } catch (e) {
      console.log('Error parsing:', e.message);
    }
  });
});
