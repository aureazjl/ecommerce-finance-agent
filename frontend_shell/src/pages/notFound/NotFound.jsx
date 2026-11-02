import React from "react";

import "./notFound.css";

const NotFound = () => (
  <div className="notfound-container">
    <div className="notfound-title">404</div>
    <div className="notfound-message">Page Not Found</div>
    <div className="notfound-hint">
      Sorry, the page you are looking for does not exist.
      <br />
      Please check the URL or return to the homepage.
    </div>
  </div>
);

export default NotFound;
