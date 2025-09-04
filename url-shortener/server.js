
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :remote-addr'));

app.use(express.json({ limit: '10kb' }));

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message
    });
};


const validateRequest = (req, res, next) => {
    const contentType = req.get('Content-Type');
    if (req.method === 'POST' && !contentType?.includes('application/json')) {
        return res.status(415).json({
            status: 'error',
            message: 'Content-Type must be application/json'
        });
    }
    next();
};


app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(validateRequest);

const AUTH_CONFIG = {
  email: "yarramsettisai33@gmail.com",
  name: "Venkatyarramsetti", 
  rollNo: "22l31a05o2",
  accessCode: "YzuJeU",
  clientID: "c64260d7-415e-4352-8c25-025e5f271a00",
  clientSecret: "yucDQUKCqHxqBfVU"
};

const EVAL_BASE = "https://20.244.56.144/evaluation-service";


const api = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: { "Content-Type": "application/json" },
  timeout: 10000
});


app.use(express.json());
app.use(morgan('dev'));


const urlMappings = new Map();
const urlStats = new Map();   

let authToken = null;
let tokenExpiryMs = 0;
let didRegisterOnce = false;

const isValidUrl = (value) => {
  try {
    const u = new URL(value);

    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const isPositiveInt = (n) =>
  Number.isInteger(n) && n > 0 && Number.isFinite(n);

const isValidShortcode = (code) =>
  typeof code === 'string' && /^[A-Za-z0-9]{3,20}$/.test(code);

const makeShortcode = () =>
  crypto.randomBytes(6)    
        .toString('base64url')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 6) || 'u' + Date.now().toString(36).slice(-5);

async function ensureRegistered() {
  if (didRegisterOnce) return;
  try {
    await api.post(`${EVAL_BASE}/register`, AUTH_CONFIG);
    didRegisterOnce = true;
  } catch (err) {

    if (err.response && (err.response.status === 409 || err.response.status === 400)) {
      didRegisterOnce = true;
    } else {

      console.error('Registration warning:', err.message);
    }
  }
}

async function getAuthToken() {

  const now = Date.now();
  if (authToken && now < tokenExpiryMs - 5000) return authToken;

  await ensureRegistered();


  const { data } = await api.post(`${EVAL_BASE}/auth`, AUTH_CONFIG);
  if (!data || !data.access_token || !data.expires_in) {
    throw new Error('Auth response missing access_token or expires_in');
  }

  authToken = data.access_token;

  const epochSeconds = Number(data.expires_in);
  tokenExpiryMs = epochSeconds > 10_000_000 ? epochSeconds * 1000 : now + epochSeconds * 1000;

  return authToken;
}

async function logToService(message) {
  try {
    const token = await getAuthToken();
    await api.post(
      `${EVAL_BASE}/logs`,
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {

    console.error('Remote log failed:', err.message);
  }
}


// Serve static files from public directory
app.use(express.static('public'));

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    name: "URL Shortener API",
    version: "1.0.0",
    endpoints: {
      createShortUrl: {
        method: "POST",
        path: "/shorturls",
        body: {
          url: "string (required) - The long URL to shorten (http/https only)",
          validity: "number (optional, minutes) - default 30, must be positive integer",
          shortcode: "string (optional) - Alphanumeric 3-20 chars; must be unique"
        }
      },
      accessShortUrl: {
        method: "GET",
        path: "/:shortcode",
        description: "Redirects to the original URL if shortcode exists and is not expired"
      }
    }
  });
});


app.post('/shorturls', async (req, res) => {
  try {
    let { url, validity, shortcode } = req.body;


    if (!url || !isValidUrl(url)) {
      await logToService(`Invalid URL attempt: ${url}`);
      return res.status(400).json({ 
        error: 'Invalid URL. Only http/https URLs are allowed.',
        logID: uuidv4()
      });
    }


    if (validity === undefined || validity === null || validity === '') {
      validity = 30;
    }
    if (!isPositiveInt(validity)) {
      await logToService(`Invalid validity: ${validity}`);
      return res.status(400).json({ error: 'Validity must be a positive integer (minutes).' });
    }


    if (shortcode !== undefined && shortcode !== null && shortcode !== '') {
      if (!isValidShortcode(shortcode)) {
        await logToService(`Invalid shortcode format: ${shortcode}`);
        return res.status(400).json({ error: 'Shortcode must be 3-20 alphanumeric characters.' });
      }
    } else {

      shortcode = makeShortcode();

      while (urlMappings.has(shortcode) && urlMappings.get(shortcode).expiry > Date.now()) {
        shortcode = makeShortcode();
      }
    }


    if (urlMappings.has(shortcode)) {
      const existing = urlMappings.get(shortcode);
      if (existing.expiry > Date.now()) {
        await logToService(`Duplicate shortcode attempt: ${shortcode}`);
        return res.status(409).json({ error: 'Shortcode already in use.' });
      }
    }


    const expiryMs = Date.now() + validity * 60 * 1000;


    urlMappings.set(shortcode, { url, expiry: expiryMs });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const logID = uuidv4();
    const payload = {
      shortLink: `${baseUrl}/${shortcode}`,
      expiry: new Date(expiryMs).toISOString(),
      logID: logID
    };

    await logToService(`Created short URL: ${shortcode} -> ${url} (valid ${validity}m)`);
    return res.status(201).json(payload);
  } catch (error) {
    console.error('Error creating short URL:', error);
    await logToService(`Error creating short URL: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const mapping = urlMappings.get(shortcode);

    if (!mapping) {
      await logToService(`Shortcode not found: ${shortcode}`);
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    if (mapping.expiry < Date.now()) {
      await logToService(`Expired shortcode access: ${shortcode}`);
      return res.status(410).json({ error: 'Link has expired' });
    }

    
    const clickData = {
      timestamp: new Date().toISOString(),
      referrer: req.get('referer') || 'direct',
      location: req.get('x-forwarded-for') || req.ip
    };
    
    if (!urlStats.has(shortcode)) {
      urlStats.set(shortcode, {
        created: new Date().toISOString(),
        clicks: []
      });
    }
    urlStats.get(shortcode).clicks.push(clickData);

    await logToService(`Redirect: ${shortcode} -> ${mapping.url}`);
    
   
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${mapping.url}">
          <script>window.open('${mapping.url}', '_blank');</script>
        </head>
        <body>
          <p>Redirecting to ${mapping.url}...</p>
          <p><a href="${mapping.url}" target="_blank">Click here if you are not redirected automatically</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error redirecting:', error);
    await logToService(`Error redirecting: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/shorturls/:shortcode/stats', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const mapping = urlMappings.get(shortcode);
    const stats = urlStats.get(shortcode);

    if (!mapping) {
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    
    const response = {
      originalUrl: mapping.url,
      creationDate: stats ? stats.created : new Date().toISOString(),
      expiryDate: new Date(mapping.expiry).toISOString(),
      totalClicks: stats ? stats.clicks.length : 0,
      clicksData: stats ? stats.clicks.map(click => ({
        clickTimestamp: click.timestamp,
        sourceReferrer: click.referrer,
        geoLocation: click.location
      })) : []
    };

    return res.json(response);
  } catch (error) {
    console.error('Error getting statistics:', error);
    await logToService(`Error getting statistics: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(async (err, req, res, next) => {
  const logID = uuidv4();
  await logToService(`Server error: ${err.message}`);
  res.status(500).json({ 
    error: 'Something went wrong!',
    logID: logID
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`URL Shortener running at http://localhost:${PORT}`);
});
