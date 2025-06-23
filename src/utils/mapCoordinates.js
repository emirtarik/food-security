export const countryNameToISO3 = {
  // French Names
  "Afrique du Sud": "ZAF",
  "Algérie": "DZA",
  "Angola": "AGO",
  "Bénin": "BEN",
  "Botswana": "BWA",
  "Burkina Faso": "BFA",
  "Burundi": "BDI",
  "Cabo Verde": "CPV",
  "Cameroun": "CMR",
  "Comores": "COM",
  "Côte d’Ivoire": "CIV",
  "Djibouti": "DJI",
  "Égypte": "EGY",
  "Érythrée": "ERI",
  "Éthiopie": "ETH",
  "Gabon": "GAB",
  "Gambie": "GMB",
  "Ghana": "GHA",
  "Guinée": "GIN",
  "Guinée équatoriale": "GNQ",
  "Guinée-Bissau": "GNB",
  "Kenya": "KEN",
  "Lesotho": "LSO",
  "Libéria": "LBR",
  "Libye": "LBY",
  "Madagascar": "MDG",
  "Malawi": "MWI",
  "Mali": "MLI",
  "Maroc": "MAR",
  "Maurice": "MUS",
  "Mauritanie": "MRT",
  "Mozambique": "MOZ",
  "Namibie": "NAM",
  "Niger": "NER",
  "Nigéria": "NGA",
  "Ouganda": "UGA",
  "République du Congo": "COG",
  "République centrafricaine": "CAF",
  "République démocratique du Congo": "COD",
  "Royaume d’Eswatini": "SWZ",
  "Rwanda": "RWA",
  "Sao Tomé-et-Principe": "STP",
  "Sénégal": "SEN",
  "Seychelles": "SYC",
  "Sierra Leone": "SLE",
  "Somalie": "SOM",
  "Soudan": "SDN",
  "Soudan du Sud": "SSD",
  "Tanzanie": "TZA",
  "Tchad": "TCD",
  "Togo": "TGO",
  "Tunisie": "TUN",
  "Zambie": "ZMB",
  "Zimbabwe": "ZWE",

  // English Names (ensure these are comprehensive or match GeoJSON names)
  "Angola": "AGO", // Duplicate, but fine
  "Burundi": "BDI", // Duplicate
  "Benin": "BEN", // Duplicate
  "Burkina Faso": "BFA", // Duplicate
  "Botswana": "BWA", // Duplicate
  "Central African Republic": "CAF",
  "Cote d'Ivoire": "CIV",
  "Cameroon": "CMR",
  "Democratic Republic of the Congo": "COD",
  "Republic of the Congo": "COG",
  "Comoros": "COM", // Duplicate
  // "Cabo Verde": "CPV", // Already present
  "Djibouti": "DJI", // Duplicate
  "Algeria": "DZA",
  "Egypt": "EGY",
  "Eritrea": "ERI",
  "Ethiopia": "ETH",
  "Gabon": "GAB", // Duplicate
  "Ghana": "GHA", // Duplicate
  "Guinea": "GIN",
  "Gambia": "GMB",
  "Guinea-Bissau": "GNB",
  "Equatorial Guinea": "GNQ",
  "Kenya": "KEN", // Duplicate
  "Liberia": "LBR",
  "Libya": "LBY",
  "Lesotho": "LSO", // Duplicate
  "Morocco": "MAR",
  "Madagascar": "MDG", // Duplicate
  "Mali": "MLI", // Duplicate
  "Mozambique": "MOZ", // Duplicate
  "Mauritania": "MRT", // Duplicate
  "Mauritius": "MUS",
  "Malawi": "MWI", // Duplicate
  "Namibia": "NAM",
  "Niger": "NER", // Duplicate
  "Nigeria": "NGA", // Duplicate
  "Rwanda": "RWA", // Duplicate
  "Sudan": "SDN",
  "Senegal": "SEN",
  "Sierra Leone": "SLE", // Duplicate
  "Somalia": "SOM",
  "South Sudan": "SSD",
  "Sao Tome and Principe": "STP",
  "Kingdom of Eswatini": "SWZ",
  "Seychelles": "SYC", // Duplicate
  "Chad": "TCD",
  "Togo": "TGO", // Duplicate
  "Tunisia": "TUN",
  "Tanzania": "TZA",
  "Uganda": "UGA", // Duplicate
  "South Africa": "ZAF",
  "Zambia": "ZMB", // Duplicate
  "Zimbabwe": "ZWE" // Duplicate
};

