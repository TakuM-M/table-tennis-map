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

  return (
    <div className='Wrap'>
      <Menu />
      <MapView center={[lng, lat]} zoom={zoom} />
    </div>
  )
}

export default App
