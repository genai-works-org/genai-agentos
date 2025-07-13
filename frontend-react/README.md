# GenAI AgentOS React Frontend

A modern React.js frontend for the GenAI AgentOS platform, built with JavaScript, SCSS, and React Router for navigation.

## Features

- **Modern React.js**: Built with React 18 and functional components
- **Responsive Design**: Mobile-first approach with SCSS
- **Client-side Routing**: React Router for seamless navigation
- **Docker Support**: Containerized deployment ready
- **SCSS Styling**: Modular and maintainable stylesheets
- **Component Architecture**: Well-organized component structure

## Project Structure

```
frontend-react/
├── public/                 # Static assets
│   ├── index.html         # Main HTML file
│   └── manifest.json      # Web app manifest
├── src/
│   ├── components/        # Reusable components
│   │   └── Navigation.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   └── Dashboard.jsx
│   ├── styles/           # SCSS stylesheets
│   │   ├── index.scss    # Global styles
│   │   ├── App.scss      # App component styles
│   │   ├── Navigation.scss
│   │   ├── Home.scss
│   │   ├── About.scss
│   │   └── Dashboard.scss
│   ├── utils/            # Utility functions
│   │   └── reportWebVitals.js
│   ├── hooks/            # Custom React hooks
│   ├── types/            # Type definitions (if needed)
│   ├── assets/           # Images, icons, etc.
│   ├── services/         # API services
│   ├── App.jsx           # Main App component
│   └── index.jsx         # Application entry point
├── package.json          # Dependencies and scripts
├── Dockerfile           # Docker configuration
├── .dockerignore        # Docker ignore file
└── README.md           # This file
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the frontend-react directory:
```bash
cd frontend-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## Docker Deployment

### Build the Docker image:
```bash
docker build -t genai-agentos-react .
```

### Run the container:
```bash
docker run -p 3000:3000 genai-agentos-react
```

The application will be available at `http://localhost:3000`.

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Create corresponding SCSS file in `src/styles/`

### Adding New Components

1. Create a new component in `src/components/`
2. Import and use in your pages
3. Create corresponding SCSS file if needed

### Styling

The project uses SCSS with:
- CSS custom properties for theming
- Responsive mixins for breakpoints
- Modular component styles
- Global utility classes

## API Integration

The frontend is configured to proxy API requests to `http://localhost:8000` (backend server). Update the proxy setting in `package.json` if your backend runs on a different port.

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use functional components with hooks
3. Keep components small and focused
4. Add appropriate SCSS styles
5. Test your changes thoroughly

## License

This project is part of the GenAI AgentOS platform. 