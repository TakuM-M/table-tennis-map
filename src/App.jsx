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
  const [filter, setFilter] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const [selectedLocation, setSelectedLocation] = useState(null);


  return (
    <div className="app-container">
      <MapView lng={lng} lat={lat} zoom={zoom} selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
      <Menu setLng={setLng} setLat={setLat} setZoom={setZoom} setSelectedLocation={setSelectedLocation} />
    </div>
  )
}

export default App