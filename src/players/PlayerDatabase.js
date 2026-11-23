// src/players/PlayerDatabase.js
// Cơ sở dữ liệu 200 cầu thủ bóng đá có thật (5 phân khúc: 20 Siêu sao, 40 Đẳng cấp cao, 50 Triển vọng, 50 Chất lượng tốt, 40 Ít tên tuổi hơn)
// và 100 cầu thủ trẻ hư cấu Học viện bóng đá PSG (U15, U17, U19, Đội dự bị)
export function generateRealPlayers200() {
  // Danh sách 200 cầu thủ thật chuẩn xác theo vị trí, CLB, quốc tịch và phân khúc
  const seed = [
    // --- 20 SIÊU SAO (OVR 88-92) ---
    ['Kylian Mbappé','Real Madrid','Pháp','ST',27,'Phải',178,75,92,94,180,550,'Siêu sao'],
    ['Erling Haaland','Manchester City','Na Uy','ST',25,'Trái',195,88,92,94,185,520,'Siêu sao'],
    ['Jude Bellingham','Real Madrid','Anh','AM',22,'Phải',186,75,91,95,175,420,'Siêu sao'],
    ['Vinícius Júnior','Real Madrid','Brazil','LW',25,'Phải',176,73,91,93,170,440,'Siêu sao'],
    ['Rodri','Manchester City','Tây Ban Nha','DM',29,'Phải',191,82,91,91,130,380,'Siêu sao'],
    ['Lamine Yamal','FC Barcelona','Tây Ban Nha','RW',18,'Trái',180,72,89,96,180,260,'Siêu sao'],
    ['Bukayo Saka','Arsenal','Anh','RW',24,'Trái',178,72,89,92,140,340,'Siêu sao'],
    ['Florian Wirtz','Bayer 04 Leverkusen','Đức','AM',22,'Phải',177,71,89,94,140,280,'Siêu sao'],
    ['Jamal Musiala','Bayern Munich','Đức','AM',23,'Phải',184,72,89,94,140,300,'Siêu sao'],
    ['Harry Kane','Bayern Munich','Anh','ST',32,'Phải',188,86,90,90,95,460,'Siêu sao'],
    ['Mohamed Salah','Liverpool','Ai Cập','RW',33,'Trái',175,71,90,90,70,420,'Siêu sao'],
    ['Virgil van Dijk','Liverpool','Hà Lan','CB',34,'Phải',195,92,89,89,45,340,'Siêu sao'],
    ['Martin Ødegaard','Arsenal','Na Uy','AM',27,'Trái',178,68,89,91,115,310,'Siêu sao'],
    ['Cole Palmer','Chelsea','Anh','AM',23,'Trái',185,76,88,93,130,260,'Siêu sao'],
    ['Pedri','FC Barcelona','Tây Ban Nha','CM',23,'Phải',174,60,89,93,125,270,'Siêu sao'],
    ['Federico Valverde','Real Madrid','Uruguay','CM',27,'Phải',182,78,89,91,125,310,'Siêu sao'],
    ['Lautaro Martínez','Inter Milan','Argentina','ST',28,'Phải',174,72,89,90,110,300,'Siêu sao'],
    ['Ousmane Dembélé','Paris Saint-Germain','Pháp','RW',28,'Trái',178,67,89,90,95,330,'Siêu sao'],
    ['Gianluigi Donnarumma','Paris Saint-Germain','Ý','GK',27,'Phải',196,90,89,92,75,290,'Siêu sao'],
    ['Achraf Hakimi','Paris Saint-Germain','Ma-rốc','RB',27,'Phải',181,73,88,90,85,280,'Siêu sao'],

    // --- 40 CẦU THỦ ĐẲNG CẤP CAO (OVR 84-88) ---
    ['Marquinhos','Paris Saint-Germain','Brazil','CB',31,'Phải',183,75,88,88,58,280,'Đẳng cấp cao'],
    ['Vitinha','Paris Saint-Germain','Bồ Đào Nha','CM',26,'Phải',172,64,87,90,82,220,'Đẳng cấp cao'],
    ['Khvicha Kvaratskhelia','Paris Saint-Germain','Georgia','LW',25,'Phải',183,76,87,91,92,240,'Đẳng cấp cao'],
    ['Nuno Mendes','Paris Saint-Germain','Bồ Đào Nha','LB',23,'Trái',180,70,86,91,78,190,'Đẳng cấp cao'],
    ['João Neves','Paris Saint-Germain','Bồ Đào Nha','DM',21,'Phải',174,66,85,92,85,165,'Đẳng cấp cao'],
    ['Bradley Barcola','Paris Saint-Germain','Pháp','LW',23,'Phải',186,73,85,91,78,175,'Đẳng cấp cao'],
    ['William Saliba','Arsenal','Pháp','CB',24,'Phải',192,92,88,92,105,270,'Đẳng cấp cao'],
    ['Declan Rice','Arsenal','Anh','DM',27,'Phải',188,80,88,90,115,290,'Đẳng cấp cao'],
    ['Phil Foden','Manchester City','Anh','AM',25,'Trái',171,69,88,91,120,300,'Đẳng cấp cao'],
    ['Josko Gvardiol','Manchester City','Croatia','LB',24,'Trái',185,80,86,91,88,230,'Đẳng cấp cao'],
    ['Alexis Mac Allister','Liverpool','Argentina','CM',27,'Phải',176,72,87,89,85,230,'Đẳng cấp cao'],
    ['Alisson Becker','Liverpool','Brazil','GK',33,'Phải',193,91,88,88,38,260,'Đẳng cấp cao'],
    ['Bruno Fernandes','Manchester United','Bồ Đào Nha','AM',31,'Phải',179,69,87,87,68,310,'Đẳng cấp cao'],
    ['Alexander Isak','Newcastle United','Thụy Điển','ST',26,'Phải',192,77,87,90,105,240,'Đẳng cấp cao'],
    ['Bruno Guimarães','Newcastle United','Brazil','CM',28,'Phải',182,74,86,88,85,220,'Đẳng cấp cao'],
    ['Son Heung-min','Tottenham Hotspur','Hàn Quốc','LW',33,'Phải',183,78,87,87,45,270,'Đẳng cấp cao'],
    ['Ollie Watkins','Aston Villa','Anh','ST',30,'Phải',180,70,85,85,65,200,'Đẳng cấp cao'],
    ['Emiliano Martínez','Aston Villa','Argentina','GK',33,'Phải',195,88,87,87,36,210,'Đẳng cấp cao'],
    ['Thibaut Courtois','Real Madrid','Bỉ','GK',33,'Trái',200,96,89,89,42,320,'Đẳng cấp cao'],
    ['Aurélien Tchouaméni','Real Madrid','Pháp','DM',26,'Phải',188,81,86,89,85,240,'Đẳng cấp cao'],
    ['Eduardo Camavinga','Real Madrid','Pháp','CM',23,'Trái',182,68,86,91,92,220,'Đẳng cấp cao'],
    ['Raphinha','FC Barcelona','Brazil','RW',29,'Trái',176,68,87,88,82,250,'Đẳng cấp cao'],
    ['Robert Lewandowski','FC Barcelona','Ba Lan','ST',37,'Phải',185,81,87,87,22,310,'Đẳng cấp cao'],
    ['Julián Álvarez','Atlético de Madrid','Argentina','ST',26,'Phải',170,71,87,90,95,240,'Đẳng cấp cao'],
    ['Antoine Griezmann','Atlético de Madrid','Pháp','AM',34,'Trái',176,73,86,86,28,250,'Đẳng cấp cao'],
    ['Jan Oblak','Atlético de Madrid','Slovenia','GK',33,'Phải',188,87,87,87,32,260,'Đẳng cấp cao'],
    ['Nico Williams','Athletic Club','Tây Ban Nha','LW',23,'Phải',181,67,85,91,80,180,'Đẳng cấp cao'],
    ['Joshua Kimmich','Bayern Munich','Đức','DM',31,'Phải',177,75,87,87,62,290,'Đẳng cấp cao'],
    ['Alphonso Davies','Bayern Munich','Canada','LB',25,'Trái',185,77,86,90,78,240,'Đẳng cấp cao'],
    ['Michael Olise','Bayern Munich','Pháp','RW',24,'Trái',184,73,86,91,82,210,'Đẳng cấp cao'],
    ['Gregor Kobel','Borussia Dortmund','Thụy Sĩ','GK',28,'Phải',195,88,86,88,52,180,'Đẳng cấp cao'],
    ['Serhou Guirassy','Borussia Dortmund','Guinea','ST',29,'Phải',187,82,85,86,55,175,'Đẳng cấp cao'],
    ['Jeremie Frimpong','Bayer 04 Leverkusen','Hà Lan','RB',25,'Phải',171,63,85,89,62,165,'Đẳng cấp cao'],
    ['Alessandro Bastoni','Inter Milan','Ý','CB',26,'Trái',190,75,87,90,82,210,'Đẳng cấp cao'],
    ['Nicolò Barella','Inter Milan','Ý','CM',29,'Phải',175,68,87,88,80,220,'Đẳng cấp cao'],
    ['Rafael Leão','AC Milan','Bồ Đào Nha','LW',26,'Phải',188,81,86,90,85,220,'Đẳng cấp cao'],
    ['Theo Hernández','AC Milan','Pháp','LB',28,'Trái',184,81,86,88,68,200,'Đẳng cấp cao'],
    ['Viktor Gyökeres','Sporting CP','Thụy Điển','ST',27,'Phải',189,90,86,89,85,170,'Đẳng cấp cao'],
    ['Victor Osimhen','Galatasaray','Nigeria','ST',27,'Phải',185,78,87,89,82,240,'Đẳng cấp cao'],
    ['Willian Pacho','Paris Saint-Germain','Ecuador','CB',24,'Trái',188,81,84,89,55,145,'Đẳng cấp cao'],

    // --- 50 CẦU THỦ TRIỂN VỌNG (OVR 78-84, POT 86-93) ---
    ['Warren Zaïre-Emery','Paris Saint-Germain','Pháp','CM',20,'Phải',178,68,83,92,72,140,'Triển vọng'],
    ['Désiré Doué','Paris Saint-Germain','Pháp','AM',20,'Phải',181,79,82,91,62,120,'Triển vọng'],
    ['Senny Mayulu','Paris Saint-Germain','Pháp','CM',19,'Phải',183,74,77,88,24,55,'Triển vọng'],
    ['Lucas Beraldo','Paris Saint-Germain','Brazil','CB',22,'Trái',186,80,80,88,36,95,'Triển vọng'],
    ['Pau Cubarsí','FC Barcelona','Tây Ban Nha','CB',19,'Phải',184,75,82,92,68,110,'Triển vọng'],
    ['Gavi','FC Barcelona','Tây Ban Nha','CM',21,'Phải',173,70,84,91,78,160,'Triển vọng'],
    ['Endrick','Real Madrid','Brazil','ST',19,'Trái',173,66,80,92,62,120,'Triển vọng'],
    ['Arda Güler','Real Madrid','Thổ Nhĩ Kỳ','AM',21,'Trái',175,70,81,91,58,115,'Triển vọng'],
    ['Kobbie Mainoo','Manchester United','Anh','CM',20,'Phải',180,72,81,90,56,110,'Triển vọng'],
    ['Leny Yoro','Manchester United','Pháp','CB',20,'Phải',190,75,81,91,60,120,'Triển vọng'],
    ['Alejandro Garnacho','Manchester United','Argentina','LW',21,'Phải',180,73,82,89,58,125,'Triển vọng'],
    ['Ethan Nwaneri','Arsenal','Anh','AM',19,'Trái',176,70,79,90,45,85,'Triển vọng'],
    ['Savinho','Manchester City','Brazil','RW',21,'Trái',176,71,82,89,58,135,'Triển vọng'],
    ['Rico Lewis','Manchester City','Anh','RB',21,'Phải',169,65,80,88,42,105,'Triển vọng'],
    ['Estêvão Willian','Chelsea','Brazil','RW',18,'Trái',176,68,79,92,55,90,'Triển vọng'],
    ['Romeo Lavia','Chelsea','Bỉ','DM',22,'Phải',181,75,80,88,45,120,'Triển vọng'],
    ['Lucas Bergvall','Tottenham Hotspur','Thụy Điển','CM',20,'Phải',187,74,78,88,32,75,'Triển vọng'],
    ['Archie Gray','Tottenham Hotspur','Anh','RB',20,'Phải',187,76,78,88,34,75,'Triển vọng'],
    ['Xavi Simons','RB Leipzig','Hà Lan','AM',22,'Phải',179,65,84,91,80,175,'Triển vọng'],
    ['Benjamin Šeško','RB Leipzig','Slovenia','ST',22,'Phải',195,86,83,90,70,150,'Triển vọng'],
    ['Aleksandar Pavlović','Bayern Munich','Đức','DM',21,'Phải',188,78,82,90,55,125,'Triển vọng'],
    ['Jamie Gittens','Borussia Dortmund','Anh','LW',21,'Phải',177,70,81,89,52,110,'Triển vọng'],
    ['Kenan Yıldız','Juventus','Thổ Nhĩ Kỳ','LW',20,'Phải',185,77,81,90,54,110,'Triển vọng'],
    ['Nico Paz','Como','Argentina','AM',21,'Trái',186,74,80,89,38,75,'Triển vọng'],
    ['Rayan Cherki','Olympique Lyonnais','Pháp','AM',22,'Trái',177,71,82,89,45,105,'Triển vọng'],
    ['Malick Fofana','Olympique Lyonnais','Bỉ','LW',21,'Phải',169,63,79,88,32,70,'Triển vọng'],
    ['Maghnes Akliouche','AS Monaco','Pháp','RW',24,'Trái',183,70,82,88,45,95,'Triển vọng'],
    ['Eliesse Ben Seghir','AS Monaco','Ma-rốc','AM',21,'Phải',178,66,80,89,38,80,'Triển vọng'],
    ['Ayyoub Bouaddi','LOSC Lille','Pháp','CM',18,'Phải',186,75,77,89,30,50,'Triển vọng'],
    ['Lucas Chevalier','LOSC Lille','Pháp','GK',24,'Phải',189,78,83,89,42,100,'Triển vọng'],
    ['Andrey Santos','RC Strasbourg Alsace','Brazil','CM',21,'Phải',180,75,80,88,35,85,'Triển vọng'],
    ['Geovany Quenda','Sporting CP','Bồ Đào Nha','RW',18,'Trái',172,66,78,90,40,65,'Triển vọng'],
    ['Rodrigo Mora','FC Porto','Bồ Đào Nha','AM',18,'Phải',168,62,77,90,34,55,'Triển vọng'],
    ['António Silva','Benfica','Bồ Đào Nha','CB',22,'Phải',187,79,81,89,46,95,'Triển vọng'],
    ['Jorrel Hato','Ajax','Hà Lan','LB',20,'Trái',182,76,80,89,40,80,'Triển vọng'],
    ['Johan Bakayoko','PSV Eindhoven','Bỉ','RW',22,'Trái',179,70,81,88,42,95,'Triển vọng'],
    ['Antoni Milambo','Feyenoord','Hà Lan','CM',20,'Phải',179,71,78,87,24,55,'Triển vọng'],
    ['Samu Aghehowa','FC Porto','Tây Ban Nha','ST',21,'Phải',193,90,82,89,52,100,'Triển vọng'],
    ['Milos Kerkez','Liverpool','Hungary','LB',22,'Trái',180,71,81,88,42,105,'Triển vọng'],
    ['Dean Huijsen','Real Madrid','Tây Ban Nha','CB',20,'Phải',195,87,81,90,52,110,'Triển vọng'],
    ['Hugo Ekitiké','Eintracht Frankfurt','Pháp','ST',23,'Phải',189,76,82,88,48,110,'Triển vọng'],
    ['Can Uzun','Eintracht Frankfurt','Thổ Nhĩ Kỳ','AM',20,'Phải',186,78,78,88,28,65,'Triển vọng'],
    ['Angelo Stiller','VfB Stuttgart','Đức','DM',24,'Trái',183,76,82,87,42,95,'Triển vọng'],
    ['Giorgio Scalvini','Atalanta','Ý','CB',22,'Phải',194,76,81,89,46,95,'Triển vọng'],
    ['Francesco Camarda','AC Milan','Ý','ST',18,'Phải',184,74,75,90,22,40,'Triển vọng'],
    ['Pietro Comuzzo','Napoli','Ý','CB',21,'Phải',185,78,78,87,26,65,'Triển vọng'],
    ['Pablo Barrios','Atlético de Madrid','Tây Ban Nha','CM',22,'Phải',181,73,81,88,44,105,'Triển vọng'],
    ['Fermín López','FC Barcelona','Tây Ban Nha','AM',22,'Phải',174,64,82,88,48,110,'Triển vọng'],
    ['Lewis Hall','Newcastle United','Anh','LB',21,'Trái',179,74,80,87,36,85,'Triển vọng'],
    ['Guillaume Restes','Toulouse FC','Pháp','GK',21,'Trái',186,82,79,88,26,60,'Triển vọng'],

    // --- 50 CẦU THỦ CHẤT LƯỢNG TỐT (OVR 80-84) ---
    ['Fabián Ruiz','Paris Saint-Germain','Tây Ban Nha','CM',29,'Trái',189,70,84,84,42,185,'Chất lượng tốt'],
    ['Lee Kang-in','Paris Saint-Germain','Hàn Quốc','AM',25,'Trái',174,72,82,86,38,145,'Chất lượng tốt'],
    ['Gonçalo Ramos','Paris Saint-Germain','Bồ Đào Nha','ST',24,'Phải',185,79,82,86,50,165,'Chất lượng tốt'],
    ['Lucas Hernández','Paris Saint-Germain','Pháp','CB',30,'Trái',184,79,83,83,32,210,'Chất lượng tốt'],
    ['Matvey Safonov','Paris Saint-Germain','Nga','GK',27,'Phải',192,85,80,83,22,110,'Chất lượng tốt'],
    ['Mason Greenwood','Olympique de Marseille','Anh','RW',24,'Trái',181,75,83,87,48,145,'Chất lượng tốt'],
    ['Adrien Rabiot','Olympique de Marseille','Pháp','CM',30,'Trái',188,71,83,83,32,165,'Chất lượng tốt'],
    ['Pierre-Emile Højbjerg','Olympique de Marseille','Đan Mạch','DM',30,'Phải',185,84,82,82,25,130,'Chất lượng tốt'],
    ['Gerónimo Rulli','Olympique de Marseille','Argentina','GK',33,'Phải',189,84,81,81,14,95,'Chất lượng tốt'],
    ['Alexandre Lacazette','Olympique Lyonnais','Pháp','ST',34,'Phải',175,73,82,82,12,140,'Chất lượng tốt'],
    ['Corentin Tolisso','Olympique Lyonnais','Pháp','CM',31,'Phải',181,81,81,81,16,120,'Chất lượng tốt'],
    ['Denis Zakaria','AS Monaco','Thụy Sĩ','DM',29,'Phải',191,81,82,83,30,130,'Chất lượng tốt'],
    ['Aleksandr Golovin','AS Monaco','Nga','AM',29,'Phải',180,69,82,82,28,125,'Chất lượng tốt'],
    ['Jonathan David','LOSC Lille','Canada','ST',26,'Phải',178,77,83,85,48,145,'Chất lượng tốt'],
    ['Edon Zhegrova','LOSC Lille','Kosovo','RW',26,'Trái',181,75,82,85,32,110,'Chất lượng tốt'],
    ['Marcin Bułka','OGC Nice','Ba Lan','GK',26,'Phải',199,90,82,85,26,95,'Chất lượng tốt'],
    ['Evann Guessand','OGC Nice','Bờ Biển Ngà','ST',24,'Phải',185,78,80,85,26,85,'Chất lượng tốt'],
    ['Brice Samba','Stade Rennais','Pháp','GK',31,'Trái',187,84,82,82,18,110,'Chất lượng tốt'],
    ['Facundo Medina','RC Lens','Argentina','CB',26,'Trái',184,78,81,84,26,95,'Chất lượng tốt'],
    ['Pierre Lees-Melou','Stade Brestois','Pháp','DM',32,'Phải',185,73,80,80,14,85,'Chất lượng tốt'],
    ['Jarrod Bowen','West Ham United','Anh','RW',29,'Trái',175,70,83,83,46,165,'Chất lượng tốt'],
    ['Mohammed Kudus','West Ham United','Ghana','AM',25,'Trái',177,70,83,87,54,155,'Chất lượng tốt'],
    ['Jordan Pickford','Everton','Anh','GK',32,'Trái',185,77,83,83,24,145,'Chất lượng tốt'],
    ['Jarrad Branthwaite','Everton','Anh','CB',23,'Trái',195,86,81,87,48,120,'Chất lượng tốt'],
    ['Moisés Caicedo','Chelsea','Ecuador','DM',24,'Phải',178,73,84,88,78,195,'Chất lượng tốt'],
    ['Enzo Fernández','Chelsea','Argentina','CM',25,'Phải',178,76,83,87,72,200,'Chất lượng tốt'],
    ['Cristian Romero','Tottenham Hotspur','Argentina','CB',27,'Phải',185,79,84,86,62,185,'Chất lượng tốt'],
    ['James Maddison','Tottenham Hotspur','Anh','AM',29,'Phải',175,73,83,83,48,180,'Chất lượng tốt'],
    ['Mikel Oyarzabal','Real Sociedad','Tây Ban Nha','LW',28,'Trái',181,79,83,84,42,145,'Chất lượng tốt'],
    ['Takefusa Kubo','Real Sociedad','Nhật Bản','RW',24,'Trái',173,67,83,87,52,135,'Chất lượng tốt'],
    ['Martín Zubimendi','Real Sociedad','Tây Ban Nha','DM',27,'Phải',181,74,84,86,60,150,'Chất lượng tốt'],
    ['Álex Baena','Villarreal CF','Tây Ban Nha','AM',24,'Phải',174,69,83,87,50,125,'Chất lượng tốt'],
    ['Isco','Real Betis','Tây Ban Nha','AM',33,'Phải',176,79,82,82,12,115,'Chất lượng tốt'],
    ['Loïc Badé','Sevilla FC','Pháp','CB',25,'Phải',191,89,81,85,30,100,'Chất lượng tốt'],
    ['Oihan Sancet','Athletic Club','Tây Ban Nha','AM',25,'Phải',188,73,83,87,52,130,'Chất lượng tốt'],
    ['Jonathan Tah','Bayer 04 Leverkusen','Đức','CB',30,'Phải',195,94,84,84,35,165,'Chất lượng tốt'],
    ['Granit Xhaka','Bayer 04 Leverkusen','Thụy Sĩ','DM',33,'Trái',185,82,84,84,22,165,'Chất lượng tốt'],
    ['Deniz Undav','VfB Stuttgart','Đức','ST',29,'Phải',179,80,82,83,32,120,'Chất lượng tốt'],
    ['Omar Marmoush','Manchester City','Ai Cập','ST',27,'Phải',183,81,84,87,68,185,'Chất lượng tốt'],
    ['Scott McTominay','Napoli','Scotland','CM',29,'Phải',193,88,83,84,40,140,'Chất lượng tốt'],
    ['Romelu Lukaku','Napoli','Bỉ','ST',32,'Trái',191,94,83,83,28,175,'Chất lượng tốt'],
    ['Paulo Dybala','AS Roma','Argentina','AM',32,'Trái',177,75,84,84,22,175,'Chất lượng tốt'],
    ['Mattia Zaccagni','Lazio','Ý','LW',30,'Phải',177,63,82,82,24,115,'Chất lượng tốt'],
    ['Ademola Lookman','Atalanta','Nigeria','LW',28,'Phải',174,71,84,86,55,145,'Chất lượng tốt'],
    ['Éderson','Atalanta','Brazil','CM',26,'Phải',183,80,83,86,52,135,'Chất lượng tốt'],
    ['Dušan Vlahović','Juventus','Serbia','ST',26,'Trái',190,88,83,86,58,210,'Chất lượng tốt'],
    ['Gleison Bremer','Juventus','Brazil','CB',29,'Phải',188,80,84,85,54,165,'Chất lượng tốt'],
    ['Diogo Costa','FC Porto','Bồ Đào Nha','GK',26,'Phải',186,82,84,88,48,135,'Chất lượng tốt'],
    ['Ángel Di María','Benfica','Argentina','RW',38,'Trái',180,75,82,82,6,110,'Chất lượng tốt'],
    ['Morten Hjulmand','Sporting CP','Đan Mạch','DM',26,'Phải',185,78,82,86,44,110,'Chất lượng tốt'],

    // --- 40 CẦU THỦ ÍT TÊN TUỔI HƠN (OVR 73-79) ---
    ['Zakaria Aboukhlal','Toulouse FC','Ma-rốc','RW',26,'Trái',179,72,77,80,14,55,'Ít tên tuổi hơn'],
    ['Charlie Cresswell','Toulouse FC','Anh','CB',23,'Phải',190,82,76,82,12,48,'Ít tên tuổi hơn'],
    ['Eli Junior Kroupi','FC Lorient','Pháp','ST',19,'Phải',179,70,76,85,15,42,'Ít tên tuổi hơn'],
    ['Montassar Talbi','FC Lorient','Tunisia','CB',27,'Phải',190,80,76,78,9,45,'Ít tên tuổi hơn'],
    ['Gaëtan Perrin','AJ Auxerre','Pháp','RW',29,'Phải',170,64,76,76,8,44,'Ít tên tuổi hơn'],
    ['Donovan Léon','AJ Auxerre','Guyana','GK',33,'Phải',187,82,75,75,4,38,'Ít tên tuổi hơn'],
    ['Himad Abdelli','Angers SCO','Algeria','AM',26,'Phải',185,76,77,80,10,45,'Ít tên tuổi hơn'],
    ['Yahia Fofana','Angers SCO','Bờ Biển Ngà','GK',25,'Phải',194,89,77,82,11,46,'Ít tên tuổi hơn'],
    ['Arouna Sangante','Le Havre AC','Senegal','CB',23,'Phải',189,78,76,82,12,45,'Ít tên tuổi hơn'],
    ['Yassine Kechta','Le Havre AC','Ma-rốc','CM',24,'Phải',176,68,75,80,8,40,'Ít tên tuổi hơn'],
    ['Maxime Lopez','Paris FC','Pháp','CM',28,'Phải',167,62,77,78,10,55,'Ít tên tuổi hơn'],
    ['Jean-Philippe Krasso','Paris FC','Bờ Biển Ngà','ST',28,'Trái',187,82,76,77,9,50,'Ít tên tuổi hơn'],
    ['Ilan Kebbal','Paris FC','Algeria','RW',27,'Trái',169,62,76,78,9,48,'Ít tên tuổi hơn'],
    ['Dilane Bakwa','RC Strasbourg Alsace','Pháp','RW',23,'Trái',179,72,78,84,18,62,'Ít tên tuổi hơn'],
    ['Emanuel Emegha','RC Strasbourg Alsace','Hà Lan','ST',23,'Phải',195,84,78,84,18,60,'Ít tên tuổi hơn'],
    ['Mahdi Camara','Stade Brestois','Pháp','CM',27,'Phải',178,70,78,80,14,58,'Ít tên tuổi hơn'],
    ['Ludovic Ajorque','Stade Brestois','Pháp','ST',32,'Trái',196,92,77,77,9,62,'Ít tên tuổi hơn'],
    ['Arnaud Kalimuendo','Stade Rennais','Pháp','ST',24,'Phải',175,73,79,84,22,78,'Ít tên tuổi hơn'],
    ['Adrien Truffert','Stade Rennais','Pháp','LB',24,'Trái',176,70,79,83,20,74,'Ít tên tuổi hơn'],
    ['Florian Sotoca','RC Lens','Pháp','RW',35,'Phải',187,80,76,76,4,52,'Ít tên tuổi hơn'],
    ['Ricardo Horta','SC Braga','Bồ Đào Nha','LW',31,'Phải',173,65,79,79,16,75,'Ít tên tuổi hơn'],
    ['Roger Fernandes','SC Braga','Bồ Đào Nha','RW',20,'Trái',170,64,76,85,18,45,'Ít tên tuổi hơn'],
    ['Troy Parrott','AZ Alkmaar','Ireland','ST',24,'Phải',185,76,77,82,14,52,'Ít tên tuổi hơn'],
    ['Sven Mijnans','AZ Alkmaar','Hà Lan','AM',26,'Trái',182,74,77,80,12,50,'Ít tên tuổi hơn'],
    ['Kenneth Taylor','Ajax','Hà Lan','CM',23,'Trái',182,73,79,84,24,78,'Ít tên tuổi hơn'],
    ['Joey Veerman','PSV Eindhoven','Hà Lan','CM',27,'Phải',185,76,80,82,26,88,'Ít tên tuổi hơn'],
    ['Quinten Timber','Feyenoord','Hà Lan','CM',24,'Phải',179,75,80,85,30,90,'Ít tên tuổi hơn'],
    ['Barış Alper Yılmaz','Galatasaray','Thổ Nhĩ Kỳ','RW',25,'Phải',186,78,79,84,22,78,'Ít tên tuổi hơn'],
    ['Sebastian Szymański','Fenerbahçe','Ba Lan','AM',26,'Trái',174,60,79,82,20,85,'Ít tên tuổi hơn'],
    ['Christos Tzolis','Club Brugge','Hy Lạp','LW',24,'Phải',179,74,78,84,18,65,'Ít tên tuổi hơn'],
    ['Hans Vanaken','Club Brugge','Bỉ','AM',33,'Phải',195,84,79,79,10,75,'Ít tên tuổi hơn'],
    ['Kyogo Furuhashi','Stade Rennais','Nhật Bản','ST',31,'Phải',170,63,78,78,12,68,'Ít tên tuổi hơn'],
    ['Callum McGregor','Celtic','Scotland','DM',32,'Trái',178,70,78,78,10,65,'Ít tên tuổi hơn'],
    ['James Tavernier','Rangers','Anh','RB',34,'Phải',182,75,77,77,6,65,'Ít tên tuổi hơn'],
    ['Georgiy Sudakov','Shakhtar Donetsk','Ukraine','AM',23,'Phải',177,68,79,85,28,72,'Ít tên tuổi hơn'],
    ['Oscar Gloukh','Red Bull Salzburg','Israel','AM',22,'Phải',170,65,78,86,24,62,'Ít tên tuổi hơn'],
    ['Lukáš Provod','Slavia Praha','CH Séc','CM',29,'Trái',189,78,77,78,10,50,'Ít tên tuổi hơn'],
    ['Ayoub El Kaabi','Olympiacos','Ma-rốc','ST',32,'Trái',182,74,78,78,9,62,'Ít tên tuổi hơn'],
    ['Martin Baturina','Dinamo Zagreb','Croatia','AM',23,'Phải',172,65,79,86,24,65,'Ít tên tuổi hơn'],
    ['Assane Diao','Como','Senegal','RW',20,'Phải',185,76,78,86,22,55,'Ít tên tuổi hơn']
  ];

  return seed.map((s, idx) => {
    const [name, club, nat, pos, age, foot, height, weight, ovr, pot, value, wage, tier] = s;
    const birthYear = 2026 - age;
    const birthMonth = String((idx % 12) + 1).padStart(2, '0');
    const birthDay = String(((idx * 7) % 27) + 1).padStart(2, '0');
    // Chỉ số chuyên môn khác biệt theo vị trí và từng cầu thủ
    const isGK = pos === 'GK';
    const isDef = ['CB', 'LB', 'RB', 'DM'].includes(pos);
    const isAtt = ['ST', 'LW', 'RW', 'AM'].includes(pos);
    const jitter = ((idx * 13) % 7) - 3;
    const tech = Math.max(55, Math.min(97, ovr + (isAtt ? 2 : isGK ? -8 : 0) + jitter));
    const phys = Math.max(58, Math.min(96, ovr + (isDef ? 2 : -1) - Math.floor(jitter / 2)));
    const tact = Math.max(60, Math.min(96, ovr + (pos === 'DM' || pos === 'CM' || pos === 'CB' ? 3 : 0) + (idx % 4) - 1));
    return {
      id: `pl_${idx + 1}`,
      name,
      club,
      nationality: nat,
      position: pos,
      age,
      dob: `${birthDay}/${birthMonth}/${birthYear}`,
      foot,
      height,
      weight,
      ovr,
      pot,
      tech,
      phys,
      tact,
      value, // triệu €
      wage,  // nghìn €/tuần
      contractYears: 1 + (idx % 5),
      injuryDays: 0,
      form: 72 + ((idx * 11) % 22),
      morale: 76 + ((idx * 7) % 18),
      satisfaction: 75 + ((idx * 5) % 20),
      loyalty: 68 + ((idx * 9) % 25),
      tier,
      goals: 0,
      assists: 0,
      apps: 0
    };
  });
}

