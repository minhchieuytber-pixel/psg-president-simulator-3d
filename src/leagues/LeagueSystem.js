// src/leagues/LeagueSystem.js
// Hệ thống các câu lạc bộ thật, Ligue 1, Ligue 2, Coupe de France, Trophée des Champions và 4 cúp Châu Âu (UCL, UEL, UECL, UEFA Super Cup)
export function createWorldClubs() {
  const raw = [
    // Pháp (Ligue 1 - 16 đội khởi tạo chuẩn danh sách yêu cầu + 2 đội Ligue 1 bổ sung cho đủ 18, kèm Ligue 2)
    ['Paris Saint-Germain','Pháp','Ligue 1',89,245,'Parc des Princes','Luis Enrique',0x00205b],
    ['Olympique de Marseille','Pháp','Ligue 1',82,88,'Stade Vélodrome','Roberto De Zerbi',0x2faee0],
    ['Olympique Lyonnais','Pháp','Ligue 1',80,68,'Groupama Stadium','Paulo Fonseca',0x1d4ed8],
    ['AS Monaco','Pháp','Ligue 1',82,95,'Stade Louis II','Adi Hütter',0xdc2626],
    ['LOSC Lille','Pháp','Ligue 1',81,74,'Stade Pierre-Mauroy','Bruno Génésio',0xb91c1c],
    ['OGC Nice','Pháp','Ligue 1',79,62,'Allianz Riviera','Franck Haise',0x991b1b],
    ['RC Lens','Pháp','Ligue 1',79,54,'Stade Bollaert-Delelis','Will Still',0xeab308],
    ['Stade Rennais','Pháp','Ligue 1',79,66,'Roazhon Park','Habib Beye',0xdc2626],
    ['RC Strasbourg Alsace','Pháp','Ligue 1',77,52,'Stade de la Meinau','Liam Rosenior',0x2563eb],
    ['Stade Brestois','Pháp','Ligue 1',77,42,'Stade Francis-Le Blé','Éric Roy',0xef4444],
    ['Toulouse FC','Pháp','Ligue 1',76,40,'Stadium de Toulouse','Carles Martínez',0x7c3aed],
    ['FC Lorient','Pháp','Ligue 1',74,30,'Stade du Moustoir','Olivier Pantaloni',0xf97316],
    ['AJ Auxerre','Pháp','Ligue 1',74,28,'Stade de l\'Abbé-Deschamps','Christophe Pélissier',0x3b82f6],
    ['Angers SCO','Pháp','Ligue 1',73,24,'Stade Raymond Kopa','Alexandre Dujeux',0x111827],
    ['Le Havre AC','Pháp','Ligue 1',73,25,'Stade Océane','Didier Digard',0x38bdf8],
    ['Paris FC','Pháp','Ligue 1',75,58,'Stade Charléty','Stéphane Gilli',0x1e3a8a],
    // Anh
    ['Arsenal','Anh','Premier League',88,210,'Emirates Stadium','Mikel Arteta',0xef4444],
    ['Liverpool','Anh','Premier League',88,200,'Anfield','Arne Slot',0xb91c1c],
    ['Manchester City','Anh','Premier League',89,260,'Etihad Stadium','Pep Guardiola',0x38bdf8],
    ['Manchester United','Anh','Premier League',83,175,'Old Trafford','Ruben Amorim',0xdc2626],
    ['Chelsea','Anh','Premier League',84,195,'Stamford Bridge','Enzo Maresca',0x1d4ed8],
    ['Tottenham Hotspur','Anh','Premier League',83,155,'Tottenham Stadium','Ange Postecoglou',0xf8fafc],
    ['Newcastle United','Anh','Premier League',83,170,'St James\' Park','Eddie Howe',0x111827],
    ['Aston Villa','Anh','Premier League',82,130,'Villa Park','Unai Emery',0x7f1d1d],
    ['Everton','Anh','Premier League',77,78,'Goodison Park','David Moyes',0x1e40af],
    ['West Ham United','Anh','Premier League',79,92,'London Stadium','Graham Potter',0x881337],
    // Tây Ban Nha
    ['Real Madrid','Tây Ban Nha','La Liga',91,290,'Santiago Bernabéu','Carlo Ancelotti',0xf8fafc],
    ['FC Barcelona','Tây Ban Nha','La Liga',89,180,'Spotify Camp Nou','Hansi Flick',0x1e3a8a],
    ['Atlético de Madrid','Tây Ban Nha','La Liga',86,145,'Metropolitano','Diego Simeone',0xdc2626],
    ['Sevilla FC','Tây Ban Nha','La Liga',79,72,'Ramón Sánchez-Pizjuán','García Pimienta',0xef4444],
    ['Athletic Club','Tây Ban Nha','La Liga',83,84,'San Mamés','Ernesto Valverde',0xb91c1c],
    ['Real Sociedad','Tây Ban Nha','La Liga',82,82,'Reale Arena','Imanol Alguacil',0x2563eb],
    ['Villarreal CF','Tây Ban Nha','La Liga',81,78,'Estadio de la Cerámica','Marcelino',0xfacc15],
    ['Real Betis','Tây Ban Nha','La Liga',80,74,'Benito Villamarín','Manuel Pellegrini',0x16a34a],
    // Đức
    ['Bayern Munich','Đức','Bundesliga',89,235,'Allianz Arena','Vincent Kompany',0xdc2626],
    ['Borussia Dortmund','Đức','Bundesliga',84,135,'Signal Iduna Park','Niko Kovač',0xfacc15],
    ['RB Leipzig','Đức','Bundesliga',83,125,'Red Bull Arena','Marco Rose',0xef4444],
    ['Bayer 04 Leverkusen','Đức','Bundesliga',86,145,'BayArena','Xabi Alonso',0x991b1b],
    ['VfB Stuttgart','Đức','Bundesliga',81,82,'MHPArena','Sebastian Hoeneß',0xef4444],
    ['Eintracht Frankfurt','Đức','Bundesliga',81,88,'Deutsche Bank Park','Dino Toppmöller',0x111827],
    // Ý
    ['Inter Milan','Ý','Serie A',88,155,'San Siro','Simone Inzaghi',0x1d4ed8],
    ['AC Milan','Ý','Serie A',84,130,'San Siro','Sérgio Conceição',0x991b1b],
    ['Juventus','Ý','Serie A',85,145,'Allianz Stadium','Thiago Motta',0x111827],
    ['Napoli','Ý','Serie A',85,135,'Diego Armando Maradona','Antonio Conte',0x38bdf8],
    ['AS Roma','Ý','Serie A',82,105,'Stadio Olimpico','Claudio Ranieri',0x7f1d1d],
    ['Lazio','Ý','Serie A',81,86,'Stadio Olimpico','Marco Baroni',0x60a5fa],
    ['Atalanta','Ý','Serie A',84,112,'Gewiss Stadium','Gian Piero Gasperini',0x1e3a8a],
    ['Como','Ý','Serie A',77,76,'Stadio Giuseppe Sinigaglia','Cesc Fàbregas',0x2563eb],
    // Bồ Đào Nha
    ['Benfica','Bồ Đào Nha','Primeira Liga',83,98,'Estádio da Luz','Bruno Lage',0xdc2626],
    ['FC Porto','Bồ Đào Nha','Primeira Liga',82,88,'Estádio do Dragão','Martín Anselmi',0x1d4ed8],
    ['Sporting CP','Bồ Đào Nha','Primeira Liga',84,96,'Estádio José Alvalade','Rui Borges',0x16a34a],
    ['SC Braga','Bồ Đào Nha','Primeira Liga',79,54,'Estádio Municipal','Carlos Carvalhal',0xef4444],
    // Hà Lan
    ['Ajax','Hà Lan','Eredivisie',81,86,'Johan Cruijff ArenA','Francesco Farioli',0xdc2626],
    ['PSV Eindhoven','Hà Lan','Eredivisie',82,88,'Philips Stadion','Peter Bosz',0xb91c1c],
    ['Feyenoord','Hà Lan','Eredivisie',80,74,'De Kuip','Robin van Persie',0xef4444],
    ['AZ Alkmaar','Hà Lan','Eredivisie',78,52,'AFAS Stadion','Maarten Martens',0xdc2626],
    // Các CLB khác
    ['Galatasaray','Thổ Nhĩ Kỳ','Süper Lig',81,78,'RAMS Park','Okan Buruk',0xd97706],
    ['Fenerbahçe','Thổ Nhĩ Kỳ','Süper Lig',80,74,'Şükrü Saracoğlu','José Mourinho',0xeab308],
    ['Club Brugge','Bỉ','Pro League',79,56,'Jan Breydel','Nicky Hayen',0x1d4ed8],
    ['Celtic','Scotland','Premiership',78,54,'Celtic Park','Brendan Rodgers',0x15803d],
    ['Rangers','Scotland','Premiership',77,48,'Ibrox Stadium','Barry Ferguson',0x1e40af],
    ['Shakhtar Donetsk','Ukraine','UPL',77,52,'Arena Lviv','Marino Pušić',0xf97316],
    ['Red Bull Salzburg','Áo','Austrian BL',77,60,'Red Bull Arena','Thomas Letsch',0xef4444],
    ['Slavia Praha','CH Séc','Czech First',76,42,'Fortuna Arena','Jindřich Trpišovský',0xdc2626],
    ['Olympiacos','Hy Lạp','Super League',78,48,'Karaiskakis','José Luis Mendilibar',0xb91c1c],
    ['Dinamo Zagreb','Croatia','HNL',76,40,'Maksimir','Fabio Cannavaro',0x2563eb]
  ];

  return raw.map((c, i) => ({
    id: `club_${i + 1}`,
    name: c[0],
    country: c[1],
    league: c[2],
    rating: c[3],
    budget: c[4],
    stadium: c[5],
    manager: c[6],
    color: c[7],
    played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0
  }));
}

