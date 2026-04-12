// Home page
import { Navbar } from '../components/navbar';
import './styles/Home.css';
export const Home = () => {

  return (
    <div>
      <Navbar />
      <div className='content'>
        <h2>Welcome to the Home Page</h2>  
      </div>
    </div>
  );
};