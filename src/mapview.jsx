import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl'; // 必須: mapbox-glライブラリをインポート
import 'mapbox-gl/dist/mapbox-gl.css'; // 必須: MapboxのCSSをインポート
import './mapview.css'; // 地図のスタイルを定義したCSSファイルをインポート

import data from './data.json';  // JSONデータを変数として取得

// 環境変数からアクセストークンを読み込む
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Mapview({ lng, lat, zoom, selectedLocation, setSelectedLocation }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (map.current && lng && lat && zoom) {
            map.current.easeTo({
                center: [lng, lat],
                zoom: zoom,
                duration: 1000 // アニメーション時間
            });
        }
    }, [lng, lat, zoom]);

    useEffect(() => {
        if (map.current) return;

        // Mapboxトークンのチェック
        if (!mapboxgl.accessToken) {
            setError('Mapboxアクセストークンが設定されていません。');
            setLoading(false);
            return;
        }

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [lng || 139.3394, lat || 35.6581],
                zoom: zoom || 12,
                keyboard: true,
            });

            // エラーイベントのハンドリング
            map.current.on('error', (e) => {
                console.error('Map error:', e.error);
                setError('地図の読み込み中にエラーが発生しました。');
                setLoading(false);
            });

            // 地図のスタイル読み込み完了イベント
            map.current.on('style.load', () => {
                setLoading(false);
            });
        } catch (err) {
            console.error('Map initialization error:', err);
            setError('地図の初期化に失敗しました。');
            setLoading(false);
            return;
        }

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        const geolocate = new mapboxgl.GeolocateControl({
            trackUserLocation: true,
            fitBoundsOptions: {
                maxZoom: 12 // 初期ズームレベルを維持
            }
        });
        map.current.addControl(geolocate, 'bottom-right');


        map.current.on('load', () => {
            map.current.resize();

            const geojsonData = {
                type: 'FeatureCollection',
                features: Object.keys(data).map(key => {
                    const location = data[key];
                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [location.lng, location.lat]
                        },
                        properties: {
                            id: location.id,
                            name: location.name,
                            address: location.address,
                            phone: location.phone,
                            hours: location.hours,
                            website: location.website,
                            facilities: location.facilities,
                            price: location.price
                        }
                    };
                })
            };

            map.current.addSource('table-tennis-clubs', {
                type: 'geojson',
                generateId: true,
                data: geojsonData,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });

            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'table-tennis-clubs',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#FF6B6B',  // 赤系の色に変更
                        5,
                        '#FFA500',  // オレンジ
                        10,
                        '#32CD32'   // 緑
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        15,
                        5,
                        25,
                        10,
                        35
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'table-tennis-clubs',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            map.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'table-tennis-clubs',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#FF4444',
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            map.current.on('click', 'clusters', (e) => {
                const features = map.current.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                map.current
                    .getSource('table-tennis-clubs')
                    .getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err) return;

                        map.current.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom
                        });
                    });
            });

            // 個別のマーカーをクリックした時の処理
            map.current.on('click', 'unclustered-point', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;

                // 詳細なポップアップを表示
                const popupHTML = `
                        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${properties.name}</h3>
                        <p style="margin: 5px 0; color: #333;"><strong>📍 住所:</strong> ${properties.address}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>📞 電話:</strong> ${properties.phone}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>🕒 営業時間:</strong> ${properties.hours}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>💰 料金:</strong> ${properties.price}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>🏓 設備:</strong> ${properties.facilities}</p>
                        <a href="${properties.website}" target="_blank" style="color: #007cbf; text-decoration: none;">
                            🌐 ウェブサイトを見る
                        </a>
                `;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupHTML)
                    .addTo(map.current);
            });

            // マウスカーソルの変更イベント
            map.current.on('mouseenter', 'clusters', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'clusters', () => {
                map.current.getCanvas().style.cursor = '';
            });

            map.current.on('mouseenter', 'unclustered-point', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'unclustered-point', () => {
                map.current.getCanvas().style.cursor = '';
            });
        });

        // ウィンドウリサイズイベントリスナーを追加
        const handleResize = () => {
            if (map.current) {
                map.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        // クリーンアップ関数を追加
        return () => {
            window.removeEventListener('resize', handleResize);
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };

    }, []); // 空の依存配列を渡すことで、初回レンダリング時に一度だけ実行される

    useEffect(() => {
        if (selectedLocation && map.current) {
            // 座標移動完了後にポップアップを表示
            setTimeout(() => {
                const popupHTML = `
                    <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${selectedLocation.name}</h3>
                    <p style="margin: 5px 0; color: #333;"><strong>📍 住所:</strong> ${selectedLocation.address}</p>
                    <p style="margin: 5px 0; color: #333;"><strong>📞 電話:</strong> ${selectedLocation.phone}</p>
                    <p style="margin: 5px 0; color: #333;"><strong>🕒 営業時間:</strong> ${selectedLocation.hours}</p>
                    <p style="margin: 5px 0; color: #333;"><strong>💰 料金:</strong> ${selectedLocation.price}</p>
                    <p style="margin: 5px 0; color: #333;"><strong>🏓 設備:</strong> ${selectedLocation.facilities}</p>
                    <a href="${selectedLocation.website}" target="_blank" style="color: #007cbf; text-decoration: none;">
                        🌐 ウェブサイトを見る
                    </a>
                `;
                new mapboxgl.Popup()
                    .setLngLat([selectedLocation.lng, selectedLocation.lat])
                    .setHTML(popupHTML)
                    .addTo(map.current);
            }, 1100); // アニメーション時間より少し長く
        }
    }, [selectedLocation]);


    return (
        <div className="map-wrapper">
            {loading && (
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>地図を読み込み中...</p>
                </div>
            )}
            
            {error && (
                <div className="map-error">
                    <div className="error-content">
                        <h3>エラーが発生しました</h3>
                        <p>{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                window.location.reload();
                            }}
                            className="retry-button"
                        >
                            再読み込み
                        </button>
                    </div>
                </div>
            )}
            
            <div
                ref={mapContainer}
                className="map-container"
                style={{ visibility: loading || error ? 'hidden' : 'visible' }}
            />
        </div>
    );
}