export function generateSeasonFixtures(clubs, seasonYear = 2026) {
  const ligue1 = clubs.filter((c) => c.league === 'Ligue 1');
  const uclPool = clubs.filter((c) => c.rating >= 82 && c.name !== 'Paris Saint-Germain').slice(0, 12);
  const fixtures = [];
  let id = 1;

  // 30 vòng Ligue 1 (15 lượt đi + 15 lượt về) xen kẽ UEFA Champions League & Coupe de France
  const opponents = ligue1.filter((c) => c.name !== 'Paris Saint-Germain');
  for (let round = 1; round <= 30; round++) {
    const opp = opponents[(round - 1) % opponents.length];
    const isHome = round % 2 === 1;
    fixtures.push({
      id: `fx_${id++}`,
      comp: 'Ligue 1',
      round: `Vòng ${round}`,
      home: isHome ? 'Paris Saint-Germain' : opp.name,
      away: isHome ? opp.name : 'Paris Saint-Germain',
      played: false,
      homeGoals: null,
      awayGoals: null
    });
    if (round % 4 === 0 && uclPool.length > 0) {
      const uOpp = uclPool[(round / 4 - 1) % uclPool.length];
      fixtures.push({
        id: `fx_${id++}`,
        comp: 'UEFA Champions League',
        round: round <= 16 ? `Vòng bảng · Lượt ${round / 4}` : `Vòng Knock-out`,
        home: (round / 4) % 2 === 1 ? 'Paris Saint-Germain' : uOpp.name,
        away: (round / 4) % 2 === 1 ? uOpp.name : 'Paris Saint-Germain',
        played: false,
        homeGoals: null,
        awayGoals: null
      });
    }
    if (round % 7 === 0) {
      const cOpp = opponents[(round + 3) % opponents.length];
      fixtures.push({
        id: `fx_${id++}`,
        comp: 'Coupe de France',
        round: round === 7 ? 'Vòng 1/16' : round === 14 ? 'Tứ kết' : round === 21 ? 'Bán kết' : 'Chung kết',
        home: 'Paris Saint-Germain',
        away: cOpp.name,
        played: false,
        homeGoals: null,
        awayGoals: null
      });
    }
  }
  return fixtures;
}

