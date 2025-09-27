/**
 * KMRC (Kochi Metro Rail Corporation) Station Information
 * Comprehensive data about all metro stations, running bays, and operational details
 */

export const KMRC_STATIONS = {
  // Phase 1 Stations (Aluva to Petta)
  stations: [
    {
      id: "ALU",
      name: "Aluva",
      malayalam: "ആലുവ",
      hindi: "आलुवा",
      code: "ALU",
      line: "Phase 1",
      position: 1,
      type: "Terminal",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.1089, lng: 76.3505 },
      platforms: 2,
      runningBays: 4,
      facilities: [
        "Parking (500+ cars)",
        "Auto-rickshaw stand",
        "Bus terminal",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator"
      ],
      connections: [
        "KSRTC Bus Terminal",
        "Private Bus Stand",
        "Auto-rickshaw",
        "Taxi",
        "Parking"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["07:00-09:00", "17:00-19:00"],
      passengerCapacity: 1200,
      averageDailyRidership: 8500,
      specialFeatures: [
        "Interchange with KSRTC",
        "Parking facility",
        "Commercial complex"
      ]
    },
    {
      id: "PUL",
      name: "Pulinchodu",
      malayalam: "പുളിഞ്ചോട്",
      hindi: "पुलिंचोड",
      code: "PUL",
      line: "Phase 1",
      position: 2,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0989, lng: 76.3405 },
      platforms: 2,
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible"
      ],
      connections: [
        "Local buses",
        "Auto-rickshaw"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["07:00-09:00", "17:00-19:00"],
      passengerCapacity: 800,
      averageDailyRidership: 3200
    },
    {
      id: "COC",
      name: "Cochin University",
      malayalam: "കൊച്ചി സർവകലാശാല",
      hindi: "कोच्चि विश्वविद्यालय",
      code: "COC",
      line: "Phase 1",
      position: 3,
      type: "Educational",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0889, lng: 76.3305 },
      platforms: 2,
      runningBays: 2,
      facilities: [
        "University shuttle",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Student facilities"
      ],
      connections: [
        "Cochin University",
        "Local buses",
        "Auto-rickshaw"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["08:00-10:00", "16:00-18:00"],
      passengerCapacity: 1000,
      averageDailyRidership: 4500,
      specialFeatures: [
        "University connectivity",
        "Student discounts",
        "Educational facilities"
      ]
    },
    {
      id: "EDP",
      name: "Edappally",
      malayalam: "എടപ്പള്ളി",
      hindi: "एडप्पल्ली",
      code: "EDP",
      line: "Phase 1",
      position: 4,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0789, lng: 76.3205 },
      platforms: 2,
      runningBays: 3,
      facilities: [
        "Shopping mall access",
        "Auto-rickshaw stand",
        "Bus terminal",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator"
      ],
      connections: [
        "Lulu Mall",
        "Edappally Bus Terminal",
        "Auto-rickshaw",
        "Taxi"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["10:00-12:00", "18:00-20:00"],
      passengerCapacity: 1200,
      averageDailyRidership: 6800,
      specialFeatures: [
        "Mall connectivity",
        "Commercial hub",
        "Parking facility"
      ]
    },
    {
      id: "KAL",
      name: "Kaloor",
      malayalam: "കാലൂർ",
      hindi: "कालूर",
      code: "KAL",
      line: "Phase 1",
      position: 5,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0689, lng: 76.3105 },
      platforms: 2,
      runningBays: 3,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "Taxi stand",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator"
      ],
      connections: [
        "Kaloor Bus Stand",
        "Auto-rickshaw",
        "Taxi"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["07:00-09:00", "17:00-19:00"],
      passengerCapacity: 1000,
      averageDailyRidership: 5200
    },
    {
      id: "MGR",
      name: "MG Road",
      malayalam: "എം.ജി. റോഡ്",
      hindi: "एम.जी. रोड",
      code: "MGR",
      line: "Phase 1",
      position: 6,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0589, lng: 76.3005 },
      platforms: 2,
      runningBays: 4,
      facilities: [
        "Commercial complex",
        "Auto-rickshaw stand",
        "Bus stop",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator"
      ],
      connections: [
        "MG Road",
        "Marine Drive",
        "Auto-rickshaw",
        "Taxi"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["09:00-11:00", "19:00-21:00"],
      passengerCapacity: 1200,
      averageDailyRidership: 7500,
      specialFeatures: [
        "Commercial hub",
        "Tourist attraction",
        "Marine Drive access"
      ]
    },
    {
      id: "MHC",
      name: "Maharaja's College",
      malayalam: "മഹാരാജാസ് കോളേജ്",
      hindi: "महाराजा कॉलेज",
      code: "MHC",
      line: "Phase 1",
      position: 7,
      type: "Educational",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0489, lng: 76.2905 },
      platforms: 2,
      runningBays: 2,
      facilities: [
        "College shuttle",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible"
      ],
      connections: [
        "Maharaja's College",
        "Local buses",
        "Auto-rickshaw"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["08:00-10:00", "16:00-18:00"],
      passengerCapacity: 800,
      averageDailyRidership: 3800,
      specialFeatures: [
        "Educational institution",
        "Student facilities"
      ]
    },
    {
      id: "PET",
      name: "Petta",
      malayalam: "പെറ്റ",
      hindi: "पेट्टा",
      code: "PET",
      line: "Phase 1",
      position: 8,
      type: "Terminal",
      status: "Operational",
      openingDate: "2017-06-17",
      coordinates: { lat: 10.0389, lng: 76.2805 },
      platforms: 2,
      runningBays: 4,
      facilities: [
        "Parking (300+ cars)",
        "Auto-rickshaw stand",
        "Bus terminal",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator"
      ],
      connections: [
        "Petta Bus Terminal",
        "Auto-rickshaw",
        "Taxi",
        "Parking"
      ],
      operatingHours: "05:30 - 22:30",
      peakHours: ["07:00-09:00", "17:00-19:00"],
      passengerCapacity: 1200,
      averageDailyRidership: 7200,
      specialFeatures: [
        "Terminal station",
        "Parking facility",
        "Commercial complex"
      ]
    }
  ],

  // Running Bay Information
  runningBays: {
    total: 24,
    distribution: {
      "Aluva": 4,
      "Pulinchodu": 2,
      "Cochin University": 2,
      "Edappally": 3,
      "Kaloor": 3,
      "MG Road": 4,
      "Maharaja's College": 2,
      "Petta": 4
    },
    capacity: {
      "Aluva": "4 trains",
      "Pulinchodu": "2 trains",
      "Cochin University": "2 trains",
      "Edappally": "3 trains",
      "Kaloor": "3 trains",
      "MG Road": "4 trains",
      "Maharaja's College": "2 trains",
      "Petta": "4 trains"
    },
    maintenance: {
      "Aluva": "Full maintenance facility",
      "Petta": "Full maintenance facility",
      "Edappally": "Minor maintenance",
      "MG Road": "Minor maintenance"
    }
  },

  // Train Information
  trains: {
    totalFleet: 25,
    operational: 22,
    maintenance: 2,
    reserve: 1,
    specifications: {
      length: "65 meters",
      width: "2.9 meters",
      height: "3.8 meters",
      capacity: "975 passengers",
      maxSpeed: "80 km/h",
      operatingSpeed: "35 km/h",
      power: "750V DC third rail",
      manufacturer: "Alstom"
    }
  },

  // Operational Information
  operations: {
    frequency: {
      peak: "5-7 minutes",
      offPeak: "8-12 minutes",
      night: "15-20 minutes"
    },
    operatingHours: {
      firstTrain: "05:30",
      lastTrain: "22:30",
      maintenance: "22:30 - 05:30"
    },
    routes: {
      "Aluva to Petta": "25 minutes",
      "Petta to Aluva": "25 minutes"
    },
    fare: {
      minimum: "₹10",
      maximum: "₹60",
      student: "50% discount",
      senior: "50% discount"
    }
  },

  // Emergency Information
  emergency: {
    helpline: "1800-425-1155",
    controlRoom: "0484-285-8000",
    security: "0484-285-8001",
    medical: "108",
    fire: "101"
  },

  // Future Expansion
  futureExpansions: {
    "Phase 2": {
      status: "Under Construction",
      stations: ["Kakkanad", "Infopark", "Technopark"],
      expectedCompletion: "2025"
    },
    "Phase 3": {
      status: "Planning",
      stations: ["Airport", "Kochi Port", "Fort Kochi"],
      expectedCompletion: "2027"
    }
  }
};

export default KMRC_STATIONS;
