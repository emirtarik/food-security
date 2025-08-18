# Food Security Frontend

## Local Development Setup

### Prerequisites
- Node.js (version 18 or higher)
- All dependencies installed (`npm install` in root directory)

### Running the Application Locally

#### Option 1: Use the convenience script (Recommended)
```bash
./start-local-dev.sh
```

#### Option 2: Use npm run dev from root directory
```bash
npm run dev
```

#### Option 3: Manual startup
1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start frontend (in a new terminal):**
   ```bash
   cd site
   npm run dev
   ```

### What Each Command Does

- **`./start-local-dev.sh`**: Checks ports and starts both servers using `npm run dev`
- **`npm run dev`**: Uses `concurrently` to run both frontend and backend simultaneously
- **`npm run client`**: Starts the React development server on port 3000
- **`npm run server`**: Starts the Express backend server on port 5001

### Backend Connection

The frontend is configured to connect to:
- **Local development:** `http://localhost:5001` (when using `npm run dev`)
- **Production:** Uses `REACT_APP_API_URL` environment variable

### Configuration Options

In `src/apiClient.js`, you can choose between:
- **Direct connection** (default): `http://localhost:5001`
- **Proxy connection**: Uses the proxy configuration in `package.json`

To switch to proxy mode, set `useProxy = true` in `apiClient.js`.

### Production Build

To build for production:
```bash
npm run build
```

To build for Azure deployment:
```bash
npm run build:azure
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
