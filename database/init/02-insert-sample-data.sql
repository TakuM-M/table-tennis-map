-- FSXアリーナ
INSERT INTO locations (name, address, latitude, longitude, phone, website, 
    has_parking, has_rental_equipment, has_shower, has_locker, has_ac_heating)
VALUES 
    ('FSXアリーナ(くにたち市民総合体育館)', 
     '東京都国立市富士見台２丁目４８', 
     35.685209, 139.440279, 
     '042-573-4111', 
     'https://kuzaidan.or.jp/gym/rule/shisetsu-T2/',
     TRUE, FALSE, TRUE, TRUE, TRUE);

-- 営業時間を追加
INSERT INTO operating_hours (location_id, day_type, open_time, close_time)
VALUES 
    (1, 'weekday', '09:00:00', '22:00:00'),
    (1, 'saturday', '09:00:00', '22:00:00');

-- 料金を追加
INSERT INTO pricing (location_id, user_type, duration_hours, price)
VALUES 
    (1, 'resident', 3, 300),
    (1, 'non_resident', 3, 350);