// This is the bBoxById as provided by the user.
const bBoxByIdRaw = {
  1: [[11.67880883351409, -18.0395441112506], [24.0827635146694, -4.377635366107427]], // Angola
  2: [[28.993800497072044, -4.46551358137126], [30.8450390589687, -2.312156363797868]], // Burundi
  3: [[0.774558544224476, 6.22447495853009], [3.85082880284835, 12.393508622871479]], // Benin
  4: [[-5.520794727315028, 9.39964017278909], [2.40608025898589, 15.085258417277188]], // Burkina Faso
  5: [[20.001242333380191, -26.8837918049531], [29.3618491231722, -17.781364563205884]], // Botswana
  6: [[14.419995451249584, 2.21983656110873], [27.4611737379457, 11.009192333734617]], // Central African Republic (République centrafricaine)
  7: [[-8.569597716425136, 4.35678586749077], [-2.49396129202089, 10.734519638596169]], // Cote d'Ivoire (Côte d’Ivoire)
  8: [[8.492690805810334, 1.65404064168932], [16.1943512292781, 13.080169051742061]], // Cameroon (Cameroun)
  9: [[12.206163360999454, -13.4581143630142], [31.3065062339817, 5.373053530527471]], // Democratic Republic of the Congo (République démocratique du Congo)
  10: [[11.206388845056409, -5.02585440304395], [18.6498697204794, 3.703069114856376]], // Republic of the Congo (République du Congo)
  11: [[43.2656, -11.363295], [44.629177, -12.407687]], // Comoros (Comores) - Note: Original had different coord order, adjusted to SW, NE
  12: [[-25.357213543522146, 14.8050880064408], [-22.6764804894878, 17.194676527218675]], // Cabo Verde
  13: [[41.771301520025517, 10.910318687075], [43.4137973572072, 12.706622709944]], // Djibouti
  14: [[-8.673969078782633, 18.9635345895493], [11.9809701071419, 37.09150628917579]], // Algeria (Algérie)
  15: [[24.697996257418708, 22.0013421472637], [35.7615737570691, 31.664110210683646]], // Egypt (Égypte)
  16: [[36.437281372495079, 12.3605223286841], [43.1336269463708, 18.002201465540395]], // Eritrea (Érythrée)
  17: [[32.998438894493276, 3.4009078412285], [47.9842742919989, 14.892966221704711]], // Ethiopia (Éthiopie)
  18: [[8.695935814827443, -3.97664306377109], [14.5024185687666, 2.324250541417371]], // Gabon
  19: [[-3.257547122710676, 4.73578730703557], [1.19206530262996, 11.173995950817698]], // Ghana
  20: [[-15.079191428377445, 7.20230122963262], [-7.64122957762785, 12.673679033707842]], // Guinea (Guinée)
  21: [[-16.826079936892199, 13.0527230912037], [-13.7937487859001, 13.827261735338197]], // Gambia (Gambie)
  22: [[-16.716210858836821, 10.9267692162175], [-13.6344428845149, 12.684674465103612]], // Guinea-Bissau (Guinée-Bissau)
  23: [[5.603193718085414, -1.46069231784424], [11.3327510702054, 3.785449614422333]], // Equatorial Guinea (Guinée équatoriale)
  24: [[33.910335195172479, -4.67975402178414], [41.8976211272234, 4.620420513282312]], // Kenya
  25: [[-11.492059789361775, 4.35124553384174], [-7.36655688248939, 8.553673842533343]], // Liberia (Libéria)
  26: [[9.388093959395881, 19.5073822641284], [25.148468001036, 33.169291009271674]], // Libya (Libye)
  27: [[27.027195141422098, -30.6577392328189], [29.4662204855297, -28.570269367717884]], // Lesotho
  28: [[-13.167520611755194, 27.6594718132624], [-0.994299518106317, 35.910435009056016]], // Morocco (Maroc)
  29: [[43.957916, -11.233853], [49.644682, -26.453862]], // Madagascar - Note: Original had different coord order, adjusted to SW, NE
  30: [[-12.233633448284422, 10.1632260034789], [4.24084698276459, 25.000708313044015]], // Mali
  31: [[30.218810884823739, -26.8673412758106], [40.8374143565547, -10.475241344327628]], // Mozambique
  32: [[-17.067787646818925, 14.7171671732258], [-4.82863658274659, 27.296920902860109]], // Mauritania (Mauritanie)
  33: [[57.310283, -19.802283], [57.962243, -20.549742]], // Mauritius (Maurice) - Note: Original had different coord order, adjusted to SW, NE
  34: [[32.679827091722899, -17.1221500948736], [35.9153819427564, -9.371052848075948]], // Malawi
  35: [[11.717292843399271, -28.9713042880053], [25.2583370790913, -16.957389095741675]], // Namibia
  36: [[0.164802208197493, 11.6958527626051], [15.9966039359589, 23.523016092945412]], // Niger
  37: [[2.669757522728581, 4.27986046567154], [14.6781749992943, 13.893191705761652]], // Nigeria (Nigéria)
  38: [[28.856485458478389, -2.83951089128324], [30.8944758822985, -1.054159681858877]], // Rwanda
  39: [[21.841485463881099, 8.68549116542911], [38.5796857766238, 22.226578019072377]], // Sudan (Soudan)
  40: [[-17.518238081460641, 12.3056304076076], [-11.3437280103967, 16.694767960271577]], // Senegal (Sénégal)
  41: [[-13.310333366046727, 6.92762853449416], [-10.2835212397281, 9.998422386395802]], // Sierra Leone
  42: [[40.991222542242099, -1.66389470891022], [51.4120787206538, 11.97602317344149]], // Somalia (Somalie)
  43: [[24.154191200790834, 3.48882867444349], [35.9483682369437, 12.199554327204311]], // South Sudan (Soudan du Sud)
  44: [[6.471150911132696, 0.027995333650139], [7.46542771137786, 1.70347746501912]], // Sao Tome and Principe (Sao Tomé-et-Principe)
  45: [[30.79560223563891, -27.3178130194279], [32.1359794171438, -25.719213671927008]], // Kingdom of Eswatini (Royaume d’Eswatini)
  46: [[55.093678, -4.172116], [55.993866, -4.88018]], // Seychelles - Note: Original had different coord order, adjusted to SW, NE
  47: [[13.475155474334223, 7.43853253283703], [24.0003830151035, 23.451588406824072]], // Chad (Tchad)
  48: [[-0.148311878875006, 6.10365306702988], [1.79632392295911, 11.141009656630501]], // Togo
  49: [[7.52585996610344, 30.2413525296127], [11.5964283339481, 37.349728455171743]], // Tunisia (Tunisie)
  50: [[29.328905446936076, -11.7441908397112], [40.4419197699163, -0.988272329386561]], // Tanzania (Tanzanie)
  51: [[29.5760895635851, -1.48264056268463], [35.0364719362645, 4.213930495248093]], // Uganda (Ouganda)
  52: [[16.458028493020869, -46.9784114781806], [38.0028518078575, -22.126605626189018]], // South Africa (Afrique du Sud)
  53: [[22.000791365266281, -18.0779855031847], [33.6850993233638, -8.222967862143477]], // Zambia (Zambie)
  54: [[25.23634621629985, -22.4177288504699], [33.0588711492188, -15.611514198538828]], // Zimbabwe
  // Region IDs 57-61 are ignored as they are not countries
};