export function generateAcademy100() {
  const firstNames = ['Théo','Lucas','Enzo','Hugo','Léo','Raphaël','Nathan','Noah','Gabriel','Mathis','Nolan','Kylian','Sacha','Yanis','Ibrahim','Mamadou','Sofiane','Maxime','Bastien','Romain','Clément','Julien','Antoine','Malo','Timéo'];
  const lastNames = ['Morel','Fournier','Girard','Bonnet','Dupont','Lambert','Fontaine','Rousseau','Vincent','Muller','Lefevre','Faure','Andre','Mercier','Blanc','Guerin','Boyer','Garnier','Chevalier','Francois','Legrand','Gauthier','Perrin','Robin','Diallo','Traoré','Ndiaye','Benali','Kone','Cissé'];
  const nats = ['Pháp','Pháp','Pháp','Pháp','Bờ Biển Ngà','Senegal','Ma-rốc','Algeria','Bồ Đào Nha','Brazil','Tây Ban Nha','Bỉ'];
  const positions = ['GK','CB','CB','LB','RB','DM','CM','CM','AM','LW','RW','ST'];
  const personalities = ['Tham vọng','Chăm chỉ','Điềm tĩnh','Nhiệt huyết','Kỹ thuật','Kỷ luật','Bùng nổ','Kiên nhẫn'];
  const squads = [
    { key: 'U15', count: 25, minAge: 14, maxAge: 15, ovrBase: 54 },
    { key: 'U17', count: 25, minAge: 16, maxAge: 17, ovrBase: 61 },
    { key: 'U19', count: 25, minAge: 18, maxAge: 19, ovrBase: 67 },
    { key: 'Đội dự bị', count: 25, minAge: 19, maxAge: 21, ovrBase: 72 }
  ];

  const list = [];
  let idNum = 1;
  squads.forEach((sq) => {
    for (let i = 0; i < sq.count; i++) {
      const fn = firstNames[(idNum * 7 + i) % firstNames.length];
      const ln = lastNames[(idNum * 11 + i * 3) % lastNames.length];
      const age = sq.minAge + (i % (sq.maxAge - sq.minAge + 1));
      const ovr = sq.ovrBase + (i % 7);
      // Không phải cầu thủ trẻ nào cũng thành ngôi sao (chỉ ~12% có tiềm năng 86+)
      const pot = i % 9 === 0 ? 87 + (i % 6) : i % 3 === 0 ? 79 + (i % 7) : 70 + (i % 9);
      list.push({
        id: `acad_${idNum}`,
        name: `${fn} ${ln}`,
        squad: sq.key,
        age,
        nationality: nats[(idNum * 5) % nats.length],
        position: positions[(idNum + i) % positions.length],
        personality: personalities[(idNum * 3) % personalities.length],
        ovr,
        pot: Math.max(ovr + 3, pot),
        growthRate: +(0.6 + ((idNum * 13) % 10) * 0.12).toFixed(2),
        phys: 60 + ((idNum * 7) % 28),
        mentality: 62 + ((idNum * 9) % 28),
        adaptability: 60 + ((idNum * 11) % 30),
        trainingWithFirstTeam: false,
        loanClub: null,
        proContract: sq.key === 'Đội dự bị' && i < 8,
        promoted: false
      });
      idNum++;
    }
  });
  return list;
}
