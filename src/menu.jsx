import { useState } from 'react';
import data from './data.json';

// menu.jsx（Tailwind版例）
export default function Menu({ isOpen, toggleMenu }) {
    const [name, setName] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleInputChange = (event) => {
        setName(event.target.value);
    };

    const handleSearch = () => {
        // 検索機能の実装（例: API呼び出しやフィルタリング）
        console.log(`Searching for: ${name}`);
        // ここで検索結果を処理するロジックを追加
        for (const key in data) {
            if (data[key].name.includes(name)) {
                console.log(`Found: ${data[key].name}`);
                setSearchResults((prevResults) => [...prevResults, data[key]]);
            }
        }
    };

    return (
        <div className="bg-gray-600 w-75 h-full">
            <div className="bg-gray-600 text-center text-5xl text-white">
                <button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 
                               border-none rounded-3xl text-white 
                               px-8 py-4 text-lg cursor-pointer 
                               shadow-lg transition-all duration-300 
                               font-semibold tracking-wide
                               hover:from-indigo-600 hover:to-blue-500 
                               hover:-translate-y-0.5 hover:scale-105 
                               hover:shadow-xl"
                    onClick={toggleMenu}
                >
                    {isOpen ? 'Close Menu' : 'Open Menu'}
                </button>
                <input type="text" className="mt-4 p-2 rounded-lg" placeholder="Search..." value={name} onChange={handleInputChange} />
                <button className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none rounded-3xl text-white px-8 py-4 text-lg cursor-pointer shadow-lg transition-all duration-300 font-semibold tracking-wide hover:from-indigo-600 hover:to-blue-500 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl" onClick={handleSearch}>
                    Search
                </button>
                <li>
                    {searchResults.map((result) => (
                        <div key={result.id} className="p-2 border-b border-gray-200">
                            {result.name}
                        </div>
                    ))}
                </li>
            </div>
        </div>
    );
}
