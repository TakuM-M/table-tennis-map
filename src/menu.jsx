import { useState } from 'react';
import './menu.css';

export default function Menu() {
    const [isOpen, setIsOpen] = useState(false);
    const click = () => setIsOpen(!isOpen);

    return (
        <div id="menu">
            <div id="menuContent">
                <button onClick={click}>
                    {isOpen ? 'Close Menu' : 'Open Menu'}
                </button>
                <div id='Logomark'>
                    <h1>TT Spot</h1>
                </div>
            </div>
        </div>
    );
}