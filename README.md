# Sign Up Page Frontend

A modern, responsive sign-up page built with React, HTML, and CSS based on mobile UI design.

## Features

- **Email Sign-up Form**: Input field for user email with validation
- **OAuth Integration**: Continue with Google and Apple buttons
- **Responsive Design**: Works on all device sizes (mobile, tablet, desktop)
- **Modern UI**: Clean design with smooth transitions and hover effects
- **Mobile Phone Frame**: Includes status bar and home indicator for authentic mobile look

## Project Structure

```
src/
├── index.js              # React entry point
├── index.css             # Global styles
├── App.js                # Main App component
└── components/
    ├── SignUp.js         # Sign-up page component
    └── SignUp.css        # Sign-up component styles
public/
└── index.html            # HTML template
package.json              # Project dependencies
```

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Technologies Used

- **React 18**: JavaScript library for building user interfaces
- **CSS3**: Styling and responsive design
- **HTML5**: Markup structure

## Components

### SignUp Component
Main component that renders the sign-up page with:
- Email input field
- Continue button with form submission
- Google OAuth button
- Apple OAuth button
- Terms of Service and Privacy Policy links
- Mobile device frame styling

## Styling Features

- Clean, minimalist design
- Smooth transitions and hover effects
- Mobile-first responsive approach
- Accessibility considerations
- Modern color scheme (black, white, and neutral grays)

## Future Enhancements

- Email validation
- OAuth implementation with actual providers
- Form error handling
- Loading states
- Success messages
- Password strength indicator
- Two-factor authentication

## License

MIT