// Helper to create a reverse mapping from ISO3 to the numeric ID (1-56)
// This is needed if bBoxByIdRaw keys (1-56) are significant and stable.
// However, it's better to map bBoxByIdRaw directly to ISOs if possible.

// Direct mapping from ISO3 to BoundingBox
export const countryBoundingBoxes = {};

// To populate countryBoundingBoxes, we need a reliable link from numeric ID to ISO3.
// The comments in bBoxByIdRaw are helpful but let's try to build this link systematically.
// This is a bit complex because countryNameToISO3 has multiple names for the same ISO,
// and bBoxByIdRaw is ordered numerically.

// Create a temporary mapping from a "primary" name (e.g., French name) to ID for those countries listed 1-56.
// This relies on the order of comments in bBoxByIdRaw matching the order of some primary names.
// This is fragile. A direct ISO3: BBox mapping provided by user would be best.
// For now, I will manually create this mapping based on the comments in bBoxByIdRaw.

const idToISO = {
  1: "AGO", 2: "BDI", 3: "BEN", 4: "BFA", 5: "BWA", 6: "CAF", 7: "CIV", 8: "CMR", 9: "COD", 10: "COG",
  11: "COM", 12: "CPV", 13: "DJI", 14: "DZA", 15: "EGY", 16: "ERI", 17: "ETH", 18: "GAB", 19: "GHA",
  20: "GIN", 21: "GMB", 22: "GNB", 23: "GNQ", 24: "KEN", 25: "LBR", 26: "LBY", 27: "LSO", 28: "MAR",
  29: "MDG", 30: "MLI", 31: "MOZ", 32: "MRT", 33: "MUS", 34: "MWI", 35: "NAM", 36: "NER", 37: "NGA",
  38: "RWA", 39: "SDN", 40: "SEN", 41: "SLE", 42: "SOM", 43: "SSD", 44: "STP", 45: "SWZ", 46: "SYC",
  47: "TCD", 48: "TGO", 49: "TUN", 50: "TZA", 51: "UGA", 52: "ZAF", 53: "ZMB", 54: "ZWE"
};

