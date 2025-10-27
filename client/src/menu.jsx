import { useState } from 'react';
import data from './data.json';
import './menu.css';

export default function Menu({ setLng, setLat, setZoom, setSelectedLocation }) {
    const [name, setName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const handleInputChange = async (event) => {
        const value = event.target.value;
        setName(value);
        setSearchError(null);

        if (value.trim()) {
            setIsSearching(true);
            try {
                // 検索処理をシミュレートする（実際のAPIコールの場合はここで非同期処理）
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const results = [];
                const searchTerm = value.toLowerCase();

                for (const key in data) {
                    if (data[key].name.toLowerCase().includes(searchTerm)) {
                        results.push(data[key]);
                    }
                }
                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                setSearchError('検索中にエラーが発生しました。');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const handleLocationClick = (result) => {
        try {
            setLng(result.lng);
            setLat(result.lat);
            setZoom(14);
            setSelectedLocation(result);
        } catch (error) {
            console.error('Location selection error:', error);
            setSearchError('選択した場所の読み込み中にエラーが発生しました。');
        }
    };

    const handleWebsiteClick = (url) => {
        try {
            window.open(url, '_blank');
        } catch (error) {
            console.error('Website opening error:', error);
            setSearchError('ウェブサイトを開けませんでした。');
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
