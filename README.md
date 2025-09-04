<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8a961533-acd0-4665-91d1-f0a5307bee65" />
# URL Shortener Service

A modern, full-stack URL shortening service built with Node.js, Express, and vanilla JavaScript. This application provides a clean, user-friendly interface for creating shortened URLs with custom settings and comprehensive click tracking.


<img width="1890" height="958" alt="image" src="https://github.com/user-attachments/assets/71537430-90c8-49ae-90d7-3aeeaea0d4fb" />


## Features

- **URL Shortening**
  - Create short URLs instantly
  - Custom shortcode option
  - Configurable validity period
  - Automatic random code generation

- **Click Analytics**
  - Track total clicks
  - View click timestamps
  - Source referrer tracking
  - Geographic location data
  - Detailed click history

- **Security Features**
  - Rate limiting protection
  - CORS enabled
  - Input validation
  - XSS protection
  - Content security headers

- **User Experience**
  - Clean, modern interface
  - Mobile-responsive design
  - Copy to clipboard functionality
  - Real-time validation
  - Error handling with user feedback

## Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - UUID for logging
  - Express Rate Limiter
  - CORS middleware

- **Frontend**
  - HTML5
  - CSS3
  - Vanilla JavaScript
  - Responsive Design
  - Modern UI/UX

## API Endpoints

### Create Short URL
```http
POST /shorturls
```
Request body:
```json
{
    "url": "https://example.com/very-long-url",
    "validity": 30,
    "shortcode": "custom123"
}
```
Response:
```json
{
    "shortLink": "http://domain/abc123",
    "expiry": "2025-09-04T07:25:26.415Z",
    "logID": "3e695b10-154b-4873-9c00-5a4b75501045"
}
```

### Get URL Statistics
```http
GET /shorturls/:shortcode/stats
```
Response:
```json
{
    "originalUrl": "https://example.com/very-long-url",
    "creationDate": "2025-09-04T06:00:00.000Z",
    "expiryDate": "2025-09-04T07:00:00.000Z",
    "totalClicks": 5,
    "clicksData": [
        {
            "clickTimestamp": "2025-09-04T06:30:00.000Z",
            "sourceReferrer": "https://google.com",
            "geoLocation": "192.168.1.1"
        }
    ]
}
```

### Access Short URL
```http
GET /:shortcode
```
- Redirects to original URL
- Opens in new tab
- Records click statistics

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/Venkatyarramsetti/22l31a05o2.git
cd 22l31a05o2/url-shortener
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the server:
\`\`\`bash
node server.js
\`\`\`

4. Access the application:
   - Open http://localhost:3000 in your browser

## Configuration

The application can be configured through environment variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment setting

## Security

- Rate limiting: 100 requests per IP per 15 minutes
- Input validation for URLs and shortcodes
- XSS protection headers
- CORS configuration
- Content-Type validation

## Contributing

1. Fork the repository
2. Create your feature branch:
   \`\`\`bash
   git checkout -b feature/YourFeature
   \`\`\`
3. Commit your changes:
   \`\`\`bash
   git commit -m 'Add some feature'
   \`\`\`
4. Push to the branch:
   \`\`\`bash
   git push origin feature/YourFeature
   \`\`\`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Venkat Yarramsetti**
- Email: yarramsettisai33@gmail.com
- GitHub: [@Venkatyarramsetti](https://github.com/Venkatyarramsetti)

## Acknowledgments

- Express.js team for the excellent web framework
- The open-source community for various middleware packages
- Contributors and testers

---
Made with ❤️ by Venkat Yarramsetti
