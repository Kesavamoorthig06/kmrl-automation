/**
 * Enhanced KMRC Knowledge Base
 * Comprehensive information about KMRC operations, scheduling, and Kochi cultural events
 */

export const KMRC_ENHANCED_KNOWLEDGE = {
  // Updated Station Information with correct details
  stations: [
    {
      id: "ALU",
      name: "Aluva",
      malayalam: "ആലുവ",
      hindi: "आलुवा",
      code: "ALU",
      position: 1,
      type: "Terminal",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 4,
      facilities: [
        "Parking (500+ cars)",
        "KSRTC Bus Terminal",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 8500,
      specialFeatures: [
        "Interchange with KSRTC",
        "Commercial complex",
        "Solar panels",
        "Vertical gardens"
      ]
    },
    {
      id: "PUL",
      name: "Pulinchodu",
      malayalam: "പുളിഞ്ചോട്",
      hindi: "पुलिंचोड",
      code: "PUL",
      position: 2,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 3200
    },
    {
      id: "COM",
      name: "Companypady",
      malayalam: "കമ്പനിപാടി",
      hindi: "कंपनीपाडी",
      code: "COM",
      position: 3,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 2800
    },
    {
      id: "AMB",
      name: "Ambattukavu",
      malayalam: "അമ്പാട്ടുകാവ്",
      hindi: "अम्बाट्टुकाव",
      code: "AMB",
      position: 4,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 2600
    },
    {
      id: "MUT",
      name: "Muttom",
      malayalam: "മുട്ടം",
      hindi: "मुट्टम",
      code: "MUT",
      position: 5,
      type: "Depot",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 6,
      facilities: [
        "Maintenance depot",
        "Solar panels (5.389 MWp)",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3000,
      specialFeatures: [
        "Maintenance depot",
        "Solar energy facility",
        "Train stabling"
      ]
    },
    {
      id: "KAL",
      name: "Kalamassery",
      malayalam: "കാലമാശ്ശേരി",
      hindi: "कालमाशेरी",
      code: "KAL",
      position: 6,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3500
    },
    {
      id: "COC",
      name: "Cochin University",
      malayalam: "കൊച്ചി സർവകലാശാല",
      hindi: "कोच्चि विश्वविद्यालय",
      code: "COC",
      position: 7,
      type: "Educational",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "University shuttle",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi",
        "Student facilities"
      ],
      dailyRidership: 4500,
      specialFeatures: [
        "University connectivity",
        "Student discounts",
        "Educational facilities"
      ]
    },
    {
      id: "PAT",
      name: "Pathadipalam",
      malayalam: "പാതാടിപ്പാലം",
      hindi: "पाथाडिपालम",
      code: "PAT",
      position: 8,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3200
    },
    {
      id: "EDP",
      name: "Edappally",
      malayalam: "എടപ്പള്ളി",
      hindi: "एडप्पल्ली",
      code: "EDP",
      position: 9,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 3,
      facilities: [
        "Lulu Mall access",
        "Bus terminal",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 6800,
      specialFeatures: [
        "Mall connectivity",
        "Commercial hub",
        "Parking facility"
      ]
    },
    {
      id: "CHA",
      name: "Changampuzha Park",
      malayalam: "ചങ്ങമ്പുഴ പാർക്ക്",
      hindi: "चंगम्पुज़ा पार्क",
      code: "CHA",
      position: 10,
      type: "Recreational",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Park access",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 2800,
      specialFeatures: [
        "Park connectivity",
        "Recreational area"
      ]
    },
    {
      id: "PAL",
      name: "Palarivattom",
      malayalam: "പാലാരിവട്ടം",
      hindi: "पालारिवट्टम",
      code: "PAL",
      position: 11,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 4000
    },
    {
      id: "JLN",
      name: "JLN Stadium",
      malayalam: "ജെ.എൽ.എൻ. സ്റ്റേഡിയം",
      hindi: "जे.एल.एन. स्टेडियम",
      code: "JLN",
      position: 12,
      type: "Sports",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 3,
      facilities: [
        "Stadium access",
        "Auto-rickshaw stand",
        "Bus stop",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 4200,
      specialFeatures: [
        "Sports venue connectivity",
        "Event access"
      ]
    },
    {
      id: "KAL",
      name: "Kaloor",
      malayalam: "കാലൂർ",
      hindi: "कालूर",
      code: "KAL",
      position: 13,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 3,
      facilities: [
        "Bus stand",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 5200
    },
    {
      id: "TOW",
      name: "Town Hall",
      malayalam: "ടൗൺ ഹാൾ",
      hindi: "टाउन हॉल",
      code: "TOW",
      position: 14,
      type: "Administrative",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Government offices access",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3800,
      specialFeatures: [
        "Government connectivity",
        "Administrative hub"
      ]
    },
    {
      id: "MGR",
      name: "MG Road",
      malayalam: "എം.ജി. റോഡ്",
      hindi: "एम.जी. रोड",
      code: "MGR",
      position: 15,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 4,
      facilities: [
        "Commercial complex",
        "Marine Drive access",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 7500,
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
      position: 16,
      type: "Educational",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "College shuttle",
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi",
        "Student facilities"
      ],
      dailyRidership: 3800,
      specialFeatures: [
        "Educational institution",
        "Student facilities"
      ]
    },
    {
      id: "ERS",
      name: "Ernakulam South",
      malayalam: "എറണാകുളം സൗത്ത്",
      hindi: "एरणाकुलम साउथ",
      code: "ERS",
      position: 17,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 3,
      facilities: [
        "Railway station access",
        "Auto-rickshaw stand",
        "Bus terminal",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 6200,
      specialFeatures: [
        "Railway connectivity",
        "Multi-modal transport"
      ]
    },
    {
      id: "KAD",
      name: "Kadavanthra",
      malayalam: "കടവന്ത്ര",
      hindi: "कडवंत्र",
      code: "KAD",
      position: 18,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3500
    },
    {
      id: "ELA",
      name: "Elamkulam",
      malayalam: "എലംകുളം",
      hindi: "एलम्कुलम",
      code: "ELA",
      position: 19,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3200
    },
    {
      id: "VYT",
      name: "Vyttila",
      malayalam: "വൈറ്റില",
      hindi: "वैट्टिला",
      code: "VYT",
      position: 20,
      type: "Commercial",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 3,
      facilities: [
        "Bus terminal",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 5800,
      specialFeatures: [
        "Bus terminal connectivity",
        "Commercial hub"
      ]
    },
    {
      id: "THA",
      name: "Thaikoodam",
      malayalam: "തൈക്കൂടം",
      hindi: "थैकूडम",
      code: "THA",
      position: 21,
      type: "Standard",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 3000
    },
    {
      id: "PET",
      name: "Petta",
      malayalam: "പെറ്റ",
      hindi: "पेट्टा",
      code: "PET",
      position: 22,
      type: "Terminal",
      status: "Operational",
      openingDate: "2017-06-17",
      runningBays: 4,
      facilities: [
        "Parking (300+ cars)",
        "Bus terminal",
        "Auto-rickshaw stand",
        "Taxi stand",
        "ATM",
        "Food court",
        "Restrooms",
        "Wheelchair accessible",
        "Elevator",
        "Escalator",
        "Free Wi-Fi",
        "Public Bicycle Sharing"
      ],
      dailyRidership: 7200,
      specialFeatures: [
        "Terminal station",
        "Parking facility",
        "Commercial complex"
      ]
    },
    {
      id: "VAD",
      name: "Vadakkekotta",
      malayalam: "വടക്കേക്കോട്ട",
      hindi: "वडक्केकोट्टा",
      code: "VAD",
      position: 23,
      type: "Standard",
      status: "Operational",
      openingDate: "2024-01-01",
      runningBays: 2,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 2500
    },
    {
      id: "SNJ",
      name: "SN Junction",
      malayalam: "എസ്.എൻ. ജംഗ്ഷൻ",
      hindi: "एस.एन. जंक्शन",
      code: "SNJ",
      position: 24,
      type: "Terminal",
      status: "Operational",
      openingDate: "2024-01-01",
      runningBays: 3,
      facilities: [
        "Auto-rickshaw stand",
        "Bus stop",
        "Taxi stand",
        "ATM",
        "Restrooms",
        "Wheelchair accessible",
        "Free Wi-Fi"
      ],
      dailyRidership: 4000,
      specialFeatures: [
        "Extension terminal",
        "Future connectivity"
      ]
    }
  ],

  // Enhanced Operational Information
  operations: {
    // Updated specifications
    trainSpecs: {
      manufacturer: "Alstom Metropolis",
      length: "66.55 meters",
      width: "2.9 meters",
      height: "3.8 meters",
      coaches: 3,
      capacity: 975,
      seating: 138,
      maxSpeed: "90 km/h",
      operatingSpeed: "35 km/h",
      powerSupply: "110 KV AC",
      traction: "Third Rail Traction",
      signaling: "Communication-Based Train Control (CBTC)"
    },

    // Enhanced scheduling
    scheduling: {
      operatingHours: {
        firstTrain: "05:30",
        lastTrain: "22:30",
        maintenance: "22:30 - 05:30"
      },
      frequency: {
        peak: "5-7 minutes",
        offPeak: "8-12 minutes",
        night: "15-20 minutes"
      },
      peakHours: [
        "07:00-09:00",
        "17:00-19:00"
      ],
      routeTime: {
        "Aluva to Petta": "25 minutes",
        "Aluva to SN Junction": "28 minutes",
        "Petta to SN Junction": "3 minutes"
      }
    },

    // Enhanced fare structure
    fare: {
      range: "₹10 - ₹60",
      student: "50% discount",
      senior: "50% discount",
      children: "Free (under 5 years)",
      monthly: "Available with discounts",
      digital: "Additional discounts for digital payments"
    },

    // Digital services
    digitalServices: {
      mobileApp: "Kochi1 Axis Bank App",
      whatsapp: "9188957488",
      qrTickets: "Available via WhatsApp and App",
      smartCards: "Kochi1 metro cards",
      ondc: "Integration with ONDC platform",
      realTimeUpdates: "Available via app and website"
    }
  },

  // Kochi Cultural Events and Festivals
  culturalEvents: {
    majorFestivals: [
      {
        name: "Onam",
        malayalam: "ഓണം",
        hindi: "ओणम",
        type: "Harvest Festival",
        month: "August-September",
        duration: "10 days",
        description: "Kerala's biggest festival celebrating the homecoming of King Mahabali. Features grand feasts (Onasadya), cultural programs, and traditional games.",
        metroImpact: "Increased ridership during Atham to Thiruvonam days. Special services may be announced.",
        specialServices: "Extended hours during Thiruvonam day, additional trains during peak festival days"
      },
      {
        name: "Vishu",
        malayalam: "വിഷു",
        hindi: "विषु",
        type: "New Year Festival",
        month: "April",
        duration: "1 day",
        description: "Kerala's New Year celebration with Vishukkani (auspicious sight), fireworks, and traditional rituals.",
        metroImpact: "Moderate increase in ridership, especially in the morning for temple visits.",
        specialServices: "Normal operations with crowd management during peak hours"
      },
      {
        name: "Christmas",
        malayalam: "ക്രിസ്മസ്",
        hindi: "क्रिसमस",
        type: "Religious Festival",
        month: "December",
        duration: "1 day",
        description: "Celebrated with great enthusiasm in Kochi, especially in Fort Kochi with Christmas markets and decorations.",
        metroImpact: "High ridership to Fort Kochi area, increased tourism.",
        specialServices: "Extended services to accommodate tourists and locals visiting Fort Kochi"
      },
      {
        name: "New Year",
        malayalam: "പുതുവത്സരം",
        hindi: "नया साल",
        type: "Celebration",
        month: "December 31 - January 1",
        duration: "2 days",
        description: "New Year celebrations with parties, fireworks, and gatherings across the city.",
        metroImpact: "Very high ridership, especially on December 31st night.",
        specialServices: "Extended late-night services, additional security, crowd management"
      },
      {
        name: "Thrissur Pooram",
        malayalam: "തൃശൂർ പൂരം",
        hindi: "त्रिशूर पूरम",
        type: "Temple Festival",
        month: "April-May",
        duration: "36 hours",
        description: "One of Kerala's most spectacular temple festivals with grand processions and elephant parades.",
        metroImpact: "High ridership from Kochi to Thrissur, increased intercity travel.",
        specialServices: "Special arrangements for intercity travelers, coordination with KSRTC"
      }
    ],

    culturalEvents: [
      {
        name: "Kochi-Muziris Biennale",
        malayalam: "കൊച്ചി-മുഴിരിസ് ബിനാലെ",
        type: "Art Festival",
        month: "December-March",
        duration: "3 months",
        description: "International contemporary art exhibition held every two years in Kochi.",
        metroImpact: "Significant increase in international tourists and art enthusiasts.",
        specialServices: "Tourist-friendly announcements, art venue connectivity information"
      },
      {
        name: "Kochi Carnival",
        malayalam: "കൊച്ചി കാർണിവൽ",
        type: "Cultural Festival",
        month: "December",
        duration: "10 days",
        description: "Annual carnival featuring parades, cultural shows, and street performances.",
        metroImpact: "High ridership to Fort Kochi and Marine Drive areas.",
        specialServices: "Extended services to Fort Kochi, special announcements for carnival events"
      },
      {
        name: "Kerala Tourism Week",
        malayalam: "കേരള ടൂറിസം വീക്ക്",
        type: "Tourism Festival",
        month: "October",
        duration: "7 days",
        description: "Week-long celebration promoting Kerala tourism with cultural programs and exhibitions.",
        metroImpact: "Increased tourist footfall, especially to heritage sites.",
        specialServices: "Tourist information services, heritage site connectivity guidance"
      }
    ],

    seasonalEvents: [
      {
        name: "Monsoon Season",
        malayalam: "മഴക്കാലം",
        type: "Seasonal",
        month: "June-September",
        description: "Kerala's famous monsoon season with heavy rains and lush greenery.",
        metroImpact: "Reduced ridership due to weather, but metro provides reliable service.",
        specialServices: "Weather updates, rain protection facilities at stations"
      },
      {
        name: "Tourist Season",
        malayalam: "ടൂറിസ്റ്റ് സീസൺ",
        type: "Tourism",
        month: "October-March",
        description: "Peak tourist season with pleasant weather and various festivals.",
        metroImpact: "High ridership from tourists, especially to heritage and cultural sites.",
        specialServices: "Multi-language announcements, tourist information, heritage site guidance"
      }
    ]
  },

  // Enhanced deployment strategies
  deploymentStrategies: {
    peakHourManagement: {
      morning: {
        time: "07:00-09:00",
        strategy: "Maximum train deployment, 5-7 minute frequency",
        focus: "Office commuters, students",
        stations: ["Aluva", "Edappally", "MG Road", "Ernakulam South"]
      },
      evening: {
        time: "17:00-19:00",
        strategy: "High frequency service, crowd management",
        focus: "Return commuters, shoppers",
        stations: ["MG Road", "Edappally", "Vyttila", "Petta"]
      }
    },

    festivalManagement: {
      onam: {
        strategy: "Extended services, additional trains",
        duration: "10 days",
        specialStations: ["All stations"],
        crowdManagement: "Enhanced security, crowd control measures"
      },
      newYear: {
        strategy: "Late night services until 01:00",
        duration: "December 31 - January 1",
        specialStations: ["MG Road", "Ernakulam South", "Fort Kochi area"],
        crowdManagement: "Maximum security, alcohol restrictions"
      },
      christmas: {
        strategy: "Fort Kochi connectivity, tourist services",
        duration: "December 20-30",
        specialStations: ["Ernakulam South", "Fort Kochi area"],
        crowdManagement: "Tourist information, cultural event guidance"
      }
    },

    maintenanceWindows: {
      daily: {
        time: "22:30-05:30",
        activities: ["Cleaning", "Minor repairs", "System checks"],
        stations: ["All stations"]
      },
      weekly: {
        day: "Sunday",
        time: "Extended maintenance window",
        activities: ["Major cleaning", "Equipment maintenance", "System updates"],
        stations: ["Depot stations", "High-traffic stations"]
      },
      monthly: {
        schedule: "First Sunday of each month",
        activities: ["Comprehensive maintenance", "Safety inspections", "System upgrades"],
        stations: ["All stations", "Depot facilities"]
      }
    }
  },

  // Real-time data and APIs
  realTimeData: {
    available: true,
    sources: [
      "KMRL Official API",
      "Kochi1 Mobile App",
      "WhatsApp Integration",
      "Website Real-time Updates"
    ],
    dataTypes: [
      "Train positions",
      "Arrival/departure times",
      "Crowd density",
      "Service alerts",
      "Maintenance updates"
    ]
  },

  // Contact information
  contacts: {
    helpline: "1800-425-1155",
    controlRoom: "0484-285-8000",
    security: "0484-285-8001",
    medical: "108",
    fire: "101",
    whatsapp: "9188957488",
    email: "contact@kmrl.co.in",
    office: "JLN Metro Station, 4th Floor, Kaloor, Ernakulam, 682017"
  }
};

export default KMRC_ENHANCED_KNOWLEDGE;
