export default function Menu({ isOpen, toggleMenu }) {
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
                <nav className="space-y-2">
                    {['🗺️ マップ', '⭐ お気に入り', '📍 履歴', '⚙️ 設定'].map((item, index) => (
                        <a
                            key={item}
                            href="#"
                            className={`
                                block py-3 px-4 rounded-lg text-gray-200
                                hover:bg-gray-600 hover:text-white 
                                transition-all duration-200
                                ${isOpen
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-4'
                                }
                            `}
                            style={{
                                transitionDelay: isOpen ? `${500 + index * 100}ms` : '0ms'
                            }}
                        >
                            {item}
                        </a>
                    ))}
                </nav>
                
                <div className="text-2xl text-white py-4">
                    <h1>TT Spot</h1>
                </div>
            </div>
        </div>
    );
}