for (const id in idToISO) {
  const iso = idToISO[id];
  if (iso && bBoxByIdRaw[id]) {
    // Ensure coordinates are in [SW, NE] format for Mapbox: [[minLng, minLat], [maxLng, maxLat]]
    // Current format seems to be [[lng, lat], [lng, lat]]. Let's assume it's [SW_corner, NE_corner]
    // And Mapbox fitBounds expects [[minLng, minLat], [maxLng, maxLat]] or [minLng, minLat, maxLng, maxLat]
    // The provided format [[lng1, lat1], [lng2, lat2]] should work if it represents SW and NE corners.
    countryBoundingBoxes[iso] = bBoxByIdRaw[id];
  }
}

// Note: The regions (57-61) are not included in countryBoundingBoxes.
// Some bounding boxes in the original bBoxById might have unusual coordinate ordering (e.g. Comoros, Madagascar, Mauritius, Seychelles).
// I've added comments where I noticed this. Mapbox fitBounds is generally flexible,
// but standard [[minLng, minLat], [maxLng, maxLat]] is safest.
// The current transformation assumes the provided coordinates are already valid for fitBounds.
// For Comoros (11), Madagascar (29), Mauritius (33), Seychelles (46),
// if they were [Lat, Lng], they would need swapping.
// However, the values look more like Lng, Lat.
// Example: Comoros [43.26, -11.36], [44.62, -12.40] -> minLng=43.26, minLat=-12.40, maxLng=44.62, maxLat=-11.36
// This requires ensuring the first pair is South-West and the second is North-East.
// For Comoros: lng1=43.26, lat1=-11.36; lng2=44.62, lat2=-12.40. Here lat1 > lat2, so it's not SW, NE.
// It should be: [[43.2656, -12.407687], [44.629177, -11.363295]] for COM (minLng, minLat, maxLng, maxLat)

const adjustBoundingBox = (bbox) => {
  const [coord1, coord2] = bbox;
  const minLng = Math.min(coord1[0], coord2[0]);
  const maxLng = Math.max(coord1[0], coord2[0]);
  const minLat = Math.min(coord1[1], coord2[1]);
  const maxLat = Math.max(coord1[1], coord2[1]);
  return [[minLng, minLat], [maxLng, maxLat]];
};

for (const iso in countryBoundingBoxes) {
  countryBoundingBoxes[iso] = adjustBoundingBox(countryBoundingBoxes[iso]);
}

// Final check on specific items:
// Comoros (COM, ID 11) was: [[43.2656, -11.363295], [44.629177, -12.407687]]
// Adjusted: [[43.2656, -12.407687], [44.629177, -11.363295]] - this is correct for Mapbox.

// Madagascar (MDG, ID 29) was: [[43.957916, -11.233853], [49.644682, -26.453862]]
// Adjusted: [[43.957916, -26.453862], [49.644682, -11.233853]]

// Mauritius (MUS, ID 33) was: [[57.310283, -19.802283], [57.962243, -20.549742]]
// Adjusted: [[57.310283, -20.549742], [57.962243, -19.802283]]

// Seychelles (SYC, ID 46) was: [[55.093678, -4.172116], [55.993866, -4.88018]]
// Adjusted: [[55.093678, -4.88018], [55.993866, -4.172116]]

console.log("Country Bounding Boxes Initialized:", countryBoundingBoxes);
// This console.log is for development/debugging, can be removed in production if large.
