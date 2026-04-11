// Home page

import { useNavigate } from "react-router-dom";
import { Navbar } from '../components/navbar';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />
      <h2>Welcome to the Home Page</h2>      
    </div>
  );
};