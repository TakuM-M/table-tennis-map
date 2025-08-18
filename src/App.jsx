import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import MapView from './mapview'
import Menu from './menu'
import './App.css'

function App() {
  const [lng, setLng] = useState(139.3394);
  const [lat, setLat] = useState(35.6581);
  const [zoom, setZoom] = useState(12);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const containerClassName = isMenuOpen ? 'Wrap menu-open' : 'Wrap menu-closed';

  return (
    <div className={containerClassName}>
      <Menu isOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <MapView lng={lng} lat={lat} zoom={zoom} />
    </div>
  )
}

export default App
