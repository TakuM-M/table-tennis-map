import { useState } from 'react';
import data from './data.json';
import './menu.css';

export default function Menu({ setLng, setLat, setZoom, setSelectedLocation }) {
    const [name, setName] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleInputChange = (event) => {
        const value = event.target.value;
        setName(value);

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

    return (
        <div className="menuContainer">
            <div id="menuContent">
                <h3 className="menuTitle">名前検索</h3>
                <input
                    type="text"
                    className="searchInput"
                    placeholder="Search..."
                    value={name}
                    onChange={handleInputChange}
                />

                {searchResults.length > 0 && (
                    <div className="searchResults">
                        <h3 className="searchResultsHeader">
                            検索結果 ({searchResults.length}件)
                        </h3>
                        <ul className="searchResultsList">
                            {searchResults.map((result) => (
                                <li key={result.id} className="searchResultsItem">
                                    <div className="resultName">
                                        <p onClick={() => {
                                            setLng(result.lng);
                                            setLat(result.lat);
                                            setZoom(14);
                                            setSelectedLocation(result);
                                        }}
                                            className="clickable">
                                            {result.name}
                                        </p>
                                    </div>
                                    <div className="resultDetails">
                                        <p onClick={() => window.open(result.website, '_blank')} className="clickable website">
                                            ホームページ
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {name.trim() && searchResults.length === 0 && (
                    <div className="noResults">
                        <p className="noResultsText">「{name}」に一致する施設が見つかりませんでした。</p>
                    </div>
                )}

            </div>
        </div>
    );
}
