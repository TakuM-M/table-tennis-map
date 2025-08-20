import { useState } from 'react';
import data from './data.json';

// menu.jsx（Tailwind版例）
export default function Menu({ isOpen, toggleMenu }) {
    const [name, setName] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setName(value);

        // リアルタイム検索
        if (value.trim()) {
            const results = [];
            const searchTerm = value.toLowerCase();

            for (const key in data) {
                if (data[key].name.toLowerCase().includes(searchTerm)) {
                    results.push(data[key]);
                }
            }
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };


    const handleSearch = () => {
        if (!name.trim()) {
            setSearchResults([]);
            return;
        }

        // 検索結果をリセットしてから新しい結果を設定
        const results = [];
        const searchTerm = name.toLowerCase();

        for (const key in data) {
            if (data[key].name.toLowerCase().includes(searchTerm)) {
                results.push(data[key]);
            }
        }

        setSearchResults(results);
        console.log(`Found ${results.length} results for: ${name}`);
    };


    return (
        <div className="bg-gray-600  w-75 h-full">
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

                <button className="bg-gradient-to-r from-blue-500 to-indigo-600
                border-none rounded-3xl text-white px-8 py-4 text-lg cursor-pointer
                shadow-lg transition-all duration-300 font-semibold tracking-wide
                hover:from-indigo-600 hover:to-blue-500 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl"
                onClick={handleSearch}>
                    Search
                </button>
                
                {searchResults.length > 0 && (
                    <div className="mt-4 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <h3 className="text-lg font-semibold p-3 text-gray-800 border-b">
                            検索結果 ({searchResults.length}件)
                        </h3>
                        <ul className="divide-y divide-gray-200">
                            {searchResults.map((result) => (
                                <li key={result.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                                    <div className="font-medium text-gray-900">{result.name}</div>
                                    <div className="text-sm text-gray-600">{result.address}</div>
                                    <div className="text-sm text-gray-500">{result.hours}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {name.trim() && searchResults.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                        <p className="text-yellow-800">「{name}」に一致する施設が見つかりませんでした。</p>
                    </div>
                )}

            </div>
        </div>
    );
}
