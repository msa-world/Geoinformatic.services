
export interface ServiceSubItem {
    title: string;
    items?: string[];
}

export interface ServiceCategory {
    id: string;
    title: string;
    shortDescription?: string;
    description?: string;
    items?: string[];
    subCategories: ServiceSubItem[];
    imageUrl: string;
}

export const servicesData: ServiceCategory[] = [
    {
        id: "gis-services",
        title: "GIS Services",
        shortDescription: "End-to-end Geographic Information Systems implementing spatial databases, web portals, and advanced analysis.",
        subCategories: [
            {
                title: "Database & System Development",
                items: ["Enterprise GIS design", "Spatial databases (PostGIS, ArcGIS)", "Geodatabase modeling", "Data integration", "Metadata creation"]
            },
            {
                title: "Cadastral & LIS",
                items: ["Digital land settlement systems", "Parcel fabric & topology", "Land record digitization", "Valuation & taxation support"]
            },
            {
                title: "Mapping & Spatial Analysis",
                items: ["Thematic & analytical mapping", "Suitability analysis", "Network analysis", "Change detection", "2D/3D visualization"]
            },
            {
                title: "Web & Mobile GIS",
                items: ["Web-based portals & dashboards", "Mobile data collection apps", "Real-time visualization", "API development"]
            }
        ],
        imageUrl: "/gis_services_digital_1766823247007.png"
    },
    {
        id: "remote-sensing",
        title: "Remote Sensing & Earth Observation",
        shortDescription: "Advanced earth observation using satellite imagery and aerial data to monitor environmental changes.",
        subCategories: [
            {
                title: "Satellite Imagery",
                items: ["High-res optical/SAR procurement", "Multispectral/Hyperspectral analysis", "Image orthorectification"]
            },
            {
                title: "Image Processing",
                items: ["LULC mapping", "Change detection", "Crop classification", "EIA support", "Urban sprawl analysis"]
            },
            {
                title: "Photogrammetry",
                items: ["UAV/drone surveys", "Orthophoto & DSM/DTM", "3D point clouds", "Volumetric analysis"]
            },
            {
                title: "Climate Monitoring",
                items: ["Vegetation indices (NDVI)", "Disaster risk assessment", "Soil moisture studies", "Climate change mapping"]
            }
        ],
        imageUrl: "/remote_sensing_satellite_1766823264042.png"
    },
    {
        id: "full-stack-dev",
        title: "WebGIS & Full Stack Development",
        shortDescription: "End-to-end web solutions using cutting-edge technologies for scalable applications.",
        subCategories: [
            {
                title: "Frontend Development",
                items: ["Responsive Web Apps", "Creative UI/UX Implementation", "Modern Frameworks (React/Next.js)", "Interactive Dashboards"]
            },
            {
                title: "Backend & Cloud",
                items: ["API Architecture", "Database Management", "Serverless Solutions", "Secure Authentication"]
            }
        ],
        imageUrl: "/services-section/full-stack-dev.png"
    },
    {
        id: "ai-solutions",
        title: "AI & Automation",
        shortDescription: "Cutting-edge AI integration for automated geospatial analysis.",
        subCategories: [
            {
                title: "AI Integration",
                items: ["Automated Pattern Recognition", "Geospatial Automation", "Predictive Modeling"]
            }
        ],
        imageUrl: "/services-section/ai-automation.png"
    },
    {
        id: "ai-bots",
        title: "AI Bots & Assistants",
        shortDescription: "Intelligent conversational agents and custom bot solutions for business automation.",
        subCategories: [
            {
                title: "Conversational AI",
                items: ["Customer Support Bots", "Internal Knowledge Assistants", "WhatsApp/Telegram Bots", "Voice Agents"]
            },
            {
                title: "Automation & Integration",
                items: ["Workflow Automation", "API Integrations", "CRM Syncing", "24/7 Virtual availability"]
            }
        ],
        imageUrl: "/services-section/ai-bots.png"
    },
    {
        id: "drone-survey",
        title: "Drone Survey (UAV)",
        shortDescription: "High-resolution UAV mapping delivering orthophotos and 3D models.",
        subCategories: [
            {
                title: "Aerial Acquisition",
                items: ["High-res aerial surveys", "Vertical & Oblique imagery", "Terrain-following flights"]
            },
            {
                title: "Mapping Products",
                items: ["Orthomosaics", "DSM/DTM Generation", "Contour Generation", "3D Models"]
            },
            {
                title: "Specialized Applications",
                items: ["Cadastral Support", "Infrastructure Corridors", "Urban Base Mapping", "Crop Health Analysis"]
            }
        ],
        imageUrl: "/services-section/Topographical Surveying Services.jpg"
    },
    {
        id: "environmental-agriculture",
        title: "Environment & Agriculture",
        shortDescription: "Sustainable solutions for natural resource management, precision agriculture, and climate monitoring.",
        subCategories: [
            {
                title: "Agriculture & Food Security",
                items: ["Crop monitoring & acreage", "Precision agriculture", "Irrigation mapping", "Soil fertility analysis"]
            },
            {
                title: "Forestry & Wildlife",
                items: ["Forest inventory & biomass", "Wildlife habitat mapping", "Deforestation monitoring"]
            },
            {
                title: "Water Resources",
                items: ["Watershed analysis", "Groundwater mapping", "Flood modeling"]
            }
        ],
        imageUrl: "/environmental_agriculture_1766823309865.png"
    },
    {
        id: "data-entry",
        title: "Data Entry & Digitization",
        shortDescription: "Comprehensive data digitization services ensuring accuracy and integrity.",
        subCategories: [
            {
                title: "Document & Records",
                items: ["Registers, Forms, Invoices", "Legal Documents", "Survey Sheets", "Scanning & Indexing"]
            },
            {
                title: "Specialized Land Records",
                items: ["Ownership/Title Records", "Jamabandi/Khasra Entry", "Girdawari Data", "Parcel Attributes"]
            },
            {
                title: "GIS & Spatial Data",
                items: ["Attribute Population", "Coordinate Entry", "Map Indexing", "Metadata Entry"]
            },
            {
                title: "Processing & Cleaning",
                items: ["Double-Key Entry", "Data Cleaning/Standardization", "Validation & Verification"]
            }
        ],
        imageUrl: "/services-section/Georeferencing & Digitization Services.jpg"
    },
    // Remaining services preserved at the end
    {
        id: "land-surveying",
        title: "Land Surveying & Geodetic Services",
        shortDescription: "Precision measurement and mapping solutions including Topographic, Cadastral, and Engineering surveys.",
        subCategories: [
            {
                title: "Control & Reference Surveys",
                items: ["Horizontal/Vertical control networks", "GNSS static, rapid static, & RTK", "Geodetic benchmarks & pillars", "CORS integration", "Datum transformation"]
            },
            {
                title: "Cadastral & Boundary",
                items: ["Rural & Urban land parcel mapping", "Demarcation of property/revenue estate", "Subdivision (Tatima) & amalgamation", "Tri-junction/Boundary pillars", "Legal dispute support"]
            },
            {
                title: "Topographic & Engineering",
                items: ["Large-scale topographic surveys", "Contour generation & terrain profiling", "Route alignment (roads, canals, pipelines)", "Construction staking & as-built surveys", "Deformation monitoring"]
            },
            {
                title: "Hydrographic & Bathymetric",
                items: ["River, canal, & lake surveys", "Cross-section & longitudinal profiling", "Floodplain & river morphology", "Sedimentation & dredging surveys"]
            }
        ],
        imageUrl: "/land_surveying_1766823232824.png"
    },
    {
        id: "planning-infrastructure",
        title: "Planning & Infrastructure",
        shortDescription: "Strategic spatial support for urban planning, smart cities, and infrastructure development.",
        subCategories: [
            {
                title: "Urban & Regional Planning",
                items: ["Master planning support", "Smart city solutions", "Utility mapping", "Informal settlement mapping"]
            },
            {
                title: "Infrastructure & Utilities",
                items: ["Power/Water/Telecom mapping", "Corridor & ROW surveys", "Asset management systems"]
            },
            {
                title: "Transportation",
                items: ["Traffic GIS analysis", "Route optimization", "Airport/Railway planning"]
            }
        ],
        imageUrl: "/planning_infrastructure_1766823295347.png"
    },
    {
        id: "capacity-consultancy",
        title: "Advisory, Research & Training",
        shortDescription: "Expert consultancy, technical training, and institutional strengthening.",
        subCategories: [
            {
                title: "Capacity Building",
                items: ["GIS/RS Technical Training", "SOPs & Standards Development", "Institutional Strengthening", "Project Management"]
            },
            {
                title: "Consultancy & Research",
                items: ["Feasibility Studies", "Policy Support", "Third-Party Verification", "Technical Proposals"]
            }
        ],
        imageUrl: "/advisory_training_1766823325514.png"
    }
];
