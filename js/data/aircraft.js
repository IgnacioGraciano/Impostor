/* ESTELA · catálogo de aeronaves
   y/e: año de entrada en servicio / fin de producción (0 = sigue en producción)
   seats: capacidad máxima en clase única densa · cargo: bodega (t) · rng: alcance con carga completa (km)
   spd: crucero (km/h) · burn: consumo (kg/km) · price: precio nuevo (M$) · maint: costo por hora de bloque ($)
   crew: pilotos en cabina · rwy: pista necesaria a MTOW (m) · oew: peso vacío operativo (t)
   len/dia: largo y alto de fuselaje (m) · eng: disposición de motores · wing: ala alta/baja · tail: c/T/X
   deck: 0 normal, 1 joroba 747, 3 joroba larga, 2 doble piso · wl: tipo de puntera · ch2: ruidoso (capítulo 2) */
'use strict';
E.CATS = {
  rp: 'Turbohélice regional', rj: 'Jet regional', nb: 'Fuselaje estrecho', wb: 'Fuselaje ancho', jb: 'Jumbo', ss: 'Supersónico', fr: 'Carguero'
};
E.AIRCRAFT = (() => {
  const L = [];
  const T = (id, mk, m, fam, cat, y, e, seats, cargo, rng, spd, burn, price, maint, crew, rwy, oew, len, dia, eng, wing, tail, deck, wl, extra) =>
    L.push(Object.assign({ id, mk, m, fam, cat, y, e, seats, cargo, rng, spd, burn, price, maint, crew, rwy, oew, len, dia, eng, wing, tail, deck, wl }, extra || {}));
  // ---------------- Turbohélices ----------------
  T('DHC6', 'de Havilland Canada', 'DHC-6 Twin Otter', 'DHC6', 'rp', 1966, 1988, 19, 0.3, 1400, 300, 1.0, 6, 250, 2, 500, 3.4, 15.8, 1.6, 'p2', 'hi', 'c', 0, 'none', { nose: 'blunt' });
  T('DHC6V', 'Viking', 'Twin Otter 400', 'DHC6', 'rp', 2010, 0, 19, 0.3, 1480, 310, 0.95, 7.5, 240, 2, 450, 3.4, 15.8, 1.6, 'p2', 'hi', 'c', 0, 'none', { nose: 'blunt' });
  T('EMB110', 'Embraer', 'EMB 110 Bandeirante', 'EMB110', 'rp', 1973, 1990, 18, 0.3, 1900, 340, 0.9, 4.5, 220, 2, 900, 3.6, 15.1, 1.7, 'p2', 'lo', 'c', 0, 'none', { nose: 'blunt' });
  T('F27', 'Fokker', 'F27 Friendship', 'F27', 'rp', 1958, 1987, 52, 1.0, 1700, 470, 1.6, 11, 420, 2, 1600, 11.2, 25.1, 2.7, 'p2', 'hi', 'c', 0, 'none', { nose: 'blunt', ch2: false });
  T('HS748', 'Hawker Siddeley', 'HS 748', 'HS748', 'rp', 1962, 1988, 48, 1.0, 1700, 450, 1.7, 10, 450, 2, 1300, 12.2, 20.4, 2.7, 'p2', 'lo', 'c', 0, 'none', { nose: 'blunt' });
  T('AN24', 'Antonov', 'An-24', 'AN24', 'rp', 1962, 1979, 50, 1.0, 1500, 450, 1.9, 7, 520, 3, 1600, 13.3, 23.5, 2.9, 'p2', 'hi', 'c', 0, 'none', { nose: 'blunt' });
  T('L188', 'Lockheed', 'L-188 Electra', 'L188', 'rp', 1959, 1961, 98, 3.0, 3500, 600, 3.2, 18, 950, 3, 1900, 26.0, 31.8, 3.4, 'p4', 'lo', 'c', 0, 'none', { nose: 'blunt' });
  T('DHC7', 'de Havilland Canada', 'Dash 7', 'DHC7', 'rp', 1978, 1988, 50, 1.0, 1300, 430, 1.9, 14, 620, 2, 700, 12.5, 24.6, 2.7, 'p4', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('EMB120', 'Embraer', 'EMB 120 Brasília', 'EMB120', 'rp', 1985, 2001, 30, 0.6, 1500, 550, 1.2, 9, 330, 2, 1400, 7.1, 20.0, 2.3, 'p2', 'lo', 'T', 0, 'none', { nose: 'blunt' });
  T('SF34', 'Saab', '340B', 'SF34', 'rp', 1983, 1999, 34, 0.7, 1700, 500, 1.15, 10, 330, 2, 1300, 8.1, 19.7, 2.3, 'p2', 'lo', 'c', 0, 'none', { nose: 'blunt' });
  T('SB20', 'Saab', '2000', 'SF34', 'rp', 1994, 1999, 50, 1.0, 2800, 665, 1.6, 17, 480, 2, 1300, 13.8, 27.3, 2.3, 'p2', 'lo', 'c', 0, 'none');
  T('AT43', 'ATR', 'ATR 42-300', 'ATR', 'rp', 1985, 1996, 48, 1.0, 1500, 490, 1.2, 13, 380, 2, 1100, 10.3, 22.7, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('AT46', 'ATR', 'ATR 42-600', 'ATR', 'rp', 2012, 0, 50, 1.0, 1300, 535, 1.1, 19, 360, 2, 1100, 11.6, 22.7, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('AT72', 'ATR', 'ATR 72-200', 'ATR', 'rp', 1989, 1997, 70, 1.3, 1500, 510, 1.55, 17, 450, 2, 1300, 12.5, 27.2, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('AT75', 'ATR', 'ATR 72-500', 'ATR', 'rp', 1997, 2011, 72, 1.3, 1600, 510, 1.45, 20, 430, 2, 1300, 12.9, 27.2, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('AT76', 'ATR', 'ATR 72-600', 'ATR', 'rp', 2011, 0, 78, 1.4, 1500, 510, 1.4, 26, 420, 2, 1300, 13.5, 27.2, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('DH8A', 'de Havilland Canada', 'Dash 8-100', 'DH8', 'rp', 1984, 2005, 39, 0.8, 1900, 500, 1.15, 12, 360, 2, 1000, 10.5, 22.3, 2.7, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('DH8C', 'de Havilland Canada', 'Dash 8-300', 'DH8', 'rp', 1989, 2009, 56, 1.0, 1700, 530, 1.35, 16, 420, 2, 1100, 11.8, 25.7, 2.7, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  T('DH8D', 'De Havilland', 'Dash 8 Q400', 'DH8', 'rp', 2000, 0, 90, 1.5, 2000, 667, 1.75, 30, 560, 2, 1400, 17.1, 32.8, 2.7, 'p2', 'hi', 'T', 0, 'none');
  T('F50', 'Fokker', 'Fokker 50', 'F27', 'rp', 1987, 1997, 58, 1.0, 2000, 520, 1.4, 15, 420, 2, 1300, 12.5, 25.2, 2.7, 'p2', 'hi', 'c', 0, 'none', { nose: 'blunt' });
  T('D328', 'Dornier', '328', 'D328', 'rp', 1993, 2000, 33, 0.7, 1300, 620, 1.2, 11, 360, 2, 1100, 9.0, 21.3, 2.4, 'p2', 'hi', 'T', 0, 'none');
  T('AT7F', 'ATR', 'ATR 72-500F', 'ATR', 'fr', 2002, 0, 0, 8.5, 1500, 510, 1.45, 14, 430, 2, 1300, 12.0, 27.2, 2.6, 'p2', 'hi', 'T', 0, 'none', { nose: 'blunt' });
  // ---------------- Jets regionales ----------------
  T('F28', 'Fokker', 'F28 Fellowship', 'F28', 'rj', 1969, 1987, 85, 2.0, 2000, 840, 3.0, 22, 820, 2, 1700, 17.6, 29.6, 3.3, 't2', 'lo', 'T', 0, 'none', { ch2: true });
  T('T134', 'Tupolev', 'Tu-134A', 'T134', 'rj', 1970, 1984, 84, 2.0, 2400, 850, 3.5, 14, 950, 3, 2200, 29.0, 37.1, 2.9, 't2', 'lo', 'T', 0, 'none', { ch2: true, nose: 'sharp' });
  T('B462', 'British Aerospace', 'BAe 146-200', 'B146', 'rj', 1983, 1993, 100, 2.0, 2900, 750, 2.8, 26, 920, 2, 1500, 23.8, 28.6, 3.6, 'w4', 'hi', 'T', 0, 'none');
  T('RJ85', 'Avro', 'RJ85', 'B146', 'rj', 1993, 2003, 100, 2.0, 2900, 760, 2.7, 30, 900, 2, 1400, 24.6, 28.6, 3.6, 'w4', 'hi', 'T', 0, 'none');
  T('F100', 'Fokker', 'Fokker 100', 'F28', 'rj', 1988, 1997, 109, 2.5, 3100, 845, 3.0, 30, 850, 2, 1800, 24.5, 35.5, 3.3, 't2', 'lo', 'T', 0, 'none');
  T('F70', 'Fokker', 'Fokker 70', 'F28', 'rj', 1994, 1997, 80, 2.0, 3400, 845, 2.6, 26, 780, 2, 1600, 22.7, 30.9, 3.3, 't2', 'lo', 'T', 0, 'none');
  T('CRJ2', 'Bombardier', 'CRJ200', 'CRJ', 'rj', 1992, 2006, 50, 1.0, 3000, 786, 1.85, 24, 700, 2, 1800, 13.8, 26.8, 2.7, 't2', 'lo', 'T', 0, 'winglet');
  T('CRJ7', 'Bombardier', 'CRJ700', 'CRJ', 'rj', 2001, 2020, 78, 1.5, 3100, 828, 2.2, 32, 760, 2, 1700, 20.1, 32.5, 2.7, 't2', 'lo', 'T', 0, 'winglet');
  T('CRJ9', 'Bombardier', 'CRJ900', 'CRJ', 'rj', 2003, 2020, 90, 1.7, 2900, 828, 2.4, 36, 800, 2, 1800, 21.8, 36.2, 2.7, 't2', 'lo', 'T', 0, 'winglet');
  T('E145', 'Embraer', 'ERJ 145', 'ERJ', 'rj', 1996, 2020, 50, 1.0, 2800, 830, 1.8, 21, 650, 2, 1800, 12.1, 29.9, 2.3, 't2', 'lo', 'T', 0, 'winglet');
  T('E170', 'Embraer', 'E170', 'EJET', 'rj', 2004, 0, 78, 2.0, 3900, 830, 2.15, 33, 720, 2, 1650, 21.1, 29.9, 3.0, 'w2', 'lo', 'c', 0, 'winglet');
  T('E175', 'Embraer', 'E175', 'EJET', 'rj', 2005, 0, 88, 2.0, 3700, 830, 2.3, 36, 760, 2, 1700, 21.9, 31.7, 3.0, 'w2', 'lo', 'c', 0, 'winglet', { etops: true });
  T('E190', 'Embraer', 'E190', 'EJET', 'rj', 2005, 2020, 114, 2.5, 4500, 830, 2.55, 42, 850, 2, 1700, 28.1, 36.2, 3.0, 'w2', 'lo', 'c', 0, 'winglet', { etops: true });
  T('E195', 'Embraer', 'E195', 'EJET', 'rj', 2006, 2020, 124, 2.5, 4200, 830, 2.7, 45, 880, 2, 1800, 28.7, 38.7, 3.0, 'w2', 'lo', 'c', 0, 'winglet', { etops: true });
  T('E290', 'Embraer', 'E190-E2', 'EJET', 'rj', 2018, 0, 114, 2.5, 5300, 830, 2.15, 48, 780, 2, 1600, 33.0, 36.2, 3.0, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('E295', 'Embraer', 'E195-E2', 'EJET', 'rj', 2019, 0, 146, 3.0, 4800, 830, 2.45, 55, 800, 2, 1900, 35.7, 41.5, 3.0, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('SU95', 'Sukhoi', 'Superjet 100', 'SU95', 'rj', 2011, 0, 108, 2.5, 3000, 830, 2.6, 32, 1000, 2, 1700, 24.3, 29.9, 3.2, 'w2', 'lo', 'c', 0, 'sharklet');
  T('AJ27', 'COMAC', 'ARJ21-700', 'AJ27', 'rj', 2016, 0, 105, 2.5, 3700, 820, 2.8, 30, 950, 2, 1700, 25.1, 33.5, 3.1, 't2', 'lo', 'T', 0, 'winglet');
  // ---------------- Fuselaje estrecho ----------------
  T('S210', 'Sud Aviation', 'Caravelle III', 'S210', 'nb', 1959, 1972, 99, 1.5, 1700, 780, 3.7, 18, 1150, 3, 1900, 24.0, 32.0, 3.2, 't2', 'lo', 'X', 0, 'none', { ch2: true, nose: 'sharp' });
  T('BA11', 'BAC', 'One-Eleven 500', 'BA11', 'nb', 1968, 1982, 119, 2.0, 2700, 790, 3.4, 22, 1000, 2, 2000, 24.8, 32.6, 3.4, 't2', 'lo', 'T', 0, 'none', { ch2: true });
  T('DC93', 'McDonnell Douglas', 'DC-9-30', 'DC9', 'nb', 1967, 1982, 127, 2.5, 2700, 810, 3.5, 26, 950, 2, 2100, 25.9, 36.4, 3.3, 't2', 'lo', 'T', 0, 'none', { ch2: true });
  T('MD82', 'McDonnell Douglas', 'MD-82', 'DC9', 'nb', 1981, 1999, 172, 3.5, 3800, 810, 3.9, 35, 1050, 2, 2300, 35.4, 45.1, 3.3, 't2', 'lo', 'T', 0, 'none');
  T('MD90', 'McDonnell Douglas', 'MD-90', 'DC9', 'nb', 1995, 2000, 172, 3.5, 3900, 810, 3.6, 40, 1000, 2, 2200, 39.9, 46.5, 3.3, 't2', 'lo', 'T', 0, 'none');
  T('B712', 'Boeing', '717-200', 'DC9', 'nb', 1999, 2006, 134, 3.0, 2600, 811, 3.0, 36, 900, 2, 1900, 31.7, 37.8, 3.3, 't2', 'lo', 'T', 0, 'none');
  T('B721', 'Boeing', '727-100', 'B727', 'nb', 1964, 1972, 131, 3.0, 4100, 880, 4.6, 30, 1400, 3, 2300, 36.0, 40.6, 3.8, 't3', 'lo', 'T', 0, 'none', { ch2: true });
  T('B722', 'Boeing', '727-200 Advanced', 'B727', 'nb', 1972, 1984, 189, 4.0, 4000, 880, 5.0, 38, 1500, 3, 2400, 46.0, 46.7, 3.8, 't3', 'lo', 'T', 0, 'none', { ch2: true });
  T('TRID', 'Hawker Siddeley', 'Trident 2E', 'TRID', 'nb', 1968, 1978, 132, 3.0, 3900, 870, 4.6, 27, 1450, 3, 2300, 33.0, 35.0, 3.4, 't3', 'lo', 'T', 0, 'none', { ch2: true, nose: 'sharp' });
  T('T154', 'Tupolev', 'Tu-154', 'T154', 'nb', 1972, 2013, 180, 4.0, 3900, 900, 5.4, 28, 1450, 3, 2300, 55.3, 47.9, 3.8, 't3', 'lo', 'T', 0, 'none', { ch2: true, nose: 'sharp' });
  T('YK42', 'Yakovlev', 'Yak-42D', 'YK42', 'nb', 1980, 2003, 120, 2.5, 2200, 810, 3.6, 20, 1100, 3, 2000, 34.5, 36.4, 3.8, 't3', 'lo', 'T', 0, 'none');
  T('B732', 'Boeing', '737-200 Advanced', 'B737', 'nb', 1971, 1988, 130, 2.5, 3500, 780, 3.6, 30, 950, 2, 1900, 27.6, 30.5, 3.76, 'w2', 'lo', 'c', 0, 'none', { ch2: true, eng2: 'jt8d' });
  T('B733', 'Boeing', '737-300', 'B737', 'nb', 1984, 1999, 149, 3.0, 4200, 794, 3.3, 36, 950, 2, 1900, 32.7, 33.4, 3.76, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B734', 'Boeing', '737-400', 'B737', 'nb', 1988, 2000, 188, 3.0, 4000, 794, 3.5, 40, 980, 2, 2200, 33.6, 36.4, 3.76, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B735', 'Boeing', '737-500', 'B737', 'nb', 1990, 1999, 132, 2.5, 4400, 794, 3.1, 33, 920, 2, 1800, 31.3, 31.0, 3.76, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B737', 'Boeing', '737-700', 'B737', 'nb', 1998, 2019, 149, 3.0, 6000, 842, 2.75, 45, 950, 2, 1900, 38.1, 33.6, 3.76, 'w2', 'lo', 'c', 0, 'blended', { etops: true });
  T('B738', 'Boeing', '737-800', 'B737', 'nb', 1998, 2019, 189, 4.0, 5400, 842, 3.0, 52, 1050, 2, 2300, 41.4, 39.5, 3.76, 'w2', 'lo', 'c', 0, 'blended', { etops: true });
  T('B739', 'Boeing', '737-900ER', 'B737', 'nb', 2007, 2019, 220, 4.5, 5000, 842, 3.2, 56, 1100, 2, 2500, 44.7, 42.1, 3.76, 'w2', 'lo', 'c', 0, 'blended', { etops: true });
  T('B38M', 'Boeing', '737 MAX 8', 'B737', 'nb', 2017, 0, 210, 4.0, 6500, 839, 2.6, 58, 950, 2, 2500, 45.1, 39.5, 3.76, 'w2', 'lo', 'c', 0, 'split', { etops: true });
  T('B3XM', 'Boeing', '737 MAX 10', 'B737', 'nb', 2026, 0, 230, 4.5, 5700, 839, 2.75, 64, 980, 2, 2600, 50.5, 43.8, 3.76, 'w2', 'lo', 'c', 0, 'split', { etops: true });
  T('B752', 'Boeing', '757-200', 'B757', 'nb', 1983, 2004, 239, 7.0, 7200, 850, 4.2, 60, 1500, 2, 2100, 57.9, 47.3, 3.76, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B753', 'Boeing', '757-300', 'B757', 'nb', 1999, 2004, 280, 8.0, 6300, 850, 4.6, 65, 1600, 2, 2500, 64.6, 54.4, 3.76, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('A319', 'Airbus', 'A319', 'A320', 'nb', 1996, 2020, 156, 3.0, 6800, 840, 2.75, 45, 1000, 2, 1900, 40.8, 33.8, 3.95, 'w2', 'lo', 'c', 0, 'fence', { etops: true, nose: 'round' });
  T('A320', 'Airbus', 'A320-200', 'A320', 'nb', 1988, 2020, 180, 4.0, 6100, 840, 2.95, 50, 1050, 2, 2100, 42.6, 37.6, 3.95, 'w2', 'lo', 'c', 0, 'fence', { etops: true, nose: 'round' });
  T('A321', 'Airbus', 'A321-200', 'A320', 'nb', 1994, 2020, 220, 4.5, 5900, 840, 3.4, 57, 1150, 2, 2200, 48.5, 44.5, 3.95, 'w2', 'lo', 'c', 0, 'fence', { etops: true, nose: 'round' });
  T('A20N', 'Airbus', 'A320neo', 'A320', 'nb', 2016, 0, 194, 4.0, 6300, 840, 2.5, 56, 950, 2, 2100, 44.3, 37.6, 3.95, 'w2', 'lo', 'c', 0, 'sharklet', { etops: true, nose: 'round' });
  T('A21N', 'Airbus', 'A321neo', 'A320', 'nb', 2017, 0, 244, 4.5, 7400, 840, 2.85, 65, 1050, 2, 2300, 50.1, 44.5, 3.95, 'w2', 'lo', 'c', 0, 'sharklet', { etops: true, nose: 'round' });
  T('A21X', 'Airbus', 'A321XLR', 'A320', 'nb', 2024, 0, 220, 3.5, 8700, 840, 2.95, 72, 1080, 2, 2400, 52.0, 44.5, 3.95, 'w2', 'lo', 'c', 0, 'sharklet', { etops: true, nose: 'round' });
  T('C919', 'COMAC', 'C919', 'C919', 'nb', 2023, 0, 192, 4.0, 4100, 830, 2.7, 45, 1100, 2, 2200, 45.7, 38.9, 3.96, 'w2', 'lo', 'c', 0, 'winglet', { etops: true });
  T('B38F', 'Boeing', '737-800BCF', 'B737', 'fr', 2018, 0, 0, 23, 3700, 842, 3.0, 30, 1050, 2, 2300, 41.0, 39.5, 3.76, 'w2', 'lo', 'c', 0, 'blended', { etops: true });
  // ---------------- Fuselaje ancho ----------------
  T('B703', 'Boeing', '707-320B', 'B707', 'wb', 1962, 1979, 189, 7.0, 9300, 880, 7.3, 55, 2000, 3, 3000, 66.4, 46.6, 3.76, 'w4', 'lo', 'c', 0, 'none', { ch2: true });
  T('DC86', 'Douglas', 'DC-8-63', 'DC8', 'wb', 1967, 1972, 259, 9.0, 7200, 870, 8.0, 60, 2100, 3, 3200, 69.5, 57.1, 3.73, 'w4', 'lo', 'c', 0, 'none', { ch2: true });
  T('VC10', 'Vickers', 'Super VC10', 'VC10', 'wb', 1965, 1970, 163, 5.0, 7600, 890, 7.6, 50, 2300, 3, 2500, 71.8, 52.3, 3.8, 't4', 'lo', 'T', 0, 'none', { ch2: true });
  T('IL62', 'Ilyushin', 'Il-62M', 'IL62', 'wb', 1974, 1995, 186, 5.0, 10000, 850, 8.3, 40, 2200, 3, 3300, 69.4, 53.1, 3.75, 't4', 'lo', 'T', 0, 'none', { ch2: true });
  T('A30B', 'Airbus', 'A300B4', 'A300', 'wb', 1974, 1984, 345, 14, 5400, 850, 7.0, 95, 2900, 3, 2600, 88.5, 53.6, 5.64, 'w2', 'lo', 'c', 0, 'none', { nose: 'round' });
  T('A306', 'Airbus', 'A300-600R', 'A300', 'wb', 1984, 2007, 345, 15, 7500, 850, 6.6, 105, 2700, 2, 2400, 90.1, 54.1, 5.64, 'w2', 'lo', 'c', 0, 'fence', { etops: true, nose: 'round' });
  T('A310', 'Airbus', 'A310-300', 'A300', 'wb', 1985, 1998, 280, 11, 9600, 850, 5.9, 95, 2500, 2, 2400, 80.1, 46.7, 5.64, 'w2', 'lo', 'c', 0, 'fence', { etops: true, nose: 'round' });
  T('DC10', 'McDonnell Douglas', 'DC-10-30', 'DC10', 'wb', 1972, 1988, 380, 16, 9600, 908, 9.6, 120, 4200, 3, 3200, 120.6, 55.5, 6.0, 'w2t1', 'lo', 'c', 0, 'none');
  T('L101', 'Lockheed', 'L-1011 TriStar', 'L101', 'wb', 1972, 1984, 400, 15, 7400, 900, 9.4, 120, 4400, 3, 2800, 111.3, 54.2, 6.0, 'w2s', 'lo', 'c', 0, 'none');
  T('L15', 'Lockheed', 'L-1011-500 TriStar', 'L101', 'wb', 1979, 1984, 330, 13, 9900, 900, 8.8, 125, 4300, 3, 2900, 108.0, 50.1, 6.0, 'w2s', 'lo', 'c', 0, 'none');
  T('MD11', 'McDonnell Douglas', 'MD-11', 'DC10', 'wb', 1990, 2000, 410, 18, 12600, 900, 9.3, 150, 4300, 2, 3100, 128.8, 61.6, 6.0, 'w2t1', 'lo', 'c', 0, 'winglet');
  T('IL86', 'Ilyushin', 'Il-86', 'IL86', 'wb', 1980, 1991, 350, 10, 3600, 900, 11.0, 60, 4000, 3, 2700, 117.0, 59.5, 6.08, 'w4', 'lo', 'c', 0, 'none');
  T('IL96', 'Ilyushin', 'Il-96-300', 'IL86', 'wb', 1993, 2015, 300, 12, 11000, 870, 8.4, 70, 3800, 2, 3100, 117.0, 55.3, 6.08, 'w4', 'lo', 'c', 0, 'winglet');
  T('B762', 'Boeing', '767-200ER', 'B767', 'wb', 1984, 1994, 255, 10, 12200, 851, 5.3, 90, 2200, 2, 2500, 82.4, 48.5, 5.03, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B763', 'Boeing', '767-300ER', 'B767', 'wb', 1988, 2014, 351, 13, 11000, 851, 5.9, 110, 2400, 2, 2650, 90.0, 54.9, 5.03, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B764', 'Boeing', '767-400ER', 'B767', 'wb', 2000, 2009, 375, 14, 10400, 851, 6.2, 120, 2500, 2, 3000, 103.9, 61.4, 5.03, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('A333', 'Airbus', 'A330-300', 'A330', 'wb', 1994, 2020, 440, 18, 11700, 871, 6.9, 130, 2600, 2, 2800, 129.4, 63.7, 5.64, 'w2', 'lo', 'c', 0, 'winglet', { etops: true, nose: 'round' });
  T('A332', 'Airbus', 'A330-200', 'A330', 'wb', 1998, 2020, 406, 15, 13400, 871, 6.7, 125, 2600, 2, 2800, 120.6, 58.8, 5.64, 'w2', 'lo', 'c', 0, 'winglet', { etops: true, nose: 'round' });
  T('A339', 'Airbus', 'A330-900neo', 'A330', 'wb', 2018, 0, 460, 18, 13300, 871, 6.0, 140, 2400, 2, 2800, 135.0, 63.7, 5.64, 'w2', 'lo', 'c', 0, 'sharklet', { etops: true, nose: 'round' });
  T('A343', 'Airbus', 'A340-300', 'A340', 'wb', 1993, 2008, 440, 18, 13700, 871, 7.9, 140, 3200, 2, 3000, 130.2, 63.7, 5.64, 'w4', 'lo', 'c', 0, 'winglet', { nose: 'round' });
  T('A345', 'Airbus', 'A340-500', 'A340', 'wb', 2003, 2011, 375, 15, 16600, 881, 8.9, 165, 3500, 2, 3300, 170.4, 67.9, 5.64, 'w4', 'lo', 'c', 0, 'winglet', { nose: 'round' });
  T('A346', 'Airbus', 'A340-600', 'A340', 'wb', 2002, 2011, 475, 22, 14600, 881, 9.2, 170, 3600, 2, 3200, 177.0, 75.4, 5.64, 'w4', 'lo', 'c', 0, 'winglet', { nose: 'round' });
  T('B772', 'Boeing', '777-200ER', 'B777', 'wb', 1997, 2018, 440, 20, 13000, 892, 7.4, 165, 3000, 2, 3100, 138.1, 63.7, 6.2, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('B77L', 'Boeing', '777-200LR', 'B777', 'wb', 2006, 2018, 440, 18, 15800, 892, 7.6, 180, 3100, 2, 3200, 145.1, 63.7, 6.2, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('B77W', 'Boeing', '777-300ER', 'B777', 'wb', 2004, 2025, 550, 25, 13600, 892, 8.3, 185, 3200, 2, 3200, 167.8, 73.9, 6.2, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('B779', 'Boeing', '777-9', 'B777', 'wb', 2026, 0, 540, 25, 13500, 905, 7.4, 220, 3000, 2, 3100, 181.4, 76.7, 6.2, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('B788', 'Boeing', '787-8 Dreamliner', 'B787', 'wb', 2011, 0, 330, 14, 13600, 903, 5.4, 125, 2100, 2, 2700, 119.9, 56.7, 5.77, 'w2', 'lo', 'c', 0, 'raked', { etops: true, nose: 'round' });
  T('B789', 'Boeing', '787-9 Dreamliner', 'B787', 'wb', 2014, 0, 390, 17, 14000, 903, 6.0, 145, 2250, 2, 2800, 128.9, 62.8, 5.77, 'w2', 'lo', 'c', 0, 'raked', { etops: true, nose: 'round' });
  T('B78X', 'Boeing', '787-10 Dreamliner', 'B787', 'wb', 2018, 0, 440, 20, 11900, 903, 6.4, 160, 2350, 2, 2900, 135.5, 68.3, 5.77, 'w2', 'lo', 'c', 0, 'raked', { etops: true, nose: 'round' });
  T('A359', 'Airbus', 'A350-900', 'A350', 'wb', 2015, 0, 440, 18, 15000, 903, 6.3, 150, 2300, 2, 2700, 142.4, 66.8, 5.96, 'w2', 'lo', 'c', 0, 'curved', { etops: true, nose: 'round', mask: true });
  T('A35K', 'Airbus', 'A350-1000', 'A350', 'wb', 2018, 0, 480, 22, 16100, 903, 7.0, 175, 2500, 2, 2900, 155.0, 73.8, 5.96, 'w2', 'lo', 'c', 0, 'curved', { etops: true, nose: 'round', mask: true });
  T('B763F', 'Boeing', '767-300F', 'B767', 'fr', 1995, 0, 0, 52, 6000, 851, 5.8, 105, 2400, 2, 2700, 86.0, 54.9, 5.03, 'w2', 'lo', 'c', 0, 'none', { etops: true });
  T('A33F', 'Airbus', 'A330-200F', 'A330', 'fr', 2010, 2020, 0, 70, 7400, 871, 6.6, 120, 2600, 2, 2900, 109.0, 58.8, 5.64, 'w2', 'lo', 'c', 0, 'winglet', { etops: true, nose: 'round' });
  T('MD1F', 'McDonnell Douglas', 'MD-11F', 'DC10', 'fr', 1991, 2000, 0, 91, 7300, 900, 9.4, 140, 4300, 2, 3100, 112.0, 61.6, 6.0, 'w2t1', 'lo', 'c', 0, 'winglet');
  T('DC8F', 'Douglas', 'DC-8-63F', 'DC8', 'fr', 1968, 1972, 0, 45, 6000, 870, 7.6, 50, 2100, 3, 3200, 64.0, 57.1, 3.73, 'w4', 'lo', 'c', 0, 'none', { ch2: true });
  T('B77F', 'Boeing', '777F', 'B777', 'fr', 2009, 0, 0, 102, 9200, 892, 8.0, 180, 3100, 2, 3200, 144.0, 63.7, 6.2, 'w2', 'lo', 'c', 0, 'raked', { etops: true });
  T('A35F', 'Airbus', 'A350F', 'A350', 'fr', 2027, 0, 0, 111, 8700, 903, 7.2, 200, 2500, 2, 3000, 140.0, 70.8, 5.96, 'w2', 'lo', 'c', 0, 'curved', { etops: true, nose: 'round', mask: true });
  // ---------------- Jumbos ----------------
  T('B741', 'Boeing', '747-100', 'B747', 'jb', 1970, 1986, 480, 20, 9800, 895, 13.6, 170, 5600, 3, 3200, 162.4, 70.6, 6.5, 'w4', 'lo', 'c', 1, 'none', { ch2: true });
  T('B742', 'Boeing', '747-200B', 'B747', 'jb', 1971, 1991, 480, 22, 12700, 895, 13.4, 185, 5400, 3, 3300, 170.0, 70.6, 6.5, 'w4', 'lo', 'c', 1, 'none');
  T('B74S', 'Boeing', '747SP', 'B747', 'jb', 1976, 1989, 330, 15, 12300, 900, 11.8, 150, 5000, 3, 2900, 147.0, 56.3, 6.5, 'w4', 'lo', 'c', 1, 'none');
  T('B743', 'Boeing', '747-300', 'B747', 'jb', 1983, 1990, 500, 22, 12400, 900, 13.2, 195, 5300, 3, 3300, 174.0, 70.6, 6.5, 'w4', 'lo', 'c', 3, 'none');
  T('B744', 'Boeing', '747-400', 'B747', 'jb', 1989, 2009, 524, 22, 13400, 913, 11.8, 220, 4800, 2, 3300, 178.8, 70.6, 6.5, 'w4', 'lo', 'c', 3, 'winglet');
  T('B748', 'Boeing', '747-8 Intercontinental', 'B747', 'jb', 2012, 2017, 560, 25, 14300, 917, 12.2, 250, 4900, 2, 3200, 220.0, 76.3, 6.5, 'w4', 'lo', 'c', 3, 'raked');
  T('A388', 'Airbus', 'A380-800', 'A380', 'jb', 2007, 2021, 853, 25, 15000, 903, 14.0, 260, 6000, 2, 3000, 277.0, 72.7, 8.4, 'w4', 'lo', 'c', 2, 'fence', { a380: true, nose: 'round' });
  T('B74F', 'Boeing', '747-400F', 'B747', 'fr', 1993, 2009, 0, 113, 8200, 913, 12.0, 210, 4800, 2, 3300, 164.0, 70.6, 6.5, 'w4', 'lo', 'c', 1, 'winglet');
  T('B48F', 'Boeing', '747-8F', 'B747', 'fr', 2011, 2022, 0, 134, 8100, 917, 12.6, 240, 4900, 2, 3300, 197.0, 76.3, 6.5, 'w4', 'lo', 'c', 1, 'raked');
  // ---------------- Supersónico ----------------
  T('CONC', 'Aérospatiale-BAC', 'Concorde', 'CONC', 'ss', 1976, 1979, 100, 0.5, 7200, 2150, 11.9, 280, 16000, 3, 3600, 78.7, 61.7, 2.9, 'c4', 'lo', 'c', 0, 'none', { sst: true, nose: 'concorde', ch2: true });
  return L;
})();
E.AC = {};
E.AIRCRAFT.forEach(t => {
  E.AC[t.id] = t;
  t.engines = { p2: 2, p4: 4, w2: 2, w4: 4, t2: 2, t3: 3, t4: 4, w2t1: 3, w2s: 3, c4: 4 }[t.eng];
  t.prop = t.eng === 'p2' || t.eng === 'p4';
  t.freighter = t.cat === 'fr';
  t.name = t.mk + ' ' + t.m;
  t.short = t.m.replace(' Dreamliner', '').replace(' Advanced', ' Adv');
  // MTOW coherente con el alcance: OEW + carga útil completa + combustible para el alcance
  const payload = t.seats * 0.1 + t.cargo * (t.freighter ? 1 : 0.6);
  const fuelR = t.burn * t.rng * 1.12 + t.burn * t.spd * 0.75;
  t.payloadMax = payload;
  t.mtow = Math.round(t.oew + payload + fuelR / 1000);
  t.fuelCap = Math.round(fuelR / 1000 * 1.18 * 10) / 10;
  t.turn = { rp: 0.4, rj: 0.5, nb: 0.65, wb: 1.2, jb: 1.6, ss: 1.4, fr: 1.5 }[t.cat]; // horas de rotación mínima
  t.cabinCrew = (seats => seats < 20 ? 0 : Math.ceil(seats / 50))(t.seats);
  t.twin = t.engines === 2;
});

/* -------- Productos de cabina (unidades de espacio por asiento, puntaje de confort, año) -------- */
E.CABIN = {
  y: {
    dense: { n: 'Densa (29")', u: 1.0, s: 0.3, y: 1950 },
    std: { n: 'Estándar (31")', u: 1.08, s: 0.55, y: 1950 },
    comfort: { n: 'Confort (34")', u: 1.2, s: 0.78, y: 1950 }
  },
  p: { std: { n: 'Premium Economy', u: 1.45, s: 0.7, y: 1992, req: 'py' } },
  j: {
    rec: { n: 'Butaca reclinable', u: 2.0, s: 0.35, y: 1960 },
    cradle: { n: 'Cuna (sleeper)', u: 2.6, s: 0.5, y: 1990 },
    angled: { n: 'Cama inclinada', u: 3.0, s: 0.66, y: 1999, req: 'flatbed' },
    flat: { n: 'Cama plana total', u: 3.5, s: 0.86, y: 2006, req: 'flatbed' },
    suite: { n: 'Suite con puerta', u: 3.8, s: 1.0, y: 2017, req: 'suites' }
  },
  f: {
    rec: { n: 'Butaca de primera', u: 3.0, s: 0.4, y: 1960 },
    sleeper: { n: 'Sleeper de primera', u: 3.6, s: 0.6, y: 1985 },
    flat: { n: 'Cama plana', u: 4.5, s: 0.82, y: 1996, req: 'flatbed' },
    suite: { n: 'Suite privada', u: 5.5, s: 1.0, y: 2007, req: 'suites' }
  }
};
// expectativa del mercado por año (para calcular calidad relativa)
E.EXPECT = {
  y: { 1970: 0.72, 1985: 0.62, 2000: 0.52, 2015: 0.45, 2030: 0.42 },
  j: { 1970: 0.35, 1990: 0.45, 2000: 0.6, 2008: 0.75, 2016: 0.85, 2025: 0.92 },
  f: { 1970: 0.4, 1990: 0.55, 2000: 0.75, 2010: 0.9, 2025: 0.95 },
  p: { 1990: 0.6, 2025: 0.7 }
};

/* -------- Servicios a bordo -------- */
E.SVC = {
  cateringY: {
    none: { n: 'Sin servicio', s: 0, c: 0, ch: 0 },
    bob: { n: 'Venta a bordo', s: 0.15, c: 0.3, ch: 0, rev: 3 },
    snack: { n: 'Snack y bebida', s: 0.4, c: 2.2, ch: 0.5 },
    hot: { n: 'Comida caliente', s: 0.65, c: 5.5, ch: 1.4 },
    premium: { n: 'Menú premium', s: 0.85, c: 10, ch: 2.4 }
  },
  cateringJ: {
    std: { n: 'Estándar', s: 0.5, c: 18, ch: 5 },
    gourmet: { n: 'Gourmet', s: 0.75, c: 35, ch: 9 },
    chef: { n: 'Menú de autor', s: 0.95, c: 60, ch: 15, req: 'chef' }
  },
  cateringF: {
    gourmet: { n: 'Gourmet', s: 0.6, c: 60, ch: 14 },
    chef: { n: 'Menú de autor', s: 0.85, c: 110, ch: 24, req: 'chef' },
    caviar: { n: 'Caviar y champagne', s: 1.0, c: 200, ch: 30, req: 'chef' }
  },
  ife: {
    none: { n: 'Ninguno', s: 0, y: 1950, seat: 0, run: 0 },
    audio: { n: 'Audio y revistas', s: 0.25, y: 1960, seat: 150, run: 0.05 },
    overhead: { n: 'Pantallas comunes', s: 0.45, y: 1980, seat: 600, run: 0.12, req: 'ife' },
    seatback: { n: 'Pantalla individual', s: 0.75, y: 1996, seat: 3500, run: 0.3, req: 'ife' },
    stream: { n: 'Streaming a dispositivos', s: 0.62, y: 2012, seat: 400, run: 0.15, req: 'ife' },
    premium: { n: 'Pantalla 4K + streaming', s: 0.95, y: 2016, seat: 5500, run: 0.4, req: 'ife' }
  },
  wifi: {
    none: { n: 'Sin Wi-Fi', s: 0, y: 1950, ac: 0, run: 0 },
    paid: { n: 'Wi-Fi pago', s: 0.4, y: 2008, ac: 400000, run: 0.4, rev: 1.2, req: 'wifi' },
    msg: { n: 'Mensajería gratis', s: 0.6, y: 2014, ac: 450000, run: 0.7, req: 'wifi' },
    free: { n: 'Wi-Fi gratis total', s: 0.9, y: 2018, ac: 600000, run: 1.6, req: 'wifi' }
  },
  amenity: {
    basic: { n: 'Básico', s: 0.3, c: 4 },
    premium: { n: 'Premium', s: 0.65, c: 16 },
    designer: { n: 'De diseñador', s: 0.95, c: 45 }
  },
  comp: {
    strict: { n: 'Mínimo legal', k: 0.6, rep: -1 },
    standard: { n: 'Estándar', k: 1.0, rep: 0 },
    generous: { n: 'Generosa', k: 1.6, rep: 1 }
  }
};
// modelos de negocio predefinidos
E.MODELS = {
  legacy: { n: 'Tradicional', d: 'Servicio completo: equipaje y comidas incluidas, foco en ejecutivos y conexiones.', fees: { bag: 0, carry: 0, seat: 0, prio: 0 }, svc: { cateringY: 'hot', cateringJ: 'gourmet' } },
  hybrid: { n: 'Híbrida', d: 'Tarifas por familias: lo básico incluido, extras opcionales.', fees: { bag: 25, carry: 0, seat: 8, prio: 6 }, svc: { cateringY: 'snack', cateringJ: 'std' } },
  lcc: { n: 'Low-cost', d: 'Tarifa base mínima y cobro de extras. Altísima densidad y rotaciones rápidas.', fees: { bag: 35, carry: 0, seat: 12, prio: 8 }, svc: { cateringY: 'bob', cateringJ: 'std' } },
  ulcc: { n: 'Ultra low-cost', d: 'Todo se paga aparte, incluso el equipaje de mano grande.', fees: { bag: 45, carry: 35, seat: 15, prio: 10 }, svc: { cateringY: 'bob', cateringJ: 'std' } }
};