export function simulateLigue1Round(clubs, psgFixture, psgHomeG, psgAwayG) {
  const ligue1 = clubs.filter((c) => c.league === 'Ligue 1');
  const applyMatch = (hClub, aClub, hg, ag) => {
    if (!hClub || !aClub) return;
    hClub.played++; aClub.played++;
    hClub.gf += hg; hClub.ga += ag;
    aClub.gf += ag; aClub.ga += hg;
    if (hg > ag) { hClub.won++; hClub.pts += 3; aClub.lost++; }
    else if (hg < ag) { aClub.won++; aClub.pts += 3; hClub.lost++; }
    else { hClub.drawn++; aClub.drawn++; hClub.pts += 1; aClub.pts += 1; }
  };

  if (psgFixture && psgFixture.comp === 'Ligue 1') {
    const h = clubs.find((c) => c.name === psgFixture.home);
    const a = clubs.find((c) => c.name === psgFixture.away);
    applyMatch(h, a, psgHomeG, psgAwayG);
  }

  // Mô phỏng các trận còn lại của vòng đấu Ligue 1
  const others = ligue1.filter((c) => c.name !== psgFixture?.home && c.name !== psgFixture?.away);
  for (let i = 0; i + 1 < others.length; i += 2) {
    const h = others[i], a = others[i + 1];
    const diff = (h.rating - a.rating + 3) / 14;
    const hg = Math.max(0, Math.round(1.2 + diff + (Math.random() - 0.45) * 2.2));
    const ag = Math.max(0, Math.round(1.0 - diff + (Math.random() - 0.45) * 2.0));
    applyMatch(h, a, hg, ag);
  }
}
