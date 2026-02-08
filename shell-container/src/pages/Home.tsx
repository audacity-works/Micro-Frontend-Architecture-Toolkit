const Home = () => {
  return (
    <div className="home-page">
      <div className="jumbotron bg-light p-5 rounded">
        <h1 className="display-4">Welcome to MFE Platform</h1>
        <p className="lead">
          A micro-frontend architecture platform built with React, TypeScript, and Vite.
        </p>
        <hr className="my-4" />
        <p>
          This shell container orchestrates multiple micro-frontends, providing seamless
          navigation and integration between independent applications.
        </p>
        <div className="mt-4">
          <h3>Available Micro Frontends:</h3>
          <ul className="list-group mt-3">
            <li className="list-group-item">
              <strong>Authentication MFE</strong> - User login and registration
            </li>
            <li className="list-group-item">
              <strong>Payments MFE</strong> - Payment processing and management
            </li>
            <li className="list-group-item">
              <strong>Orders MFE</strong> - Order tracking and history
            </li>
            <li className="list-group-item">
              <strong>Profile MFE</strong> - User profile management
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
