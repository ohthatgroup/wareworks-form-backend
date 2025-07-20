// netlify/functions/autocomplete-address.js
// Server-side proxy for Google Places Autocomplete API

const fetch = require('node-fetch'); // Use node-fetch for making HTTP requests

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests for autocomplete
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const input = event.queryStringParameters.input; // Get the user's partial input
    
    if (!input) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing input query parameter' })
      };
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key not configured in environment variables.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error: API key missing.' })
      };
    }

    // Construct the Google Places Autocomplete API URL
    // Using 'textsearch' or 'autocomplete' endpoint. 'autocomplete' is generally better for typing-as-you-go.
    // Ensure you have enabled "Places API" in your Google Cloud project.
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${GOOGLE_MAPS_API_KEY}`;

    const googleResponse = await fetch(googleApiUrl);
    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error('Google Places API error:', googleData);
      return {
        statusCode: googleResponse.status,
        headers,
        body: JSON.stringify({ error: 'Error from Google Places API', details: googleData })
      };
    }

    // Filter and return only the necessary predictions
    const predictions = googleData.predictions.map(prediction => ({
      description: prediction.description,
      place_id: prediction.place_id
    }));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ predictions })
    };

  } catch (error) {
    console.error('Autocomplete function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};

